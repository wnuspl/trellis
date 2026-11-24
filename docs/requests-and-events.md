# requests and events

Behaviors and processes don't call each other. They talk through two short-lived messages:

| | sent by | read by | lives for |
|---|---|---|---|
| **request** | behaviors | processes | until processes run, at the start of the next frame |
| **event** | processes | behaviors and later processes | the rest of the current frame |

A request is "please do this" (destroy this object, switch scenes). An event is "this happened" (these two objects collided, this object was clicked).

## built-in requests

Post a request from a behavior with `.post(ctx)`:

```ts
import { CreateRequest, DestroyRequest, SceneTransferRequest } from "@wnuspl/trellis";

new DestroyRequest(this.gameObject).post(ctx);
new CreateRequest(Coin).post(ctx);                    // build a blueprint into the scene
new CreateRequest(Spark, this.gameObject).post(ctx);  // ...as a child of this object
new SceneTransferRequest("level2").post(ctx);         // see switching-scenes.md
```

All three happen at the start of the next frame, before anything else updates.

### creating an object at a position

A behavior's `ctx.scene` is read-only and `CreateRequest` takes no position. To spawn something somewhere, create a one-off blueprint that sets it:

```ts
const at = this.gameObject.transform.position.clone();
new CreateRequest(new Blueprint((gameObject) => {
    Coin.build(gameObject);
    gameObject.transform.position = at;
})).post(ctx);
```

This builds `Coin` but not its children. For a blueprint with children, return `Coin`'s children from the one-off blueprint too: `new Blueprint(build, Coin.children)`.

To spawn as a child at an offset instead, pass a parent and set a local position.

## built-in events

### CollisionEvent

Posted by `PhysicsProcess` once per frame for each pair of overlapping colliders (see [physics](physics.md)).

```ts
import { CollisionEvent } from "@wnuspl/trellis/stl";

update(ctx: BehaviorContext) {
    CollisionEvent.each(this.gameObject, ctx, (other) => {
        if (other.get(Coin)) new DestroyRequest(other).post(ctx);
    });
}
```

### OnclickEvent

Posted by `OnclickProcess` when a mouse button goes down over an object's `Collider`.

```ts
import { OnclickEvent } from "@wnuspl/trellis/stl";

for (const click of ctx.events.getFor(OnclickEvent, this.gameObject)) {
    if (click.button === "left") { /* ... */ }
}
```

## reading events

```ts
ctx.events.get(CollisionEvent);                     // every CollisionEvent this frame
ctx.events.getFor(CollisionEvent, this.gameObject); // only ones involving this object
```

`getFor` lets an event present itself from the object's point of view. A `CollisionEvent` from `getFor` always has `a` as the object you asked about and `b` as the other one.

## your own requests

Subclass `FrameRequest`, then handle it in a [process](processes.md):

```ts
import { FrameRequest, Process, type InstanceContext } from "@wnuspl/trellis";

class ExplodeRequest extends FrameRequest {
    constructor(public at: Vector2, public radius: number) { super(); }
}

class ExplodeProcess extends Process {
    update(ctx: InstanceContext) {
        for (const request of ctx.requests.get(ExplodeRequest)) {
            // ...
        }
    }
}

// in a behavior
new ExplodeRequest(position, 64).post(ctx);
```

## your own events

Subclass `FrameEvent` and post it from a process. Set `involvedGameObjects` so `getFor` can filter by object (leave it empty and the event involves everyone):

```ts
import { FrameEvent } from "@wnuspl/trellis";

class DamageEvent extends FrameEvent {
    constructor(public target: GameObject, public amount: number) {
        super();
        this.involvedGameObjects = new Set([target]);
    }
}

// in a process
new DamageEvent(enemy, 10).post(ctx);

// in a behavior
for (const hit of ctx.events.getFor(DamageEvent, this.gameObject)) { /* ... */ }
```

Behaviors can't post events. Their `ctx.events` is read-only. To get from a behavior to an event, post a request and have a process turn it into an event.

## limits

- An event posted by a process is only seen by processes registered **after** it. Earlier ones have already run this frame.
- Requests posted by a process are cleared right after processes finish, so only later processes in the same frame see them.
- `CollisionEvent.manifold.normal` keeps the direction from the original pair. When you get the event from `getFor` as the second object, the normal points the other way from what you'd expect. Don't rely on its sign.
