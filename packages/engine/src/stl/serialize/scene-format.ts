// Scene file format.
//
// v2:
// {
//   "version": 2,
//   "objects": [
//     {
//       "blueprint": "tank",
//       "changes": {
//         "":              { "Transform": { "position": { "x": 5, "y": 0 } } },
//         "turret/barrel": { "Transform": { "rotation": 0.5 } }
//       },
//       "children": [ { "blueprint": "flag", "at": "turret" } ]
//     }
//   ]
// }
//
// The blueprint builds the object and its blueprint children. "changes"
// patches components by child path ("" is the object itself). "children" are
// separate objects placed in the scene under this one ("at" picks a blueprint
// child to place them under).
//
// v1 (still read): [ { "alias": "tank", "components": { "Transform": {...} } } ]

export const SCENE_FORMAT_VERSION = 2;

/** Component name -> partial component data. */
export type ComponentPatches = Record<string, Record<string, unknown>>;

/** Child path -> component patches. */
export type SceneChanges = Record<string, ComponentPatches>;

export type SceneObject = {
    blueprint: string;
    changes?: SceneChanges;
    children?: SceneObject[];
    /** Path of the blueprint child of the parent object to place this under. */
    at?: string;
};

export type SceneFile = {
    version: typeof SCENE_FORMAT_VERSION;
    objects: SceneObject[];
};

/** v1 object entry. */
export type LegacySceneObject = {
    alias: string;
    components?: ComponentPatches;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Accepts a v1 or v2 object entry and returns v2. */
export function toSceneObject(entry: SceneObject | LegacySceneObject): SceneObject {
    if ("blueprint" in entry) return entry;
    const object: SceneObject = { blueprint: entry.alias };
    if (entry.components && Object.keys(entry.components).length > 0) {
        object.changes = { "": entry.components };
    }
    return object;
}

/** Parses scene file text of either version into a v2 SceneFile. Throws on unreadable data. */
export function parseSceneFile(text: string): SceneFile {
    const data: unknown = JSON.parse(text);
    if (Array.isArray(data)) {
        return { version: SCENE_FORMAT_VERSION, objects: data.map(toSceneObject) };
    }
    if (!isRecord(data) || !Array.isArray(data.objects)) {
        throw new Error("Scene file is not a scene: expected { version, objects: [...] }");
    }
    if (data.version !== SCENE_FORMAT_VERSION) {
        throw new Error(`Scene file version ${String(data.version)} is not supported (expected ${SCENE_FORMAT_VERSION})`);
    }
    return data as SceneFile;
}

/**
 * The parts of `current` that differ from `base`, or undefined if nothing
 * differs. Objects are compared key by key; arrays and other values whole.
 * Keys missing from `current` are not reported (patches can't remove fields).
 */
export function diffSerialized(base: unknown, current: unknown): unknown {
    if (isRecord(base) && isRecord(current)) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(current)) {
            const difference = diffSerialized(base[key], value);
            if (difference !== undefined) result[key] = difference;
        }
        return Object.keys(result).length > 0 ? result : undefined;
    }
    return deepEqual(base, current) ? undefined : current;
}

function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
    }
    if (isRecord(a) && isRecord(b)) {
        const keys = Object.keys(a);
        return keys.length === Object.keys(b).length && keys.every(key => key in b && deepEqual(a[key], b[key]));
    }
    return false;
}

/**
 * Scene files saved before Vector2 had toJSON store vectors as
 * { _x, _y, _modified }. Rewrite those to { x, y }.
 */
export function normalizeLegacy(value: unknown): unknown {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(normalizeLegacy);
    const record = value as Record<string, unknown>;
    if (typeof record._x === "number" && typeof record._y === "number") {
        return { x: record._x, y: record._y };
    }
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) result[key] = normalizeLegacy(item);
    return result;
}
