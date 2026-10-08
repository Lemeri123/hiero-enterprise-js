import { HieroError, HieroErrorCodes } from "../errors/index.js";

/**
 * Configuration for connecting to a Hiero network.
 *
 * The mirror node fields here are the ones the SDK uses itself (balances,
 * topic subscriptions). The `@hiero-hackers/enterprise-mirror` client has
 * its own `MirrorConfig`.
 */
export interface HieroConfig {
    /** Network to connect to (e.g., "testnet", "mainnet", "previewnet", or custom) */
    readonly network: string;
    /** Operator account ID (e.g., "0.0.12345") */
    readonly operatorId: string;
    /** Operator private key */
    readonly operatorKey: string;
    /** Type of the operator private key — required to correctly parse the key material */
    readonly operatorKeyType: string;
    /**
     * Consensus node addresses for custom networks.
     * Map of "host:port" → "accountId" (e.g., { "127.0.0.1:50211": "0.0.3" }).
     * Required for custom/local networks where node discovery is unavailable.
     */
    readonly networkNodes?: Record<string, string>;
    /**
     * Mirror node gRPC addresses for custom networks (e.g., ["localhost:5600"]).
     * Mainnet, testnet and previewnet already know theirs.
     */
    readonly mirrorNetwork?: string[];
    /**
     * Mirror node REST URL (e.g., "http://localhost:5551"). Balances are read
     * from it. Without it the SDK derives the URL from the mirror network,
     * using port 5551 for a local mirror node.
     */
    readonly mirrorNodeUrl?: string;
    /** Request timeout in milliseconds (default: 120000) */
    readonly requestTimeoutMs?: number;
    /** gRPC deadline in milliseconds (default: 10000) */
    readonly grpcDeadlineMs?: number;
    /** Max transaction submission attempts (default: 10) */
    readonly maxAttempts?: number;
    /** Minimum backoff in milliseconds (default: 250) */
    readonly minBackoffMs?: number;
    /** Maximum backoff in milliseconds (default: 8000) */
    readonly maxBackoffMs?: number;
}

/**
 * Resolve a HieroConfig from environment variables.
 *
 * Reads from:
 *   HIERO_NETWORK
 *   HIERO_OPERATOR_ID
 *   HIERO_OPERATOR_KEY
 *   HIERO_OPERATOR_KEY_TYPE
 *   HIERO_NETWORK_NODES
 *   HIERO_MIRROR_NETWORK
 *   HIERO_MIRROR_NODE_URL
 *
 * @returns A HieroConfig or null if required env vars are missing
 */
export function resolveConfigFromEnv(): HieroConfig | null {
    const network = process.env["HIERO_NETWORK"];
    const operatorId = process.env["HIERO_OPERATOR_ID"];
    const operatorKey = process.env["HIERO_OPERATOR_KEY"];
    const operatorKeyTypeRaw =
        process.env["HIERO_OPERATOR_KEY_TYPE"]?.toLowerCase();
    const operatorKeyType =
        operatorKeyTypeRaw === "ed25519" ||
        operatorKeyTypeRaw === "ecdsa" ||
        operatorKeyTypeRaw === "der"
            ? operatorKeyTypeRaw
            : undefined;
    const networkNodesRaw = process.env["HIERO_NETWORK_NODES"];

    if (!network || !operatorId || !operatorKey || !operatorKeyType) {
        return null;
    }

    // Parse HIERO_NETWORK_NODES: "host:port=accountId,host:port=accountId"
    let networkNodes: Record<string, string> | undefined;
    if (networkNodesRaw) {
        const parsed = new Map<string, string>();
        for (const entry of networkNodesRaw.split(",")) {
            const [address, accountId] = entry.trim().split("=");
            if (address && accountId) {
                parsed.set(address, accountId);
            }
        }
        networkNodes = Object.fromEntries(parsed);
    }

    // Parse HIERO_MIRROR_NETWORK: "host:port,host:port"
    const mirrorNetwork = process.env["HIERO_MIRROR_NETWORK"]
        ?.split(",")
        .map((address) => address.trim())
        .filter((address) => address.length > 0);

    return {
        network,
        operatorId,
        operatorKey,
        operatorKeyType,
        networkNodes,
        mirrorNetwork: mirrorNetwork?.length ? mirrorNetwork : undefined,
        mirrorNodeUrl: process.env["HIERO_MIRROR_NODE_URL"] || undefined,
    };
}

/**
 * Validates the environment and throws a HieroError explaining exactly what is missing.
 */
export function assertEnvConfigValid(): void {
    const network = process.env["HIERO_NETWORK"];
    const operatorId = process.env["HIERO_OPERATOR_ID"];
    const operatorKey = process.env["HIERO_OPERATOR_KEY"];
    const operatorKeyType = process.env["HIERO_OPERATOR_KEY_TYPE"];

    const missing = [];
    if (!network)
        missing.push(
            "HIERO_NETWORK (e.g., 'testnet', 'mainnet', 'previewnet')",
        );
    if (!operatorId) missing.push("HIERO_OPERATOR_ID (e.g., '0.0.12345')");
    if (!operatorKey) missing.push("HIERO_OPERATOR_KEY (your private key)");
    if (!operatorKeyType)
        missing.push(
            "HIERO_OPERATOR_KEY_TYPE (one of: 'ed25519', 'ecdsa', 'der')",
        );

    if (missing.length > 0) {
        throw new HieroError(
            `Missing required Hiero environment variables:\n  - ${missing.join("\n  - ")}\n\n` +
                `Set them in your process environment before application startup.`,
            { code: HieroErrorCodes.ConfigInvalid },
        );
    }
}
