import {Vector2} from "../../utils/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {Transform} from "../../core/index.js";
import {AABBCollider, CircleCollider, Collider, ColliderShape} from "./collider-component.js";
import {GameObject, Process} from "../../model/index.js";
import {FrameEvent} from "../../events.js";

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
            return new CollisionEvent(this.b, this.a, this.manifold);
        }
        return this;
    }
    static each(target: GameObject, ctx: InstanceContext, action: (other: GameObject) => void) {
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
                colliderShape: gameObjects[i]!.get(Collider)!.shape,
                transform: gameObjects[i]!.get(Transform)!,
            }
            a.colliderShape = a.colliderShape.worldShape(a.transform);
            for (let j=0; j<i; j++) {
                const b = {
                    colliderShape: gameObjects[j]!.get(Collider)!.shape,
                    transform: gameObjects[j]!.get(Transform)!,
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
            if (b.colliderShape instanceof AABBCollider) {
                manifold = CollisionProcess.CircleAABB(a,b);
            }
        }
        if (a.colliderShape instanceof AABBCollider) {
            if (b.colliderShape instanceof CircleCollider) {
                manifold = CollisionProcess.CircleAABB(b,a);
                flipped = true;
            }
            if (b.colliderShape instanceof AABBCollider) {
                manifold = CollisionProcess.AABBAABB(a,b);
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
    static CircleAABB(a: CollisionObject, b: CollisionObject) {
        const circle = a.colliderShape as CircleCollider;
        const aabb = b.colliderShape as AABBCollider;

        const half = aabb.dim.scaled(0.5);
        const min = b.transform.worldPosition.minus(half);
        const max = b.transform.worldPosition.plus(half);

        const closest = new Vector2(
            Math.max(min.x, Math.min(a.transform.worldPosition.x, max.x)),
            Math.max(min.y, Math.min(a.transform.worldPosition.y, max.y))
        );

        const diff = closest.minus(a.transform.worldPosition);
        const distance = diff.magnitude();

        // Circle center is inside the AABB.
        if (distance === 0) {
            let diff;
            const left = a.transform.worldPosition.x - min.x;
            const right = max.x - a.transform.worldPosition.x;
            const bottom = a.transform.worldPosition.y - min.y;
            const top = max.y - a.transform.worldPosition.y;

            const minDist = Math.min(left, right, bottom, top);

            if (minDist === left) {
                diff = new Vector2(-1, 0);
            } else if (minDist === right) {
                diff = new Vector2(1, 0);
            } else if (minDist === bottom) {
                diff = new Vector2(0, -1);
            } else {
                diff = new Vector2(0, 1);
            }

            return {
                isCollision: true,
                normal: diff,
                penetration: circle.radius + minDist
            };
        }

        return {
            isCollision: distance < circle.radius,
            normal: diff.normalized(),
            penetration: circle.radius - distance
        };
    }
    static AABBAABB(a: CollisionObject, b: CollisionObject) {
        return {
            isCollision: false,
            normal: new Vector2(0,0),
            penetration: 0
        };
    }
}
