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
 *   import { bridge } from "@w3-io/action-core";
 *
 *   const balance = await bridge.chain("ethereum", "get-balance", {
 *     address: "0x...",
 *   });
 *
 *   const hash = await bridge.crypto("keccak-256", { data: "0xdeadbeef" });
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
// Public API
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
async function chain(chainName, action, params, network) {
    return (await bridgeRequest(`/${chainName}/${action}`, {
        network: network ?? chainName,
        params,
    }));
}
async function crypto(action, params) {
    return (await bridgeRequest(`/crypto/${action}`, {
        params,
    }));
}
/**
 * The bridge client.
 *
 *   import { bridge } from "@w3-io/action-core";
 *
 *   const bal = await bridge.chain("ethereum", "get-balance", { address });
 *   const hash = await bridge.crypto("keccak-256", { data: "0x..." });
 *   const ok = await bridge.health();
 */
export const bridge = {
    health,
    chain,
    crypto,
};
