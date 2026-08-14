import {Component} from "../../model/index.js";
import {Vector2} from "../../utils/index.js";


type PhysicsBodyArgs = {
    velocity?: Vector2;
    mass?: number;
    gravityScale?: number;
    static?: boolean;
    restitution?: number;
}

export class PhysicsBody extends Component {
    velocity: Vector2;
    gravityScale: number;
    mass: number;
    static: boolean;
    restitution: number;
    constructor(args?: PhysicsBodyArgs) {
        super();
        args = args ?? {};
        this.velocity = args.velocity ?? new Vector2(0,0);
        this.mass = args.mass ?? 1;
        this.gravityScale = args.gravityScale ?? 0;
        this.static = args.static ?? false;
        this.restitution = args.restitution ?? 0;
    }
}