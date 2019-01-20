// simple wrapper around zql pub socket that is basically a function factory
// allowing you to keep the publisher in-memory and call it by name when needed.

export class Publisher {
    private pubSocket: any;

    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }

    public make(name, encode?: Function) {
        if(encode) {
            return (data => {
                if(data === null) return;
                this.pubSocket.send([name,  encode(data)]);
            });
        } else {
            return (data => {
                if(data === null) return;
                this.pubSocket.send([name, data]);
            });
        }
    }
}