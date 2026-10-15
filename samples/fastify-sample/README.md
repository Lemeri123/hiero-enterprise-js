# Fastify sample

A REST API built with [Fastify](https://fastify.dev/), `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror`.

## Run

From the repository root:

```sh
pnpm install
cp samples/fastify-sample/.env.example samples/fastify-sample/.env
```

Fill in `HIERO_OPERATOR_ID`, `HIERO_OPERATOR_KEY` and `HIERO_OPERATOR_KEY_TYPE` in `.env`. You can get a free testnet account in the [Hedera Developer Portal](https://portal.hedera.com).

```sh
pnpm --filter hiero-fastify-sample dev     # with hot reload

pnpm --filter hiero-fastify-sample build   # or build and start
pnpm --filter hiero-fastify-sample start
```

## Endpoints

| Method | Path | Does |
|---|---|---|
| `GET` | `/api/balance` | Operator account balance |
| `GET` | `/api/accounts/:id` | Account details, from the mirror node |
| `GET` | `/api/accounts/:id/nfts` | NFTs the account owns |
| `GET` | `/api/tokens/:id` | Token details, from the mirror node |
| `GET` | `/api/topics/:id/messages` | A topic's messages |
| `POST` | `/api/topics` | Create a topic |
| `POST` | `/api/topics/:id/messages` | Submit a message to a topic |
| `GET` | `/api/network/exchange-rates` | Current exchange rate |
| `GET` | `/api/network/supply` | HBAR supply |

## How it works

[`src/hiero.ts`](./src/hiero.ts) creates the services once at startup. The routes share them, and they close with the server:

```ts
import { createHiero, toHttpError } from './hiero.js';

const hiero = createHiero(); // reads HIERO_* env vars
app.addHook('onClose', () => hiero.close());

app.get('/api/balance', () => hiero.accountService.getOperatorAccountBalance());
```

`hiero` exposes:

- **Services** (core): `accountService` and `topicService`. Add other core services the same way.
- **Repositories** (mirror): `accountRepository`, `nftRepository`, `tokenRepository`, `topicRepository`, `transactionRepository`, `networkRepository`, and the rest of `createMirrorRepositories()`.
- **`close()`**: releases the SDK client.

A `setErrorHandler` uses `toHttpError()` to turn `HieroError` and `MirrorError` codes into HTTP statuses (`NOT_FOUND` → 404, `TIMED_OUT` → 504, mirror failures → 502). Other errors keep Fastify's default handling.
