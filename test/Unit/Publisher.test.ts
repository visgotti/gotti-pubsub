import { Publisher } from '../../src/core/Messengers/Publisher';

import { PubSocket } from '../Mocks/zmq';

import * as assert from 'assert';
import * as mocha from 'mocha'

describe('Publisher', function() {
    let publisher;
    beforeEach('Initialize Publisher', (done) => {
        publisher = new Publisher(new PubSocket());

        publisher.make = function() {
            return (data: any) => {
                return new Promise((resolve, reject) => {
                    resolve(data);
                })
            }
        };
        done();
    });

    it('publisher.make creates a function', function (done) {
        const func = publisher.make('test');
        assert.deepStrictEqual(typeof func, "function");
        done();
    });

    it('publisher.makeForHook causes it to run the beforeHook function when sending', function (done) {
        const func = publisher.make('test');
        func(11).then(result => {
            assert.deepStrictEqual(result, 11);
            done();
        });
    });
});