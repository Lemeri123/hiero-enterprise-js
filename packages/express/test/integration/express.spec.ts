import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { hieroMiddleware } from "../../src/index.js";
import { DEPRECATION_CODE } from "../../src/deprecation.js";

const config = {
    network: "testnet",
    operatorId: "0.0.1001",
    operatorKeyType: "der" as const,
    operatorKey:
        "302e020100300506032b6570042204203b054ddd0c62d577ce0fbb0e92dcce0d5bea42a98a5c9663271939881ce19208",
};

describe("hieroMiddleware", () => {
    it("injects Hiero services into req.hiero", () => {
        const middleware = hieroMiddleware(config);
        const req = {} as Request;
        const res = {} as Response;
        const next = vi.fn() as NextFunction;

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.hiero).toBeDefined();
        expect(req.hiero.accountService).toBeDefined();
        expect(req.hiero.networkRepository).toBeDefined();

        req.hiero.context.close();
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
