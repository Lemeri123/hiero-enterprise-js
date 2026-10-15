# Mirror node OpenAPI spec

A byte-for-byte copy of the official mirror node REST API definition.

`openapi.yml` comes from [`hiero-ledger/hiero-mirror-node`](https://github.com/hiero-ledger/hiero-mirror-node) → `rest/api/v1/openapi.yml`. `SNAPSHOT` records the upstream commit it was copied from.

## Why it is here

The package checks its coverage against this file. `test/unit/spec-coverage.test.ts` compares every operation and query parameter in it with `test/spec/coverage-manifest.ts`, in both directions, on every build. The suite fails if the spec has a parameter that is neither covered nor listed as an omission, or if the manifest lists one the spec no longer has.

The weekly [`spec-drift`](../../../.github/workflows/spec-drift.yml) workflow compares this copy with upstream `main` and opens an issue when they differ.

## Refresh

```sh
# 1. Download the latest spec and record its commit
curl -fsSL https://raw.githubusercontent.com/hiero-ledger/hiero-mirror-node/main/rest/api/v1/openapi.yml \
  -o packages/mirror/spec/openapi.yml
gh api repos/hiero-ledger/hiero-mirror-node/commits/main --jq '.sha[0:7] + " " + (.commit.message | split("\n")[0])' \
  > packages/mirror/spec/SNAPSHOT

# 2. See what changed for the client
pnpm --filter @hiero-hackers/enterprise-mirror run test:unit
```

If `spec-coverage.test.ts` fails, it lists the new or removed operations and parameters. For each one, either:

- support it in the client (query type, parameter mapping and a URL test) and add it to `covered`, or
- add it to `omitted`, with the reason in the manifest header.

Don't edit the manifest just to silence a failure. It is the package's coverage contract.
