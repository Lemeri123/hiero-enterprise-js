import { describe, it, expect, afterEach, vi } from "vitest";
import {
    DefaultHttpTransport,
    MirrorNodeAccountBalanceQuery,
} from "@hiero-ledger/sdk";
import { HieroContext } from "../../../src/context/index.js";
import { HieroErrorCodes } from "../../../src/errors/index.js";
import { OperatorKeyType } from "../../../src/types/index.js";

const config = {
    network: "local",
    operatorId: "0.0.2",
    operatorKey:
        "302e020100300506032b6570042204203b054ddd0c62d577ce0fbb0e92dcce0d5bea42a98a5c9663271939881ce19208",
    operatorKeyType: OperatorKeyType.DER,
    networkNodes: { "127.0.0.1:50211": "0.0.3" },
};

describe("HieroContext mirror node", () => {
    const contexts: HieroContext[] = [];
    const create = (overrides: object) => {
        const ctx = new HieroContext({ ...config, ...overrides });
        contexts.push(ctx);
        return ctx;
    };

    afterEach(() => {
        contexts.splice(0).forEach((ctx) => ctx.close());
        vi.restoreAllMocks();
    });

    it("applies mirrorNetwork to the client", () => {
        const ctx = create({ mirrorNetwork: ["localhost:5600"] });

        expect(ctx.client.mirrorNetwork).toEqual(["localhost:5600"]);
    });

    it("leaves the client's mirror network empty when mirrorNetwork is unset", () => {
        expect(create({}).client.mirrorNetwork).toEqual([]);
    });

    it("sends mirror REST calls to mirrorNodeUrl", async () => {
        const ctx = create({
            mirrorNetwork: ["localhost:5600"],
            mirrorNodeUrl: "http://localhost:38081",
        });
        const roundTrip = vi
            .spyOn(DefaultHttpTransport.prototype, "roundTrip")
            .mockRejectedValue(new Error("stop"));

        await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.2")
            .execute(ctx.client)
            .catch(() => undefined);

        expect(roundTrip.mock.calls[0][0].url).toMatch(
            /^http:\/\/localhost:38081\/api\/v1\//,
        );
    });

    it("keeps the SDK's mirror transport when mirrorNodeUrl is unset", () => {
        const ctx = create({ mirrorNetwork: ["localhost:5600"] });

        expect(ctx.client.getMirrorNodeHttpConfig().transport).toBeNull();
    });

    it.each(["localhost:5551", "not a url"])(
        "rejects the invalid mirrorNodeUrl %s",
        (mirrorNodeUrl) => {
            expect(() => create({ mirrorNodeUrl })).toThrow(
                expect.objectContaining({
                    code: HieroErrorCodes.ConfigInvalid,
                }),
            );
        },
    );
});
