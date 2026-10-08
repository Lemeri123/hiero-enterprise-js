// Core and mirror classes re-exported for existing imports. Declared as
// aliases (not `export { … } from`) so the deprecation survives d.ts bundling.
import * as core from "@hiero-hackers/enterprise-core";
import * as mirror from "@hiero-hackers/enterprise-mirror";

/* eslint-disable @typescript-eslint/no-redeclare -- each name is a value and a type on purpose */

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const AccountService = core.AccountService;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type AccountService = core.AccountService;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const ScheduleService = core.ScheduleService;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type ScheduleService = core.ScheduleService;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const FileService = core.FileService;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type FileService = core.FileService;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const TokenService = core.TokenService;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type TokenService = core.TokenService;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const ContractService = core.ContractService;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type ContractService = core.ContractService;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const TopicService = core.TopicService;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type TopicService = core.TopicService;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const AccountType = core.AccountType;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type AccountType = core.AccountType;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export const OperatorKeyType = core.OperatorKeyType;
/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type OperatorKeyType = core.OperatorKeyType;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const MirrorNodeClient = mirror.MirrorNodeClient;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type MirrorNodeClient = mirror.MirrorNodeClient;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const AccountRepository = mirror.AccountRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type AccountRepository = mirror.AccountRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const NftRepository = mirror.NftRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type NftRepository = mirror.NftRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const TokenRepository = mirror.TokenRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type TokenRepository = mirror.TokenRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const TopicRepository = mirror.TopicRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type TopicRepository = mirror.TopicRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const TransactionRepository = mirror.TransactionRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type TransactionRepository = mirror.TransactionRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const NetworkRepository = mirror.NetworkRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type NetworkRepository = mirror.NetworkRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const ScheduleRepository = mirror.ScheduleRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type ScheduleRepository = mirror.ScheduleRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const BlockRepository = mirror.BlockRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type BlockRepository = mirror.BlockRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export const ContractRepository = mirror.ContractRepository;
/** @deprecated Import from `@hiero-hackers/enterprise-mirror` instead. */
export type ContractRepository = mirror.ContractRepository;

/** @deprecated Import from `@hiero-hackers/enterprise-core` instead. */
export type HieroConfig = core.HieroConfig;
