// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Balance packs + Stripe: one aggregated prepaid balance per user
 *  on the ONE AIMLDS Stripe account. Checkout is Stripe-hosted; the
 *  webhook grants. Grants and refund reversals are idempotent by
 *  Stripe object id (Router credits pattern). Events whose livemode
 *  does not match STRIPE_MODE are refused.
 *
 *  Refunds are PRORATED (owner's rule, 2026-11-15;
 *  REFUNDS-DESIGN.md): a refund returns only the unspent balance
 *  attributable to its payment — the spent portion is earned and
 *  kept. The gateway issues refunds itself (POST /v1/balance/refund
 *  → Stripe POST /v1/refunds, which needs the key's "Charges and
 *  Refunds: Write" permission), and the webhook reversal equals the
 *  amount Stripe actually refunded, clamped to the attributable
 *  balance, with any excess booked as an explicit `exception`
 *  ledger entry — never a silent negative.
 *
 *  Live charging stays OFF until the owner rules atom rates: pack
 *  checkout is only offered when a Stripe key + price ids are
 *  configured for the active mode, and atom rates come from the
 *  generated contract config — never from this module.
 */

import { bytesToHex, hexToBytes, timingSafeEqual } from "./crypto.js";
import type { LedgerRow, Store } from "./store.js";
import type { GatewayEnv } from "./auth.js";
import { log } from "./auth.js";

export interface Pack {
  id: string;
  label: string;
  priceUsd: number;
  balanceMicro: number;
}

export const PACKS: Record<string, Pack> = {
  starter: { id: "starter", label: "Starter balance pack", priceUsd: 10, balanceMicro: 10_000_000 },
  builder: { id: "builder", label: "Builder balance pack", priceUsd: 49, balanceMicro: 49_000_000 },
  fleet: { id: "fleet", label: "Fleet balance pack", priceUsd: 199, balanceMicro: 199_000_000 },
};

export function packPriceId(env: GatewayEnv, packId: string): string | null {
  switch (packId) {
    case "starter": return env.STRIPE_PRICE_PACK_STARTER || null;
    case "builder": return env.STRIPE_PRICE_PACK_BUILDER || null;
    case "fleet": return env.STRIPE_PRICE_PACK_FLEET || null;
    default: return null;
  }
}

export function stripeMode(env: GatewayEnv): "test" | "live" {
  return env.STRIPE_MODE === "live" ? "live" : "test";
}

export function checkoutConfigured(env: GatewayEnv): boolean {
  return Boolean(env.STRIPE_SECRET_KEY) &&
    Object.keys(PACKS).every((id) => packPriceId(env, id));
}

// ---------------------------------------------------------------------------
// Stripe API (minimal, form-encoded — the Router's stripe.ts shape)
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  env: GatewayEnv,
  args: { email: string; pack: Pack; baseUrl: string },
  fetchFn: typeof fetch = fetch
): Promise<{ id: string; url: string }> {
  const priceId = packPriceId(env, args.pack.id);
  if (!env.STRIPE_SECRET_KEY || !priceId) throw new Error("stripe checkout is not configured");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("customer_email", args.email);
  form.set("metadata[email]", args.email);
  form.set("metadata[pack]", args.pack.id);
  form.set("payment_intent_data[metadata][email]", args.email);
  form.set("payment_intent_data[metadata][pack]", args.pack.id);
  form.set("success_url", `${args.baseUrl}/v1/balance?checkout=success`);
  form.set("cancel_url", `${args.baseUrl}/v1/balance?checkout=cancelled`);
  const res = await fetchFn("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(`stripe checkout session failed: ${data.error?.message ?? res.status}`);
  }
  return { id: data.id, url: data.url };
}

// ---------------------------------------------------------------------------
// Prorated refunds (owner's rule, 2026-11-15 — REFUNDS-DESIGN.md)
// ---------------------------------------------------------------------------

export interface GrantAttribution {
  grant: LedgerRow;
  /** Draws FIFO-attributed to this grant (micro-USD). */
  drawnMicro: number;
  /** Reversal amount attributed to this grant, clamped at what the
   *  grant could still cover when each reversal posted. */
  reversedMicro: number;
  /** granted − drawn − reversed; never negative. */
  remainingMicro: number;
}

/** Attribute a user's draws and refund reversals to their grants,
 *  oldest grant first (FIFO). Draws carry no grant link in the
 *  ledger, so attribution is computed from history, never stored.
 *  `rows` must be chronological (see Store.ledgerHistory). */
export function attributeLedger(rows: LedgerRow[]): GrantAttribution[] {
  const grants: GrantAttribution[] = [];
  const byRef = new Map<string, GrantAttribution>();
  for (const row of rows) {
    if (row.kind === "grant") {
      const g: GrantAttribution = {
        grant: row, drawnMicro: 0, reversedMicro: 0, remainingMicro: row.amountMicro,
      };
      grants.push(g);
      if (row.ref) byRef.set(row.ref, g);
    } else if (row.kind === "draw") {
      let left = -row.amountMicro;
      for (const g of grants) {
        if (left <= 0) break;
        const take = Math.min(g.remainingMicro, left);
        g.drawnMicro += take;
        g.remainingMicro -= take;
        left -= take;
      }
    } else if (row.kind === "refund") {
      const g = row.ref ? byRef.get(row.ref) : undefined;
      if (g) {
        const take = Math.min(g.remainingMicro, -row.amountMicro);
        g.reversedMicro += take;
        g.remainingMicro -= take;
      }
    }
    // 'exception' rows move no money (amount 0): nothing to attribute.
  }
  return grants;
}

/** The prorated refundable amount for one pack payment, computed at
 *  execution time: its grant minus the draws and reversals already
 *  attributed to it. Null when this user has no grant for the
 *  payment (ownership fence lives here: history is per-user). */
export async function refundableMicroForPayment(
  store: Store,
  email: string,
  paymentIntent: string
): Promise<{ grant: LedgerRow; refundableMicro: number } | null> {
  const grants = attributeLedger(await store.ledgerHistory(email));
  const g = grants.find((x) => x.grant.ref === paymentIntent);
  if (!g) return null;
  return { grant: g.grant, refundableMicro: g.remainingMicro };
}

export class StripeRefundError extends Error {
  readonly status: number;
  /** True when Stripe refused for key permissions — creating a
   *  refund needs the restricted key's "Charges and Refunds:
   *  Write" permission (REFUNDS-DESIGN.md §b). */
  readonly permissionDenied: boolean;
  constructor(status: number, message: string) {
    super(message);
    this.name = "StripeRefundError";
    this.status = status;
    this.permissionDenied = status === 403 || /permission/i.test(message);
  }
}

/** Issue a prorated refund through Stripe. The amount is floored to
 *  whole cents (never more than attributable); the Stripe
 *  idempotency key makes a retried request replay the same refund. */
export async function createRefund(
  env: GatewayEnv,
  args: { paymentIntent: string; amountMicro: number; email: string },
  fetchFn: typeof fetch = fetch
): Promise<{ id: string; status: string; amountMicro: number }> {
  if (!env.STRIPE_SECRET_KEY) throw new Error("stripe is not configured");
  const cents = Math.floor(args.amountMicro / 10_000);
  if (cents <= 0) throw new Error("refund amount is below one cent");
  const form = new URLSearchParams();
  form.set("payment_intent", args.paymentIntent);
  form.set("amount", String(cents));
  form.set("metadata[email]", args.email);
  form.set("metadata[source]", "atoms_gateway_prorated_refund");
  const res = await fetchFn("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
      "idempotency-key": `atoms-refund:${args.paymentIntent}:${cents}`,
    },
    body: form.toString(),
  });
  const data = (await res.json()) as {
    id?: string; status?: string; amount?: number; error?: { message?: string };
  };
  if (!res.ok || !data.id) {
    throw new StripeRefundError(res.status, data.error?.message ?? `stripe refund failed: ${res.status}`);
  }
  return { id: data.id, status: data.status ?? "pending", amountMicro: (data.amount ?? cents) * 10_000 };
}

// ---------------------------------------------------------------------------
// Webhook: signature verification + grant / refund handling
// ---------------------------------------------------------------------------

export async function verifyStripeSignature(
  secret: string,
  payload: string,
  header: string,
  nowMs: number,
  toleranceSec = 300
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  if (Math.abs(nowMs / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${t}.${payload}`) as BufferSource
  );
  const expected = bytesToHex(new Uint8Array(sig));
  void hexToBytes;
  return timingSafeEqual(expected, v1);
}

interface StripeEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: Record<string, unknown> };
}

function str(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

/** Handle one verified Stripe event. Idempotent: replays move money
 *  at most once (ledger idempotency keys are Stripe object ids). */
export async function handleStripeEvent(
  store: Store,
  env: GatewayEnv,
  event: StripeEvent,
  now: Date
): Promise<{ handled: boolean; note: string }> {
  const mode = stripeMode(env);
  if (event.livemode !== (mode === "live")) {
    return { handled: false, note: `livemode mismatch (gateway mode=${mode})` };
  }
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    const email = str(obj, "customer_email") ?? str((obj["metadata"] as Record<string, unknown>) ?? {}, "email");
    const packId = str((obj["metadata"] as Record<string, unknown>) ?? {}, "pack");
    const paymentIntent = str(obj, "payment_intent");
    const pack = packId ? PACKS[packId] : undefined;
    if (!email || !pack || !paymentIntent) {
      return { handled: false, note: "checkout.session.completed missing email/pack/payment_intent" };
    }
    await store.ensureUser(email, now.toISOString());
    const res = await store.appendLedger({
      email,
      kind: "grant",
      atom: null,
      amountMicro: pack.balanceMicro,
      idempotencyKey: `stripe:checkout:${str(obj, "id") ?? event.id}`,
      ref: paymentIntent,
      now: now.toISOString(),
    });
    log("info", { event: "stripe_grant", applied: res.applied, pack: pack.id, balance_after: res.balanceAfter });
    return { handled: true, note: res.applied ? "granted" : "duplicate ignored" };
  }

  if (event.type === "charge.refunded") {
    const paymentIntent = str(obj, "payment_intent");
    const chargeId = str(obj, "id");
    if (!paymentIntent || !chargeId) return { handled: false, note: "charge.refunded missing ids" };
    const grant = await store.findGrantByRef(paymentIntent);
    if (!grant) return { handled: false, note: "no grant found for refunded payment_intent" };

    // Prorated reversal (owner's rule): each refund Stripe actually
    // made reverses exactly its own amount, clamped to the balance
    // still attributable to this grant; any excess (a refund the
    // gateway did not issue, against funds already spent) posts an
    // explicit zero-amount `exception` entry — never a silent
    // negative. One reversal per refund id; replays skip.
    const history = await store.ledgerHistory(grant.email);
    const mine = attributeLedger(history).find((g) => g.grant.id === grant.id);
    let remaining = mine?.remainingMicro ?? 0;
    const processed = new Set(
      history
        .map((r) => r.idempotencyKey)
        .filter((k) => k.startsWith("stripe:refund:") || k.startsWith("stripe:refund-exception:"))
    );

    const incoming: Array<{ id: string; amountMicro: number }> = [];
    const refundsData = (obj["refunds"] as { data?: unknown } | undefined)?.data;
    if (Array.isArray(refundsData)) {
      for (const r of refundsData as Array<Record<string, unknown>>) {
        const rid = str(r, "id");
        const status = str(r, "status");
        if (rid && typeof r["amount"] === "number" && (status === null || status === "succeeded")) {
          incoming.push({ id: rid, amountMicro: (r["amount"] as number) * 10_000 });
        }
      }
    }
    if (incoming.length === 0) {
      // Sparse payload (no refunds list): this event's delta is
      // the charge's cumulative refunded amount minus what the
      // ledger already reversed. A payload with no amounts at all
      // is the pre-1.1.0 shape and means a full charge refund.
      const cumCents = typeof obj["amount_refunded"] === "number"
        ? (obj["amount_refunded"] as number)
        : typeof obj["amount"] === "number"
          ? (obj["amount"] as number)
          : grant.amountMicro / 10_000;
      const alreadyRaw = history
        .filter((row) => row.kind === "refund" && row.ref === paymentIntent)
        .reduce((sum, row) => sum + -row.amountMicro, 0);
      const delta = cumCents * 10_000 - alreadyRaw;
      if (delta > 0) incoming.push({ id: chargeId, amountMicro: delta });
    }

    let reversedMicro = 0;
    let exceptions = 0;
    let fresh = 0;
    for (const refund of incoming) {
      if (processed.has(`stripe:refund:${refund.id}`) || processed.has(`stripe:refund-exception:${refund.id}`)) {
        continue; // replay of an already-booked refund
      }
      fresh++;
      const reversal = Math.min(refund.amountMicro, remaining);
      if (reversal > 0) {
        const res = await store.appendLedger({
          email: grant.email,
          kind: "refund",
          atom: null,
          amountMicro: -reversal,
          idempotencyKey: `stripe:refund:${refund.id}`,
          ref: paymentIntent,
          now: now.toISOString(),
          note: `stripe refund ${refund.id}`,
        });
        if (res.applied) {
          remaining -= reversal;
          reversedMicro += reversal;
        }
      }
      const excess = refund.amountMicro - reversal;
      if (excess > 0) {
        const res = await store.appendLedger({
          email: grant.email,
          kind: "exception",
          atom: null,
          amountMicro: 0,
          idempotencyKey: `stripe:refund-exception:${refund.id}`,
          ref: paymentIntent,
          now: now.toISOString(),
          note: `stripe refund ${refund.id} exceeded the balance attributable to this payment by ${excess} micro-USD (refund not issued by the gateway, or balance spent after issuance); excess NOT taken from the user's balance`,
        });
        if (res.applied) exceptions++;
      }
    }
    log("info", {
      event: "stripe_refund_reversal", reversed_micro: reversedMicro,
      exceptions, balance_after: await store.getBalance(grant.email),
    });
    return {
      handled: true,
      note: fresh === 0
        ? "duplicate ignored"
        : `reversed ${reversedMicro} micro across ${fresh} refund(s); ${exceptions} exception(s)`,
    };
  }

  return { handled: false, note: `ignored event type ${event.type}` };
}
