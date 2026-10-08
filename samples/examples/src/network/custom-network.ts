/**
 * Custom Network — connect to a network other than mainnet, testnet or
 * previewnet, for example a local Solo network.
 *
 * A custom network needs two things the built-in networks already have:
 *  - its consensus nodes, given as `networkNodes`
 *    (`"host:port"` → node account ID, or `HIERO_NETWORK_NODES`);
 *  - its mirror node, set on the client. Balances are read from the
 *    mirror node.
 *
 * Run: HIERO_NETWORK_NODES="127.0.0.1:50211=0.0.3" pnpm tsx src/network/custom-network.ts
 */

import { AccountService, HieroContext } from "@hiero-hackers/enterprise-core";
import { getED25519Config, waitForMirror } from "../env.js";

async function main() {
    const config = getED25519Config();
    if (!config.networkNodes) {
        console.log(
            'Set HIERO_NETWORK_NODES (e.g. "127.0.0.1:50211=0.0.3") to run this example.',
        );
        return;
    }

    const context = new HieroContext(config);
    context.client.setMirrorNetwork(["localhost:5600"]);

    const accountService = new AccountService(context);
    try {
        console.log("Consensus nodes:", config.networkNodes);

        const account = await accountService.createAccount({
            publicKey: context.operatorPublicKey.toString(),
            initialBalance: 1,
        });
        console.log("Created account:", account.accountId);

        await waitForMirror();
        const { tinybars } = await accountService.getAccountBalance(
            account.accountId,
        );
        console.log("Balance from the mirror node:", tinybars, "tinybars");
    } finally {
        context.close();
    }
}
void main().catch((error) => {
    console.error("custom network sample failed:", error);
    process.exitCode = 1;
});
