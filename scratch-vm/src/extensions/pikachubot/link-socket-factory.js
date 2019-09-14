import * as ScratchLinkWebSocket from '../../util/scratch-link-websocket'
import { EdithLinkWS } from './custom-link-socket';
import { LinkWSMock } from './mock-link-socket';


/**
 *
 * @param {string} type
 */
export default function CustomScratchLinkSocketFactory(type) {
    // TODO(mj) handle connection string payload
    if (type.startsWith('ESPWLAN')) {
        return new EdithLinkWS(type)
    }
    if (type.startsWith('MOCK')) {
        return new LinkWSMock(type)
    }
    return new ScratchLinkWebSocket(type)
}

