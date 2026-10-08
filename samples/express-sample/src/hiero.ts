import {
    HieroContext,
    HieroError,
    HieroErrorCodes,
    AccountService,
    TopicService,
} from "@hiero-hackers/enterprise-core";
import {
    MirrorError,
    MirrorErrorCodes,
    createMirrorNodeClient,
    createMirrorRepositories,
} from "@hiero-hackers/enterprise-mirror";

// ─── Wiring ───────────────────────────────────────────────────
// Build the Hiero services once at startup and share them across
// requests. Both sides read config from the HIERO_* environment
// variables when called without arguments.

export function createHiero() {
    const context = new HieroContext();
    const mirror = createMirrorRepositories(createMirrorNodeClient());

    return {
        // Write side (consensus network, needs operator credentials)
        accountService: new AccountService(context),
        topicService: new TopicService(context),
        // Read side (mirror node REST, no credentials)
        ...mirror,
        /** Release the SDK client's gRPC connections. */
        close: () => context.close(),
    };
}

export type Hiero = ReturnType<typeof createHiero>;

// ─── Error mapping ────────────────────────────────────────────
// Turn library errors into HTTP responses. Returns undefined for any
// other error so the framework's own handling (e.g. a 400 for a
// malformed JSON body) still applies.

export interface HttpError {
    status: number;
    body: { code: string; message: string };
}

export function toHttpError(error: unknown): HttpError | undefined {
    if (error instanceof MirrorError || error instanceof HieroError) {
        const status = statusFor(error);
        // 5xx messages can carry upstream URLs or SDK details; log, don't return them.
        const message =
            status >= 500 ? "Upstream request failed" : error.message;
        return { status, body: { code: error.code, message } };
    }
    return undefined;
}

function statusFor(error: HieroError | MirrorError): number {
    // The mirror node rejected the request itself, e.g. a malformed ID.
    if (error instanceof MirrorError && error.status === 400) return 400;
    switch (error.code) {
        case MirrorErrorCodes.NotFound:
        case HieroErrorCodes.NotFound:
            return 404;
        case MirrorErrorCodes.ConfigInvalid:
        case HieroErrorCodes.ConfigInvalid:
            return 400;
        case MirrorErrorCodes.TimedOut:
        case HieroErrorCodes.TimedOut:
            return 504;
        case MirrorErrorCodes.MirrorNodeError:
        case MirrorErrorCodes.MirrorNodeHttpError:
        case MirrorErrorCodes.MirrorNodeSchemaMismatch:
        case MirrorErrorCodes.MalformedResponse:
            return 502;
        default:
            return 500;
    }
}
