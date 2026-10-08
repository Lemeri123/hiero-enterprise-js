import type { Query } from "@hiero-ledger/sdk";
import { AccountId, Hbar, TransactionId } from "@hiero-ledger/sdk";
import type { IHieroContext } from "../../context/index.js";
import type { QueryOptions } from "./QueryOptions.js";

/**
 * Runs SDK consensus-node queries: applies the base options (payer,
 * payment cap, node targeting) and executes the query. Callers normalise
 * errors with their own `Service.method` context.
 *
 * Queries are not transactions, so they are not reported to transaction
 * listeners.
 */
export class QueryExecutor {
    constructor(private readonly context: IHieroContext) {}

    /**
     * Execute a built query with the given options.
     *
     * @param query - The built (but not yet executed) query.
     * @param options - Base query options (payer, payment caps, node targeting).
     * @returns The query result, typed by the query's response type.
     */
    async run<TResult>(
        query: Query<TResult>,
        options: QueryOptions,
    ): Promise<TResult> {
        this.applyBaseOptions(query, options);
        return await query.execute(this.context.client);
    }

    /**
     * Apply the base `QueryOptions` fields to the SDK query before execution.
     */
    private applyBaseOptions(
        query: Query<unknown>,
        options: QueryOptions,
    ): void {
        if (options.payerAccountId != null) {
            const payerId =
                typeof options.payerAccountId === "string"
                    ? AccountId.fromString(options.payerAccountId)
                    : options.payerAccountId;
            // The SDK pays for a query via a payment transaction whose payer
            // is encoded in the transaction ID — overriding it here makes the
            // chosen account fund the read.
            query.setPaymentTransactionId(TransactionId.generate(payerId));
        }

        if (options.maxQueryPayment != null) {
            query.setMaxQueryPayment(toHbar(options.maxQueryPayment));
        }

        if (options.queryPayment != null) {
            query.setQueryPayment(toHbar(options.queryPayment));
        }

        if (options.nodeAccountIds?.length) {
            query.setNodeAccountIds(
                options.nodeAccountIds.map((id) => AccountId.fromString(id)),
            );
        }
    }
}

/**
 * Coerce a number (HBAR units) into an `Hbar` instance. The SDK's
 * `Query.setMaxQueryPayment` / `setQueryPayment` only accept `Hbar`,
 * unlike `Transaction.setMaxTransactionFee` which accepts both.
 */
function toHbar(amount: number | Hbar): Hbar {
    return typeof amount === "number" ? new Hbar(amount) : amount;
}
