type ResourceLoaderFunctions = {
    read: (path: string) => Promise<string>;
    write: (path: string, data: string) => Promise<void>;
};

export class ResourceLoader {
    read: ResourceLoaderFunctions["read"];
    write: ResourceLoaderFunctions["write"];

    constructor(functions: ResourceLoaderFunctions) {
        this.read = functions.read;
        this.write = functions.write;
    }
}