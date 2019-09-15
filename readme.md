

### How to start development

```bash
git clone https://github.com/Starknic-com/Edith.git
cd Edith
./setup.sh
```

### How to build gui
```bash
cd scratch-gui
npm run build   # final artifacts will be at 'build' directory
```

### flow of control
block definitions <=> peripheral stub <==[ws]==> edith-link <==[tcp]==> peripheral 


### How to use
* upload firmware to device

* reset device and run

* start edith-link
    ```bash
    cd edith-link
    npm start
    ```
* start edith-link
    ```bash
    cd edith-link
    npm start
    ```
* start scratch-gui and open in browser
    ```bash
    cd scratch-gui
    npm start
    ```


### other transport possibilities
=================================

1. BLE-WS through scratchlink   
    follow predefined protocol for scan/lifecycle-mgmnt/state-update
    like emiting certain events on scrath-vm/ implementing methods

2. WS(JSONRPC) through CustomLink
    We can make a LinkFactory compatible for scratch-vm || OR use extension specific implementation

3. WS(ANY) direct from browser
    connect to device at extension ctor

peripharal

    send(method, params) Promise<result>{
        
    }
    receive(method, params) Promise<result>{

    }



