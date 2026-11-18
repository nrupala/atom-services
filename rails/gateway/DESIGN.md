# Atoms Gateway — design notes

One Cloudflare Worker (`atoms-gateway`) serving every live atom at
**atoms.pipavia.com**. Architecture decision (parent brief, 2026-11-15):
one gateway, per-atom handler registry — this supersedes serving.md's
"own Worker per atom" SPEC line. Per-atom isolation = key scopes +
per-atom metering rows + per-atom kill switch.

## Routes

| Route | Gate | Purpose |
|---|---|---|
| `GET /health` | none | liveness + live atom list |
| `GET /` | none | catalogue / pricing page (models.dev-style) |
| `GET /api.json` | none | machine-readable catalogue feed |
| `GET /SKILL.md` | none | agent onboarding — the repo-root SKILL.md, served verbatim (generated module) |
| `GET /docs/<atom-service>` | none | per-atom documentation (404 for disabled / unknown / undocumented) |
| `POST /mcp/<atom-service>` | gateway key + atom scope | MCP streamable-HTTP, Conduit envelope (initialize / ping / tools/list / tools/call) |
| `POST /v1/<atom-service>` | gateway key + atom scope | plain HTTP face, same contract |
| `POST /v1/signup` | none | {email} → magic sign-in link by email |
| `GET /v1/auth/redeem?token=` | magic token | burn token → session |
| `POST /v1/keys` | session | {atom} → grant scope, return the gateway key |
| `GET /v1/keys` | session | re-show the same key + scopes |
| `POST /v1/keys/revoke` | session | revoke + reissue (scopes carried over) |
| `GET /v1/balance` | session | balance + ledger tail + packs |
| `POST /v1/balance/checkout` | session | {pack} → Stripe-hosted Checkout URL |
| `POST /v1/balance/refund` | session | {payment_intent} → gateway-issued prorated refund |
| `POST /v1/stripe/webhook` | Stripe signature | grant on checkout completion, reverse on refund |

## Keys — gateway-level (owner ruling 2026-11-15 01:39)

One key per user, works across atoms; per-atom independence lives in
the key record's **scope set**.

- Derivation: `key = "atm_1_" + hex(HMAC-SHA256(master_secret, email | issued_at))`.
  `ATOMS_MASTER_SECRET` exists only as a Worker secret binding.
- The key is **never stored**. The record holds (email, issued_at,
  fingerprint, revoked_at) + scopes. Fingerprint =
  `hex(HMAC-SHA256(master_secret, "fingerprint|" + key))[:32]` —
  a lookup handle that reveals nothing about the key.
- Re-show: after session auth, re-derive from (email, issued_at) and
  return the identical key.
- Revocation: mark revoked, reissue with a fresh `issued_at`; scopes
  carry over. The old key fails because its record is revoked.
- Call-time verification: format check → fingerprint lookup →
  non-revoked record → re-derive + constant-time compare → scope
  check. Missing scope at an atom = **403** (the atom exists, the key
  lacks its scope); unknown/revoked key = **401**.
- Scope identifiers are the atoms' contract namespaces
  (atom #1: `release_readiness_verdict`).

## Sessions + magic links (mirrors the Router's magic.ts design)

32-byte base64url tokens; only the SHA-256 hash is stored; 15-minute
TTL; single-use (burned before the session is minted); one live token
per email (a new request replaces the old); 60-second send cooldown;
the signup endpoint answers uniformly whether or not the address is
known. Sessions: 32-byte tokens, SHA-256 at rest, 7-day TTL.

## Money — micro-USD, append-only

All amounts are integer **micro-USD** (1 USD = 1,000,000) so sub-cent
rates (e.g. $0.0005/call) stay exact.

- `balances(email, balance_micro)` — one aggregated prepaid balance
  per user across all atoms.
- `balance_ledger` — append-only (grant / draw / refund /
  exception), each row carries `balance_after_micro` and a UNIQUE
  `idempotency_key` (Stripe object ids for grants/refunds, call ids
  for draws), in the Router credits-ledger style. Ledger writes +
  balance projection happen in one D1 batch.
- Packs: $10 / $49 / $199 one-time Stripe prices on the one AIMLDS
  account; checkout is Stripe-hosted; the webhook grants.
- Refunds are **prorated** (owner's rule, 2026-11-15;
  REFUNDS-DESIGN.md): a refund returns only the unspent balance
  attributable to its payment (FIFO attribution computed from the
  ledger). The gateway issues refunds itself via the Stripe API;
  the webhook reversal equals the amount Stripe actually refunded,
  clamped to the attributable balance, with any excess booked as a
  zero-amount `exception` entry — never a silent negative.

## Rates — contract-synced, generated, never hand-copied

Source of truth = each atom's `contract.yaml` `pricing:` block.
`tools/sync-rates.mjs` reads the live-atom registry
(`atoms.registry.json`) + the contracts and generates
`src/generated.ts` (rates + catalogue rows). The gateway charges
**and displays** from that one generated module — displayed ==
charged mechanically. Atom #1: `rate: null, rate_status: pending`
→ generated rate is `null` → calls meter at **zero** (free-trial
posture, rails/billing.md) and the catalogue shows "Free during
trial — rate pending". When the owner rules a rate it lands in the
contract, the config regenerates, and the drawdown path activates
by config alone. No global blended rate; one rate record per atom.

## Presentation records — limits, traces, skill (generated)

Three more generated modules render beside the rates, each from
its own record of truth, none hand-copied:

- `src/limits.generated.ts` (`tools/sync-limits.mjs`) — one
  "does not cover" clause per atom, extracted verbatim from the
  atom's `SERVICE.md` record (Honest scoping first, with a recorded
  fallback chain) and asserted at generation time to be a substring
  of that record.
- `src/traces.generated.ts` (`tools/sync-traces.mjs`) — one
  measured trace per atom from the recorded verification runs
  (`verification/results/<atom>.json`, TEST-REPORT check counts,
  the atom's GATE-VERDICT buckets): what was run, the latest
  verdict, and the Not run / Not covered / Excluded buckets, each
  present only where the record carries it. The Guardian Mesh
  disposition is NOT RUN fleet-wide and is named on every trace.
- `src/skill.generated.ts` (`tools/sync-skill.mjs`) — the repo-root
  `SKILL.md`, served at `GET /SKILL.md`.

Both presentation surfaces (catalogue HTML + `/api.json`) attach
the limits line and the trace to LIVE rows only: a kill-switch-
disabled atom stays absent from the page and status-only in the
feed, exactly as with the documentation link.

## Metering + rate limits

- Every successful (authenticated, in-scope, non-over-limit) call
  appends a `usage_rows` entry: key fingerprint, atom, timestamp,
  rate charged, balance after. Failed calls (401/403/402/422/429)
  are not metered.
- If the atom's rate is > 0: balance is checked before dispatch
  (insufficient → **402**, not metered) and drawn at settle.
- Rate limits (contract SPEC defaults): 60/minute + 10,000/day per
  key per atom. Counters live in **D1** (chosen over KV: one store,
  transactional increments, no second consistency model at this
  scale). Over limit → **429** naming the limit; over-limit calls
  are not metered.

## Internal caller (G7)

One internal gateway key for `internal@aimlds.org`, scoped to atom
#1, flagged internal. Same code path; rate forced to zero always;
calls land in `usage_internal` (the internal ledger), whose rows
carry the scope marker with the `_internal` suffix
(`release_readiness_verdict_internal`). Never counted as revenue.

## Kill switch + registry graduation path

Each atom has an `atom_enabled:<service>` row in the D1 `config`
table; disabling an atom returns 503 at its routes only, gateway and
other atoms untouched.

The atom registry (`src/atoms-registry.ts`) resolves a service name
to a handler descriptor `{kind: "local", handler}` today. The
descriptor is the graduation seam: a future per-atom Worker sits
behind the same route by flipping the descriptor to
`{kind: "proxy", upstream}` — the router then proxies the call with
the caller's key and meters from the response — without changing
public endpoints, user keys, scopes, or the ledger shape.

## Stores

One D1 database, `atoms-state`: users, gateway_keys, key_scopes,
sessions, magic_tokens, balances, balance_ledger, usage_rows,
usage_internal, rate_counters, config. The store layer
(`src/store.ts`) is an interface with a D1 implementation and an
in-memory implementation used by the unit tests.
