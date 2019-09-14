const JSONRPC = require('./commons/jsonrpc');
const utils = require('./commons/utils');
const PeripheralDiscovery = require('./discovery').PeripheralDiscovery

class LinkRPCEndpoint extends JSONRPC {


    constructor(wsconn, config) {
        super();
        this.wsconn = wsconn;
        this._discovery = null
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
        console.debug('RPCEnd: rpc-receive:', { method, params: JSON.stringify(params) });
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
        // return this.r_discover_mock(params)
        // check in singleton static discovery object
        if (LinkRPCEndpoint.discovery.busy()) {
            console.warn("already discovery is running. skipping request")
            return
        }
        // PeripheralConfig = {
        //     "SERVICE": "esp-pikachu",
        //     "NAME": "PikachuBot-Dev",
        //     "ID": "PIKA007",
        //     "DISCOVERY_PORT": 7007,
        //     "LINK_PORT": 7008,
        //     "IP": "255.255.255.255",  # dummy
        // }
        const services = params.filters && params.filters[0] && params.filters[0].services

        console.info("start discovery. serviceFilter:", services)
        return LinkRPCEndpoint.discovery.discover().then(results => {
            results.filter(c => services && services.includes(c.SERVICE))
                .forEach(c => this.sendRemoteNotification('didDiscoverPeripheral',
                    {
                        peripheralId: c.ID, // Unique identifier for peripheral
                        name: c.NAME, // Name
                        rssi: c.RSSI || 0
                    })
                )
        }
        )
    }

    r_discover_mock(params) {
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

    static get discovery() {
        if (!this._discovery) {
            console.log("creating new PeripheralDiscovery object")
            this._discovery = new PeripheralDiscovery()
        }
        return this._discovery
    }

    serve() {

    }
}

module.exports = LinkRPCEndpoint