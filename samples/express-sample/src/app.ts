import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { createHiero, toHttpError } from "./hiero.js";

// ─── Hiero Integration ────────────────────────────────────────
// Create the services once and share them across all routes.
// Config is read from env vars (see .env.example).
const hiero = createHiero();

const app = express();
app.use(express.json());

// ─── Root Route ───────────────────────────────────────────────

app.get("/", (_req, res) => {
    res.json({
        service: "Hiero Express Sample",
        message:
            "Server is running. Try one of the endpoints below to view data.",
        endpoints: {
            accounts: [
                "POST /api/accounts",
                "GET  /api/balance",
                "GET  /api/accounts/:id",
                "GET  /api/accounts/:id/nfts",
            ],
            tokens: ["GET /api/tokens/:id"],
            topics: [
                "GET  /api/topics/:id/messages",
                "POST /api/topics",
                "POST /api/topics/:id/messages",
            ],
            network: [
                "GET /api/network/exchange-rates",
                "GET /api/network/supply",
            ],
        },
    });
});

// ─── Account Routes ───────────────────────────────────────────

app.post("/api/accounts", async (req, res) => {
    const { publicKey, keyType, alias } = req.body;
    const account = await hiero.accountService.createAccount({
        publicKey,
        keyType,
        alias,
    });
    res.status(201).json(account);
});

/** Get the operator account balance */
app.get("/api/balance", async (_req, res) => {
    const balance = await hiero.accountService.getOperatorAccountBalance();
    res.json(balance);
});

/** Query an account from the mirror node */
app.get("/api/accounts/:id", async (req, res) => {
    const info = await hiero.accountRepository.findByAccountId(req.params.id);
    res.json(info);
});

/** Query NFTs owned by an account */
app.get("/api/accounts/:id/nfts", async (req, res) => {
    const page = await hiero.nftRepository.findByOwner(req.params.id);
    res.json(page);
});

// ─── Token Routes ─────────────────────────────────────────────

/** Query a token by ID */
app.get("/api/tokens/:id", async (req, res) => {
    const info = await hiero.tokenRepository.findById(req.params.id);
    res.json(info);
});

// ─── Topic Routes ─────────────────────────────────────────────

/** Query topic messages */
app.get("/api/topics/:id/messages", async (req, res) => {
    const page = await hiero.topicRepository.findByTopicId(req.params.id);
    res.json(page);
});

/** Create a new public topic */
app.post("/api/topics", async (req, res) => {
    const { memo } = req.body as { memo?: string };
    const topicId = await hiero.topicService.createTopic({
        topicMemo: memo,
    });
    res.status(201).json({ topicId });
});

/** Submit a message to a topic */
app.post("/api/topics/:id/messages", async (req, res) => {
    const { message } = req.body as { message: string };
    const result = await hiero.topicService.submitMessage({
        topicId: req.params.id,
        message,
    });
    res.status(202).json({
        status: "submitted",
        sequenceNumber: result.sequenceNumber?.toString() ?? null,
        transactionId: result.transactionId,
    });
});

// ─── Network Routes ───────────────────────────────────────────

/** Query exchange rates */
app.get("/api/network/exchange-rates", async (_req, res) => {
    const rates = await hiero.networkRepository.findExchangeRates();
    res.json(rates);
});

/** Query network supply */
app.get("/api/network/supply", async (_req, res) => {
    const supply = await hiero.networkRepository.findNetworkSupplies();
    res.json(supply);
});

// ─── Error Handling ───────────────────────────────────────────
// Express 5 forwards rejected async handlers here, so routes don't
// need their own try/catch. Errors that aren't from Hiero fall through
// to Express's default handler.

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    const mapped = toHttpError(error);
    if (!mapped) return next(error);
    if (mapped.status >= 500) console.error(error);
    res.status(mapped.status).json(mapped.body);
});

// ─── Start ────────────────────────────────────────────────────

const port = process.env["PORT"] ?? 3000;
const server = app.listen(port, () => {
    console.log(`🌐 Hiero Express sample running on http://localhost:${port}`);
    console.log();
    console.log("  Available endpoints:");
    console.log("    GET  /api/balance");
    console.log("    GET  /api/accounts/:id");
    console.log("    GET  /api/accounts/:id/nfts");
    console.log("    GET  /api/tokens/:id");
    console.log("    GET  /api/topics/:id/messages");
    console.log("    POST /api/topics");
    console.log("    POST /api/topics/:id/messages");
    console.log("    GET  /api/network/exchange-rates");
    console.log("    GET  /api/network/supply");
    console.log();
    console.log("  Try opening in your browser:");
    console.log(`    http://localhost:${port}/api/balance`);
    console.log(`    http://localhost:${port}/api/network/supply`);
    console.log();
});

// ─── Shutdown ─────────────────────────────────────────────────

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
        server.close(() => {
            hiero.close();
            process.exit(0);
        });
    });
}
