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

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** Standard EVM transaction receipt outputs. */
export interface EvmReceipt {
  txHash: string;
  transactionId: string;
  blockNumber: string;
  gasUsed: string;
  status: "success" | "reverted";
  logs: string;
}

/** Standard Solana transaction outputs. */
export interface SolanaSignature {
  signature: string;
  transactionId: string;
}

/** Standard Bitcoin transaction outputs. */
export interface BitcoinSendResult {
  txid: string;
  transactionId: string;
  txHex: string;
  fee: string;
  feeRate: string;
  dustAbsorbed?: string;
}

// ---------------------------------------------------------------------------
// EVM — Gas Control
// ---------------------------------------------------------------------------

/** Gas control parameters available on all EVM write actions. */
export interface EvmGasParams {
  /**
   * Hard gas limit override. Skips estimation entirely.
   * When set, `gasMultiplier` is ignored.
   */
  gasLimit?: string;

  /**
   * Multiplier applied to `eth_estimateGas` result.
   * Must be in (0, 10]. Default: 1.3 for contract calls, 1.0 for transfers.
   * Ignored when `gasLimit` is set.
   */
  gasMultiplier?: string;
}

// ---------------------------------------------------------------------------
// EVM — Actions
// ---------------------------------------------------------------------------

export interface EvmGetBalanceParams {
  address: string;
  rpcUrl?: string;
}

export interface EvmGetBalanceResult {
  balance: string;
  balanceEth: string;
}

export interface EvmReadContractParams {
  contract: string;
  method: string;
  args?: unknown[];
  abi?: string;
  rpcUrl?: string;
}

export interface EvmReadContractResult {
  result: string;
}

export interface EvmCallContractParams extends EvmGasParams {
  contract: string;
  method: string;
  args?: unknown[];
  abi?: string;
  /** ETH to send with the call, in wei. */
  value?: string;
  rpcUrl?: string;
}

export interface EvmTransferParams extends EvmGasParams {
  to: string;
  /** Amount in the specified unit. */
  amount: string;
  /** Unit: "wei", "gwei", or "ether" (default). */
  unit?: string;
  rpcUrl?: string;
}

export interface EvmSendTransactionParams extends EvmGasParams {
  to: string;
  /** Hex-encoded calldata. */
  data?: string;
  /** Value in wei. */
  value?: string;
  rpcUrl?: string;
}

export interface EvmDeployContractParams extends EvmGasParams {
  /** Hex-encoded bytecode. */
  bytecode: string;
  rpcUrl?: string;
}

export interface EvmDeployContractResult extends EvmReceipt {
  contractAddress: string;
}

export interface EvmTransferTokenParams extends EvmGasParams {
  /** Token address or symbol (e.g., "USDC"). */
  token: string;
  to: string;
  /** Human-readable amount (e.g., "100.5"). */
  amount: string;
  rpcUrl?: string;
}

export interface EvmApproveTokenParams extends EvmGasParams {
  token: string;
  spender: string;
  amount: string;
  rpcUrl?: string;
}

export interface EvmTransferNftParams extends EvmGasParams {
  /** NFT contract address. */
  contract: string;
  tokenId: string;
  to: string;
  rpcUrl?: string;
}

export interface EvmGetTransactionParams {
  hash: string;
  rpcUrl?: string;
}

export interface EvmWaitForTransactionParams {
  hash: string;
  confirmations?: string;
  rpcUrl?: string;
}

export interface EvmGetEventsParams {
  address: string;
  topics?: string[];
  fromBlock?: string;
  toBlock?: string;
  rpcUrl?: string;
}

export interface EvmResolveNameParams {
  name: string;
  rpcUrl?: string;
}

export interface EvmGetTokenBalanceParams {
  token: string;
  address: string;
  rpcUrl?: string;
}

export interface EvmGetTokenAllowanceParams {
  token: string;
  owner: string;
  spender: string;
  rpcUrl?: string;
}

export interface EvmGetNftOwnerParams {
  token: string;
  tokenId: string;
  rpcUrl?: string;
}

export interface EvmGetNftMetadataParams {
  token: string;
  tokenId: string;
  rpcUrl?: string;
}

// ---------------------------------------------------------------------------
// Solana — Compute Budget
// ---------------------------------------------------------------------------

/** Compute budget parameters available on Solana write actions. */
export interface SolanaComputeParams {
  /**
   * Compute unit limit. Prepends a SetComputeUnitLimit instruction.
   * Must be a positive integer. Zero is rejected.
   */
  computeUnitLimit?: string;

  /**
   * Priority fee in micro-lamports per compute unit.
   * Prepends a SetComputeUnitPrice instruction.
   */
  computeUnitPrice?: string;
}

// ---------------------------------------------------------------------------
// Solana — Actions
// ---------------------------------------------------------------------------

export interface SolanaGetBalanceParams {
  address: string;
  rpcUrl?: string;
}

export interface SolanaTransferParams extends SolanaComputeParams {
  to: string;
  /** Amount in SOL (e.g., "0.5"). */
  amount: string;
  rpcUrl?: string;
}

export interface SolanaTransferTokenParams extends SolanaComputeParams {
  /** Token mint address (base58). */
  mint: string;
  to: string;
  /** Raw token amount (integer). */
  amount: string;
  /** Token program ID. Default: SPL Token. Use for Token-2022. */
  tokenProgram?: string;
  rpcUrl?: string;
}

export interface SolanaCallProgramParams extends SolanaComputeParams {
  /** Program ID (base58). */
  programId: string;
  /** Account metas: [{ pubkey, isSigner, isWritable }]. */
  accounts: Array<{
    pubkey: string;
    isSigner?: boolean;
    isWritable?: boolean;
  }>;
  /** Instruction data (hex with 0x prefix, or base64). */
  data?: string;
  /** Pubkeys of ephemeral keypairs to include as signers. */
  ephemeralSignerPubkeys?: string[];
  rpcUrl?: string;
}

export interface SolanaGetAccountParams {
  address: string;
  rpcUrl?: string;
}

export interface SolanaGetTokenBalanceParams {
  address: string;
  mint: string;
  rpcUrl?: string;
}

export interface SolanaGetTokenAccountsParams {
  owner: string;
  rpcUrl?: string;
}

export interface SolanaGetTransactionParams {
  signature: string;
  rpcUrl?: string;
}

export interface SolanaWaitForTransactionParams {
  signature: string;
  rpcUrl?: string;
}

// ---------------------------------------------------------------------------
// Bitcoin — Fee Control
// ---------------------------------------------------------------------------

/** Fee parameters for Bitcoin transactions. */
export interface BitcoinFeeParams {
  /**
   * Hard fee rate override in sat/vB. Skips estimation.
   * When set, `confirmationTarget` is ignored.
   */
  feeRate?: string;

  /**
   * Block target for fee estimation. Default: 6.
   * Ignored when `feeRate` is set.
   */
  confirmationTarget?: string;
}

// ---------------------------------------------------------------------------
// Bitcoin — Actions
// ---------------------------------------------------------------------------

export interface BitcoinGetBalanceParams {
  address: string;
}

export interface BitcoinSendParams extends BitcoinFeeParams {
  to: string;
  /** Amount in BTC (e.g., "0.001"). */
  amount: string;
  apiUrl?: string;
}

export interface BitcoinGetUtxosParams {
  address: string;
}

export interface BitcoinGetTransactionParams {
  txid: string;
}

export interface BitcoinGetFeeRateParams {}

export interface BitcoinWaitForTransactionParams {
  txid: string;
  confirmations?: string;
}

// ---------------------------------------------------------------------------
// Action map — maps chain + action to param/result types
// ---------------------------------------------------------------------------

/** EVM action parameter types keyed by action name. */
export interface EvmActions {
  "get-balance": { params: EvmGetBalanceParams; result: EvmGetBalanceResult };
  "read-contract": {
    params: EvmReadContractParams;
    result: EvmReadContractResult;
  };
  "call-contract": { params: EvmCallContractParams; result: EvmReceipt };
  transfer: { params: EvmTransferParams; result: EvmReceipt };
  "send-transaction": { params: EvmSendTransactionParams; result: EvmReceipt };
  "deploy-contract": {
    params: EvmDeployContractParams;
    result: EvmDeployContractResult;
  };
  "transfer-token": { params: EvmTransferTokenParams; result: EvmReceipt };
  "approve-token": { params: EvmApproveTokenParams; result: EvmReceipt };
  "transfer-nft": { params: EvmTransferNftParams; result: EvmReceipt };
  "get-transaction": {
    params: EvmGetTransactionParams;
    result: Record<string, string>;
  };
  "wait-for-transaction": {
    params: EvmWaitForTransactionParams;
    result: Record<string, string>;
  };
  "get-events": {
    params: EvmGetEventsParams;
    result: Record<string, string>;
  };
  "resolve-name": {
    params: EvmResolveNameParams;
    result: Record<string, string>;
  };
  "get-token-balance": {
    params: EvmGetTokenBalanceParams;
    result: Record<string, string>;
  };
  "get-token-allowance": {
    params: EvmGetTokenAllowanceParams;
    result: Record<string, string>;
  };
  "get-nft-owner": {
    params: EvmGetNftOwnerParams;
    result: Record<string, string>;
  };
  "get-nft-metadata": {
    params: EvmGetNftMetadataParams;
    result: Record<string, string>;
  };
}

/** Solana action parameter types keyed by action name. */
export interface SolanaActions {
  "get-balance": {
    params: SolanaGetBalanceParams;
    result: Record<string, string>;
  };
  transfer: { params: SolanaTransferParams; result: SolanaSignature };
  "transfer-token": {
    params: SolanaTransferTokenParams;
    result: SolanaSignature;
  };
  "call-program": {
    params: SolanaCallProgramParams;
    result: SolanaSignature;
  };
  "get-account": {
    params: SolanaGetAccountParams;
    result: Record<string, string>;
  };
  "get-token-balance": {
    params: SolanaGetTokenBalanceParams;
    result: Record<string, string>;
  };
  "get-token-accounts": {
    params: SolanaGetTokenAccountsParams;
    result: Record<string, string>;
  };
  "get-transaction": {
    params: SolanaGetTransactionParams;
    result: Record<string, string>;
  };
  "wait-for-transaction": {
    params: SolanaWaitForTransactionParams;
    result: Record<string, string>;
  };
}

/** Bitcoin action parameter types keyed by action name. */
export interface BitcoinActions {
  "get-balance": {
    params: BitcoinGetBalanceParams;
    result: Record<string, string>;
  };
  send: { params: BitcoinSendParams; result: BitcoinSendResult };
  "get-utxos": {
    params: BitcoinGetUtxosParams;
    result: Record<string, string>;
  };
  "get-transaction": {
    params: BitcoinGetTransactionParams;
    result: Record<string, string>;
  };
  "get-fee-rate": {
    params: BitcoinGetFeeRateParams;
    result: Record<string, string>;
  };
  "wait-for-transaction": {
    params: BitcoinWaitForTransactionParams;
    result: Record<string, string>;
  };
}

/** All chain families and their action maps. */
export interface ChainFamilies {
  ethereum: EvmActions;
  solana: SolanaActions;
  bitcoin: BitcoinActions;
}
