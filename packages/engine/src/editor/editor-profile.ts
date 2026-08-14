import {Profile, type ProfileConfig} from "../instance/index.js";
import {CreateProcess, DestroyProcess, SceneTransferProcess, Tags, Transform, TransformProcess} from "../core/index.js";
import {
    CameraOperator,
    CameraProcess,
    Collider,
    OnclickProcess, SceneLoader,
    SpriteRenderer,
    SpriteRenderProcess
} from "../stl/index.js";
import {SelectionProcess} from "./selection-process.js";
import {SelectionRenderProcess} from "./selection-render-process.js";
import type {EditorContext} from "./editor-context.js";
import {SelectionEditProcess} from "./selection-edit-process.js";
import {GameObjectBuildProcess} from "./game-object-build-process.js";
import {SaveProcess} from "./save-process.js";

export class EditorProfile extends Profile {
    editorCtx: EditorContext;
    constructor(config: ProfileConfig & { sceneLoader: SceneLoader, scenePath: string }) {
        super(config);
        this.editorCtx = {
            selected: null,
            mode: "position",
            sceneLoader: config.sceneLoader,
            scenePath: config.scenePath,
        };
    }
    async init() {
        const instance = this.instance;
        instance.registry.registerComponent(
            Transform, Tags, CameraOperator, Collider, SpriteRenderer,
        );
        instance.registerProcess(SceneTransferProcess);
        instance.registerProcess(DestroyProcess);
        instance.registerProcess(CreateProcess);
        instance.registerProcess(TransformProcess);
        instance.registerProcess(SpriteRenderProcess);
        instance.registerProcess(OnclickProcess);
        instance.registerProcess(CameraProcess);
        instance.registerProcess(SelectionProcess, { editorContext: this.editorCtx });
        instance.registerProcess(SelectionRenderProcess, { editorContext: this.editorCtx });
        instance.registerProcess(SelectionEditProcess, { editorContext: this.editorCtx });
        instance.registerProcess(GameObjectBuildProcess, { editorContext: this.editorCtx });
        instance.registerProcess(SaveProcess, { editorContext: this.editorCtx });
        const scene = instance.createScene(this.editorCtx.scenePath);
        scene.onInit(async (scene) => {
            await this.editorCtx.sceneLoader.load(scene, this.editorCtx.scenePath);
        })
        instance.systems.sceneManager.setScene(this.editorCtx.scenePath);
        await super.init();
    }
}
