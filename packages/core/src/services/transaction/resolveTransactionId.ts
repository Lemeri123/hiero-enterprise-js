import { TransactionId } from "@hiero-ledger/sdk";
import { validationError } from "../../errors/index.js";
import type { TransactionOptions } from "./TransactionOptions.js";

const CONTEXT = "TransactionExecutor";

/**
 * Resolve `TransactionOptions.transactionId` into the SDK `TransactionId`
 * to set on the transaction: a full ID as-is, a bare account ID as that
 * payer with a generated valid start.
 *
 * @returns The transaction ID, or `undefined` when none is set
 * @throws {HieroError} `INPUT_INVALID` if the ID is malformed, carries a
 *   `scheduled` flag or a nonce, or comes with `regenerateTransactionId: true`
 */
export function resolveTransactionId(
    options: TransactionOptions,
): TransactionId | undefined {
    const value = options.transactionId;
    if (value == null) {
        return undefined;
    }

    // A set ID is locked, so the SDK would silently never regenerate it.
    if (options.regenerateTransactionId === true) {
        throw validationError(
            CONTEXT,
            "regenerateTransactionId cannot be true together with transactionId: a set transaction ID is never regenerated.",
        );
    }

    const transactionId =
        typeof value === "string" ? parseTransactionId(value) : value;

    if (
        !(transactionId instanceof TransactionId) ||
        transactionId.accountId == null ||
        transactionId.validStart == null
    ) {
        throw validationError(
            CONTEXT,
            "transactionId must have an account ID and a valid start.",
        );
    }

    if (transactionId.scheduled || transactionId.nonce != null) {
        throw validationError(
            CONTEXT,
            "transactionId cannot carry a scheduled flag or a nonce.",
        );
    }

    if (
        transactionId.accountId.aliasKey != null ||
        transactionId.accountId.evmAddress != null
    ) {
        throw validationError(
            CONTEXT,
            "transactionId must name its payer as a shard.realm.num account ID.",
        );
    }

    return transactionId;
}

/** Parse a full transaction ID, or an account ID as the payer. */
function parseTransactionId(value: string): TransactionId {
    try {
        if (value.includes("@")) {
            return TransactionId.fromString(value);
        }
        // Generate from the string: from an AccountId, the SDK copies only
        // shard.realm.num and drops an EVM address, hiding it from the check.
        return TransactionId.generate(value);
    } catch {
        throw validationError(
            CONTEXT,
            `transactionId "${value}" is not a transaction ID (e.g. 0.0.5@1700000000.000000123) or an account ID (e.g. 0.0.5).`,
        );
    }
}
