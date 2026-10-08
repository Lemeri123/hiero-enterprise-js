/** Code attached to this package's deprecation warning. */
export const DEPRECATION_CODE = "HIERO_ENTERPRISE_NEST_DEPRECATED";

/** Where to read about replacing this package. */
export const MIGRATION_GUIDE_URL =
    "https://github.com/hiero-hackers/hiero-enterprise-js#migrating-from-the-framework-adapters";

let warned = false;

/**
 * Emit a one-time Node.js `DeprecationWarning` for this package.
 * Silenced like any other deprecation, e.g. with `--no-deprecation`.
 */
export function warnDeprecated(): void {
    if (warned) return;
    warned = true;
    process.emitWarning(
        "@hiero-hackers/enterprise-nest is deprecated and will be removed in a future release. " +
            "Use @hiero-hackers/enterprise-core and @hiero-hackers/enterprise-mirror directly instead. " +
            `See ${MIGRATION_GUIDE_URL}`,
        { type: "DeprecationWarning", code: DEPRECATION_CODE },
    );
}
