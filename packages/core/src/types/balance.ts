/**
 * HBAR balance of an account.
 */
export interface Balance {
    /** Account ID */
    accountId: string;
    /** HBAR balance in tinybars — decimal string; `BigInt(x)` for arithmetic */
    tinybars: string;
}

/**
 * Balance of a specific token held by an account.
 */
export interface TokenBalance {
    /** Token ID */
    tokenId: string;
    /** Balance amount (string for precision with large values) */
    balance: string;
    /** Token decimals */
    decimals: number;
}
