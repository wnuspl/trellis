import {Vector2} from "../../utils/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {Transform} from "../../core/index.js";
import {BoxCollider, CircleCollider, Collider, ColliderShape} from "./collider-component.js";
import {GameObject, Process} from "../../model/index.js";
import {FrameEvent} from "../../events.js";
import type {BehaviorContext} from "../../model/behavior.js";

export type CollisionManifold = {
    isCollision: boolean;
    normal: Vector2;
    penetration: number;
}

type CollisionObject = {
    colliderShape: ColliderShape;
    transform: Transform;
}

export class CollisionEvent extends FrameEvent {
    a: GameObject;
    b: GameObject;
    manifold: CollisionManifold;
    constructor(a: GameObject, b: GameObject, manifold: CollisionManifold) {
        super();
        this.a = a;
        this.b = b;
        this.manifold = manifold;
        this.involvedGameObjects = new Set([a, b]);
    }
    for(gameObject: GameObject): FrameEvent {
        if (gameObject == this.a) {
            return this;
        } else if (gameObject == this.b) {
            return new CollisionEvent(this.b, this.a, { ...this.manifold, normal: this.manifold.normal.scaled(-1) });
        }
        return this;
    }
    static each(target: GameObject, ctx: BehaviorContext, action: (other: GameObject) => void) {
        for (const collisionEvent of ctx.events.getFor(CollisionEvent, target)) {
            action(collisionEvent.b);
        }
    }
}

export class CollisionProcess extends Process {
    update(ctx: InstanceContext) {
        const gameObjects = ctx.scene.query([Collider]);
        for (let i=0; i<gameObjects.length; i++) {
            const a = {
                colliderShape: gameObjects[i]!.get(Collider).shape,
                transform: gameObjects[i]!.get(Transform),
            }
            a.colliderShape = a.colliderShape.worldShape(a.transform);
            for (let j=0; j<i; j++) {
                const b = {
                    colliderShape: gameObjects[j]!.get(Collider).shape,
                    transform: gameObjects[j]!.get(Transform),
                }
                b.colliderShape = b.colliderShape.worldShape(b.transform);
                const collision = CollisionProcess.detectCollision(a,b);
                if (collision.manifold.isCollision) {
                    if (collision.flipped) {
                        ctx.events.post(new CollisionEvent(gameObjects[j]!, gameObjects[i]!, collision.manifold))
                    } else {
                        ctx.events.post(new CollisionEvent(gameObjects[i]!, gameObjects[j]!, collision.manifold))
                    }
                }
            }
        }
    }
    static detectCollision(a: CollisionObject, b: CollisionObject): {manifold:CollisionManifold, flipped: boolean} {
        let manifold;
        let flipped = false;
        if (a.colliderShape instanceof CircleCollider) {
            if (b.colliderShape instanceof CircleCollider) {
                manifold = CollisionProcess.CircleCircle(a,b);
            }
            if (b.colliderShape instanceof BoxCollider) {
                manifold = CollisionProcess.CircleBox(a,b);
            }
        }
        if (a.colliderShape instanceof BoxCollider) {
            if (b.colliderShape instanceof CircleCollider) {
                manifold = CollisionProcess.CircleBox(b,a);
                flipped = true;
            }
            if (b.colliderShape instanceof BoxCollider) {
                manifold = CollisionProcess.BoxBox(a,b);
            }
        }
        if (!manifold) throw new Error(
            `Unsupported collider types: ${a.colliderShape?.constructor?.name} vs ${b.colliderShape?.constructor?.name}`
        );
        return {manifold, flipped};
    }
    static CircleCircle(a: CollisionObject, b: CollisionObject) {
        const circleA = <CircleCollider> a.colliderShape;
        const circleB = <CircleCollider> b.colliderShape;
        const diff = b.transform.worldPosition.minus(a.transform.worldPosition);
        const distance = diff.magnitude();
        const radiusSum = circleA.radius + circleB.radius;
        const isCollision = radiusSum > distance;
        const penetration = radiusSum - distance;
        const normal = diff.normalized();
        return {
            isCollision,
            normal,
            penetration
        };
    }
    static CircleBox(a: CollisionObject, b: CollisionObject) {
        const circle = a.colliderShape as CircleCollider;
        const box = b.colliderShape as BoxCollider;

        // Work in the box's local frame, where it is axis-aligned and centered at the origin.
        const center = box.toLocal(a.transform.worldPosition.minus(b.transform.worldPosition));
        const half = box.dim.scaled(0.5);

        const closest = new Vector2(
            Math.max(-half.x, Math.min(center.x, half.x)),
            Math.max(-half.y, Math.min(center.y, half.y))
        );

        const diff = closest.minus(center);
        const distance = diff.magnitude();

        // Circle center is inside the box: push out through the nearest side.
        if (distance === 0) {
            let normal;
            const left = center.x + half.x;
            const right = half.x - center.x;
            const bottom = center.y + half.y;
            const top = half.y - center.y;

            const minDist = Math.min(left, right, bottom, top);

            if (minDist === left) {
                normal = new Vector2(1, 0);
            } else if (minDist === right) {
                normal = new Vector2(-1, 0);
            } else if (minDist === bottom) {
                normal = new Vector2(0, 1);
            } else {
                normal = new Vector2(0, -1);
            }

            return {
                isCollision: true,
                normal: box.toWorld(normal),
                penetration: circle.radius + minDist
            };
        }

        return {
            isCollision: distance < circle.radius,
            normal: box.toWorld(diff.normalized()),
            penetration: circle.radius - distance
        };
    }
    /** Separating axis test on the 4 edge directions of two (possibly rotated) boxes. */
    static BoxBox(a: CollisionObject, b: CollisionObject) {
        const boxA = a.colliderShape as BoxCollider;
        const boxB = b.colliderShape as BoxCollider;
        const halfA = boxA.dim.scaled(0.5);
        const halfB = boxB.dim.scaled(0.5);
        const [ax, ay] = boxA.axes();
        const [bx, by] = boxB.axes();

        const diff = b.transform.worldPosition.minus(a.transform.worldPosition);

        let penetration = Infinity;
        let normal = new Vector2(0, 0);
        for (const axis of [ax, ay, bx, by]) {
            // Half the length of each box's shadow on this axis.
            const radiusA = halfA.x * Math.abs(axis.dot(ax)) + halfA.y * Math.abs(axis.dot(ay));
            const radiusB = halfB.x * Math.abs(axis.dot(bx)) + halfB.y * Math.abs(axis.dot(by));
            const distance = diff.dot(axis);
            const overlap = radiusA + radiusB - Math.abs(distance);
            if (overlap <= 0) {
                return {
                    isCollision: false,
                    normal: new Vector2(0, 0),
                    penetration: 0
                };
            }
            // Resolve along the axis of least penetration; normal points from a to b.
            if (overlap < penetration) {
                penetration = overlap;
                normal = distance < 0 ? axis.scaled(-1) : axis;
            }
        }
        return {
            isCollision: true,
            normal,
            penetration
        };
    }
}
