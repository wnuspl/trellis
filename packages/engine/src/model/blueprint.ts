import type {GameObject} from "./game-object.js";

export class Blueprint {
    constructor(
        readonly build: (gameObject: GameObject) => void = () => {},
        readonly children: () => Blueprint[] = () => [],
    ) {}
}
