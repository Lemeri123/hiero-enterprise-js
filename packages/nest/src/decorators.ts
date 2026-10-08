import { Inject } from "@nestjs/common";
import { HIERO_CONFIG, HIERO_CONTEXT } from "./index.js";

/**
 * Inject the HieroContext instance.
 *
 * @deprecated `@hiero-hackers/enterprise-nest` is deprecated and will be
 * removed in a future release. Use `@hiero-hackers/enterprise-core` and
 * `@hiero-hackers/enterprise-mirror` directly — see the migration guide
 * in the repository README.
 */
export const InjectHieroContext = () => Inject(HIERO_CONTEXT);

/**
 * Inject the HieroConfig.
 *
 * @deprecated `@hiero-hackers/enterprise-nest` is deprecated and will be
 * removed in a future release. Use `@hiero-hackers/enterprise-core` and
 * `@hiero-hackers/enterprise-mirror` directly — see the migration guide
 * in the repository README.
 */
export const InjectHieroConfig = () => Inject(HIERO_CONFIG);
