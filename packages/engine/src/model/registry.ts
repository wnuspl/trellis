import { GameObject } from "./game-object.js";
import type { Aspect, AspectConstructor } from "./aspect.js";
import type {MutableFrameChanges} from "./frame-changes.js";

type AspectStorage = Map<GameObject, Aspect>;

export class Registry {
    #storage: Map<AspectConstructor, AspectStorage>;
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
    registerAspect(...typeArray: AspectConstructor[]) {
        for (const type of typeArray) {
            if (!this.#storage.has(type)) {
                this.#storage.set(type, new Map());
            }
        }
    }
    addAspect(gameObject: GameObject, aspect: Aspect) {
        const type = aspect.constructor as AspectConstructor;
        if (!this.#storage.has(type)) {
            this.#storage.set(type, new Map());
        }
        const storage = this.#storage.get(type)!;
        storage.set(gameObject, aspect);
    }
    getAspect<T extends Aspect>(gameObject: GameObject, type: AspectConstructor<T>): Readonly<T> | undefined {
        const storage = this.#storage.get(type);
        if (!storage) {
            console.error(`Aspect ${type} does not exist or is not registered.`);
            return;
        }
        const aspect = storage.get(gameObject);
        return <T | undefined> aspect;
    }
    modifyAspect<T extends Aspect>(gameObject: GameObject, type: AspectConstructor<T>, modifier: (aspect: T) => void) {
        const aspect = this.getAspect(gameObject, type);
        if (aspect) {
            modifier(aspect);
            if (this.frameChanges) {
                if (!this.frameChanges.modifiedGameObjects.has(gameObject)) {
                    this.frameChanges.modifiedGameObjects.set(gameObject, []);
                }
                this.frameChanges.modifiedGameObjects.get(gameObject)!.push(type);
            }
        }
    }
    hasAspect<T extends Aspect>(gameObject: GameObject, type: AspectConstructor<T>): boolean {
        const storage = this.#storage.get(type);
        if (!storage) {
            console.error(`Aspect ${type} does not exist or is not registered.`);
            return false;
        }
        const aspect = storage.get(gameObject);
        return !!aspect;
    }
    query(typeArray: AspectConstructor[], pool?: Set<GameObject>): GameObject[] {
        if (!pool) pool = this.#gameObjects;
        if (typeArray.length == 0) {
            return Array.from(pool);
        }

        const intersection = new Set(pool);
        for (const type of typeArray) {
            const storage = this.#storage.get(type);
            if (!storage) {
                // console.error(`Aspect ${type.name} does not exist or is not registered.`);
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