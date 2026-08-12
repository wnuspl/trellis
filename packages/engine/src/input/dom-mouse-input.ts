import {Vector2} from "../utils/index.js";
import type {MouseButton} from "./input-system.js";

const mouseButtonMap: Map<number, MouseButton> = new Map([
    [0, "left"],
    [1, "middle"],
    [2, "right"],
]);
export class DomMouseInput {
    #mouseUpQueue: Set<MouseButton>;
    #mouseDownQueue: Set<MouseButton>;
    #mouseUp: Set<MouseButton>;
    #mouseDown: Set<MouseButton>;
    #mouseHeld: Set<MouseButton>;
    #screenPosition: Vector2 | null;
    #mount: HTMLElement | null = null;
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
        mount.addEventListener("mousedown", (e) => {
            this.#mouseDownQueue.add(mouseButtonMap.get(e.button)!);
            e.preventDefault();
        });
        mount.addEventListener("mouseup", (e) => {
            this.#mouseUpQueue.add(mouseButtonMap.get(e.button)!);
            e.preventDefault();
        });
        mount.addEventListener("mousemove", (e) => {
            this.#screenPosition = this.toScreenPosition(e.clientX, e.clientY);
            e.preventDefault();
        })
        mount.addEventListener("mouseenter", (e) => {
            this.#screenPosition = this.toScreenPosition(e.clientX, e.clientY);
            e.preventDefault();
        });
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