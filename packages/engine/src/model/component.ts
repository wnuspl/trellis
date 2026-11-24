import type {Tracked} from "../tracked.js";
import {applyPatch, serializableKeys, toPlain, type Serialized} from "./serialization.js";

export interface ComponentConstructor<T extends Component = Component> {
    new (...args: any[]): T;
    /** @deprecated Scene loading patches existing components with deserialize(). */
    from(data: object): Component
}

export class Component implements Tracked {
    _notifyModificationInternal: (() => void) | undefined;
    _modified: boolean = false;
    _reset() {
        this._modified = false;
    }
    get _notifyModification() {
        return this._notifyModificationInternal;
    }
    set _notifyModification(callback: (() => void) | undefined) {
        this._notifyModificationInternal = callback;
    }
    /**
     * Saveable state as JSON-safe data. By default: public fields and
     * getter/setter pairs, skipping names that start with "_".
     * Override to choose the fields yourself.
     */
    serialize(): Record<string, Serialized> {
        return toPlain(this) as Record<string, Serialized>;
    }
    /**
     * Applies (possibly partial) saved data to this component in place.
     * Unknown top-level keys are ignored with a warning.
     */
    deserialize(data: Record<string, unknown>): void {
        const known = new Set(serializableKeys(this));
        const accepted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (known.has(key)) {
                accepted[key] = value;
            } else {
                console.warn(`${this.constructor.name} has no serializable property "${key}" (ignoring)`);
            }
        }
        applyPatch(this, accepted);
    }
    /** @deprecated Scene loading patches existing components with deserialize(). */
    static from(data: object): Component {
        console.error(`Component from ${this.name} used but not defined`);
        return new Component();
    }
}
