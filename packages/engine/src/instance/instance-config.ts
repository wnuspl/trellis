import {Vector2} from "../utils/index.js";
import {Viewport} from "../pixijs/viewport.js";


export type InstanceConfig = {
    assetFileNameList: string[],
    backgroundColor: string,
    viewportConfig: Viewport,
    timeScale: number
};

export const DefaultViewport: Viewport = new Viewport(
    new Vector2(1080, 720),
    "fit"
);

export const DefaultInstanceConfig = {
    assetFileNameList: [],
    backgroundColor: "#20202e",
    viewportConfig: DefaultViewport,
    timeScale: 1,
};
