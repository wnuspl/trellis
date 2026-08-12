import type {GameObject} from "./game-object.js";
import type {InstanceContext} from "../instance/index.js";

export type BehaviorConstructor<T extends Behavior, TConfig> = new (gameObject: GameObject, config: TConfig) => T;

export abstract class Behavior {
    #gameObject: GameObject;
    constructor(gameObject: GameObject) {
        this.#gameObject = gameObject;
        this.init();
    }
    get gameObject() {
        return this.#gameObject;
    }
    update(ctx: InstanceContext): void {}
    init(): void {}
}