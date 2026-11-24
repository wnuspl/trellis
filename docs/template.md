# the project template

`npm create @wnuspl/trellis@latest my-game` gives you a small working game: a bunny you move with WASD, and watermelons that jump somewhere new when you touch them. This page explains what's in it, then walks through adding to it.

## what's in it

```
my-game/
├── assets/            images; every file here is loaded at startup
├── scenes/main.json   the scene the game opens with
├── src/
│   ├── index.ts       platform setup (differs per template)
│   ├── game.ts        game setup (the same in every template)
│   └── blueprints.ts  the bunny, the watermelon and their behaviors
└── index.html
```

| file | what to do with it |
|---|---|
| `src/blueprints.ts` | Where most of your game goes: blueprints, components and behaviors |
| `src/game.ts` | Register blueprints with the scene loader, add scenes, change the profile |
| `src/index.ts` | Usually leave alone. It tells the game how to read files and where the assets are |
| `assets/` | Drop images in. A file's name is its texture alias: `assets/coin.png` is `"coin.png"` |
| `scenes/main.json` | Where objects are placed. Edit it with the editor, or by hand (see [scenes](scenes.md)) |

## how it starts

1. `src/index.ts` builds a `ResourceLoader` (how to read and write files) and the list of asset files, then calls `startGame()`.
   - **vite-web:** files go through a small local server, `npm run file-server`. Browsers can't touch your disk, so it must be running.
   - **electron:** reads the disk directly.
2. `startGame()` in `src/game.ts` creates a `SceneLoader` and registers your blueprints in `createSceneLoader()`.
3. It creates a `GameProfile`, or an `EditorProfile` when the editor was asked for.
4. It creates a scene called `"main"` that loads `scenes/main.json`, switches to it, and starts the game.

## the editor

Open it with `?editor` on the dev URL (vite-web) or `npm run editor` (electron).

| key | what it does |
|---|---|
| number keys | Add an object. The browser console lists which number builds which blueprint |
| click | Select an object (it needs a `Collider` to be clickable) |
| WASD | Move the selected object, or resize it in scale mode |
| Q | Switch between move and scale |
| Enter | Save to `scenes/main.json` |

Your behaviors run in the editor too, but physics doesn't. Write behaviors so they do nothing harmful when the player isn't there.

## your first game: collecting coins

This adds coins to the sample game. Touching one picks it up and adds to a score.

**1. Add the art.** Put a `coin.png` in `assets/`. Its texture alias is `"coin.png"`.

**2. Tag the player** so a coin can tell the bunny apart from a watermelon. In `src/blueprints.ts`:

```ts
import { Component } from "@wnuspl/trellis";

export class PlayerTag extends Component {}
```

Then add `.add(new PlayerTag())` to the chain in the `Player` blueprint.

**3. Make the coin.** Also in `src/blueprints.ts`:

```ts
import { Behavior, Blueprint, DestroyRequest, Vector2, type BehaviorContext } from "@wnuspl/trellis";
import { CircleCollider, Collider, CollisionEvent, SpriteRenderer } from "@wnuspl/trellis/stl";

let score = 0;

class CoinBehavior extends Behavior {
    update(ctx: BehaviorContext) {
        CollisionEvent.each(this.gameObject, ctx, (other) => {
            if (!other.get(PlayerTag)) return;
            score++;
            document.title = `Coins: ${score}`;
            new DestroyRequest(this.gameObject).post(ctx);
        });
    }
}

export const Coin = new Blueprint((gameObject) => {
    gameObject
        .add(new SpriteRenderer({ textureAlias: "coin.png", scale: new Vector2(2, 2) }))
        .add(new Collider(new CircleCollider(16)))
        .attach(CoinBehavior);
});
```

- The coin has a `Collider` but no `PhysicsBody`, so it's a trigger: the bunny passes through it and you still get the `CollisionEvent` (see [physics](physics.md#triggers)).
- The coin is removed at the start of the next frame (see [requests and events](requests-and-events.md)).
- Trellis has no text yet, so the score goes in the page title. For on-screen text, see [rendering](rendering.md#ui).

**4. Register it.** In `createSceneLoader()` in `src/game.ts`, add the coin next to the others:

```ts
sceneLoader.register(
    { alias: "player", blueprint: Player },
    { alias: "watermelon", blueprint: Watermelon },
    { alias: "coin", blueprint: Coin },
);
```

**5. Place some coins.** Open the editor, press the coin's number key, move the coin with WASD and press Enter to save. You can also add entries to `scenes/main.json` by hand:

```json
{ "blueprint": "coin", "changes": { "": { "Transform": { "position": { "x": 150, "y": 60 } } } } }
```

Run the game and walk the bunny into a coin.

**Where to go next**
- Restart when every coin is collected: [switching scenes](switching-scenes.md).
- Make the bunny fall and jump: [physics](physics.md).
- Read keys and the mouse: [input](input.md).
- Look up when things happen in a frame: [the frame loop](frame-loop.md).

## building a scene from code

A scene doesn't need a file. Its `onInit` callback can build everything itself:

```ts
const main = profile.instance.createScene("main");
main.onInit((scene) => {
    scene.build(Player);
    for (let i = 0; i < 5; i++) {
        const coin = scene.build(Coin);
        coin.transform.position = new Vector2(i * 80 - 160, 100);
    }
});
profile.instance.systems.sceneManager.setScene("main");
```

`scene.build(blueprint)` creates the object and its children and returns it. Set positions and other values after it returns.

You can also mix the two: load a file, then add generated objects.

```ts
main.onInit(async (scene) => {
    await sceneLoader.load(scene, "scenes/main.json");
    for (let i = 0; i < 5; i++) scene.build(Coin).transform.position = new Vector2(i * 80 - 160, 100);
});
```

Some things to know:
- **Objects built in code aren't part of the scene file.** The editor doesn't show them and saving doesn't write them. To place an object from code that *is* saved, use `sceneLoader.buildGameObject(scene, { blueprint: "coin" })`.
- **Behaviors can't build objects.** A behavior's `ctx.scene` is read-only. To add objects while the game runs, post a `CreateRequest` (see [requests and events](requests-and-events.md#creating-an-object-at-a-position)).
- **A behavior's constructor runs before you set a position.** `scene.build` runs the blueprint (which attaches behaviors) before your code moves the object. Read positions in `update`, not in the constructor (see [behaviors](behaviors.md#init)).

## builds

**vite-web:** `npm run build` writes a playable game to `dist/`. Upload that folder to any static host. It works from a subfolder too (itch.io, GitHub Pages). Try it locally with `npm run preview`.
- `assets/` and `scenes/` are copied into the build as they are (see `vite.config.ts`).
- A build reads scene files with a plain `fetch`, so it doesn't need `file-server`. Scenes can't be saved, and `?editor` is ignored.

**electron:** packaging isn't set up yet. `npm run build` only compiles the code, and the game still runs from the project folder with `npm run dev`.
