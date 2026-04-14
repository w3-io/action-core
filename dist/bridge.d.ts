/**
 * W3 Syscall Bridge client.
 *
 * The bridge is an HTTP server running on a Unix socket (production)
 * or TCP port (macOS dev fallback), started per-step by the Docker
 * backend. It provides access to chain operations, cryptographic
 * primitives, and protocol-managed secrets without bundling SDKs
 * in the action container.
 *
 * Connection is automatic:
 *   - $W3_BRIDGE_SOCKET → Unix socket (production)
 *   - $W3_BRIDGE_URL    → TCP URL (macOS Docker Desktop fallback)
 *
 * Usage:
 *   import { bridge, ethereum, solana, bitcoin, crypto } from "@w3-io/action-core";
 *
 *   // Typed helpers (recommended — autocomplete + type checking):
 *   const receipt = await ethereum.callContract({ contract, method, args });
 *   const { hash } = await crypto.keccak256({ data: "0xdeadbeef" });
 *   const resolved = await ethereum.resolveName({ name: "vitalik.eth" });
 *
 *   // Generic (full control):
 *   const balance = await bridge.chain("ethereum", "get-balance", { address: "0x..." });
 */
import type { SyscallFamilies, CryptoSyscalls } from "./chain-types.js";
declare function health(): Promise<boolean>;
/**
 * Execute a chain operation.
 *
 * For type-safe calls, use the typed helpers (`ethereum`, `solana`,
 * `bitcoin`) instead. This generic method accepts any params.
 */
declare function chain(chainName: string, action: string, params: Record<string, unknown>, network?: string): Promise<Record<string, unknown>>;
/** Typed Ethereum operations. */
export declare const ethereum: {
    getBalance: (params: SyscallFamilies["ethereum"]["get-balance"]["params"], network?: string) => Promise<Record<string, unknown>>;
    readContract: (params: SyscallFamilies["ethereum"]["read-contract"]["params"], network?: string) => Promise<Record<string, unknown>>;
    callContract: (params: SyscallFamilies["ethereum"]["call-contract"]["params"], network?: string) => Promise<Record<string, unknown>>;
    transfer: (params: SyscallFamilies["ethereum"]["transfer"]["params"], network?: string) => Promise<Record<string, unknown>>;
    sendTransaction: (params: SyscallFamilies["ethereum"]["send-transaction"]["params"], network?: string) => Promise<Record<string, unknown>>;
    deployContract: (params: SyscallFamilies["ethereum"]["deploy-contract"]["params"], network?: string) => Promise<Record<string, unknown>>;
    transferToken: (params: SyscallFamilies["ethereum"]["transfer-token"]["params"], network?: string) => Promise<Record<string, unknown>>;
    approveToken: (params: SyscallFamilies["ethereum"]["approve-token"]["params"], network?: string) => Promise<Record<string, unknown>>;
    transferNft: (params: SyscallFamilies["ethereum"]["transfer-nft"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getTransaction: (params: SyscallFamilies["ethereum"]["get-transaction"]["params"], network?: string) => Promise<Record<string, unknown>>;
    waitForTransaction: (params: SyscallFamilies["ethereum"]["wait-for-transaction"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getEvents: (params: SyscallFamilies["ethereum"]["get-events"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getSignerAddress: (params: SyscallFamilies["ethereum"]["get-signer-address"]["params"], network?: string) => Promise<Record<string, unknown>>;
    resolveName: (params: SyscallFamilies["ethereum"]["resolve-name"]["params"], network?: string) => Promise<Record<string, unknown>>;
    /** Reverse-resolve an address to an ENS name. Includes forward verification to prevent spoofing. */
    reverseResolveName: (params: SyscallFamilies["ethereum"]["reverse-resolve-name"]["params"], network?: string) => Promise<Record<string, unknown>>;
    signMessage: (params: SyscallFamilies["ethereum"]["sign-message"]["params"], network?: string) => Promise<Record<string, unknown>>;
    signTypedData: (params: SyscallFamilies["ethereum"]["sign-typed-data"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getTokenBalance: (params: SyscallFamilies["ethereum"]["get-token-balance"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getTokenAllowance: (params: SyscallFamilies["ethereum"]["get-token-allowance"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getNftOwner: (params: SyscallFamilies["ethereum"]["get-nft-owner"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getNftMetadata: (params: SyscallFamilies["ethereum"]["get-nft-metadata"]["params"], network?: string) => Promise<Record<string, unknown>>;
};
/** Typed Solana operations. */
export declare const solana: {
    getBalance: (params: SyscallFamilies["solana"]["get-balance"]["params"], network?: string) => Promise<Record<string, unknown>>;
    transfer: (params: SyscallFamilies["solana"]["transfer"]["params"], network?: string) => Promise<Record<string, unknown>>;
    transferToken: (params: SyscallFamilies["solana"]["transfer-token"]["params"], network?: string) => Promise<Record<string, unknown>>;
    callProgram: (params: SyscallFamilies["solana"]["call-program"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getAccount: (params: SyscallFamilies["solana"]["get-account"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getTokenBalance: (params: SyscallFamilies["solana"]["get-token-balance"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getTokenAccounts: (params: SyscallFamilies["solana"]["get-token-accounts"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getTransaction: (params: SyscallFamilies["solana"]["get-transaction"]["params"], network?: string) => Promise<Record<string, unknown>>;
    waitForTransaction: (params: SyscallFamilies["solana"]["wait-for-transaction"]["params"], network?: string) => Promise<Record<string, unknown>>;
    /** Generate an ephemeral keypair for use as an additional signer. */
    generateKeypair: () => Promise<Record<string, unknown>>;
    /** Get the payer's public key (no secret exposed). */
    payerAddress: () => Promise<Record<string, unknown>>;
};
/** Typed Bitcoin operations. */
export declare const bitcoin: {
    getBalance: (params: SyscallFamilies["bitcoin"]["get-balance"]["params"], network?: string) => Promise<Record<string, unknown>>;
    send: (params: SyscallFamilies["bitcoin"]["send"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getUtxos: (params: SyscallFamilies["bitcoin"]["get-utxos"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getTransaction: (params: SyscallFamilies["bitcoin"]["get-transaction"]["params"], network?: string) => Promise<Record<string, unknown>>;
    getFeeRate: (params?: SyscallFamilies["bitcoin"]["get-fee-rate"]["params"], network?: string) => Promise<Record<string, unknown>>;
    waitForTransaction: (params: SyscallFamilies["bitcoin"]["wait-for-transaction"]["params"], network?: string) => Promise<Record<string, unknown>>;
};
/**
 * Typed crypto operations.
 *
 *   import { crypto } from "@w3-io/action-core";
 *
 *   const { hash } = await crypto.keccak256({ data: "0xdeadbeef" });
 *   const { code } = await crypto.totp({ secret: "0x..." });
 *   const { token } = await crypto.jwtSign({ claims: '{"sub":"1"}', key: "secret" });
 */
export declare const crypto: {
    /** Keccak-256 hash. Returns `{ hash: "0x..." }`. */
    keccak256: (params: CryptoSyscalls["keccak256"]["params"]) => Promise<{
        hash: string;
    }>;
    /** AES-256-GCM encrypt. Returns `{ ciphertext: "0x..." }`. */
    aesEncrypt: (params: CryptoSyscalls["aes-encrypt"]["params"]) => Promise<{
        ciphertext: string;
    }>;
    /** AES-256-GCM decrypt. Returns `{ plaintext: "0x..." }`. */
    aesDecrypt: (params: CryptoSyscalls["aes-decrypt"]["params"]) => Promise<{
        plaintext: string;
    }>;
    /** Ed25519 sign. Returns `{ signature: "0x..." }`. */
    ed25519Sign: (params: CryptoSyscalls["ed25519-sign"]["params"]) => Promise<{
        signature: string;
    }>;
    /** Ed25519 verify. Returns `{ valid: boolean }`. */
    ed25519Verify: (params: CryptoSyscalls["ed25519-verify"]["params"]) => Promise<{
        valid: boolean;
    }>;
    /** Ed25519 public key from private key. Returns `{ publicKey: "0x..." }`. */
    ed25519PublicKey: (params: CryptoSyscalls["ed25519-public-key"]["params"]) => Promise<{
        publicKey: string;
    }>;
    /** HKDF-SHA256 key derivation. Returns `{ key: "0x..." }`. */
    hkdf: (params: CryptoSyscalls["hkdf"]["params"]) => Promise<{
        key: string;
    }>;
    /** Create a signed JWT. Returns `{ token: "eyJ..." }`. */
    jwtSign: (params: CryptoSyscalls["jwt-sign"]["params"]) => Promise<{
        token: string;
    }>;
    /** Verify and decode a JWT. Returns `{ valid: boolean, claims: string }`. */
    jwtVerify: (params: CryptoSyscalls["jwt-verify"]["params"]) => Promise<{
        valid: boolean;
        claims: string;
    }>;
    /** Generate a TOTP code. Returns `{ code: "123456" }`. */
    totp: (params: CryptoSyscalls["totp"]["params"]) => Promise<{
        code: string;
    }>;
};
/**
 * The bridge client.
 *
 *   import { bridge, ethereum, solana, bitcoin, crypto } from "@w3-io/action-core";
 *
 *   // Typed (recommended):
 *   const receipt = await ethereum.callContract({ contract, method, args });
 *   const sig = await solana.callProgram({ programId, accounts, data });
 *   const tx = await bitcoin.send({ to, amount });
 *   const { hash } = await crypto.keccak256({ data: "0x..." });
 *   const { address } = await ethereum.resolveName({ name: "vitalik.eth" });
 *
 *   // Generic:
 *   const bal = await bridge.chain("ethereum", "get-balance", { address });
 */
export declare const bridge: {
    health: typeof health;
    chain: typeof chain;
};
export {};
