const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');

class PikachuPeriferal{
    constructor(runtime, extensionId){
        this._runtime = runtime
        this._extensionId=extensionId

        this._sensors ={
            
        }
        this._output={
            led:false
        }
    }
}

class PikachuBotBlocks {
    constructor (runtime) {
        this.runtime = runtime;
        console.log(runtime)
    }

    getInfo () {
        return {
            id: 'pikachubot',
            name: 'Pikachu bot',
            blocks: [
                {
                    opcode: 'op_doBeep',
                    blockType: BlockType.COMMAND,
                    text: 'beep for [INTERVAL] sec',
                    arguments: {
                        INTERVAL: {
                            type: ArgumentType.NUMBER,
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
        const interval = Cast.toString(args.INTERVAL);
        log.log("Do beep for interval "+ interval);
    }
}

module.exports = PikachuBotBlocks;