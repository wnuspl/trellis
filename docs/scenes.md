# scenes

Your blueprints say what an object *is*. A scene file says where the objects go and what's different about each one. `stl/SceneLoader` reads and writes these files.

Scene files store only what you changed. When a scene loads, every object is built from its blueprint first, and the saved changes are applied on top. Editing a blueprint later (a new sprite, a different speed) shows up in every scene, except where a scene changed that value itself.

## setup

```ts
import { Transform } from "@wnuspl/trellis";
import { SceneLoader, SpriteRenderer } from "@wnuspl/trellis/stl";

const sceneLoader = new SceneLoader(resourceLoader);

// Components a scene may change, under the names used in the file.
sceneLoader.components({ Transform, SpriteRenderer, CoinValue });

// Blueprints a scene may place, under the names used in the file.
sceneLoader.register(
    { alias: "player", blueprint: Player },
    { alias: "coin", blueprint: Coin },
);
```

Use object shorthand (`{ Transform }`) for components. The names you give are written to the file, so keep them stable: renaming one breaks existing scenes. They also survive minified production builds, where class names don't.

Only registered components are saved. Leave out components a scene should never change, such as ones a behavior rewrites every frame.

`resourceLoader` is how the loader reads and writes files. The project templates already create one for you.

## loading

```ts
const main = instance.createScene("main");
main.onInit(async (scene) => {
    await sceneLoader.load(scene, "scenes/main.json");
});
```

To place one object from code the same way a scene file would:
```ts
const coin = sceneLoader.buildGameObject(scene, { blueprint: "coin" });
```
Objects built this way are saved with the scene. Objects built with `scene.build(...)` or a `CreateRequest` are not.

## saving

```ts
await sceneLoader.save(scene, "scenes/main.json");
```

In the editor, press **Enter** to save the current scene.

Saving compares each object with what its blueprint built and writes only the differences. Setting a value back to the blueprint's value removes it from the file.

## changing blueprint children

Each child a blueprint builds can be changed on its own. Click a child in the editor (say a tank's gun; it needs a `Collider` to be clickable) and move it, and only the gun's change is saved:

```json
{ "blueprint": "tank", "changes": { "gun": { "Transform": { "rotation": 0.5 } } } }
```

Name children instead of listing them, so a saved change still finds the right child after you reorder the blueprint.

## the file

You rarely need to edit scene files by hand, but they're meant to be readable and to merge cleanly in git.

```json
{
  "version": 2,
  "objects": [
    {
      "blueprint": "tank",
      "changes": {
        "":              { "Transform": { "position": { "x": 5, "y": 0 } } },
        "turret/barrel": { "SpriteRenderer": { "opacity": 0.5 } }
      },
      "children": [
        { "blueprint": "flag", "at": "turret" }
      ]
    }
  ]
}
```

| field | meaning |
|---|---|
| `blueprint` | The alias to build. Builds the object and all of its blueprint children. |
| `changes` | Component values to change, by child path. `""` is the object itself, `"turret/barrel"` is the `barrel` child of the `turret` child. Only the fields listed change; partial values like `{ "x": 5 }` work. |
| `children` | Other objects placed under this one, each written the same way. `at` places one under a blueprint child instead of the object itself. |

Files from older versions (a plain list of `{ "alias", "components" }`) still load, and are written in this format the next time you save.

## when a blueprint changes

If a scene changes something that no longer exists (a child you renamed, a component you removed or didn't register), loading logs a warning and skips it. The change is **kept** and written back on save, so renaming the child back restores it. To drop it for good, delete it from the file.

## limits

- Scenes can change component values, not which components or children an object has. Adding or removing components or blueprint children in a scene isn't saved yet.
- Behaviors are constructed while the blueprint builds, before the scene's changes are applied. Read component values in `update`, not in a behavior's constructor.
