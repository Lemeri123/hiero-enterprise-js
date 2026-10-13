import { describe, it, expect } from "vitest";
import {
    resolveConfigFromEnv,
    assertEnvConfigValid,
} from "../../../src/config/index.js";
import { OperatorKeyType } from "../../../src/types/index.js";
import { HieroError, HieroErrorCodes } from "../../../src/errors/index.js";

describe("resolveConfigFromEnv", () => {
    const env = process.env;

    it("throws when env vars are missing", () => {
        process.env = {};
        expect(() => resolveConfigFromEnv()).toThrow(HieroError);
        expect(() => resolveConfigFromEnv()).toThrow(/Missing required/);
        process.env = env;
    });

    it("throws with CONFIG_INVALID when env vars are missing", () => {
        process.env = {};
        try {
            resolveConfigFromEnv();
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
        }
        process.env = env;
    });

    it("resolves HIERO_ prefixed env vars", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ECDSA",
        };
        const config = resolveConfigFromEnv();
        expect(config).toMatchObject({
            network: "testnet",
            operatorId: "0.0.1",
            operatorKey: "key123",
            operatorKeyType: OperatorKeyType.ECDSA,
        });
        process.env = env;
    });

    it("throws when operatorKeyType is missing", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
        };
        expect(() => resolveConfigFromEnv()).toThrow(HieroError);
        expect(() => resolveConfigFromEnv()).toThrow(
            /HIERO_OPERATOR_KEY_TYPE/,
        );
        process.env = env;
    });

    it("throws CONFIG_INVALID for invalid operatorKeyType", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.2",
            HIERO_OPERATOR_KEY: "abc",
            HIERO_OPERATOR_KEY_TYPE: "rsa",
        };
        try {
            resolveConfigFromEnv();
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("rsa");
            expect((error as HieroError).message).toMatch(
                /ed25519.*ecdsa.*der/,
            );
        }
        process.env = env;
    });

    it("parses HIERO_NETWORK_NODES for custom networks", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_NETWORK_NODES: "127.0.0.1:50211=0.0.3, 127.0.0.1:50212=0.0.4",
        };
        expect(resolveConfigFromEnv()?.networkNodes).toMatchObject({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });
        process.env = env;
    });

    it("throws CONFIG_INVALID for malformed HIERO_NETWORK_NODES entries", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_NETWORK_NODES: "127.0.0.1:50211,127.0.0.1:50212=0.0.4",
        };
        try {
            resolveConfigFromEnv();
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("127.0.0.1:50211");
            expect((error as HieroError).message).toContain('missing "="');
        }
        process.env = env;
    });

    it("throws CONFIG_INVALID when all HIERO_NETWORK_NODES entries are malformed", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_NETWORK_NODES: "127.0.0.1:50211,127.0.0.1:50212",
        };
        try {
            resolveConfigFromEnv();
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("127.0.0.1:50211");
            expect((error as HieroError).message).toContain("127.0.0.1:50212");
        }
        process.env = env;
    });

    it("parses HIERO_MIRROR_NETWORK and HIERO_MIRROR_NODE_URL", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_MIRROR_NETWORK: "localhost:5600, localhost:5601",
            HIERO_MIRROR_NODE_URL: "http://localhost:5551",
        };
        expect(resolveConfigFromEnv()).toMatchObject({
            mirrorNetwork: ["localhost:5600", "localhost:5601"],
            mirrorNodeUrl: "http://localhost:5551",
        });
        process.env = env;
    });

    it("leaves the mirror fields unset when their env vars are empty", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_MIRROR_NETWORK: "",
            HIERO_MIRROR_NODE_URL: "",
        };
        const config = resolveConfigFromEnv();
        expect(config?.mirrorNetwork).toBeUndefined();
        expect(config?.mirrorNodeUrl).toBeUndefined();
        process.env = env;
    });

    it("parses the SDK tuning env vars", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_REQUEST_TIMEOUT_MS: "60000",
            HIERO_GRPC_DEADLINE_MS: "5000",
            HIERO_MAX_ATTEMPTS: "3",
            HIERO_MIN_BACKOFF_MS: "100",
            HIERO_MAX_BACKOFF_MS: "4000",
        };
        expect(resolveConfigFromEnv()).toMatchObject({
            requestTimeoutMs: 60000,
            grpcDeadlineMs: 5000,
            maxAttempts: 3,
            minBackoffMs: 100,
            maxBackoffMs: 4000,
        });
        process.env = env;
    });

    it("leaves the SDK tuning fields unset when their env vars are empty", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_MAX_ATTEMPTS: "",
        };
        const config = resolveConfigFromEnv();
        expect(config?.requestTimeoutMs).toBeUndefined();
        expect(config?.maxAttempts).toBeUndefined();
        process.env = env;
    });

    it.each(["abc", "0", "-5", "Infinity"])(
        "rejects HIERO_MAX_ATTEMPTS=%s with CONFIG_INVALID",
        (value) => {
            process.env = {
                HIERO_NETWORK: "testnet",
                HIERO_OPERATOR_ID: "0.0.1",
                HIERO_OPERATOR_KEY: "key123",
                HIERO_OPERATOR_KEY_TYPE: "ed25519",
                HIERO_MAX_ATTEMPTS: value,
            };
            try {
                expect(() => resolveConfigFromEnv()).toThrow(
                    expect.objectContaining({
                        code: HieroErrorCodes.ConfigInvalid,
                        message: `HIERO_MAX_ATTEMPTS must be a positive number, got "${value}".`,
                    }),
                );
            } finally {
                process.env = env;
            }
        },
    );
});

describe("assertEnvConfigValid", () => {
    const env = process.env;

    it("throws when env vars are missing", () => {
        process.env = {};
        expect(() => assertEnvConfigValid()).toThrow(HieroError);
        process.env = env;
    });

    it("throws CONFIG_INVALID for invalid operatorKeyType", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.2",
            HIERO_OPERATOR_KEY: "abc",
            HIERO_OPERATOR_KEY_TYPE: "rsa",
        };
        try {
            assertEnvConfigValid();
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
        }
        process.env = env;
    });

    it("does not throw when env is valid", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
        };
        expect(() => assertEnvConfigValid()).not.toThrow();
        process.env = env;
    });
});
