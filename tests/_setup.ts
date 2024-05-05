import { beginCell } from '@ton/core';

export function collectionContentToCell(collectionContent: string) {
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    return beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(collectionContent).endCell();
}
