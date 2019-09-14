const WebSocket = require('ws')

const DESCOVERY_Q = "!search"
const STATE_Q = "!S"

const DISCOVERY_PORT = 7007
const BCAST_ADDR = "192.168.0.255"

const dgram = require('dgram')


const sock = dgram.createSocket("udp4")

sock.on('listening', function () {
    var address = sock.address();
    console.log('UDP Discovery Client created' + address.address + ":" + address.port);
    sock.setBroadcast(true)
});


sock.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    sock.close();
});


discoveryHandler = setInterval(() => {
    // sock.bind(8888)
    sock.send(DESCOVERY_Q, DISCOVERY_PORT, BCAST_ADDR, err => {
        if (!err) {
            console.log("Broadcasted Disc query")
        }
    })
}, 100)

sock.on('message', (msg, rinfo) => {
    console.log("Discovery: reply from", rinfo)
    config = JSON.parse(msg)
    console.log(config)

    const linkUrl = `ws://${config.IP}:${config.LINK_PORT}`
    console.log("Setting up link with", linkUrl)
    clearTimeout(discoveryHandler)
    setUpLink(linkUrl)
})


function setUpLink(linkUrl) {
    const conn = new WebSocket(linkUrl)
    conn.onopen = () => {
        conn.send('This should echo')
        const statePollerHandle = setInterval(() => {
            conn.send(STATE_Q)
        }, 100);

        conn.onclose = () => {
            clearTimeout(statePollerHandle)
        }
    }

    conn.onerror = (error) => {
        console.log(`WebSocket error: ${error}`)
    }

    conn.onmessage = (e) => {
        const data = e.data
        if (data.slice(0, 2).toString() === "@S") {
            state = JSON.parse(data.slice(2))
            console.log(state)
            console.log("Device STATE: ", state)
        } else {
            console.log("FROM LINK: ", data)
        }
    }
}