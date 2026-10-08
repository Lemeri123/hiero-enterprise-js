import type { HieroConfig } from "@hiero-hackers/enterprise-core";
import {
    HieroContext,
    AccountService,
    ScheduleService,
    FileService,
    TokenService,
    ContractService,
    TopicService,
} from "@hiero-hackers/enterprise-core";
import type {
    MirrorConfig,
    MirrorNodeClient,
    MirrorRepositories,
} from "@hiero-hackers/enterprise-mirror";
import {
    createMirrorNodeClient,
    createMirrorRepositories,
} from "@hiero-hackers/enterprise-mirror";
import { warnDeprecated } from "./deprecation.js";

/**
 * @deprecated The framework adapters are deprecated. Compose
 * `HieroConfig` from `@hiero-hackers/enterprise-core` and `MirrorConfig`
 * from `@hiero-hackers/enterprise-mirror` directly.
 *
 * Combined configuration for a full Hiero integration: the SDK/consensus
 * side (`HieroConfig`) plus the mirror node REST side (`MirrorConfig`).
 * The shape is flat, matching the pre-split config exactly.
 */
export type HieroAdapterConfig = HieroConfig & MirrorConfig;

/**
 * @deprecated The framework adapters are deprecated. Create the services
 * you need from `@hiero-hackers/enterprise-core` and
 * `@hiero-hackers/enterprise-mirror` directly.
 *
 * All services made available through the framework integration —
 * write-side services from `@hiero-hackers/enterprise-core`, plus every read-side
 * repository from `@hiero-hackers/enterprise-mirror` (one property per
 * {@link MirrorRepositories} entry, so new repositories appear here
 * without adapter changes).
 */
export interface HieroServices extends MirrorRepositories {
    context: HieroContext;
    accountService: AccountService;
    scheduleService: ScheduleService;
    fileService: FileService;
    tokenService: TokenService;
    contractService: ContractService;
    topicService: TopicService;
}

/**
 * @deprecated The framework adapters are deprecated. Create the services
 * you need from `@hiero-hackers/enterprise-core` and
 * `@hiero-hackers/enterprise-mirror` directly.
 */
export interface HieroRuntime extends HieroServices {
    mirrorNodeClient: MirrorNodeClient;
    close(): void;
}

/**
 * Compose the full Hiero runtime graph from core + mirror. Config falls
 * back to environment variables when omitted.
 *
 * @deprecated The framework adapters are deprecated. Create a
 * `HieroContext` and mirror repositories directly — see the migration
 * guide in the repository README.
 */
export function createHieroRuntime(config?: HieroAdapterConfig): HieroRuntime {
    warnDeprecated();
    const context = new HieroContext(config);
    // When config is omitted, the mirror side resolves from the same
    // HIERO_* environment variables the context used.
    const mirrorNodeClient = createMirrorNodeClient(config);

    return {
        context,
        mirrorNodeClient,
        accountService: new AccountService(context),
        scheduleService: new ScheduleService(context),
        fileService: new FileService(context),
        tokenService: new TokenService(context),
        contractService: new ContractService(context),
        topicService: new TopicService(context),
        ...createMirrorRepositories(mirrorNodeClient),
        close: () => context.close(),
    };
}
