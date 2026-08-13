import {Aspect} from "../../model/index.js";
import {Camera} from "../../pixijs/camera.js";
import {Vector2} from "../../utils/index.js";

export class CameraOperator extends Aspect {
    #camera: Camera;
    position: Vector2;
    constructor(args?: { position?: Vector2, zoom?: number }) {
        super();
        this.#camera = new Camera(new Vector2(0,0), args?.zoom ?? 1);
        this.position = args?.position ?? new Vector2(0,0);
    }
    get camera(): Camera {
        return this.#camera;
    }
    set zoom(zoom: number) {
        this.#camera.zoom = zoom;
    }
    get zoom() {
        return this.#camera.zoom;
    }
}