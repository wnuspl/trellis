import {Process, type ProcessConfig} from "../model/index.js";
import type {EditorContext} from "./editor-context.js";
import type {InstanceContext} from "../instance/index.js";
import {Vector2} from "../utils/index.js";
import {Transform} from "../core/index.js";

export class SelectionEditProcess extends Process {
    editorCtx: EditorContext;

    constructor(processContext: ProcessConfig, config: { editorContext: EditorContext }) {
        super(processContext);
        this.editorCtx = config.editorContext;
    }

    update(ctx: InstanceContext) {
        if (ctx.input.isKeyDown("KeyQ")) {
            if (this.editorCtx.mode === "position") this.editorCtx.mode = "scale";
            else if (this.editorCtx.mode === "scale") this.editorCtx.mode = "position";
        }
        if (!this.editorCtx.selected) return;
        const direction = new Vector2(0,0);
        if (ctx.input.isKeyHeld("KeyA")) direction.x += -1;
        if (ctx.input.isKeyHeld("KeyD")) direction.x += 1;
        if (ctx.input.isKeyHeld("KeyW")) direction.y += 1;
        if (ctx.input.isKeyHeld("KeyS")) direction.y += -1;
        const transform = this.editorCtx.selected.transform;
        if (this.editorCtx.mode === "position") {
            const movement = direction.normalized().scaled(1.5*ctx.dt);
            transform.position.add(movement);
        }
        if (this.editorCtx.mode === "scale") {
            const movement = direction.normalized().scaled(0.05*ctx.dt);
            transform.scale.add(movement);
        }
    }
}