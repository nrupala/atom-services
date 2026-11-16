// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Signup, magic-link sign-in, sessions, and gateway-key issuance.
 *
 *  Magic links mirror the Router's magic.ts design: 32-byte tokens,
 *  SHA-256 at rest only, 15-minute TTL, single-use (burned before
 *  the session is minted), one live token per email, 60-second send
 *  cooldown, and a uniform signup response (no address enumeration).
 *  Mail goes through the Resend HTTPS API from
 *  "Conduit <info@aimlds.org>"; without RESEND_API_KEY the feature
 *  is dark and signup answers 503 honestly.
 */

import { randomToken, sha256Hex } from "./crypto.js";
import {
  deriveGatewayKey,
  keyFingerprint,
  normalizeEmail,
  verifyAgainstRecord,
  isGatewayKeyShape,
  type KeyRecord,
} from "./keys.js";
import type { Store } from "./store.js";
import { resolveAtom } from "./atoms-registry.js";

export const MAGIC_TTL_MS = 15 * 60 * 1000;
export const MAGIC_COOLDOWN_MS = 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAIL_FROM = "Conduit <info@aimlds.org>";

export interface GatewayEnv {
  ATOMS_MASTER_SECRET?: string;
  RESEND_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_MODE?: string;
  STRIPE_PRICE_PACK_STARTER?: string;
  STRIPE_PRICE_PACK_BUILDER?: string;
  STRIPE_PRICE_PACK_FLEET?: string;
  PUBLIC_BASE_URL?: string;
}

export function log(level: "info" | "warn" | "error", fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, service: "atoms-gateway", ...fields }));
}

export async function sendMagicLinkEmail(
  apiKey: string,
  to: string,
  redeemUrl: string,
  fetchFn: typeof fetch = fetch
): Promise<boolean> {
  const text =
    "Sign in to Conduit Atoms\n\n" +
    `Open this link within 15 minutes to sign in:\n${redeemUrl}\n\n` +
    "The link works once. If you did not ask for it, ignore this email — " +
    "nothing changes unless the link is opened.\n";
  try {
    const res = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "user-agent": "atoms-gateway/1.0",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [to],
        subject: "Your Conduit Atoms sign-in link",
        text,
      }),
    });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

/** POST /v1/signup {email} — uniform answer; sends the link unless in
 *  cooldown. Returns an HTTP status + body for the route handler. */
export async function signup(
  store: Store,
  env: GatewayEnv,
  origin: string,
  body: unknown,
  now: Date
): Promise<{ status: number; body: Record<string, unknown> }> {
  const email = normalizeEmail((body as { email?: unknown } | null)?.email);
  const uniform = {
    status: 200,
    body: { ok: true, message: "If that address can sign up, a sign-in link is on its way." },
  };
  if (!email) return uniform;
  if (!env.RESEND_API_KEY) {
    log("error", { event: "signup_dark", reason: "RESEND_API_KEY not configured" });
    return { status: 503, body: { ok: false, error: "email sign-in is not configured on this deployment" } };
  }
  await store.ensureUser(email, now.toISOString());
  const existing = await store.getMagicByEmail(email);
  if (existing && now.getTime() - Date.parse(existing.createdAt) < MAGIC_COOLDOWN_MS) {
    return uniform; // cooldown: the earlier link is still live
  }
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(now.getTime() + MAGIC_TTL_MS).toISOString();
  await store.putMagic(tokenHash, email, now.toISOString(), expiresAt);
  const redeemUrl = `${origin}/v1/auth/redeem?token=${encodeURIComponent(token)}`;
  const sent = await sendMagicLinkEmail(env.RESEND_API_KEY, email, redeemUrl);
  if (!sent) log("error", { event: "magic_send_failed", email_domain: email.split("@")[1] });
  return uniform;
}

/** GET /v1/auth/redeem?token= — burn the token, mint a session. */
export async function redeem(
  store: Store,
  token: string | null,
  now: Date
): Promise<{ ok: true; sessionToken: string; email: string } | { ok: false }> {
  if (!token) return { ok: false };
  const tokenHash = await sha256Hex(token);
  const rec = await store.getMagicByHash(tokenHash);
  if (!rec) return { ok: false };
  // Burn BEFORE minting: a replayed link is dead even if this click
  // is still landing.
  await store.deleteMagic(tokenHash);
  if (Date.parse(rec.expiresAt) <= now.getTime()) return { ok: false };
  const sessionToken = randomToken(32);
  const sessionHash = await sha256Hex(sessionToken);
  await store.putSession(
    sessionHash,
    rec.email,
    now.toISOString(),
    new Date(now.getTime() + SESSION_TTL_MS).toISOString()
  );
  return { ok: true, sessionToken, email: rec.email };
}

export async function sessionEmail(
  store: Store,
  request: Request,
  now: Date
): Promise<string | null> {
  let token: string | null = null;
  const auth = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (m) token = m[1].trim();
  if (!token) {
    const cookie = request.headers.get("Cookie") || "";
    const cm = /(?:^|;\s*)atoms_session=([^;]+)/.exec(cookie);
    if (cm) token = decodeURIComponent(cm[1]);
  }
  if (!token) return null;
  const rec = await store.getSession(await sha256Hex(token));
  if (!rec) return null;
  if (Date.parse(rec.expiresAt) <= now.getTime()) return null;
  return rec.email;
}

/** Issue (or re-show) the user's gateway key and grant an atom scope.
 *  "Issue my key for this atom" = grant that atom's scope on the one
 *  gateway key, creating the key first if the user has none. */
export async function issueKeyForAtom(
  store: Store,
  masterSecret: string,
  email: string,
  atomService: string,
  now: Date
): Promise<{ ok: true; key: string; scopes: string[] } | { ok: false; status: number; error: string }> {
  const atom = resolveAtom(atomService);
  if (!atom) return { ok: false, status: 404, error: `unknown atom: ${atomService}` };
  await store.ensureUser(email, now.toISOString());
  let record = await store.getActiveKeyByEmail(email);
  if (!record) {
    const issuedAt = now.toISOString();
    const key = await deriveGatewayKey(masterSecret, email, issuedAt);
    const fingerprint = await keyFingerprint(masterSecret, key);
    record = await store.createKey({
      email,
      issuedAt,
      fingerprint,
      isInternal: false,
      scopes: [atom.namespace],
      now: now.toISOString(),
    });
    return { ok: true, key, scopes: record.scopes };
  }
  if (!record.scopes.includes(atom.namespace)) {
    await store.addScope(record.id, atom.namespace);
    record = { ...record, scopes: [...record.scopes, atom.namespace] };
  }
  const key = await deriveGatewayKey(masterSecret, record.email, record.issuedAt);
  return { ok: true, key, scopes: record.scopes };
}

/** Revoke the current key and reissue with a fresh issued_at;
 *  scopes carry over. Returns the new key. */
export async function revokeAndReissue(
  store: Store,
  masterSecret: string,
  email: string,
  now: Date
): Promise<{ ok: true; key: string; scopes: string[] } | { ok: false; status: number; error: string }> {
  const current = await store.getActiveKeyByEmail(email);
  if (!current) return { ok: false, status: 404, error: "no active key to revoke" };
  await store.revokeKey(current.id, now.toISOString());
  const issuedAt = now.toISOString();
  const key = await deriveGatewayKey(masterSecret, email, issuedAt);
  const fingerprint = await keyFingerprint(masterSecret, key);
  const record = await store.createKey({
    email,
    issuedAt,
    fingerprint,
    isInternal: current.isInternal,
    scopes: current.scopes,
    now: now.toISOString(),
  });
  return { ok: true, key, scopes: record.scopes };
}

/** Call-time authentication: presented key → verified record.
 *  Returns null for missing/malformed/unknown/revoked keys (→ 401). */
export async function authenticateKey(
  store: Store,
  masterSecret: string,
  presented: string | null
): Promise<KeyRecord | null> {
  if (!presented || !isGatewayKeyShape(presented)) return null;
  const fingerprint = await keyFingerprint(masterSecret, presented);
  const record = await store.getKeyByFingerprint(fingerprint);
  if (!record) return null;
  if (!(await verifyAgainstRecord(masterSecret, presented, record))) return null;
  return record;
}

export function bearerKey(request: Request): string | null {
  const h = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  if (m) return m[1].trim();
  return new URL(request.url).searchParams.get("key");
}
