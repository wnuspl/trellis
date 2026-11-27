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

`init(ctx)` runs once, before the behavior's first `update`. By then your fields and config are set, values from the scene file have been applied, and a `CreateRequest`'s `onInit` callback has run, so it's the place for setup that reads component values:

```ts
class PlanetLook extends Behavior<Transform | PlanetState | SpriteRenderer> {
    init(ctx: BehaviorContext) {
        const { color } = this.gameObject.get(PlanetState); // the scene file's value
        this.gameObject.get(SpriteRenderer).textureAlias = `planet_${color}.png`;
    }
}
```

It gets the same `ctx` as `update`. Most behaviors run `init` at the start of the frame after they're attached, before processes, so the first frame drawn already shows what `init` set up. Behaviors created by a process that frame (e.g. from a `CreateRequest`) run `init` just before their first `update` instead.

Don't read component values in the constructor: it runs while the blueprint builds, before scene values are applied (see [scenes](scenes.md#limits)).

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
