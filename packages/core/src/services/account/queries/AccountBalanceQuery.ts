import type { AccountId } from "@hiero-ledger/sdk";
import { AccountBalanceQuery as SdkAccountBalanceQuery } from "@hiero-ledger/sdk";
import type { Balance } from "../../../types/index.js";
import type { IHieroContext } from "../../../context/index.js";
import { QueryExecutor } from "../../transaction/index.js";
import type { QueryOptions } from "../../transaction/index.js";

export class AccountBalanceQuery {
    private readonly executor: QueryExecutor;

    constructor(context: IHieroContext) {
        this.executor = new QueryExecutor(context);
    }

    /** Get account balance execute handler. */
    async execute(
        accountId: string | AccountId,
        options: QueryOptions = {},
    ): Promise<Balance> {
        return await this.executor.run(
            () => new SdkAccountBalanceQuery().setAccountId(accountId),
            options,
            "AccountService.getAccountBalance",
            (balance) => {
                const tokens = [];
                if (balance.tokens) {
                    for (const [tokenId, amount] of balance.tokens) {
                        tokens.push({
                            tokenId: tokenId.toString(),
                            balance: amount.toString(),
                            decimals: balance.tokenDecimals?.get(tokenId) ?? 0,
                        });
                    }
                }

                return {
                    accountId: accountId.toString(),
                    tinybars: balance.hbars.toTinybars().toString(),
                    tokens,
                };
            },
        );
    }
}
