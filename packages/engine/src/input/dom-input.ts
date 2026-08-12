import {DomMouseInput} from "./dom-mouse-input.js";
import {DomKeyboardInput} from "./dom-keyboard.input.js";
import {Vector2} from "../utils/index.js";
import type {MouseButton} from "./input-system.js";

export class DOMInput {
    mouse: DomMouseInput;
    keyboard: DomKeyboardInput;
    constructor() {
        this.mouse = new DomMouseInput();
        this.keyboard = new DomKeyboardInput();
    }
    init(mount: HTMLElement) {
        this.keyboard.init(mount);
        this.mouse.init(mount);
    }
    update() {
        this.keyboard.update();
        this.mouse.update();
    }
    mouseScreenPosition(): Vector2 {
        return this.mouse.mouseScreenPosition();
    }
    isMouseDown(button: MouseButton): boolean {
        return this.mouse.isMouseDown(button);
    }
    isMouseUp(button: MouseButton): boolean {
        return this.mouse.isMouseUp(button);
    }
    isMouseHeld(button: MouseButton): boolean {
        return this.mouse.isMouseHeld(button);
    }
    isKeyUp(keyCode: string): boolean {
        return this.keyboard.isKeyUp(keyCode);
    }
    isKeyDown(keyCode: string): boolean {
        return this.keyboard.isKeyDown(keyCode);
    }
    isKeyHeld(keyCode: string): boolean {
        return this.keyboard.isKeyHeld(keyCode);
    }
}
