import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from "node:path";
import { fileURLToPath } from 'node:url'
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const window = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, "dist/preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    window.loadFile(path.join(__dirname, "index.html"));

    window.setMenuBarVisibility(false)
}


ipcMain.handle("trellis:read", async (_, relativePath) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    return fs.readFileSync(filePath).toString();
});

ipcMain.handle("trellis:write", async (_, relativePath, data) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    return fs.writeFileSync(filePath, data);
})

ipcMain.handle("trellis:ls", async (_, relativePath) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    return fs.readdirSync(filePath);
})


app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});