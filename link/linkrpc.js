const JSONRPC = require('./commons/jsonrpc');
const utils = require('./commons/utils');


class LinkRPCEndpoint extends JSONRPC {
    constructor(wsconn, config) {
        super();
        this.wsconn = wsconn;
        this.notificationIntervalId = null;
        // wsconn.send('{ "connection" : "ok"}');
        wsconn.on('message', (message) => {
            const jsonObj = JSON.parse(message)
            this._handleMessage(jsonObj)
        });
        wsconn.on('close', (code, reason) => { });
        wsconn.on("error", err => { console.error('RPCEnd: ws transport erred ', err) })
    }

    // overrided
    _sendMessage(jsonMessageObject) {
        const jsonStr = JSON.stringify(jsonMessageObject)
        console.debug('RPCEnd: raw rpc message sending through ws: ', jsonStr);
        this.wsconn.send(jsonStr);
    }

    // overrided
    didReceiveCall(method, params) {
        console.debug('RPCEnd: rpc-receive:', { method, params });
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

    r_read(params) {
        const { startNotifications } = params;
        if (startNotifications && !this.notificationIntervalId) {
            this.notificationIntervalId = setInterval(() => {
                this.sendRemoteNotification('characteristicDidChange', { message: 'dGVzdG1lb250aGlzd2hlbmFiY2QK' });
            }, 4000);
            console.log('registering startNotification. ID:', this.notificationIntervalId);
        }
    }

    r_connect(params) {
        const id = params.peripheralId;
        console.log('RPCEnd: connecting to', id);
        return utils.sleep(10).then(() => {
            console.log('conncted reply', id);
            return null;
        });

    }

    r_discover(params) {
        if (params.name === 'picahu') {
            return utils.errored('RPCEnd: Only pikachu can do mock');
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
        return utils.sleep(1000).then(() => null);
    }


    serve() {

    }
}

module.exports = LinkRPCEndpoint