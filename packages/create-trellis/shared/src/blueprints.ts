import {
    Behavior,
    Blueprint,
    InstanceContext,
    Transform,
    Vector2,
    Component, BehaviorContext,
} from "@wnuspl/trellis";
import {
    CameraOperator,
    CircleCollider,
    Collider, CollisionEvent, OnclickEvent,
    PhysicsBody,
    SpriteRenderer, SpriteAnimation
} from "@wnuspl/trellis/stl";



const PlayerAnimations = {
    "run": {
        frames: ["bunny-run-2.png","bunny-run-3.png","bunny-run-4.png","bunny-run-5.png", "bunny-run-1.png"],
        frameDuration: 12,
        loop: true
    },
    "idle": {
        frames: ["bunny-idle-1.png", "bunny-idle-2.png"],
        frameDuration: 30,
        loop: true
    }
}
export const Player = new Blueprint(
    (gameObject) => {
        gameObject.attach(PlayerController)
        gameObject
            .add(new SpriteAnimation(PlayerAnimations, "idle"))
            .add(new SpriteRenderer({
                textureAlias: "bunny-idle-1.png",
                scale: new Vector2(4,4)
            }))
            .add(new Collider(new CircleCollider(32)))
            .add(new PhysicsBody({ gravityScale: 0 }))
    },
)

class PlayerController extends Behavior {
    speed: number = 5;
    update(ctx: BehaviorContext) {
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
            update(ctx: BehaviorContext) {
                CollisionEvent.each(this.gameObject, ctx, (other) => {
                    const newPosition = new Vector2(
                        Math.random()*1000-500,
                        Math.random()*600-300
                    );
                    this.gameObject.transform.position = newPosition;
                });

                this.gameObject.transform.rotation += ctx.dt*0.05;
            }
        })
    }
)