# NestJS sample

A REST API built with [NestJS](https://nestjs.com/), `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror`, with the services injected into controllers.

## Run

From the repository root:

```sh
pnpm install
cp samples/nest-sample/.env.example samples/nest-sample/.env
```

Fill in `HIERO_OPERATOR_ID`, `HIERO_OPERATOR_KEY` and `HIERO_OPERATOR_KEY_TYPE` in `.env`. You can get a free testnet account in the [Hedera Developer Portal](https://portal.hedera.com).

```sh
pnpm --filter hiero-nest-sample dev     # with hot reload

pnpm --filter hiero-nest-sample build   # or build and start
pnpm --filter hiero-nest-sample start
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

[`src/hiero.module.ts`](./src/hiero.module.ts) is a small global module that registers the services as providers:

```ts
@Global()
@Module({
  providers: [
    { provide: HieroContext, useFactory: () => new HieroContext() },
    { provide: MirrorNodeClient, useFactory: () => createMirrorNodeClient() },
    { provide: AccountService, useFactory: (c: HieroContext) => new AccountService(c), inject: [HieroContext] },
    { provide: AccountRepository, useFactory: (m: MirrorNodeClient) => new AccountRepository(m), inject: [MirrorNodeClient] },
    // …
  ],
  exports: [HieroContext, MirrorNodeClient, AccountService, AccountRepository /* , … */],
})
export class HieroModule implements OnApplicationShutdown {
  constructor(private readonly context: HieroContext) {}
  onApplicationShutdown() { this.context.close(); }
}
```

Import it once in your `AppModule`, then inject services by type:

```ts
@Controller('api')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,       // from enterprise-core
    private readonly accountRepo: AccountRepository,       // from enterprise-mirror
  ) {}

  @Get('balance')
  getBalance() {
    return this.accountService.getOperatorAccountBalance();
  }
}
```

The module also registers an exception filter that maps `HieroError` and `MirrorError` codes to HTTP statuses (`NOT_FOUND` → 404, `TIMED_OUT` → 504, mirror failures → 502). `main.ts` calls `app.enableShutdownHooks()`, so the SDK client closes on `SIGINT` or `SIGTERM`.
