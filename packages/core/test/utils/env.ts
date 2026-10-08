import { FetchHttpTransport, HttpRequest } from "@hiero-ledger/sdk";
import { HieroContext } from "../../src/context/index.js";

/**
 * Mirror-node gRPC endpoint used by consensus-stream queries
 * (`TopicMessageQuery.subscribe`, mirror `ContractCallQuery`, …) in the
 * integration environment.
 */
export const MIRROR_GRPC_ADDRESS = "localhost:5600";

export const IntegrationTracker = {
    lastTransactionId: "" as string | undefined,
};

/**
 * Sleep for `ms` milliseconds. Used by mirror-node subscribe specs to
 * absorb the importer's ingest lag between consensus-node acceptance
 * and mirror-gRPC visibility (mirrors the SDK's own `src/util.js#wait`).
 */
export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The SDK sends a local mirror node's REST calls to port 5551; Solo serves
 * them at `HIERO_MIRROR_NODE_URL`, so send them there instead.
 */
function useMirrorRestUrl(ctx: HieroContext, mirrorRestUrl: string): void {
    const origin = new URL(mirrorRestUrl).origin;
    const fetchTransport = FetchHttpTransport.create();

    ctx.client.setMirrorNodeHttpConfig({
        ...ctx.client.getMirrorNodeHttpConfig(),
        transport: {
            roundTrip: (request, signal) => {
                const { pathname, search } = new URL(request.url);
                return fetchTransport.roundTrip(
                    new HttpRequest({
                        ...request,
                        url: origin + pathname + search,
                    }),
                    signal,
                );
            },
            close: (closeTimeout) => fetchTransport.close(closeTimeout),
        },
    });
}

export function setupIntegrationTestEnv(): HieroContext {
    const ctx = new HieroContext();

    // A custom network (e.g. Solo) has no built-in mirror node; balance
    // queries and topic subscriptions need one.
    if (ctx.config.networkNodes) {
        ctx.client.setMirrorNetwork([MIRROR_GRPC_ADDRESS]);

        const mirrorRestUrl = process.env.HIERO_MIRROR_NODE_URL;
        if (mirrorRestUrl) {
            useMirrorRestUrl(ctx, mirrorRestUrl);
        }
    }

    // Attach tracker to automatically hook the generated ID
    ctx.addTransactionListener({
        onAfterTransaction: (event) => {
            if (event.transactionId) {
                IntegrationTracker.lastTransactionId = event.transactionId;
            }
        },
    });

    return ctx;
}
