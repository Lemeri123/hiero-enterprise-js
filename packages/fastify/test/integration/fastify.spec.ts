import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { hieroPlugin } from "../../src/index.js";
import { DEPRECATION_CODE } from "../../src/deprecation.js";

const config = {
    network: "testnet",
    operatorId: "0.0.1001",
    operatorKeyType: "der" as const,
    operatorKey:
        "302e020100300506032b6570042204203b054ddd0c62d577ce0fbb0e92dcce0d5bea42a98a5c9663271939881ce19208",
};

describe("hieroPlugin", () => {
    it("decorates the fastify instance with Hiero services", async () => {
        const app = Fastify();

        await app.register(hieroPlugin, { config });

        app.get("/probe", () => {
            return {
                hasAccountService: !!app.hiero.accountService,
                hasNetworkRepository: !!app.hiero.networkRepository,
            };
        });

        const response = await app.inject({ method: "GET", url: "/probe" });
        const payload = response.json() as {
            hasAccountService: boolean;
            hasNetworkRepository: boolean;
        };

        expect(response.statusCode).toBe(200);
        expect(payload.hasAccountService).toBe(true);
        expect(payload.hasNetworkRepository).toBe(true);

        await app.close();
    });
});

describe("deprecation", () => {
    it("emits a single DeprecationWarning however many runtimes are created", async () => {
        vi.resetModules();
        const emitWarning = vi
            .spyOn(process, "emitWarning")
            .mockImplementation(() => undefined);
        try {
            const { createHieroRuntime } = await import("../../src/runtime.js");
            createHieroRuntime(config).close();
            createHieroRuntime(config).close();

            const ours = emitWarning.mock.calls.filter(
                ([, options]) =>
                    (options as { code?: string } | undefined)?.code ===
                    DEPRECATION_CODE,
            );
            expect(ours).toHaveLength(1);
            expect(ours[0]![1]).toMatchObject({ type: "DeprecationWarning" });
        } finally {
            emitWarning.mockRestore();
        }
    });
});
