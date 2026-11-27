import {Process, type ProcessConfig} from "../model/index.js";
import type {EditorContext} from "./editor-context.js";
import type {InstanceContext} from "../instance/index.js";
import {Vector2} from "../utils/index.js";
import {DestroyRequest, Transform} from "../core/index.js";

export class SelectionEditProcess extends Process {
    editorCtx: EditorContext;
    nudge: Vector2 = new Vector2(0,0);

    constructor(processContext: ProcessConfig, config: { editorContext: EditorContext }) {
        super(processContext);
        this.editorCtx = config.editorContext;
    }

    update(ctx: InstanceContext) {
        if (ctx.input.isKeyDown("KeyQ")) {
            if (this.editorCtx.mode === "position") this.editorCtx.mode = "scale";
            else if (this.editorCtx.mode === "scale") this.editorCtx.mode = "rotation";
            else if (this.editorCtx.mode === "rotation") this.editorCtx.mode = "position";
        }
        if (!this.editorCtx.selected) return;

        if (ctx.input.isKeyDown("KeyX")) {
            new DestroyRequest(this.editorCtx.selected).post(ctx);
            this.editorCtx.selected = null;
            return;
        }
        const direction = new Vector2(0,0);
        if (ctx.input.isKeyHeld("KeyA")) direction.x += -1;
        if (ctx.input.isKeyHeld("KeyD")) direction.x += 1;
        if (ctx.input.isKeyHeld("KeyW")) direction.y += 1;
        if (ctx.input.isKeyHeld("KeyS")) direction.y += -1;
        const transform = this.editorCtx.selected.transform;

        if (direction.x === 0 && direction.y === 0) this.nudge = new Vector2(0, 0);
        const step = { position: 5, scale: 0.25, rotation: Math.PI/72 }[this.editorCtx.mode];
        let rate = { position: 16, scale: 4, rotation: 12 }[this.editorCtx.mode];

        if (ctx.input.isKeyHeld("ShiftLeft")) rate *= 0.1;

        // rawDt is Pixi deltaTime in frames (~1 at 60fps), so /60 gives seconds
        this.nudge.add(direction.normalized().scaled(rate * ctx.rawDt / 60));
        const sx = Math.trunc(this.nudge.x);
        const sy = Math.trunc(this.nudge.y);
        this.nudge.x -= sx;
        this.nudge.y -= sy;

        if (this.editorCtx.mode === "position") {
            transform.position.x += sx * step;
            transform.position.y += sy * step;
        }
        if (this.editorCtx.mode === "scale") {
            transform.scale.x = Math.round((transform.scale.x + sx * step) * 100) / 100;
            transform.scale.y = Math.round((transform.scale.y + sy * step) * 100) / 100;
        }
        if (this.editorCtx.mode === "rotation") {
            transform.rotation += sx * step;
        }
    }
}