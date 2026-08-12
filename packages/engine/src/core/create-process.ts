import {Process} from "../model/index.js";
import type {InstanceContext} from "../instance/index.js";
import {FrameRequest} from "../requests.js";
import type {GameObject} from "../model/index.js";
import {Blueprint} from "../model/index.js";
import type {SceneTransferRequest} from "./scene-transfer-process.js";

export class CreateRequest extends FrameRequest {
    blueprint: Blueprint;
    parent: GameObject | undefined;
    constructor(blueprint: Blueprint, parent?: GameObject) {
        super();
        this.blueprint = blueprint;
        this.parent = parent;
    }
    static post(ctx: SceneTransferRequest,) {}
}

export class CreateProcess extends Process {
    update(ctx: InstanceContext) {
        for (const createRequest of ctx.requests.get(CreateRequest)) {
            ctx.scene.build(createRequest.blueprint, createRequest.parent);
        }
    }
}
