import {Vector2} from "./vector2.js";
import {markModification, type Tracked} from "../tracked.js";

export class TrackedVector2 extends Vector2 implements Tracked {
    _notifyModification: (() => void) | undefined;
    _modified: boolean = false;
    set x(value: number) {
        if (value != super.x) markModification(this);
        super.x = value;
    }
    set y(value: number) {
        if (value != super.y) markModification(this);
        super.y = value;
    }
    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    _reset(){
        this._modified = false;
    }

    static fromVector2(vector: Vector2) {
        return new TrackedVector2(vector.x, vector.y);
    }
}