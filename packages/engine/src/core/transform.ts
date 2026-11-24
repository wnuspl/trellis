import {Vector2, type Vector2Unserialized} from "../utils/vector2.js";
import {Component} from "../model/component.js";
import {TrackedVector2} from "../utils/tracked-vector2.js";
import {markModification} from "../tracked.js";

export type TransformUnserialized = {
    position: Partial<Vector2Unserialized>;
    rotation: number;
    scale: Partial<Vector2Unserialized>;
};

export class Transform extends Component {
    #position: TrackedVector2;
    #rotation: number;
    #scale: TrackedVector2;
    worldPosition: Vector2;
    worldRotation: number;
    worldScale: Vector2;
    constructor(position?: Vector2, rotation?: number, scale?: Vector2) {
        super();

        this.#position = TrackedVector2.fromVector2(position ?? new Vector2(0,0));
        this.#rotation = rotation ?? 0;
        this.#scale = TrackedVector2.fromVector2(scale ?? new Vector2(1,1));

        this.worldPosition = position ?? new Vector2(0,0);
        this.worldRotation = rotation?? 0;
        this.worldScale = scale ?? new Vector2(1,1);
    }
    /** @deprecated Scene loading patches the existing Transform with deserialize(). */
    static from(data: Partial<TransformUnserialized>) {
        const transform = new Transform();
        transform.deserialize(data);
        return transform;
    }
    get position(): Vector2 {
        return this.#position;
    }
    get rotation() {
        return this.#rotation;
    }
    get scale() : Vector2 {
        return this.#scale;
    }
    set position(value: Vector2) {
        if (!value.equals(this.#position)) markModification(this);
        this.#position.x = value.x;
        this.#position.y = value.y;
    }
    set rotation(value: number) {
        if (value !== this.#rotation) markModification(this);
        this.#rotation = value;
    }
    set scale(value: Vector2) {
        if (!value.equals(this.#scale)) markModification(this);
        this.#scale.x = value.x;
        this.#scale.y = value.y;
    }
    _reset() {
        this.#position._reset();
        this.#scale._reset();
        this._modified = false;
    }
    // A setter-only accessor would shadow Component's getter and make it
    // return undefined, so rotation changes would never be reported.
    get _notifyModification(): (() => void) | undefined {
        return this._notifyModificationInternal;
    }
    set _notifyModification(callback: (() => void) | undefined) {
        this._notifyModificationInternal = callback;
        this.#position._notifyModification = callback;
        this.#scale._notifyModification = callback;
    }
    // Only local values are saved; world values are recomputed every frame.
    serialize() {
        return {
            position: this.#position.toJSON(),
            rotation: this.#rotation,
            scale: this.#scale.toJSON(),
        };
    }
    deserialize(data: Record<string, unknown>) {
        const { position, rotation, scale, ...rest } = data as Partial<TransformUnserialized>;
        for (const key of Object.keys(rest)) {
            console.warn(`Transform has no serializable property "${key}" (ignoring)`);
        }
        // Partial vectors keep the other axis, so {x: 5} only moves x.
        if (position) this.position = new Vector2(position.x ?? this.#position.x, position.y ?? this.#position.y);
        if (typeof rotation === "number") this.rotation = rotation;
        if (scale) this.scale = new Vector2(scale.x ?? this.#scale.x, scale.y ?? this.#scale.y);
    }
    toJSON() {
        return this.serialize();
    }
}
