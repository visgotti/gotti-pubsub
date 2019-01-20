export declare class Publisher {
    private pubSocket;
    constructor(pubSocket: any);
    make(name: any, encode?: Function): (data: any) => void;
}
