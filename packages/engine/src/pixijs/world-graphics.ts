import {Graphics} from "pixi.js";
import {Vector2} from "../utils/index.js";
import {Transform} from "../core/index.js";

export class WorldGraphics {
    #graphics: Graphics;
    constructor() {
        this.#graphics = new Graphics();
    }
    set position(position: Vector2) {
        const renderPosition = new Vector2(position.x, -position.y);
        this.#graphics.position = renderPosition;
    }
    set rotation(rotation: number) {
        this.#graphics.rotation = rotation;
    }
    set scale(scale: Vector2) {
        this.#graphics.scale = scale;
    }
    applyTransform(transform: Transform) {
        this.position = transform.position;
        this.rotation = transform.rotation;
        this.scale = transform.scale;
    }
    get graphics() {
        return this.#graphics;
    }
    addCircleOutline({ radius, color }: { radius: number, color: string }) {
        this.#graphics
            .circle(0, 0, radius)
            .stroke({ width: 2, color});
    }
    addRectOutline({ dim, color }: { dim: Vector2, color: string }) {
        this.#graphics
            .rect(-dim.x/2, -dim.y/2, dim.x, dim.y)
            .stroke({ width: 2, color});
    }
    destroy() {
        this.#graphics.destroy();
    }
}
