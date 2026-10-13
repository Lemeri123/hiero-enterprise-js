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
 * @returns A HieroConfig, or null if required env vars are missing
 * @throws HieroError with CONFIG_INVALID if values are invalid
 */
export function resolveConfigFromEnv(): HieroConfig | null {
    const network = process.env["HIERO_NETWORK"];
    const operatorId = process.env["HIERO_OPERATOR_ID"];
    const operatorKey = process.env["HIERO_OPERATOR_KEY"];
    const operatorKeyTypeRaw = process.env["HIERO_OPERATOR_KEY_TYPE"];
    const networkNodesRaw = process.env["HIERO_NETWORK_NODES"];

    if (!network || !operatorId || !operatorKey || !operatorKeyTypeRaw) {
        return null;
    }

    // Validate and normalize operatorKeyType
    const normalizedKeyType = operatorKeyTypeRaw.toLowerCase();
    if (
        normalizedKeyType !== "ed25519" &&
        normalizedKeyType !== "ecdsa" &&
        normalizedKeyType !== "der"
    ) {
        throw new HieroError(
            `Invalid HIERO_OPERATOR_KEY_TYPE: "${operatorKeyTypeRaw}". Must be one of: "ed25519", "ecdsa", "der".`,
            { code: HieroErrorCodes.ConfigInvalid },
        );
    }

    // Parse HIERO_NETWORK_NODES: "host:port=accountId,host:port=accountId"
    let networkNodes: Record<string, string> | undefined;
    if (networkNodesRaw) {
        const parsed = new Map<string, string>();
        const entries = networkNodesRaw.split(",");
        const malformed: string[] = [];

        for (const entry of entries) {
            const trimmed = entry.trim();
            if (!trimmed) continue;

            if (!trimmed.includes("=")) {
                malformed.push(trimmed);
                continue;
            }

            const [address, accountId] = trimmed.split("=");
            if (address && accountId) {
                parsed.set(address, accountId);
            }
        }

        if (malformed.length > 0) {
            throw new HieroError(
                `Invalid HIERO_NETWORK_NODES format. Each entry must be "host:port=accountId".\n` +
                    `Malformed entries: ${malformed.join(", ")}`,
                { code: HieroErrorCodes.ConfigInvalid },
            );
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
        operatorKeyType: normalizedKeyType,
        networkNodes,
        mirrorNetwork: mirrorNetwork?.length ? mirrorNetwork : undefined,
        mirrorNodeUrl: process.env["HIERO_MIRROR_NODE_URL"] || undefined,
    };
}

/**
 * Validates the environment and throws a HieroError explaining exactly what is missing or invalid.
 */
export function assertEnvConfigValid(): void {
    const network = process.env["HIERO_NETWORK"];
    const operatorId = process.env["HIERO_OPERATOR_ID"];
    const operatorKey = process.env["HIERO_OPERATOR_KEY"];
    const operatorKeyType = process.env["HIERO_OPERATOR_KEY_TYPE"];
    const networkNodesRaw = process.env["HIERO_NETWORK_NODES"];

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

    // Validate operatorKeyType value (guaranteed to be set by the checks above)
    const normalizedKeyType = operatorKeyType!.toLowerCase();
    if (
        normalizedKeyType !== "ed25519" &&
        normalizedKeyType !== "ecdsa" &&
        normalizedKeyType !== "der"
    ) {
        throw new HieroError(
            `Invalid HIERO_OPERATOR_KEY_TYPE: "${operatorKeyType}". Must be one of: "ed25519", "ecdsa", "der".`,
            { code: HieroErrorCodes.ConfigInvalid },
        );
    }

    // Validate networkNodes format if provided
    if (networkNodesRaw) {
        const entries = networkNodesRaw.split(",");
        const malformed: string[] = [];
        for (const entry of entries) {
            const trimmed = entry.trim();
            if (!trimmed) continue;
            if (!trimmed.includes("=")) {
                malformed.push(trimmed);
            }
        }
        if (malformed.length > 0) {
            throw new HieroError(
                `Invalid HIERO_NETWORK_NODES format. Each entry must be "host:port=accountId".\n` +
                    `Malformed entries: ${malformed.join(", ")}`,
                { code: HieroErrorCodes.ConfigInvalid },
            );
        }
    }
}
