// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Atoms gateway — one Worker serving every live atom at
 *  atoms.pipavia.com (see DESIGN.md).
 *
 *    GET  /health                    ungated liveness
 *    GET  /                          catalogue / pricing page
 *    GET  /api.json                  machine-readable catalogue feed
 *    POST /mcp/<atom-service>        MCP face (gateway key + scope)
 *    POST /v1/<atom-service>         HTTP face (gateway key + scope)
 *    POST /v1/signup                 {email} → magic sign-in link
 *    GET  /v1/auth/redeem?token=     burn link → session
 *    POST /v1/keys                   session: {atom} → key + scope
 *    GET  /v1/keys                   session: re-show key + scopes
 *    POST /v1/keys/revoke            session: revoke + reissue
 *    GET  /v1/balance                session: balance + packs + ledger
 *    POST /v1/balance/checkout       session: {pack} → Stripe URL
 *    POST /v1/balance/refund         session: {payment_intent} → prorated refund
 *    POST /v1/stripe/webhook         Stripe-signed: grant / reverse
 */

import {
  bearerKey,
  issueKeyForAtom,
  log,
  redeem,
  revokeAndReissue,
  sessionEmail,
  signup,
  type GatewayEnv,
} from "./auth.js";
import { mcpCall, restCall } from "./callpath.js";
import { liveAtoms, resolveAtom } from "./atoms-registry.js";
import { catalogueHtml, feedJson } from "./catalogue.js";
import {
  PACKS,
  StripeRefundError,
  checkoutConfigured,
  createCheckoutSession,
  createRefund,
  handleStripeEvent,
  packPriceId,
  refundableMicroForPayment,
  stripeMode,
  verifyStripeSignature,
} from "./billing.js";
import { D1Store, type D1Database, type Store } from "./store.js";
import { deriveGatewayKey } from "./keys.js";

export interface Env extends GatewayEnv {
  DB: D1Database;
}

const GATEWAY_VERSION = "1.1.0";

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function baseUrl(env: Env, request: Request): string {
  return env.PUBLIC_BASE_URL || new URL(request.url).origin;
}

async function requireSession(
  store: Store,
  request: Request,
  now: Date
): Promise<string | null> {
  return sessionEmail(store, request, now);
}

export async function handleRequest(request: Request, env: Env, store: Store): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const now = new Date();
  const origin = baseUrl(env, request);
  const reqId = crypto.randomUUID();

  try {
    // ---- public surfaces -------------------------------------------------
    if (request.method === "GET" && path === "/health") {
      return json({
        ok: true,
        service: "atoms-gateway",
        version: GATEWAY_VERSION,
        atoms: liveAtoms().map((a) => a.serviceName),
      });
    }
    if (request.method === "GET" && path === "/") {
      return new Response(catalogueHtml(origin), {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (request.method === "GET" && path === "/api.json") {
      return json(feedJson(origin));
    }

    // ---- signup + magic-link auth ---------------------------------------
    if (request.method === "POST" && path === "/v1/signup") {
      const body = await request.json().catch(() => null);
      const res = await signup(store, env, origin, body, now);
      return json(res.body, res.status);
    }
    if (request.method === "GET" && path === "/v1/auth/redeem") {
      const res = await redeem(store, url.searchParams.get("token"), now);
      if (!res.ok) {
        return new Response(
          "<!DOCTYPE html><html><body><h1>That sign-in link is invalid or has expired.</h1><p>Request a new one and open it within 15 minutes.</p></body></html>",
          { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
        );
      }
      const html = `<!DOCTYPE html><html><body>
<h1>Signed in to Conduit Atoms</h1>
<p>Your session token (keep it private):</p>
<pre>${res.sessionToken}</pre>
<p>Issue a key for an atom:</p>
<pre>curl -X POST ${origin}/v1/keys -H "Authorization: Bearer ${res.sessionToken}" -H "content-type: application/json" -d '{"atom":"release-readiness-verdict"}'</pre>
</body></html>`;
      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "set-cookie": `atoms_session=${encodeURIComponent(res.sessionToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
        },
      });
    }

    // ---- session-authed account surface ----------------------------------
    if (path === "/v1/keys" && request.method === "POST") {
      const email = await requireSession(store, request, now);
      if (!email) return json({ ok: false, error: "unauthorized", detail: "sign in first" }, 401);
      if (!env.ATOMS_MASTER_SECRET) return json({ ok: false, error: "server_misconfigured" }, 500);
      const body = (await request.json().catch(() => null)) as { atom?: unknown } | null;
      const atomService = typeof body?.atom === "string" ? body.atom : "";
      const res = await issueKeyForAtom(store, env.ATOMS_MASTER_SECRET, email, atomService, now);
      if (!res.ok) return json({ ok: false, error: res.error }, res.status);
      return json({ ok: true, key: res.key, scopes: res.scopes });
    }
    if (path === "/v1/keys" && request.method === "GET") {
      const email = await requireSession(store, request, now);
      if (!email) return json({ ok: false, error: "unauthorized", detail: "sign in first" }, 401);
      if (!env.ATOMS_MASTER_SECRET) return json({ ok: false, error: "server_misconfigured" }, 500);
      const record = await store.getActiveKeyByEmail(email);
      if (!record) return json({ ok: true, key: null, scopes: [] });
      const key = await deriveGatewayKey(env.ATOMS_MASTER_SECRET, record.email, record.issuedAt);
      return json({ ok: true, key, scopes: record.scopes });
    }
    if (path === "/v1/keys/revoke" && request.method === "POST") {
      const email = await requireSession(store, request, now);
      if (!email) return json({ ok: false, error: "unauthorized", detail: "sign in first" }, 401);
      if (!env.ATOMS_MASTER_SECRET) return json({ ok: false, error: "server_misconfigured" }, 500);
      const res = await revokeAndReissue(store, env.ATOMS_MASTER_SECRET, email, now);
      if (!res.ok) return json({ ok: false, error: res.error }, res.status);
      return json({ ok: true, key: res.key, scopes: res.scopes });
    }
    if (path === "/v1/balance" && request.method === "GET") {
      const email = await requireSession(store, request, now);
      if (!email) return json({ ok: false, error: "unauthorized", detail: "sign in first" }, 401);
      const balance = await store.getBalance(email);
      const ledger = await store.listLedger(email, 20);
      return json({
        ok: true,
        balance_usd: balance / 1_000_000,
        balance_micro: balance,
        stripe_mode: stripeMode(env),
        checkout_configured: checkoutConfigured(env),
        packs: Object.values(PACKS).map((p) => ({
          id: p.id, label: p.label, price_usd: p.priceUsd, configured: Boolean(packPriceId(env, p.id)),
        })),
        ledger: ledger.map((r) => ({
          kind: r.kind, atom: r.atom, amount_usd: r.amountMicro / 1_000_000,
          balance_after_usd: r.balanceAfterMicro / 1_000_000, created_at: r.createdAt,
          note: r.note,
        })),
      });
    }
    if (path === "/v1/balance/checkout" && request.method === "POST") {
      const email = await requireSession(store, request, now);
      if (!email) return json({ ok: false, error: "unauthorized", detail: "sign in first" }, 401);
      const body = (await request.json().catch(() => null)) as { pack?: unknown } | null;
      const pack = typeof body?.pack === "string" ? PACKS[body.pack] : undefined;
      if (!pack) return json({ ok: false, error: "unknown_pack" }, 422);
      if (!checkoutConfigured(env)) {
        return json({ ok: false, error: "checkout_not_configured", detail: "balance packs are not on sale yet" }, 503);
      }
      const session = await createCheckoutSession(env, { email, pack, baseUrl: origin });
      return json({ ok: true, checkout_url: session.url, session_id: session.id });
    }
    if (path === "/v1/balance/refund" && request.method === "POST") {
      // Prorated refund (owner's rule, REFUNDS-DESIGN.md): the
      // gateway issues the refund itself for the unspent balance
      // attributable to the named payment; the ledger reversal
      // posts when Stripe's charge.refunded webhook lands.
      const email = await requireSession(store, request, now);
      if (!email) return json({ ok: false, error: "unauthorized", detail: "sign in first" }, 401);
      if (!checkoutConfigured(env)) {
        return json({ ok: false, error: "billing_not_configured", detail: "balance packs are not configured" }, 503);
      }
      const body = (await request.json().catch(() => null)) as { payment_intent?: unknown } | null;
      const paymentIntent = typeof body?.payment_intent === "string" ? body.payment_intent : "";
      if (!paymentIntent) return json({ ok: false, error: "payment_intent_required" }, 422);
      const found = await refundableMicroForPayment(store, email, paymentIntent);
      if (!found) {
        return json({ ok: false, error: "grant_not_found", detail: "no pack purchase with that payment_intent for this account" }, 404);
      }
      if (found.refundableMicro <= 0 || Math.floor(found.refundableMicro / 10_000) <= 0) {
        return json({
          ok: false, error: "nothing_refundable", refundable_usd: found.refundableMicro / 1_000_000,
          detail: "the unspent balance attributable to this payment is zero (or below one cent, in which case it stays as spendable balance)",
        }, 409);
      }
      try {
        const refund = await createRefund(env, { paymentIntent, amountMicro: found.refundableMicro, email });
        log("info", { event: "refund_issued", refund: refund.id, amount_micro: refund.amountMicro });
        return json({
          ok: true, refund_id: refund.id, status: refund.status,
          amount_usd: refund.amountMicro / 1_000_000, payment_intent: paymentIntent,
          note: "prorated refund issued; the ledger reversal posts when Stripe's charge.refunded webhook lands",
        });
      } catch (e) {
        if (e instanceof StripeRefundError) {
          log("error", { event: "refund_failed", permission_denied: e.permissionDenied, detail: e.message });
          return json({
            ok: false,
            error: e.permissionDenied ? "refund_permission_denied" : "refund_failed",
            detail: e.permissionDenied
              ? "the gateway's Stripe key lacks the 'Charges and Refunds: Write' permission needed to create refunds"
              : e.message,
          }, 502);
        }
        throw e;
      }
    }

    // ---- Stripe webhook ---------------------------------------------------
    if (path === "/v1/stripe/webhook" && request.method === "POST") {
      if (!env.STRIPE_WEBHOOK_SECRET) return json({ ok: false, error: "webhook_not_configured" }, 503);
      const payload = await request.text();
      const signature = request.headers.get("stripe-signature") || "";
      const valid = await verifyStripeSignature(env.STRIPE_WEBHOOK_SECRET, payload, signature, now.getTime());
      if (!valid) return json({ ok: false, error: "invalid_signature" }, 400);
      const event = JSON.parse(payload) as Parameters<typeof handleStripeEvent>[2];
      const res = await handleStripeEvent(store, env, event, now);
      log("info", { event: "stripe_webhook", type: event.type, handled: res.handled, note: res.note });
      return json({ ok: true, received: true });
    }

    // ---- atom faces -------------------------------------------------------
    const mcpMatch = /^\/mcp\/([a-z0-9-]+)$/.exec(path);
    if (mcpMatch && request.method === "POST") {
      const payload = await request.json().catch(() => null);
      const res = await mcpCall(store, env, mcpMatch[1], request, payload, now);
      return json(res.body, res.status);
    }
    if (mcpMatch && request.method === "GET") {
      return json({ error: "stateless JSON-RPC: POST to this endpoint" }, 405, { allow: "POST" });
    }
    const v1Match = /^\/v1\/([a-z0-9-]+)$/.exec(path);
    if (v1Match && request.method === "POST" && resolveAtom(v1Match[1])) {
      const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (input === null || typeof input !== "object" || Array.isArray(input)) {
        return json({ ok: false, error: "invalid_input", field: "body", detail: "request body must be a JSON object" }, 422);
      }
      const outcome = await restCall(store, env, v1Match[1], request, input, now);
      return json(outcome.body, outcome.status);
    }

    void bearerKey;
    return json({ ok: false, error: "not_found", path }, 404);
  } catch (e) {
    log("error", { event: "request_failed", req_id: reqId, path, err: String(e) });
    return json({ ok: false, error: "internal_error" }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env, new D1Store(env.DB));
  },
};
