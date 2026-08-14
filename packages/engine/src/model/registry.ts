import { GameObject } from "./game-object.js";
import type { Component, ComponentConstructor } from "./component.js";
import type {MutableFrameChanges} from "./frame-changes.js";

type ComponentStorage = Map<GameObject, Component>;

export class Registry {
    #storage: Map<ComponentConstructor, ComponentStorage>;
    #gameObjects: Set<GameObject>;
    frameChanges: MutableFrameChanges | null = null;
    constructor() {
        this.#storage = new Map();
        this.#gameObjects = new Set();
    }
    isAlive(gameObject: GameObject) {
        return this.#gameObjects.has(gameObject);
    }
    createGameObject(): GameObject {
        const gameObject = new GameObject(this);
        this.#gameObjects.add(gameObject);
        if (this.frameChanges) this.frameChanges.createdGameObjects.add(gameObject);
        return gameObject;
    }
    destroyGameObject(gameObject: GameObject) {
        this.#gameObjects.delete(gameObject);
        if (this.frameChanges) this.frameChanges.destroyedGameObjects.add(gameObject);
        for (const storage of this.#storage.values()) {
            storage.delete(gameObject);
            this.#gameObjects.delete(gameObject);
        }
    }
    registerComponent(...typeArray: ComponentConstructor[]) {
        for (const type of typeArray) {
            if (!this.#storage.has(type)) {
                this.#storage.set(type, new Map());
            }
        }
    }
    addComponent(gameObject: GameObject, component: Component) {
        const type = component.constructor as ComponentConstructor;
        if (!this.#storage.has(type)) {
            this.#storage.set(type, new Map());
        }
        const storage = this.#storage.get(type)!;
        storage.set(gameObject, component);
        component._notifyModification = () => {
            if (this.frameChanges?.modifiedGameObjects.has(gameObject)) {
                this.frameChanges?.modifiedGameObjects.get(gameObject)?.push(type);
            } else {
                this.frameChanges?.modifiedGameObjects.set(gameObject, [type])
            }
        }
    }
    getComponent<T extends Component>(gameObject: GameObject, type: ComponentConstructor<T>): Readonly<T> | undefined {
        const storage = this.#storage.get(type);
        if (!storage) {
            console.error(`Component ${type} does not exist or is not registered.`);
            return;
        }
        const component = storage.get(gameObject);
        return <T | undefined> component;
    }
    hasComponent<T extends Component>(gameObject: GameObject, type: ComponentConstructor<T>): boolean {
        const storage = this.#storage.get(type);
        if (!storage) {
            console.error(`Component ${type} does not exist or is not registered.`);
            return false;
        }
        const component = storage.get(gameObject);
        return !!component;
    }
    query(typeArray: ComponentConstructor[], pool?: Set<GameObject>): GameObject[] {
        if (!pool) pool = this.#gameObjects;
        if (typeArray.length == 0) {
            return Array.from(pool);
        }

        const intersection = new Set(pool);
        for (const type of typeArray) {
            const storage = this.#storage.get(type);
            if (!storage) {
                // console.error(`Component ${type.name} does not exist or is not registered.`);
                return [];
            }
            const uuids = new Set(storage.keys());

            for (const uuid of intersection) {
                if (!uuids.has(uuid)) {
                    intersection.delete(uuid);
                }
            }
        }

        return Array.from(intersection);
    }
}