# physics

`stl` comes with simple 2D physics: gravity, velocity, and pushing overlapping objects apart. It's run by `PhysicsProcess`, which `GameProfile` registers for you.

## components

```ts
import { BoxCollider, CircleCollider, Collider, PhysicsBody } from "@wnuspl/trellis/stl";

gameObject
    .add(new Collider(new CircleCollider(16)))
    .add(new PhysicsBody({ gravityScale: 1, restitution: 0.5 }));
```

### Collider

The object's shape for collisions and clicks. Centered on the object. Boxes rotate with the object's `worldRotation`; circles don't need to.

| shape | size |
|---|---|
| `new CircleCollider(radius)` | Scaled by the larger of the object's world scale x and y |
| `new BoxCollider(new Vector2(width, height), rotation?)` | Full width and height (not half), scaled by world scale. Optional `rotation` (radians) is added on top of the object's |

### PhysicsBody

| field | default | meaning |
|---|---|---|
| `velocity` | `(0, 0)` | Pixels per frame. Added to `transform.position` every frame |
| `gravityScale` | **`0`** | Multiplies gravity. **Off by default**: set `1` for normal falling |
| `mass` | `1` | How hard the object is to push |
| `static` | `false` | `true` makes it immovable (infinite mass): floors, walls |
| `restitution` | `0` | Bounciness, 0–1. A collision uses the larger value of the two objects |

Gravity is `DynamicsProcess.GRAVITY_ACCELERATION` (`-0.35` px/frame², pulling down). It's a static field, so you can change it for the whole game.

## what happens each frame

`PhysicsProcess` splits the frame into 4 sub-steps. Each sub-step:

1. **Moves** every `PhysicsBody`: adds gravity to `velocity`, then `velocity` to `position`.
2. **Detects** every overlapping pair of `Collider`s.
3. **Resolves** pairs where *both* objects have a `PhysicsBody`: pushes them apart in proportion to mass, then bounces their velocities using `restitution`.

Then it posts one `CollisionEvent` per overlapping pair for that frame (see [requests and events](requests-and-events.md#collisionevent)).

## triggers

Collisions are detected for **any** two colliders, but only resolved when both have a `PhysicsBody`. A `Collider` without a `PhysicsBody` is a trigger: things pass through it, and you still get the `CollisionEvent`. Use it for coins, checkpoints and damage zones:

```ts
export const Coin = new Blueprint((gameObject) => {
    gameObject.add(new Collider(new CircleCollider(12)));
    gameObject.attach(CoinBehavior); // uses CollisionEvent.each to detect the player
});
```

## which shapes collide

| | circle | box |
|---|---|---|
| **circle** | yes | yes |
| **box** | yes | yes |

## limits

- **No contact info.** There's no "on the ground" or "touching a wall" flag. Platformer movement (jumping only when grounded, wall slides) needs your own checks, or your own physics process (see [replacing a built-in process](processes.md#replacing-a-built-in-process)).
- **No spin.** Box colliders follow their object's rotation, but collisions never change anything's rotation or angular velocity.
- **No friction.** Objects slide along each other forever unless you slow them yourself.
- **Fast objects can pass through thin ones.** Movement is checked in 4 steps per frame. An object that moves farther than the other object's thickness in one step can skip past it.
- **Use physics on top-level objects.** Physics moves `transform.position` (the local position) but checks collisions using `worldPosition`. For a [blueprint child](blueprints.md#children) whose parent has moved or scaled, the two differ.
- A collision's `manifold.normal` can point either way when read through `getFor`. Compare positions instead of relying on its sign.
