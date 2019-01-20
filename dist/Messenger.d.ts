export declare type Handler<T> = (data: any) => void;
export interface SubscriptionHandler {
    (data: any): Handler<Function>;
    id: string;
    decode?: Function;
}
export declare type Sequence = number;
export interface MessengerConfig {
    ['servers']: Array<{
        ['name']: string;
        ['messengerOptions']: any;
    }>;
}
export interface PublishOptions {
    pubSocketURI: string;
}
export interface SubscribeOptions {
    pubSocketURIs: Array<string>;
}
export interface MessengerOptions {
    id: string;
    publish?: PublishOptions;
    subscribe?: SubscribeOptions;
}
declare enum CREATED_OR_ADDED {
    CREATED = "CREATED",
    ADDED = "ADDED"
}
export declare class Messenger {
    id: string;
    subscriptions?: Set<string>;
    publications?: {
        [name: string]: Function;
    };
    subscriber?: any;
    publisher?: any;
    private pubSocket;
    private subSocket;
    private options;
    constructor(options: MessengerOptions);
    /**
     * sets and initializes available public functions based on messenger options passed in.
     * @param options
     */
    private initializeMessengers;
    close(): void;
    createPublish(name: string, encode?: Function | boolean): Function;
    /**
     * does same thing as createPublish but if the publish name already exists it will return the handler.
     * @param name - name for publish method
     * @param serializer - enum value that tells the publisher how to encode your message, look at SERIALIZER_TYPES for more info
     */
    getOrCreatePublish(name: string, encode?: Function | boolean): Function;
    removePublish(name: any): void;
    removeAllPublish(): void;
    /**
     * creates a new subscription and subscription handler to process data when receiving a publication. Throws error if handler already exists.
     * @param name - name of publication to subscribe to.
     * @param id - identifier for handler to run on publication
     * @param handler - method that takes in publication data as parameter when received.
     * @param decode - function used to decode incoming data, if omitted, uses JSON.
     * @returns boolean - returns true if it was successful.
     */
    createSubscription(name: string, id: string, handler: Handler<Function>, decode?: Function | boolean): boolean;
    /**
     * creates a new subscription if it doesnt exist but if it does, instead of throwing an error it will add a new handler to be ran on the publication
     * @param name - name of publication to subscribe to.
     * @param id - identifier for handler to run on publication
     * @param handler - method that takes in publication data as parameter when received.
     * @param decode - function used to decode incoming data, if omitted, uses JSON.parse. Set implicitly to false for no encoding.
     * @returns CREATED_OR_ADDED - enum value to signify if you created new subscription or added new handler to existing subscription.
     */
    createOrAddSubscription(name: string, id: string, handler: Handler<Function>, decode?: Function | boolean): CREATED_OR_ADDED;
    /**
     * removes specific subscription by id
     * @param id - id of subscription that gets returned on creation.
     * @param name - name of subscription that gets returned on creation.
     * @returns - number of subscriptions removed.
     */
    removeSubscriptionById(id: string, name: string): number;
    /**
     * removes all handlers for all subscriptions that have the given id.
     * @param id - id used to identify handlers for different subscription names.
     * @returns number - ammount of handlers removed.
     */
    removeAllSubscriptionsWithId(id: string): number;
    removeAllSubscriptionsWithName(name: string): void;
    removeAllSubscriptions(): void;
    /**
     * returns all ids that have a handler registered for name.
     * @param name
     * @returns array
     */
    getHandlerIdsForSubscriptionName(name: string): void;
    /**
     * returns all subscription names that a handler id is waiting for.
     * @param id
     * @returns array
     */
    getSubscriptionNamesForHandlerId(id: string): void;
    private _createSubscription;
    private _createOrAddSubscription;
    private _removeSubscriptionById;
    private _removeAllSubscriptionsWithId;
    private _removeAllSubscriptionsWithName;
    private _removeAllSubscriptions;
    private _getHandlerIdsForSubscriptionName;
    private _getSubscriptionNamesForHandlerId;
    private _createPublish;
    private _getOrCreatePublish;
    private _removePublish;
    private _removeAllPublish;
    private validateDecoder;
    private validateEncoder;
}
export {};
