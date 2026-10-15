# Express sample

A REST API built with [Express](https://expressjs.com/), `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror`.

## Run

From the repository root:

```sh
pnpm install
cp samples/express-sample/.env.example samples/express-sample/.env
```

Fill in `HIERO_OPERATOR_ID`, `HIERO_OPERATOR_KEY` and `HIERO_OPERATOR_KEY_TYPE` in `.env`. You can get a free testnet account in the [Hedera Developer Portal](https://portal.hedera.com).

```sh
pnpm --filter hiero-express-sample dev     # with hot reload

pnpm --filter hiero-express-sample build   # or build and start
pnpm --filter hiero-express-sample start
```

## Endpoints

| Method | Path | Does |
|---|---|---|
| `GET` | `/api/balance` | Operator account balance |
| `GET` | `/api/accounts/:id` | Account details, from the mirror node |
| `GET` | `/api/accounts/:id/nfts` | NFTs the account owns |
| `POST` | `/api/accounts` | Create an account |
| `GET` | `/api/tokens/:id` | Token details, from the mirror node |
| `GET` | `/api/topics/:id/messages` | A topic's messages |
| `POST` | `/api/topics` | Create a topic |
| `POST` | `/api/topics/:id/messages` | Submit a message to a topic |
| `GET` | `/api/network/exchange-rates` | Current exchange rate |
| `GET` | `/api/network/supply` | HBAR supply |

## How it works

[`src/hiero.ts`](./src/hiero.ts) creates the services once at startup:

```ts
import { createHiero, toHttpError } from './hiero.js';

const hiero = createHiero(); // reads HIERO_* env vars

app.get('/api/balance', async (_req, res) => {
  res.json(await hiero.accountService.getOperatorAccountBalance());
});
```

`hiero` exposes:

- **Services** (core): `accountService` and `topicService`. Add other core services the same way.
- **Repositories** (mirror): `accountRepository`, `nftRepository`, `tokenRepository`, `topicRepository`, `transactionRepository`, `networkRepository`, and the rest of `createMirrorRepositories()`.
- **`close()`**: releases the SDK client. The app calls it on `SIGINT` or `SIGTERM`, after the server stops.

Express 5 passes errors from async routes to the error middleware. It uses `toHttpError()` to turn `HieroError` and `MirrorError` codes into HTTP statuses (`NOT_FOUND` → 404, `TIMED_OUT` → 504, mirror failures → 502). Other errors go to Express's default handler.
