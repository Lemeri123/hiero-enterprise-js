# @hiero-hackers/enterprise-core

The write side of Hiero for Node.js: typed services over the SDK for
transactions that go on-chain — signed by your operator account,
carrying fees. The read side (free mirror node REST queries) lives in
[`@hiero-hackers/enterprise-mirror`](../mirror). For an
Express/Fastify/NestJS service, install both and wire them once at
startup; see
[Using with Express, Fastify, or NestJS](../../README.md#using-with-express-fastify-or-nestjs).

```bash
npm install @hiero-hackers/enterprise-core
```

> **Note:** not yet published to npm — see [CONTRIBUTING](../../CONTRIBUTING.md) to run from the repo.

```ts
import { HieroContext, AccountService } from "@hiero-hackers/enterprise-core";

const context = new HieroContext({
    network: "testnet",
    operatorId: "0.0.12345",
    operatorKey: "your_private_key_here",
    operatorKeyType: "ed25519",
});

const accounts = new AccountService(context);
const account = await accounts.createAccount({
    publicKey: "...",
    initialBalance: 10,
});

context.close();
```

## Services

| Service | What it covers |
| --- | --- |
| `AccountService` | Create, update, delete accounts; allowances; balances |
| `TokenService` | Create, mint, burn, transfer fungible tokens and NFTs |
| `TopicService` | Create topics, manage keys, submit messages |
| `FileService` | Store and retrieve file content on-chain |
| `ContractService` | Deploy and call EVM-compatible smart contracts |
| `ScheduleService` | Create and sign scheduled transactions |
| `NetworkService` | Network-level queries via the SDK client |

Every service takes the same `HieroContext`, which owns the SDK client,
operator identity, and connection lifecycle (`close()` releases gRPC
channels).

## Configuration

Construct `HieroContext` with a config object (as above) or with no
arguments to read the environment: `HIERO_NETWORK`,
`HIERO_OPERATOR_ID`, `HIERO_OPERATOR_KEY`, and `HIERO_OPERATOR_KEY_TYPE`
(`ed25519` | `ecdsa` | `der` — required, since key algorithms cannot be
reliably auto-detected from the raw key string).

## Balances

Balances are read from the mirror node, as the consensus nodes no longer
serve balance queries:

```ts
const accounts = new AccountService(context);
const { tinybars } = await accounts.getAccountBalance("0.0.1234");
const { balance, decimals } = await accounts.getTokenBalance(
  "0.0.1234",
  "0.0.5678",
);
```

A new account or transfer appears on the mirror node a few seconds after
it reaches consensus.

## Custom networks

For a network other than mainnet, testnet or previewnet (for example a
local Solo network), pass its consensus nodes and its mirror node:

```ts
const context = new HieroContext({
  network: "local",
  networkNodes: { "127.0.0.1:50211": "0.0.3" },
  mirrorNetwork: ["localhost:5600"],
  mirrorNodeUrl: "http://localhost:5551",
  operatorId: "0.0.2",
  operatorKey: "302e...",
  operatorKeyType: "der",
});
```

- `networkNodes` (`HIERO_NETWORK_NODES="127.0.0.1:50211=0.0.3"`): the
  consensus nodes.
- `mirrorNetwork` (`HIERO_MIRROR_NETWORK="localhost:5600"`): the mirror
  node's gRPC address, needed for balances and topic subscriptions.
- `mirrorNodeUrl` (`HIERO_MIRROR_NODE_URL="http://localhost:5551"`): the
  mirror node's REST URL, which balances are read from. Without it the SDK
  uses port 5551 for a local mirror node, so set it when yours serves REST
  elsewhere (Solo's default is 38081).

See [`custom-network.ts`](../../samples/examples/src/network/custom-network.ts).

Runnable examples for every service:
[`samples/examples`](../../samples/examples).
