import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type SbtCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    content: Cell;
    nftItemCode: Cell;
};

export function sbtCollectionConfigToCell(config: SbtCollectionConfig): Cell {
    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.nextItemIndex, 64)
        .storeRef(config.content)
        .storeRef(config.nftItemCode)
        .endCell();
}

export const Opcodes = {
    mint: 0xecad15c4,
    updateOwner: 0xcd5aacf3,
};

export class SbtCollection implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new SbtCollection(address);
    }

    static createFromConfig(config: SbtCollectionConfig, code: Cell, workchain = 0) {
        const data = sbtCollectionConfigToCell(config);
        const init = { code, data };
        return new SbtCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        opts: {
            nftContent: Cell;
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.mint, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.nftContent)
                .endCell(),
        });
    }

    async sendUpdateOwner(
        provider: ContractProvider,
        via: Sender,
        opts: {
            newOwner: Address;
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.updateOwner, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(opts.newOwner)
                .endCell(),
        });
    }

    async getCollectionData(provider: ContractProvider) {
        const result = await provider.get('get_collection_data', []);
        return {
            nextItemIndex: result.stack.readBigNumber(),
            content: result.stack.readCell(),
            ownerAddress: result.stack.readAddress(),
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: bigint) {
        const result = await provider.get('get_nft_address_by_index', [{ type: 'int', value: index }]);
        return result.stack.readAddress();
    }

    async getNftContent(provider: ContractProvider, index: bigint, individualContent: Cell): Promise<Cell> {
        const result = await provider.get('get_nft_content', [
            {
                type: 'int',
                value: index,
            },
            {
                type: 'cell',
                cell: individualContent,
            },
        ]);
        return result.stack.readCell();
    }
}
