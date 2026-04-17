/**
 * x402 / SIWE (EIP-4361) authentication helpers.
 *
 * Enables W3 actions to authenticate with x402-compatible APIs using
 * wallet-based identity. The bridge provides signing — the private
 * key never leaves the bridge process.
 *
 * Usage:
 *
 *   import { createX402Fetch } from "@w3-io/action-core";
 *
 *   const x402fetch = createX402Fetch({
 *     domain: "api.venice.ai",
 *     chainId: 8453,
 *   });
 *
 *   // Uses SIWE auth automatically — no API key needed
 *   const res = await x402fetch("https://api.venice.ai/api/v1/models");
 */
export interface SiweMessageParams {
    domain: string;
    address: string;
    statement?: string;
    uri: string;
    version?: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
    expirationTime: string;
}
/**
 * Build an EIP-4361 SIWE plaintext message.
 *
 * The format is deterministic — no external SIWE library needed.
 * See: https://eips.ethereum.org/EIPS/eip-4361
 */
export declare function buildSiweMessage(params: SiweMessageParams): string;
/** Generate a random 16-character hex nonce. */
export declare function randomNonce(): string;
export interface X402SignerOptions {
    /** SIWE domain (e.g. "api.venice.ai") */
    domain: string;
    /** EIP-155 chain ID (e.g. 8453 for Base) */
    chainId: number;
    /** SIWE statement (default: "Sign in with Ethereum") */
    statement?: string;
    /** Expiry duration in milliseconds (default: 5 minutes) */
    expiryMs?: number;
}
export type X402Signer = (requestUrl: string) => Promise<Record<string, string>>;
/**
 * Create a signer function that produces fresh SIWE auth headers.
 *
 * Returns an async function that, given a request URL, constructs
 * a SIWE message, signs it via the bridge, and returns the header
 * object to attach to the request.
 *
 * The signer address is cached after the first call. The SIWE
 * message is generated fresh each time (nonce + timestamp).
 */
export declare function createX402Signer(options: X402SignerOptions): X402Signer;
export interface X402FetchOptions extends X402SignerOptions {
    /** Base fetch function to wrap (defaults to global fetch) */
    baseFetch?: typeof fetch;
}
/**
 * Create a fetch function that automatically attaches SIWE auth headers.
 *
 * Drop-in replacement for `fetch` — same signature, same behavior,
 * but every request gets a fresh `X-Sign-In-With-X` header.
 *
 *   const x402fetch = createX402Fetch({ domain: "api.venice.ai", chainId: 8453 });
 *   const res = await x402fetch("https://api.venice.ai/api/v1/models");
 */
export declare function createX402Fetch(options: X402FetchOptions): typeof fetch;
