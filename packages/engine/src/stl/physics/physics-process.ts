import {GameObject, Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {DynamicsProcess} from "./dynamics-process.js";
import {CollisionEvent, CollisionProcess} from "./collision-process.js";
import {ResolutionProcess} from "./resolution-process.js";
import {FrameEventStore} from "../../events.js";
import {TransformProcess} from "../../core/index.js";

export class PhysicsProcess extends Process {
    static SUB_STEP_SIZE: number = 0.25;
    #dynamicProcess: DynamicsProcess;
    #collisionProcess: CollisionProcess;
    #resolutionProcess: ResolutionProcess;
    #transformProcess: TransformProcess;
    #residualTime: number = 0;
    constructor(...args: ConstructorParameters<typeof Process>) {
        super(...args);
        this.#dynamicProcess = new DynamicsProcess(...args);
        this.#collisionProcess = new CollisionProcess(...args);
        this.#resolutionProcess = new ResolutionProcess(...args);
        this.#transformProcess = new TransformProcess(...args);
    }

    update(ctx: InstanceContext) {
        const collisionKey = (a: GameObject, b: GameObject) => {
            const idA = a.uuid.id;
            const idB = b.uuid.id;
            return `${Math.min(idA,idB)},${Math.max(idA,idB)}`;
        };
        const collisionPairs: Set<string> = new Set();
        this.#residualTime += ctx.dt;
        while (this.#residualTime >= PhysicsProcess.SUB_STEP_SIZE) {
            const subCtx = {
                ...ctx,
                dt: PhysicsProcess.SUB_STEP_SIZE,
                events: new FrameEventStore(),
            };
            this.#dynamicProcess.update(subCtx);
            this.#transformProcess.update(subCtx);
            this.#collisionProcess.update(subCtx);
            this.#resolutionProcess.update(subCtx);
            for (const collisionEvent of subCtx.events.get(CollisionEvent)) {
                const key = collisionKey(collisionEvent.a, collisionEvent.b);
                if (collisionPairs.has(key)) continue;
                collisionPairs.add(key);
                ctx.events.post(collisionEvent);
            }

            this.#residualTime -= PhysicsProcess.SUB_STEP_SIZE;
        }
    }
}