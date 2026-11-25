import {FrameRequest, type FrameRequestStore} from "../requests.js";
import {FrameEvent} from "../events.js";
import {Process} from "../model/index.js";
import type {BehaviorContext} from "../model/behavior.js";
import type {ProcessContext} from "../model/process.js";
import type {InstanceContext} from "../instance/index.js";

/**
 * A message from a behavior to any other behaviors. Subclass it to give it data,
 * post it from a behavior, and read it next frame like an event:
 *
 *     class Shake extends Broadcast { constructor(public amount: number) { super(); } }
 *     new Shake(6).post(ctx);
 *     for (const shake of ctx.events.get(Shake)) { ... }
 */
export class Broadcast extends FrameEvent {
    // Typed to match FrameEvent.post. Post from behaviors: a process should post a FrameEvent instead.
    post(ctx: BehaviorContext | ProcessContext) {
        (ctx.requests as FrameRequestStore).post(new BroadcastRequest(this));
    }
}

/** Carries a broadcast from the behavior that posted it to BroadcastProcess. */
export class BroadcastRequest extends FrameRequest {
    broadcast: Broadcast;
    constructor(broadcast: Broadcast) {
        super();
        this.broadcast = broadcast;
    }
}

/** Posts last frame's broadcasts as events, so behaviors can read them this frame. */
export class BroadcastProcess extends Process {
    update(ctx: InstanceContext) {
        for (const request of ctx.requests.get(BroadcastRequest)) {
            ctx.events.post(request.broadcast);
        }
    }
}
