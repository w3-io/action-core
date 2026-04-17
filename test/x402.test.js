import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { buildSiweMessage, randomNonce, createX402Signer, createX402Fetch } from "../dist/x402.js";

// ---------------------------------------------------------------------------
// buildSiweMessage
// ---------------------------------------------------------------------------

describe("buildSiweMessage", () => {
  const PARAMS = {
    domain: "api.venice.ai",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    uri: "https://api.venice.ai/api/v1/chat/completions",
    chainId: 8453,
    nonce: "abc123def456",
    issuedAt: "2026-04-17T12:00:00.000Z",
    expirationTime: "2026-04-17T12:05:00.000Z",
  };

  it("produces valid EIP-4361 format", () => {
    const msg = buildSiweMessage(PARAMS);

    assert.ok(msg.startsWith("api.venice.ai wants you to sign in with your Ethereum account:"));
    assert.ok(msg.includes(PARAMS.address));
    assert.ok(msg.includes(`URI: ${PARAMS.uri}`));
    assert.ok(msg.includes("Version: 1"));
    assert.ok(msg.includes(`Chain ID: ${PARAMS.chainId}`));
    assert.ok(msg.includes(`Nonce: ${PARAMS.nonce}`));
    assert.ok(msg.includes(`Issued At: ${PARAMS.issuedAt}`));
    assert.ok(msg.includes(`Expiration Time: ${PARAMS.expirationTime}`));
  });

  it("includes custom statement", () => {
    const msg = buildSiweMessage({ ...PARAMS, statement: "Custom statement" });
    assert.ok(msg.includes("Custom statement"));
    assert.ok(!msg.includes("Sign in with Ethereum"));
  });

  it("uses default statement", () => {
    const msg = buildSiweMessage(PARAMS);
    assert.ok(msg.includes("Sign in with Ethereum"));
  });
});

// ---------------------------------------------------------------------------
// randomNonce
// ---------------------------------------------------------------------------

describe("randomNonce", () => {
  it("returns a 16-character hex string", () => {
    const nonce = randomNonce();
    assert.equal(nonce.length, 16);
    assert.match(nonce, /^[0-9a-f]{16}$/);
  });

  it("generates unique values", () => {
    const a = randomNonce();
    const b = randomNonce();
    assert.notEqual(a, b);
  });
});

// ---------------------------------------------------------------------------
// createX402Signer
// ---------------------------------------------------------------------------

describe("createX402Signer", () => {
  let originalBridgeUrl;

  beforeEach(() => {
    originalBridgeUrl = process.env.W3_BRIDGE_URL;
  });

  afterEach(() => {
    if (originalBridgeUrl) {
      process.env.W3_BRIDGE_URL = originalBridgeUrl;
    } else {
      delete process.env.W3_BRIDGE_URL;
    }
  });

  it("produces X-Sign-In-With-X header with valid base64 JSON", async () => {
    // Mock the bridge by setting up a local HTTP server
    const { createServer } = await import("node:http");
    let callCount = 0;
    const server = createServer((req, res) => {
      callCount++;
      res.setHeader("Content-Type", "application/json");
      if (req.url.includes("get-signer-address")) {
        res.end(JSON.stringify({ address: "0xABCD1234" }));
      } else if (req.url.includes("sign-message")) {
        res.end(JSON.stringify({ signature: "0xfakesig", digest: "0x00" }));
      } else {
        res.statusCode = 404;
        res.end("{}");
      }
    });

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    process.env.W3_BRIDGE_URL = `http://localhost:${port}`;

    try {
      const signer = createX402Signer({ domain: "api.venice.ai", chainId: 8453 });
      const headers = await signer("https://api.venice.ai/api/v1/models");

      assert.ok(headers["X-Sign-In-With-X"]);

      // Decode and validate
      const payload = JSON.parse(atob(headers["X-Sign-In-With-X"]));
      assert.equal(payload.address, "0xABCD1234");
      assert.equal(payload.signature, "0xfakesig");
      assert.equal(payload.chainId, 8453);
      assert.ok(payload.message.includes("api.venice.ai"));
      assert.ok(payload.message.includes("https://api.venice.ai/api/v1/models"));

      // Should have made 2 bridge calls (getSignerAddress + signMessage)
      assert.equal(callCount, 2);
    } finally {
      server.close();
    }
  });

  it("caches signer address across calls", async () => {
    const { createServer } = await import("node:http");
    let addressCalls = 0;
    const server = createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url.includes("get-signer-address")) {
        addressCalls++;
        res.end(JSON.stringify({ address: "0xCACHED" }));
      } else {
        res.end(JSON.stringify({ signature: "0xsig", digest: "0x00" }));
      }
    });

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    process.env.W3_BRIDGE_URL = `http://localhost:${port}`;

    try {
      const signer = createX402Signer({ domain: "test.com", chainId: 1 });
      await signer("https://test.com/a");
      await signer("https://test.com/b");

      // Address should only be fetched once
      assert.equal(addressCalls, 1);
    } finally {
      server.close();
    }
  });

  it("generates fresh nonce per call", async () => {
    const { createServer } = await import("node:http");
    const messages = [];
    const server = createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url.includes("get-signer-address")) {
        res.end(JSON.stringify({ address: "0x1234" }));
      } else if (req.url.includes("sign-message")) {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          messages.push(parsed.params.message);
          res.end(JSON.stringify({ signature: "0xsig", digest: "0x00" }));
        });
        return;
      } else {
        res.end("{}");
      }
    });

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    process.env.W3_BRIDGE_URL = `http://localhost:${port}`;

    try {
      const signer = createX402Signer({ domain: "test.com", chainId: 1 });
      await signer("https://test.com/a");
      await signer("https://test.com/b");

      // Two different SIWE messages (different nonces)
      assert.equal(messages.length, 2);
      assert.notEqual(messages[0], messages[1]);
    } finally {
      server.close();
    }
  });
});
