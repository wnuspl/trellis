export class DomKeyboardInput {
    keyHeld: Set<string>;
    #keyDown: Set<string>;
    #keyUp: Set<string>;
    #keyDownQueue: Set<string>;
    #keyUpQueue: Set<string>;
    constructor() {
        this.keyHeld = new Set();
        this.#keyDown = new Set();
        this.#keyUp = new Set();
        this.#keyDownQueue = new Set();
        this.#keyUpQueue = new Set();
    }
    init(mount: HTMLElement) {
        mount.addEventListener("keydown", (e) => {
            e.preventDefault();
            if (e.repeat) return;
            const keyCode = e.code;
            this.#keyDownQueue.add(keyCode);
        });
        mount.addEventListener("keyup", (e) => {
            e.preventDefault();
            const keyCode = e.code;
            this.#keyUpQueue.add(keyCode);
        });
    }
    update() {
        this.#keyDown.clear();
        this.#keyDown = this.#keyDownQueue;
        this.#keyDownQueue = new Set();

        this.#keyUp.clear();
        this.#keyUp = this.#keyUpQueue;
        this.#keyUpQueue = new Set();


        for (const keyDownCode of this.#keyDown) {
            this.keyHeld.add(keyDownCode);
        }
        for (const keyUpCode of this.#keyUp) {
            this.keyHeld.delete(keyUpCode);
        }
    }
    isKeyUp(keyCode: string) {
        return this.#keyUp.has(keyCode);
    }
    isKeyDown(keyCode: string) {
        return this.#keyDown.has(keyCode);
    }
    isKeyHeld(keyCode: string) {
        return this.keyHeld.has(keyCode);
    }
}