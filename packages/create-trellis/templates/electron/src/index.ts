import { ResourceLoader } from "@wnuspl/trellis/stl";
import { startGame } from "./game.js";

// File access goes through the preload bridge (see electron/preload.ts).
const resourceLoader = new ResourceLoader({
    read: (path) => window.trellis.read(path),
    write: (path, data) => window.trellis.write(path, data),
});

const assets = (await window.trellis.ls("assets")).map((fileName) => `assets/${fileName}`);

await startGame({
    mount: document.body,
    resourceLoader,
    assets,
    editor: new URLSearchParams(location.search).has("editor"),
});
