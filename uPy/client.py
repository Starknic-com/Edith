import socket
from time import sleep

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)

sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)  

while 1:
    print("sent message")
    sock.sendto("search".encode(), ( "192.168.0.255", 7007 ))
    print("rcv",sock.recvfrom(1024))
    sleep(0.5)