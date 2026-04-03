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
declare function health(): Promise<boolean>;
declare function chain(chainName: string, action: string, params: Record<string, unknown>, network?: string): Promise<Record<string, unknown>>;
declare function crypto(action: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
/**
 * The bridge client.
 *
 *   import { bridge } from "@w3-io/action-core";
 *
 *   const bal = await bridge.chain("ethereum", "get-balance", { address });
 *   const hash = await bridge.crypto("keccak-256", { data: "0x..." });
 *   const ok = await bridge.health();
 */
export declare const bridge: {
    health: typeof health;
    chain: typeof chain;
    crypto: typeof crypto;
};
export {};
