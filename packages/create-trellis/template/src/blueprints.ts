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
    PhysicsBody,
    SpriteRenderer
} from "@wnuspl/trellis/stl";



export const Player = new Blueprint(
    (gameObject) => {
        gameObject.attach(PlayerController)
        gameObject
            .add(new SpriteRenderer({
                textureAlias: "player.png",
                scale: new Vector2(0.5,0.5)
            }))
            .add(new Collider(new CircleCollider(64)))
            .add(new PhysicsBody({ gravityScale: 0 }))
    },
)

class PlayerController extends Behavior {
    speed: number = 5;
    update(ctx: InstanceContext) {
        this.gameObject.modify(PhysicsBody, physicsBody => {
            const direction  = new Vector2(0,0);
            if (ctx.input.isKeyHeld("KeyA")) direction.x += -1;
            if (ctx.input.isKeyHeld("KeyD")) direction.x += 1;
            if (ctx.input.isKeyHeld("KeyW")) direction.y += 1;
            if (ctx.input.isKeyHeld("KeyS")) direction.y -= 1;
            physicsBody.velocity = direction.normalized().scaled(this.speed * ctx.dt);
        });
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
                if (OnclickEvent.wasClicked(this.gameObject, ctx, "left")) {
                    this.gameObject.modify(Transform, (transform) => {
                        transform.position = new Vector2(Math.random()*1000-500, Math.random()*600-300)
                    });
                }
                this.gameObject.modify(Transform, (transform) => {
                    transform.rotation += ctx.dt * 0.05;
                });
            }
        })
    }
)