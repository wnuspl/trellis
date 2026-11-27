import {Profile, type ProfileConfig} from "../instance/index.js";
import {BroadcastProcess, CreateProcess, DestroyProcess, SceneTransferProcess, Transform, TransformProcess} from "../core/index.js";
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
            Transform, CameraOperator, Collider, SpriteRenderer,
        );
        instance.registerProcess(SceneTransferProcess);
        // Before DestroyProcess, so its DestroyRequest is handled this frame (requests are cleared after processes).
        instance.registerProcess(SelectionEditProcess, { editorContext: this.editorCtx });
        instance.registerProcess(DestroyProcess);
        instance.registerProcess(CreateProcess);
        instance.registerProcess(BroadcastProcess);
        instance.registerProcess(TransformProcess);
        instance.registerProcess(SpriteRenderProcess);
        instance.registerProcess(OnclickProcess);
        instance.registerProcess(CameraProcess);
        instance.registerProcess(SelectionProcess, { editorContext: this.editorCtx });
        instance.registerProcess(SelectionRenderProcess, { editorContext: this.editorCtx });
        instance.registerProcess(GameObjectBuildProcess, { editorContext: this.editorCtx });
        instance.registerProcess(SaveProcess, { editorContext: this.editorCtx });
        const scene = instance.createScene(this.editorCtx.scenePath);
        scene.onInit(async (scene) => {
            await this.editorCtx.sceneLoader.load(scene, this.editorCtx.scenePath);
        })
        instance.systems.sceneManager.setScene(this.editorCtx.scenePath);

        // Editor-only console handle: `$.PlanetState.mass = 5` edits the selected object's component.
        const editorCtx = this.editorCtx;
        (globalThis as any).$ = new Proxy({}, {
            get(_, name) {
                const go = editorCtx.selected;
                if (!go) { console.warn("Nothing selected"); return undefined; }
                if (name === "go") return go;
                const component = go.components.find(c => c.constructor.name === name);
                if (!component) {
                    console.warn(`Selected object has no ${String(name)}. Has: ${go.components.map(c => c.constructor.name).join(", ")}`);
                }
                return component;
            },
            ownKeys() {
                return editorCtx.selected?.components.map(c => c.constructor.name) ?? [];
            },
            getOwnPropertyDescriptor() {
                return { enumerable: true, configurable: true };
            },
        });

        await super.init();
    }
}
