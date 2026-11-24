# blueprints

The fundamental way to create unique game objects. Provide two callbacks to that will be used to modify an empty `GameObject`
```ts
constructor(
    build?: (gameObject: GameObject) => void,
    children?: () => Blueprint[] | Record<string, Blueprint>,
)
```
## build
Called upon instantiation of `gameObject`. Use the build callback to add specific components, behaviors, etc.
```ts
(gameObject: GameObject) => {
    gameObject.attach(PlayerController);
    gameObject
        .add(new SpriteRenderer({
            textureAlias: "player.png"
        }))
        .add(new PhysicsBody())
}
```

## children
Return the blueprints to build as children of this object. Each one is built (with its own children) under `gameObject`.

Give children names by returning an object:
```ts
() => ({
    wheels: Wheels,
    gun: Gun,
    body: Body,
})
```
Scene files use these names to find a child, so a saved change to the gun still finds the gun after you edit the blueprint. Names can't be empty or contain `/`.

A list also works, but its children are named by position (`"0"`, `"1"`, ...), so reordering the list changes which child a scene's saved changes apply to.
```ts
() => [Wheels, Gun, Body]
```

### finding children
From a behavior or process, find a child by its name, or a nested child by its path:
```ts
const gun = ctx.scene.resolvePath(tank, "gun");
const barrel = ctx.scene.resolvePath(tank, "turret/barrel");
```
`tank` must be the object the blueprint was built as; paths are relative to it.

Two more lookups:
```ts
ctx.scene.getParent(gun);  // tank
ctx.scene.getOrigin(gun);  // { blueprint: Gun, instanceRoot: tank, path: ["gun"] }
```
`getOrigin` returns `undefined` for objects that weren't built from a blueprint.

## usage
From a behavior, ask for an object to be built with a `CreateRequest`. It is built later in the same frame:
```ts
new CreateRequest(Coin).post(ctx);
new CreateRequest(Flag, tank).post(ctx);  // built under another object
```

When setting up a scene (in `scene.onInit`), you can build directly:
```ts
const tank = scene.build(Tank);
```

To place blueprints in scene files, register them with a `SceneLoader` under an alias. See [scenes](scenes.md).
```ts
sceneLoader.register({ alias: "coin", blueprint: Coin });
```
