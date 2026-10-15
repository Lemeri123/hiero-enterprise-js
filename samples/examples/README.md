# Examples

Runnable scripts for `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror`, one feature per file.

Each file is self-contained: setup, constants and helpers are repeated in every file, so you can copy any one of them out as a starting point. The scripts make live network calls.

## Run

From the repository root:

```sh
pnpm --filter @hiero-hackers/examples examples           # every example
pnpm --filter @hiero-hackers/examples examples token     # only src/token/
pnpm --filter @hiero-hackers/examples examples mirror    # only src/mirror/, no credentials needed
```

The filter matches the start of the path under `src/`. Examples run one after another, each under an `[i/N]` header, and the run fails if any example fails.

To run one file:

```sh
cd samples/examples
npx tsx src/mirror/queries.ts
```

## Configuration

Put the variables in a `.env` file in this directory.

**Writes** need an operator account (see [`src/env.ts`](./src/env.ts)):

```sh
HIERO_NETWORK=testnet
HIERO_ED25519_OPERATOR_ID=0.0.12345
HIERO_ED25519_OPERATOR_KEY=<your private key>
# or the ECDSA pair:
HIERO_ECDSA_OPERATOR_ID=0.0.12345
HIERO_ECDSA_OPERATOR_KEY=<your private key>
```

**Mirror reads** need nothing; these are optional:

| Variable | Default | Notes |
|---|---|---|
| `HIERO_MIRROR_NODE_URL` | `https://mainnet.mirrornode.hedera.com` | Any mirror node REST URL |
| `EXAMPLE_ACCOUNT_ID` | `0.0.98` | A busy account, so results aren't empty |

## What's included

| Folder | Shows | Credentials |
|---|---|---|
| [`account`](./src/account) | Create accounts (single key, multisig, threshold, external or offline signer, scheduled, EVM alias), update, delete, transfer, allowances, signature checks | Operator |
| [`token`](./src/token) | Fungible tokens and NFTs: create, mint, burn, wipe, freeze, KYC, pause, update, fee schedules, associations, airdrops | Operator |
| [`topic`](./src/topic) | Create and update topics | Operator |
| [`file`](./src/file) | Create, read and update files | Operator |
| [`contract`](./src/contract) | Deploy, execute, update and delete contracts | Operator |
| [`schedule`](./src/schedule) | Schedule, sign (also offline) and cancel transactions | Operator |
| [`network`](./src/network) | Connect to a custom network, such as local Solo | Operator |
| [`mirror`](./src/mirror) | Query filters, and paging through results three ways: `page.next()`, `paginate` and `collectAll` | None |

A few mirror methods have no example: account hooks (`findHooks`, `findHookStorage`) and registered nodes (`findRegisteredNodes`) have no data on mainnet yet, and `estimateFees` needs transaction bytes from core. Unit tests cover all of them.
