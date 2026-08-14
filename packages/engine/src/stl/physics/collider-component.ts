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

export class AABBCollider extends ColliderShape {
    dim: Vector2;
    constructor(dim: Vector2) {
        super();
        this.dim = dim;
    }
    worldShape(transform: Transform): AABBCollider {
        const scaledDim = new Vector2(
            this.dim.x * transform.worldScale.x,
            this.dim.y * transform.worldScale.y,
        );
        return new AABBCollider(scaledDim);
    }
}


export class Collider extends Component {
    readonly shape: ColliderShape
    constructor(shape: ColliderShape) {
        super();
        this.shape = shape;
    }
}