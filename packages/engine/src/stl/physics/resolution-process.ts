import {Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {CollisionEvent} from "./collision-process.js";
import {Transform} from "../../core/index.js";
import {PhysicsBody} from "./physics-body-aspect.js";

export class ResolutionProcess extends Process {
    update(ctx: InstanceContext) {
        for (const collision of ctx.events.get(CollisionEvent)) {
            const {
                a,
                b,
                manifold
            } = collision;
            const {
                normal,
                penetration
            } = manifold;

            // adjust position
            const physicsBodyA = a.get(PhysicsBody);
            const physicsBodyB = b.get(PhysicsBody);
            if (!physicsBodyA || !physicsBodyB) continue;
            const invMassA = physicsBodyA.static ? 0 : 1/physicsBodyA.mass;
            const invMassB = physicsBodyB.static ? 0 : 1/physicsBodyB.mass;
            const invMassTotal = invMassA + invMassB;
            const diffA = normal.scaled(penetration * invMassA/invMassTotal);
            const diffB = normal.scaled(penetration * invMassB/invMassTotal);
            a.get(Transform).position.subtract(diffA);
            b.get(Transform).position.add(diffB);


            const relativeVelocity = physicsBodyB.velocity.minus(physicsBodyA.velocity);
            const velocityAlongNormal = relativeVelocity.dot(normal);
            if (velocityAlongNormal > 0) return;
            // using max
            const e = Math.max(physicsBodyA.restitution, physicsBodyB.restitution);
            const j = -(1 + e) * velocityAlongNormal
                / (invMassA + invMassB);
            const impulse = normal.scaled(j);
            if (impulse.magnitude() < 0.4) return;
            physicsBodyA.velocity.subtract(impulse.scaled(invMassA));
            physicsBodyB.velocity.add(impulse.scaled(invMassB));

        }
    }
}