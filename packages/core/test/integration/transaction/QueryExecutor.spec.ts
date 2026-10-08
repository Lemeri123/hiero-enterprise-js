import { describe, it, expect, beforeAll, vi } from "vitest";
import {
    AccountInfoQuery,
    Hbar,
    NetworkVersionInfoQuery,
} from "@hiero-ledger/sdk";
import { setupIntegrationTestEnv } from "../../utils/env.js";
import {
    createTestAccount,
    type TestAccount,
} from "../../utils/integration-fixtures.js";
import { QueryExecutor } from "../../../src/services/transaction/index.js";
import { AccountService } from "../../../src/services/index.js";
import { HieroError } from "../../../src/errors/index.js";
import type { HieroContext } from "../../../src/context/index.js";

describe("QueryExecutor [Integration]", () => {
    let context: HieroContext;
    let executor: QueryExecutor;
    let accountService: AccountService;
    let funded: TestAccount;

    beforeAll(async () => {
        context = setupIntegrationTestEnv();
        executor = new QueryExecutor(context);
        accountService = new AccountService(context);
        // Pre-create one funded account for the "payerAccountId override"
        // test — needs enough balance to fund the payment transaction.
        funded = await createTestAccount(accountService, 5);
    });

    describe("run() — free queries", () => {
        it("executes NetworkVersionInfoQuery and returns the version payload", async () => {
            const result = await executor.run(
                new NetworkVersionInfoQuery(),
                {},
                "IntegrationTest.getNetworkVersionInfo",
            );

            expect(result.servicesVersion).toBeDefined();
            expect(typeof result.servicesVersion.major).toBe("number");
            expect(result.protobufVersion).toBeDefined();
        });

        it("does not report the query to transaction listeners", async () => {
            const before = vi.fn();
            const after = vi.fn();
            context.addTransactionListener({
                onBeforeTransaction: before,
                onAfterTransaction: after,
            });

            await executor.run(
                new NetworkVersionInfoQuery(),
                {},
                "IntegrationTest.getNetworkVersionInfo",
            );

            expect(before).not.toHaveBeenCalled();
            expect(after).not.toHaveBeenCalled();
        });
    });

    describe("run() — paid queries", () => {
        it("executes a paid AccountInfoQuery with default operator payer", async () => {
            const operatorId = context.operatorAccountId!.toString();

            const info = await executor.run(
                new AccountInfoQuery().setAccountId(operatorId),
                {},
                "IntegrationTest.getAccountInfo",
            );

            expect(info.accountId.toString()).toBe(operatorId);
        });

        it("honours a numeric maxQueryPayment cap (coerced to Hbar)", async () => {
            const info = await executor.run(
                new AccountInfoQuery().setAccountId(
                    context.operatorAccountId!.toString(),
                ),
                { maxQueryPayment: 2 },
                "IntegrationTest.getAccountInfo",
            );

            expect(info.accountId).toBeDefined();
        });

        it("honours an explicit Hbar queryPayment override", async () => {
            const info = await executor.run(
                new AccountInfoQuery().setAccountId(
                    context.operatorAccountId!.toString(),
                ),
                { queryPayment: new Hbar(1) },
                "IntegrationTest.getAccountInfo",
            );

            expect(info.accountId).toBeDefined();
        });

        it("routes the payment transaction through a custom payerAccountId", async () => {
            const info = await executor.run(
                new AccountInfoQuery().setAccountId(funded.accountId),
                { payerAccountId: funded.accountId },
                "IntegrationTest.getAccountInfo",
            );

            expect(info.accountId.toString()).toBe(funded.accountId);
        });
    });

    describe("run() — error handling", () => {
        it("normalises a failed query into HieroError without notifying transaction listeners", async () => {
            const after = vi.fn();
            context.addTransactionListener({ onAfterTransaction: after });

            // `AccountInfoQuery` fails fast on a nonexistent account with
            // `INVALID_ACCOUNT_ID` — unlike `TransactionReceiptQuery`, which
            // polls the network looking for a receipt and only surfaces an
            // error after exhausting its retry budget (longer than the test
            // timeout).
            const query = new AccountInfoQuery().setAccountId("0.0.99999999");

            await expect(
                executor.run(query, {}, "IntegrationTest.getAccountInfo"),
            ).rejects.toBeInstanceOf(HieroError);

            expect(after).not.toHaveBeenCalled();
        });
    });
});
