import {Vector2} from "../utils/index.js";

export type MouseButton = "left" | "middle" | "right";

export type InputSystem = {
    init(mount: HTMLElement): void;
    update(): void;
    mouseScreenPosition(): Vector2;
    isMouseDown(button: MouseButton): boolean;
    isMouseUp(button: MouseButton): boolean;
    isMouseHeld(button: MouseButton): boolean;
    isKeyUp(keyCode: string): boolean
    isKeyDown(keyCode: string): boolean;
    isKeyHeld(keyCode: string): boolean;
}
