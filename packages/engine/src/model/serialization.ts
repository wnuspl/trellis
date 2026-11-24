// Default serialization rules shared by components and nested values.
//
// A value's serializable properties are:
//   - own enumerable fields whose names don't start with "_"
//   - accessors (getter AND setter) on its prototype chain, also skipping "_"
// Getter-only accessors are treated as derived state and skipped, and
// #private fields are invisible by design.

export type Serialized = null | boolean | number | string | Serialized[] | { [key: string]: Serialized };

const MAX_DEPTH = 32;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== "object") return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/** Names of the properties of `target` that serialize() writes and deserialize() accepts. */
export function serializableKeys(target: object): string[] {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const key of Object.keys(target)) {
        if (key.startsWith("_") || typeof (target as any)[key] === "function") continue;
        seen.add(key);
        keys.push(key);
    }
    // Plain objects have no accessors worth walking.
    if (isPlainObject(target)) return keys;

    let proto = Object.getPrototypeOf(target);
    while (proto && proto !== Object.prototype) {
        for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
            if (seen.has(key) || key.startsWith("_") || key === "constructor") continue;
            seen.add(key);
            if (descriptor.get && descriptor.set) keys.push(key);
        }
        proto = Object.getPrototypeOf(proto);
    }
    return keys;
}

/** Converts a value to JSON-safe data. Objects with toJSON use it; others use serializableKeys. */
export function toPlain(value: unknown, depth = 0, seen: Set<object> = new Set()): Serialized | undefined {
    if (value === null) return null;
    switch (typeof value) {
        case "boolean":
        case "string":
            return value;
        case "number":
            return Number.isFinite(value) ? value : null;
        case "object":
            break;
        default:
            return undefined; // functions, symbols, undefined, bigint
    }
    const obj = value as object;
    if (depth > MAX_DEPTH || seen.has(obj)) {
        console.error("Serialization skipped a value: cycle or excessive nesting");
        return undefined;
    }
    seen.add(obj);
    try {
        if (typeof (obj as any).toJSON === "function") {
            return toPlain((obj as any).toJSON(), depth + 1, seen);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => toPlain(item, depth + 1, seen) ?? null);
        }
        const result: { [key: string]: Serialized } = {};
        for (const key of serializableKeys(obj)) {
            const plain = toPlain((obj as any)[key], depth + 1, seen);
            if (plain !== undefined) result[key] = plain;
        }
        return result;
    } finally {
        seen.delete(obj);
    }
}

/**
 * Merges `patch` into `target` in place. Objects are merged key by key, so
 * nested values (a Vector2, a collider shape) keep their identity. When the
 * property has a setter and the value can clone(), a patched clone goes
 * through the setter instead, so tracking still fires. Arrays and primitives
 * are replaced.
 */
export function applyPatch(target: object, patch: Record<string, unknown>, path = ""): void {
    for (const [key, value] of Object.entries(patch)) {
        const current = (target as any)[key];
        if (
            isPlainObject(value) &&
            current !== null &&
            typeof current === "object" &&
            !Array.isArray(current)
        ) {
            // A setter may do work (change tracking, copying into a tracked
            // vector), so patch a clone and hand it to the setter when we can.
            if (hasSetter(target, key) && typeof current.clone === "function") {
                const copy = current.clone();
                applyPatch(copy, value, `${path}${key}.`);
                trySet(target, key, copy, path);
            } else {
                applyPatch(current, value, `${path}${key}.`);
            }
            continue;
        }
        trySet(target, key, cloneData(value), path);
    }
}

function hasSetter(target: object, key: string): boolean {
    let proto = Object.getPrototypeOf(target);
    while (proto && proto !== Object.prototype) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (descriptor) return !!descriptor.set;
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}

function trySet(target: object, key: string, value: unknown, path: string) {
    try {
        (target as any)[key] = value;
    } catch (error) {
        console.error(`Could not set ${path}${key} while applying patch`, error);
    }
}

function cloneData(value: unknown): unknown {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(cloneData);
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) result[key] = cloneData(item);
    return result;
}
