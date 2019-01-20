So after playing around with last iteration of Centrum-Messengers, I realized I had some unoptimized abstractions that
were quite useful, but definitely not needed. I'm building a game engine (Gotti.js) and didnt want those abstractions anymore so decided
to take out a lot of it and was left with a very simple wrapper around the zmq pub/sub sockets. Since it's for use of the game engine I'm buidling,
I'm renaming it. Also plan on doing the same with CentrumChannels.

I wanted to be able to get the most optimal performance out of them and promoting the use of json, although very user friendly,
is slower than just designing things around protocols and formatting your arrays.

It's bare bones and very low level but can be powerful if used correctly.

After initializing your Messenger instance with and/or pub and socket configurations, it's very very trivial to pub and sub
to messages.


The only thing a publisher really is, is a name that SHOULD identify some sort of protocol, all that means is
the name allows the subscriber to know what process it should run on the publication.. it's literally just another way
to say "What should the subscriber do (handler function) when it receives a publication with the name/protocol 'ADD' "

can be used to call the publisher and the subscriber listens
for the messages.

        messenger.createPublish('ADD')


        example 2: (parameter message)
        messenger.publications.ADD([5, 10]);


now all you have to do on the receiving end, is register the subscription for the name/protocol with the following API -
        messenger.createSubscription(protocolOrName, handlerId, handler)

   or

        messenger.createOrAddSubscription(protocolOrName, handlerId, handler)


   The only difference between the two is 'createSubscription' will through an error if you try to register a subscription handler
   with the same name more than once. 'createOrAddSubscription' can have multiple handlers.

   heres an example of how messenger.createSubscription would look if we were making it in response to the publication we defined above.

        messenger.createSubscription("ADD", "unique", (data) => {
            console.log('output:' + (data[0] + data [1]) );
        })


    logs out -

        output: 15

    Remember we sent as data [5, 10], so all it does is add those two values.. and it knows to do that because
    it was the "ADD" protocol. Don't overthink it, it's really just basically the node event emitter with sockets.

   or if you want multiple handlers

        for(let 1 = 0; i <= 5; i++) {
            let handlerId = ('id_' + i);
            messenger.createOrAddSubscription("ADD", handlerId, (data) => {
                console.log(`${handlerName}:${(data[0] + data[1] + i)}`);
            })
        }
    logs out-
        id_0: 15
        id_1: 16
        id_2: 17
        id_3: 18
        id_4: 19

   then to remove any of these subscriptions you have the following functions

         removeSubscriptionById(id, name);
         removeAllSubscriptionsWithId(id);
         removeAllSubscriptionsWithName(name);
         removeAllSubscriptions();


You can also chose to create publications without encoding if you want to encode it separately somewhere in your application.
All you have to do is pass a second parameter in createPublication with false;

        messenger.createPublish('ADD', false);

then do the same thing for the subscription

        messenger.createSubscription('ADD', 'ID', (data) => {
            JSON.parse(data);
        }, false);

