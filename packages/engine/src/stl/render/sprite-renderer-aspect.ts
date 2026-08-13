import { Aspect } from "../../model/aspect.js";
import {Vector2} from "../../utils/index.js";

export class SpriteRenderer extends Aspect {
    textureAlias: string;
    opacity: number;
    scale: Vector2;
    z: number;
    constructor(config: {textureAlias: string, opacity?: number, scale?: Vector2, z?: number}) {
        super();
        this.textureAlias = config.textureAlias;
        this.opacity = config.opacity ?? 1;
        this.scale = config.scale ?? new Vector2(1,1);
        this.z = config.z ?? 0;
    }
}
