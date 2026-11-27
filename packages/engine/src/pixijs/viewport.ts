import {Vector2} from "../utils/index.js";

export class Viewport {
    size: Vector2;
    mode: "fit" | "fill";
    constructor(size: Vector2, mode: "fit" | "fill") {
        this.size = size;
        this.mode = mode;
    }
    scale(displayWidth: number, displayHeight: number) {
        switch (this.mode) {
            case "fit": {
                const scaleX = displayWidth / this.size.x;
                const scaleY = displayHeight / this.size.y;
                return Math.min(scaleX, scaleY);
            }
            case "fill": {
                const scaleX = displayWidth / this.size.x;
                const scaleY = displayHeight / this.size.y;
                return Math.max(scaleX, scaleY);
            }
        }
    }
}
