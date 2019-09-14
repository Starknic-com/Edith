const dgram = require('dgram')
const iputils = require('./iputils').defaults

const DESCOVERY_Q = "!search"
const DEFUALT_DISCOVERY_PORT = 7007

const DEFAULT_TIMEOUT_SEC = 10
class PeripheralDiscovery {
    constructor(defaultTimeout = DEFAULT_TIMEOUT_SEC, discoveryPort = DEFUALT_DISCOVERY_PORT) {
        this.discoveryPort = discoveryPort
        this.defaultTimeout = defaultTimeout
        this.udpIntervalMs = 400
        this.sock = dgram.createSocket("udp4")
        // TODO(mj): bind socket in constructor, or create difpherent sockets for each iface
        // when discover is called
        // this.sock.setBroadcast(true)
        this._discoveryRunning = false
        this._setup()
    }

    _setup() {
        this.sock.on('listening', () => {
            var address = this.sock.address();
            console.log(`UDP Discovery client created ${address.address}:${address.port}`);
            this.sock.setBroadcast(true)
        });


        this.sock.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            this.sock.close();
        });
    }

    busy() {
        return this._discoveryRunning
    }

    // TODO(mj): cancel method to cancel active discovery
    // cancel(){

    // }

    // TODO(mj): async iterator
    async discover(timeout) {
        this._discoveryRunning = true


        let timeoutms = (timeout || this.defaultTimeout) * 1000
        let resendHandlers = []
        let devicemap = new Map()
        const promise = new Promise((resolve, reject) => {

            // should be called on success and errror
            const final = () => {
                console.debug("endof discovery after", timeoutms, 'ms')
                this.sock.removeAllListeners('message')
                resendHandlers.forEach(h => clearInterval(h))
                this._discoveryRunning = false
            }

            // for successfull discovery, timeout will end activity
            const timeoutHandle = setTimeout(() => {
                resolve(Array.from(devicemap.values()))
                final()
            }, timeoutms);

            this.sock.on('message', (msg, rinfo) => {
                console.log("Discovery: reply from", rinfo)
                const config = JSON.parse(msg)
                console.log("onDiscoveredCb() with config", config)
                if (config.ID) {
                    devicemap.set(config.ID, config)
                }
            })

            const bcastAddrList = this.findBroadcastAddresses()
            if (bcastAddrList.length == 0) {
                reject(new Error("computer not connected to any networks"))
            }
            console.log("Querying on subnets", bcastAddrList)
            for (let bcastAddr of bcastAddrList) {
                resendHandlers.push(setInterval(
                    () => {
                        console.log("sending udp broadcast to ", bcastAddr)
                        this.sock.send(DESCOVERY_Q, this.discoveryPort, bcastAddr, err => {
                            if (err) {
                                console.error(`DESCOVERY_Q broadcast send failed for ${bcastAddr}`, err)
                            }
                        })
                    },
                    this.udpIntervalMs
                )
                )
            }
        })
        return promise
    }

    findBroadcastAddresses() {
        return iputils.getNonLocalIfconfigs().map(
            c => iputils.getBroadcastIPFromCIDR(c.cidr)
        )
    }
}


module.exports = {
    PeripheralDiscovery
}

// TEST
// let pd = new PeripheralDiscovery()
// pd.discover().then(console.log).catch(console.error)