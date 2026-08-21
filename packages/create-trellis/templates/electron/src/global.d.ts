export {};

declare global {
    interface Window {
        trellis: {
            read(path: string): Promise<string>;
            write(path: string, data: string): Promise<void>;
            ls(path: string): Promise<string[]>;
        };
    }
}