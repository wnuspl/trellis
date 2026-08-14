import {Behavior, type BehaviorContext} from "../../model/behavior.js";
import type {InstanceContext} from "../../instance/index.js";
import {CameraOperator} from "./camera-operator-component.js";
import {Transform} from "../../core/index.js";
import {Vector2} from "../../utils/index.js";

export class UIParentBehavior extends Behavior {
    update(ctx: BehaviorContext) {
        const camera = ctx.camera;

        this.gameObject.transform.position = camera.position;
    }
}