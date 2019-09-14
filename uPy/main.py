import socket
import time
import json
import network
import uasyncio
from uwsserver import WSReader, WSWriter

known_ap_configs = [
    (b"mountdoom", b"oneringtorulethemall"),
    (b"Kings Broadband", b"Cartier2018"),
]

PeripheralConfig = {
    "NAME": "Pikachu",
    "ID": "PIKA007",
    "DISCOVERY_PORT": 7007,
    "LINK_PORT": 8081,
    "IP": "255.255.255.255",  # dummy
}

sta_if = network.WLAN(network.STA_IF)
ap_if = network.WLAN(network.AP_IF)


def find_aps(sort_by_strength=True):
    results = sta_if.scan()
    print("APs found ", len(results))
    for a in results:
        # 0:ssid, 1:bssid, 2:channel, 3:RSSI, 4:authmode, 5:hidden
        ssid, _, _, RSSI, *_ = a
        print(ssid.decode(), "\tRSSI:", RSSI)
    if sort_by_strength:
        return sorted(results, key=lambda x: x[3], reverse=True)
    return results


def try_connect_to_known_aps(timeout=30, scan_retry_interval=5, ap_connect_timeout=10):
    sta_if.disconnect()
    sta_if.active(True)  # if sta is not active
    started = time.time()
    while (time.time() - started) <= timeout and not sta_if.isconnected():
        print("Scanning for APs")
        ap_list = find_aps(sort_by_strength=True)
        ssid_list = [a[0] for a in ap_list]
        available = []
        for apc in known_ap_configs:
            if apc[0] in ssid_list:
                available.append(apc)
        if not available:
            print("No known APs found. Retry after ", scan_retry_interval, "sec")
            time.sleep(scan_retry_interval)
            continue
        for apc in available:
            print("Connecting to ", apc)
            if connect_to_ap(*apc, timeout=ap_connect_timeout):
                break
    return sta_if.isconnected()


def connect_to_ap(essid, passwd, timeout=10):
    started = time.time()
    if sta_if.isconnected():
        if sta_if.config("essid") == essid:
            print("Already connected to ", sta_if.config("essid"))
            return True
        print("WARN: disconnecting from", sta_if.ifconfig())
        sta_if.disconnect()
    sta_if.active(True)  # if sta is not active
    print("sta_if.connect()")
    sta_if.connect(essid, passwd)
    while (time.time() - started) <= timeout:
        print("Waiting for connect")
        time.sleep(2)
        if sta_if.isconnected():
            print("Connected to ", essid.decode())
            return True


def discovery_reply():
    return json.dumps(PeripheralConfig).encode()


async def start_discovery_server(ip, port):
    # sock = socket.socket(
    #     socket.AF_INET,
    #     socket.SOCK_DGRAM
    # )
    # sock.settimeout(2.0)
    # sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    # sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1) N/A in uPy

    import uudp

    sock = uudp.socket()
    sock.bind((ip, port))
    MAX_DGRAM_SZ = 512
    while True:
        try:
            # msg,sender = sock.recvfrom(1024)
            msg, sender = await uudp.recvfrom(sock, MAX_DGRAM_SZ)
            print(msg, sender)
            if msg == b"search":
                reply = discovery_reply()
                # sock.sendto(reply,sender)
                await uudp.sendto(sock, reply, sender)
        except Exception as oops:
            print("Error in DiscoveryServer", oops)

        print(
            "UDP exchange completed"
        )  # TODO(mj) remove this comment, if implimentaion is OK
        time.sleep(0.5)


async def link_endpoint_handler(reader, writer):
    # Consume GET line
    await reader.readline()

    reader = await WSReader(reader, writer)
    writer = WSWriter(reader, writer)
    MAX_READ_SZ = 256
    try:
        while True:
            data = await reader.read(MAX_READ_SZ)
            print(data)
            if data == b"\r":
                await writer.awrite(b"\r\n")
            else:
                await writer.awrite(data)
    except Exception as oops:
        print("Error on WS handle", oops)


def main():

    print("Wait until connected to known APs")
    while not try_connect_to_known_aps():
        time.sleep(5)
        pass

    print("Network config:", sta_if.ifconfig())
    PeripheralConfig["IP"], *_ = sta_if.ifconfig()

    loop = uasyncio.get_event_loop()

    print(
        "Creating discovery server udp://{IP}:{DISCOVERY_PORT}".format(
            **PeripheralConfig
        )
    )
    loop.create_task(
        start_discovery_server(
            PeripheralConfig["IP"], PeripheralConfig["DISCOVERY_PORT"]
        )
    )

    print("Creating websocket server tcp://{IP}:{LINK_PORT}".format(**PeripheralConfig))
    loop.create_task(
        uasyncio.start_server(
            link_endpoint_handler, PeripheralConfig["IP"], PeripheralConfig["LINK_PORT"]
        )
    )

    print("Eventloop: run_forever()")
    loop.run_forever()
    loop.close()


main()
