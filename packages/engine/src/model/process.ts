import type {InstanceSystems} from "../instance/index.js";
import {Registry} from "./registry.js";
import type {InstanceContext} from "../instance/index.js";

export type ProcessConstructor<T extends Process = Process> =
    new (args: {systems: InstanceSystems, registry: Registry}) => T;

export type ProcessContext = ConstructorParameters<typeof Process>[0];

export abstract class Process {
    #systems: InstanceSystems;
    #registry: Registry;
    constructor({systems, registry}: {systems: InstanceSystems, registry: Registry}) {
        this.#systems = systems;
        this.#registry = registry;
        this.init();
    }
    get registry() {
        return this.#registry;
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