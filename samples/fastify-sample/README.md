# Fastify Sample

A REST API built with [Fastify](https://fastify.dev/), `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror` demonstrating how to query accounts, tokens, NFTs, topics, and network data from a Hiero network.

## Setup

```bash
# From the monorepo root
pnpm install

# Copy the example env and fill in your credentials
cp .env.example .env
```

Edit the `.env` file — fill in the required fields (`HIERO_OPERATOR_ID`, `HIERO_OPERATOR_KEY`, `HIERO_OPERATOR_KEY_TYPE`) and uncomment any optional fields you need.

You can get a free Hiero testnet account at https://portal.hedera.com.

## Run

```bash
# Development (with hot reload)
pnpm --filter hiero-fastify-sample dev

# Production
pnpm --filter hiero-fastify-sample build
pnpm --filter hiero-fastify-sample start
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/balance` | Operator account balance |
| `GET` | `/api/accounts/:id` | Account info from mirror node |
| `GET` | `/api/accounts/:id/nfts` | NFTs owned by an account |
| `GET` | `/api/tokens/:id` | Token info |
| `GET` | `/api/topics/:id/messages` | Topic messages |
| `POST` | `/api/topics` | Create a new topic |
| `POST` | `/api/topics/:id/messages` | Submit a message to a topic |
| `GET` | `/api/network/exchange-rates` | Current exchange rates |
| `GET` | `/api/network/supply` | Network supply info |

## How It Works

[`src/hiero.ts`](./src/hiero.ts) creates the Hiero services once at startup; the app shares them across routes and closes them with the server:

```ts
import { createHiero, toHttpError } from './hiero.js';

const hiero = createHiero(); // reads HIERO_* env vars
app.addHook('onClose', () => hiero.close());

app.get('/api/balance', () => hiero.accountService.getOperatorAccountBalance());
```

`hiero` exposes:

- **Services** (core): `accountService`, `topicService`. Add any other core service the same way.
- **Repositories** (mirror): `accountRepository`, `nftRepository`, `tokenRepository`, `topicRepository`, `transactionRepository`, `networkRepository`, and the rest of `createMirrorRepositories()`.
- **`close()`**: releases the SDK client.

A `setErrorHandler` uses `toHttpError()` to turn `HieroError` / `MirrorError` codes into HTTP statuses (`NOT_FOUND` → 404, `TIMED_OUT` → 504, mirror failures → 502). Any other error keeps Fastify's default handling.
