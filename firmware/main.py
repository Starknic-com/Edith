from time import time, sleep
from json import dumps, loads
from network import WLAN, STA_IF, AP_IF
from uasyncio import get_event_loop, start_server
from machine import Pin
from uwsserver import WSReader, WSWriter

known_ap_configs = [
    (b"mountdoom", b"oneringtorulethemall"),
    (b"Kings Broadband", b"Cartier2018"),
    (b"bdaygift", b"17072017"),
]

PeripheralConfig = {
    "NAME": "Pikachu",
    "ID": "PIKA007",
    "DISCOVERY_PORT": 7007,
    "LINK_PORT": 7008,
    "IP": "255.255.255.255",  # dummy
}

sta_if = WLAN(STA_IF)
ap_if = WLAN(AP_IF)


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
    started = time()
    while (time() - started) <= timeout and not sta_if.isconnected():
        print("Scanning for APs")
        ap_list = find_aps(sort_by_strength=True)
        ssid_list = [a[0] for a in ap_list]
        available = []
        for apc in known_ap_configs:
            if apc[0] in ssid_list:
                available.append(apc)
        if not available:
            print("No known APs found. Retry after ", scan_retry_interval, "sec")
            sleep(scan_retry_interval)
            continue
        for apc in available:
            print("Connecting to ", apc)
            if connect_to_ap(*apc, timeout=ap_connect_timeout):
                break
    return sta_if.isconnected()


def connect_to_ap(essid, passwd, timeout=10):
    started = time()
    if sta_if.isconnected():
        if sta_if.config("essid") == essid:
            print("Already connected to ", sta_if.config("essid"))
            return True
        print("WARN: disconnecting from", sta_if.ifconfig())
        sta_if.disconnect()
    sta_if.active(True)  # if sta is not active
    print("sta_if.connect()")
    sta_if.connect(essid, passwd)
    while (time() - started) <= timeout:
        print("Waiting for connect")
        sleep(2)
        if sta_if.isconnected():
            print("Connected to ", essid.decode())
            return True


def discovery_reply():
    return dumps(PeripheralConfig).encode()


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
            if msg == b"!search":
                reply = discovery_reply()
                # sock.sendto(reply,sender)
                await uudp.sendto(sock, reply, sender)
        except Exception as oops:
            print("Error in DiscoveryServer", oops)

        print(
            "UDP exchange completed"
        )  # TODO(mj) remove this comment, if implimentaion is OK
        sleep(0.5)


pins = [0, 2, 4, 5, 12, 13, 14, 15, 16]

# Pin.IN = 0, Pin.OUT=1.
#  Pin.PULL_UP=1, Pin.OPEN_DRAIN=2
def get_state_reply():
    state = []
    for p in pins:
        v = Pin(p).value()
        state.append(p)
        state.append(v)
    return b"@S" + dumps(state)


def set_pins(values):
    try:
        for i in range(1, len(values), 2):  # 1, 3, 5... upto n
            pin, val = i - 1, i
            Pin(pin).value(val)
        return b"@K"
    except Exception as oops:
        print("Error in setstate", oops)
        return b"@E"


OP_LEN = 2
GET_STATE_OP = b"!S"
SET_PINS_OP = b"!P"


async def link_endpoint_handler(reader, writer):
    # Consume GET line
    await reader.readline()

    reader = await WSReader(reader, writer)
    writer = WSWriter(reader, writer)
    MAX_READ_SZ = 256
    try:
        while True:
            data = await reader.read(MAX_READ_SZ)
            if not data:
                continue
            print(data)
            reply = b"@?"
            try:
                if data == GET_STATE_OP:
                    reply = get_state_reply()
                elif data[:OP_LEN] == SET_PINS_OP:
                    values = loads(OP_LEN)
                    reply = set_pins(values)
                else:
                    reply = data
            except Exception as oops:
                print("Invalid link message", oops)
                continue
            await writer.awrite(reply)
    except Exception as oops:
        print("Error on WS handle", oops)


def main():

    print("Wait until connected to known APs")
    while not try_connect_to_known_aps():
        sleep(5)
        pass

    print("Network config:", sta_if.ifconfig())
    PeripheralConfig["IP"], *_ = sta_if.ifconfig()

    loop = get_event_loop()

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
        start_server(
            link_endpoint_handler, PeripheralConfig["IP"], PeripheralConfig["LINK_PORT"]
        )
    )

    import gc

    gc.collect()

    print("Eventloop: run_forever()")
    loop.run_forever()
    loop.close()


main()
