const WebSocket = require('ws')

// TODO(mj): better efficient transport protocol
class PeripheralConnection {

    constructor(config) {
        this.peripheralId = config.ID
        this.config = config
        this.isconnected = false
        this.wsUrl = config.LINK_URL || `ws://${config.IP}:${config.LINK_PORT}`
        this.conn = new WebSocket(this.wsUrl)
        this.statePollerHandle = null
        this.ondisconnect = null
        this._connPromise = new Promise((resolve, reject) => {
            console.log("Setting up peripheral transport for", this.peripheralId)
            this.conn.onopen = () => {
                console.log(`Peripheral transport<${this.peripheralId}> connected ${this.wsUrl}`)
                this.isconnected = true
                resolve(true)

                // this.statePollerHandle = setInterval(() => {
                //     this.conn.send(STATE_Q)
                // }, 1000);
                this.conn.onclose = () => {
                    console.log(`Peripheral tansport<${this.peripheralId}> is closed`)
                    this.isconnected = false
                    this.ondisconnect && this.ondisconnect('closed')
                    reject(false)
                    this.statePollerHandle && clearTimeout(this.statePollerHandle)
                }
            }

            this.conn.onerror = (err) => {
                console.error(`Peripheral transport<${this.peripheralId}> error: ${err}`)
                this.statePollerHandle && clearTimeout(this.statePollerHandle)
                this.isconnected = false
                this.ondisconnect && this.ondisconnect(err)
                reject(err)
            }

            this.conn.onmessage = (e) => {
                const data = e.data
                if (data.slice(0, 2).toString() === "@S") {
                    const state = JSON.parse(data.slice(2))
                    console.log("Device STATE: ", state)
                } else {
                    console.log("FROM LINK: ", data)
                }
            }
        })

    }

    async waitForConnectionSuccess() {
        return await this._connPromise
    }


    disconnect() {
        this.conn && this.conn.close()
    }

    async send(data) {
        console.debug(`transport<${this.peripheralId}> sending`, data)
        //TODO(mj) conn.send is not awaitable. create a promise here
        await this.conn.send(data)
    }
}




module.exports = { PeripheralConnection }