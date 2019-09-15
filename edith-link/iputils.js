
const os = require('os');

function getNonLocalIfconfigs() {
    const ifaces = os.networkInterfaces();
    let ifconfigs = []
    Object.keys(ifaces).forEach(ifname => {
        ifaces[ifname].forEach(ifconfig => {
            if (ifconfig.family != 'IPv4' || ifconfig.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            ifconfig.ifname = ifname
            ifconfigs.push(ifconfig)
        });
    });
    return ifconfigs
}


// function IpAddressToNumber(ip) {
//     return ip.split('.').map((octet, index, array) => {
//         return parseInt(octet) * Math.pow(256, (array.length - index - 1));
//     }).reduce((prev, curr) => {
//         return prev + curr;
//     });
// }

function IpAddr2Number(dot) {
    var d = dot.split('.');
    // TODO: check sanity
    return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
}

function NumberToIpAddr(num) {
    // let d = num % 256; // TODO Find bug in this; for  -931135488 (-ve number not supported)
    // for (var i = 3; i > 0; i--) {
    //     num = Math.floor(num / 256);
    //     d = num % 256 + '.' + d;
    // }
    // return d;
    if (!isFinite(num))
        return;

    return [num >>> 24, num >>> 16 & 0xFF, num >>> 8 & 0xFF, num & 0xFF].join('.');
}

function getIpRangeFromCIDR(cidr) {
    let [ip, prefix] = cidr.split('/')
    prefix = +prefix
    if (prefix === undefined || Number.isNaN(prefix) || prefix > 32) {
        return null;
    }

    const start = NumberToIpAddr((IpAddr2Number(ip)) & ((-1 << (32 - prefix))));
    const end = NumberToIpAddr((IpAddr2Number(start)) + Math.pow(2, (32 - prefix)) - 1);
    return { start, end };
}

function getBroadcastIPFromCIDR(cidr) {
    const range = getIpRangeFromCIDR(cidr)
    if (range) {
        return range.end
    }
}


exports.defaults = {
    getNonLocalIfconfigs,
    getIpRangeFromCIDR,
    getBroadcastIPFromCIDR
}


// TEST 
// const assert = require('assert')
// assert.equal(getBroadcastIPFromCIDR('170.1.0.0/26'), '170.1.0.63')
// assert.equal(getBroadcastIPFromCIDR('200.222.5.100/9'), '200.255.255.255')
// for (let c of getNonLocalIfconfigs()) {
//     console.log(getBroadcastIPFromCIDR(c.cidr))
// }