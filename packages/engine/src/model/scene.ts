import type {GameObject} from "./game-object.js";
import type {Registry} from "./registry.js";
import type {ComponentConstructor} from "./component.js";
import type {Blueprint} from "./blueprint.js";

const EMPTY_SET: Set<GameObject> = new Set();

export class Scene {
    #initialized: boolean = false;
    #registry: Registry;
    #root: GameObject | null = null;
    #children: Map<GameObject, Set<GameObject>> | null = null;
    #gameObjects: Set<GameObject> | null = null;
    #initCallback: (scene: Scene) => void | Promise<void> = () => {};
    constructor(registry: Registry) {
        this.#registry = registry;
    }
    assertInitialized(): asserts this is this & {
        get #root(): string;
        get #children(): any[];
        get #gameObjects(): any[];
    } {
        if (this.#initialized) {
            if (!(this.#root && this.#children && this.#gameObjects)) {
                throw new Error("Scene not initialized");
            }
        }
    }
    destroyGameObject(gameObject: GameObject) {
        this.assertInitialized();
        this.#gameObjects.delete(gameObject);
        this.#registry.destroyGameObject(gameObject);
        const children = this.#children.get(gameObject);
        if (children) {
            for (const child of children) {
                this.destroyGameObject(child);
            }
        }
    }
    createGameObject(parent: GameObject = this.#root!) {
        this.assertInitialized();
        const gameObject = this.#registry.createGameObject();
        this.#gameObjects.add(gameObject);
        const children = this.#children.get(parent);
        if (!children) {
            this.#children.set(parent, new Set([gameObject]));
        } else {
            children.add(gameObject);
        }
        return gameObject;
    }
    getChildren(parent: GameObject) {
        this.assertInitialized();
        return this.#children!.get(parent) ?? EMPTY_SET;
    }
    query(typeArray: ComponentConstructor[]) {
        this.assertInitialized();
        return this.#registry.query(typeArray, this.#gameObjects);
    }
    build(blueprint: Blueprint, parent: GameObject = this.#root!) {
        this.assertInitialized();
        const gameObject = this.createGameObject(parent);
        blueprint.build(gameObject);
        for (const childBlueprint of blueprint.children()) {
            console.log(childBlueprint, gameObject)
            this.build(childBlueprint, gameObject);
        }
        return gameObject;
    }
    destroy() {
        this.assertInitialized();

        for (const gameObject of this.#gameObjects) {
            this.#registry.destroyGameObject(gameObject);
        }
        this.#gameObjects.clear();
        this.#initialized = false;
    }
    onInit(callback: (scene: Scene) => void) {
        this.#initCallback = callback;
    }
    async init() {
        if (this.#initialized) return;
        this.#root = this.#registry.createGameObject();
        this.#gameObjects = new Set();
        this.#children = new Map();
        await this.#initCallback(this);
        this.#initialized = true;
    }
    get root() {
        return this.#root;
    }
}

export type ReadonlyScene = {
    query(typeArray: ComponentConstructor[]): GameObject[];
    getChildren(parent: GameObject): Set<GameObject>;
}