/**
 * Custom Network — connect to a network other than mainnet, testnet or
 * previewnet, for example a local Solo network.
 *
 * A custom network needs what the built-in networks already know:
 *  - `networkNodes`: its consensus nodes, `"host:port"` → node account ID
 *    (`HIERO_NETWORK_NODES`);
 *  - `mirrorNetwork`: its mirror node's gRPC address (`HIERO_MIRROR_NETWORK`);
 *  - `mirrorNodeUrl`: its mirror node's REST URL (`HIERO_MIRROR_NODE_URL`).
 *    Balances are read from it.
 *
 * Run: HIERO_NETWORK_NODES="127.0.0.1:50211=0.0.3" HIERO_MIRROR_NETWORK="localhost:5600" \
 *      HIERO_MIRROR_NODE_URL="http://localhost:5551" pnpm tsx src/network/custom-network.ts
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
    const accountService = new AccountService(context);
    try {
        console.log("Consensus nodes:", config.networkNodes);
        console.log("Mirror node:", config.mirrorNetwork, config.mirrorNodeUrl);

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
