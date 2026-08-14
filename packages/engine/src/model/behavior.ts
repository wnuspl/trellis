import type {GameObject} from "./game-object.js";
import type {InstanceContext} from "../instance/index.js";
import type {ReadonlyScene, Scene} from "./scene.js";
import type {InputSystem} from "../input/input-system.js";
import type {FrameEventStore, ReadonlyFrameEventStore} from "../events.js";
import type {ReadonlyFrameChanges} from "./frame-changes.js";
import {FrameRequestStore} from "../requests.js";
import type {Camera} from "../pixijs/camera.js";

export type BehaviorConstructor<T extends Behavior, TConfig> = new (gameObject: GameObject, config: TConfig) => T;


export type BehaviorContext = {
    dt: number;
    scene: ReadonlyScene;
    input: InputSystem;
    events: ReadonlyFrameEventStore;
    changes: ReadonlyFrameChanges;
    requests: FrameRequestStore;
    camera: Camera;
}

export abstract class Behavior {
    #gameObject: GameObject;
    constructor(gameObject: GameObject) {
        this.#gameObject = gameObject;
        this.init();
    }
    get gameObject() {
        return this.#gameObject;
    }
    update(ctx: BehaviorContext): void {}
    init(): void {}
}