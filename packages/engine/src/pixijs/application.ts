import {Application, Assets, Sprite, type Renderer, Container} from 'pixi.js';
import {WorldSprite} from "./world-sprite.js";
import {Camera} from "./camera.js";
import {Vector2} from "../utils/index.js";

export class PixiApplication {
    #app: Application<Renderer> | null;
    #world: Container;
    camera: Camera;
    backgroundColor: string = "#4e4e5e";
    #isInitializing: boolean;
    constructor() {
        this.#app = null;
        this.#world = new Container();
        this.#isInitializing = false;
        this.camera = new Camera();
    }
    async init(mount: HTMLElement) {
        if (this.#app || this.#isInitializing) return;

        try {
            this.#isInitializing = true;
            this.#app = new Application();
            await this.#app.init({ background: this.backgroundColor, resizeTo: mount });
            mount.appendChild(this.#app.canvas);
            this.#app.stage.addChild(this.#world);
        } finally {
            this.#isInitializing = false;
            this.onTick(this.syncCamera.bind(this));
        }
    }
    syncCamera() {
        if (!this.#app || this.#isInitializing) return;
        const centerX = this.#app.screen.width / 2;
        const centerY = this.#app.screen.height / 2;

        this.#world.x = centerX - this.camera.position.x * this.camera.zoom;
        this.#world.y = centerY - this.camera.position.y * this.camera.zoom;
        this.#world.scale = this.camera.zoom;
    }

    onTick(callback: (deltaTime: number) => void) {
        if (!this.#app || this.#isInitializing) {
            console.error("Pixi app is not initialized.");
            return;
        }

        this.#app.ticker.add((time) => callback(time.deltaTime));
    }

    add(object: WorldSprite | Container) {
        if (!this.#app || this.#isInitializing) {
            console.error("Pixi app is not initialized.");
            return;
        }
        if (object instanceof WorldSprite) object = object.sprite;
        this.#world.addChild(object);
    }

    destroy(): void {
        if (!this.#app) return;
        
        this.#app.destroy(true, {
            children: true,
            texture: true,
            context: true
        });
        
        this.#app = null;
    }
}