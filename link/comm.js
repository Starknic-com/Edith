const WebSocket = require('ws')

const DESCOVERY_Q = "!search"
const STATE_Q = "!S"

function startLinkComm(config) {
    const linkUrl = config.LINK_URL || `ws://${config.IP}:${config.LINK_PORT}`
    console.log("Setting up link with", linkUrl)
    const conn = new WebSocket(linkUrl)

    conn.onopen = () => {
        console.log("Link transport connected", linkUrl)
        conn.send('This should echo')
        const statePollerHandle = setInterval(() => {
            conn.send(STATE_Q)
        }, 100);

        conn.onclose = () => {
            console.log("link tansport is closed")
            clearTimeout(statePollerHandle)
        }
    }

    conn.onerror = (error) => {
        console.error(`WebSocket error: ${error}`)
    }

    conn.onmessage = (e) => {
        const data = e.data
        if (data.slice(0, 2).toString() === "@S") {
            const state = JSON.parse(data.slice(2))
            console.log("Device STATE: ", state)
        } else {
            console.log("FROM LINK: ", data)
        }
    }
}

