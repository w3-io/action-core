/**
 * TypeScript types for W3 chain operations.
 *
 * These types document every parameter accepted by `bridge.chain()`.
 * They're derived from the protocol implementation in w3-io/protocol
 * (chain-core and chain crates).
 *
 * Usage with the typed helpers:
 *
 *   import { ethereum, solana, bitcoin } from "@w3-io/action-core";
 *
 *   const receipt = await ethereum.callContract({
 *     contract: "0x...",
 *     method: "deposit(uint256)",
 *     args: ["1000000"],
 *   });
 *
 * Or with the generic bridge.chain() for full control:
 *
 *   import { bridge } from "@w3-io/action-core";
 *
 *   const receipt = await bridge.chain("ethereum", "call-contract", {
 *     contract: "0x...",
 *     method: "deposit(uint256)",
 *     args: ["1000000"],
 *     gasMultiplier: "1.5",
 *   });
 */
export {};
