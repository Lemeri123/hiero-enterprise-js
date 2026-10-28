import { TransactionId } from "@hiero-ledger/sdk";
import { validationError } from "../../errors/index.js";
import type { TransactionOptions } from "./TransactionOptions.js";

const CONTEXT = "TransactionExecutor";

/**
 * `<shard>.<realm>.<num>@<seconds>.<nanos>`, with nanos zero-padded to 9
 * digits as `TransactionId.toString()` prints them. The optional
 * `?scheduled` and `/<nonce>` suffixes pass, so they get their own error.
 */
const FULL_ID_PATTERN = /^\d+\.\d+\.\d+@\d+\.\d{9}(|\?scheduled)(|\/\d+)$/;

/**
 * Resolve `TransactionOptions.transactionId` into the SDK `TransactionId`
 * to set on the transaction: a full ID as-is, a bare account ID as that
 * payer with a generated valid start.
 *
 * @returns The transaction ID, or `undefined` when none is set
 * @throws {HieroError} `INPUT_INVALID` if the ID is malformed (a full ID
 *   string must be `<shard>.<realm>.<num>@<seconds>.<nanos>` with 9-digit
 *   nanos), carries a `scheduled` flag or a nonce, names an EVM-address
 *   payer, or comes with `regenerateTransactionId: true`
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
        // Check the shape first: fromString reads "0.0.5@abc.def" as valid
        // start 0 and "0.0.5@1700000000.5" as 5 ns.
        if (FULL_ID_PATTERN.test(value)) {
            return TransactionId.fromString(value);
        }

        if (!value.includes("@")) {
            // Generate from the string: from an AccountId, the SDK copies only
            // shard.realm.num and drops an EVM address, hiding it from the check.
            return TransactionId.generate(value);
        }
    } catch {
        // Fall through to the error below.
    }

    throw validationError(
        CONTEXT,
        `transactionId "${value}" is not a transaction ID (e.g. 0.0.5@1700000000.000000123, with 9-digit nanos) or an account ID (e.g. 0.0.5).`,
    );
}
