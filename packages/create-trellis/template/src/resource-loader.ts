import {ResourceLoader} from "@wnuspl/trellis/stl";

async function writeToFile(path: string, content: string) {
    await fetch("http://localhost:5174/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content })
    });
}
async function readFromFile(path: string) {
    const res = await fetch("http://localhost:5174/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path })
    });
    if (!res.ok) throw new Error("Could not find file");
    return await res.text();
}


export const resourceLoader = new ResourceLoader({
    read: readFromFile,
    write: writeToFile
});
