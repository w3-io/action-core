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
// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
function resolveEndpoint() {
    const bridgeUrl = process.env.W3_BRIDGE_URL;
    if (bridgeUrl) {
        return { url: bridgeUrl };
    }
    const socketPath = process.env.W3_BRIDGE_SOCKET ?? "/var/run/w3/bridge.sock";
    return { url: "http://localhost", socketPath };
}
async function bridgeRequest(path, body) {
    const { url, socketPath } = resolveEndpoint();
    if (socketPath) {
        const http = await import("node:http");
        return new Promise((resolve, reject) => {
            const payload = body ? JSON.stringify(body) : undefined;
            const req = http.request({
                socketPath,
                path,
                method: body ? "POST" : "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(payload
                        ? { "Content-Length": Buffer.byteLength(payload) }
                        : {}),
                },
            }, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    if (!res.statusCode || res.statusCode >= 400) {
                        try {
                            const err = JSON.parse(data);
                            reject(new W3ActionError(err.code ?? "BRIDGE_ERROR", err.error ?? `Bridge returned ${res.statusCode}`, { statusCode: res.statusCode, details: err }));
                        }
                        catch {
                            reject(new W3ActionError("BRIDGE_ERROR", data || `HTTP ${res.statusCode}`, { statusCode: res.statusCode }));
                        }
                        return;
                    }
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch {
                        resolve(data);
                    }
                });
            });
            req.on("error", (err) => reject(new W3ActionError("BRIDGE_UNAVAILABLE", err.message)));
            if (payload)
                req.write(payload);
            req.end();
        });
    }
    // TCP transport via fetch
    const fullUrl = `${url}${path}`;
    const init = {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
    };
    const res = await fetch(fullUrl, init);
    const text = await res.text();
    if (!res.ok) {
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch {
            // not JSON
        }
        throw new W3ActionError(parsed?.code ?? "BRIDGE_ERROR", parsed?.error ?? text ?? `Bridge returned ${res.status}`, { statusCode: res.status, details: parsed });
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chainRequest(chainName, action, params, network) {
    return bridgeRequest(`/${chainName}/${action}`, {
        network: network ?? chainName,
        params,
    });
}
// ---------------------------------------------------------------------------
// Public API — generic
// ---------------------------------------------------------------------------
async function health() {
    try {
        const res = (await bridgeRequest("/health"));
        return res.ok === true;
    }
    catch {
        return false;
    }
}
/**
 * Execute a chain operation.
 *
 * For type-safe calls, use the typed helpers (`ethereum`, `solana`,
 * `bitcoin`) instead. This generic method accepts any params.
 */
async function chain(chainName, action, params, network) {
    return chainRequest(chainName, action, params, network);
}
// ---------------------------------------------------------------------------
// Public API — typed chain helpers
// ---------------------------------------------------------------------------
/** Typed Ethereum operations. */
export const ethereum = {
    getBalance: (params, network) => chainRequest("ethereum", "get-balance", params, network),
    readContract: (params, network) => chainRequest("ethereum", "read-contract", params, network),
    callContract: (params, network) => chainRequest("ethereum", "call-contract", params, network),
    transfer: (params, network) => chainRequest("ethereum", "transfer", params, network),
    sendTransaction: (params, network) => chainRequest("ethereum", "send-transaction", params, network),
    deployContract: (params, network) => chainRequest("ethereum", "deploy-contract", params, network),
    transferToken: (params, network) => chainRequest("ethereum", "transfer-token", params, network),
    approveToken: (params, network) => chainRequest("ethereum", "approve-token", params, network),
    transferNft: (params, network) => chainRequest("ethereum", "transfer-nft", params, network),
    getTransaction: (params, network) => chainRequest("ethereum", "get-transaction", params, network),
    waitForTransaction: (params, network) => chainRequest("ethereum", "wait-for-transaction", params, network),
    getEvents: (params, network) => chainRequest("ethereum", "get-events", params, network),
    resolveName: (params, network) => chainRequest("ethereum", "resolve-name", params, network),
    /** Reverse-resolve an address to an ENS name. Includes forward verification to prevent spoofing. */
    reverseResolveName: (params, network) => chainRequest("ethereum", "reverse-resolve-name", params, network),
    getTokenBalance: (params, network) => chainRequest("ethereum", "get-token-balance", params, network),
    getTokenAllowance: (params, network) => chainRequest("ethereum", "get-token-allowance", params, network),
    getNftOwner: (params, network) => chainRequest("ethereum", "get-nft-owner", params, network),
    getNftMetadata: (params, network) => chainRequest("ethereum", "get-nft-metadata", params, network),
};
/** Typed Solana operations. */
export const solana = {
    getBalance: (params, network) => chainRequest("solana", "get-balance", params, network),
    transfer: (params, network) => chainRequest("solana", "transfer", params, network),
    transferToken: (params, network) => chainRequest("solana", "transfer-token", params, network),
    callProgram: (params, network) => chainRequest("solana", "call-program", params, network),
    getAccount: (params, network) => chainRequest("solana", "get-account", params, network),
    getTokenBalance: (params, network) => chainRequest("solana", "get-token-balance", params, network),
    getTokenAccounts: (params, network) => chainRequest("solana", "get-token-accounts", params, network),
    getTransaction: (params, network) => chainRequest("solana", "get-transaction", params, network),
    waitForTransaction: (params, network) => chainRequest("solana", "wait-for-transaction", params, network),
    /** Generate an ephemeral keypair for use as an additional signer. */
    generateKeypair: () => bridgeRequest("/solana/generate-keypair", {}),
    /** Get the payer's public key (no secret exposed). */
    payerAddress: () => bridgeRequest("/solana/payer-address"),
};
/** Typed Bitcoin operations. */
export const bitcoin = {
    getBalance: (params, network) => chainRequest("bitcoin", "get-balance", params, network),
    send: (params, network) => chainRequest("bitcoin", "send", params, network),
    getUtxos: (params, network) => chainRequest("bitcoin", "get-utxos", params, network),
    getTransaction: (params, network) => chainRequest("bitcoin", "get-transaction", params, network),
    getFeeRate: (params, network) => chainRequest("bitcoin", "get-fee-rate", params ?? {}, network),
    waitForTransaction: (params, network) => chainRequest("bitcoin", "wait-for-transaction", params, network),
};
// ---------------------------------------------------------------------------
// Public API — typed crypto helpers
// ---------------------------------------------------------------------------
function cryptoRequest(action, params) {
    return bridgeRequest(`/crypto/${action}`, { params });
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
    keccak256: (params) => cryptoRequest("keccak256", params),
    /** AES-256-GCM encrypt. Returns `{ ciphertext: "0x..." }`. */
    aesEncrypt: (params) => cryptoRequest("aes-encrypt", params),
    /** AES-256-GCM decrypt. Returns `{ plaintext: "0x..." }`. */
    aesDecrypt: (params) => cryptoRequest("aes-decrypt", params),
    /** Ed25519 sign. Returns `{ signature: "0x..." }`. */
    ed25519Sign: (params) => cryptoRequest("ed25519-sign", params),
    /** Ed25519 verify. Returns `{ valid: boolean }`. */
    ed25519Verify: async (params) => {
        const raw = await cryptoRequest("ed25519-verify", params);
        return { ...raw, valid: String(raw.valid) === "true" };
    },
    /** Ed25519 public key from private key. Returns `{ publicKey: "0x..." }`. */
    ed25519PublicKey: (params) => cryptoRequest("ed25519-public-key", params),
    /** HKDF-SHA256 key derivation. Returns `{ key: "0x..." }`. */
    hkdf: (params) => cryptoRequest("hkdf", params),
    /** Create a signed JWT. Returns `{ token: "eyJ..." }`. */
    jwtSign: (params) => cryptoRequest("jwt-sign", params),
    /** Verify and decode a JWT. Returns `{ valid: boolean, claims: string }`. */
    jwtVerify: async (params) => {
        const raw = await cryptoRequest("jwt-verify", params);
        return { ...raw, valid: String(raw.valid) === "true" };
    },
    /** Generate a TOTP code. Returns `{ code: "123456" }`. */
    totp: (params) => cryptoRequest("totp", params),
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
