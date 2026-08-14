import { Process } from "../../model/process.js";
import { SpriteRenderer } from "./sprite-renderer-aspect.js";
import {Transform} from "../../core/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {WorldSprite} from "../../pixijs/index.js";
import type {GameObject} from "../../model/index.js";

export class SpriteRenderProcess extends Process {
    #spriteCache: Map<GameObject, WorldSprite> = new Map();
    update(ctx: InstanceContext): void {
        for (const destroyedGameObject of ctx.changes.destroyedGameObjects) {
            this.destroySprite(destroyedGameObject);
        }
        const gameObjectList = ctx.scene.query([SpriteRenderer]);
        for (const gameObject of gameObjectList) {
            this.renderSprite(gameObject, ctx);
        }
    }
    renderSprite(gameObject: GameObject, ctx: InstanceContext): void {
        const spriteRenderer = gameObject.get(SpriteRenderer)!;
        const transform = gameObject.get(Transform)!;
        const textureAlias = spriteRenderer.textureAlias;

        let sprite;
        if (!this.#spriteCache.has(gameObject)) {
            const texture = this.assetManager.get(textureAlias);
            sprite = new WorldSprite(texture, spriteRenderer.z);
            this.#spriteCache.set(gameObject, sprite);
            this.application.add(sprite);
        } else {
            sprite = this.#spriteCache.get(gameObject)!;
            const modifiedAspects = ctx.changes.modifiedGameObjects.get(gameObject) ?? [];
            const modified = modifiedAspects.filter(aspect => aspect === SpriteRenderer)[0];
            if (modified) {
                sprite.texture = spriteRenderer.textureAlias;
            }
        }

        sprite.applyTransform(transform);
        sprite.sprite.scale.x *= spriteRenderer.scale.x;
        sprite.sprite.scale.y *= spriteRenderer.scale.y;
        sprite.addAlpha(spriteRenderer.opacity);
    }
    destroySprite(gameObject: GameObject) {
        const sprite = this.#spriteCache.get(gameObject);
        sprite?.destroy();
        this.#spriteCache.delete(gameObject);
    }
}
