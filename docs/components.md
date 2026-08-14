# components

State/data for all `GameObject`s. Primarily serve as pure data, ideally offering no functionality outside of what is needed to control its own state.

## common

- **Transform**: position, rotation, and scale. Already added to every `GameObject`
- **stl/SpriteRenderer**: texture alias, opacity, scale.
- **stl/Collider**: define collider shape
- **stl/PhysicsBody**: mass, velocity, gravity scale, restitution

## usage

Creation is very straighforward.

```ts
class CoinValue extends Component {
    constructor(public value: number) {
        super();
    }
}
```

To apply to a `GameObject`, use the add method.
```ts
add<T extends Component>(component: T): void;
```
```ts
gameObject.add(new CoinValue(10))

// add method can be chained
gameObject
    .add(new PhysicsBody())
    .add(new SpriteRenderer({
        textureAlias: "coin.png"
    }))
```

To retrieve the `Component`, use the get method.
```ts
get<T extends Component>(type: ComponentConstructor<T>): T | undefined;
```
```ts
const physicsBody = gameObject.get(PhysicsBody);
if (physicsBody) {
    console.log(physicsBody.velocity);
}

// transform is a special case as all GameObjects have the component
const transform = gameObject.transform;
```

## querying
Within a `Behavior` or `Process`, you may often want to access every `GameObject` within a `Scene` that possesses a specific `Component`.
```ts
query(typeArray: ComponentConstructor[]): GameObject[]
```
```ts
// behavior update method
update(ctx: BehaviorContext) {
    // query by single component
    ctx.scene.query([CameraOperator]);
    
    // query by multiple components (returns only GameObjects with both)
    ctx.scene.query([PhysicsBody, Collider]);
    
    // every GameObject in scene
    ctx.scene.query([]);
}
```


## tags
One convenient usage of a `Component` is to act as a "tag" as seen in many game engines. This is best seen in an example.
```ts
class PlayerTag extends Component {}

const Player = new Blueprint(
    (gameObject: GameObject) => {
        gameObject.add(new PlayerTag())
    }
);

class CollectibleBehavior extends Behavior {
    update(ctx: BehaviorContext) {
        const player = ctx.scene.query([PlayerTag])[0];
    }
}
```

## (optional) tracked components

The component class implements `Tracked` by default. Note that this does not mean that values are automatically tracked, only that the clas supports the `markModified` function. Calling `markModified(this)` within a method will mark a change in the `FrameChanges` object. Tracking is primarily used in engine components such as `Transform` or `stl/SpriteRenderer` for the sake of efficiency.
If choosing to implement manually, note this:
```ts
// _reset is called at the end of a frame changes cycle.
// for a class that requires nested tracking, this will need overriden.
_reset() {
    this.#position._reset();
    this.#position._reset();
    this._modified = false;
}

// similarly, the notify modication callback will also need overriden
set _notifyModification(callback: (() => void) | undefined) {
    this._notifyModificationInternal = callback;
    this.#position._notifyModification = callback;
    this.#scale._notifyModification = callback;
}

```