# units and coordinates

## world space

- **x points right, y points up.** A bigger `y` is higher on screen.
- Units are **pixels at zoom 1**. A 32 px sprite at scale 1 is 32 units wide.
- The camera's position is the world point at the **center** of the screen.
- **Rotation is in radians.** `Math.PI / 2` is a quarter turn.

Pixi, the renderer underneath, is y-down. Trellis flips y for you when it draws sprites, so you only need to care about that if you draw with Pixi directly (see [processes](processes.md#drawing-your-own-things)).

## transforms

Every object has a `Transform`:

| field | meaning |
|---|---|
| `position`, `rotation`, `scale` | Relative to the object's parent. Set these. |
| `worldPosition`, `worldRotation`, `worldScale` | Where the object really is. Worked out each frame by `TransformProcess`; read these, don't set them. |

Objects built directly into a scene have the scene's root as their parent, so for them local and world are the same. For a [blueprint child](blueprints.md#children), `position` is an offset from its parent.

A child's position is scaled by its parent's scale but **not rotated** by its parent's rotation. Rotating a parent doesn't swing its children around it.

`worldPosition` is only updated when `TransformProcess` runs. If you move a parent in a behavior, its children's `worldPosition` is out of date until next frame.

```ts
const transform = gameObject.transform;
transform.position = new Vector2(100, 50); // copies the vector in
transform.position.x += 5;                  // changing a field also works
```

## time and speed

`ctx.dt` is measured in **frames at 60 fps** (about `1` per frame), not seconds. Speeds are pixels per frame, and accelerations such as gravity are pixels per frame per frame. See [the frame loop](frame-loop.md#dt).

## screen and mouse

`ctx.input.mouseScreenPosition()` is in **screen pixels from the center of the game's element, y up**. Convert it to the world with the camera:

```ts
const mouseWorld = ctx.camera.toWorldPosition(ctx.input.mouseScreenPosition());
```

## camera and zoom

`zoom` scales the world on screen: at `2`, one world unit is two screen pixels, so you see half as much. Set it on the `CameraOperator` (see [rendering](rendering.md#camera)).

To place something at a fixed point on screen (a HUD), convert from screen to world each frame:

```ts
// 20 px in from the top-left corner of the screen
const screen = new Vector2(-window.innerWidth / 2 + 20, window.innerHeight / 2 - 20);
const world = ctx.camera.toWorldPosition(screen);
```
