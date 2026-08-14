import {GameObject, Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {FrameEvent} from "../../events.js";
import type {MouseButton} from "../../input/input-system.js";
import {AABBCollider, CircleCollider, Collider, ColliderShape} from "./collider-component.js";
import {Transform} from "../../core/index.js";

export class OnclickEvent extends FrameEvent {
    involvedGameObjects: Set<GameObject>;
    button: MouseButton;
    constructor(target: GameObject, button: MouseButton) {
        super();
        this.involvedGameObjects = new Set([target]);
        this.button = button;
    }
    gameObject() {
        return this.involvedGameObjects.values().next().value!;
    }
    static wasClicked(target: GameObject, ctx: InstanceContext, button: MouseButton) {
        for (const clickEvent of ctx.events.getFor(OnclickEvent, target)) {
            if (clickEvent.button === button) return true;
        }
        return false;
    }
}

export class OnclickProcess extends Process {
    update(ctx: InstanceContext) {
        const buttons: MouseButton[] = [];
        if (ctx.input.isMouseDown("left")) buttons.push("left");
        if (ctx.input.isMouseDown("right")) buttons.push("right");
        if (ctx.input.isMouseDown("middle")) buttons.push("middle");
        if (buttons.length == 0) return;

        const gameObjects = ctx.scene.query([Collider]);
        for (const gameObject of gameObjects) {
            const transform = gameObject.get(Transform);
            const colliderWorldShape = gameObject.get(Collider)!.shape.worldShape(transform);
            const mouseWorldPosition = ctx.camera.toWorldPosition(
                ctx.input.mouseScreenPosition()
            );
            if (colliderWorldShape instanceof CircleCollider) {
                const distance = transform.worldPosition.minus(mouseWorldPosition).magnitude();
                if (distance < colliderWorldShape.radius) {
                    for (const button of buttons) {
                        ctx.events.post(new OnclickEvent(gameObject, button));
                    }
                }
            }
            if (colliderWorldShape instanceof AABBCollider) {
                const halfDim = colliderWorldShape.dim.scaled(0.5);
                const relative = mouseWorldPosition.minus(transform.worldPosition);

                if (Math.abs(relative.x) < halfDim.x && Math.abs(relative.y) < halfDim.y) {
                    for (const button of buttons) {
                        ctx.events.post(new OnclickEvent(gameObject, button));
                    }
                }
            }
        }
    }
}