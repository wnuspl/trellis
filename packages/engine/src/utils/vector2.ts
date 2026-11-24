export type Vector2Unserialized = { x: number; y: number };
/** Shape written by scene files saved before Vector2 had toJSON. */
type LegacyVector2Unserialized = { _x: number; _y: number };
export class Vector2 {
    protected _x: number;
    protected _y: number;
    get x(): number {
        return this._x;
    }
    set x(value: number) {
        this._x = value;
    }
    get y(): number {
        return this._y;
    }
    set y(value: number) {
        this._y = value;
    }
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }
    static from(data: Vector2Unserialized | LegacyVector2Unserialized): Vector2 {
        if ("_x" in data) return new Vector2(data._x, data._y);
        return new Vector2(data.x, data.y);
    }
    toJSON(): Vector2Unserialized {
        return { x: this.x, y: this.y };
    }
    plus(other: Vector2) {
        return new Vector2(this.x+other.x, this.y+other.y);
    }
    minus(other: Vector2) {
        return new Vector2(this.x-other.x, this.y-other.y);
    }
    scaled(scalar: number) {
        return new Vector2(this.x*scalar, this.y*scalar);
    }
    normalized() {
        const magnitude = this.magnitude();
        if (magnitude == 0) return this;
        return this.scaled(1/magnitude);
    }
    magnitude() {
       return Math.sqrt(this.x**2 + this.y**2);
    }
    dot(other: Vector2) {
        return this.x*other.x + this.y*other.y;
    }
    equals(other: Vector2) {
        return this.x == other.x && this.y == other.y;
    }


    add(other: Vector2) {
        this.x += other.x;
        this.y += other.y;
    }
    subtract(other: Vector2) {
        this.x -= other.x;
        this.y -= other.y;
    }

    clone() {
        return new Vector2(this.x, this.y);
    }
}