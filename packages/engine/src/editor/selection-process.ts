import {Process, type ProcessContext} from "../model/index.js";
import type {InstanceContext} from "../instance/index.js";
import type {EditorContext} from "./editor-context.js";
import {OnclickEvent} from "../stl/index.js";

export class SelectionProcess extends Process {
    editorCtx: EditorContext;
    constructor(processContext: ProcessContext, config: { editorContext: EditorContext }) {
        super(processContext);
        this.editorCtx = config.editorContext;
    }
    update(ctx: InstanceContext) {
        if (ctx.input.isMouseDown("left")) this.editorCtx.selected = null;
        for (const onclickEvent of ctx.events.get(OnclickEvent)) {
            this.editorCtx.selected = onclickEvent.gameObject();
        }
    }
}