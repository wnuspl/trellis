# behaviors

Functionality/logic for all `GameObject`s. Can store data, but often times data should be offloaded to a `Component`.

```ts
class PlayerController extends Behavior {
    update(ctx: BehaviorContext) {
        if (ctx.input.isKeyHeld("KeyD")) {
            this.gameObject.transform.position.x += 5 * ctx.dt;
        }
    }
}
```

To attach to a GameObject, use the attach method.

```ts
gameObject.attach(PlayerController);
```

Each object can have one behavior of each class. Attaching the same class twice logs an error and returns the one already there. Behaviors live and die with their object.

## update

`update(ctx)` runs once per frame, after all processes (see [the frame loop](frame-loop.md)). Every behavior in the current scene runs, in the order their objects were created.

| `ctx.` | what it is |
|---|---|
| `dt` | Frame length in frames at 60 fps, about `1` (see [units](coordinates.md#time-and-speed)) |
| `scene` | The current scene, read-only: `query`, `getChildren`, `getParent`, `getOrigin`, `resolvePath` |
| `input` | Keyboard and mouse (see [input](input.md)) |
| `events` | Things processes noticed this frame, such as collisions (see [requests and events](requests-and-events.md)) |
| `requests` | Where you post requests: create, destroy, switch scene |
| `changes` | Objects created, destroyed or modified (see [frame changes](frame-loop.md#frame-changes)) |
| `camera` | The current camera: `position`, `zoom`, `toWorldPosition()` |

A behavior can't build or destroy objects directly. It posts a request, and the change happens at the start of the next frame.

## config

To pass settings in, take a second constructor argument and give it to `attach`:

```ts
class PlayerController extends Behavior {
    speed: number;
    constructor(gameObject: GameObject, config: { speed: number }) {
        super(gameObject);
        this.speed = config.speed;
    }
    update(ctx: BehaviorContext) { /* ... */ }
}

gameObject.attach(PlayerController, { speed: 10 });
```

## init

`init()` is called by `Behavior`'s own constructor, which runs **before** your subclass's fields and constructor body. Inside `init()`, your fields still have no values and your config hasn't been stored:

```ts
class Broken extends Behavior {
    speed = 10;
    init() {
        console.log(this.speed); // undefined
    }
}
```

Do setup in your constructor after `super(...)`, or on the first `update`. Also, when a scene is loaded from a file, the saved values aren't applied to components until after behaviors are constructed. Read component values in `update`, not during construction (see [scenes](scenes.md#limits)).

## knowing which components an object has

`Behavior` takes a type parameter listing the components the object will have. With it, `this.gameObject.get(...)` returns the component instead of `T | undefined`:

```ts
class Mover extends Behavior<Transform | PhysicsBody> {
    update(ctx: BehaviorContext) {
        this.gameObject.get(PhysicsBody).velocity.x = 3; // no `!` needed
    }
}
```

TypeScript then checks it at `attach`: it only compiles if the object was given those components first.

```ts
gameObject.add(new PhysicsBody()).attach(Mover); // ok
gameObject.attach(Mover);                         // type error: no PhysicsBody yet
```

The type parameter defaults to `Transform`, which every object has.

To also check at runtime (when an object's type isn't known to TypeScript), list required components in `requires`. `attach` throws if one is missing:

```ts
class Mover extends Behavior<Transform | PhysicsBody> {
    static readonly requires = [PhysicsBody];
}
```

## behaviors or processes?

Use a behavior for logic that belongs to one object: a player controller, an enemy's AI, a door that opens. Use a [process](processes.md) for logic over many objects at once, or that needs the renderer or other engine systems: physics, drawing, spawning waves.
