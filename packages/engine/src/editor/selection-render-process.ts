import {GameObject, Process, type ProcessContext} from "../model/index.js";
import type {EditorContext} from "./editor-context.js";
import type {InstanceContext} from "../instance/index.js";
import {AABBCollider, CircleCollider, Collider, OnclickEvent} from "../stl/index.js";
import {WorldGraphics} from "../pixijs/index.js";
import {Transform} from "../core/index.js";

export class SelectionRenderProcess extends Process {
    editorCtx: EditorContext;
    cachedGameObject: GameObject | null = null;
    graphics: WorldGraphics | null = null;
    constructor(processContext: ProcessContext, config: { editorContext: EditorContext }) {
        super(processContext);
        this.editorCtx = config.editorContext;
    }
    update(ctx: InstanceContext) {
        if (this.editorCtx.selected) {
            const collider = this.editorCtx.selected.get(Collider);
            if (this.cachedGameObject !== this.editorCtx.selected) this.destroyGraphics();
            if (collider && !this.graphics) {
                const transform = this.editorCtx.selected.get(Transform);
                this.graphics = new WorldGraphics();
                const colliderWorldShape = collider.shape.worldShape(transform);
                if (colliderWorldShape instanceof AABBCollider) {
                    this.graphics.addRectOutline({
                        dim: colliderWorldShape.dim,
                        color: "#00ff00"
                    });
                } else if (colliderWorldShape instanceof CircleCollider) {
                    this.graphics.addCircleOutline({
                        radius: colliderWorldShape.radius,
                        color: "#ff0000"
                    });
                }
                this.application.add(this.graphics.graphics);
                this.graphics.position = transform.position;
                this.graphics.rotation = transform.rotation;
            }
        } else if (this.graphics) this.destroyGraphics();
    }
    destroyGraphics() {
        this.graphics?.destroy();
        this.graphics = null;
    }
}