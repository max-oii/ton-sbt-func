import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { SbtCollection } from '../wrappers/SbtCollection';
import { SbtItem } from '../wrappers/SbtItem';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { collectionContentToCell } from './_setup';

describe('SbtCollection', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('SbtCollection');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let sbtCollection: SandboxContract<SbtCollection>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        const collectionContent = collectionContentToCell('https://s.getgems.io/nft/b/c/62fba50217c3fe3cbaad9e7f/');
        const sbtItemCode = await compile('SbtItem');

        sbtCollection = blockchain.openContract(
            SbtCollection.createFromConfig(
                {
                    ownerAddress: deployer.address,
                    nextItemIndex: 1,
                    content: collectionContent,
                    nftItemCode: sbtItemCode,
                },
                code,
            ),
        );

        const deployResult = await sbtCollection.sendDeploy(deployer.getSender(), toNano('0.1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sbtCollection.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {});

    it('should mint', async () => {
        console.log('mint done');
    });

    it('should update owner', async () => {
        const collectionDataBefore = await sbtCollection.getCollectionData();
        expect(collectionDataBefore.ownerAddress.toString()).toBe(deployer.address.toString());

        const newOwner = await blockchain.treasury('newOwner');
        const updateOwnerResult = await sbtCollection.sendUpdateOwner(deployer.getSender(), {
            newOwner: newOwner.address,
            value: toNano('0.05'),
        });
        expect(updateOwnerResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sbtCollection.address,
            success: true,
        });

        const collectionDataAfter = await sbtCollection.getCollectionData();
        expect(collectionDataAfter.ownerAddress.toString()).toBe(newOwner.address.toString());
    });
});
