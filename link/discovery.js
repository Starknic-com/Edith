const dgram = require('dgram')
const iputils = require('./iputils').defaults

const DESCOVERY_Q = "!search"
const DISCOVERY_PORT = 7007


class PeripheralDiscovery {
    constructor(defaultTimeout) {
        this.discoveryPort = DISCOVERY_PORT
        this.discoveryRunning = false
        this.defaultTimeout = defaultTimeout
        this.udpIntervalMs = 400
        this.sock = dgram.createSocket("udp4")
        // TODO(mj): bind socket in constructor, or create difpherent sockets for each iface
        // when discover is called
        // this.sock.setBroadcast(true)
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
    async discover(timeout) {
        let timeoutms = (timeout || this.defaultTimeout || 10) * 1000
        let resendms = this.udpIntervalMs
        let discovered = []
        const promise = new Promise((resolve, reject) => {

            this.sock.on('message', (msg, rinfo) => {
                console.log("Discovery: reply from", rinfo)
                const config = JSON.parse(msg)
                console.log("onDiscoveredCb() with config", config)
                discovered.push(config)
            })

            const bcastAddrList = this.findBroadcastAddresses()
            for (let bcastAddr of bcastAddrList) {
                this.sock.send(DESCOVERY_Q, this.discoveryPort, bcastAddr, err => {
                    if (err) {
                        console.error(`DESCOVERY_Q broadcast send failed for ${bcastAddr}`, err)
                    }
                })
            }
            setTimeout(() => {
                console.debug("endof discovery after", timeoutms, 'ms')
                this.sock.removeAllListeners('message')
                resolve(discovered)
            }, timeoutms);
        })
        return promise
    }

    findBroadcastAddresses() {
        return iputils.getNonLocalIfconfigs().map(
            c => iputils.getBroadcastIPFromCIDR(c.cidr)
        )
    }
}


export.defaults = PeripheralDiscovery

// TEST
// let pd = new PeripheralDiscovery()
// pd.discover().then(console.log).catch(console.error)