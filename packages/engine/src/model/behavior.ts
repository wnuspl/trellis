import type {GameObject} from "./game-object.js";
import type {InstanceContext} from "../instance/index.js";
import type {ReadonlyScene, Scene} from "./scene.js";
import type {InputSystem} from "../input/input-system.js";
import type {FrameEventStore, ReadonlyFrameEventStore} from "../events.js";
import type {ReadonlyFrameChanges} from "./frame-changes.js";
import {FrameRequestStore} from "../requests.js";
import type {Camera} from "../pixijs/camera.js";
import type {Component, ComponentConstructor} from "./component.js";
import type {Transform} from "../core/transform.js";

export type BehaviorConstructor<T extends Behavior<any>, TConfig> = {
    new (gameObject: GameObject<any>, config: TConfig): T;
    readonly requires: readonly ComponentConstructor[];
};


export type BehaviorContext = {
    dt: number;
    scene: ReadonlyScene;
    input: InputSystem;
    events: ReadonlyFrameEventStore;
    changes: ReadonlyFrameChanges;
    requests: FrameRequestStore;
    camera: Camera;
}

export abstract class Behavior<C extends Component = Transform> {
    static readonly requires: readonly ComponentConstructor[] = [];
    #gameObject: GameObject<C>;
    #initialized = false;
    constructor(gameObject: GameObject<C>) {
        this.#gameObject = gameObject;
    }
    get gameObject() {
        return this.#gameObject;
    }
    _initOnce(ctx: BehaviorContext) {
        if (this.#initialized) return;
        this.#initialized = true;
        this.init(ctx);
    }
    update(ctx: BehaviorContext): void {}
    init(ctx: BehaviorContext): void {}
}
