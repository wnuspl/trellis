import type {InstanceConfig} from "./instance-config.js";
import {Scene} from "../model/scene.js";
import {Registry} from "../model/index.js";

export class SceneManager {
    #availableScenes: Map<string, Scene>;
    #current: Scene | null = null;
    constructor() {
        this.#availableScenes = new Map();
    }
    get current() {
        if (!this.#current) throw new Error("Tried to get current scene, none set");
        return this.#current;
    }
    registerScene(alias: string, scene: Scene): void {
        this.#availableScenes.set(alias, scene);
    }
    setScene(alias: string) {
        const target = this.#availableScenes.get(alias);
        if (!target) throw new Error(`Cannot set scene '${alias}' (doesn't exist)`);
        console.log(`Setting scene to ${alias}`);
        this.#current?.destroy();
        this.#current = target;
        target.init();
        // TODO: make it set to current after init
    }
}