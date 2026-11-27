# processes

A `Process` is a system that runs once per frame over the whole scene, instead of once per object like a behavior. Physics, rendering and the camera are all processes. Write one when logic is about many objects at once, or when it needs the renderer or other engine systems.

Trellis is built so you can add your own processes, or replace the built-in ones, without touching the engine.

## writing one

```ts
import { Process, type InstanceContext } from "@wnuspl/trellis";

class SpinProcess extends Process {
    update(ctx: InstanceContext) {
        for (const gameObject of ctx.scene.query([Spinner])) {
            gameObject.transform.rotation += gameObject.get(Spinner)!.speed * ctx.dt;
        }
    }
}
```

`ctx` has the same fields a behavior gets (`dt`, `scene`, `input`, `events`, `changes`, `requests`, `camera`). The differences are that the scene isn't read-only (you can `build`, `createGameObject` and `destroyGameObject`) and you can post events.

A process also has the engine's systems:

| property | what it is |
|---|---|
| `this.application` | The Pixi wrapper: `camera`, `add(container)` to put things on screen, `syncCamera()` |
| `this.assetManager` | Loaded assets: `get(alias)` returns a texture |
| `this.sceneManager` | `current` scene, `setScene(alias)` |

Override `init()` for one-time setup. It runs in the constructor, which is **before the renderer exists**, so create anything you add with `this.application.add(...)` lazily in the first `update`:

```ts
class OverlayProcess extends Process {
    #layer: Container | null = null;
    update(ctx: InstanceContext) {
        if (!this.#layer) {
            this.#layer = new Container();
            this.application.add(this.#layer);
        }
        // ...
    }
}
```

## registering

Processes are registered on the instance, and **run in the order you register them**:

```ts
instance.registerProcess(SpinProcess);
```

The order matters. Anything that moves objects should run before `TransformProcess`, which works out world positions. Anything that draws should run after `CameraProcess`. See the [frame loop](frame-loop.md) for the built-in order.

Registering the same process twice logs an error and replaces the first one.

## profiles

A `Profile` sets up an instance: which components exist, which processes run. `GameProfile` (from `stl`) registers the standard set. `EditorProfile` registers the editor's.

To add your own processes, write a profile. Register your components and processes before calling `super.init()`:

```ts
import { BroadcastProcess, CreateProcess, DestroyProcess, Profile, SceneTransferProcess, Transform, TransformProcess } from "@wnuspl/trellis";
import { CameraOperator, CameraProcess, SpriteAnimationProcess, SpriteRenderer, SpriteRenderProcess } from "@wnuspl/trellis/stl";

class MyProfile extends Profile {
    async init() {
        const instance = this.instance;
        instance.registry.registerComponent(Transform, CameraOperator, SpriteRenderer, Spinner);

        instance.registerProcess(SceneTransferProcess);
        instance.registerProcess(DestroyProcess);
        instance.registerProcess(CreateProcess);
        instance.registerProcess(BroadcastProcess);
        instance.registerProcess(SpinProcess);        // ours, before transforms are resolved
        instance.registerProcess(TransformProcess);
        instance.registerProcess(CameraProcess);
        instance.registerProcess(SpriteAnimationProcess);
        instance.registerProcess(SpriteRenderProcess);

        await super.init();
    }
}

const profile = new MyProfile({ mount: document.body });
profile.instance.createScene("main").onInit((scene) => { /* build the scene */ });
profile.instance.systems.sceneManager.setScene("main");
await profile.init();
```

There's no way yet to start from `GameProfile` and remove or swap one process. Copy its list (above, or `stl/game-profile.ts`) and change what you need.

### registering components

`registry.registerComponent(...)` tells the instance about component classes up front. Register every component your game uses. Calling `get()` with a component class that no object has ever had, and that was never registered, logs an error. `query()` with one just returns nothing.

## replacing a built-in process

Every stl process is optional. To use your own physics, for example, leave `PhysicsProcess` out of your profile and register yours where it was. Your process can use the stl components (`PhysicsBody`, `Collider`) or your own.

The built-in processes work as a whole: you can swap one out, but you can't reach into one and change a single step. `PhysicsProcess`'s collision and resolution steps, for example, are private.

## drawing your own things

`SpriteRenderProcess` only draws textured sprites. For shapes, text or effects, write a process that creates Pixi objects and adds them with `this.application.add(...)`. Positions you give them are in Pixi's space, which is y-down: use `(x, -y)` for a world position `(x, y)`. See [rendering](rendering.md#drawing-your-own-things).

Your game must use the same copy of `pixi.js` as the engine. With Vite, add `resolve: { dedupe: ["pixi.js"] }` to `vite.config.ts` if the engine is linked from another folder.
