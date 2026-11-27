import {Vector2} from "../utils/index.js";

export type ViewportConfig = {
    size: Vector2,
    mode: "fit"
}

export type InstanceConfig = {
    assetFileNameList: string[],
    backgroundColor: string,
    viewportConfig: ViewportConfig,
    timeScale: number
};

export const DefaultViewportConfig: ViewportConfig = {
    size: new Vector2(1080, 720),
    mode: "fit",
}

export const DefaultInstanceConfig = {
    assetFileNameList: [],
    backgroundColor: "#20202e",
    viewportConfig: DefaultViewportConfig,
    timeScale: 1,
};
