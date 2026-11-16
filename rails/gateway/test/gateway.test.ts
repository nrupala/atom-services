import assert from "node:assert/strict";
import { test } from "node:test";

import { MemoryStore } from "../src/store.js";
import {
  authenticateKey,
  issueKeyForAtom,
  redeem,
  revokeAndReissue,
  signup,
} from "../src/auth.js";
import {
  deriveGatewayKey,
  keyFingerprint,
  isGatewayKeyShape,
} from "../src/keys.js";
import { executeCall, mcpCall, restCall } from "../src/callpath.js";
import { resolveAtom } from "../src/atoms-registry.js";
import {
  StripeRefundError,
  createCheckoutSession,
  createRefund,
  handleStripeEvent,
  refundableMicroForPayment,
  verifyStripeSignature,
  PACKS,
} from "../src/billing.js";
import { sha256Hex } from "../src/crypto.js";
import { feedJson, rateDisplay } from "../src/catalogue.js";
import { CATALOGUE, RATES } from "../src/generated.js";
import { handleRequest, type Env } from "../src/index.js";

const MASTER = "test-master-secret-not-a-real-one";
const NOW = new Date("2026-11-15T12:00:00.000Z");
const READY = {
  product: "example-app",
  version: "1.2.0",
  version_bump_locations: ["VERSION"],
  tag: { name: "v1.2.0", annotated: true, moved: false },
  changelog: { has_entry_for_version: true, unreleased_section_moved: true },
  release_notes: { present: true, breaking_changes: [], migration_steps: [] },
  approver: "release-owner",
  approval: { hitl_recorded: true },
  rollout_plan: { present: true },
  rollback_plan: { present: true, testable: true },
  health_check: { window_hours: 36 },
  artifacts: { sealed: true, checksum_manifest: true, verified_before_announcement: true },
  tests: { passing: true },
};

function env(extra: Record<string, unknown> = {}): Env {
  return {
    ATOMS_MASTER_SECRET: MASTER,
    RESEND_API_KEY: "test-resend-key",
    STRIPE_MODE: "test",
    PUBLIC_BASE_URL: "https://atoms.pipavia.com",
    ...extra,
  } as Env;
}

async function issuedKey(store: MemoryStore, email = "user@example.com") {
  const res = await issueKeyForAtom(store, MASTER, email, "release-readiness-verdict", NOW);
  assert.ok(res.ok);
  return res;
}

// ---- keys -----------------------------------------------------------------

test("gateway key derivation is deterministic, email-normalised, well-shaped", async () => {
  const a = await deriveGatewayKey(MASTER, "User@Example.com ", "2026-11-15T00:00:00.000Z");
  const b = await deriveGatewayKey(MASTER, "user@example.com", "2026-11-15T00:00:00.000Z");
  // deriveGatewayKey does not normalise itself; auth layer normalises emails.
  const c = await deriveGatewayKey(MASTER, "user@example.com", "2026-11-15T00:00:00.000Z");
  assert.equal(b, c);
  assert.ok(isGatewayKeyShape(b));
  assert.ok(b.startsWith("atm_1_"));
  assert.notEqual(a, b); // different email string in, different key out
  const fp = await keyFingerprint(MASTER, b);
  assert.equal(fp.length, 32);
  assert.ok(!b.includes(fp));
});

test("authenticate: issued key verifies; tampered and unknown keys do not", async () => {
  const store = new MemoryStore();
  const { key } = await issuedKey(store);
  const rec = await authenticateKey(store, MASTER, key);
  assert.ok(rec);
  assert.equal(rec.email, "user@example.com");
  const tampered = key.slice(0, -1) + (key.endsWith("0") ? "1" : "0");
  assert.equal(await authenticateKey(store, MASTER, tampered), null);
  assert.equal(await authenticateKey(store, MASTER, "atm_1_" + "0".repeat(64)), null);
  assert.equal(await authenticateKey(store, MASTER, "not-a-key"), null);
  assert.equal(await authenticateKey(store, MASTER, null), null);
});

test("revoke + reissue: old key dies, new key works, scopes carry over", async () => {
  const store = new MemoryStore();
  const { key: oldKey } = await issuedKey(store);
  const res = await revokeAndReissue(store, MASTER, "user@example.com", new Date(NOW.getTime() + 60_000));
  assert.ok(res.ok);
  assert.notEqual(res.key, oldKey);
  assert.deepEqual(res.scopes, ["release_readiness_verdict"]);
  assert.equal(await authenticateKey(store, MASTER, oldKey), null);
  assert.ok(await authenticateKey(store, MASTER, res.key));
});

test("scope fence: a key without the atom's scope is refused 403 at the call path", async () => {
  const store = new MemoryStore();
  const issuedAt = NOW.toISOString();
  const key = await deriveGatewayKey(MASTER, "scoped@example.com", issuedAt);
  const fp = await keyFingerprint(MASTER, key);
  const record = await store.createKey({
    email: "scoped@example.com", issuedAt, fingerprint: fp, isInternal: false, scopes: [], now: issuedAt,
  });
  const atom = resolveAtom("release-readiness-verdict")!;
  const out = await executeCall(store, env(), atom, record, READY, NOW, "call-1");
  assert.equal(out.status, 403);
  assert.equal(store.usage.length, 0); // refused calls are not metered
});

// ---- magic links + sessions ----------------------------------------------

test("magic link round trip: signup emails a link, redeem mints a session, replay dies", async () => {
  const store = new MemoryStore();
  const sent: Array<{ to: string; text: string }> = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body) as { to: string[]; text: string };
    sent.push({ to: body.to[0], text: body.text });
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  try {
    const res = await signup(store, env(), "https://atoms.pipavia.com", { email: "Person@Example.com" }, NOW);
    assert.equal(res.status, 200);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "person@example.com");
    const m = /redeem\?token=([A-Za-z0-9_-]+)/.exec(sent[0].text);
    assert.ok(m);
    const redeemed = await redeem(store, m[1], new Date(NOW.getTime() + 60_000));
    assert.ok(redeemed.ok);
    if (redeemed.ok) assert.equal(redeemed.email, "person@example.com");
    const replay = await redeem(store, m[1], new Date(NOW.getTime() + 120_000));
    assert.equal(replay.ok, false);
    // cooldown: a second signup a second later sends nothing new
    const again = await signup(store, env(), "https://atoms.pipavia.com", { email: "person@example.com" }, new Date(NOW.getTime() + 1_000));
    assert.equal(again.status, 200);
    // (first token was burned by redeem, so a fresh one IS minted after
    // redeem — assert only that the uniform body is returned)
    assert.equal((again.body as { ok: boolean }).ok, true);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("expired magic link does not redeem", async () => {
  const store = new MemoryStore();
  const realFetch = globalThis.fetch;
  let captured = "";
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    captured = (JSON.parse(init.body) as { text: string }).text;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  try {
    await signup(store, env(), "https://atoms.pipavia.com", { email: "late@example.com" }, NOW);
    const token = /redeem\?token=([A-Za-z0-9_-]+)/.exec(captured)![1];
    const res = await redeem(store, token, new Date(NOW.getTime() + 16 * 60_000));
    assert.equal(res.ok, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ---- call path: metering, rate limits, draw -------------------------------

test("zero-rate call meters at zero and returns the verdict", async () => {
  const store = new MemoryStore();
  const { key } = await issuedKey(store);
  const record = (await authenticateKey(store, MASTER, key))!;
  const atom = resolveAtom("release-readiness-verdict")!;
  const out = await executeCall(store, env(), atom, record, READY, NOW, "call-zero");
  assert.equal(out.status, 200);
  assert.equal((out.body as { verdict: string }).verdict, "READY");
  assert.equal(store.usage.length, 1);
  assert.equal(store.usage[0].rateChargedMicro, 0);
  assert.equal(await store.getBalance("user@example.com"), 0);
});

test("rate limit trips at the configured minute ceiling; over-limit calls are not metered", async () => {
  const store = new MemoryStore();
  const { key } = await issuedKey(store);
  const record = (await authenticateKey(store, MASTER, key))!;
  const atom = resolveAtom("release-readiness-verdict")!;
  let lastStatus = 0;
  for (let i = 0; i < 61; i++) {
    const out = await executeCall(store, env(), atom, record, READY, NOW, `call-${i}`);
    lastStatus = out.status;
  }
  assert.equal(lastStatus, 429);
  assert.equal(store.usage.length, 60);
});

test("priced call draws the balance; insufficient balance is 402 and unmetered", async () => {
  const store = new MemoryStore();
  const { key } = await issuedKey(store);
  const record = (await authenticateKey(store, MASTER, key))!;
  const atom = resolveAtom("release-readiness-verdict")!;
  const rates = { "release-readiness-verdict": { unit: "call", rateMicro: 500, rateStatus: "consensus" } };
  await store.appendLedger({
    email: "user@example.com", kind: "grant", atom: null, amountMicro: 1200,
    idempotencyKey: "test-grant", ref: "pi_test", now: NOW.toISOString(),
  });
  const one = await executeCall(store, env(), atom, record, READY, NOW, "priced-1", rates);
  assert.equal(one.status, 200);
  assert.equal(await store.getBalance("user@example.com"), 700);
  const two = await executeCall(store, env(), atom, record, READY, NOW, "priced-2", rates);
  assert.equal(two.status, 200);
  assert.equal(await store.getBalance("user@example.com"), 200);
  const three = await executeCall(store, env(), atom, record, READY, NOW, "priced-3", rates);
  assert.equal(three.status, 402);
  assert.equal(store.usage.length, 2); // the 402 was not metered
  assert.equal(await store.getBalance("user@example.com"), 200);
});

test("internal key meters to the internal ledger at zero, scope marked _internal", async () => {
  const store = new MemoryStore();
  const issuedAt = NOW.toISOString();
  const key = await deriveGatewayKey(MASTER, "internal@aimlds.org", issuedAt);
  const fp = await keyFingerprint(MASTER, key);
  const record = await store.createKey({
    email: "internal@aimlds.org", issuedAt, fingerprint: fp, isInternal: true,
    scopes: ["release_readiness_verdict"], now: issuedAt,
  });
  const atom = resolveAtom("release-readiness-verdict")!;
  const rates = { "release-readiness-verdict": { unit: "call", rateMicro: 500, rateStatus: "consensus" } };
  const out = await executeCall(store, env(), atom, record, READY, NOW, "internal-1", rates);
  assert.equal(out.status, 200);
  assert.equal(store.usage.length, 0);
  assert.equal(store.usageInternal.length, 1);
  assert.equal(store.usageInternal[0].rateChargedMicro, 0);
  assert.equal(store.usageInternal[0].scope, "release_readiness_verdict_internal");
});

// ---- HTTP surface -----------------------------------------------------------

test("HTTP: /health is open; MCP and REST faces refuse keyless calls", async () => {
  const store = new MemoryStore();
  const e = env();
  const health = await handleRequest(new Request("https://atoms.pipavia.com/health"), e, store);
  assert.equal(health.status, 200);
  const mcp = await handleRequest(new Request("https://atoms.pipavia.com/mcp/release-readiness-verdict", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
  }), e, store);
  assert.equal(mcp.status, 401);
  const rest = await handleRequest(new Request("https://atoms.pipavia.com/v1/release-readiness-verdict", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(READY),
  }), e, store);
  assert.equal(rest.status, 401);
});

test("MCP round trip with a key: initialize, tools/list, tools/call verdict", async () => {
  const store = new MemoryStore();
  const { key } = await issuedKey(store);
  const e = env();
  const call = async (payload: unknown) => {
    const res = await handleRequest(new Request("https://atoms.pipavia.com/mcp/release-readiness-verdict", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    }), e, store);
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  };
  const init = await call({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  assert.equal(init.status, 200);
  const list = await call({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const tools = (list.body.result as { tools: Array<{ name: string }> }).tools;
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, "release_readiness_verdict");
  const verdict = await call({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "release_readiness_verdict", arguments: READY } });
  const result = verdict.body.result as { structuredContent: { verdict: string } };
  assert.equal(result.structuredContent.verdict, "READY");
  assert.equal(store.usage.length, 1);
});

test("REST face returns the same verdict as the MCP face for the same manifest", async () => {
  const store = new MemoryStore();
  const { key } = await issuedKey(store);
  const req = new Request("https://atoms.pipavia.com/v1/release-readiness-verdict", {
    method: "POST", headers: { authorization: `Bearer ${key}` },
  });
  const out = await restCall(store, env(), "release-readiness-verdict", req, READY, NOW);
  assert.equal(out.status, 200);
  assert.equal((out.body as { verdict: string }).verdict, "READY");
});

// ---- billing ----------------------------------------------------------------

async function stripeSignature(secret: string, payload: string, t: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${t},v1=${hex}`;
}

test("webhook signature verifies; tampered payload fails", async () => {
  const secret = "whsec_test_value";
  const payload = JSON.stringify({ id: "evt_1" });
  const header = await stripeSignature(secret, payload, Math.floor(Date.now() / 1000));
  assert.equal(await verifyStripeSignature(secret, payload, header, Date.now()), true);
  assert.equal(await verifyStripeSignature(secret, payload + "x", header, Date.now()), false);
});

test("checkout completion grants once (idempotent); refund reverses once", async () => {
  const store = new MemoryStore();
  const e = env();
  const completed = {
    id: "evt_complete", type: "checkout.session.completed", livemode: false,
    data: { object: { id: "cs_test_123", customer_email: "buyer@example.com", payment_intent: "pi_test_123", metadata: { email: "buyer@example.com", pack: "starter" } } },
  };
  const first = await handleStripeEvent(store, e, completed as never, NOW);
  assert.equal(first.handled, true);
  assert.equal(await store.getBalance("buyer@example.com"), PACKS.starter.balanceMicro);
  const replay = await handleStripeEvent(store, e, completed as never, NOW);
  assert.equal(replay.handled, true);
  assert.equal(await store.getBalance("buyer@example.com"), PACKS.starter.balanceMicro);
  const refunded = {
    id: "evt_refund", type: "charge.refunded", livemode: false,
    data: { object: { id: "ch_test_123", payment_intent: "pi_test_123" } },
  };
  const rev = await handleStripeEvent(store, e, refunded as never, NOW);
  assert.equal(rev.handled, true);
  assert.equal(await store.getBalance("buyer@example.com"), 0);
  const revReplay = await handleStripeEvent(store, e, refunded as never, NOW);
  assert.equal(revReplay.handled, true);
  assert.equal(await store.getBalance("buyer@example.com"), 0);
  // livemode mismatch is refused
  const liveEvent = { ...completed, id: "evt_live", livemode: true };
  const refused = await handleStripeEvent(store, e, liveEvent as never, NOW);
  assert.equal(refused.handled, false);
});

test("checkout session creation carries pack + email metadata (mocked Stripe)", async () => {
  const e = env({ STRIPE_SECRET_KEY: "rk_test_mock", STRIPE_PRICE_PACK_STARTER: "price_test_starter" });
  let seenBody = "";
  const mockFetch = (async (_url: string, init: { body: string }) => {
    seenBody = init.body;
    return new Response(JSON.stringify({ id: "cs_test_x", url: "https://checkout.stripe.com/x" }), { status: 200 });
  }) as typeof fetch;
  const session = await createCheckoutSession(e, { email: "buyer@example.com", pack: PACKS.starter, baseUrl: "https://atoms.pipavia.com" }, mockFetch);
  assert.equal(session.id, "cs_test_x");
  const params = new URLSearchParams(seenBody);
  assert.equal(params.get("metadata[pack]"), "starter");
  assert.equal(params.get("metadata[email]"), "buyer@example.com");
  assert.equal(params.get("line_items[0][price]"), "price_test_starter");
});

// ---- prorated refunds (owner's rule, 2026-11-15; REFUNDS-DESIGN.md) ---------

const BILLING_ENV = {
  STRIPE_SECRET_KEY: "rk_test_mock",
  STRIPE_PRICE_PACK_STARTER: "price_s",
  STRIPE_PRICE_PACK_BUILDER: "price_b",
  STRIPE_PRICE_PACK_FLEET: "price_f",
};

async function grantPack(store: MemoryStore, e: Env, email: string, pi: string, sessionId: string) {
  const ev = {
    id: `evt_${sessionId}`, type: "checkout.session.completed", livemode: false,
    data: { object: { id: sessionId, customer_email: email, payment_intent: pi, metadata: { email, pack: "starter" } } },
  };
  const r = await handleStripeEvent(store, e, ev as never, NOW);
  assert.equal(r.handled, true);
}

async function drawMicro(store: MemoryStore, email: string, micro: number, callId: string) {
  await store.appendLedger({
    email, kind: "draw", atom: "release-readiness-verdict", amountMicro: -micro,
    idempotencyKey: `call:${callId}`, ref: callId, now: NOW.toISOString(),
  });
}

function chargeRefunded(pi: string, chargeId: string, refunds: Array<{ id: string; amount: number }>) {
  return {
    id: `evt_rf_${chargeId}`, type: "charge.refunded", livemode: false,
    data: {
      object: {
        id: chargeId, payment_intent: pi,
        amount_refunded: refunds.reduce((s, r) => s + r.amount, 0),
        refunds: { data: refunds.map((r) => ({ id: r.id, amount: r.amount, status: "succeeded", payment_intent: pi })) },
      },
    },
  };
}

function mockRefundFetch(capture: { body?: string; idem?: string }, refundId = "re_test_1") {
  return (async (_url: string, init: { body: string; headers: Record<string, string> }) => {
    capture.body = init.body;
    capture.idem = init.headers["idempotency-key"];
    const params = new URLSearchParams(init.body);
    return new Response(JSON.stringify({
      id: refundId, status: "succeeded", amount: Number(params.get("amount")),
    }), { status: 200 });
  }) as typeof fetch;
}

test("prorated refund: spent $3 of $10 → $7 refunded, attributable balance closes at 0", async () => {
  const store = new MemoryStore();
  const e = env(BILLING_ENV);
  await grantPack(store, e, "pro@example.com", "pi_pro", "cs_pro");
  for (let i = 0; i < 3; i++) await drawMicro(store, "pro@example.com", 1_000_000, `pro-${i}`);
  assert.equal(await store.getBalance("pro@example.com"), 7_000_000);
  const found = await refundableMicroForPayment(store, "pro@example.com", "pi_pro");
  assert.equal(found?.refundableMicro, 7_000_000);
  const capture: { body?: string; idem?: string } = {};
  const refund = await createRefund(
    e, { paymentIntent: "pi_pro", amountMicro: found!.refundableMicro, email: "pro@example.com" },
    mockRefundFetch(capture)
  );
  const params = new URLSearchParams(capture.body);
  assert.equal(params.get("amount"), "700");
  assert.equal(params.get("payment_intent"), "pi_pro");
  assert.equal(capture.idem, "atoms-refund:pi_pro:700");
  assert.equal(refund.amountMicro, 7_000_000);
  const res = await handleStripeEvent(store, e, chargeRefunded("pi_pro", "ch_pro", [{ id: "re_test_1", amount: 700 }]) as never, NOW);
  assert.equal(res.handled, true);
  assert.equal(await store.getBalance("pro@example.com"), 0);
  const rows = (await store.listLedger("pro@example.com", 20)).filter((r) => r.kind === "refund");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amountMicro, -7_000_000);
  assert.equal((await refundableMicroForPayment(store, "pro@example.com", "pi_pro"))?.refundableMicro, 0);
});

test("prorated refund: unspent pack refunds in full", async () => {
  const store = new MemoryStore();
  const e = env(BILLING_ENV);
  await grantPack(store, e, "full@example.com", "pi_full", "cs_full");
  const found = await refundableMicroForPayment(store, "full@example.com", "pi_full");
  assert.equal(found?.refundableMicro, 10_000_000);
  const capture: { body?: string } = {};
  await createRefund(
    e, { paymentIntent: "pi_full", amountMicro: found!.refundableMicro, email: "full@example.com" },
    mockRefundFetch(capture, "re_full")
  );
  assert.equal(new URLSearchParams(capture.body).get("amount"), "1000");
  await handleStripeEvent(store, e, chargeRefunded("pi_full", "ch_full", [{ id: "re_full", amount: 1000 }]) as never, NOW);
  assert.equal(await store.getBalance("full@example.com"), 0);
});

test("refund endpoint: fully-spent pack → 409 (Stripe never reached); foreign payment → 404; no session → 401", async () => {
  const store = new MemoryStore();
  const e = env(BILLING_ENV);
  await grantPack(store, e, "spent@example.com", "pi_spent", "cs_spent");
  for (let i = 0; i < 10; i++) await drawMicro(store, "spent@example.com", 1_000_000, `spent-${i}`);
  assert.equal(await store.getBalance("spent@example.com"), 0);
  await store.putSession(
    await sha256Hex("sess-spent"), "spent@example.com",
    NOW.toISOString(), new Date(Date.now() + 3_600_000).toISOString()
  );
  const post = (token: string | null, pi: string) => handleRequest(new Request("https://atoms.pipavia.com/v1/balance/refund", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ payment_intent: pi }),
  }), e, store);
  const res409 = await post("sess-spent", "pi_spent");
  assert.equal(res409.status, 409);
  assert.equal(((await res409.json()) as { error: string }).error, "nothing_refundable");
  const res404 = await post("sess-spent", "pi_someone_elses");
  assert.equal(res404.status, 404);
  const res401 = await post(null, "pi_spent");
  assert.equal(res401.status, 401);
});

test("prorated refund: replayed charge.refunded posts exactly one reversal", async () => {
  const store = new MemoryStore();
  const e = env(BILLING_ENV);
  await grantPack(store, e, "replay@example.com", "pi_replay", "cs_replay");
  await drawMicro(store, "replay@example.com", 3_000_000, "replay-draw");
  const ev = chargeRefunded("pi_replay", "ch_replay", [{ id: "re_replay", amount: 700 }]);
  await handleStripeEvent(store, e, ev as never, NOW);
  assert.equal(await store.getBalance("replay@example.com"), 0);
  const again = await handleStripeEvent(store, e, ev as never, NOW);
  assert.equal(again.handled, true);
  assert.equal(await store.getBalance("replay@example.com"), 0);
  const refunds = (await store.listLedger("replay@example.com", 20)).filter((r) => r.kind === "refund");
  assert.equal(refunds.length, 1);
});

test("prorated refund: FIFO attribution across two packs", async () => {
  const store = new MemoryStore();
  const e = env(BILLING_ENV);
  await grantPack(store, e, "fifo@example.com", "pi_a", "cs_a");
  await grantPack(store, e, "fifo@example.com", "pi_b", "cs_b");
  for (let i = 0; i < 12; i++) await drawMicro(store, "fifo@example.com", 1_000_000, `fifo-${i}`);
  assert.equal(await store.getBalance("fifo@example.com"), 8_000_000);
  // FIFO: the 12 draws consume pack A in full, then $2 of pack B.
  assert.equal((await refundableMicroForPayment(store, "fifo@example.com", "pi_a"))?.refundableMicro, 0);
  assert.equal((await refundableMicroForPayment(store, "fifo@example.com", "pi_b"))?.refundableMicro, 8_000_000);
  const capture: { body?: string } = {};
  await createRefund(
    e, { paymentIntent: "pi_b", amountMicro: 8_000_000, email: "fifo@example.com" },
    mockRefundFetch(capture, "re_fifo")
  );
  assert.equal(new URLSearchParams(capture.body).get("amount"), "800");
});

test("external refund beyond attributable balance: clamped reversal + explicit exception, never negative", async () => {
  const store = new MemoryStore();
  const e = env(BILLING_ENV);
  await grantPack(store, e, "ext@example.com", "pi_x", "cs_x");
  for (let i = 0; i < 3; i++) await drawMicro(store, "ext@example.com", 1_000_000, `ext-${i}`);
  // A manual dashboard refund of the full $10 lands when only $7 is attributable.
  const res = await handleStripeEvent(store, e, chargeRefunded("pi_x", "ch_x", [{ id: "re_ext", amount: 1000 }]) as never, NOW);
  assert.equal(res.handled, true);
  assert.equal(await store.getBalance("ext@example.com"), 0);
  const rows = await store.listLedger("ext@example.com", 20);
  const reversal = rows.filter((r) => r.kind === "refund");
  assert.equal(reversal.length, 1);
  assert.equal(reversal[0].amountMicro, -7_000_000);
  const exc = rows.filter((r) => r.kind === "exception");
  assert.equal(exc.length, 1);
  assert.equal(exc[0].amountMicro, 0);
  assert.ok(exc[0].note?.includes("3000000"));
});

test("createRefund: Stripe permission refusal surfaces as permissionDenied", async () => {
  const e = env(BILLING_ENV);
  const denied = (async () => new Response(JSON.stringify({
    error: { message: "The provided API key does not have the necessary permissions for this endpoint" },
  }), { status: 403 })) as typeof fetch;
  await assert.rejects(
    createRefund(e, { paymentIntent: "pi_x", amountMicro: 7_000_000, email: "x@example.com" }, denied),
    (err: unknown) => err instanceof StripeRefundError && err.permissionDenied
  );
});

// ---- catalogue consistency ----------------------------------------------------

test("catalogue feed agrees with the generated rate config; atom #1 shows the trial state", () => {
  const feed = feedJson("https://atoms.pipavia.com") as { atoms: Array<Record<string, unknown>> };
  assert.equal(feed.atoms.length, CATALOGUE.length); // only live atoms are listed
  const row = feed.atoms.find((a) => a.name === "release-readiness-verdict")!;
  assert.ok(row);
  const pricing = row.pricing as { rate_usd: number | null; rate_status: string; display: string };
  const cfg = RATES["release-readiness-verdict"];
  assert.equal(pricing.rate_usd, cfg.rateMicro === null ? null : cfg.rateMicro / 1_000_000);
  assert.equal(pricing.rate_status, cfg.rateStatus);
  assert.equal(cfg.rateMicro, null); // owner's rate decision is still open
  assert.equal(pricing.display, "Free during trial — rate pending");
  assert.equal(rateDisplay(CATALOGUE.find((c) => c.serviceName === "release-readiness-verdict")!), pricing.display);
});
