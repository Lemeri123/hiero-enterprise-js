import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    Hbar,
    Long,
    MirrorNodeAccountBalance,
    MirrorNodeAccountBalanceQuery,
    MirrorNodeTokenBalance,
    MirrorNodeTokenBalanceQuery,
    TokenId,
} from "@hiero-ledger/sdk";
import { AccountService } from "../../../../../src/services/account/index.js";
import { HieroError } from "../../../../../src/errors/index.js";
import { createMockContext } from "../../../../utils/mock-context.js";

// Real SDK queries; only execute (the mirror node REST call) is stubbed.

describe("AccountBalanceQuery (via AccountService)", () => {
    let service: AccountService;

    beforeEach(() => {
        service = new AccountService(createMockContext());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("HBAR balance", () => {
        let execute: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            execute = vi
                .spyOn(MirrorNodeAccountBalanceQuery.prototype, "execute")
                .mockResolvedValue(
                    new MirrorNodeAccountBalance({
                        hbars: Hbar.fromTinybars(1_000_000),
                    }),
                );
        });

        it("returns the account's HBAR balance in tinybars", async () => {
            const balance = await service.getAccountBalance("0.0.999");

            expect(balance).toEqual({
                accountId: "0.0.999",
                tinybars: "1000000",
            });
            const query = execute.mock
                .contexts[0] as MirrorNodeAccountBalanceQuery;
            expect(query.accountId?.toString()).toBe("0.0.999");
        });

        it("returns the operator account's balance", async () => {
            const balance = await service.getOperatorAccountBalance();

            expect(balance.accountId).toBe("0.0.2");
            expect(balance.tinybars).toBe("1000000");
        });

        it("reports a mirror node failure as a HieroError", async () => {
            execute.mockRejectedValueOnce(new Error("HTTP 503: unavailable"));

            await expect(
                service.getAccountBalance("0.0.999"),
            ).rejects.toMatchObject({
                constructor: HieroError,
                context: "AccountService.getAccountBalance",
            });
        });
    });

    describe("token balance", () => {
        let execute: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            execute = vi
                .spyOn(MirrorNodeTokenBalanceQuery.prototype, "execute")
                .mockResolvedValue(
                    new MirrorNodeTokenBalance({
                        tokenId: TokenId.fromString("0.0.500"),
                        balance: Long.fromString("9007199254740993"),
                        decimals: 2,
                    }),
                );
        });

        it("returns the account's balance of the token", async () => {
            const balance = await service.getTokenBalance("0.0.999", "0.0.500");

            expect(balance).toEqual({
                tokenId: "0.0.500",
                balance: "9007199254740993",
                decimals: 2,
            });
            const query = execute.mock
                .contexts[0] as MirrorNodeTokenBalanceQuery;
            expect(query.accountId?.toString()).toBe("0.0.999");
            expect(query.tokenId?.toString()).toBe("0.0.500");
        });

        it("reports a mirror node failure as a HieroError", async () => {
            execute.mockRejectedValueOnce(new Error("HTTP 503: unavailable"));

            await expect(
                service.getTokenBalance("0.0.999", "0.0.500"),
            ).rejects.toMatchObject({
                constructor: HieroError,
                context: "AccountService.getTokenBalance",
            });
        });
    });
});
