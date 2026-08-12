import {Aspect} from "../../model/index.js";
import {Camera} from "../../pixijs/camera.js";
import {Vector2} from "../../utils/index.js";

export class CameraOperator extends Aspect {
    #camera: Camera;
    constructor(args?: { position?: Vector2, zoom?: number }) {
        super();
        this.#camera = new Camera(args?.position ?? new Vector2(0,0), args?.zoom ?? 1);
    }
    get camera(): Camera {
        return this.#camera;
    }
    set position(position: Vector2) {
        this.#camera.position = position;
    }
    get position() {
        return this.#camera.position
    }
    set zoom(zoom: number) {
        this.#camera.zoom = zoom;
    }
    get zoom() {
        return this.#camera.zoom;
    }
}