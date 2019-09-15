import { NUMBER } from '../../extension-support/argument-type';
import { COMMAND } from '../../extension-support/block-type';
import { toString } from '../../util/cast';
import { log as _log } from '../../util/log';
import * as Base64Util from '../../util/base64-util';
import { CustomLink as Link } from './link';
/**
 * A time interval to wait (in milliseconds) before reporting to the Link socket
 * that data has stopped coming from the peripheral.
 */
const LinkTimeout = 4500;

/**
 * A time interval to wait (in milliseconds) while a block that sends a Link message is running.
 * @type {number}
 */
const LinkSendInterval = 100;

/**
 * A string to report to the Link socket when the pikachu has stopped receiving data.
 * @type {string}
 */
const LinkDataStoppedError = 'pikachu extension stopped receiving data';


const LinkUUID = {
    service: "esp-pikachu",
    rxChar: '5261da01-fa7e-42ab-850b-7c80220097cc',
    txChar: '5261da02-fa7e-42ab-850b-7c80220097cc'
};


export class PikachuBotPeripheral {
    /**
     *
     * @param {Runtime} runtime
     * @param {string} extensionId
     */
    constructor(runtime, extensionId, mock = false) {

        this._runtime = runtime;
        this._extensionId = extensionId;

        this._sensors = {

        };
        this._output = {
            led: false
        };
        this._runtime.registerPeripheralExtension(extensionId, this);
    }

    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan() {
        if (this._link) {
            this._link.disconnect();
        }

        // TODO(mj) replace this with custom link
        this._link = new Link(this._runtime, this._extensionId, {
            filters: [
                { services: [LinkUUID.service] }
            ]
        }, this._onConnect, this.reset);
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect(id) {
        if (this._link) {
            this._link.connectPeripheral(id);
        }
    }

    /**
     * Disconnect from the PikachuBot.
     */
    disconnect() {
        if (this._link) {
            this._link.disconnect();
        }

        this.reset();
    }

    /**
     * Reset all the state and timeout/interval ids.
     */
    reset() {
        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
            this._timeoutID = null;
        }
    }

    /**
     * Return true if connected to the PikachuBot.
     * @return {boolean} - whether the PikachuBot is connected.
     */
    isConnected() {
        let connected = false;
        if (this._link) {
            connected = this._link.isConnected();
        }
        return connected;
    }

    /**
     * Send a message to the peripheral Link socket.
     * @param {number} command - the Link command hex.
     * @param {Uint8Array} message - the message to write
     */
    send(command, payload) {
        if (!this.isConnected()) return;
        if (this._busy) return;

        // Set a busy flag so that while we are sending a message and waiting for
        // the response, additional messages are ignored.
        this._busy = true;

        // Set a timeout after which to reset the busy flag. This is used in case
        // a Link message was sent for which we never received a response, because
        // e.g. the peripheral was turned off after the message was sent. We reset
        // the busy flag after a while so that it is possible to try again later.
        this._busyTimeoutID = window.setTimeout(() => {
            this._busy = false;
        }, 5000);

        const output = new Uint8Array(OP_LEN + payload.length);
        for (let i = 0; i < OP_LEN; i++) {
            output[i] = command[i];
        }
        for (let i = 0; i < payload.length; i++) {
            output[OP_LEN + i] = payload[i];
        }
        const data = Base64Util.uint8ArrayToBase64(output);

        this._link.write(LinkUUID.service, LinkUUID.txChar, data, 'base64', true).then(
            () => {
                this._busy = false;
                window.clearTimeout(this._busyTimeoutID);
            }
        );
    }

    /**
     * Starts reading data from peripheral after Link has connected to it.
     * @private
     */
    _onConnect() {
        this._link.read(LinkUUID.service, LinkUUID.rxChar, true, this._onMessage);
        this._timeoutID = window.setTimeout(
            () => this._link.handleDisconnectError(LinkDataStoppedError),
            LinkTimeout
        );
    }

    /**
     * Process the sensor data from the incoming Link characteristic.
     * @param {object} base64 - the incoming Link data.
     * @private
     */
    _onMessage(base64) {
        // TODO: parse data
        const data = Base64Util.base64ToUint8Array(base64);

        console.log("DATA RCV FROM LINK", data)

        // TODO: update state

        // cancel disconnect timeout and start a new one
        window.clearTimeout(this._timeoutID);
        this._timeoutID = window.setTimeout(
            () => this._link.handleDisconnectError(LinkDataStoppedError),
            LinkTimeout
        );
    }


    // ///////////////////////////////////////  bot specific things //////////////////

    setPin(pin, level) {
        const state = JSON.stringify([pin, level])
        console.log("setpin", state)
        this.send(PikachuCommand.SET_PIN_STATE, Buffer.from(state));
    }

    beep(interval) {
        this.send(PikachuCommand.BEEP, Uint8Array.from([interval]));
    }

}

const OP_LEN = 2

const OP = (code) => Buffer.from(code).slice(0, OP_LEN)

const PikachuCommand = {
    BEEP: OP('BP'),
    SET_PIN_STATE: OP('>P'),
    GET_STATE: OP('<S'),
    CMD_DISPLAY_TEXT: OP('DT'),
    CMD_DISPLAY_LED: OP('DL'),
};
