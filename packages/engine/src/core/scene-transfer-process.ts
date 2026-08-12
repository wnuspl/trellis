import {FrameRequest} from "../requests.js";
import {Process} from "../model/index.js";
import type {InstanceContext} from "../instance/index.js";

export class SceneTransferRequest extends FrameRequest {
    targetAlias: string;
    constructor(targetAlias: string) {
        super();
        this.targetAlias = targetAlias;
    }
}

export class SceneTransferProcess extends Process {
    update(ctx: InstanceContext) {
        for (const sceneTransferRequest of ctx.requests.get(SceneTransferRequest)) {
            this.sceneManager.setScene(sceneTransferRequest.targetAlias);
        }
    }
}
