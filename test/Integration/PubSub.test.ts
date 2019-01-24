import * as assert from 'assert';
import * as mocha from 'mocha';
import * as fs from 'fs';
import * as path from 'path';

import { Messenger } from '../../src/core/Messenger';

let pubURIs = ['tcp://127.0.0.1:4201', 'tcp://127.0.0.1:4202'];

describe('Publish to subscription communication', function() {
    let config: any;
    let pubServers = [];
    let subServers = [];
    let pub1Calls = 0;
    let pub2Calls = 0;

    //TODO: figure out why I need to wait so long between each test for them to pass.
    beforeEach((done) => {
        pub1Calls = 0;
        pub2Calls = 0;

        pubServers.length = 0;
        subServers.length = 0;

        for(let i = 0; i < 4; i++) {
            const messenger = new Messenger(i);
            if(i < 2) {
                messenger.initializeSubscriber(pubURIs);
                subServers.push(messenger);
            } else {
                if(i === 2) {
                    messenger.initializePublisher(pubURIs[0])
                } else {
                    messenger.initializePublisher(pubURIs[1]);
                }
                pubServers.push(messenger);
            }
        }
        assert.strictEqual(pubServers.length, 2);
        assert.strictEqual(subServers.length, 2);
        setTimeout(() => {
            done();
        }, 250);
    });

    afterEach((done) => {
        pubServers.forEach(server => {
           server.close();
           server = null;
        });
        pubServers.length = 0;
        subServers.forEach(server => {
           server.close();
           server = null;
        });
        subServers.length = 0;
        done();
    });

    it('Sends publication to 1 subscriber', function(done) {
        let sub1Correct = false;
        let sub2Correct = true;


        subServers[0].createSubscription("foo", 'foo', function(data) {
            assert.strictEqual(data[0], 10);
            if(data[0] === 10) {
                sub1Correct = true;
            }
        });

        subServers[1].createSubscription("_foo", '_foo', function(data) {
            sub2Correct = false;
        });

        pubServers[0].createPublish("foo");

        pubServers[0].publications.foo([10]);

        setTimeout(() => {
            assert.strictEqual(sub1Correct, true);
            assert.strictEqual(sub2Correct, true);
            done();
        }, 10);
    });

    it('Sends publication from both publishers to both subscribers', function(done) {

        let sub1Expected = [10, 12, 20, 30, 40];
        let sub2Expected = [10, 12, 20, 30, 40];

        subServers[0].createSubscription("foo", "foo", function(data) {
            sub1Expected = sub1Expected.filter(val =>  val !== data[0]);
        });

        subServers[1].createSubscription("foo", "foo", function(data) {
            sub2Expected = sub2Expected.filter(val => val !== data[0]);
        });

        pubServers[0].createPublish("foo");
        pubServers[1].createPublish("foo");

        setTimeout(() => {
            pubServers[0].publications.foo([10]);
            pubServers[0].publications.foo([12]);
            pubServers[1].publications.foo([20]);
            pubServers[1].publications.foo([30]);
            pubServers[1].publications.foo([40]);

            setTimeout(() => {
                // all sub1Expected and sub2Expected should have had the values filtered out
                assert.strictEqual(sub1Expected.length, 0);
                assert.strictEqual(sub2Expected.length, 0);
                done();
            }, 10);

        }, 50);



    });

    it('Messenger.removePublish removes ability to call the publish', function(done) {

        let expectedPub1Calls = 4;
        let expectedPub2Calls = 2;
        let removedPub2 = false;

        subServers[0].createSubscription("foo", "foo", function(data) {
            if(data[0] === 10) {
                // was pub1
                pub1Calls++;
            } else if (data[0] === 20) {
                pub2Calls++;
            } else {
                throw "Pubs should only send over 10 or 20"
            }
            checkPubCalls();
        });

        subServers[1].createSubscription("foo", "foo", function(data) {
            if(data[0] === 10) {
                pub1Calls++;
            } else if (data[0] === 20) {
                pub2Calls++;
            } else {
                throw "Pubs should only send over 10 or 20"
            }
            checkPubCalls();
        });
        pubServers[0].createPublish("foo");
        pubServers[1].createPublish("foo");

        setTimeout(() => {
            pubServers[0].publications.foo([10]);
            pubServers[1].publications.foo([20]);

        }, 100);

        const checkPubCalls = () => {
            if(pub2Calls === 2 && removedPub2 === false) {
            // removing pub2 and sending another publish with pub1
                pubServers[1].removePublish("foo");
                pubServers[0].publications.foo([10]);
                assert.throws(() => { pubServers[1].publications.foo([20]) });
                removedPub2 = true;
            }
        };

        setTimeout(() => {
            assert.strictEqual(pub1Calls, expectedPub1Calls);
            assert.strictEqual(pub2Calls, expectedPub2Calls);
            done();
        }, 200);
    });

    it('Messenger.removeAllSubscriptionsWithName stops all instances with name foo3 from receiving published data', function(done) {
        let sub1Received = 0;
        let sub2Received = 0;

        pubServers[0].createPublish("foo3");

        subServers[0].createSubscription("foo3", "foo3", (data) => {
            sub1Received += data[0];
            if(sub1Received === 5) {
                subServers[0].removeAllSubscriptionsWithName("foo3");
            }
        });

        subServers[1].createSubscription("foo3", "foo3", (data) => {
            sub2Received += data[0];
        });

        for(let i = 0; i < 10; i++) {
            setTimeout(() => {
                pubServers[0].publications.foo3([1]);
            }, 0);
        }

        setTimeout(() => {
            assert.strictEqual(sub1Received, 5);
            assert.strictEqual(sub2Received, 10);
            done();
        }, 10);
    });

    it('messenger.subscriber.addHandler and messenger.addOrCreateSubscription both register multiple handlers for a subscriber', function(done) {
        let sub1Received = 0;

        pubServers[0].createPublish("foo4");

        subServers[0].createSubscription("foo4", "foo4-1", (data) => {
            sub1Received += data[0];
        });

        subServers[0].createOrAddSubscription("foo4", "foo4-2", (data) => {
            sub1Received += data[0];
        });

        subServers[0].createOrAddSubscription("foo4", "foo4-3", (data) => {
            sub1Received -= data[0];
        });

        subServers[0].createOrAddSubscription("foo4", "foo4-4", (data) => {
            sub1Received -= data[0];
        });

        for(let i = 0; i < 10; i++) {
            pubServers[0].publications.foo4([1]);
        }

        setTimeout(() => {
            assert.strictEqual(sub1Received, 0);
            done();
        }, 10);
    });

    it('messenger.removeSubscriptionById removes only 1', function(done) {
        let sub1Received = 0;

        pubServers[0].createPublish("foo5");

        subServers[0].createSubscription("foo5", "foo5-1", (data) => {
            sub1Received += data[0];
        });

        // save id of subscription handler that subtracts from the received data.
        const id = "foo5-2";
        subServers[0].createOrAddSubscription("foo5", id, (data) => {
            sub1Received -= data[0];
        });

        for(let i = 0; i < 10; i++) {
            pubServers[0].publications.foo5([1]);
        }

        setTimeout(() => {
            assert.strictEqual(sub1Received, 0);
            const handlersLeft = subServers[0].removeSubscriptionById(id, "foo5");
            assert.strictEqual(handlersLeft, 1);
            for(let i = 0; i < 10; i++) {
                // now when we publish the subtract handler shouldnt be happening anymore
                pubServers[0].publications.foo5([1]);
            }

            setTimeout(() => {
                assert.strictEqual(sub1Received, 10);
                done();
            }, 10);

        }, 10);
    });

    it('messenger.removeAllSubscriptionsWithId removes all subscriptions with the id', function(done) {
        let sub1Received = 0;

        const id = "id-1";

        pubServers[0].createPublish("foo6");
        pubServers[0].createPublish("foo7");

        subServers[0].createSubscription("foo6", id, (data) => {
            sub1Received += data[0];
        });

        subServers[0].createOrAddSubscription("foo7", id, (data) => {
            sub1Received -= data[0];
        });

        subServers[0].createOrAddSubscription("foo7", "different_id", (data) => {
            sub1Received += data[0];
        });
        setTimeout(() => {
            for(let i = 0; i < 10; i++) {
                pubServers[0].publications.foo6([1]);
                pubServers[0].publications.foo7([1]);
            }
        }, 10);

        setTimeout(() => {
            assert.strictEqual(sub1Received, 10);
            const handlersRemoved = subServers[0].removeAllSubscriptionsWithId(id);
            assert.strictEqual(handlersRemoved, 2);
            for(let i = 0; i < 10; i++) {
                // now when we publish the subtract handler shouldnt be happening anymore
                pubServers[0].publications.foo7([1]);
            }

            setTimeout(() => {
                assert.strictEqual(sub1Received, 20);
                done();
            }, 20);

        }, 20);
    });

    it('Works when encode/decode is set to false and handlers implicitly serialize it.', function(done) {
        pubServers[0].createPublish("noSerialization", false);

        let sub1Expected = 10;

        subServers[0].createSubscription("noSerialization", "noSerialization", function(data) {
            assert.strictEqual(JSON.parse(data)[0], sub1Expected);
            done();
        }, false);

        pubServers[0].publications.noSerialization(JSON.stringify([10]));
    });
});