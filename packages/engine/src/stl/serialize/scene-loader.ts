import type {Scene} from "../../model/scene.js";
import {type AspectConstructor, Blueprint, GameObject} from "../../model/index.js";
import type {ResourceLoader} from "../resource-loader.js";

export type SerializationConfig = {
    alias: string,
    blueprint: Blueprint,
    targetAspectTypes?: AspectConstructor[],
}

export class SceneLoader {
    resourceLoader: ResourceLoader;
    config: Map<string, SerializationConfig>;
    aspectNames: Map<string, AspectConstructor>;
    gameObjectAlias: Map<GameObject, string>
    constructor(resourceLoader: ResourceLoader) {
        this.resourceLoader = resourceLoader;
        this.config = new Map();
        this.aspectNames = new Map();
        this.gameObjectAlias = new Map();
    }
    register(...args: SerializationConfig[]) {
        for (const sc of args) {
            this.config.set(sc.alias, sc);
            for (const aspect of sc.targetAspectTypes ?? []) {
                if (!this.aspectNames.has(aspect.name)) {
                    this.aspectNames.set(aspect.name, aspect);
                }
            }
        }
    }
    async load(target: Scene, path: string) {
        const data = await this.resourceLoader.read(path);
        const parsedData = JSON.parse(data);
        for (const obj of parsedData) {
            const gameObject = this.buildGameObject(target, obj);
        }
    }
    async save(target: Scene, path: string) {
        const data = [];
        if (!target.root) return;
        for (const gameObject of target.getChildren(target.root)) {
            const serialized = this.serializeGameObject(gameObject);
            data.push(serialized);
        }
        await this.resourceLoader.write(path, JSON.stringify(data));
    }
    buildGameObject(scene: Scene, obj: { alias: string, aspects: object }) {
        const alias = obj.alias;
        const config = this.config.get(alias);
        if (!config) {
            console.error(`Object with alias ${alias} was not registered`);
            return null;
        }
        const gameObject = scene.build(config.blueprint);
        this.gameObjectAlias.set(gameObject, alias);

        if (!config.targetAspectTypes || config.targetAspectTypes.length == 0) return gameObject;

        if (!obj.aspects) {
            console.error(`Object with alias ${alias} configures aspect but data does not provide aspects. Still creating object`);
            return gameObject;
        }
        for (const [aspectName, aspectData] of Object.entries(obj.aspects)) {
            const aspectType = this.aspectNames.get(aspectName);
            if (!aspectType) {
                console.error(`Aspect with name ${aspectName} was not registered (ignoring)`);
                continue;
            }
            const aspect = aspectType.from(aspectData);
            gameObject.add(aspect);
        }

        return gameObject;
    }
    serializeGameObject(gameObject: GameObject) {
        const alias = this.gameObjectAlias.get(gameObject);
        if (!alias) return;

        const config = this.config.get(alias);
        if (!config) {
            console.error(`Object with alias ${alias} was not registered. Likely using different sceneloader to save.`);
            return;
        }

        const aspects = new Map();
        for (const aspectType of config.targetAspectTypes ?? []) {
            const aspect = gameObject.get(aspectType);
            if (!aspect) {
                console.error(`Object doesn't have aspect ${aspectType.name} although it is target in config.`);
                continue;
            }
            const name = aspectType.name;
            aspects.set(name, aspect);
        }

        return {
            alias,
            aspects: Object.fromEntries(aspects)
        };
    }
}