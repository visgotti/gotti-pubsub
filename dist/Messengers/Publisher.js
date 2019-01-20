"use strict";
// simple wrapper around zql pub socket that is basically a function factory
// allowing you to keep the publisher in-memory and call it by name when needed.
Object.defineProperty(exports, "__esModule", { value: true });
class Publisher {
    constructor(pubSocket) {
        this.pubSocket = pubSocket;
    }
    make(name, encode) {
        if (encode) {
            return (data => {
                if (data === null)
                    return;
                this.pubSocket.send([name, encode(data)]);
            });
        }
        else {
            return (data => {
                if (data === null)
                    return;
                this.pubSocket.send([name, data]);
            });
        }
    }
}
exports.Publisher = Publisher;
