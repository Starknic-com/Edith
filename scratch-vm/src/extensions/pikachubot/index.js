import {NUMBER} from '../../extension-support/argument-type';
import {COMMAND} from '../../extension-support/block-type';
import {log as _log} from '../../util/log';

import CustomScratchLinkSocketFactory from './link-socket-factory';
import {PikachuBotPeripheral} from './peripheral';


const blockIconURI = 'https://img.icons8.com/color/48/000000/pikachu-pokemon.png';
export default class PikachuBotExtenstion {
    static get EXTENSION_ID () {
        return 'pikachubot';
    }
    static get EXTENSION_NAME (){
        return 'Pikachu';
    }

    /**
     *
     * @param {Runtime} runtime
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.runtime.configureScratchLinkSocketFactory(
            CustomScratchLinkSocketFactory);
        // Create a new Pikachu peripheral instance
        this._peripheral = new PikachuBotPeripheral(this.runtime,
            PikachuBotExtenstion.EXTENSION_ID);

    }

    getInfo () {
        return {
            id: PikachuBotExtenstion.EXTENSION_ID,
            name: PikachuBotExtenstion.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'op_doBeep',
                    blockType: COMMAND,
                    text: 'beep for [INTERVAL] sec',
                    arguments: {
                        INTERVAL: {
                            type: NUMBER,
                            defaultValue: 5
                        }
                    }
                }
            ],
            menus: {
            }
        };
    }

    op_doBeep (args) {
        this._peripheral.beep(args.INTERVAL);
    }
}
