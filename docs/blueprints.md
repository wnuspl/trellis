# blueprints

The fundamental way to create unique game objects. Provide two callbacks to that will be used to modify an empty `GameObject`
```ts
constructor(
    build?: (gameObject: GameObject) => void,
    children?: () => Blueprint[],
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
Called upon instantiation of `gameObject`. Returned `Blueprint`s are recursively processed to create children of `gameObject` provided to `build`.
```ts
() => [
    Wheels,
    Gun,
    Body
]
```

## usage
Most commonly, will be used with `stl/SceneLoader`. Registering a `Blueprint` with an alias and target component types allows for flexible and idiomatic scene loading.
```ts
sceneLoader.register({
    alias: "coin",
    blueprint: Coin,
    targetComponentTypes: [Transform, CoinValue]
})
```