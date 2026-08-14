import type {InstanceSystems} from "../instance/index.js";
import {Registry} from "./registry.js";
import type {InstanceContext} from "../instance/index.js";
import {type ReadonlyScene, Scene} from "./scene.js";
import type {InputSystem} from "../input/input-system.js";
import {FrameEventStore, type ReadonlyFrameEventStore} from "../events.js";
import type {ReadonlyFrameChanges} from "./frame-changes.js";
import {FrameRequestStore, type ReadonlyFrameRequestStore} from "../requests.js";
import type {Camera} from "../pixijs/camera.js";

export type ProcessConstructor<T extends Process = Process> =
    new (args: {systems: InstanceSystems, registry: Registry}) => T;

export type ProcessConfig = ConstructorParameters<typeof Process>[0];

export type ProcessContext = {
    dt: number;
    scene: Scene;
    input: InputSystem;
    events: FrameEventStore;
    changes: ReadonlyFrameChanges;
    requests: ReadonlyFrameRequestStore;
    camera: Camera;
}

export abstract class Process {
    #systems: InstanceSystems;
    #registry: Registry;
    constructor({systems, registry}: {systems: InstanceSystems, registry: Registry}) {
        this.#systems = systems;
        this.#registry = registry;
        this.init();
    }
    get assetManager() {
        return this.#systems.assetManager;
    }
    get application() {
        return this.#systems.application;
    }
    get sceneManager() {
        return this.#systems.sceneManager;
    }
    update(ctx: InstanceContext): void {}
    init(): void {}
}