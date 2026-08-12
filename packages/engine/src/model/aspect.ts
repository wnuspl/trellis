export interface AspectConstructor<T extends Aspect = Aspect> {
    new (...args: any[]): T;
    from(data: object): Aspect
}

export class Aspect {
    static from(data: object): Aspect {
        console.error(`Aspect from ${this.name} used but not defined`);
        return new Aspect();
    }
}