import {Vector2} from "../utils/index.js";

/**
 * Camera position is stored in world space (y up). The flip to Pixi's
 * y-down render space happens in PixiApplication.syncCamera.
 */
export class Camera {
    #position: Vector2;
    zoom: number;
    baseScale: number;
    constructor(position?: Vector2, zoom?: number) {
        this.#position = position?.clone() ?? new Vector2(0,0);
        this.zoom = zoom ?? 1;
        this.baseScale = 1; // provided by syncCamera
    }
    get position() {
        return this.#position;
    }
    set position(position: Vector2) {
        this.#position = position.clone();
    }
    /**
     * Converts a screen position (pixels from the screen center, y up, as
     * produced by the mouse input) to a world position.
     */
    toWorldPosition(screenPosition: Vector2) {
        return screenPosition.scaled(1/(this.baseScale * this.zoom)).plus(this.#position);
    }
}
