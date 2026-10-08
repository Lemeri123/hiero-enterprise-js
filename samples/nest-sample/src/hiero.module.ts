import {
    Catch,
    Global,
    Module,
    type ArgumentsHost,
    type ExceptionFilter,
    type OnApplicationShutdown,
} from "@nestjs/common";
// HttpAdapterHost is resolved by Nest DI through decorator metadata, so it
// must stay a value import.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { APP_FILTER, HttpAdapterHost } from "@nestjs/core";
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
    MirrorNodeClient,
    createMirrorNodeClient,
    AccountRepository,
    NftRepository,
    TokenRepository,
    TopicRepository,
    NetworkRepository,
} from "@hiero-hackers/enterprise-mirror";

// ─── Providers ────────────────────────────────────────────────
// One HieroContext and one MirrorNodeClient for the whole app; every
// service and repository is built from them. Both read config from the
// HIERO_* environment variables when called without arguments.

const services = [AccountService, TopicService].map((Service) => ({
    provide: Service,
    useFactory: (context: HieroContext) => new Service(context),
    inject: [HieroContext],
}));

const repositories = [
    AccountRepository,
    NftRepository,
    TokenRepository,
    TopicRepository,
    NetworkRepository,
].map((Repository) => ({
    provide: Repository,
    useFactory: (client: MirrorNodeClient) => new Repository(client),
    inject: [MirrorNodeClient],
}));

// ─── Error mapping ────────────────────────────────────────────
// Turn library errors into HTTP responses. Other errors keep Nest's
// default handling.

@Catch(HieroError, MirrorError)
class HieroExceptionFilter implements ExceptionFilter {
    constructor(private readonly adapterHost: HttpAdapterHost) {}

    catch(error: HieroError | MirrorError, host: ArgumentsHost) {
        const status = statusFor(error);
        if (status >= 500) console.error(error);
        this.adapterHost.httpAdapter.reply(
            host.switchToHttp().getResponse(),
            { code: error.code, message: error.message },
            status,
        );
    }
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

// ─── Module ───────────────────────────────────────────────────

@Global()
@Module({
    providers: [
        { provide: HieroContext, useFactory: () => new HieroContext() },
        {
            provide: MirrorNodeClient,
            useFactory: () => createMirrorNodeClient(),
        },
        ...services,
        ...repositories,
        { provide: APP_FILTER, useClass: HieroExceptionFilter },
    ],
    exports: [
        HieroContext,
        MirrorNodeClient,
        ...services.map((s) => s.provide),
        ...repositories.map((r) => r.provide),
    ],
})
export class HieroModule implements OnApplicationShutdown {
    constructor(private readonly context: HieroContext) {}

    /** Release the SDK client's gRPC connections. */
    onApplicationShutdown() {
        this.context.close();
    }
}
