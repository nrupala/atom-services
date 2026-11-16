-- Atoms gateway state — migration 0001 (D1 database: atoms-state)
-- All money amounts are integer micro-USD (1 USD = 1,000,000).

CREATE TABLE IF NOT EXISTS users (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- One gateway key per issuance. The key itself is NEVER stored:
-- (email, issued_at) re-derives it; fingerprint is the lookup handle.
CREATE TABLE IF NOT EXISTS gateway_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL REFERENCES users(email),
  issued_at   TEXT NOT NULL,
  fingerprint TEXT NOT NULL UNIQUE,
  is_internal INTEGER NOT NULL DEFAULT 0,
  revoked_at  TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gateway_keys_email ON gateway_keys(email);

-- Per-atom entitlements on a gateway key. Scope = the atom's
-- contract namespace (e.g. release_readiness_verdict).
CREATE TABLE IF NOT EXISTS key_scopes (
  key_id INTEGER NOT NULL REFERENCES gateway_keys(id),
  scope  TEXT NOT NULL,
  PRIMARY KEY (key_id, scope)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL REFERENCES users(email),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Magic sign-in tokens: sha256 at rest, 15-min TTL, single-use.
-- One live token per email (signup deletes the prior row).
CREATE TABLE IF NOT EXISTS magic_tokens (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_tokens(email);

-- One aggregated prepaid balance per user, across all atoms.
CREATE TABLE IF NOT EXISTS balances (
  email         TEXT PRIMARY KEY REFERENCES users(email),
  balance_micro INTEGER NOT NULL DEFAULT 0
);

-- Append-only balance ledger (Router credits style): grant / draw /
-- refund, balance_after on every row, idempotency_key UNIQUE so a
-- replayed webhook or retried draw moves money at most once.
CREATE TABLE IF NOT EXISTS balance_ledger (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL,
  kind              TEXT NOT NULL CHECK (kind IN ('grant','draw','refund')),
  atom              TEXT,
  amount_micro      INTEGER NOT NULL,
  balance_after_micro INTEGER NOT NULL,
  idempotency_key   TEXT NOT NULL UNIQUE,
  ref               TEXT,
  created_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_balance_ledger_email ON balance_ledger(email, id);

-- Balance projection (Router credits pattern): every ledger entry
-- moves the projected balance exactly once, in the same write.
CREATE TRIGGER IF NOT EXISTS balance_ledger_apply
AFTER INSERT ON balance_ledger
BEGIN
  INSERT INTO balances (email, balance_micro) VALUES (NEW.email, NEW.amount_micro)
  ON CONFLICT(email) DO UPDATE SET balance_micro = balance_micro + NEW.amount_micro;
END;

-- Metering: one row per successful external call.
CREATE TABLE IF NOT EXISTS usage_rows (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  key_fingerprint   TEXT NOT NULL,
  email             TEXT NOT NULL,
  atom              TEXT NOT NULL,
  scope             TEXT NOT NULL,
  rate_charged_micro INTEGER NOT NULL,
  balance_after_micro INTEGER,
  created_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_usage_rows_key ON usage_rows(key_fingerprint, id);

-- Internal ledger (G7/R2): same shape, separate table. Scope carries
-- the _internal suffix marker (e.g. release_readiness_verdict_internal).
CREATE TABLE IF NOT EXISTS usage_internal (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  key_fingerprint   TEXT NOT NULL,
  email             TEXT NOT NULL,
  atom              TEXT NOT NULL,
  scope             TEXT NOT NULL,
  rate_charged_micro INTEGER NOT NULL,
  balance_after_micro INTEGER,
  created_at        TEXT NOT NULL
);

-- Per-key, per-atom rate-limit counters (D1 by design decision —
-- see DESIGN.md). window_kind: 'minute' | 'day'.
CREATE TABLE IF NOT EXISTS rate_counters (
  key_fingerprint TEXT NOT NULL,
  atom            TEXT NOT NULL,
  window_kind     TEXT NOT NULL,
  window_start    TEXT NOT NULL,
  count           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_fingerprint, atom, window_kind, window_start)
);

-- Runtime config: atom kill switches (atom_enabled:<service> = 0/1),
-- seeded for live atoms; a missing row means enabled.
CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO config (key, value) VALUES ('atom_enabled:release-readiness-verdict', '1');
