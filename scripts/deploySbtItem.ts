import { toNano } from '@ton/core';
import { SbtItem } from '../wrappers/SbtItem';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sbtItem = provider.open(
        SbtItem.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('SbtItem')
        )
    );

    await sbtItem.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(sbtItem.address);

    console.log('ID', await sbtItem.getID());
}
