import {Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {DynamicsProcess} from "./dynamics-process.js";
import {CollisionProcess} from "./collision-process.js";
import {ResolutionProcess} from "./resolution-process.js";
import {FrameEventStore} from "../../events.js";
import {TransformProcess} from "../../core/index.js";

export class PhysicsProcess extends Process {
    static SUB_STEPS: number = 4;
    #dynamicProcess: DynamicsProcess;
    #collisionProcess: CollisionProcess;
    #resolutionProcess: ResolutionProcess;
    #transformProcess: TransformProcess;
    constructor(...args: ConstructorParameters<typeof Process>) {
        super(...args);
        this.#dynamicProcess = new DynamicsProcess(...args);
        this.#collisionProcess = new CollisionProcess(...args);
        this.#resolutionProcess = new ResolutionProcess(...args);
        this.#transformProcess = new TransformProcess(...args);
    }

    update(ctx: InstanceContext) {
        for (let i=0; i<PhysicsProcess.SUB_STEPS; i++) {
            const subCtx = {
                ...ctx,
                dt: ctx.dt/PhysicsProcess.SUB_STEPS,
                events: new FrameEventStore(),
            };
            this.#dynamicProcess.update(subCtx);
            this.#transformProcess.update(subCtx);
            this.#collisionProcess.update(subCtx);
            this.#resolutionProcess.update(subCtx);
        }
    }
}