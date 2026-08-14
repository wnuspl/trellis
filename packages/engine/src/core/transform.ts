import {Vector2, type Vector2Unserialized} from "../utils/vector2.js";
import {Aspect} from "../model/aspect.js";
import {TrackedVector2} from "../utils/tracked-vector2.js";
import {markModification} from "../tracked.js";

export type TransformUnserialized = {
    position: Vector2Unserialized;
    rotation: number;
    scale: Vector2Unserialized;
};

export class Transform extends Aspect {
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
    static from(data: TransformUnserialized) {
        const position = Vector2.from(data.position);
        const rotation = data.rotation ?? 0;
        const scale = data.scale ? Vector2.from(data.scale) : new Vector2(1,1);
        return new Transform(position, rotation, scale);
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
        this.#position._reset();
        this._modified = false;
    }
    set _notifyModification(callback: (() => void) | undefined) {
        this._notifyModificationInternal = callback;
        this.#position._notifyModification = callback;
        this.#scale._notifyModification = callback;
    }
    toJSON() {
        return {
            position: <Vector2> this.#position,
            rotation: this.#rotation,
            scale: <Vector2> this.#scale,
        }
    }
}
