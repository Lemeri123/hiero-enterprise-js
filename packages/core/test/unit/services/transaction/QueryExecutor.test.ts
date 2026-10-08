import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AccountId, Hbar, TransactionId } from "@hiero-ledger/sdk";
import { QueryExecutor } from "../../../../src/services/transaction/index.js";
import { createMockContext } from "../../../utils/mock-context.js";
import { HieroError } from "../../../../src/errors/index.js";
import {
    HieroContext,
    type IHieroContext,
} from "../../../../src/context/index.js";

interface MockQuery {
    setPaymentTransactionId: ReturnType<typeof vi.fn>;
    setMaxQueryPayment: ReturnType<typeof vi.fn>;
    setQueryPayment: ReturnType<typeof vi.fn>;
    setNodeAccountIds: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
}

function buildMockQuery(): MockQuery {
    return {
        setPaymentTransactionId: vi.fn().mockReturnThis(),
        setMaxQueryPayment: vi.fn().mockReturnThis(),
        setQueryPayment: vi.fn().mockReturnThis(),
        setNodeAccountIds: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue("query-result"),
    };
}

const CONTEXT = "NetworkService.getNetworkVersionInfo";

describe("QueryExecutor", () => {
    let context: IHieroContext;
    let executor: QueryExecutor;
    let query: MockQuery;

    beforeEach(() => {
        vi.clearAllMocks();
        context = createMockContext();
        executor = new QueryExecutor(context);
        query = buildMockQuery();
    });

    describe("applyBaseOptions", () => {
        it("does not call any setters when options are empty", async () => {
            await executor.run(query as never, {}, CONTEXT);

            expect(query.setPaymentTransactionId).not.toHaveBeenCalled();
            expect(query.setMaxQueryPayment).not.toHaveBeenCalled();
            expect(query.setQueryPayment).not.toHaveBeenCalled();
            expect(query.setNodeAccountIds).not.toHaveBeenCalled();
        });

        it("sets a payment transaction ID generated from a string payer", async () => {
            await executor.run(
                query as never,
                { payerAccountId: "0.0.500" },
                CONTEXT,
            );

            expect(query.setPaymentTransactionId).toHaveBeenCalledTimes(1);
            const txId = query.setPaymentTransactionId.mock
                .calls[0][0] as TransactionId;
            expect(txId).toBeInstanceOf(TransactionId);
            expect(txId.accountId?.toString()).toBe("0.0.500");
        });

        it("sets a payment transaction ID generated from an AccountId payer", async () => {
            const payer = AccountId.fromString("0.0.501");

            await executor.run(
                query as never,
                { payerAccountId: payer },
                CONTEXT,
            );

            const txId = query.setPaymentTransactionId.mock
                .calls[0][0] as TransactionId;
            expect(txId.accountId?.toString()).toBe("0.0.501");
        });

        it("coerces a numeric maxQueryPayment into an Hbar", async () => {
            await executor.run(query as never, { maxQueryPayment: 2 }, CONTEXT);

            const arg = query.setMaxQueryPayment.mock.calls[0][0] as Hbar;
            expect(arg).toBeInstanceOf(Hbar);
            expect(arg.toBigNumber().toNumber()).toBe(2);
        });

        it("passes an Hbar maxQueryPayment through unchanged", async () => {
            const fee = new Hbar(5);

            await executor.run(
                query as never,
                { maxQueryPayment: fee },
                CONTEXT,
            );

            expect(query.setMaxQueryPayment).toHaveBeenCalledWith(fee);
        });

        it("coerces a numeric queryPayment into an Hbar", async () => {
            await executor.run(query as never, { queryPayment: 1 }, CONTEXT);

            const arg = query.setQueryPayment.mock.calls[0][0] as Hbar;
            expect(arg).toBeInstanceOf(Hbar);
            expect(arg.toBigNumber().toNumber()).toBe(1);
        });

        it("converts each string node ID into an AccountId", async () => {
            await executor.run(
                query as never,
                { nodeAccountIds: ["0.0.3", "0.0.4"] },
                CONTEXT,
            );

            expect(query.setNodeAccountIds).toHaveBeenCalledTimes(1);
            const ids = query.setNodeAccountIds.mock.calls[0][0] as AccountId[];
            expect(ids).toHaveLength(2);
            expect(ids[0]).toBeInstanceOf(AccountId);
            expect(ids[0].toString()).toBe("0.0.3");
            expect(ids[1].toString()).toBe("0.0.4");
        });

        it("ignores an empty nodeAccountIds array", async () => {
            await executor.run(query as never, { nodeAccountIds: [] }, CONTEXT);

            expect(query.setNodeAccountIds).not.toHaveBeenCalled();
        });
    });

    describe("execution", () => {
        it("returns the query's resolved value", async () => {
            query.execute.mockResolvedValueOnce({ custom: "payload" });

            const result = await executor.run(query as never, {}, CONTEXT);

            expect(result).toEqual({ custom: "payload" });
        });

        it("builds the query from a builder function", async () => {
            const result = await executor.run(
                () => query as never,
                {},
                CONTEXT,
            );

            expect(result).toBe("query-result");
        });
    });

    describe("error handling", () => {
        it("normalises a thrown error into HieroError with the service.method context", async () => {
            const original = new Error("query failed");
            query.execute.mockRejectedValueOnce(original);

            await expect(
                executor.run(query as never, {}, CONTEXT),
            ).rejects.toMatchObject({
                constructor: HieroError,
                context: CONTEXT,
                cause: original,
            });
        });

        it("normalises an error thrown while building the query", async () => {
            const invalidId = new Error("invalid format for entity ID");

            await expect(
                executor.run(
                    () => {
                        throw invalidId;
                    },
                    {},
                    CONTEXT,
                ),
            ).rejects.toMatchObject({
                constructor: HieroError,
                context: CONTEXT,
                cause: invalidId,
            });
        });

        it("normalises an invalid nodeAccountIds entry", async () => {
            await expect(
                executor.run(
                    query as never,
                    { nodeAccountIds: ["bad"] },
                    CONTEXT,
                ),
            ).rejects.toBeInstanceOf(HieroError);
            expect(query.execute).not.toHaveBeenCalled();
        });
    });

    describe("transaction listeners", () => {
        let ctx: HieroContext;
        const listener = {
            onBeforeTransaction: vi.fn(),
            onAfterTransaction: vi.fn(),
        };

        beforeEach(() => {
            ctx = new HieroContext({
                network: "testnet",
                operatorId: "0.0.2",
                operatorKeyType: "der",
                operatorKey:
                    "302e020100300506032b6570042204203b054ddd0c62d577ce0fbb0e92dcce0d5bea42a98a5c9663271939881ce19208",
            });
            ctx.addTransactionListener(listener);
        });

        afterEach(() => {
            ctx.close();
        });

        it("are not notified of a successful query", async () => {
            await new QueryExecutor(ctx).run(query as never, {}, CONTEXT);

            expect(listener.onBeforeTransaction).not.toHaveBeenCalled();
            expect(listener.onAfterTransaction).not.toHaveBeenCalled();
        });

        it("are not notified of a failed query", async () => {
            query.execute.mockRejectedValueOnce(new Error("query failed"));

            await new QueryExecutor(ctx)
                .run(query as never, {}, CONTEXT)
                .catch(() => undefined);

            expect(listener.onBeforeTransaction).not.toHaveBeenCalled();
            expect(listener.onAfterTransaction).not.toHaveBeenCalled();
        });
    });
});
