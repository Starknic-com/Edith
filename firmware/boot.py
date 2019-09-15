# This is script that run when device boot up or wake from sleep.


# this is a workarround for avoiding motor running while bootup 
from machine import Pin
for i in range(12, 16):
    p = Pin(i)
    p.init(Pin.OUT)
    p.value(0)
