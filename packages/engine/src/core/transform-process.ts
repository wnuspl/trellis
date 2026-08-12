import {GameObject, Process} from "../model/index.js";
import type {InstanceContext} from "../instance/index.js";
import { Transform } from "./transform.js";
import {Vector2} from "../utils/index.js";

export class TransformProcess extends Process {
    update(ctx: InstanceContext) {
        const root = ctx.scene.root;
        if (!root) return;
        root.modify(Transform, (transform) => {
            transform.worldPosition = transform.position;
            transform.worldRotation = transform.rotation;
            transform.worldScale = transform.scale;
        })
        this.updateChildrenTransform(ctx, root);
    }
    updateChildrenTransform(ctx: InstanceContext, parent: GameObject) {
        const parentTransform = parent.get(Transform);
        const children = ctx.scene.getChildren(parent);
        for (const child of children) {
            child.modify(Transform, (transform) => {
                TransformProcess.applyParentTransform(transform, parentTransform);
                this.updateChildrenTransform(ctx, child);
            })
        }
    }
    static applyParentTransform(childTransform: Transform, parentTransform: Transform) {
        const scaledChildPosition = new Vector2(
            childTransform.position.x * parentTransform.worldScale.x,
            childTransform.position.y * parentTransform.worldScale.y,
        );
        childTransform.worldPosition = parentTransform.worldPosition.plus(scaledChildPosition);
        childTransform.worldRotation = parentTransform.worldRotation + childTransform.rotation;
        childTransform.worldScale = new Vector2(
            childTransform.scale.x * parentTransform.worldScale.x,
            childTransform.scale.y * parentTransform.worldScale.y,
        );
    }
}