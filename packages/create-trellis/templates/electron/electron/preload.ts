// Runs in a sandboxed preload, which must be CommonJS: build.mjs emits dist/preload.cjs.
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("trellis", {
    read: (path: string): Promise<string> => ipcRenderer.invoke("trellis:read", path),
    write: (path: string, data: string): Promise<void> => ipcRenderer.invoke("trellis:write", path, data),
    ls: (path: string): Promise<string[]> => ipcRenderer.invoke("trellis:ls", path),
});
