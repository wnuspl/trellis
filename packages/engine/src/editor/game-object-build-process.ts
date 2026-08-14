import {Process, type ProcessConfig} from "../model/index.js";
import type {EditorContext} from "./editor-context.js";
import type {InstanceContext} from "../instance/index.js";

export class GameObjectBuildProcess extends Process {
    editorCtx: EditorContext;
    aliasMap: Map<number, string> = new Map();
    constructor(processContext: ProcessConfig, config: { editorContext: EditorContext }) {
        super(processContext);
        this.editorCtx = config.editorContext;
        console.log(`TO ADD OBJECTS, USE NUMBER KEYS\n${
            this.editorCtx.sceneLoader.config.keys().map((alias, index) => {
                this.aliasMap.set(index, alias);
                return `${index}: ${alias}`;
            }).toArray().join('\n')
        }`);
    }
    update(ctx: InstanceContext) {
        for (const [number, alias] of this.aliasMap.entries()) {
            if (!ctx.input.isKeyDown(`Digit${number}`)) continue;

            this.editorCtx.selected = this.editorCtx.sceneLoader.buildGameObject(ctx.scene, {
                alias,
                aspects: {}
            });
        }
    }
}