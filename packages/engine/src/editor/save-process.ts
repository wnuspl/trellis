import {Process, type ProcessConfig} from "../model/index.js";
import type {EditorContext} from "./editor-context.js";
import type {InstanceContext} from "../instance/index.js";

export class SaveProcess extends Process {
    editorCtx: EditorContext;
    constructor(processContext: ProcessConfig, config: { editorContext: EditorContext }) {
        super(processContext);
        this.editorCtx = config.editorContext;
    }
    update(ctx: InstanceContext) {
        if (ctx.input.isKeyDown("Enter")) {
            this.editorCtx.sceneLoader.save(ctx.scene, this.editorCtx.scenePath);
        }
    }
}