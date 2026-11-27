import {Vector2} from "../utils/index.js";
import type {MouseButton} from "./input-system.js";

// PointerEvent.buttons is a bitmask of the buttons held right now.
const buttonBits: [number, MouseButton][] = [
    [1, "left"],
    [2, "right"],
    [4, "middle"],
];

/**
 * Mouse, touch and pen through Pointer Events. A touch or pen contact counts
 * as the "left" button; only the primary pointer (the mouse, or the first
 * finger down) is tracked.
 */
export class DomMouseInput {
    #mouseUpQueue: Set<MouseButton>;
    #mouseDownQueue: Set<MouseButton>;
    #mouseUp: Set<MouseButton>;
    #mouseDown: Set<MouseButton>;
    #mouseHeld: Set<MouseButton>;
    #screenPosition: Vector2 | null;
    #mount: HTMLElement | null = null;
    #buttons = 0;
    constructor() {
        this.#mouseUpQueue = new Set();
        this.#mouseDownQueue = new Set();
        this.#mouseUp= new Set();
        this.#mouseDown= new Set();
        this.#mouseHeld = new Set();
        this.#screenPosition = null;
    }
    init(mount: HTMLElement) {
        this.#mount = mount;
        // Without this, touch drags scroll or zoom the page and fire pointercancel.
        mount.style.touchAction = "none";

        mount.addEventListener("pointerdown", (e) => {
            if (!e.isPrimary) return;
            // Keep receiving moves and the release even if the pointer leaves the element.
            mount.setPointerCapture(e.pointerId);
            this.#handle(e, e.buttons);
            e.preventDefault();
        });
        mount.addEventListener("pointermove", (e) => {
            if (!e.isPrimary) return;
            // Pressing a second mouse button while one is held fires pointermove, not pointerdown.
            this.#handle(e, e.buttons);
            e.preventDefault();
        });
        mount.addEventListener("pointerup", (e) => {
            if (!e.isPrimary) return;
            this.#handle(e, e.buttons);
            e.preventDefault();
        });
        // The browser took the pointer away (e.g. a system gesture): treat it as a release.
        mount.addEventListener("pointercancel", (e) => {
            if (!e.isPrimary) return;
            this.#handle(e, 0);
        });
        mount.addEventListener("pointerenter", (e) => {
            if (!e.isPrimary) return;
            this.#screenPosition = this.toScreenPosition(e.clientX, e.clientY);
        });
    }
    #handle(e: PointerEvent, buttons: number) {
        this.#screenPosition = this.toScreenPosition(e.clientX, e.clientY);
        const pressed = buttons & ~this.#buttons;
        const released = this.#buttons & ~buttons;
        for (const [bit, button] of buttonBits) {
            if (pressed & bit) this.#mouseDownQueue.add(button);
            if (released & bit) this.#mouseUpQueue.add(button);
        }
        this.#buttons = buttons;
    }
    toScreenPosition(offsetX: number, offsetY: number) {
        if (this.#mount == null) throw new Error("Tried toScreenPosition before initialization");
        return new Vector2(
            offsetX - this.#mount.clientWidth/2,
            -1*(offsetY - this.#mount.clientHeight/2),
        );
    }
    update() {
        this.#mouseUp.clear();
        this.#mouseUp = this.#mouseUpQueue;
        this.#mouseUpQueue = new Set();

        this.#mouseDown.clear();
        this.#mouseDown = this.#mouseDownQueue;
        this.#mouseDownQueue = new Set();

        for (const mouseButton of this.#mouseDown) {
            this.#mouseHeld.add(mouseButton);
        }
        for (const mouseButton of this.#mouseUp) {
            this.#mouseHeld.delete(mouseButton);
        }
    }
    mouseScreenPosition(){
        if (this.#screenPosition == null) throw new Error("Tried  get screenPosition before initialization");
        return this.#screenPosition;
    }
    isMouseDown(button: MouseButton) {
        return this.#mouseDown.has(button);
    }
    isMouseUp(button: MouseButton) {
        return this.#mouseUp.has(button);
    }
    isMouseHeld(button: MouseButton) {
        return this.#mouseHeld.has(button);
    }
}
