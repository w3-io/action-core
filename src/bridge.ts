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

import { W3ActionError } from "./error.js";
import type { SyscallFamilies, CryptoSyscalls } from "./chain-types.js";

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function resolveEndpoint(): { url: string; socketPath?: string } {
  const bridgeUrl = process.env.W3_BRIDGE_URL;
  if (bridgeUrl) {
    return { url: bridgeUrl };
  }
  const socketPath =
    process.env.W3_BRIDGE_SOCKET ?? "/var/run/w3/bridge.sock";
  return { url: "http://localhost", socketPath };
}

async function bridgeRequest(
  path: string,
  body?: unknown,
): Promise<unknown> {
  const { url, socketPath } = resolveEndpoint();

  if (socketPath) {
    const http = await import("node:http");
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        {
          socketPath,
          path,
          method: body ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            ...(payload
              ? { "Content-Length": Buffer.byteLength(payload) }
              : {}),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk: string) => (data += chunk));
          res.on("end", () => {
            if (!res.statusCode || res.statusCode >= 400) {
              try {
                const err = JSON.parse(data);
                reject(
                  new W3ActionError(
                    err.code ?? "BRIDGE_ERROR",
                    err.error ?? `Bridge returned ${res.statusCode}`,
                    { statusCode: res.statusCode, details: err },
                  ),
                );
              } catch {
                reject(
                  new W3ActionError(
                    "BRIDGE_ERROR",
                    data || `HTTP ${res.statusCode}`,
                    { statusCode: res.statusCode },
                  ),
                );
              }
              return;
            }
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          });
        },
      );
      req.on("error", (err: Error) =>
        reject(new W3ActionError("BRIDGE_UNAVAILABLE", err.message)),
      );
      if (payload) req.write(payload);
      req.end();
    });
  }

  // TCP transport via fetch
  const fullUrl = `${url}${path}`;
  const init: RequestInit = {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(fullUrl, init);
  const text = await res.text();
  if (!res.ok) {
    let parsed: Record<string, unknown> | undefined;
    try {
      parsed = JSON.parse(text);
    } catch {
      // not JSON
    }
    throw new W3ActionError(
      (parsed?.code as string) ?? "BRIDGE_ERROR",
      (parsed?.error as string) ?? text ?? `Bridge returned ${res.status}`,
      { statusCode: res.status, details: parsed },
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chainRequest(
  chainName: string,
  action: string,
  params: Record<string, any>,
  network?: string,
): Promise<Record<string, unknown>> {
  return bridgeRequest(`/${chainName}/${action}`, {
    network: network ?? chainName,
    params,
  }) as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Public API — generic
// ---------------------------------------------------------------------------

async function health(): Promise<boolean> {
  try {
    const res = (await bridgeRequest("/health")) as { ok?: boolean };
    return res.ok === true;
  } catch {
    return false;
  }
}

/**
 * Execute a chain operation.
 *
 * For type-safe calls, use the typed helpers (`ethereum`, `solana`,
 * `bitcoin`) instead. This generic method accepts any params.
 */
async function chain(
  chainName: string,
  action: string,
  params: Record<string, unknown>,
  network?: string,
): Promise<Record<string, unknown>> {
  return chainRequest(chainName, action, params, network);
}

// ---------------------------------------------------------------------------
// Public API — typed chain helpers
// ---------------------------------------------------------------------------

/** Typed Ethereum operations. */
export const ethereum = {
  getBalance: (params: SyscallFamilies["ethereum"]["get-balance"]["params"], network?: string) =>
    chainRequest("ethereum", "get-balance", params, network),

  readContract: (params: SyscallFamilies["ethereum"]["read-contract"]["params"], network?: string) =>
    chainRequest("ethereum", "read-contract", params, network),

  callContract: (params: SyscallFamilies["ethereum"]["call-contract"]["params"], network?: string) =>
    chainRequest("ethereum", "call-contract", params, network),

  transfer: (params: SyscallFamilies["ethereum"]["transfer"]["params"], network?: string) =>
    chainRequest("ethereum", "transfer", params, network),

  sendTransaction: (params: SyscallFamilies["ethereum"]["send-transaction"]["params"], network?: string) =>
    chainRequest("ethereum", "send-transaction", params, network),

  deployContract: (params: SyscallFamilies["ethereum"]["deploy-contract"]["params"], network?: string) =>
    chainRequest("ethereum", "deploy-contract", params, network),

  transferToken: (params: SyscallFamilies["ethereum"]["transfer-token"]["params"], network?: string) =>
    chainRequest("ethereum", "transfer-token", params, network),

  approveToken: (params: SyscallFamilies["ethereum"]["approve-token"]["params"], network?: string) =>
    chainRequest("ethereum", "approve-token", params, network),

  transferNft: (params: SyscallFamilies["ethereum"]["transfer-nft"]["params"], network?: string) =>
    chainRequest("ethereum", "transfer-nft", params, network),

  getTransaction: (params: SyscallFamilies["ethereum"]["get-transaction"]["params"], network?: string) =>
    chainRequest("ethereum", "get-transaction", params, network),

  waitForTransaction: (params: SyscallFamilies["ethereum"]["wait-for-transaction"]["params"], network?: string) =>
    chainRequest("ethereum", "wait-for-transaction", params, network),

  getEvents: (params: SyscallFamilies["ethereum"]["get-events"]["params"], network?: string) =>
    chainRequest("ethereum", "get-events", params, network),

  getSignerAddress: (params: SyscallFamilies["ethereum"]["get-signer-address"]["params"], network?: string) =>
    chainRequest("ethereum", "get-signer-address", params, network),

  resolveName: (params: SyscallFamilies["ethereum"]["resolve-name"]["params"], network?: string) =>
    chainRequest("ethereum", "resolve-name", params, network),

  /** Reverse-resolve an address to an ENS name. Includes forward verification to prevent spoofing. */
  reverseResolveName: (params: SyscallFamilies["ethereum"]["reverse-resolve-name"]["params"], network?: string) =>
    chainRequest("ethereum", "reverse-resolve-name", params, network),

  signMessage: (params: SyscallFamilies["ethereum"]["sign-message"]["params"], network?: string) =>
    chainRequest("ethereum", "sign-message", params, network),

  signTypedData: (params: SyscallFamilies["ethereum"]["sign-typed-data"]["params"], network?: string) =>
    chainRequest("ethereum", "sign-typed-data", params, network),

  getTokenBalance: (params: SyscallFamilies["ethereum"]["get-token-balance"]["params"], network?: string) =>
    chainRequest("ethereum", "get-token-balance", params, network),

  getTokenAllowance: (params: SyscallFamilies["ethereum"]["get-token-allowance"]["params"], network?: string) =>
    chainRequest("ethereum", "get-token-allowance", params, network),

  getNftOwner: (params: SyscallFamilies["ethereum"]["get-nft-owner"]["params"], network?: string) =>
    chainRequest("ethereum", "get-nft-owner", params, network),

  getNftMetadata: (params: SyscallFamilies["ethereum"]["get-nft-metadata"]["params"], network?: string) =>
    chainRequest("ethereum", "get-nft-metadata", params, network),
};

/** Typed Solana operations. */
export const solana = {
  getBalance: (params: SyscallFamilies["solana"]["get-balance"]["params"], network?: string) =>
    chainRequest("solana", "get-balance", params, network),

  transfer: (params: SyscallFamilies["solana"]["transfer"]["params"], network?: string) =>
    chainRequest("solana", "transfer", params, network),

  transferToken: (params: SyscallFamilies["solana"]["transfer-token"]["params"], network?: string) =>
    chainRequest("solana", "transfer-token", params, network),

  callProgram: (params: SyscallFamilies["solana"]["call-program"]["params"], network?: string) =>
    chainRequest("solana", "call-program", params, network),

  getAccount: (params: SyscallFamilies["solana"]["get-account"]["params"], network?: string) =>
    chainRequest("solana", "get-account", params, network),

  getTokenBalance: (params: SyscallFamilies["solana"]["get-token-balance"]["params"], network?: string) =>
    chainRequest("solana", "get-token-balance", params, network),

  getTokenAccounts: (params: SyscallFamilies["solana"]["get-token-accounts"]["params"], network?: string) =>
    chainRequest("solana", "get-token-accounts", params, network),

  getTransaction: (params: SyscallFamilies["solana"]["get-transaction"]["params"], network?: string) =>
    chainRequest("solana", "get-transaction", params, network),

  waitForTransaction: (params: SyscallFamilies["solana"]["wait-for-transaction"]["params"], network?: string) =>
    chainRequest("solana", "wait-for-transaction", params, network),

  /** Generate an ephemeral keypair for use as an additional signer. */
  generateKeypair: () =>
    bridgeRequest("/solana/generate-keypair", {}) as Promise<Record<string, unknown>>,

  /** Get the payer's public key (no secret exposed). */
  payerAddress: () =>
    bridgeRequest("/solana/payer-address") as Promise<Record<string, unknown>>,
};

/** Typed Bitcoin operations. */
export const bitcoin = {
  getBalance: (params: SyscallFamilies["bitcoin"]["get-balance"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-balance", params, network),

  send: (params: SyscallFamilies["bitcoin"]["send"]["params"], network?: string) =>
    chainRequest("bitcoin", "send", params, network),

  getUtxos: (params: SyscallFamilies["bitcoin"]["get-utxos"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-utxos", params, network),

  getTransaction: (params: SyscallFamilies["bitcoin"]["get-transaction"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-transaction", params, network),

  getFeeRate: (params?: SyscallFamilies["bitcoin"]["get-fee-rate"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-fee-rate", params ?? {}, network),

  waitForTransaction: (params: SyscallFamilies["bitcoin"]["wait-for-transaction"]["params"], network?: string) =>
    chainRequest("bitcoin", "wait-for-transaction", params, network),
};

// ---------------------------------------------------------------------------
// Public API — typed crypto helpers
// ---------------------------------------------------------------------------

function cryptoRequest<K extends keyof CryptoSyscalls>(
  action: K,
  params: CryptoSyscalls[K]["params"],
): Promise<CryptoSyscalls[K]["result"]> {
  return bridgeRequest(`/crypto/${action}`, { params }) as Promise<CryptoSyscalls[K]["result"]>;
}

/**
 * Typed crypto operations.
 *
 *   import { crypto } from "@w3-io/action-core";
 *
 *   const { hash } = await crypto.keccak256({ data: "0xdeadbeef" });
 *   const { code } = await crypto.totp({ secret: "0x..." });
 *   const { token } = await crypto.jwtSign({ claims: '{"sub":"1"}', key: "secret" });
 */
export const crypto = {
  /** Keccak-256 hash. Returns `{ hash: "0x..." }`. */
  keccak256: (params: CryptoSyscalls["keccak256"]["params"]) =>
    cryptoRequest("keccak256", params),

  /** AES-256-GCM encrypt. Returns `{ ciphertext: "0x..." }`. */
  aesEncrypt: (params: CryptoSyscalls["aes-encrypt"]["params"]) =>
    cryptoRequest("aes-encrypt", params),

  /** AES-256-GCM decrypt. Returns `{ plaintext: "0x..." }`. */
  aesDecrypt: (params: CryptoSyscalls["aes-decrypt"]["params"]) =>
    cryptoRequest("aes-decrypt", params),

  /** Ed25519 sign. Returns `{ signature: "0x..." }`. */
  ed25519Sign: (params: CryptoSyscalls["ed25519-sign"]["params"]) =>
    cryptoRequest("ed25519-sign", params),

  /** Ed25519 verify. Returns `{ valid: boolean }`. */
  ed25519Verify: async (params: CryptoSyscalls["ed25519-verify"]["params"]) => {
    const raw = await cryptoRequest("ed25519-verify", params);
    return { ...raw, valid: String(raw.valid) === "true" };
  },

  /** Ed25519 public key from private key. Returns `{ publicKey: "0x..." }`. */
  ed25519PublicKey: (params: CryptoSyscalls["ed25519-public-key"]["params"]) =>
    cryptoRequest("ed25519-public-key", params),

  /** HKDF-SHA256 key derivation. Returns `{ key: "0x..." }`. */
  hkdf: (params: CryptoSyscalls["hkdf"]["params"]) =>
    cryptoRequest("hkdf", params),

  /** Create a signed JWT. Returns `{ token: "eyJ..." }`. */
  jwtSign: (params: CryptoSyscalls["jwt-sign"]["params"]) =>
    cryptoRequest("jwt-sign", params),

  /** Verify and decode a JWT. Returns `{ valid: boolean, claims: string }`. */
  jwtVerify: async (params: CryptoSyscalls["jwt-verify"]["params"]) => {
    const raw = await cryptoRequest("jwt-verify", params);
    return { ...raw, valid: String(raw.valid) === "true" };
  },

  /** Generate a TOTP code. Returns `{ code: "123456" }`. */
  totp: (params: CryptoSyscalls["totp"]["params"]) =>
    cryptoRequest("totp", params),
};

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

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
export const bridge = {
  health,
  chain,
};
