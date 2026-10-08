# Samples

Sample projects demonstrating how to use `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror` with different Node.js frameworks. No framework-specific package is needed: each sample wires the services itself in one small file you can copy into your own app.

| Sample | Framework | Port | Wiring |
|--------|-----------|------|--------|
| [express-sample](./express-sample) | Express | 3000 | [`src/hiero.ts`](./express-sample/src/hiero.ts): services created once, shared by every route |
| [fastify-sample](./fastify-sample) | Fastify | 3001 | [`src/hiero.ts`](./fastify-sample/src/hiero.ts): same, closed from an `onClose` hook |
| [nest-sample](./nest-sample) | NestJS | 3002 | [`src/hiero.module.ts`](./nest-sample/src/hiero.module.ts): providers injected by type |

Each sample also maps `HieroError` / `MirrorError` codes to HTTP statuses, so a missing account returns 404 rather than 500. These samples replace the deprecated `@hiero-hackers/enterprise-express`, `-fastify` and `-nest` packages; see [Migrating from the framework adapters](../README.md#migrating-from-the-framework-adapters).

Also in this directory: [examples](./examples), a gallery of standalone
scripts by domain (account, token, topic, …, mirror). The mirror scripts
there run without credentials.

## Quick Start

```bash
# 1. Install & build from the repo root
pnpm install && pnpm run build

# 2. Copy the .env.example to create your .env file
cp samples/express-sample/.env.example samples/express-sample/.env

# 3. Edit the .env file — fill in the required fields and uncomment any optional fields you need
#    You can get a free testnet account at https://portal.hedera.com

# 4. Run any sample
pnpm --filter hiero-express-sample dev    # port 3000
pnpm --filter hiero-fastify-sample dev    # port 3001
pnpm --filter hiero-nest-sample dev       # port 3002

# the mirror examples need no .env at all:
pnpm --filter @hiero-hackers/examples examples mirror
```

> **Note:** Each sample has its own `.env.example`. Copy it to `.env` inside that sample's directory (e.g. `samples/fastify-sample/.env`), not in the monorepo root.

> **Tip:** You can create a free Hiero testnet account at https://portal.hedera.com to get an operator ID and private key for trying these demos.

## Available Endpoints

All three samples expose the same REST API:

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/balance` | Get the operator account HBAR balance |
| `GET` | `/api/accounts/:id` | Look up an account by ID (Mirror Node) |
| `GET` | `/api/accounts/:id/nfts` | List NFTs owned by an account |
| `POST` | `/api/accounts` | Create a new account on-chain *(Express and NestJS)* |

### Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tokens/:id` | Look up a token by ID (Mirror Node) |

### Topics (Consensus Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/topics/:id/messages` | Get messages for a topic |
| `POST` | `/api/topics` | Create a new consensus topic |
| `POST` | `/api/topics/:id/messages` | Submit a message to a topic |

### Network

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/network/exchange-rates` | Current HBAR ↔ USD exchange rates |
| `GET` | `/api/network/supply` | Total HBAR supply info |

## Example `curl` Commands

```bash
# Get operator balance
curl http://localhost:3000/api/balance

# Look up an account
curl http://localhost:3000/api/accounts/0.0.12345

# Create a new account (NestJS sample on port 3002)
curl -X POST http://localhost:3002/api/accounts \
     -H "Content-Type: application/json" \
     -d '{"memo": "My new account"}'

# Create a topic
curl -X POST http://localhost:3000/api/topics \
     -H "Content-Type: application/json" \
     -d '{"memo": "My first topic"}'

# Submit a message to a topic
curl -X POST http://localhost:3000/api/topics/0.0.TOPIC_ID/messages \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello, Hiero!"}'

# Get exchange rates
curl http://localhost:3000/api/network/exchange-rates
```

