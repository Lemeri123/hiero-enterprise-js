import { describe, it, expect, afterEach } from "vitest";
import { inspect } from "node:util";
import {
    PrivateKey,
    TransactionId,
    TransferTransaction,
} from "@hiero-ledger/sdk";
import { HieroContext } from "../../../src/context/index.js";
import { OperatorKeyType } from "../../../src/types/index.js";

// Uses the real SDK: a mocked PrivateKey has no key material to leak.

const operatorKey =
    "302e020100300506032b6570042204203b054ddd0c62d577ce0fbb0e92dcce0d5bea42a98a5c9663271939881ce19208";
const privateKey = PrivateKey.fromStringDer(operatorKey);
const config = {
    network: "testnet",
    operatorId: "0.0.2",
    operatorKey,
    operatorKeyType: OperatorKeyType.DER,
};

describe("HieroContext operator key", () => {
    const contexts: HieroContext[] = [];
    const create = () => {
        const ctx = new HieroContext({ ...config });
        contexts.push(ctx);
        return ctx;
    };

    afterEach(() => {
        contexts.splice(0).forEach((ctx) => ctx.close());
    });

    it("redacts operatorKey in config", () => {
        const ctx = create();

        expect(ctx.config.operatorKey).toBe("[redacted]");
        expect(JSON.stringify(ctx.config)).not.toContain(operatorKey);
    });

    it("keeps the rest of the config", () => {
        const { operatorKey: _, ...rest } = config;

        expect(create().config).toMatchObject(rest);
    });

    it("does not modify the caller's config", () => {
        const callerConfig = { ...config };
        const ctx = new HieroContext(callerConfig);
        contexts.push(ctx);

        expect(ctx.config).not.toBe(callerConfig);
        expect(callerConfig.operatorKey).toBe(operatorKey);
    });

    it("keeps the key out of inspect output", () => {
        const output = inspect(create(), {
            depth: Infinity,
            maxArrayLength: Infinity,
        });

        expect(output).not.toContain(privateKey.toStringRaw());
        expect(output).not.toContain(
            Array.from(privateKey.toBytesRaw()).join(", "),
        );
    });

    it("still signs with the operator key", async () => {
        const ctx = create();
        const tx = new TransferTransaction()
            .setNodeAccountIds([ctx.operatorAccountId])
            .setTransactionId(TransactionId.generate(ctx.operatorAccountId))
            .freeze();

        await ctx.signTransaction(tx);

        expect(privateKey.publicKey.verifyTransaction(tx)).toBe(true);
    });
});
