# Prorated refunds — design note (owner's rule, 2026-11-15)

Owner's ruling, verbatim in substance: **refunds are prorated** — if a
customer spent $3 of a $10 pack, he gets $7 back, not $10. The spent
portion is earned and kept. This supersedes the build lane's original
doctrine (reverse the full grant on refund; balance may go negative —
"honest accounting over silent clamping", formerly in `store.ts` /
`billing.ts`). That doctrine is dead; this note is the replacement
design of record.

## (a) Refund computation + attribution

Refundable amount for a payment, computed **at refund execution time**:

    refundable(payment) = grant(payment) − draws attributed to that grant
                          − reversals already posted against that grant

**Attribution rule: FIFO by grant age.** The ledger is append-only and
draws carry no grant link (a draw names its atom + call id only), so
attribution is *computed from the ledger*, never stored: walking the
user's ledger chronologically, each draw consumes the oldest grant
with remaining attributable balance; each refund reversal consumes
the remaining balance of the grant its payment names (`ref` =
payment_intent). This fits the existing design — one aggregated
balance, attribution as a pure function of ledger history
(`attributeLedger` in `billing.ts`) — and needs no backfill and no
draw-path schema change. FIFO is also the conservative reading of the
owner's rule: the oldest pack is treated as spent first, so a refund
on a newer pack is reduced only by spend beyond the older packs.

Issuance rounds the refundable amount **down to whole cents**
(Stripe's smallest unit): the gateway never refunds more than is
attributable. A sub-cent residue stays as spendable balance.

## (b) Issuance path — the gateway issues refunds

`POST /v1/balance/refund` (session-authed, body `{payment_intent}`)
computes the refundable amount for a grant **owned by the session
user** and calls Stripe `POST /v1/refunds` with the worker's
`STRIPE_SECRET_KEY`, an explicit `amount` (the prorated cents), and
idempotency key `atoms-refund:<payment_intent>:<cents>` so a retried
request replays the same Stripe refund instead of issuing a second.

**Key permission — VERIFIED GAP (2026-11-15):** creating a refund
requires the restricted-key permission **"Charges and Refunds:
Write"** (Core section of Stripe's permission table; Stripe groups
charges + refunds in that one row). The current test key
("Atoms Gateway (test)", …cP9L) holds only Checkout Sessions Write,
Customers Write, Payment Intents Write, Products Read — it **cannot**
create refunds. The endpoint therefore surfaces Stripe's refusal as a
distinct `refund_permission_denied` error. Remedy (dashboard act):
re-issue the key with **Charges and Refunds: Write** added and
replace the `STRIPE_SECRET_KEY` Worker secret. The future live key
needs the same permission. Until then the issuance path is built,
deployed and fenced, but a live refund attempt returns Stripe's
permission error — named, not silent.

## (c) Webhook handler — reversal equals the actual refund

`charge.refunded` no longer reverses the grant. For each refund
object on the charge (status `succeeded`), the handler posts a
`refund` ledger entry of **exactly the amount Stripe actually
refunded** (from the event payload), idempotency key
`stripe:refund:<charge_id>` (e.g. `stripe:refund:ch_…`) — keyed by
charge, exactly one reversal per charge refund event; replayed
events find the recorded key and skip. A prorated refund
after partial draw therefore closes the attributable balance at
exactly 0 (grant 10,000,000 µ − draws 3,000,000 µ − reversal
7,000,000 µ). Sparse payloads without a refunds list fall back to
the charge's cumulative `amount_refunded` minus what the ledger
already reversed for that grant; a payload with no amounts at all is
the pre-1.1.0 shape and is read as a full charge refund.

## (d) Refunds the gateway did not issue

Manual dashboard refunds and dispute clawbacks arrive through the
same webhook. The reversal is **clamped to the balance still
attributable to that grant** at processing time; any excess Stripe
took beyond the attributable balance is recorded as an explicit
zero-amount ledger entry of kind **`exception`** (migration 0002)
whose `note` states the excess in micro-USD and the refund id. The
balance is never silently driven negative: the excess is a named
receivable-side fact in the ledger, not a hidden hole. The same
clamp covers the race where a gateway-issued refund lands after the
user spent further.

## (e) Doctrine text

`store.ts` and `billing.ts` header comments now state the owner's
prorated rule above. The full-reversal doctrine text is removed
everywhere it appeared.
