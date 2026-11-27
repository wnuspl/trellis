import {Application, Assets, Sprite, type Renderer, Container} from 'pixi.js';
import {WorldSprite} from "./world-sprite.js";
import {Camera} from "./camera.js";
import {Vector2} from "../utils/index.js";
import {DefaultViewportConfig, type ViewportConfig} from "../instance/instance-config.js";

export class PixiApplication {
    #app: Application<Renderer> | null;
    #world: Container;
    camera: Camera;
    backgroundColor: string = "#4e4e5e";
    viewportConfig: ViewportConfig = DefaultViewportConfig;
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
            await this.#app.init({
                background: this.backgroundColor,
                resizeTo: mount,
                resolution: devicePixelRatio,
                autoDensity: true,
            });
            mount.appendChild(this.#app.canvas);
            this.#app.stage.addChild(this.#world);
        } finally {
            this.#isInitializing = false;
        }
    }
    syncCamera() {
        if (!this.#app || this.#isInitializing) return;
        const centerX = this.#app.screen.width / 2;
        const centerY = this.#app.screen.height / 2;

        const scaleX = this.#app.screen.width / this.viewportConfig.size.x;
        const scaleY = this.#app.screen.height / this.viewportConfig.size.y;
        this.camera.baseScale = Math.min(scaleX, scaleY);

        this.#world.x = centerX - this.camera.position.x * this.camera.zoom;
        this.#world.y = centerY + this.camera.position.y * this.camera.zoom; // world space is y-up, render space is y-down
        this.#world.scale = this.camera.zoom * this.camera.baseScale;
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