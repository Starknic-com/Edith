/* eslint-disable require-jsdoc */
/* eslint-disable func-style */
/* eslint-disable no-console */
/* eslint-disable no-warning-comments */
/* eslint-disable camelcase */
import * as JSONRPC from '../../util/jsonrpc';

function sleep (m) {
    const p = new Promise(resolve => {
        setTimeout(() => {
            resolve(m);
        }, m);
    });
    return p;
}


function errored (err) {
    const p = new Promise((resolve, reject) => {
        reject(err);
    });
    return p;
}

class RPCMock extends JSONRPC {
    constructor (mockSendFn) {
        super();
        this.mockSendFn = mockSendFn;
        this.notificationIntervalId = null;
    }

    // overrided
    _sendMessage (jsonMessageObject) {
        console.debug('mock-send:', jsonMessageObject);
        this.mockSendFn(jsonMessageObject);
    }

    // overrided
    didReceiveCall (method, params) {
        console.debug('mock-receive:', {method, params});
        const rmethod = `r_${method}`;
        if (this[rmethod]) {
            const resultPromise = this[rmethod](params);
            return Promise.resolve(resultPromise).then(
                result => {
                    console.log(`MOCK ${method}() => RESULT: ${result}`);
                    return result;
                },
                error => {
                    console.error(`MOCK ${method}() => ERROR: ${error}`);
                    return error;
                }
            );
        }
        console.warn(`No handler for ${rmethod}`, params);
    }

    r_read (params) {
        const {startNotifications} = params;
        if (startNotifications && !this.notificationIntervalId) {
            this.notificationIntervalId = setInterval(() => {
                this.sendRemoteNotification('characteristicDidChange', {message: 'dGVzdG1lb250aGlzd2hlbmFiY2QK'});
            }, 4000);
            console.log('registering startNotification. ID:', this.notificationIntervalId);
        }
    }

    r_connect (params) {
        const id = params.peripheralId;
        console.log('connecting to', id);
        return sleep(10).then(() => {
            console.log('conncted reply', id);
            return null;
        });

    }

    r_discover (params) {
        if (params.name === 'picahu') {
            return errored('Only pikachu can do mock');
        }
        setTimeout(() => this.sendRemoteNotification('didDiscoverPeripheral', {
            peripheralId: '0x00017', // Unique identifier for peripheral
            name: 'PikachuBot', // Name
            rssi: -30
        }), 2700);
        setTimeout(() => this.sendRemoteNotification('didDiscoverPeripheral', {
            peripheralId: '0x00019', // Unique identifier for peripheral
            name: 'Unknown device', // Name
            rssi: -80
        }), 10000);
        return sleep(1000).then(() => null);
    }
}

export class LinkWSMock {
    constructor (type) {
        this._type = type;
        this._onOpen = null;
        this._onClose = null;
        this._onError = null;
        this._handleMessage = null;
        this.rpcMock = new RPCMock(this._onMessage.bind(this));
    }
    open () {
        if (this._onOpen && this._onClose && this._onError && this._handleMessage) {
            // TODO
        } else {
            throw new Error('Must set open, close, message and error handlers before calling open on the socket');
        }
        this._isOpen = true;
        window.setTimeout(this._onOpen, 1000);
    }
    close () {
        window.setTimeout(this._onClose, 500);
    }
    sendMessage (message) {
        this.rpcMock._handleMessage(message);
    }
    setOnOpen (fn) {
        this._onOpen = fn;
    }
    setOnClose (fn) {
        this._onClose = fn;
    }
    setOnError (fn) {
        this._onError = fn;
    }
    setHandleMessage (fn) {
        this._handleMessage = fn;
    }
    isOpen () {
        return this._isOpen;
    }
    _onMessage (msg) {
        // const json = JSON.parse(msg.data);
        this._handleMessage(msg);
    }
}
