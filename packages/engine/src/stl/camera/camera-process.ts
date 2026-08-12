import {Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {CameraOperator} from "./camera-operator-aspect.js";

export class CameraProcess extends Process {
    update(ctx: InstanceContext) {
        const oldCamera = this.application.camera;
        const candidates = ctx.scene.query([CameraOperator]);
        if (candidates.length == 0) return;
        const newCamera = candidates[0]!.get(CameraOperator)!.camera;
        if (oldCamera !== newCamera) {
            this.application.camera = newCamera;
        }
    }
}