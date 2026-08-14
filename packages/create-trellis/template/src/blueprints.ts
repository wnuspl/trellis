import {
    Behavior,
    Blueprint,
    InstanceContext,
    Transform,
    Vector2
} from "@wnuspl/trellis";
import {
    CircleCollider,
    Collider, CollisionEvent, OnclickEvent,
    PhysicsBody, SpriteAnimation,
    SpriteRenderer
} from "@wnuspl/trellis/stl";


const PlayerAnimations = {
    "run": {
        frames: ["bunny-run-2.png","bunny-run-3.png","bunny-run-4.png","bunny-run-5.png"],
        frameDuration: 12,
        loop: true
    },
    "idle": {
        frames: ["bunny-run-1.png"],
        frameDuration: 1,
        loop: false
    }
}

export const Player = new Blueprint(
    (gameObject) => {
        gameObject.attach(PlayerController)
        gameObject
            .add(new SpriteAnimation(PlayerAnimations, "run"))
            .add(new SpriteRenderer({
                textureAlias: "bunny-run-1.png",
                scale: new Vector2(2,2)
            }))
            .add(new Collider(new CircleCollider(64)))
            .add(new PhysicsBody({ gravityScale: 0 }))
    },
)

class PlayerController extends Behavior {
    speed: number = 5;
    update(ctx: InstanceContext) {
        const direction  = new Vector2(0,0);
        if (ctx.input.isKeyHeld("KeyA")) direction.x += -1;
        if (ctx.input.isKeyHeld("KeyD")) direction.x += 1;
        if (ctx.input.isKeyHeld("KeyW")) direction.y += 1;
        if (ctx.input.isKeyHeld("KeyS")) direction.y -= 1;
        this.gameObject.get(PhysicsBody)!.velocity = direction.normalized().scaled(this.speed);

        const spriteAnimation = this.gameObject.get(SpriteAnimation)!;
        const spriteRenderer = this.gameObject.get(SpriteRenderer)!;

        spriteAnimation.currentAnimation = (direction.magnitude() > 0) ? "run" : "idle";
        direction.x != 0 && (spriteRenderer.scale.x = Math.abs(spriteRenderer.scale.x) * direction.x);
    }
}


export const Watermelon = new Blueprint(
    (gameObject) => {
        gameObject
            .add(new SpriteRenderer({
                textureAlias: "watermelon.png",
                scale: new Vector2(0.1,0.1)
            }))
            .add(new Collider(new CircleCollider(32)));

        gameObject.attach(class extends Behavior {
            update(ctx: InstanceContext) {
                const transform = this.gameObject.get(Transform);
                if (OnclickEvent.wasClicked(this.gameObject, ctx, "left")) {
                    transform.position = new Vector2(Math.random()*1000-500, Math.random()*600-300)
                }
                transform.rotation += ctx.dt * 0.05;
            }
        })
    }
)