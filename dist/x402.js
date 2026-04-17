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
import { ethereum } from "./bridge.js";
/**
 * Build an EIP-4361 SIWE plaintext message.
 *
 * The format is deterministic — no external SIWE library needed.
 * See: https://eips.ethereum.org/EIPS/eip-4361
 */
export function buildSiweMessage(params) {
    const { domain, address, statement = "Sign in with Ethereum", uri, version = "1", chainId, nonce, issuedAt, expirationTime, } = params;
    // EIP-4361 specifies this exact format
    let message = `${domain} wants you to sign in with your Ethereum account:\n`;
    message += `${address}\n`;
    message += `\n`;
    message += `${statement}\n`;
    message += `\n`;
    message += `URI: ${uri}\n`;
    message += `Version: ${version}\n`;
    message += `Chain ID: ${chainId}\n`;
    message += `Nonce: ${nonce}\n`;
    message += `Issued At: ${issuedAt}\n`;
    message += `Expiration Time: ${expirationTime}`;
    return message;
}
// ---------------------------------------------------------------------------
// Nonce generator
// ---------------------------------------------------------------------------
/** Generate a random 16-character hex nonce. */
export function randomNonce() {
    const bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
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
export function createX402Signer(options) {
    const { domain, chainId, statement, expiryMs = 5 * 60 * 1000, } = options;
    let cachedAddress = null;
    return async function signSiwe(requestUrl) {
        // Get signer address (cached after first call)
        if (!cachedAddress) {
            const result = await ethereum.getSignerAddress({});
            cachedAddress = result.address;
        }
        // Build fresh SIWE message
        const now = new Date();
        const expiry = new Date(now.getTime() + expiryMs);
        const message = buildSiweMessage({
            domain,
            address: cachedAddress,
            statement,
            uri: requestUrl,
            chainId,
            nonce: randomNonce(),
            issuedAt: now.toISOString(),
            expirationTime: expiry.toISOString(),
        });
        // Sign via bridge (EIP-191 personal_sign)
        const { signature } = (await ethereum.signMessage({ message }));
        // Build the header payload
        const payload = {
            address: cachedAddress,
            message,
            signature,
            timestamp: now.getTime(),
            chainId,
        };
        return {
            "X-Sign-In-With-X": btoa(JSON.stringify(payload)),
        };
    };
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
export function createX402Fetch(options) {
    const { baseFetch = fetch, ...signerOptions } = options;
    const signer = createX402Signer(signerOptions);
    return async function x402Fetch(input, init) {
        const url = typeof input === "string"
            ? input
            : input instanceof URL
                ? input.toString()
                : input.url;
        const authHeaders = await signer(url);
        const mergedInit = {
            ...init,
            headers: {
                ...Object.fromEntries(new Headers(init?.headers).entries()),
                ...authHeaders,
            },
        };
        return baseFetch(input, mergedInit);
    };
}
