# requests and events

Behaviors and processes don't call each other. They talk through short-lived messages:

| | sent by | read by | lives for |
|---|---|---|---|
| **request** | behaviors | processes | until processes run, at the start of the next frame |
| **event** | processes | behaviors and later processes | the rest of the current frame |
| **broadcast** | behaviors | behaviors and processes | the next frame, as an event |

A request is "please do this" (destroy this object, switch scenes). An event is "this happened" (these two objects collided, this object was clicked). A broadcast is a behavior telling every other behavior something (shake the screen, the boss died).

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

Behaviors can't post events. Their `ctx.events` is read-only. To get from a behavior to an event, post a [broadcast](#broadcasts), or post a request and have a process turn it into an event.

## broadcasts

A `Broadcast` lets one behavior tell others something without reaching into their objects. Subclass it to give it data, then post it from a behavior:

```ts
import { Broadcast } from "@wnuspl/trellis";

class Shake extends Broadcast {
    constructor(public amount: number) { super(); }
}

// in the behavior that wants the screen to shake
new Shake(6).post(ctx);

// in the camera's behavior, next frame
for (const shake of ctx.events.get(Shake)) {
    this.shake = Math.max(this.shake, shake.amount);
}
```

A broadcast is an event, so it's read the same way. `BroadcastProcess` delivers it at the start of the next frame, after objects are created and destroyed, and every behavior and later process can read it for that frame.

### when to use one

If you already have the object you want to affect, call it: `enemy.get(Health)!.damage(8)` happens right away, with no frame of delay. Broadcast when you'd otherwise have to go find whoever cares, or when several things might: the camera and a sound player both reacting to an explosion, the HUD and a score counter both reacting to a kill.

### broadcasts about an object

A broadcast can say which objects it's about. Fill in `involvedGameObjects`, and a reader that's watching one particular object can pick out just the broadcasts about it with `getFor`:

```ts
class Died extends Broadcast {
    constructor(who: GameObject) {
        super();
        this.involvedGameObjects = new Set([who]);
    }
}

// in any enemy's behavior, as it dies. It doesn't know who's watching.
new Died(this.gameObject).post(ctx);

// in a boss health bar, which only cares about its boss
if (ctx.events.getFor(Died, this.boss).length > 0) { /* hide the bar */ }

// in a kill counter, which cares about every death
this.kills += ctx.events.get(Died).length;
```

- **Send values, not live state.** It's read a frame later, so pass `position.clone()` rather than `position`.
- **Objects you send may be gone.** An object can be destroyed between the post and the read.
- **Don't change a broadcast after posting it.** Every reader gets the same one.
- **Post them from behaviors.** A process should post an ordinary event instead.
- **Profiles:** `GameProfile` and `EditorProfile` register `BroadcastProcess`. A custom profile must register it, after `CreateProcess` (see [processes](processes.md#profiles)).

## limits

- An event posted by a process is only seen by processes registered **after** it. Earlier ones have already run this frame.
- Requests posted by a process are cleared right after processes finish, so only later processes in the same frame see them.
- `CollisionEvent.manifold.normal` keeps the direction from the original pair. When you get the event from `getFor` as the second object, the normal points the other way from what you'd expect. Don't rely on its sign.
