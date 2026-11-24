import type {GameObject} from "./game-object.js";
import type {Registry} from "./registry.js";
import type {ComponentConstructor} from "./component.js";
import type {Transform} from "../core/transform.js";
import {type Blueprint, PATH_SEPARATOR} from "./blueprint.js";

/** Where a game object came from when it was built from a blueprint. */
export type BuildOrigin = {
    /** The blueprint that built this object (for a child, the child's blueprint). */
    readonly blueprint: Blueprint;
    /** The object the outermost build() call created. Equal to the object itself for that object. */
    readonly instanceRoot: GameObject;
    /** Child keys from the instance root to this object. Empty for the instance root. */
    readonly path: readonly string[];
};

const EMPTY_SET: Set<GameObject> = new Set();

export class Scene {
    #initialized: boolean = false;
    #registry: Registry;
    #root: GameObject | null = null;
    #children: Map<GameObject, Set<GameObject>> | null = null;
    #parents: Map<GameObject, GameObject> | null = null;
    #gameObjects: Set<GameObject> | null = null;
    #origins: Map<GameObject, BuildOrigin> | null = null;
    /** Instance root -> (joined path -> object), for resolvePath. */
    #instances: Map<GameObject, Map<string, GameObject>> | null = null;
    #initCallback: (scene: Scene) => void | Promise<void> = () => {};
    constructor(registry: Registry) {
        this.#registry = registry;
    }
    assertInitialized(): asserts this is this & {
        get #root(): string;
        get #children(): any[];
        get #parents(): any[];
        get #gameObjects(): any[];
        get #origins(): any[];
        get #instances(): any[];
    } {
        if (!(this.#initialized && this.#root && this.#children && this.#parents && this.#gameObjects && this.#origins && this.#instances)) {
            throw new Error("Scene not initialized");
        }
    }
    destroyGameObject(gameObject: GameObject) {
        this.assertInitialized();
        if (!this.#gameObjects.has(gameObject)) return;
        const children = this.#children.get(gameObject);
        if (children) {
            for (const child of Array.from(children)) {
                this.destroyGameObject(child);
            }
        }
        this.#children.delete(gameObject);
        const parent = this.#parents.get(gameObject);
        if (parent) this.#children.get(parent)?.delete(gameObject);
        this.#parents.delete(gameObject);
        const origin = this.#origins.get(gameObject);
        if (origin) {
            this.#instances.get(origin.instanceRoot)?.delete(origin.path.join(PATH_SEPARATOR));
            if (origin.instanceRoot === gameObject) this.#instances.delete(gameObject);
            this.#origins.delete(gameObject);
        }
        this.#gameObjects.delete(gameObject);
        this.#registry.destroyGameObject(gameObject);
    }
    createGameObject(parent: GameObject = this.#root!) {
        this.assertInitialized();
        const gameObject = this.#registry.createGameObject();
        this.#gameObjects.add(gameObject);
        this.#parents.set(gameObject, parent);
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
    query<const R extends readonly ComponentConstructor[]>(typeArray: R) {
        this.assertInitialized();
        return this.#registry.query(typeArray, this.#gameObjects);
    }
    getParent(gameObject: GameObject): GameObject | null {
        this.assertInitialized();
        return this.#parents.get(gameObject) ?? null;
    }
    /** How this object was built, or undefined if it wasn't built from a blueprint. */
    getOrigin(gameObject: GameObject): BuildOrigin | undefined {
        this.assertInitialized();
        return this.#origins.get(gameObject);
    }
    /**
     * Finds an object inside a blueprint instance by its child path, e.g.
     * "body/wheel" or ["body", "wheel"]. "" or [] is the instance root itself.
     */
    resolvePath(instanceRoot: GameObject, path: string | readonly string[]): GameObject | undefined {
        this.assertInitialized();
        const key = typeof path === "string" ? path : path.join(PATH_SEPARATOR);
        return this.#instances.get(instanceRoot)?.get(key);
    }
    /** Builds a blueprint and its children. Each call creates a new instance. */
    build(blueprint: Blueprint, parent: GameObject = this.#root!) {
        this.assertInitialized();
        return this.#buildNode(blueprint, parent, null, []);
    }
    #buildNode(blueprint: Blueprint, parent: GameObject, instanceRoot: GameObject | null, path: string[]): GameObject {
        this.assertInitialized();
        const gameObject = this.createGameObject(parent);
        const root = instanceRoot ?? gameObject;
        this.#origins.set(gameObject, { blueprint, instanceRoot: root, path });
        let index = this.#instances.get(root);
        if (!index) {
            index = new Map();
            this.#instances.set(root, index);
        }
        index.set(path.join(PATH_SEPARATOR), gameObject);

        blueprint.build(gameObject);
        for (const [key, childBlueprint] of blueprint.childEntries()) {
            this.#buildNode(childBlueprint, gameObject, root, [...path, key]);
        }
        return gameObject;
    }
    destroy() {
        if (!this.#initialized) return;

        for (const gameObject of this.#gameObjects ?? []) {
            this.#registry.destroyGameObject(gameObject);
        }
        if (this.#root) this.#registry.destroyGameObject(this.#root);
        this.#gameObjects = null;
        this.#children = null;
        this.#parents = null;
        this.#origins = null;
        this.#instances = null;
        this.#root = null;
        this.#initialized = false;
    }
    onInit(callback: (scene: Scene) => void | Promise<void>) {
        this.#initCallback = callback;
    }
    async init() {
        if (this.#initialized) return;
        this.#root = this.#registry.createGameObject();
        this.#gameObjects = new Set();
        this.#children = new Map();
        this.#parents = new Map();
        this.#origins = new Map();
        this.#instances = new Map();
        // Mark initialized before running the callback so it can build into the scene.
        this.#initialized = true;
        await this.#initCallback(this);
    }
    get root() {
        return this.#root;
    }
}

export type ReadonlyScene = {
    query<const R extends readonly ComponentConstructor[]>(typeArray: R): GameObject<Transform | InstanceType<R[number]>>[];
    getChildren(parent: GameObject): Set<GameObject>;
    getParent(gameObject: GameObject): GameObject | null;
    getOrigin(gameObject: GameObject): BuildOrigin | undefined;
    resolvePath(instanceRoot: GameObject, path: string | readonly string[]): GameObject | undefined;
}