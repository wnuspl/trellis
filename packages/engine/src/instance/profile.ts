import {Instance} from "./instance.js";
import {DefaultInstanceConfig} from "./instance-config.js";

export type ProfileConfig = {
    mount: HTMLElement
}

export class Profile {
    instance: Instance;
    config: ProfileConfig;
    constructor(config: ProfileConfig) {
        this.instance = new Instance(DefaultInstanceConfig);
        this.config = config;
    }
    async init() {
        await this.instance.init(this.config.mount);
    }
}