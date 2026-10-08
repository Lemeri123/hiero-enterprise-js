# NestJS Sample

A REST API built with [NestJS](https://nestjs.com/), `@hiero-hackers/enterprise-core` and `@hiero-hackers/enterprise-mirror` demonstrating dependency injection of Hiero services into controllers.

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
pnpm --filter hiero-nest-sample dev

# Production
pnpm --filter hiero-nest-sample build
pnpm --filter hiero-nest-sample start
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

[`src/hiero.module.ts`](./src/hiero.module.ts) is a small global module that registers the Hiero classes as providers:

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

Import it once in your `AppModule`, then inject any service by type:

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

The module also registers an exception filter for `HieroError` and `MirrorError` that maps their codes to HTTP statuses (`NOT_FOUND` → 404, `TIMED_OUT` → 504, mirror failures → 502). `main.ts` calls `app.enableShutdownHooks()` so the SDK client is closed on `SIGINT`/`SIGTERM`.
