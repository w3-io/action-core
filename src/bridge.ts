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
 *   import { bridge, ethereum } from "@w3-io/action-core";
 *
 *   // Typed helpers (recommended — autocomplete + type checking):
 *   const receipt = await ethereum.callContract({
 *     contract: "0x...",
 *     method: "deposit(uint256)",
 *     args: ["1000000"],
 *     gasMultiplier: "1.5",
 *   });
 *
 *   // Generic (full control):
 *   const balance = await bridge.chain("ethereum", "get-balance", {
 *     address: "0x...",
 *   });
 *
 *   const hash = await bridge.crypto("keccak-256", { data: "0xdeadbeef" });
 */

import { W3ActionError } from "./error.js";
import type { ChainFamilies } from "./chain-types.js";

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

async function crypto(
  action: string,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return (await bridgeRequest(`/crypto/${action}`, {
    params,
  })) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Public API — typed chain helpers
// ---------------------------------------------------------------------------

/** Typed Ethereum operations. */
export const ethereum = {
  getBalance: (params: ChainFamilies["ethereum"]["get-balance"]["params"], network?: string) =>
    chainRequest("ethereum", "get-balance", params, network),

  readContract: (params: ChainFamilies["ethereum"]["read-contract"]["params"], network?: string) =>
    chainRequest("ethereum", "read-contract", params, network),

  callContract: (params: ChainFamilies["ethereum"]["call-contract"]["params"], network?: string) =>
    chainRequest("ethereum", "call-contract", params, network),

  transfer: (params: ChainFamilies["ethereum"]["transfer"]["params"], network?: string) =>
    chainRequest("ethereum", "transfer", params, network),

  sendTransaction: (params: ChainFamilies["ethereum"]["send-transaction"]["params"], network?: string) =>
    chainRequest("ethereum", "send-transaction", params, network),

  deployContract: (params: ChainFamilies["ethereum"]["deploy-contract"]["params"], network?: string) =>
    chainRequest("ethereum", "deploy-contract", params, network),

  transferToken: (params: ChainFamilies["ethereum"]["transfer-token"]["params"], network?: string) =>
    chainRequest("ethereum", "transfer-token", params, network),

  approveToken: (params: ChainFamilies["ethereum"]["approve-token"]["params"], network?: string) =>
    chainRequest("ethereum", "approve-token", params, network),

  transferNft: (params: ChainFamilies["ethereum"]["transfer-nft"]["params"], network?: string) =>
    chainRequest("ethereum", "transfer-nft", params, network),

  getTransaction: (params: ChainFamilies["ethereum"]["get-transaction"]["params"], network?: string) =>
    chainRequest("ethereum", "get-transaction", params, network),

  waitForTransaction: (params: ChainFamilies["ethereum"]["wait-for-transaction"]["params"], network?: string) =>
    chainRequest("ethereum", "wait-for-transaction", params, network),

  getEvents: (params: ChainFamilies["ethereum"]["get-events"]["params"], network?: string) =>
    chainRequest("ethereum", "get-events", params, network),

  resolveName: (params: ChainFamilies["ethereum"]["resolve-name"]["params"], network?: string) =>
    chainRequest("ethereum", "resolve-name", params, network),

  getTokenBalance: (params: ChainFamilies["ethereum"]["get-token-balance"]["params"], network?: string) =>
    chainRequest("ethereum", "get-token-balance", params, network),

  getTokenAllowance: (params: ChainFamilies["ethereum"]["get-token-allowance"]["params"], network?: string) =>
    chainRequest("ethereum", "get-token-allowance", params, network),

  getNftOwner: (params: ChainFamilies["ethereum"]["get-nft-owner"]["params"], network?: string) =>
    chainRequest("ethereum", "get-nft-owner", params, network),

  getNftMetadata: (params: ChainFamilies["ethereum"]["get-nft-metadata"]["params"], network?: string) =>
    chainRequest("ethereum", "get-nft-metadata", params, network),
};

/** Typed Solana operations. */
export const solana = {
  getBalance: (params: ChainFamilies["solana"]["get-balance"]["params"], network?: string) =>
    chainRequest("solana", "get-balance", params, network),

  transfer: (params: ChainFamilies["solana"]["transfer"]["params"], network?: string) =>
    chainRequest("solana", "transfer", params, network),

  transferToken: (params: ChainFamilies["solana"]["transfer-token"]["params"], network?: string) =>
    chainRequest("solana", "transfer-token", params, network),

  callProgram: (params: ChainFamilies["solana"]["call-program"]["params"], network?: string) =>
    chainRequest("solana", "call-program", params, network),

  getAccount: (params: ChainFamilies["solana"]["get-account"]["params"], network?: string) =>
    chainRequest("solana", "get-account", params, network),

  getTokenBalance: (params: ChainFamilies["solana"]["get-token-balance"]["params"], network?: string) =>
    chainRequest("solana", "get-token-balance", params, network),

  getTokenAccounts: (params: ChainFamilies["solana"]["get-token-accounts"]["params"], network?: string) =>
    chainRequest("solana", "get-token-accounts", params, network),

  getTransaction: (params: ChainFamilies["solana"]["get-transaction"]["params"], network?: string) =>
    chainRequest("solana", "get-transaction", params, network),

  waitForTransaction: (params: ChainFamilies["solana"]["wait-for-transaction"]["params"], network?: string) =>
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
  getBalance: (params: ChainFamilies["bitcoin"]["get-balance"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-balance", params, network),

  send: (params: ChainFamilies["bitcoin"]["send"]["params"], network?: string) =>
    chainRequest("bitcoin", "send", params, network),

  getUtxos: (params: ChainFamilies["bitcoin"]["get-utxos"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-utxos", params, network),

  getTransaction: (params: ChainFamilies["bitcoin"]["get-transaction"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-transaction", params, network),

  getFeeRate: (params?: ChainFamilies["bitcoin"]["get-fee-rate"]["params"], network?: string) =>
    chainRequest("bitcoin", "get-fee-rate", params ?? {}, network),

  waitForTransaction: (params: ChainFamilies["bitcoin"]["wait-for-transaction"]["params"], network?: string) =>
    chainRequest("bitcoin", "wait-for-transaction", params, network),
};

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

/**
 * The bridge client.
 *
 *   import { bridge, ethereum, solana, bitcoin } from "@w3-io/action-core";
 *
 *   // Typed (recommended):
 *   const receipt = await ethereum.callContract({ contract, method, args });
 *   const sig = await solana.callProgram({ programId, accounts, data });
 *   const tx = await bitcoin.send({ to, amount });
 *
 *   // Generic:
 *   const bal = await bridge.chain("ethereum", "get-balance", { address });
 *   const hash = await bridge.crypto("keccak-256", { data: "0x..." });
 *   const ok = await bridge.health();
 */
export const bridge = {
  health,
  chain,
  crypto,
};
