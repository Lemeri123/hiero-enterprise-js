import type { Query } from "@hiero-ledger/sdk";
import { AccountId, Hbar, TransactionId } from "@hiero-ledger/sdk";
import type { IHieroContext } from "../../context/index.js";
import { normalizeError } from "../../errors/index.js";
import type { QueryOptions } from "./QueryOptions.js";

/**
 * Runs SDK consensus-node queries: applies the base options (payer,
 * payment cap, node targeting), executes the query and normalises any
 * error into a `HieroError`.
 *
 * Queries are not transactions, so they are not reported to transaction
 * listeners.
 */
export class QueryExecutor {
    constructor(private readonly context: IHieroContext) {}

    /**
     * Build and execute a query, optionally mapping its result.
     *
     * @param build - The query, or a function that builds it. Pass a
     *   function so invalid input (e.g. a malformed ID) is reported as a
     *   `HieroError` like any other failure.
     * @param options - Base query options (payer, payment caps, node targeting).
     * @param errorContext - `Service.method` recorded on a thrown `HieroError`.
     * @param map - Converts the SDK result; its errors are normalised too.
     * @returns The query result, or the mapped result when `map` is given.
     */
    async run<TResult>(
        build: Query<TResult> | (() => Query<TResult>),
        options: QueryOptions,
        errorContext: string,
    ): Promise<TResult>;
    async run<TResult, TMapped>(
        build: Query<TResult> | (() => Query<TResult>),
        options: QueryOptions,
        errorContext: string,
        map: (result: TResult) => TMapped,
    ): Promise<TMapped>;
    async run<TResult, TMapped>(
        build: Query<TResult> | (() => Query<TResult>),
        options: QueryOptions,
        errorContext: string,
        map?: (result: TResult) => TMapped,
    ): Promise<TResult | TMapped> {
        try {
            const query = typeof build === "function" ? build() : build;
            this.applyBaseOptions(query, options);
            const result = await query.execute(this.context.client);
            return map ? map(result) : result;
        } catch (error) {
            throw normalizeError(error, errorContext);
        }
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
