import {Vector2} from "../utils/index.js";

export class Camera {
    #position: Vector2;
    zoom: number;
    constructor(position?: Vector2, zoom?: number) {
        this.#position = position ?? new Vector2(0,0);
        this.zoom = zoom ?? 1;
    }
    get position() {
        return this.#position;
    }
    set position(position: Vector2) {
        const renderPosition = new Vector2(position.x, -position.y);
        this.#position = renderPosition;
    }
    toWorldPosition(screenPosition: Vector2) {
        const offset = this.position.scaled(this.zoom);
        return screenPosition.plus(offset);
    }
}