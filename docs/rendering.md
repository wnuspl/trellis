# rendering

`stl` draws textured sprites with `SpriteRenderProcess`, animates them with `SpriteAnimationProcess`, and moves the view with `CameraProcess`. `GameProfile` registers all three.

## assets

Every file in `instance.config.assetFileNameList` is loaded before the game starts. A texture's **alias is its file name** without the folder: `assets/player/idle-1.png` is `"idle-1.png"`. Two files with the same name in different folders clash.

The project templates fill the list for you from the `assets/` folder.

## sprites

```ts
import { SpriteRenderer } from "@wnuspl/trellis/stl";

gameObject.add(new SpriteRenderer({
    textureAlias: "coin.png",
    scale: new Vector2(2, 2), // on top of the Transform's scale
    opacity: 1,
    z: 10,                    // higher draws on top
}));
```

The sprite is centered on the object and follows its world position, rotation and scale.

| field | can change at runtime? |
|---|---|
| `textureAlias` | yes |
| `scale`, `opacity` | yes |
| `z` | **no**: it's read once, when the sprite is first drawn |

Pixel-art textures are scaled with nearest-neighbor filtering, so they stay sharp.

To flip a sprite, make its `scale.x` negative:

```ts
spriteRenderer.scale.x = Math.abs(spriteRenderer.scale.x) * direction; // direction is 1 or -1
```

## animation

```ts
import { SpriteAnimation } from "@wnuspl/trellis/stl";

const animations = {
    run:  { frames: ["run-1.png", "run-2.png", "run-3.png"], frameDuration: 8, loop: true },
    idle: { frames: ["idle-1.png", "idle-2.png"], frameDuration: 30, loop: true },
};
gameObject.add(new SpriteAnimation(animations, "idle"));

// later, in a behavior
gameObject.get(SpriteAnimation)!.currentAnimation = "run";
```

- `frameDuration` is in **frames** (60 per second): `8` shows each image for about 0.13 s.
- Setting `currentAnimation` to the one already playing does nothing, so it's safe to set every frame. Switching to a different one restarts it from its first frame.
- An unknown name throws.
- If the object has no `SpriteRenderer`, the animation adds one.

## camera

The camera follows the first object in the scene that has a `CameraOperator`:

```ts
import { CameraOperator } from "@wnuspl/trellis/stl";

player.add(new CameraOperator({ zoom: 2, position: new Vector2(0, 40) })); // position: offset from the object
```

- To follow something other than a single object (smoothing, clamping to the level edges), put the `CameraOperator` on an empty object and move that object from a behavior.
- `zoom` can be changed at any time: `cameraOperator.zoom = 1.5`.
- **Every scene should have a `CameraOperator`.** A scene without one keeps the previous scene's camera position and zoom.

Behaviors can read the current camera from `ctx.camera` (`position`, `zoom`, `toWorldPosition(...)`).

## background color

Set it before `profile.init()`:

```ts
profile.instance.config.backgroundColor = "#1b1630";
```

## UI

There are no text or UI components yet. Two options for now:

- **HTML on top of the canvas.** Absolutely position elements over the game's element. This is the easiest choice for menus and text.
- **Sprites that follow the camera.** `UIParentBehavior` (from `stl`) moves its object to the camera's position every frame. Give it sprite children with offsets to pin them to the screen. It runs after the camera moves, so it trails by one frame.

## drawing your own things

For shapes, text or particles, write a [process](processes.md) that creates Pixi objects and adds them with `this.application.add(...)`:

```ts
import { Process, type GameObject, type InstanceContext } from "@wnuspl/trellis";
import { Graphics } from "pixi.js";

class DotProcess extends Process {
    #dots = new Map<GameObject, Graphics>();
    update(ctx: InstanceContext) {
        for (const gameObject of ctx.scene.query([Dot])) {
            let g = this.#dots.get(gameObject);
            if (!g) {
                g = new Graphics().circle(0, 0, 8).fill("#ffcc00");
                this.application.add(g);
                this.#dots.set(gameObject, g);
            }
            const p = gameObject.transform.worldPosition;
            g.position.set(p.x, -p.y); // Pixi is y-down
        }
        for (const gameObject of ctx.changes.destroyedGameObjects) {
            this.#dots.get(gameObject)?.destroy();
            this.#dots.delete(gameObject);
        }
    }
}
```

Register it after `CameraProcess`. Three things to keep in mind:
- Flip `y` when going from world space to Pixi. Pass rotation through unchanged: the engine's own sprites do, so positive rotation turns things clockwise on screen.
- Clean up when objects are destroyed. Switching scenes destroys every object, so check `ctx.changes.destroyedGameObjects` or drop anything you didn't see this frame.
- Use the same `pixi.js` package as the engine (see [processes](processes.md#drawing-your-own-things)).
