const JSONRPC = require('./commons/jsonrpc');
const utils = require('./commons/utils');
const PeripheralDiscovery = require('./discovery').PeripheralDiscovery
const PeripheralConnection = require('./peripheralconn').PeripheralConnection

class LinkRPCEndpoint extends JSONRPC {

    constructor(wsocket, config) {
        super();
        this.wsocket = wsocket;
        this._discovery = null
        this.notificationIntervalId = null;
        // wsconn.send('{ "connection" : "ok"}');
        wsocket.on('message', (message) => {
            const jsonObj = JSON.parse(message)
            this._handleMessage(jsonObj)
        });
        wsocket.on('close', (code, reason) => {
            this.disconnectPeripherals()
        }); // We close wscoket when upstream device is disconnected.
        wsocket.on("error", err => {
            console.error('RPCEnd: ws transport erred ', err)
            this.disconnectPeripherals()
        })
    }

    // overrided
    _sendMessage(jsonMessageObject) {
        const jsonStr = JSON.stringify(jsonMessageObject)
        console.debug('RPCEnd: raw rpc message sending through ws: ', jsonStr);
        this.wsocket.send(jsonStr);
    }

    // overrided
    didReceiveCall(method, params) {
        console.debug('RPCEnd: rpc-receive:', { method, params: JSON.stringify(params) });
        const rmethod = `r_${method}`;
        if (this[rmethod]) {
            const resultPromise = this[rmethod](params);
            return Promise.resolve(resultPromise).then(
                result => {
                    console.log(`TAP ${method}() => RESULT: ${result}`);
                    return result;
                },
                error => {
                    console.error(`TAP ${method}() => ERROR: ${error}`);
                    return error;
                }
            );
        }
        console.warn(`No handler for ${rmethod}`, params);
    }

    async r_write(args) {
        let { serviceId, characteristicId, message, encoding, withResponse } = args
        let buff = Buffer.from(message, 'base64');
        let data = buff.toString('ascii');
        console.log("r_write data", data)
        if (LinkRPCEndpoint.activeConnections.size === 0) {
            throw new Error("No upstream peripheral")
        }
        for (let conn of LinkRPCEndpoint.activeConnections.values()) {
            if (conn) {
                console.log("r_write conn", conn.peripheralId)
                return await conn.send(data)
            }
        }
    }

    r_read(params) {
        const { startNotifications } = params;
        if (startNotifications && !this.notificationIntervalId) {
            // TODO(mj) after improved peripheral transport, do a state push  mechanism instead of polling
            // this.notificationIntervalId = setInterval(() => {
            //     this.sendRemoteNotification('characteristicDidChange', { message: 'dGVzdG1lb250aGlzd2hlbmFiY2QK' });
            // }, 4000);
            console.log('registering startNotification. ID:', this.notificationIntervalId);
        }
    }

    disconnectPeripherals() {
        // TODO: one device per rpcEp instance. not on global level
        LinkRPCEndpoint.activeConnections.forEach((pconn, pid) => {
            console.log(`disconnecting device${pid}`)
            pconn.disconnect()
        })
        LinkRPCEndpoint.activeConnections.clear()
    }

    async r_connect(params) {
        // TODO: (once connect was called, ws should be upgraded to serve to specific peripheral only'
        // ie, should not accept disover rpc and other common rpcs

        const id = params.peripheralId;
        // TODO(mj): respect lastFoundWhen
        if (!PeripheralDiscovery.discoveredDeviceHistory.has(id)) {
            return utils.errored(new Error("unknown device id:" + id))
        }

        if (!LinkRPCEndpoint.activeConnections.get(id)) {
            const config = PeripheralDiscovery.discoveredDeviceHistory.get(id)
            console.log('RPCEnd: creating  PeripheralConnection for', id);
            const pconn = new PeripheralConnection(config)
            const success = await pconn.waitForConnectionSuccess()
            if (success) {
                LinkRPCEndpoint.activeConnections.set(id, pconn)
                pconn.ondisconnect = () => {
                    console.log(`RPCEnd: peripheral connection to ${id} disconnected. closing ws`)
                    LinkRPCEndpoint.activeConnections.delete(id)
                    this.wsocket.close()
                }
                return 'success'
            }
            throw new Error("connection is closed prematurely")
        } else {
            throw new Error('TODO')
            // TODO(mj) check earlier connection aliveness. possibly reuse
        }
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
        }), 1000);
        setTimeout(() => this.sendRemoteNotification('didDiscoverPeripheral', {
            peripheralId: '0x00019', // Unique identifier for peripheral
            name: 'Unknown device', // Name
            rssi: -80
        }), 5000);
        return utils.sleep(1000).then(() => null);
    }

    static get discovery() {
        if (!this._discovery) {
            console.log("creating new PeripheralDiscovery object")
            this._discovery = new PeripheralDiscovery()
        }
        return this._discovery
    }
    static get activeConnections() {
        if (!this._connections) {
            this._connections = new Map()
        }
        return this._connections
    }

    serve() {

    }
}

module.exports = LinkRPCEndpoint