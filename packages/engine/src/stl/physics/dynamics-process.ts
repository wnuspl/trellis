import {Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {Transform} from "../../core/index.js";
import {PhysicsBody} from "./physics-body-component.js";

export class DynamicsProcess extends Process {
    static GRAVITY_ACCELERATION: number = -0.35;
    update(ctx: InstanceContext) {
        const gameObjects = ctx.scene.query([Transform, PhysicsBody]);
        for (let i=0; i<gameObjects.length; i++) {
            const gameObject = gameObjects[i]!;
            const transform = gameObject.get(Transform)!;
            const physicsBody = gameObject.get(PhysicsBody)!;

            const dv = physicsBody.gravityScale*DynamicsProcess.GRAVITY_ACCELERATION*ctx.dt;
            physicsBody.velocity.y += dv;

            transform.position.add(physicsBody.velocity.scaled(ctx.dt));
        }
    }

}

