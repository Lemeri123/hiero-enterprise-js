import type { AccountId, TokenId } from "@hiero-ledger/sdk";
import {
    MirrorNodeAccountBalanceQuery,
    MirrorNodeTokenBalanceQuery,
} from "@hiero-ledger/sdk";
import type { Balance, TokenBalance } from "../../../types/index.js";
import type { IHieroContext } from "../../../context/index.js";
import { normalizeError } from "../../../errors/index.js";

/**
 * Reads account balances from the mirror node. The client needs a mirror
 * network: built in for mainnet, testnet and previewnet, set with
 * `context.client.setMirrorNetwork([...])` for a custom network.
 */
export class AccountBalanceQuery {
    constructor(private readonly context: IHieroContext) {}

    /** Get the HBAR balance of an account. */
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

    /** Get an account's balance of one token. */
    async executeTokenBalance(
        accountId: string | AccountId,
        tokenId: string | TokenId,
    ): Promise<TokenBalance> {
        try {
            const balance = await new MirrorNodeTokenBalanceQuery()
                .setAccountId(accountId)
                .setTokenId(tokenId)
                .execute(this.context.client);

            return {
                tokenId: balance.tokenId.toString(),
                balance: balance.balance.toString(),
                decimals: balance.decimals,
            };
        } catch (error) {
            throw normalizeError(error, "AccountService.getTokenBalance");
        }
    }
}
