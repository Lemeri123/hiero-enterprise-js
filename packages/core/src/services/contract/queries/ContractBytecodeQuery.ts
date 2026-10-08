import type { ContractId } from "@hiero-ledger/sdk";
import { ContractByteCodeQuery as SdkContractByteCodeQuery } from "@hiero-ledger/sdk";
import type { IHieroContext } from "../../../context/index.js";
import { QueryExecutor } from "../../transaction/index.js";
import type { QueryOptions } from "../../transaction/index.js";

/**
 * Fetch the deployed runtime bytecode for a contract.
 *
 * Returns the raw bytes (not hex-encoded). Useful for proxy detection,
 * implementation comparison, or off-chain verification against a known
 * source build.
 */
export class ContractBytecodeQuery {
    private readonly executor: QueryExecutor;

    constructor(context: IHieroContext) {
        this.executor = new QueryExecutor(context);
    }

    async execute(
        contractId: string | ContractId,
        options: QueryOptions = {},
    ): Promise<Uint8Array> {
        return await this.executor.run(
            () => new SdkContractByteCodeQuery().setContractId(contractId),
            options,
            "ContractService.getContractBytecode",
        );
    }
}
