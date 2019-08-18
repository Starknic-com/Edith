import * as ScratchLinkWebSocket from '../../util/scratch-link-websocket'
import { LinkWS } from './custom-link-socket';
import { LinkWSMock } from './mock-link-socket';


/**
 *
 * @param {string} type
 */
export default function CustomScratchLinkSocketFactory(type) {
    return new LinkWSMock(type)
    if (type.startsWith('MJ')) {
        return new LinkWS(type)
    }
    if (type.startsWith('MOCK')) {
        return new LinkWSMock(type)
    }
    return new ScratchLinkWebSocket(type)
}
