export class LinkWS {
    constructor(type) {
        this._type = type;
        this._onOpen = null;
        this._onClose = null;
        this._onError = null;
        this._handleMessage = null;
        this._ws = null;
    }
    open() {
        switch (this._type) {
            case 'MJ':
                this._ws = new WebSocket('ws://localhost:7331/mj');
                break;
            default:
                throw new Error(`Unknown LinkWS socket Type: ${this._type}`);
        }
        if (this._onOpen && this._onClose && this._onError && this._handleMessage) {
            this._ws.onopen = this._onOpen;
            this._ws.onclose = this._onClose;
            this._ws.onerror = this._onError;
        }
        else {
            throw new Error('Must set open, close, message and error handlers before calling open on the socket');
        }
        this._ws.onmessage = this._onMessage.bind(this);
    }
    close() {
        this._ws.close();
        this._ws = null;
    }
    sendMessage(message) {
        const messageText = JSON.stringify(message);
        this._ws.send(messageText);
    }
    setOnOpen(fn) {
        this._onOpen = fn;
    }
    setOnClose(fn) {
        this._onClose = fn;
    }
    setOnError(fn) {
        this._onError = fn;
    }
    setHandleMessage(fn) {
        this._handleMessage = fn;
    }
    isOpen() {
        return this._ws && this._ws.readyState === this._ws.OPEN;
    }
    _onMessage(e) {
        const json = JSON.parse(e.data);
        this._handleMessage(json);
    }
}
