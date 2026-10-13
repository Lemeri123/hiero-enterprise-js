# Samples

Small, runnable apps that use `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror`.

Each framework sample wires the services in one file you can copy into your own app. No framework-specific package is needed.

| Sample | Framework | Port | Wiring |
|---|---|---|---|
| [express-sample](./express-sample) | Express | 3000 | [`src/hiero.ts`](./express-sample/src/hiero.ts): services created once and shared by every route |
| [fastify-sample](./fastify-sample) | Fastify | 3001 | [`src/hiero.ts`](./fastify-sample/src/hiero.ts): the same, closed from an `onClose` hook |
| [nest-sample](./nest-sample) | NestJS | 3002 | [`src/hiero.module.ts`](./nest-sample/src/hiero.module.ts): providers injected by type |
| [examples](./examples) | none | — | One script per feature; the mirror scripts need no credentials |

Each framework sample maps `HieroError` and `MirrorError` codes to HTTP statuses, so a missing account returns 404, not 500.

## Run

From the repository root:

```sh
pnpm install && pnpm run build

cp samples/express-sample/.env.example samples/express-sample/.env
# fill in HIERO_OPERATOR_ID, HIERO_OPERATOR_KEY and HIERO_OPERATOR_KEY_TYPE

pnpm --filter hiero-express-sample dev   # port 3000
pnpm --filter hiero-fastify-sample dev   # port 3001
pnpm --filter hiero-nest-sample dev      # port 3002

# no .env needed:
pnpm --filter @hiero-hackers/examples examples mirror
```

Each sample reads its own `.env`, inside its directory, not the repository root. You can get a free testnet account in the [Hedera Developer Portal](https://portal.hedera.com).

## Endpoints

All three framework samples serve the same API:

| Method | Path | Does |
|---|---|---|
| `GET` | `/api/balance` | Operator account balance |
| `GET` | `/api/accounts/:id` | Account details, from the mirror node |
| `GET` | `/api/accounts/:id/nfts` | NFTs the account owns |
| `POST` | `/api/accounts` | Create an account (Express and NestJS only) |
| `GET` | `/api/tokens/:id` | Token details, from the mirror node |
| `GET` | `/api/topics/:id/messages` | A topic's messages |
| `POST` | `/api/topics` | Create a topic |
| `POST` | `/api/topics/:id/messages` | Submit a message to a topic |
| `GET` | `/api/network/exchange-rates` | Current HBAR ⇄ USD exchange rate |
| `GET` | `/api/network/supply` | HBAR supply |

## Try it

```sh
curl http://localhost:3000/api/balance
curl http://localhost:3000/api/accounts/0.0.12345

curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"memo": "My first topic"}'

curl -X POST http://localhost:3000/api/topics/<topic id>/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Hiero!"}'

curl -X POST http://localhost:3002/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"memo": "My new account"}'
```
