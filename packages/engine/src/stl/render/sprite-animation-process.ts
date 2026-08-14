import {Process} from "../../model/index.js";
import type {InstanceContext} from "../../instance/index.js";
import {SpriteAnimation} from "./sprite-animation-aspect.js";
import {SpriteRenderer} from "./sprite-renderer-aspect.js";

export class SpriteAnimationProcess extends Process {
    update(ctx: InstanceContext) {
        for (const gameObject of ctx.scene.query([SpriteAnimation])) {
            const spriteAnimation = gameObject.get(SpriteAnimation)!;
            const change = spriteAnimation.tick(ctx.dt);
            if (change) {
                const spriteRenderer = gameObject.get(SpriteRenderer);
                if (!spriteRenderer) {
                    gameObject.add(new SpriteRenderer({
                        textureAlias: change
                    }));
                } else {
                    gameObject.get(SpriteRenderer)!.textureAlias = change;
                }
            }
        }
    }
}