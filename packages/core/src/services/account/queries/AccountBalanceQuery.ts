import type { AccountId } from "@hiero-ledger/sdk";
import { MirrorNodeAccountBalanceQuery } from "@hiero-ledger/sdk";
import type { Balance } from "../../../types/index.js";
import type { IHieroContext } from "../../../context/index.js";
import { normalizeError } from "../../../errors/index.js";

/**
 * Reads an account's HBAR balance from the mirror node. Custom networks
 * need `mirrorNetwork` and `mirrorNodeUrl` set in the config.
 */
export class AccountBalanceQuery {
    constructor(private readonly context: IHieroContext) {}

    /** Get account balance execute handler. */
    async execute(accountId: string | AccountId): Promise<Balance> {
        try {
            const balance = await new MirrorNodeAccountBalanceQuery()
                .setAccountId(accountId)
                .execute(this.context.client);

            return {
                accountId: accountId.toString(),
                tinybars: balance.hbars.toTinybars().toString(),
            };
        } catch (error) {
            throw normalizeError(error, "AccountService.getAccountBalance");
        }
    }
}
