import type {Scene} from "../../model/scene.js";
import {type ComponentConstructor, type Serialized, Blueprint, GameObject} from "../../model/index.js";
import {PATH_SEPARATOR} from "../../model/blueprint.js";
import type {ResourceLoader} from "../resource-loader.js";
import {
    type ComponentPatches,
    type LegacySceneObject,
    type SceneChanges,
    type SceneFile,
    type SceneObject,
    SCENE_FORMAT_VERSION,
    diffSerialized,
    normalizeLegacy,
    parseSceneFile,
    toSceneObject,
} from "./scene-format.js";

export type SerializationConfig = {
    alias: string,
    blueprint: Blueprint,
    /**
     * @deprecated Register components once with SceneLoader.components() instead.
     * Types listed here are registered under their class name, which a
     * minifier may rename.
     */
    targetComponentTypes?: ComponentConstructor[],
}

export class SceneLoader {
    resourceLoader: ResourceLoader;
    config: Map<string, SerializationConfig>;
    /** Saved name -> component type. Shared by every blueprint and child object. */
    componentTypes: Map<string, ComponentConstructor>;
    /** Component type -> saved name. */
    componentNames: Map<ComponentConstructor, string>;
    gameObjectAlias: Map<GameObject, string>
    /** Object -> component name -> state right after its blueprint built it, before scene changes. */
    #baselines: WeakMap<GameObject, Map<string, Serialized>> = new WeakMap();
    /** Instance root -> changes from the file that couldn't be applied, kept so saving can write them back. */
    #unapplied: WeakMap<GameObject, SceneChanges> = new WeakMap();
    constructor(resourceLoader: ResourceLoader) {
        this.resourceLoader = resourceLoader;
        this.config = new Map();
        this.componentTypes = new Map();
        this.componentNames = new Map();
        this.gameObjectAlias = new Map();
    }
    /**
     * Registers the components that scene files may store, under the names
     * used in the file. Object shorthand keeps the names stable through minification:
     * `sceneLoader.components({ Transform, CoinValue })`
     */
    components(types: Record<string, ComponentConstructor>) {
        for (const [name, type] of Object.entries(types)) {
            const existingType = this.componentTypes.get(name);
            if (existingType && existingType !== type) {
                console.error(`Component name "${name}" is already registered to another type (ignoring)`);
                continue;
            }
            const existingName = this.componentNames.get(type);
            if (existingName && existingName !== name) {
                console.error(`Component ${type.name} is already registered as "${existingName}" (ignoring "${name}")`);
                continue;
            }
            this.componentTypes.set(name, type);
            this.componentNames.set(type, name);
        }
        return this;
    }
    register(...args: SerializationConfig[]) {
        for (const sc of args) {
            this.config.set(sc.alias, sc);
            for (const type of sc.targetComponentTypes ?? []) {
                if (!this.componentNames.has(type)) this.components({ [type.name]: type });
            }
        }
        return this;
    }
    /** Loads a v1 or v2 scene file into the scene. */
    async load(target: Scene, path: string) {
        const text = await this.resourceLoader.read(path);
        let file;
        try {
            file = parseSceneFile(text);
        } catch (error) {
            console.error(`Could not load scene ${path}`, error);
            return;
        }
        for (const object of file.objects) {
            this.buildGameObject(target, object);
        }
    }
    /**
     * Writes a v2 scene file. Only objects built through this loader (they
     * have an alias) are saved; objects spawned at runtime are not.
     */
    async save(target: Scene, path: string) {
        if (!target.root) return;
        const file: SceneFile = { version: SCENE_FORMAT_VERSION, objects: [] };
        for (const gameObject of target.getChildren(target.root)) {
            const serialized = this.serializeGameObject(target, gameObject);
            if (serialized) file.objects.push(serialized);
        }
        await this.resourceLoader.write(path, JSON.stringify(file, null, 2) + "\n");
    }
    /**
     * Builds one scene entry: the blueprint first, then its changes, then the
     * objects placed under it. Accepts v1 ({ alias, components }) or v2 entries.
     */
    buildGameObject(scene: Scene, entry: SceneObject | LegacySceneObject, parent?: GameObject): GameObject | null {
        const object = toSceneObject(entry);
        const config = this.config.get(object.blueprint);
        if (!config) {
            console.error(`Object with alias ${object.blueprint} was not registered (skipping it and its children)`);
            return null;
        }
        const gameObject = parent ? scene.build(config.blueprint, parent) : scene.build(config.blueprint);
        this.gameObjectAlias.set(gameObject, object.blueprint);
        this.snapshot(scene, gameObject);

        if (object.changes) this.applyChanges(scene, gameObject, object.changes);

        for (const child of object.children ?? []) {
            let childParent: GameObject = gameObject;
            if (child.at) {
                const resolved = scene.resolvePath(gameObject, child.at);
                if (resolved) {
                    childParent = resolved;
                } else {
                    console.error(`"${object.blueprint}" has no child "${child.at}" to place "${child.blueprint}" under (placing it under "${object.blueprint}")`);
                }
            }
            this.buildGameObject(scene, child, childParent);
        }
        return gameObject;
    }
    /**
     * Records the registered components' state for every object in an
     * instance. Saving compares against this to find what the scene changed.
     */
    snapshot(scene: Scene, instanceRoot: GameObject) {
        for (const gameObject of instanceObjects(scene, instanceRoot)) {
            const components = new Map<string, Serialized>();
            for (const component of gameObject.components) {
                const name = this.componentNames.get(component.constructor as ComponentConstructor);
                if (name) components.set(name, component.serialize());
            }
            this.#baselines.set(gameObject, components);
        }
    }
    /** A component's state as the blueprint built it, before scene changes. */
    getBaseline(gameObject: GameObject, componentName: string): Serialized | undefined {
        return this.#baselines.get(gameObject)?.get(componentName);
    }
    /** Changes from the scene file that didn't match anything in this instance. */
    getUnappliedChanges(instanceRoot: GameObject): SceneChanges | undefined {
        return this.#unapplied.get(instanceRoot);
    }
    /**
     * Applies changes by child path. Changes whose path, component name or
     * component is missing are warned about and kept for saving.
     */
    applyChanges(scene: Scene, instanceRoot: GameObject, changes: SceneChanges) {
        const label = this.gameObjectAlias.get(instanceRoot) ?? "object";
        for (const [path, patches] of Object.entries(changes)) {
            const target = scene.resolvePath(instanceRoot, path);
            if (!target) {
                console.warn(`"${label}" has no child "${path}" (keeping its changes)`);
                this.#keepUnapplied(instanceRoot, path, patches);
                continue;
            }
            for (const [componentName, data] of Object.entries(patches)) {
                if (!this.applyComponentData(target, componentName, data)) {
                    this.#keepUnapplied(instanceRoot, path, { [componentName]: data });
                }
            }
        }
    }
    #keepUnapplied(instanceRoot: GameObject, path: string, patches: ComponentPatches) {
        let kept = this.#unapplied.get(instanceRoot);
        if (!kept) {
            kept = {};
            this.#unapplied.set(instanceRoot, kept);
        }
        kept[path] = { ...kept[path], ...patches };
    }
    /**
     * Patches a component the blueprint already added. Adding components from
     * data is not supported yet. Returns false if nothing was applied.
     */
    applyComponentData(gameObject: GameObject, componentName: string, data: Record<string, unknown>): boolean {
        const type = this.componentTypes.get(componentName);
        if (!type) {
            console.error(`Component with name ${componentName} was not registered (keeping its changes)`);
            return false;
        }
        const component = gameObject.get(type);
        if (!component) {
            console.error(`Scene data has ${componentName}, but the blueprint didn't add it (keeping its changes)`);
            return false;
        }
        component.deserialize(normalizeLegacy(data) as Record<string, unknown>);
        return true;
    }
    /**
     * One scene entry for an instance root: what differs from its blueprint
     * (plus changes that couldn't be applied on load), and the aliased
     * objects placed under it. Returns undefined for objects without an alias.
     */
    serializeGameObject(scene: Scene, instanceRoot: GameObject): SceneObject | undefined {
        const alias = this.gameObjectAlias.get(instanceRoot);
        if (!alias) return;
        if (!this.config.has(alias)) {
            console.error(`Object with alias ${alias} was not registered. Likely using different sceneloader to save.`);
            return;
        }

        const changes: SceneChanges = structuredClone(this.#unapplied.get(instanceRoot) ?? {});
        const children: SceneObject[] = [];
        for (const gameObject of instanceObjects(scene, instanceRoot)) {
            const path = scene.getOrigin(gameObject)!.path.join(PATH_SEPARATOR);
            const patches = this.#diffComponents(gameObject, alias, path);
            if (patches) changes[path] = { ...changes[path], ...patches };

            for (const child of scene.getChildren(gameObject)) {
                if (scene.getOrigin(child)?.instanceRoot === instanceRoot) continue; // part of this instance
                const entry = this.serializeGameObject(scene, child);
                if (!entry) continue;
                // Rebuild so "at" sits next to "blueprint" in the file.
                const { blueprint, ...rest } = entry;
                children.push(path === "" ? entry : { blueprint, at: path, ...rest });
            }
        }

        const entry: SceneObject = { blueprint: alias };
        const sortedPaths = Object.keys(changes).sort();
        if (sortedPaths.length > 0) {
            entry.changes = {};
            for (const path of sortedPaths) entry.changes[path] = sortKeys(changes[path]!);
        }
        if (children.length > 0) entry.children = children;
        return entry;
    }
    #diffComponents(gameObject: GameObject, alias: string, path: string): ComponentPatches | undefined {
        const baselines = this.#baselines.get(gameObject);
        const patches: ComponentPatches = {};
        for (const component of gameObject.components) {
            const name = this.componentNames.get(component.constructor as ComponentConstructor);
            if (!name) continue;
            const baseline = baselines?.get(name);
            if (baseline === undefined) {
                console.warn(`"${alias}" ${path ? `child "${path}" ` : ""}got ${name} after it was built; adding components isn't saved yet (skipping)`);
                continue;
            }
            const difference = diffSerialized(baseline, component.serialize());
            if (difference !== undefined) patches[name] = difference as Record<string, unknown>;
        }
        return Object.keys(patches).length > 0 ? patches : undefined;
    }
}

function sortKeys<T>(record: Record<string, T>): Record<string, T> {
    return Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/** Every object built by the same scene.build() call as instanceRoot. */
function instanceObjects(scene: Scene, instanceRoot: GameObject): GameObject[] {
    const result: GameObject[] = [];
    const visit = (gameObject: GameObject) => {
        if (scene.getOrigin(gameObject)?.instanceRoot !== instanceRoot) return;
        result.push(gameObject);
        for (const child of scene.getChildren(gameObject)) visit(child);
    };
    visit(instanceRoot);
    return result;
}
