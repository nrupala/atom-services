-- Atoms gateway state — migration 0002 (D1 database: atoms-state)
-- Prorated refunds (owner's rule, 2026-11-15; REFUNDS-DESIGN.md):
--   * ledger kind gains 'exception' — a zero-amount entry recording
--     money Stripe took beyond a grant's attributable balance on a
--     refund the gateway did not issue (manual / dispute clawback).
--   * ledger rows gain a free-text `note` (refund ids, exception
--     detail) so the audit trail lives in the ledger itself.
-- SQLite cannot alter a CHECK constraint, so the table is rebuilt;
-- every row is preserved verbatim. Apply statements one at a time
-- (D1 query API), verifying row counts before and after.

DROP TRIGGER IF EXISTS balance_ledger_apply;

CREATE TABLE balance_ledger_new (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL,
  kind              TEXT NOT NULL CHECK (kind IN ('grant','draw','refund','exception')),
  atom              TEXT,
  amount_micro      INTEGER NOT NULL,
  balance_after_micro INTEGER NOT NULL,
  idempotency_key   TEXT NOT NULL UNIQUE,
  ref               TEXT,
  created_at        TEXT NOT NULL,
  note              TEXT
);

INSERT INTO balance_ledger_new (id, email, kind, atom, amount_micro, balance_after_micro, idempotency_key, ref, created_at, note)
  SELECT id, email, kind, atom, amount_micro, balance_after_micro, idempotency_key, ref, created_at, NULL FROM balance_ledger;

DROP TABLE balance_ledger;

ALTER TABLE balance_ledger_new RENAME TO balance_ledger;

CREATE INDEX idx_balance_ledger_email ON balance_ledger(email, id);

CREATE TRIGGER balance_ledger_apply
AFTER INSERT ON balance_ledger
BEGIN
  INSERT INTO balances (email, balance_micro) VALUES (NEW.email, NEW.amount_micro)
  ON CONFLICT(email) DO UPDATE SET balance_micro = balance_micro + NEW.amount_micro;
END;
