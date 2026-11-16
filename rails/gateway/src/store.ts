// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Store layer for the atoms gateway. One interface, two
 *  implementations: D1 (production, database `atoms-state`) and
 *  in-memory (unit tests). Money is integer micro-USD throughout.
 *
 *  Balance projection follows the Router credits pattern: the
 *  append-only ledger is the truth; a trigger projects each entry
 *  into `balances`. Refunds are PRORATED (owner's rule, 2026-11-15;
 *  REFUNDS-DESIGN.md): a refund reverses only the unspent balance
 *  attributable to its payment — the spent portion is earned and
 *  kept — so a reversal never takes an attributable balance below
 *  zero. Money Stripe took beyond the attributable balance (a
 *  refund the gateway did not issue) is recorded as an explicit
 *  zero-amount `exception` entry, never a silent negative.
 */

import type { KeyRecord } from "./keys.js";

export interface MagicRecord {
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface LedgerRow {
  id: number;
  email: string;
  kind: "grant" | "draw" | "refund" | "exception";
  atom: string | null;
  amountMicro: number;
  balanceAfterMicro: number;
  idempotencyKey: string;
  ref: string | null;
  createdAt: string;
  note: string | null;
}

export interface UsageRow {
  keyFingerprint: string;
  email: string;
  atom: string;
  scope: string;
  rateChargedMicro: number;
  balanceAfterMicro: number | null;
  createdAt: string;
}

export interface Store {
  ensureUser(email: string, now: string): Promise<void>;

  putMagic(tokenHash: string, email: string, createdAt: string, expiresAt: string): Promise<void>;
  getMagicByEmail(email: string): Promise<MagicRecord | null>;
  getMagicByHash(tokenHash: string): Promise<MagicRecord | null>;
  deleteMagic(tokenHash: string): Promise<void>;

  putSession(tokenHash: string, email: string, createdAt: string, expiresAt: string): Promise<void>;
  getSession(tokenHash: string): Promise<{ email: string; expiresAt: string } | null>;

  createKey(rec: {
    email: string;
    issuedAt: string;
    fingerprint: string;
    isInternal: boolean;
    scopes: string[];
    now: string;
  }): Promise<KeyRecord>;
  getKeyByFingerprint(fingerprint: string): Promise<KeyRecord | null>;
  getActiveKeyByEmail(email: string): Promise<KeyRecord | null>;
  addScope(keyId: number, scope: string): Promise<void>;
  revokeKey(keyId: number, revokedAt: string): Promise<void>;

  getBalance(email: string): Promise<number>;
  appendLedger(entry: {
    email: string;
    kind: LedgerRow["kind"];
    atom: string | null;
    amountMicro: number;
    idempotencyKey: string;
    ref: string | null;
    now: string;
    note?: string | null;
  }): Promise<{ applied: boolean; balanceAfter: number }>;
  listLedger(email: string, limit: number): Promise<LedgerRow[]>;
  /** Full ledger history for one user, chronological (id ASC) —
   *  the input to refund attribution (REFUNDS-DESIGN.md). */
  ledgerHistory(email: string): Promise<LedgerRow[]>;
  findGrantByRef(ref: string): Promise<LedgerRow | null>;

  appendUsage(internal: boolean, row: UsageRow): Promise<void>;
  listUsage(internal: boolean, limit: number): Promise<UsageRow[]>;

  bumpCounter(fingerprint: string, atom: string, kind: "minute" | "day", windowStart: string): Promise<number>;
  getConfig(key: string): Promise<string | null>;
}

// ---------------------------------------------------------------------------
// In-memory implementation (tests)
// ---------------------------------------------------------------------------

export class MemoryStore implements Store {
  users = new Set<string>();
  magic = new Map<string, MagicRecord & { tokenHash: string }>();
  sessions = new Map<string, { email: string; expiresAt: string }>();
  keys = new Map<number, KeyRecord>();
  keyByFingerprint = new Map<string, number>();
  nextKeyId = 1;
  balances = new Map<string, number>();
  ledger: LedgerRow[] = [];
  ledgerByIdem = new Map<string, LedgerRow>();
  usage: UsageRow[] = [];
  usageInternal: UsageRow[] = [];
  counters = new Map<string, number>();
  config = new Map<string, string>();

  async ensureUser(email: string): Promise<void> {
    this.users.add(email);
  }

  async putMagic(tokenHash: string, email: string, createdAt: string, expiresAt: string): Promise<void> {
    for (const [h, r] of this.magic) if (r.email === email) this.magic.delete(h);
    this.magic.set(tokenHash, { tokenHash, email, createdAt, expiresAt });
  }
  async getMagicByEmail(email: string): Promise<MagicRecord | null> {
    for (const r of this.magic.values()) if (r.email === email) return r;
    return null;
  }
  async getMagicByHash(tokenHash: string): Promise<MagicRecord | null> {
    return this.magic.get(tokenHash) ?? null;
  }
  async deleteMagic(tokenHash: string): Promise<void> {
    this.magic.delete(tokenHash);
  }

  async putSession(tokenHash: string, email: string, _createdAt: string, expiresAt: string): Promise<void> {
    this.sessions.set(tokenHash, { email, expiresAt });
  }
  async getSession(tokenHash: string): Promise<{ email: string; expiresAt: string } | null> {
    return this.sessions.get(tokenHash) ?? null;
  }

  async createKey(rec: {
    email: string; issuedAt: string; fingerprint: string; isInternal: boolean; scopes: string[]; now: string;
  }): Promise<KeyRecord> {
    const record: KeyRecord = {
      id: this.nextKeyId++,
      email: rec.email,
      issuedAt: rec.issuedAt,
      fingerprint: rec.fingerprint,
      isInternal: rec.isInternal,
      revokedAt: null,
      scopes: [...rec.scopes],
    };
    this.keys.set(record.id, record);
    this.keyByFingerprint.set(record.fingerprint, record.id);
    return record;
  }
  async getKeyByFingerprint(fingerprint: string): Promise<KeyRecord | null> {
    const id = this.keyByFingerprint.get(fingerprint);
    return id === undefined ? null : (this.keys.get(id) ?? null);
  }
  async getActiveKeyByEmail(email: string): Promise<KeyRecord | null> {
    for (const k of this.keys.values()) {
      if (k.email === email && !k.revokedAt) return k;
    }
    return null;
  }
  async addScope(keyId: number, scope: string): Promise<void> {
    const k = this.keys.get(keyId);
    if (k && !k.scopes.includes(scope)) k.scopes.push(scope);
  }
  async revokeKey(keyId: number, revokedAt: string): Promise<void> {
    const k = this.keys.get(keyId);
    if (k) k.revokedAt = revokedAt;
  }

  async getBalance(email: string): Promise<number> {
    return this.balances.get(email) ?? 0;
  }
  async appendLedger(entry: {
    email: string; kind: LedgerRow["kind"]; atom: string | null; amountMicro: number;
    idempotencyKey: string; ref: string | null; now: string; note?: string | null;
  }): Promise<{ applied: boolean; balanceAfter: number }> {
    const existing = this.ledgerByIdem.get(entry.idempotencyKey);
    if (existing) return { applied: false, balanceAfter: await this.getBalance(entry.email) };
    const balanceAfter = (await this.getBalance(entry.email)) + entry.amountMicro;
    const row: LedgerRow = {
      id: this.ledger.length + 1,
      email: entry.email,
      kind: entry.kind,
      atom: entry.atom,
      amountMicro: entry.amountMicro,
      balanceAfterMicro: balanceAfter,
      idempotencyKey: entry.idempotencyKey,
      ref: entry.ref,
      createdAt: entry.now,
      note: entry.note ?? null,
    };
    this.ledger.push(row);
    this.ledgerByIdem.set(entry.idempotencyKey, row);
    this.balances.set(entry.email, balanceAfter);
    return { applied: true, balanceAfter };
  }
  async listLedger(email: string, limit: number): Promise<LedgerRow[]> {
    return this.ledger.filter((r) => r.email === email).slice(-limit).reverse();
  }
  async ledgerHistory(email: string): Promise<LedgerRow[]> {
    return this.ledger.filter((r) => r.email === email);
  }
  async findGrantByRef(ref: string): Promise<LedgerRow | null> {
    return this.ledger.find((r) => r.kind === "grant" && r.ref === ref) ?? null;
  }

  async appendUsage(internal: boolean, row: UsageRow): Promise<void> {
    (internal ? this.usageInternal : this.usage).push(row);
  }
  async listUsage(internal: boolean, limit: number): Promise<UsageRow[]> {
    return (internal ? this.usageInternal : this.usage).slice(-limit).reverse();
  }

  async bumpCounter(fingerprint: string, atom: string, kind: "minute" | "day", windowStart: string): Promise<number> {
    const k = `${fingerprint}|${atom}|${kind}|${windowStart}`;
    const next = (this.counters.get(k) ?? 0) + 1;
    this.counters.set(k, next);
    return next;
  }
  async getConfig(key: string): Promise<string | null> {
    return this.config.get(key) ?? null;
  }
}

// ---------------------------------------------------------------------------
// D1 implementation (production)
// ---------------------------------------------------------------------------

interface D1Prepared {
  bind(...values: unknown[]): D1Prepared;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}
export interface D1Database {
  prepare(sql: string): D1Prepared;
}

interface KeyRow {
  id: number; email: string; issued_at: string; fingerprint: string;
  is_internal: number; revoked_at: string | null;
}

interface LedgerSqlRow {
  id: number; email: string; kind: LedgerRow["kind"]; atom: string | null;
  amount_micro: number; balance_after_micro: number; idempotency_key: string;
  ref: string | null; created_at: string; note: string | null;
}

function ledgerRowFromSql(r: LedgerSqlRow): LedgerRow {
  return {
    id: r.id, email: r.email, kind: r.kind, atom: r.atom, amountMicro: r.amount_micro,
    balanceAfterMicro: r.balance_after_micro, idempotencyKey: r.idempotency_key,
    ref: r.ref, createdAt: r.created_at, note: r.note ?? null,
  };
}

export class D1Store implements Store {
  constructor(private readonly db: D1Database) {}

  async ensureUser(email: string, now: string): Promise<void> {
    await this.db.prepare(
      "INSERT INTO users (email, created_at) VALUES (?1, ?2) ON CONFLICT(email) DO NOTHING"
    ).bind(email, now).run();
    await this.db.prepare(
      "INSERT INTO balances (email, balance_micro) VALUES (?1, 0) ON CONFLICT(email) DO NOTHING"
    ).bind(email).run();
  }

  async putMagic(tokenHash: string, email: string, createdAt: string, expiresAt: string): Promise<void> {
    await this.db.prepare("DELETE FROM magic_tokens WHERE email = ?1").bind(email).run();
    await this.db.prepare(
      "INSERT INTO magic_tokens (token_hash, email, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)"
    ).bind(tokenHash, email, createdAt, expiresAt).run();
  }
  async getMagicByEmail(email: string): Promise<MagicRecord | null> {
    const r = await this.db.prepare(
      "SELECT email, created_at, expires_at FROM magic_tokens WHERE email = ?1 ORDER BY created_at DESC LIMIT 1"
    ).bind(email).first<{ email: string; created_at: string; expires_at: string }>();
    return r ? { email: r.email, createdAt: r.created_at, expiresAt: r.expires_at } : null;
  }
  async getMagicByHash(tokenHash: string): Promise<MagicRecord | null> {
    const r = await this.db.prepare(
      "SELECT email, created_at, expires_at FROM magic_tokens WHERE token_hash = ?1"
    ).bind(tokenHash).first<{ email: string; created_at: string; expires_at: string }>();
    return r ? { email: r.email, createdAt: r.created_at, expiresAt: r.expires_at } : null;
  }
  async deleteMagic(tokenHash: string): Promise<void> {
    await this.db.prepare("DELETE FROM magic_tokens WHERE token_hash = ?1").bind(tokenHash).run();
  }

  async putSession(tokenHash: string, email: string, createdAt: string, expiresAt: string): Promise<void> {
    await this.db.prepare(
      "INSERT INTO sessions (token_hash, email, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)"
    ).bind(tokenHash, email, createdAt, expiresAt).run();
  }
  async getSession(tokenHash: string): Promise<{ email: string; expiresAt: string } | null> {
    const r = await this.db.prepare(
      "SELECT email, expires_at FROM sessions WHERE token_hash = ?1"
    ).bind(tokenHash).first<{ email: string; expires_at: string }>();
    return r ? { email: r.email, expiresAt: r.expires_at } : null;
  }

  private async scopesOf(keyId: number): Promise<string[]> {
    const { results } = await this.db.prepare(
      "SELECT scope FROM key_scopes WHERE key_id = ?1 ORDER BY scope"
    ).bind(keyId).all<{ scope: string }>();
    return results.map((r) => r.scope);
  }
  private async toKeyRecord(r: KeyRow): Promise<KeyRecord> {
    return {
      id: r.id,
      email: r.email,
      issuedAt: r.issued_at,
      fingerprint: r.fingerprint,
      isInternal: r.is_internal === 1,
      revokedAt: r.revoked_at,
      scopes: await this.scopesOf(r.id),
    };
  }

  async createKey(rec: {
    email: string; issuedAt: string; fingerprint: string; isInternal: boolean; scopes: string[]; now: string;
  }): Promise<KeyRecord> {
    const res = await this.db.prepare(
      "INSERT INTO gateway_keys (email, issued_at, fingerprint, is_internal, revoked_at, created_at) VALUES (?1, ?2, ?3, ?4, NULL, ?5) RETURNING id"
    ).bind(rec.email, rec.issuedAt, rec.fingerprint, rec.isInternal ? 1 : 0, rec.now).first<{ id: number }>();
    const id = res!.id;
    for (const scope of rec.scopes) {
      await this.db.prepare(
        "INSERT OR IGNORE INTO key_scopes (key_id, scope) VALUES (?1, ?2)"
      ).bind(id, scope).run();
    }
    return {
      id, email: rec.email, issuedAt: rec.issuedAt, fingerprint: rec.fingerprint,
      isInternal: rec.isInternal, revokedAt: null, scopes: [...rec.scopes],
    };
  }
  async getKeyByFingerprint(fingerprint: string): Promise<KeyRecord | null> {
    const r = await this.db.prepare(
      "SELECT id, email, issued_at, fingerprint, is_internal, revoked_at FROM gateway_keys WHERE fingerprint = ?1"
    ).bind(fingerprint).first<KeyRow>();
    return r ? this.toKeyRecord(r) : null;
  }
  async getActiveKeyByEmail(email: string): Promise<KeyRecord | null> {
    const r = await this.db.prepare(
      "SELECT id, email, issued_at, fingerprint, is_internal, revoked_at FROM gateway_keys WHERE email = ?1 AND revoked_at IS NULL ORDER BY id DESC LIMIT 1"
    ).bind(email).first<KeyRow>();
    return r ? this.toKeyRecord(r) : null;
  }
  async addScope(keyId: number, scope: string): Promise<void> {
    await this.db.prepare(
      "INSERT OR IGNORE INTO key_scopes (key_id, scope) VALUES (?1, ?2)"
    ).bind(keyId, scope).run();
  }
  async revokeKey(keyId: number, revokedAt: string): Promise<void> {
    await this.db.prepare(
      "UPDATE gateway_keys SET revoked_at = ?2 WHERE id = ?1"
    ).bind(keyId, revokedAt).run();
  }

  async getBalance(email: string): Promise<number> {
    const r = await this.db.prepare(
      "SELECT balance_micro FROM balances WHERE email = ?1"
    ).bind(email).first<{ balance_micro: number }>();
    return r?.balance_micro ?? 0;
  }
  async appendLedger(entry: {
    email: string; kind: LedgerRow["kind"]; atom: string | null; amountMicro: number;
    idempotencyKey: string; ref: string | null; now: string; note?: string | null;
  }): Promise<{ applied: boolean; balanceAfter: number }> {
    const res = await this.db.prepare(
      `INSERT INTO balance_ledger (email, kind, atom, amount_micro, balance_after_micro, idempotency_key, ref, created_at, note)
       VALUES (?1, ?2, ?3, ?4,
         (SELECT COALESCE((SELECT balance_micro FROM balances WHERE email = ?1), 0)) + ?4,
         ?5, ?6, ?7, ?8)
       ON CONFLICT(idempotency_key) DO NOTHING`
    ).bind(entry.email, entry.kind, entry.atom, entry.amountMicro, entry.idempotencyKey, entry.ref, entry.now, entry.note ?? null).run();
    return { applied: res.meta.changes > 0, balanceAfter: await this.getBalance(entry.email) };
  }
  async listLedger(email: string, limit: number): Promise<LedgerRow[]> {
    const { results } = await this.db.prepare(
      "SELECT id, email, kind, atom, amount_micro, balance_after_micro, idempotency_key, ref, created_at, note FROM balance_ledger WHERE email = ?1 ORDER BY id DESC LIMIT ?2"
    ).bind(email, limit).all<LedgerSqlRow>();
    return results.map(ledgerRowFromSql);
  }
  async ledgerHistory(email: string): Promise<LedgerRow[]> {
    const { results } = await this.db.prepare(
      "SELECT id, email, kind, atom, amount_micro, balance_after_micro, idempotency_key, ref, created_at, note FROM balance_ledger WHERE email = ?1 ORDER BY id ASC"
    ).bind(email).all<LedgerSqlRow>();
    return results.map(ledgerRowFromSql);
  }
  async findGrantByRef(ref: string): Promise<LedgerRow | null> {
    const r = await this.db.prepare(
      "SELECT id, email, kind, atom, amount_micro, balance_after_micro, idempotency_key, ref, created_at, note FROM balance_ledger WHERE kind = 'grant' AND ref = ?1 LIMIT 1"
    ).bind(ref).first<LedgerSqlRow>();
    return r ? ledgerRowFromSql(r) : null;
  }

  async appendUsage(internal: boolean, row: UsageRow): Promise<void> {
    const table = internal ? "usage_internal" : "usage_rows";
    await this.db.prepare(
      `INSERT INTO ${table} (key_fingerprint, email, atom, scope, rate_charged_micro, balance_after_micro, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(row.keyFingerprint, row.email, row.atom, row.scope, row.rateChargedMicro, row.balanceAfterMicro, row.createdAt).run();
  }
  async listUsage(internal: boolean, limit: number): Promise<UsageRow[]> {
    const table = internal ? "usage_internal" : "usage_rows";
    const { results } = await this.db.prepare(
      `SELECT key_fingerprint, email, atom, scope, rate_charged_micro, balance_after_micro, created_at FROM ${table} ORDER BY id DESC LIMIT ?1`
    ).bind(limit).all<{
      key_fingerprint: string; email: string; atom: string; scope: string;
      rate_charged_micro: number; balance_after_micro: number | null; created_at: string;
    }>();
    return results.map((r) => ({
      keyFingerprint: r.key_fingerprint, email: r.email, atom: r.atom, scope: r.scope,
      rateChargedMicro: r.rate_charged_micro, balanceAfterMicro: r.balance_after_micro,
      createdAt: r.created_at,
    }));
  }

  async bumpCounter(fingerprint: string, atom: string, kind: "minute" | "day", windowStart: string): Promise<number> {
    const r = await this.db.prepare(
      `INSERT INTO rate_counters (key_fingerprint, atom, window_kind, window_start, count)
       VALUES (?1, ?2, ?3, ?4, 1)
       ON CONFLICT(key_fingerprint, atom, window_kind, window_start)
       DO UPDATE SET count = count + 1
       RETURNING count`
    ).bind(fingerprint, atom, kind, windowStart).first<{ count: number }>();
    return r!.count;
  }
  async getConfig(key: string): Promise<string | null> {
    const r = await this.db.prepare(
      "SELECT value FROM config WHERE key = ?1"
    ).bind(key).first<{ value: string }>();
    return r?.value ?? null;
  }
}
