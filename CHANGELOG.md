# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
While the version is below 1.0.0, minor releases may contain breaking changes;
these are called out with **Breaking**.

All published packages (`@hiero-hackers/enterprise-core`, `-mirror`, `-express`,
`-fastify`, `-nest`) are versioned in lockstep, so one entry covers every package.

## [Unreleased]

### Deprecated

- `@hiero-hackers/enterprise-express`, `@hiero-hackers/enterprise-fastify` and
  `@hiero-hackers/enterprise-nest` are deprecated and will be removed in a future
  release ([#238]). They add little over using `enterprise-core` and
  `enterprise-mirror` directly, and they had diverging lifecycle handling: the
  Express middleware and Nest module never closed the SDK client.
    - Every export is marked `@deprecated`, so editors flag usages.
    - The first use logs a one-time Node.js `DeprecationWarning` with code
      `HIERO_ENTERPRISE_EXPRESS_DEPRECATED`, `HIERO_ENTERPRISE_FASTIFY_DEPRECATED` or
      `HIERO_ENTERPRISE_NEST_DEPRECATED`. Silence it with `node --no-deprecation`.
    - Migration steps are in the README under
      [Migrating from the framework adapters](./README.md#migrating-from-the-framework-adapters).

### Changed

- The Express, Fastify and NestJS samples now use `enterprise-core` and
  `enterprise-mirror` directly instead of the deprecated adapters. Each one is a
  copyable recipe:
    - the services are created once in `src/hiero.ts` (or `src/hiero.module.ts`
      for NestJS) and shared across requests;
    - the SDK client is closed on shutdown;
    - `HieroError` / `MirrorError` codes map to HTTP statuses (`NOT_FOUND` → 404,
      `CONFIG_INVALID` and requests the mirror node rejects as invalid → 400,
      `TIMED_OUT` → 504, other mirror node failures → 502) instead of every error
      returning a 500 with the raw error text.
- The README now shows how to use the packages with Express, Fastify and NestJS
  without an adapter, and includes a migration guide.
- Updated `packageManager` to pnpm 11.24.0 ([#212]).

### Added

- This changelog.
- Issue moderation workflows. New issues are labelled `pending-review` and locked
  until a maintainer applies the `approved` label ([#175]).

### Fixed

- `enterprise-core`: a throwing `onAfterTransaction` listener no longer turns a
  successful transaction or query into an error, fires the after-event twice, or
  replaces the original error on failure ([#245], [#269]). The error is reported
  as a `HIERO_LISTENER_ERROR` process warning and the remaining listeners still
  run. A throwing `onBeforeTransaction` listener still aborts the transaction.
- Fixed `HieroContext` leaking an SDK client when the operator credentials are invalid; credentials are now parsed before the client is created, and a malformed `operatorId` throws a `HieroError` with `CONFIG_INVALID` instead of a raw SDK error. [#271](https://github.com/hiero-hackers/hiero-enterprise-js/pull/271) [#246](https://github.com/hiero-hackers/hiero-enterprise-js/issues/246)

### Security

- Pinned the transitive `ws` dependency to `^8.21.3` (GHSA-96hv-2xvq-fx4p,
  GHSA-58qx-3vcg-4xpx) and `esbuild` to `^0.28.2` (GHSA-g7r4-m6w7-qqqr) through
  pnpm overrides ([#212]).

## [0.3.0] - 2026-08-15

### Added

- `prepare` scripts in every package. Consumers that install from a `file:` or
  workspace path no longer build silently against a stale `dist/` ([#199]).

### Fixed

- `enterprise-mirror`: `MirrorTokenInfo.pauseStatus` keeps the mirror node's three
  states instead of collapsing them to a boolean ([#191]).
- `enterprise-mirror`: `TransactionInfo` keeps `memo_base64` alongside the decoded
  memo ([#194]).
- `enterprise-mirror`: an `observer` set on `MirrorConfig` is now forwarded to the
  client created by `createMirrorNodeClient` ([#200]).

### Changed

- `enterprise-mirror`: refreshed the vendored OpenAPI snapshot. The weekly mainnet
  canary uses a longer timeout, so a slow mirror node no longer triggers a false
  alarm ([#201]).
- Dependabot ignores TypeScript major updates ([#192]).

### Documentation

- The CONTRIBUTING quickstart links to the runnable samples ([#185]). README
  updates ([#198]).

## [0.2.0] - 2026-08-11

### Added

- Every write operation now returns a result object instead of `void`, carrying
  the transaction ID, status and the operation-specific values from the receipt
  ([#143]).
- `ContractService.executeContract` accepts an opt-in `withFunctionResult`. It
  fetches the transaction record (a paid query) to return the function's return
  data and gas used ([#166]).
- `enterprise-mirror`: an opt-in `retryOn404` for reading entities that the
  mirror node hasn't ingested yet ([#158]).
- `enterprise-mirror`: a client observer hook (`MirrorClientObserver`) for request
  start, retry and end events. A guard test now ensures every request goes through
  the client's single transport path ([#146]).
- CodeRabbit planning configuration ([#156]); CI uploads code-quality results
  ([#157]).
- The release workflow cuts a GitHub Release for each published tag ([#181]).

### Changed

- **Breaking:** return types of several write operations changed as part of
  [#143]:
    - `mint`: `Long[]` → a result with `serials: number[]` and
      `totalSupply: string`;
    - `burn` and `wipe`: `Long` → a result with `totalSupply: string`;
    - allowance operations: the raw receipt → a transaction result;
    - `submitMessage`: `sequenceNumber` is a `number` (or `null`) instead of a
      `Long`, and the result now includes `runningHash`.
- **Breaking:** `enterprise-mirror` parses responses losslessly. Tinybar and other
  int64 amounts above 2^53 are kept exactly instead of losing precision ([#144]).

### Fixed

- `scheduleRun` again returns the shared `transactionId` alongside `scheduleId`
  ([#164]).
- `autoCreateEvmAccount` reports a failed child-receipt lookup instead of
  swallowing it ([#167]).
- `enterprise-mirror`: the response body is released before a retry, and retry
  tests no longer depend on the default timeout.

## [0.1.0] - 2026-07-16

First published release, under the `@hiero-hackers` scope on the GitHub Packages
npm registry ([#126], [#133]).

### Added

- **`@hiero-hackers/enterprise-core`**: typed services over the Hiero SDK, each
  operation with its own validator, plus unit and integration tests:
    - `AccountService`: create (native, EVM and alias accounts), update, delete,
      transfers ([#64]), HBAR, token and NFT allowances ([#60], [#62]), balances,
      and signature and transaction verification against the on-chain key
      ([#65]).
    - `TokenService`: create, mint, burn, wipe, associate, dissociate, update,
      delete, freeze and unfreeze, grant and revoke KYC, pause and unpause,
      fee-schedule updates, NFT metadata updates, token reject, fungible and NFT
      airdrops (send, claim, cancel), and token and NFT info queries ([#67]–[#89]).
    - `ContractService`: create, create-flow for large bytecode, execute, update,
      delete, plus bytecode, info and local-call queries ([#91]–[#96]).
    - `TopicService`: create, update, delete, submit message, topic info and
      message subscriptions ([#97]–[#100]).
    - `FileService`: create, append, update, delete and contents and info queries,
      with automatic chunking for large files ([#101]).
    - `ScheduleService` and scheduled execution of any write ([#57]).
    - `NetworkService` and the shared `TransactionExecutor` / `QueryExecutor`
      ([#90]).
    - `HieroContext` and `HieroConfig`, configured from code or `HIERO_*`
      environment variables; ED25519, ECDSA and DER operator keys; custom
      networks via `HIERO_NETWORK_NODES`.
    - `HieroError` with machine-readable codes, and transaction listeners for
      before and after events.
- **`@hiero-hackers/enterprise-mirror`**: a dependency-free mirror node REST
  client ([#111]):
    - covers the complete mirror node REST API, checked in both directions against
      the vendored OpenAPI spec;
    - typed repositories for accounts, blocks, contracts, NFTs, tokens, topics,
      transactions, schedules and network data;
    - continuable pagination in both directions ([#125]), rate limiting, retries
      and timeouts, rich filters, and unit helpers;
    - weekly spec-drift and mainnet smoke workflows, plus response-field
      completeness checks ([#119], [#127]).
- **`@hiero-hackers/enterprise-express`, `-fastify`, `-nest`**: framework
  integrations exposing the core services and mirror repositories as
  `req.hiero`, `fastify.hiero` and NestJS providers.
- Express, Fastify and NestJS sample apps and a gallery of standalone example
  scripts.
- CI on Node 22 and 24 against a local Solo network, with coverage reports
  ([#102]), CodeQL, OpenSSF Scorecard, Dependabot, and bug and feature issue
  templates ([#33], [#35], [#37]).

### Fixed

- `enterprise-mirror`:
    - account alias lookup no longer assumes an EVM alias ([#124]);
    - missing response fields were added and key handling corrected ([#128],
      [#129]);
    - `convertAccount` keeps `balance.timestamp` and `balance.tokens` ([#137]);
    - `MirrorError` carries the HTTP status ([#138]);
    - non-ASCII transaction memos are decoded correctly instead of being mangled
      by `atob()` ([#135], [#142]);
    - `getPage` pins the balance snapshot timestamp onto the next-page link.

[Unreleased]: https://github.com/hiero-hackers/hiero-enterprise-js/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/hiero-hackers/hiero-enterprise-js/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/hiero-hackers/hiero-enterprise-js/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hiero-hackers/hiero-enterprise-js/releases/tag/v0.1.0
[#33]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/33
[#35]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/35
[#37]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/37
[#57]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/57
[#60]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/60
[#62]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/62
[#64]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/64
[#65]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/65
[#67]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/67
[#89]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/89
[#90]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/90
[#91]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/91
[#96]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/96
[#97]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/97
[#100]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/100
[#101]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/101
[#102]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/102
[#111]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/111
[#119]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/119
[#124]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/124
[#125]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/125
[#126]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/126
[#127]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/127
[#128]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/128
[#129]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/129
[#133]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/133
[#135]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/135
[#137]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/137
[#138]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/138
[#142]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/142
[#143]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/143
[#144]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/144
[#146]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/146
[#156]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/156
[#157]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/157
[#158]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/158
[#164]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/164
[#166]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/166
[#167]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/167
[#175]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/175
[#181]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/181
[#185]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/185
[#191]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/191
[#192]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/192
[#194]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/194
[#198]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/198
[#199]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/199
[#200]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/200
[#201]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/201
[#212]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/212
[#238]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/238
[#245]: https://github.com/hiero-hackers/hiero-enterprise-js/issues/245
[#269]: https://github.com/hiero-hackers/hiero-enterprise-js/pull/269
