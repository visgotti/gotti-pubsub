import * as zmq from 'zeromq';

export type Handler<T> = (data: any) => void;
export interface SubscriptionHandler { (data: any): Handler<Function>; id: string; decode?: Function }

export type Sequence = number;

export interface MessengerConfig {
    ['servers']:
        Array<{
            ['name']: string,
            ['messengerOptions']: any
        }>
}

export interface PublishOptions {
    pubSocketURI: string,
}

export interface SubscribeOptions {
    pubSocketURIs: Array<string>,
}

export interface MessengerOptions {
    id: string,
    publish?: PublishOptions,
    subscribe?: SubscribeOptions,
}

enum CREATED_OR_ADDED {
    CREATED = 'CREATED',
    ADDED = 'ADDED',
}

import { Publisher } from './Messengers/Publisher';
import { Subscriber } from './Messengers/Subscriber';

export class Messenger {
    public id: string;
    public subscriptions?: Set<string>;
    public publications?: { [name: string]: Function };
    public subscriber?: any;
    public publisher?: any;
    private pubSocket: any;
    private subSocket: any;

    private options: MessengerOptions;

    constructor(options: MessengerOptions) {
        this.id = options.id;
        this.options = options;
        this.pubSocket = null;

        this.publications = null;
        this.publisher = null;

        this.subscriptions = null;
        this.subscriber = null;
        this.initializeMessengers(options);
    }

    /**
     * sets and initializes available public functions based on messenger options passed in.
     * @param options
     */
    private initializeMessengers(options: MessengerOptions) {
        if(options.publish) {
            this.publications = {};
            this.pubSocket = zmq.socket('pub');
            this.pubSocket.bindSync(options.publish.pubSocketURI);
            this.publisher = new Publisher(this.pubSocket);
            this.getOrCreatePublish = this._getOrCreatePublish;
            this.createPublish = this._createPublish;
            this.removePublish = this._removePublish;
            this.removeAllPublish = this._removeAllPublish;
        }

        if(options.subscribe) {
            this.subSocket = zmq.socket('sub');
            for(let i = 0; i < options.subscribe.pubSocketURIs.length; i++) {
                this.subSocket.connect(options.subscribe.pubSocketURIs[i]);
            }
            this.subscriptions = new Set();
            this.subscriber = new Subscriber(this.subSocket);
            this.createSubscription = this._createSubscription;
            this.createOrAddSubscription = this._createOrAddSubscription;
            this.removeSubscriptionById = this._removeSubscriptionById;
            this.removeAllSubscriptionsWithId = this._removeAllSubscriptionsWithId;
            this.removeAllSubscriptionsWithName = this._removeAllSubscriptionsWithName;
            this.removeAllSubscriptions = this._removeAllSubscriptions;
            this.getHandlerIdsForSubscriptionName = this._getHandlerIdsForSubscriptionName;
            this.getSubscriptionNamesForHandlerId = this._getSubscriptionNamesForHandlerId;
        }
    }

    public close() {
        if(this.pubSocket) {
            this._removeAllPublish();
            this.pubSocket.unbindSync(this.options.publish.pubSocketURI);
            this.pubSocket.close();
            this.pubSocket = null;
        }
        if(this.subSocket) {
            this._removeAllSubscriptions();
            this.subSocket.close();
            this.subSocket = null;
        }
    }

    /*
     * @param name - name for publish method
     * @param afterHandler - hook used for cleanup after publishing a method, gets message sent as param.
     * @param serializer - enum value that tells the publisher how to encode your message, look at SERIALIZER_TYPES for more info
     */
    public createPublish(name: string, encode?: Function | boolean) : Function { throw new Error('Messenger is not configured to publish.') }

    /**
     * does same thing as createPublish but if the publish name already exists it will return the handler.
     * @param name - name for publish method
     * @param serializer - enum value that tells the publisher how to encode your message, look at SERIALIZER_TYPES for more info
     */
    public getOrCreatePublish(name: string, encode?: Function | boolean) : Function { throw new Error('Messenger is not configured to publish.') }
    public removePublish(name) { throw new Error('Messenger is not configured to publish.')}
    public removeAllPublish() { throw new Error('Messenger is not configured to publish.')}

    /**
     * creates a new subscription and subscription handler to process data when receiving a publication. Throws error if handler already exists.
     * @param name - name of publication to subscribe to.
     * @param id - identifier for handler to run on publication
     * @param handler - method that takes in publication data as parameter when received.
     * @param decode - function used to decode incoming data, if omitted, uses JSON.
     * @returns boolean - returns true if it was successful.
     */
    public createSubscription(name: string, id: string, handler: Handler<Function>, decode?: Function | boolean) : boolean { throw new Error('Messenger is not configured to use subscriptions.') }

    /**
     * creates a new subscription if it doesnt exist but if it does, instead of throwing an error it will add a new handler to be ran on the publication
     * @param name - name of publication to subscribe to.
     * @param id - identifier for handler to run on publication
     * @param handler - method that takes in publication data as parameter when received.
     * @param decode - function used to decode incoming data, if omitted, uses JSON.parse. Set implicitly to false for no encoding.
     * @returns CREATED_OR_ADDED - enum value to signify if you created new subscription or added new handler to existing subscription.
     */
    public createOrAddSubscription(name: string, id: string, handler: Handler<Function>, decode?: Function | boolean) : CREATED_OR_ADDED { throw new Error('Messenger is not configured to use subscriptions.') }

    /**
     * removes specific subscription by id
     * @param id - id of subscription that gets returned on creation.
     * @param name - name of subscription that gets returned on creation.
     * @returns - number of subscriptions removed.
     */
    public removeSubscriptionById(id: string, name: string) : number { throw new Error('Messenger is not configured to use subscriptions.')}
    /**
     * removes all handlers for all subscriptions that have the given id.
     * @param id - id used to identify handlers for different subscription names.
     * @returns number - ammount of handlers removed.
     */
    public removeAllSubscriptionsWithId(id: string) : number { throw new Error('Messenger is not configured to use subscriptions.')}
    public removeAllSubscriptionsWithName(name: string) { throw new Error('Messenger is not configured to use subscriptions.')}
    public removeAllSubscriptions() { throw new Error('Messenger is not configured to use subscriptions.')}

    /**
     * returns all ids that have a handler registered for name.
     * @param name
     * @returns array
     */
    public getHandlerIdsForSubscriptionName(name: string) { throw new Error('Messenger is not configured to use subscriptions.') }

    /**
     * returns all subscription names that a handler id is waiting for.
     * @param id
     * @returns array
     */
    public getSubscriptionNamesForHandlerId(id: string) { throw new Error('Messenger is not configured to use subscriptions.') }

    private _createSubscription(name: string, id: string, handler: Handler<Function>, decode=JSON.parse) : boolean {
        if(this.subscriptions.has(name)) {
            throw new Error(`Subscription already has a handler for name: ${name}. If you want to add multiple handlers use createOrAddSubscription or the addHandler method directly on your subscription object.`);
        }

        let _decode = this.validateDecoder(decode);

        this.subscriptions.add(name);
        const subscribed = this.subscriber.addHandler(name, id, handler, _decode);
        if(subscribed.error) {
            throw new Error(subscribed.error);
        }
        return true;
    }

    private _createOrAddSubscription(name: string, id: string, handler: Handler<Function>,  decode=JSON.parse) : CREATED_OR_ADDED {
        let createdOrAdded = CREATED_OR_ADDED.CREATED;

        let _decode = this.validateDecoder(decode);

        if(!(this.subscriptions.has(name))) {
            this.subscriptions.add(name);
            createdOrAdded = CREATED_OR_ADDED.ADDED;
        }

        const subscribed = this.subscriber.addHandler(name, id, handler, _decode);
        if(subscribed.error) {
            throw new Error(subscribed.error);
        }
        return createdOrAdded;
    }

    private _removeSubscriptionById(id: string, name: string) : number {
        const removed = this.subscriber.removeHandlerById(id, name);
        if(!(removed.success)) return 0;


        if(removed.handlersLeft === 0) {
            this.subscriptions.delete(removed.name);
        }
        return removed.handlersLeft;
    }

    private _removeAllSubscriptionsWithId(id: string) : number {
        const { removed, subscriptionsToRemove } = this.subscriber.removeAllHandlersWithId(id);
        subscriptionsToRemove.forEach(name => {
            this.subscriptions.delete(name);
        });
        return removed
    }

    private _removeAllSubscriptionsWithName(name: string) : boolean {
        if (this.subscriptions.has(name)) {
            this.subscriber.removeAllHandlersWithName(name);
            this.subscriptions.delete(name);
            return true;
        } else {
            throw new Error(`Subscription does not exist for name: ${name}`);
        }
    }

    private _removeAllSubscriptions() {
        for(let subName of this.subscriptions.values()) {
            this._removeAllSubscriptionsWithName(subName);
        }
    }

    private _getHandlerIdsForSubscriptionName(name: string) : Array<string> {
        return this.subscriber.getHandlerIdsForSubscriptionName(name);
    }

    private _getSubscriptionNamesForHandlerId(id: string) : Array<string> {
        return this.subscriber.getSubscriptionNamesForHandlerId(id);
    }

    private _createPublish(name: string, encode=JSON.stringify) : Function {
        if(this.publications[name]) {
            throw new Error(`Duplicate publisher name: ${name}`);
        }

        let _encode = this.validateEncoder(encode);

        const publish = this.publisher.make(name, _encode);
        this.publications[name] = publish;
        return publish;
    }

    private _getOrCreatePublish(name: string, encode=JSON.stringify): Function {
        if(this.publications[name]) {
            return this.publications[name];
        }

        let _encode = this.validateEncoder(encode);

        const publish = this.publisher.make(name, _encode);
        this.publications[name] = publish;
        return publish;
    }

    private _removePublish(name: string) {
        if(this.publications[name]) {
            delete this.publications[name];
        } else {
            throw new Error(`Publisher does not exist for name: ${name}`);
        }
    }

    private _removeAllPublish() {
        Object.keys(this.publications).forEach(pubName => {
            this._removePublish(pubName);
        });
    }

    private validateDecoder(decode: Function | boolean) : Function | null {
        if(decode && typeof decode === "function") {
            return decode;
        } else if (decode === false) {
            return null;
        } else if (decode) {
            //nice try
            return JSON.parse;
        } else {
            // k, i c u
            throw new Error(`Invalid decoder ${decode} argument supplied to publication.`);
        }
    }

    private validateEncoder(encode: Function | boolean) : Function | null {
        if(encode && typeof encode === "function") {
            return encode;
        } else if (encode === false) {
            return null;
        } else if(encode) {
            //this aint it
            return JSON.stringify;
        } else {
            //you're not invited to my bday party
            throw new Error(`Invalid encoder  ${encode} argument supplied to subscription`);
        }
    }
}