import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("trellis", {
    read: (path: string) =>
        ipcRenderer.invoke("trellis:read", path),

    write: (path: string, data: string) =>
        ipcRenderer.invoke("trellis:write", path, data),

    ls: (path: string) =>
        ipcRenderer.invoke("trellis:ls", path),
});