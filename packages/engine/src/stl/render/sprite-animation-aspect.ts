import {Aspect} from "../../model/index.js";

export type Animation = {
    frames: string[],
    frameDuration: number,
    loop: boolean,
}

export class SpriteAnimation extends Aspect {
    animations: Record<string, Animation>;
    #currentAnimation: Animation = { frames: [], frameDuration: 0, loop: false };
    #currentFrame: number = 0;
    #timer: number = 0;
    constructor(animations: Record<string, Animation>, initial: string) {
        super();
        this.animations = animations;
        this.currentAnimation = initial;
    }
    set currentAnimation(animationName: string) {
        const animation = this.animations[animationName];
        if (!animation) throw new Error(`Animation with name ${animationName} not found`);
        this.#currentAnimation = animation;
        this.#currentFrame = 0;
        this.#timer = 0;
    }
    tick(dt: number) {
        const change = this.#timer == 0 ? this.#currentAnimation.frames[this.#currentFrame]! : null;
        this.#timer += dt;
        if (this.#timer >= this.#currentAnimation.frameDuration) {
            this.#timer = 0;
            this.#currentFrame += 1;
            if (this.#currentAnimation.loop) {
                this.#currentFrame %= this.#currentAnimation.frames.length;
            }
        }
        return change;
    }
}