/* eslint-disable camelcase */
import ArgumentType from '../../extension-support/argument-type';
import BlockType from '../../extension-support/block-type';
import {log as _log} from '../../util/log';

import CustomScratchLinkSocketFactory from './link-socket-factory';
import {PikachuBotPeripheral} from './peripheral';


const Motor = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

const Sensor = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

const Rotation = {
    NONE: 0,
    LEFT: -1,
    RIGHT: 1
};

const Direction = {
    NONE: 0,
    FORWARD: 1,
    BACKWARD: -1
};

const SensorState = {
    DARK: 'DARK',
    LIGHT: 'LIGHT'
};

const blockIconURI = 'https://img.icons8.com/color/48/000000/pikachu-pokemon.png';
export default class PikachuBotExtenstion {
    static get EXTENSION_ID () {
        return 'pikachubot';
    }
    static get EXTENSION_NAME () {
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
                    opcode: this.op_setpin.name,
                    blockType: BlockType.COMMAND,
                    text: 'set pin [PIN] state [LEVEL]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'pins',
                            defaultValue: 16
                        },
                        LEVEL: {
                            type: ArgumentType.NUMBER,
                            menu: 'pinLevels',
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: this.op_go.name,
                    blockType: BlockType.COMMAND,
                    text: 'go [DIRECTION] for [DURATION] seconds',
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.NUMBER,
                            menu: 'directions',
                            defaultValue: 1
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2
                        }
                    }
                },
                {
                    opcode: this.op_rotate.name,
                    blockType: BlockType.COMMAND,
                    text: 'rotate [ROTATION] for [DURATION] seconds',
                    arguments: {
                        ROTATION: {
                            type: ArgumentType.NUMBER,
                            menu: 'rotations',
                            defaultValue: 1
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2
                        }
                    }
                },


                // Below are Not implemented
                {
                    opcode: this.op_beep.name,
                    blockType: BlockType.COMMAND,
                    text: 'beep for [INTERVAL] sec',
                    arguments: {
                        INTERVAL: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: this.op_move.name,
                    blockType: BlockType.COMMAND,
                    text: 'move left by [LEFT] and right by [RIGHT]',
                    arguments: {
                        LEFT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        RIGHT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: this.op_setSpeed.name,
                    blockType: BlockType.COMMAND,
                    text: 'set motor [MOTOR] speed [SPEED]',
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motors',
                            defaultValue: Motor.LEFT
                        },
                        SPEED: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: this.op_isSensorStateMatched.name,
                    blockType: BlockType.BOOLEAN,
                    text: 'sensor [SENSOR] is [STATE]',
                    arguments: {
                        SENSOR: {
                            type: ArgumentType.STRING,
                            menu: 'sensors',
                            defaultValue: Sensor.LEFT
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'sensorStates',
                            defaultValue: SensorState.LIGHT
                        }
                    }
                }
            ],
            menus: {
                pins: {
                    acceptReporters: true,
                    items: [{
                        text: 'ESP_LED(GPIO2)',
                        value: 2
                    },
                    {
                        text: 'BORAD_LED(GPIO16)',
                        value: 16
                    }]
                },
                pinLevels: {
                    acceptReporters: true,
                    items: [{
                        text: 'HIGH',
                        value: 1
                    },
                    {
                        text: 'LOW',
                        value: 0
                    }]
                },
                motors: {
                    acceptReporters: true,
                    items: [{
                        text: 'LEFT',
                        value: Motor.LEFT
                    },
                    {
                        text: 'RIGHT',
                        value: Motor.RIGHT
                    }]
                },
                directions: {
                    acceptReporters: true,
                    items: [{
                        text: 'FORWARD',
                        value: Direction.FORWARD
                    },
                    {
                        text: 'BACKWARD',
                        value: Direction.BACKWARD
                    }]
                },
                rotations: {
                    acceptReporters: true,
                    items: [{
                        text: 'LEFT',
                        value: Rotation.LEFT
                    },
                    {
                        text: 'RIGHT',
                        value: Rotation.RIGHT
                    }]
                },
                sensors: {
                    acceptReporters: true,
                    items: [{
                        text: 'LEFT',
                        value: Sensor.LEFT
                    },
                    {
                        text: 'RIGHT',
                        value: Sensor.RIGHT
                    }]
                },
                sensorStates: {
                    acceptReporters: true,
                    items: [{
                        text: 'DARK',
                        value: SensorState.DARK
                    },
                    {
                        text: 'LIGHT',
                        value: SensorState.LIGHT
                    }]
                }
            }
        };
    }

    op_move (args) {
        return console.log(args);
        this._peripheral.move(args.LEFT, args.RIGHT);
    }

    op_isSensorStateMatched (args) {
        return console.log(args);
        return this._peripheral.sensorState(args.SENSOR) === args.STATE;
    }

    op_setSpeed (args) {
        return console.log(args);
        this._peripheral.setSpeed(args.MOTOR, args.SPEED);
    }

    op_beep (args) {
        return console.log(args);
        this._peripheral.beep(args.INTERVAL);
    }

    // following are implemented at minimum functional level
    op_setpin (args) {
        return this._peripheral.setPin(+args.PIN, +args.LEVEL);
    }
    op_go (args) {
        return this._peripheral.go(+args.DIRECTION, +args.DURATION);
    }
    op_rotate (args) {
        return this._peripheral.rotate(+args.ROTATION, +args.DURATION);
    }
}
