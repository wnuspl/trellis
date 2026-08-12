import {Process} from "../model/process.js";
import type {InstanceContext} from "../instance/instance-context.js";
import {FrameRequest} from "../requests.js";
import type {GameObject} from "../model/game-object.js";

export class DestroyRequest extends FrameRequest {
    gameObject: GameObject;
    constructor(gameObject: GameObject) {
        super();
        this.gameObject = gameObject;
    }
}

export class DestroyProcess extends Process {
    update(ctx: InstanceContext) {
        for (const destroyRequest of ctx.requests.get(DestroyRequest)) {
            ctx.scene.destroyGameObject(destroyRequest.gameObject);
        }
    }
}