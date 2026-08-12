import type {InputSystem} from "../input/input-system.js";
import type {FrameEventStore} from "../events.js";
import {FrameRequestStore} from "../requests.js";
import type {Camera} from "../pixijs/camera.js";
import type {Scene} from "../model/scene.js";
import {GameObject, type ReadonlyFrameChanges} from "../model/index.js";

export type InstanceContext = {
    dt: number;
    scene: Scene;
    input: InputSystem;
    events: FrameEventStore;
    changes: ReadonlyFrameChanges;
    requests: FrameRequestStore;
    camera: Camera;
};