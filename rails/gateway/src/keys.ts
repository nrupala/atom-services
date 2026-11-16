// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Gateway API keys (owner ruling 2026-11-15 01:39: keys are
 *  GATEWAY-level, not per-atom).
 *
 *      key = "atm_" + version + "_" + HMAC-SHA256(master_secret,
 *              email | issued_at)
 *
 *  One key per user works across atoms; per-atom independence lives
 *  in the key record's scope set (checked at call time). The key is
 *  never stored — the record holds (email, issued_at, fingerprint,
 *  revoked_at) + scopes, and the key is re-derived on demand after
 *  the user authenticates. The master secret exists only as the
 *  ATOMS_MASTER_SECRET Worker secret binding.
 */

import { hmacSha256Hex, timingSafeEqual } from "./crypto.js";

export const KEY_VERSION = "1";
export const KEY_PREFIX = `atm_${KEY_VERSION}_`;
const KEY_RE = /^atm_1_[0-9a-f]{64}$/;

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  const at = email.indexOf("@");
  if (at < 1 || at > 64) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function deriveGatewayKey(
  masterSecret: string,
  email: string,
  issuedAt: string
): Promise<string> {
  const digest = await hmacSha256Hex(masterSecret, `${email}|${issuedAt}`);
  return `${KEY_PREFIX}${digest}`;
}

/** Lookup handle for a key: a truncated HMAC of the key itself.
 *  Safe to store and log; reveals nothing about the key. */
export async function keyFingerprint(masterSecret: string, key: string): Promise<string> {
  const digest = await hmacSha256Hex(masterSecret, `fingerprint|${key}`);
  return digest.slice(0, 32);
}

export function isGatewayKeyShape(presented: unknown): presented is string {
  return typeof presented === "string" && KEY_RE.test(presented);
}

export interface KeyRecord {
  id: number;
  email: string;
  issuedAt: string;
  fingerprint: string;
  isInternal: boolean;
  revokedAt: string | null;
  scopes: string[];
}

/** Verify a presented key against its stored record: re-derive from
 *  (email, issued_at) and compare in constant time. A revoked record
 *  never verifies. */
export async function verifyAgainstRecord(
  masterSecret: string,
  presented: string,
  record: KeyRecord
): Promise<boolean> {
  if (record.revokedAt) return false;
  if (!isGatewayKeyShape(presented)) return false;
  const expected = await deriveGatewayKey(masterSecret, record.email, record.issuedAt);
  return timingSafeEqual(presented, expected);
}
