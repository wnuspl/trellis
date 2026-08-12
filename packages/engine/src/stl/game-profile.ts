import {Profile} from "../instance/index.js";
import {CreateProcess, DestroyProcess, SceneTransferProcess, Tags, Transform, TransformProcess} from "../core/index.js";
import {Collider, OnclickProcess, PhysicsBody, PhysicsProcess} from "./physics/index.js";
import {SpriteAnimationProcess, SpriteRenderer, SpriteRenderProcess} from "./render/index.js";
import {CameraOperator, CameraProcess } from "./camera/index.js";

export class GameProfile extends Profile {
    async init() {
        const instance = this.instance;
        instance.registry.registerAspect(
            Transform, Tags, CameraOperator, Collider, PhysicsBody, SpriteRenderer,
        );
        instance.registerProcess(SceneTransferProcess);
        instance.registerProcess(DestroyProcess);
        instance.registerProcess(CreateProcess);
        instance.registerProcess(PhysicsProcess);
        instance.registerProcess(TransformProcess);
        instance.registerProcess(SpriteAnimationProcess);
        instance.registerProcess(SpriteRenderProcess);
        instance.registerProcess(OnclickProcess);
        instance.registerProcess(CameraProcess)
        await super.init();
    }
}