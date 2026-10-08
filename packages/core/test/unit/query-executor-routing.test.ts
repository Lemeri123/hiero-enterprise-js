import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Query, type Transaction } from "@hiero-ledger/sdk";
import { HieroContext } from "../../src/context/index.js";
import { HieroError } from "../../src/errors/index.js";
import { OperatorKeyType } from "../../src/types/index.js";
import {
    AccountService,
    ContractService,
    FileService,
    ScheduleService,
    TokenService,
    TopicService,
} from "../../src/services/index.js";
import type { QueryOptions } from "../../src/services/index.js";

// Every service query must go through QueryExecutor: QueryOptions and
// error normalisation, and no transaction listener events (queries are not
// transactions). Real SDK queries are built; only Query.execute (the
// network call) is stubbed.

const OPTIONS: QueryOptions = { nodeAccountIds: ["0.0.3"] };

type Call = (ctx: HieroContext) => Promise<unknown>;

const cases: Array<[query: string, service: string, method: string, Call]> = [
    [
        "AccountBalanceQuery",
        "AccountService",
        "getAccountBalance",
        (ctx) => new AccountService(ctx).getAccountBalance("0.0.98", OPTIONS),
    ],
    [
        "AccountBalanceQuery",
        "AccountService",
        "getAccountBalance",
        (ctx) => new AccountService(ctx).getOperatorAccountBalance(OPTIONS),
    ],
    [
        "AccountInfoQuery",
        "AccountService",
        "verifyAccountSignature",
        (ctx) =>
            new AccountService(ctx).verifyAccountSignature(
                "0.0.98",
                new Uint8Array([1]),
                new Uint8Array([2]),
                OPTIONS,
            ),
    ],
    [
        "AccountInfoQuery",
        "AccountService",
        "verifyAccountTransaction",
        (ctx) =>
            new AccountService(ctx).verifyAccountTransaction(
                "0.0.98",
                {} as Transaction,
                OPTIONS,
            ),
    ],
    [
        "ContractCallQuery",
        "ContractService",
        "callContract",
        (ctx) =>
            new ContractService(ctx).callContract({
                contractId: "0.0.5",
                gas: 100_000,
                functionName: "get",
                ...OPTIONS,
            }),
    ],
    [
        "ContractInfoQuery",
        "ContractService",
        "getContractInfo",
        (ctx) => new ContractService(ctx).getContractInfo("0.0.5", OPTIONS),
    ],
    [
        "ContractByteCodeQuery",
        "ContractService",
        "getContractBytecode",
        (ctx) => new ContractService(ctx).getContractBytecode("0.0.5", OPTIONS),
    ],
    [
        "FileContentsQuery",
        "FileService",
        "getFileContents",
        (ctx) => new FileService(ctx).getFileContents("0.0.150", OPTIONS),
    ],
    [
        "FileInfoQuery",
        "FileService",
        "getFileInfo",
        (ctx) => new FileService(ctx).getFileInfo("0.0.150", OPTIONS),
    ],
    [
        "ScheduleInfoQuery",
        "ScheduleService",
        "getInfo",
        (ctx) => new ScheduleService(ctx).getInfo("0.0.7", OPTIONS),
    ],
    [
        "TokenInfoQuery",
        "TokenService",
        "getTokenInfo",
        (ctx) => new TokenService(ctx).getTokenInfo("0.0.6", OPTIONS),
    ],
    [
        "TokenNftInfoQuery",
        "TokenService",
        "getNftInfo",
        (ctx) => new TokenService(ctx).getNftInfo("0.0.6/1", OPTIONS),
    ],
    [
        "TopicInfoQuery",
        "TopicService",
        "getTopicInfo",
        (ctx) => new TopicService(ctx).getTopicInfo("0.0.8", OPTIONS),
    ],
];

describe("query routing through QueryExecutor", () => {
    let ctx: HieroContext;
    let execute: ReturnType<typeof vi.spyOn>;
    const sent = () => execute.mock.contexts[0] as Query<unknown> | undefined;
    const listener = {
        onBeforeTransaction: vi.fn(),
        onAfterTransaction: vi.fn(),
    };

    beforeEach(() => {
        ctx = new HieroContext({
            network: "testnet",
            operatorId: "0.0.2",
            operatorKey:
                "302e020100300506032b6570042204203b054ddd0c62d577ce0fbb0e92dcce0d5bea42a98a5c9663271939881ce19208",
            operatorKeyType: OperatorKeyType.DER,
        });
        ctx.addTransactionListener(listener);
        execute = vi
            .spyOn(Query.prototype, "execute")
            .mockRejectedValue(new Error("node unavailable"));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        listener.onBeforeTransaction.mockClear();
        listener.onAfterTransaction.mockClear();
        ctx.close();
    });

    it("reports an invalid ID as a HieroError without reaching the network", async () => {
        const error = await new AccountService(ctx)
            .getAccountBalance("not-an-id")
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(HieroError);
        expect(error).toMatchObject({
            context: "AccountService.getAccountBalance",
        });
        expect(execute).not.toHaveBeenCalled();
    });

    it("reports an invalid nodeAccountIds entry as a HieroError", async () => {
        const error = await new AccountService(ctx)
            .getAccountBalance("0.0.98", { nodeAccountIds: ["bad"] })
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(HieroError);
        expect(execute).not.toHaveBeenCalled();
    });

    it.each(cases)(
        "%s via %s.%s",
        async (_query, serviceName, methodName, call) => {
            const error = await call(ctx).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(HieroError);
            expect(error).toMatchObject({
                context: `${serviceName}.${methodName}`,
            });
            expect(sent()?.nodeAccountIds?.map(String)).toEqual(["0.0.3"]);
            expect(listener.onBeforeTransaction).not.toHaveBeenCalled();
            expect(listener.onAfterTransaction).not.toHaveBeenCalled();
        },
    );
});
