# the frame loop

Every frame, Trellis runs your processes, then your behaviors. Knowing the order tells you when a change you make shows up somewhere else.

## one frame

1. New behaviors run `init` (see [behaviors](behaviors.md#init)).
2. **Processes** run, one after another, in the order they were registered.
3. Change tracking resets (see [frame changes](#frame-changes)).
4. Requests are cleared.
5. **Behaviors** run (any that missed step 1 run `init` first): every behavior on every object in the current scene, in the order the objects were created.
6. Events are cleared.
7. Input updates: keys and mouse buttons pressed since the last frame become "down" for the next one.

With `GameProfile`, step 2 is:

| order | process | what it does |
|---|---|---|
| 1 | `SceneTransferProcess` | Switches scene if a behavior asked to last frame |
| 2 | `DestroyProcess` | Destroys objects behaviors asked to destroy last frame |
| 3 | `CreateProcess` | Builds blueprints behaviors asked to create last frame |
| 4 | `BroadcastProcess` | Delivers `Broadcast`s behaviors posted last frame, as events |
| 5 | `PhysicsProcess` | Moves physics bodies, detects collisions, posts `CollisionEvent`s |
| 6 | `TransformProcess` | Works out world positions from parent/child transforms |
| 7 | `CameraProcess` | Moves the camera to the first `CameraOperator` |
| 8 | `SpriteAnimationProcess` | Advances sprite animations |
| 9 | `SpriteRenderProcess` | Draws sprites |
| 10 | `OnclickProcess` | Posts `OnclickEvent`s for objects under a mouse click |

## what that means in practice

- **Requests take one frame.** A behavior that posts a `DestroyRequest`, `CreateRequest`, `SceneTransferRequest` or `Broadcast` sees no change for the rest of that frame. It happens at the start of the next one. See [requests and events](requests-and-events.md).
- **Events reach behaviors the same frame.** A `CollisionEvent` posted by physics is readable by every behavior that frame, then it's gone.
- **What a behavior changes is drawn next frame.** Behaviors run after rendering, so moving an object in a behavior shows up on screen one frame later. This is invisible in practice, but it matters if you compare positions against what was drawn.
- **Input is one frame behind the browser.** A key pressed between two frames is "down" for exactly one frame of behaviors.
- **Physics overwrites what it owns.** If a behavior sets `transform.position` on an object with a `PhysicsBody`, physics still applies `velocity` on top of it next frame. To move a physics object, change its velocity, or set both.

## dt

`ctx.dt` is the length of the frame **in frames at 60 fps**, not in seconds. At 60 fps it's about `1`. At 120 fps it's about `0.5`, and on a slow frame it can be `2` or more.

So speeds in Trellis are "pixels per frame": `velocity.x = 5` moves 5 px every 1/60 s. Multiply by `ctx.dt` whenever you move something yourself, so the game runs at the same speed on every display:

```ts
this.gameObject.transform.position.x += this.speed * ctx.dt;
```

A long frame (switching tabs, a slow load) gives a large `dt`, which can push fast objects through walls. Cap it if that matters:

```ts
const dt = Math.min(ctx.dt, 2);
```

## frame changes

`ctx.changes` lists which objects were created, destroyed or modified since the last time processes ran:

```ts
ctx.changes.createdGameObjects;   // Set<GameObject>
ctx.changes.destroyedGameObjects; // Set<GameObject>
ctx.changes.modifiedGameObjects;  // Map<GameObject, ComponentConstructor[]>
```

It's mostly for processes that cache things per object, like a renderer that keeps one sprite per object and needs to drop it when the object is destroyed.

"Modified" only covers components that report their own changes with `markModification(this)`, which `Transform` and `SpriteRenderer` do. Changing a field on your own component doesn't count unless it does the same (see [components](components.md#optional-tracked-components)).
