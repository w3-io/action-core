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

// ---------------------------------------------------------------------------
// SIWE message builder (EIP-4361)
// ---------------------------------------------------------------------------

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
export function buildSiweMessage(params: SiweMessageParams): string {
  const {
    domain,
    address,
    statement = "Sign in with Ethereum",
    uri,
    version = "1",
    chainId,
    nonce,
    issuedAt,
    expirationTime,
  } = params;

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
export function randomNonce(): string {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// SIWE signer factory
// ---------------------------------------------------------------------------

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

export type X402Signer = (
  requestUrl: string,
) => Promise<Record<string, string>>;

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
export function createX402Signer(options: X402SignerOptions): X402Signer {
  const {
    domain,
    chainId,
    statement,
    expiryMs = 5 * 60 * 1000,
  } = options;

  let cachedAddress: string | null = null;

  return async function signSiwe(requestUrl: string) {
    // Get signer address (cached after first call)
    if (!cachedAddress) {
      const result = await ethereum.getSignerAddress({});
      cachedAddress = result.address as string;
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
    const { signature } = (await ethereum.signMessage({ message })) as {
      signature: string;
    };

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

// ---------------------------------------------------------------------------
// x402-aware fetch wrapper
// ---------------------------------------------------------------------------

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
export function createX402Fetch(options: X402FetchOptions): typeof fetch {
  const { baseFetch = fetch, ...signerOptions } = options;
  const signer = createX402Signer(signerOptions);

  return async function x402Fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const authHeaders = await signer(url);

    const mergedInit: RequestInit = {
      ...init,
      headers: {
        ...Object.fromEntries(
          new Headers(init?.headers).entries(),
        ),
        ...authHeaders,
      },
    };

    return baseFetch(input, mergedInit);
  } as typeof fetch;
}
