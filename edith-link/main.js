const WebSocket = require('ws');

const http = require("http")

const LinkRPCEndpoint = require('./linkrpc')
const linkPort = 11111
const httpserver = http.createServer()

const wserver = new WebSocket.Server({ server: httpserver, path: '/espwlan' })
wserver.on('connection', (ws, req) => {
    //send feedback to the incoming connection
    const remoteAddr = req.connection.remoteAddress
    console.log(`client connected ${remoteAddr}. creating rpc endpoint`)
    const lrpc = new LinkRPCEndpoint(ws, { remoteAddr })
    lrpc.serve()
    ws.on('close', (code, reason) => {
        console.log(`connection from ${remoteAddr} closed. ${reason} code:${code}`);
    });
});

httpserver.on('listening', () => {
    console.log("link http server is listening at ", linkPort)
})

httpserver.listen(linkPort)



// if (process.argv.includes('skip')) {
//     console.warn("Skipping discovery")
//     startLinkComm({
//         IP: '192.168.0.4',
//         LINK_PORT: 7008
//     })
// }
// if (process.argv.includes('flood')) {
//     console.warn("UDP flood")
//     setInterval(doDiscovery, 100)
// }
// else {
//     const disc = require('./discovery')

//     doDiscovery(startLinkComm)
// }

