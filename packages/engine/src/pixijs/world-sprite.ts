import {AlphaFilter, Assets, Sprite} from "pixi.js";
import {Vector2} from "../utils/index.js";
import {Transform} from "../core/index.js";

export class WorldSprite {
    #sprite: Sprite;
    constructor(texture: any, z: number) {
        this.#sprite = new Sprite(texture);
        this.#sprite.zIndex = z;
        this.#sprite.anchor.set(0.5,0.5);
    }
    set position(position: Vector2) {
        const renderPosition = new Vector2(position.x, -position.y);
        this.#sprite.position = renderPosition;
    }
    set texture(textureAlias: string) {
        this.#sprite.texture = Assets.get(textureAlias);
    }
    set rotation(rotation: number) {
        this.#sprite.rotation = rotation;
    }
    set scale(scale: Vector2) {
        this.#sprite.scale = scale;
    }
    applyTransform(transform: Transform) {
        this.position = transform.worldPosition;
        this.rotation = transform.worldRotation;
        this.scale = transform.worldScale;
    }
    get sprite() {
        return this.#sprite;
    }
    addAlpha(alpha: number) {
        this.#sprite.filters = [new AlphaFilter({ alpha })];
    }
    destroy() {
        this.#sprite.destroy();
    }
}