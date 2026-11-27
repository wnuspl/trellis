import {Process} from "../model/index.js";
import type {InstanceContext} from "../instance/index.js";
import {FrameRequest} from "../requests.js";
import type {GameObject} from "../model/index.js";
import {Blueprint} from "../model/index.js";
import type {SceneTransferRequest} from "./scene-transfer-process.js";

export class CreateRequest extends FrameRequest {
    blueprint: Blueprint;
    parent: GameObject | undefined;
    onInit: ((gameObject: GameObject) => void) | undefined;
    constructor(blueprint: Blueprint, parent?: GameObject, onInit?: (gameObject: GameObject) => void) {
        super();
        this.blueprint = blueprint;
        this.parent = parent;
        this.onInit = onInit;
    }
    static post(ctx: SceneTransferRequest,) {}
}

export class CreateProcess extends Process {
    update(ctx: InstanceContext) {
        for (const createRequest of ctx.requests.get(CreateRequest)) {
            const gameObject = ctx.scene.build(createRequest.blueprint, createRequest.parent);
            if (createRequest.onInit) {
                createRequest.onInit(gameObject);
            }
        }
    }
}
