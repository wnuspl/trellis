export type Vector2Unserialized = { x: number; y: number };
export class Vector2 {
    constructor(public x: number, public y: number) {}
    static from(data: Vector2Unserialized): Vector2 {
        return new Vector2(data.x, data.y);
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