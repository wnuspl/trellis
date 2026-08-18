# behaviors

Functionality/logic for all `GameObject`s. Can store data, but often times data should be offloaded to a `Component`.

```ts
class PlayerController extends Behavior {
    speed: number = 10;
    constructor(gameObject, config: { speed: number }) {
        super(gameObject);
        this.speed = 10;
    }

    update(ctx: BehaviorContext) {
        if (ctx.input.isKeyDown("Space")) {
            this.gameObject.transform.position.x += this.speed * ctx.dt;
        }
    }
}
```

To attach to a GameObject, use the attach method.

```ts
gameObject.attach(Collectible);

// provide config as second argument
gameObject.attach(PlayerController, { speed: 10 });
```