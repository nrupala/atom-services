# Census follow-up — regulatory takedown, 2026-11-15

Follow-up to `REPLICATION-CENSUS.md` and the atoms regulatory census of
2026-11-15 (24 of 86 live atoms flagged for a regulatory screen).

## The ruling

Owner ruling (Product Atoms thread, 2026-11-15 21:42 MST): disable the
highest-exposure set NOW — seven atoms. Process line **U-13**
(`corporate/processes/service-unit-delivery.md`, added the same evening):
a service unit whose output is or could read as regulated professional
advice is screened YES/NO before it counts as properly published, and
publishes only on the owner's explicit per-unit ruling after he sees the
screen — blanket approval never waives the regulatory gate.

## The seven, disabled 2026-11-15

Kill switch per atom: D1 `atoms-state` config row `atom_enabled:<atom>`
set `1` → `0`, each write read back. Fleet read-back after the disables:
**79 enabled / 7 disabled.**

| Atom | Census ground |
|---|---|
| electrical-machines-expert-advice | engineering expert advice |
| portfolio-risk-analytics-report | securities/financial advice adjacency |
| reconciled-portfolio-performance-report | securities/financial advice adjacency |
| strategy-backtest-validation | securities/financial advice adjacency |
| behavioral-finance-bias-check | investor-decision advice |
| behavioral-finance-debiasing | investor-decision advice |
| difficult-conversation-coaching | psychology-adjacent; the owner's own assessment is required before it may return |

Each atom's own record: `services/<atom>/TAKEDOWN-2026-11-15.md`
(ruling, mechanism, per-face proofs).

## Proofs (scoped-key calls, 2026-11-15 MST)

Key: external-verification gateway key (prefix `atm_1_ac543f43d09d66`,
last-4 `b1a2`), scoped for all seven.

- **REST, all seven:** `POST /v1/<atom>` → **HTTP 503**,
  `{"ok":false,"error":"atom_disabled","detail":"<atom> is currently disabled"}`.
- **MCP, all seven:** `tools/call` on `/mcp/<atom>` → refused with the
  kill-switch state as the JSON-RPC error object (HTTP 200 transport,
  per JSON-RPC convention): `{"jsonrpc":"2.0","id":2,"error":{"code":-32602,"message":"<atom> is currently disabled"}}`
  — no result returned, the atom did not execute. (`tools/list` remains
  public discovery by design; the call is the gated surface.)
- **Unaffected fleet:** D1 counts 79 × `atom_enabled = 1`; golden control
  call on release-readiness-verdict (recorded full-pass manifest) →
  HTTP 200, verdict READY. (First control attempt returned 429 — the
  shared tester key's 60/min rate limit under concurrent verification
  traffic; the spaced retry returned 200.)

## Presentation state — GAP OPEN, reported to the parent lane

The call layer enforces the takedown; the presentation layer did not yet
reflect it when read on 2026-11-15:

- **Catalogue page** (atoms.pipavia.com): all seven still appear as
  ordinary rows with live endpoint links and "Free during trial — rate
  pending", indistinguishable from live atoms.
- **`/api.json`**: all seven entries identical in shape to a live atom's
  (name, description, endpoints, trial pricing); the feed carries **no
  per-atom status/enabled field** — it is generated from contracts and
  does not read the D1 kill-switch state.
- **`/health`**: lists all 86 registered atom names; no per-atom status.
- **MCP Registry**: each `org.aimlds/atom-<atom>` record still reads
  `status: active`, `isLatest: true` (read-only check; no change made).

An atom that is down must not present as available: closing this requires
a gateway patch (catalogue + feed read the kill-switch state) routed
through the replication stream, and a registry-record decision by the
parent/owner. Neither is executed by this note.

## The rest of the census

The remaining **17 census-flagged atoms STAY LIVE** pending the owner's
review of the full census. Nothing beyond the seven named above was
disabled. The seven return **only** on the owner's explicit per-atom
ruling.

- **2026-11-15 — Registry republication (all seven):** each `org.aimlds/atom-<atom>` record above was republished as **v0.1.1** with a description stating the atom is DISABLED by the owner's ruling, pending U-13 regulatory review, and that the endpoint refuses calls; every record was read back from the registry API and verified (v0.1.1, status active, isLatest true, description served verbatim). Per-atom lines are in each atom's TAKEDOWN record. The catalogue / `/api.json` / `/health` leg of the presentation gap remains open (gateway patch, replication stream).
