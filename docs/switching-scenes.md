# switching scenes

A game can have more than one scene: a title screen, each level, a game-over screen. Only one scene runs at a time. Switching tears down the current scene and builds the next one fresh.

## setup

Create each scene under an alias, and tell it how to fill itself with `onInit`:

```ts
const instance = profile.instance;

const title = instance.createScene("title");
title.onInit(async (scene) => {
    await sceneLoader.load(scene, "scenes/title.json");
});

const level1 = instance.createScene("level1");
level1.onInit(async (scene) => {
    await sceneLoader.load(scene, "scenes/level1.json");
});
```

Pick the scene the game starts in before calling `profile.init()`:

```ts
instance.systems.sceneManager.setScene("title");
await profile.init();
```

The project templates already do this for a single `main` scene in `src/game.ts`. Add your other scenes next to it.

## usage

From a behavior, ask for a switch with a `SceneTransferRequest`:

```ts
import { SceneTransferRequest } from "@wnuspl/trellis";

class Door extends Behavior {
    update(ctx: BehaviorContext) {
        if (ctx.input.isKeyDown("Enter")) {
            new SceneTransferRequest("level1").post(ctx);
        }
    }
}
```

The switch happens at the start of the next frame, before anything else updates. The rest of the current frame finishes in the old scene, so behaviors that run after the request still see it.

`GameProfile` and `EditorProfile` handle these requests for you. With a custom profile, register `SceneTransferProcess` first so the switch runs before other processes:

```ts
instance.registerProcess(SceneTransferProcess);
```

## what happens on a switch

- Every object in the old scene is destroyed, along with its components and behaviors. Don't hold on to old objects after posting the request.
- The new scene runs its `onInit` callback and is built from scratch.
- Switching back to a scene you've already visited builds it from scratch again. Nothing from the last visit is kept: positions, picked-up coins and behavior fields all reset to what `onInit` builds.

To carry something between scenes (a score, the player's health), keep it outside the scene, such as in a module-level variable or object your behaviors read and write.

## limits

- The new scene starts running as soon as `onInit` starts, not when it finishes. If `onInit` loads a file, the scene can be empty for a few frames until the load completes.
- Post at most one `SceneTransferRequest` per frame. If several are posted, the last one is where you end up.
- The alias must be one you created with `createScene`. An unknown alias throws an error.
