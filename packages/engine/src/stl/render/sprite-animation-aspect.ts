import {Aspect} from "../../model/index.js";

export type AnimationConfig = {
    frames: string[],
    frameDuration: number,
    loop: boolean,
}

export class SpriteAnimation extends Aspect {
    animations: Record<string, AnimationConfig>;
    #currentAnimationConfig: AnimationConfig = { frames: [], frameDuration: 0, loop: false };
    #currentAnimation: string = "";
    #currentFrame: number = 0;
    #timer: number = 0;
    constructor(animations: Record<string, AnimationConfig>, initial: string) {
        super();
        this.animations = animations;
        this.currentAnimation = initial;
    }
    set currentAnimation(animationName: string) {
        if (this.#currentAnimation === animationName) return;
        const animation = this.animations[animationName];
        if (!animation) throw new Error(`Animation with name ${animationName} not found`);
        this.#currentAnimationConfig = animation;
        this.#currentFrame = 0;
        this.#currentAnimation = animationName;
        this.#timer = 0;
    }
    get currentAnimation(): string {
        return this.#currentAnimation;
    }
    tick(dt: number) {
        const change = this.#timer == 0 ? this.#currentAnimationConfig.frames[this.#currentFrame]! : null;
        this.#timer += dt;
        if (this.#timer >= this.#currentAnimationConfig.frameDuration) {
            this.#timer = 0;
            this.#currentFrame += 1;
            if (this.#currentAnimationConfig.loop) {
                this.#currentFrame %= this.#currentAnimationConfig.frames.length;
            }
        }
        return change;
    }
}