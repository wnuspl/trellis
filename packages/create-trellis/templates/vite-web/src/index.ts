import { ResourceLoader } from "@wnuspl/trellis/stl";
import { startGame } from "./game.js";

// Browsers can't touch the file system, so reads and writes go through the
// dev file server (`npm run file-server`, port set in trellis.config.json).
const FILE_SERVER = "http://127.0.0.1:5174";

async function post(route: string, body: object) {
    const res = await fetch(`${FILE_SERVER}/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`File server ${route} failed (${res.status})`);
    return res;
}

// A build has no file server: scene files are copied next to the page (see
// vite.config.ts) and fetched read-only, and the editor is unavailable.
const resourceLoader = import.meta.env.DEV
    ? new ResourceLoader({
        read: async (path) => (await post("read", { path })).text(),
        write: async (path, content) => { await post("write", { path, content }); },
    })
    : new ResourceLoader({
        read: async (path) => (await fetch(path)).text(),
        write: async () => { throw new Error("Scenes can't be saved in a build"); },
    });

await startGame({
    mount: document.body,
    resourceLoader,
    assets: Object.keys(import.meta.glob("/assets/*")).map((file) => file.slice(1)),
    editor: import.meta.env.DEV && new URLSearchParams(location.search).has("editor"),
});
