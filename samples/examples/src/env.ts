import type { HieroConfig } from "@hiero-hackers/enterprise-core";

/**
 * Parse HIERO_NETWORK_NODES env var.
 * Format: "host:port=accountId,host:port=accountId"
 * Example: "127.0.0.1:50211=0.0.3"
 */
function parseNetworkNodes(raw?: string): Record<string, string> | undefined {
    if (!raw) return undefined;
    const nodes: Record<string, string> = {};
    for (const entry of raw.split(",")) {
        const [address, accountId] = entry.trim().split("=");
        if (address && accountId) {
            // eslint-disable-next-line security/detect-object-injection
            nodes[address] = accountId;
        }
    }
    return Object.keys(nodes).length > 0 ? nodes : undefined;
}

/**
 * Parse HIERO_MIRROR_NETWORK env var.
 * Format: "host:port,host:port"
 * Example: "localhost:5600"
 */
function parseMirrorNetwork(raw?: string): string[] | undefined {
    const addresses = raw
        ?.split(",")
        .map((address) => address.trim())
        .filter((address) => address.length > 0);
    return addresses?.length ? addresses : undefined;
}

/**
 * Build a HieroConfig from environment variables with sensible defaults
 * for local development. Used by all example scripts.
 *
 * Uses the ED25519 operator.
 */
export function getED25519Config(): HieroConfig {
    return {
        network: process.env["HIERO_NETWORK"] ?? "testnet",
        operatorId: process.env["HIERO_ED25519_OPERATOR_ID"]!,
        operatorKey: process.env["HIERO_ED25519_OPERATOR_KEY"]!,
        operatorKeyType: "ed25519",
        networkNodes: parseNetworkNodes(process.env["HIERO_NETWORK_NODES"]),
        mirrorNetwork: parseMirrorNetwork(process.env["HIERO_MIRROR_NETWORK"]),
        mirrorNodeUrl: process.env["HIERO_MIRROR_NODE_URL"],
    };
}

/**
 * Build a HieroConfig using the ECDSA operator account.
 * Use this for examples that specifically demo ECDSA operations.
 */
export function getEcdsaExampleConfig(): HieroConfig {
    return {
        network: process.env["HIERO_NETWORK"] ?? "testnet",
        operatorId: process.env["HIERO_ECDSA_OPERATOR_ID"]!,
        operatorKey: process.env["HIERO_ECDSA_OPERATOR_KEY"]!,
        operatorKeyType: "ecdsa",
        networkNodes: parseNetworkNodes(process.env["HIERO_NETWORK_NODES"]),
        mirrorNetwork: parseMirrorNetwork(process.env["HIERO_MIRROR_NETWORK"]),
        mirrorNodeUrl: process.env["HIERO_MIRROR_NODE_URL"],
    };
}

/**
 * Give the mirror node a few seconds to ingest the latest transaction
 * before reading a balance from it.
 */
export function waitForMirror(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 5000));
}
