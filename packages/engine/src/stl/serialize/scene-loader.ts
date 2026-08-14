import type {Scene} from "../../model/scene.js";
import {type ComponentConstructor, Blueprint, GameObject} from "../../model/index.js";
import type {ResourceLoader} from "../resource-loader.js";

export type SerializationConfig = {
    alias: string,
    blueprint: Blueprint,
    targetComponentTypes?: ComponentConstructor[],
}

export class SceneLoader {
    resourceLoader: ResourceLoader;
    config: Map<string, SerializationConfig>;
    componentNames: Map<string, ComponentConstructor>;
    gameObjectAlias: Map<GameObject, string>
    constructor(resourceLoader: ResourceLoader) {
        this.resourceLoader = resourceLoader;
        this.config = new Map();
        this.componentNames = new Map();
        this.gameObjectAlias = new Map();
    }
    register(...args: SerializationConfig[]) {
        for (const sc of args) {
            this.config.set(sc.alias, sc);
            for (const component of sc.targetComponentTypes ?? []) {
                if (!this.componentNames.has(component.name)) {
                    this.componentNames.set(component.name, component);
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
    buildGameObject(scene: Scene, obj: { alias: string, components: object }) {
        const alias = obj.alias;
        const config = this.config.get(alias);
        if (!config) {
            console.error(`Object with alias ${alias} was not registered`);
            return null;
        }
        const gameObject = scene.build(config.blueprint);
        this.gameObjectAlias.set(gameObject, alias);

        if (!config.targetComponentTypes || config.targetComponentTypes.length == 0) return gameObject;

        if (!obj.components) {
            console.error(`Object with alias ${alias} configures component but data does not provide components. Still creating object`);
            return gameObject;
        }
        for (const [componentName, componentData] of Object.entries(obj.components)) {
            const componentType = this.componentNames.get(componentName);
            if (!componentType) {
                console.error(`Component with name ${componentName} was not registered (ignoring)`);
                continue;
            }
            console.log(componentData);
            const component = componentType.from(componentData);
            gameObject.add(component);
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

        const components = new Map();
        for (const componentType of config.targetComponentTypes ?? []) {
            const component = gameObject.get(componentType);
            if (!component) {
                console.error(`Object doesn't have component ${componentType.name} although it is target in config.`);
                continue;
            }
            const name = componentType.name;
            components.set(name, component);
        }

        return {
            alias,
            components: Object.fromEntries(components)
        };
    }
}