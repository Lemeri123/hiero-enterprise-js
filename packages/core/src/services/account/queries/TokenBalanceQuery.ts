import type { AccountId, TokenId } from "@hiero-ledger/sdk";
import { MirrorNodeTokenBalanceQuery } from "@hiero-ledger/sdk";
import type { TokenBalance } from "../../../types/index.js";
import type { IHieroContext } from "../../../context/index.js";
import { normalizeError } from "../../../errors/index.js";

/**
 * Reads an account's balance of one token from the mirror node. Needs a
 * mirror network on the client, like `AccountBalanceQuery`.
 */
export class TokenBalanceQuery {
    constructor(private readonly context: IHieroContext) {}

    /** Get token balance execute handler. */
    async execute(
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
