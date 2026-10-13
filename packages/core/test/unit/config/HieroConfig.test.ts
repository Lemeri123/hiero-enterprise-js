import { describe, it, expect } from "vitest";
import {
    resolveConfigFromEnv,
    assertEnvConfigValid,
} from "../../../src/config/index.js";
import { OperatorKeyType } from "../../../src/types/index.js";
import { HieroError, HieroErrorCodes } from "../../../src/errors/index.js";

describe("resolveConfigFromEnv", () => {
    const env = process.env;

    it("returns null when env vars are missing", () => {
        process.env = {};
        expect(resolveConfigFromEnv()).toBeNull();
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

    it("returns null when operatorKeyType is missing", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
        };
        expect(resolveConfigFromEnv()).toBeNull();
        process.env = env;
    });

    it("throws HieroError with CONFIG_INVALID for invalid operatorKeyType", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "rsa",
        };
        expect(() => resolveConfigFromEnv()).toThrow(HieroError);
        try {
            resolveConfigFromEnv();
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("rsa");
            expect((error as HieroError).message).toContain(
                "HIERO_OPERATOR_KEY_TYPE",
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

    it("throws HieroError for malformed HIERO_NETWORK_NODES entries", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_NETWORK_NODES: "127.0.0.1:50211,127.0.0.1:50212=0.0.4",
        };
        expect(() => resolveConfigFromEnv()).toThrow(HieroError);
        try {
            resolveConfigFromEnv();
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("127.0.0.1:50211");
            expect((error as HieroError).message).toContain(
                "HIERO_NETWORK_NODES",
            );
        }
        process.env = env;
    });

    it("throws HieroError when all HIERO_NETWORK_NODES entries are malformed", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_NETWORK_NODES: "127.0.0.1:50211,127.0.0.1:50212",
        };
        expect(() => resolveConfigFromEnv()).toThrow(HieroError);
        try {
            resolveConfigFromEnv();
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain(
                "HIERO_NETWORK_NODES",
            );
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
});

describe("assertEnvConfigValid", () => {
    const env = process.env;

    it("throws HieroError with CONFIG_INVALID for missing required variables", () => {
        process.env = {};
        expect(() => assertEnvConfigValid()).toThrow(HieroError);
        try {
            assertEnvConfigValid();
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("HIERO_NETWORK");
            expect((error as HieroError).message).toContain(
                "HIERO_OPERATOR_ID",
            );
            expect((error as HieroError).message).toContain(
                "HIERO_OPERATOR_KEY",
            );
            expect((error as HieroError).message).toContain(
                "HIERO_OPERATOR_KEY_TYPE",
            );
        }
        process.env = env;
    });

    it("does not throw when all required variables are present and valid", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
        };
        expect(() => assertEnvConfigValid()).not.toThrow();
        process.env = env;
    });

    it("throws HieroError with CONFIG_INVALID for invalid operatorKeyType", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "rsa",
        };
        expect(() => assertEnvConfigValid()).toThrow(HieroError);
        try {
            assertEnvConfigValid();
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("rsa");
            expect((error as HieroError).message).toContain(
                "HIERO_OPERATOR_KEY_TYPE",
            );
        }
        process.env = env;
    });

    it("throws HieroError for malformed HIERO_NETWORK_NODES", () => {
        process.env = {
            HIERO_NETWORK: "local",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ed25519",
            HIERO_NETWORK_NODES: "127.0.0.1:50211",
        };
        expect(() => assertEnvConfigValid()).toThrow(HieroError);
        try {
            assertEnvConfigValid();
        } catch (error) {
            expect(error).toBeInstanceOf(HieroError);
            expect((error as HieroError).code).toBe(
                HieroErrorCodes.ConfigInvalid,
            );
            expect((error as HieroError).message).toContain("127.0.0.1:50211");
        }
        process.env = env;
    });

    it("normalizes operatorKeyType case-insensitively", () => {
        process.env = {
            HIERO_NETWORK: "testnet",
            HIERO_OPERATOR_ID: "0.0.1",
            HIERO_OPERATOR_KEY: "key123",
            HIERO_OPERATOR_KEY_TYPE: "ED25519",
        };
        expect(() => assertEnvConfigValid()).not.toThrow();
        process.env = env;
    });
});
