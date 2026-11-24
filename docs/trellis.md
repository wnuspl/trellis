# trellis

Write code as normal. Don't be obstructed by the ceremony of game architecture. Trellis provides the structure for your game to grow according to its own needs.

```
npm create @wnuspl/trellis@latest my-game
```

The script asks which template to use. To skip the prompt, pass it after `--`:

```
npm create @wnuspl/trellis@latest my-game -- --template electron
```

| Template   | Run the game       | Scene editor                                   |
|------------|--------------------|------------------------------------------------|
| `vite-web` | `npm run file-server` + `npm run dev` | open the dev URL with `?editor` |
| `electron` | `npm run dev`      | `npm run editor`                               |

Other options: `--list` shows templates, `--force` scaffolds into a non-empty folder, `-y` takes defaults without prompting.

Each template is a folder in `packages/create-trellis/templates/` with an optional `template.json` (title, description, next steps). It is copied on top of `packages/create-trellis/shared/`, which holds the sample game. Add a folder there to add a template.


# how it fits together

- A **game object** is a bundle of **components** (data) and **behaviors** (per-object logic). A **blueprint** says how to build one.
- A **scene** holds the objects that exist right now. Only one scene runs at a time.
- **Processes** are systems that run over the whole scene every frame: physics, rendering, the camera.
- Behaviors and processes talk through **requests** ("please destroy this") and **events** ("these two collided").
- A **profile** decides which processes run. `GameProfile` gives you the standard set from `stl`, and any of them can be replaced with your own.

# sections

### start here
- [The project template](template.md): what's in it, your first game, building a scene from code

### basics
1. [Blueprints](blueprints.md)
2. [Components](components.md)
3. [Behaviors](behaviors.md)
4. [Scenes](scenes.md)
5. [Switching scenes](switching-scenes.md)

### how the engine runs
6. [The frame loop](frame-loop.md): what runs when, and `dt`
7. [Units and coordinates](coordinates.md)
8. [Requests and events](requests-and-events.md)
9. [Processes](processes.md): writing your own, profiles, replacing built-in systems

### stl
10. [Input](input.md)
11. [Physics](physics.md)
12. [Rendering](rendering.md): sprites, animation, camera, drawing your own things
