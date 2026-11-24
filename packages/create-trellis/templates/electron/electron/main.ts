import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Bundled to dist/main.js, so the project root is one level up.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Project root: where index.html, assets/ and scenes/ live.
const root = app.getAppPath();

// `npm run editor` passes --editor; the renderer reads it from the URL.
const editor = process.argv.includes("--editor");

// Resolve a renderer-supplied path, refusing anything outside the project.
function resolveInProject(relativePath: string): string {
    const resolved = path.resolve(root, relativePath);
    const fromRoot = path.relative(root, resolved);
    if (fromRoot.startsWith("..") || path.isAbsolute(fromRoot)) {
        throw new Error(`Path escapes the project: ${relativePath}`);
    }
    return resolved;
}

ipcMain.handle("trellis:read", (_, relativePath: string) =>
    fs.readFile(resolveInProject(relativePath), "utf8"));

ipcMain.handle("trellis:write", (_, relativePath: string, data: string) =>
    fs.writeFile(resolveInProject(relativePath), data));

ipcMain.handle("trellis:ls", (_, relativePath: string) =>
    fs.readdir(resolveInProject(relativePath)));

function createWindow() {
    const window = new BrowserWindow({
        width: 1280,
        height: 720,
        title: editor ? "Trellis Editor" : "Trellis Game",
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    window.setMenuBarVisibility(false);
    window.loadFile(path.join(root, "index.html"), {
        query: editor ? { editor: "1" } : {},
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
