import { Aspect } from "../../model/aspect.js";
import {Vector2} from "../../utils/index.js";
import {markModification} from "../../tracked.js";
import {TrackedVector2} from "../../utils/tracked-vector2.js";

export class SpriteRenderer extends Aspect {
    #textureAlias: string;
    #opacity: number;
    #scale: TrackedVector2;
    #z: number;
    constructor(config: {textureAlias: string, opacity?: number, scale?: Vector2, z?: number}) {
        super();
        this.#textureAlias = config.textureAlias;
        this.#opacity = config.opacity ?? 1;
        this.#scale = TrackedVector2.fromVector2(config.scale ?? new Vector2(1,1));
        this.#z = config.z ?? 0;
    }
    set textureAlias(alias: string) {
        if (this.#textureAlias !== alias) markModification(this);
        this.#textureAlias = alias;
    }
    set opacity(opacity: number) {
        if (this.#opacity != opacity) markModification(this);
        this.#opacity = opacity;
    }
    set scale(scale: Vector2) {
        if (!this.#scale.equals(scale)) markModification(this);
        this.#scale.x = scale.x;
        this.#scale.y = scale.y;
    }
    set z(z: number) {
        if(this.#z != z) markModification(this);
        this.#z = z;
    }
    get textureAlias() {
        return this.#textureAlias;
    }
    get opacity() {
        return this.#opacity;
    }
    get scale(): Vector2 {
        return this.#scale;
    }
    get z() {
        return this.#z;
    }
}
