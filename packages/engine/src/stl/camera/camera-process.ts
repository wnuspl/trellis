import {Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {CameraOperator} from "./camera-operator-component.js";
import {Transform} from "../../core/index.js";

export class CameraProcess extends Process {
    update(ctx: InstanceContext) {
        const candidates = ctx.scene.query([CameraOperator]);
        if (candidates.length == 0) {
            this.application.syncCamera();
            return;
        }
        const target = candidates[0]!;
        const cameraOperator = target.get(CameraOperator)!;
        this.application.camera = cameraOperator.camera;
        this.application.camera.position = target.transform.worldPosition.plus(cameraOperator.position);
        this.application.syncCamera();
    }
}