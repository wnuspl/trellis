import {Component} from "../../model/index.js";
import {Vector2} from "../../utils/index.js";
import {Transform} from "../../core/index.js";


export abstract class ColliderShape {
    abstract worldShape(transform: Transform): ColliderShape;
}

export class CircleCollider extends ColliderShape {
    radius: number;
    constructor(radius: number) {
        super();
        this.radius = radius;
    }
    worldShape(transform: Transform): CircleCollider {
        const scaleFactor = Math.max(
            transform.worldScale.x,
            transform.worldScale.y,
        );
        return new CircleCollider(this.radius*scaleFactor);
    }
}

/**
 * A rectangle centered on the object that rotates with it.
 *
 * `rotation` uses the same convention as `Transform.rotation`: radians, and a
 * positive value turns the box clockwise on screen (the renderer flips y, so
 * in y-up world space that is a negative math angle).
 */
export class BoxCollider extends ColliderShape {
    dim: Vector2;
    rotation: number;
    constructor(dim: Vector2, rotation: number = 0) {
        super();
        this.dim = dim;
        this.rotation = rotation;
    }
    worldShape(transform: Transform): BoxCollider {
        const scaledDim = new Vector2(
            this.dim.x * transform.worldScale.x,
            this.dim.y * transform.worldScale.y,
        );
        return new BoxCollider(scaledDim, transform.worldRotation + this.rotation);
    }
    toLocal(direction: Vector2): Vector2 {
        return direction.rotated(this.rotation);
    }
    toWorld(direction: Vector2): Vector2 {
        return direction.rotated(-this.rotation);
    }
    axes(): [Vector2, Vector2] {
        return [this.toWorld(new Vector2(1, 0)), this.toWorld(new Vector2(0, 1))];
    }
}



export class Collider extends Component {
    shape: ColliderShape
    constructor(shape: ColliderShape) {
        super();
        this.shape = shape;
    }
}