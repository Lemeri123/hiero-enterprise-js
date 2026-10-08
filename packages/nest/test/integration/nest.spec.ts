import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { AccountService, HieroModule } from "../../src/index.js";
import { DEPRECATION_CODE } from "../../src/deprecation.js";

const config = {
    network: "testnet",
    operatorId: "0.0.1001",
    operatorKeyType: "der" as const,
    operatorKey:
        "302e020100300506032b6570042204203b054ddd0c62d577ce0fbb0e92dcce0d5bea42a98a5c9663271939881ce19208",
};

describe("HieroModule", () => {
    it("uses non-global scope by default and supports opt-in global mode", () => {
        const defaultModule = HieroModule.forRoot(config);
        const globalModule = HieroModule.forRoot(config, { global: true });

        expect(defaultModule.global).toBe(false);
        expect(globalModule.global).toBe(true);
    });

    it("registers Hiero providers in a Nest testing module", async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [HieroModule.forRoot(config)],
        }).compile();

        const accountService = moduleRef.get(AccountService);
        expect(accountService).toBeInstanceOf(AccountService);

        await moduleRef.close();
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
