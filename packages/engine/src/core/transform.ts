import {Vector2, type Vector2Unserialized} from "../utils/vector2.js";
import {Aspect} from "../model/aspect.js";

export type TransformUnserialized = {
    position: Vector2Unserialized;
    rotation: number;
    scale: Vector2Unserialized;
};

export class Transform extends Aspect {
    position: Vector2;
    rotation: number;
    scale: Vector2;
    worldPosition: Vector2;
    worldRotation: number;
    worldScale: Vector2;
    constructor(position?: Vector2, rotation?: number, scale?: Vector2) {
        super();

        this.position = position ?? new Vector2(0,0);
        this.rotation = rotation ?? 0;
        this.scale = scale ?? new Vector2(1,1);

        this.worldPosition = position ?? new Vector2(0,0);
        this.worldRotation =rotation?? 0;
        this.worldScale = scale ?? new Vector2(1,1);
    }
    static from(data: TransformUnserialized) {
        const position = Vector2.from(data.position);
        const rotation = data.rotation ?? 0;
        const scale = data.scale ? Vector2.from(data.scale) : new Vector2(1,1);
        return new Transform(position, rotation, scale);
    }
}
