import { Registry } from "../model/index.js";
import { PixiApplication, PixiAssetManager } from "../pixijs/index.js";
import type { Process, ProcessConstructor } from "../model/index.js";
import { DefaultInstanceConfig, type InstanceConfig } from "./instance-config.js";
import type {InstanceSystems} from "./instance-systems.js";
import {DOMInput} from "../input/dom-input.js";
import type {InstanceContext} from "./instance-context.js";
import {FrameEventStore} from "../events.js";
import {FrameRequestStore} from "../requests.js";
import {MutableFrameChanges} from "../model/index.js";
import {Scene} from "../model/scene.js";
import {SceneManager} from "./scene-manager.js";
import {CollisionEvent} from "../stl/index.js";


export class Instance {
    #processes: Map<ProcessConstructor, Process>;
    #config: InstanceConfig
    #systems: InstanceSystems;
    #registry: Registry;
    #context: InstanceContext;
    constructor(config: InstanceConfig = DefaultInstanceConfig) {
        this.#config = config;
        this.#registry = new Registry();
        this.#systems = {
            application: new PixiApplication(),
            assetManager: new PixiAssetManager(),
            sceneManager: new SceneManager(),
        };
        this.systems.sceneManager.registerScene("default", new Scene(this.registry));
        this.systems.sceneManager.setScene("default")
        this.#context = {
            dt: 0,
            scene: this.systems.sceneManager.current,
            input: new DOMInput(),
            events: new FrameEventStore(),
            changes: new MutableFrameChanges(),
            requests: new FrameRequestStore(),
            camera: this.#systems.application.camera
        };
        this.#processes = new Map();
    }
    get registry() {
        return this.#registry;
    }
    get config() {
        return this.#config;
    }
    get context() {
        return this.#context;
    }
    get systems() {
        return this.#systems;
    }
    get processes() {
        return this.#processes;
    }
    async init(mount: HTMLElement) {
        const assetManager = this.#systems.assetManager;
        const application = this.#systems.application;
        const input = this.#context.input;

        await assetManager.registerAssetFiles(this.#config.assetFileNameList);
        await assetManager.load();

        input.init(mount);


        await application.init(mount);
        application.onTick(this.#updateGlobal.bind(this));
        application.onTick(input.update.bind(input));
    }
    registerProcess<T extends Process>(type: new (args: ConstructorParameters<typeof Process>[0]) => T): T;
    registerProcess<T extends Process, TConfig>(type: new (args: ConstructorParameters<typeof Process>[0], config: TConfig) => T,config: TConfig): T;
    registerProcess(type: any, config?: any) {
        const process = new type({
            systems: this.#systems,
            registry: this.#registry
        }, config);
        if (this.#processes.has(type)) {
            console.error(`Process ${type.name} already registered.`);
        }
        this.#processes.set(type, process);
    }
    #updateGlobal(dt: number) {
        this.#context = {
            ...this.#context,
            dt,
            scene: this.#systems.sceneManager.current,
        }
        this.#context.scene = this.#systems.sceneManager.current;

        this.#updateProcesses(this.#context);

        const changes = new MutableFrameChanges();
        this.#registry.frameChanges = changes;
        this.#context.changes = changes;
        this.#context.requests.clear();
        this.#context.camera = this.#systems.application.camera;

        this.#updateBehaviors(this.#context);
        this.#context.events.clear();

    }
    #updateProcesses(ctx: InstanceContext) {
        for (const process of this.processes.values()) {
            process.update(ctx);
        }
    }
    #updateBehaviors(ctx: InstanceContext) {
        const gameObjects = this.#context.scene.query([]);
        for (const gameObject of gameObjects) {
            for (const behavior of gameObject.behaviors) {
                behavior.update(ctx);
            }
        }
    }

    createScene(name: string): Scene {
        const scene = new Scene(this.registry);
        this.systems.sceneManager.registerScene(name, scene);
        return scene;
    }
}