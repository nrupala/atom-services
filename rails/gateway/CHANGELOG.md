# Changelog — atoms gateway

## 1.1.0 — 2026-11-15

- **Prorated refunds (owner's rule; REFUNDS-DESIGN.md).** A refund
  now returns only the unspent balance attributable to its payment
  (spent $3 of $10 → $7 back); the full-grant reversal doctrine is
  superseded. New session endpoint `POST /v1/balance/refund` issues
  the refund through the Stripe API (needs the key's "Charges and
  Refunds: Write" permission — the current test key lacks it; the
  endpoint answers a named `refund_permission_denied` until the key
  is re-issued). The `charge.refunded` webhook reversal equals the
  amount Stripe actually refunded, one reversal per refund id,
  clamped to the attributable balance; excess taken by Stripe on
  refunds the gateway did not issue posts an explicit zero-amount
  `exception` ledger entry (migration 0002 adds the kind + a `note`
  column) — never a silent negative.
- FIFO draw attribution computed from the append-only ledger
  (`attributeLedger`); no draw-path schema change.

## 1.0.0 — 2026-11-15

- First deployment at atoms.pipavia.com (release candidate; in soak).
- Atom #1 `release-readiness-verdict` live on the MCP + HTTP faces:
  deterministic verdict core ported from the Python reference with
  oracle-test parity (golden fixtures).
- Gateway keys with per-atom scopes; magic-link signup; sessions.
- Metering (per-key, per-atom), D1 rate limits (60/min, 10,000/day),
  per-atom kill switch, internal-caller ledger.
- Aggregated prepaid balance + append-only ledger; Stripe pack
  checkout + webhook grant/refund (armed per-mode by configuration;
  atom #1's rate is unset — calls meter at zero, free-trial posture).
- Catalogue page + `/api.json` feed generated from the atom
  contracts' pricing blocks (displayed == charged).
