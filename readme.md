




block definitions <=> peripheral <=> transport <=> device 


transport possibilities
=======================

1. BLE-WS through scratchlink   
    follow predefined protocol for scan/lifecycle-mgmnt/state-update
    like emiting certain events on scrath-vm/ implementing methods

2. WS(JSONRPC) through CustomLink
    We can make a LinkFactory compatible for scratch-vm || OR use extension specific implimentation

3. WS(ANY) direct from browser
    connect to device at extension ctor

peripharal

    send(method, params) Promise<result>{
        
    }
    receive(method, params) Promise<result>{

    }
