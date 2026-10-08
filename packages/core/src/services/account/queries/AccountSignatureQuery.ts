import type { AccountId, Transaction } from "@hiero-ledger/sdk";
import {
    AccountInfoQuery as SdkAccountInfoQuery,
    PublicKey,
} from "@hiero-ledger/sdk";
import type { IHieroContext } from "../../../context/index.js";
import { normalizeError } from "../../../errors/index.js";
import { QueryExecutor } from "../../transaction/index.js";
import type { QueryOptions } from "../../transaction/index.js";

/**
 * Verify signatures against the public key currently associated with an
 * account on the network.
 *
 * Fetches the account's key via `AccountInfoQuery` and delegates to the
 * SDK's `PublicKey.verify` / `PublicKey.verifyTransaction`. Accounts whose
 * key is not a single `PublicKey` (e.g. `KeyList` for multi-sig, or
 * `ContractId` for contract-controlled accounts) cannot be satisfied by a
 * single signature, so both verify methods return `false` for them.
 */
export class AccountSignatureQuery {
    private readonly executor: QueryExecutor;

    constructor(context: IHieroContext) {
        this.executor = new QueryExecutor(context);
    }

    /**
     * Verify that `signature` over `message` was produced by the key of
     * the given account.
     *
     * Returns `false` when the account's key is not a single `PublicKey`
     * (e.g. multi-sig `KeyList` or contract-controlled `ContractId`).
     */
    async verifySignature(
        accountId: string | AccountId,
        message: Uint8Array,
        signature: Uint8Array,
        options: QueryOptions = {},
    ): Promise<boolean> {
        try {
            const key = await this.fetchSinglePublicKey(
                accountId,
                options,
                "verifyAccountSignature",
            );
            if (key === null) return false;
            return key.verify(message, signature);
        } catch (error) {
            throw normalizeError(
                error,
                "AccountService.verifyAccountSignature",
            );
        }
    }

    /**
     * Verify that `transaction` was signed by the key of the given account.
     *
     * Returns `false` when the account's key is not a single `PublicKey`
     * (e.g. multi-sig `KeyList` or contract-controlled `ContractId`).
     */
    async verifyTransaction(
        accountId: string | AccountId,
        transaction: Transaction,
        options: QueryOptions = {},
    ): Promise<boolean> {
        try {
            const key = await this.fetchSinglePublicKey(
                accountId,
                options,
                "verifyAccountTransaction",
            );
            if (key === null) return false;
            return key.verifyTransaction(transaction);
        } catch (error) {
            throw normalizeError(
                error,
                "AccountService.verifyAccountTransaction",
            );
        }
    }

    /**
     * Fetch the account's key. Returns the `PublicKey` for single-sig
     * accounts, or `null` for any other `Key` subtype (`KeyList`,
     * `ContractId`, `EvmAddress`, …).
     */
    private async fetchSinglePublicKey(
        accountId: string | AccountId,
        options: QueryOptions,
        methodName: string,
    ): Promise<PublicKey | null> {
        const info = await this.executor.run(
            () => new SdkAccountInfoQuery().setAccountId(accountId),
            options,
            `AccountService.${methodName}`,
        );

        if (!(info.key instanceof PublicKey)) {
            return null;
        }
        return info.key;
    }
}
