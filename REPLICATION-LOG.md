# Replication Log — atom-services

Program: replicate atom #1's live pattern for all atoms. Owner ruling
2026-11-15: proof of concept is over; no per-atom transaction cycles
(the money path was proven once, on atom #1); every contract's pricing
stays null until the owner rules per atom.

## 2026-11-15 — Step 0: census + baseline

- Census written to `REPLICATION-CENSUS.md` (direct filesystem reads
  + test execution, not register inference).
  - LIVE (already replicated): **1** — `release-readiness-verdict`
    (Python oracle 16/16, gateway suite 37/37, both re-run today).
  - GAP-G1 (contract-only, bound skill exists): **153**
  - GAP-G2 (contract-only, no bound skill): **8**
  - Core present but tests failing: **0**
  - Pricing: 162/162 contracts carry `rate: null` — untouched.
- Baseline commit: `rails/gateway/src/callpath.ts` (the
  `rate_override:<service>` D1 config seam from the billing-proof
  cycle) committed deliberately after the gateway suite ran green
  (37/37). Local commit only — repo is never pushed (publication is
  the owner's separate decision).
- **STOP — design-level blocker (see census conclusion):** the
  brief's per-atom recipe is a *port* proven against a Python oracle.
  161 of 162 atoms have no core and no oracle — only a contract and a
  prose skill. Bulk porting batches cannot start until cores exist.

### Recommended shape (for the parent's ruling)

Per-atom **core-authoring** builds, in queue order (Tier A first),
each atom going through the full sequence atom #1 actually used:

1. Design from the bound skill: input schema, deterministic check
   set, verdict/artifact logic, evidence wording.
2. Author the Python oracle core + tests + golden fixtures FIRST.
3. TS port proven against the oracle (ported tests + differential).
4. Gateway onboarding: handler registration, `atoms.registry.json`
   row, `sync-rates` regen (rate stays null), D1 `atom_enabled`
   seeding, internal-key scope grant.
5. Batch deploy via the house path (declare → deploy → certify →
   close), live probes per atom (401 keyless / 200 scoped internal /
   health lists it), local commit per batch.
6. Registry listing refreshed to `org.aimlds/<atom>` + published +
   API read-back (failure → gaps list, never blocks serving).

Realistic batch size for steps 1–3 is set by core complexity, not by
the gateway work (steps 4–6 are mechanical and fast). If the parent
instead wants judgment atoms served by an LLM-backed handler, that
is a different architecture (non-deterministic output, per-call token
cost against a null rate, different gate standard) — it needs an
explicit ruling, not improvisation.

## Owner ruling on the blocker (2026-11-15)

**Option A — author deterministic cores, Tier A first, everything in,
sequenced by the lane's priorities.** LLM-backed handlers are NOT the
shape. An atom whose skill genuinely cannot reduce to deterministic
checks is parked on the gaps list with evidence, never force-fit.

## Batch 1 — six Tier A CHECK atoms (2026-11-15) — AUTHORED, PORTED, TEST-GREEN; STAGED FOR DEPLOY

First CHECK-type atoms in register queue order (complexity batching;
`agent-evaluation-scorecard` heads Batch 2). Each went through the full
sequence: skill → manifest design → Python oracle + tests FIRST →
golden fixtures → TS port with differential parity → contract +
listing + SERVICE.md. Four builders were killed mid-run by an
infrastructure restart drain; their on-disk artifacts were verified
(not trusted) by completion workers — pytest, fixture regeneration,
and TS↔Python differentials all re-run — before integration.

| Atom | Checks | Sections | Verdicts | Python tests | Fixtures | Differential |
|---|---|---|---|---|---|---|
| agent-safety-guardrail-audit | 34 | 8 (= skill Methods 1–8) | GUARDED / NOT_GUARDED / INSUFFICIENT_EVIDENCE | 15 | 7 | 100% |
| append-only-ledger-design-audit | — (see core) | 9 | SOUND / UNSOUND / INSUFFICIENT_EVIDENCE | 15 | 7 | via gateway suite parity |
| dependency-governance-audit | 21 | 6 | GOVERNED / NOT_GOVERNED / INSUFFICIENT_EVIDENCE | 16 | 7 | 100% |
| encryption-claim-audit | 28 | 6 | CLAIMS_SOUND / CLAIMS_UNSOUND / INSUFFICIENT_EVIDENCE | 16 | 7 | 100% |
| firewall-rules-audit | 20 | 5 | SOUND / UNSOUND / INSUFFICIENT_EVIDENCE | 17 | 7 | 100% |
| license-compliance-check | 19 | 4 | COMPLIANT / NON_COMPLIANT / INSUFFICIENT_EVIDENCE | 16 | 7 | 100% |

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +6 rows (category `engineering`
  assigned at onboarding for all six, per the registry's own rule).
- `rails/gateway/src/atoms-registry.ts`: +6 handlers via a small
  `manifestAtom()` factory with atom #1's exact run() semantics
  (TypeError → InputError("manifest"), verdict + stamp). Future
  batches are one entry each.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries 7
  atoms, every rate `null` / `pending` — pricing untouched everywhere.
- `rails/gateway/test/release-readiness.test.ts`: fixture loader
  scoped to atom #1's own unprefixed fixtures (replicated atoms use
  `<service>--<case>.json`, loaded by their own test files). Was
  cross-loading all 42 new fixtures.
- **Full gateway suite: 181/181 pass** (37 pre-batch + 137 new atom
  tests + gateway tests, incl. the proration lane's refund tests
  present in the working tree).

Shared-file edits in this batch (for the proration-baseline rebase):
`src/atoms-registry.ts` (imports + factory + 6 entries),
`atoms.registry.json` (+6 rows), `src/generated.ts` (regenerated),
`test/release-readiness.test.ts` (loader filter). NO edits to
`billing.ts` / `store.ts` / `callpath.ts` / `index.ts`.

**FLAGGED — one edit left UNCOMMITTED on purpose:**
`rails/gateway/test/gateway.test.ts`, the catalogue test (~line 540):
the hardcoded `feed.atoms.length === 1` assertion was updated to find
atom #1's row by name (intent preserved: only live atoms listed, #1
shows the trial state). The file also carries the proration lane's
uncommitted test additions, so this lane did not sweep it into the
batch commit. The batch commit's tree therefore still shows that one
assertion red until the edit is committed with the proration baseline;
the working tree is 181/181 green.

Deploy-readiness: **STAGED, not deployed** (parent's sequencing:
proration baseline first). Held for the deploy go: gateway deploy,
D1 seeding (`atom_enabled:<atom>=1` ×6, internal-key scope grants ×6),
per-atom live probes, and registry publication of the six regenerated
`org.aimlds/<atom>` listings (all six server.json files are local and
carry "built-locally — NOT deployed; do not submit" status until then).

Follow-ups noted: `listing/listing.md` stubs are still scaffold-grade
for the batch atoms (server.json is the registry-facing artifact and
is correct); encryption PBKDF2 iteration counts are not checked (the
manifest carries no iteration field — the skill's "high iteration
counts" qualifier is unenforceable without one).

## Batch 1 — DEPLOYED (2026-11-15)

Pre-deploy: gateway suite on the committed tree **181/181 green**.
Doc micro-fix first: `REFUNDS-DESIGN.md` §(c) idempotency key text
corrected to the built, proven behaviour — keyed by CHARGE id
(`stripe:refund:ch_…`), not refund id. No code changed.

Deploy (house path: declare → deploy2 → certify → close):
- Declaration `d9778e12-d6ff-49f3-8ecd-9d8a70b4657a` (scope
  `atoms-gateway`), closed after certify.
- Bindings read from LIVE worker settings and passed through
  unchanged (secrets omitted from the PUT, values persist
  server-side): DB → atoms-state D1
  `85e1564b-428c-431d-91ce-25143866e95c`,
  PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE=test**
  (verified live before deploy).
- **Deployment id: `bba2f74e14394a45a796bda73fc5be36`**
- **Certified sha256:
  `a78e02a3199820a69b217f4d2952800e9e22147b25e1fb7519e9244be87db1ac`**
  (sign request 5504d87e-5160-40ac-9f6c-698672415aec).

D1 seeding (atoms-state, one statement per call, read back):
- `config`: `atom_enabled:<atom>=1` for all six — read-back shows
  7 enabled atoms (incl. release-readiness-verdict).
- `key_scopes`: internal key id 1 (internal@aimlds.org, fingerprint
  0f83865028de9a79ecfc31511aa5630b) granted all six namespaces —
  read-back shows 7 scopes on key 1.

Live probes (curl):
- `GET /health` lists all 7 atoms.
- Keyless REST call per atom → **401** ×6.
- Internal-key call with each atom's golden fixture → **200** with
  the expected verdict; atom #1 re-probed READY (still live):

| Atom | Keyless | Scoped | Verdict |
|---|---|---|---|
| agent-safety-guardrail-audit | 401 | 200 | GUARDED |
| append-only-ledger-design-audit | 401 | 200 | SOUND |
| dependency-governance-audit | 401 | 200 | GOVERNED |
| encryption-claim-audit | 401 | 200 | CLAIMS_SOUND |
| firewall-rules-audit | 401 | 200 | SOUND |
| license-compliance-check | 401 | 200 | COMPLIANT |

- Internal key value is not recorded anywhere (keys are derived,
  never stored — by design). It was re-derived through the real
  endpoint: a D1-seeded session for internal@aimlds.org (gateway
  session format, sha256(token) at rest) + `GET /v1/keys`; the
  seeded session row was deleted after the probes.
- Metering: exactly 1 `usage_internal` row per new atom from the
  probes; 0 external `usage_rows` for internal@aimlds.org (G7
  pattern holds, zero charge).

Registry listings: the four non-live status texts were flipped to
atom #1's live shape ("live — release candidate since 2026-11-15
(one-week soak to 2026-11-22)"); all six published with
mcp-publisher (DNS login, aimlds.org) and verified by registry API
read-back — each `org.aimlds/atom-<atom>` v0.1.0, **status active,
isLatest true**, remote `https://atoms.pipavia.com/mcp/<atom>`.
Repo `server.json` copies content-match their published records
exactly (verified by diff against the read-back).

## Batch 2 — six Tier A atoms (2026-11-15) — AUTHORED, PORTED, TEST-GREEN; STAGED FOR DEPLOY

Next atoms in census Tier A queue order starting from
`agent-evaluation-scorecard` (the Batch 1 log's named head). Walked in
queue order: six atoms taken, three parked on the gaps list (below),
one already-parked G2 atom passed over. Each taken atom went through
the full sequence: skill → manifest design → Python oracle + tests
FIRST → golden fixtures → TS port with differential parity → contract
+ listing + SERVICE.md. Five fit the `manifestAtom()` factory;
`codebase-structural-query` does not (it computes over a submitted
graph index, no evidence sections) and follows atom #1's handler
pattern directly in `atoms-registry.ts`.

| Atom | Checks | Sections | Verdicts | Python tests | Fixtures | Differential |
|---|---|---|---|---|---|---|
| agent-evaluation-scorecard | 32 | 8 (= skill Methods 1–8) | TRUSTED / NOT_TRUSTED / INSUFFICIENT_EVIDENCE | 17 | 7 | 100% (fixtures + mutations) |
| assumption-audit | 18 | 6 | SOUND / UNSOUND / INSUFFICIENT_EVIDENCE | 16 | 7 | 100% (fixtures + mutations) |
| claim-verification-fact-check-stamp | 16 | 6 | STAMPED / NOT_STAMPED / INSUFFICIENT_EVIDENCE | 17 | 7 | 100% (fixtures + mutations) |
| codebase-structural-query | — (computed query) | — (6 intents: descendants / ancestors / blast_radius / path / stats / snapshot) | status: ok / not_found / no_path / stale_index | 17 | 7 | 100% (fixtures + random graphs) |
| condition-monitoring-triage | 19 | 6 | TRIAGE_SOUND / TRIAGE_UNSOUND / INSUFFICIENT_EVIDENCE | 18 | 7 | 100% (fixtures + mutations) |
| defined-flow-auditor | 24 | 7 (five zero-trust principles + claim gauntlet + scope/limits) | DEFINED / NOT_DEFINED / INSUFFICIENT_EVIDENCE | 18 | 7 | 100% (fixtures + mutations) |

Differential method this batch: golden-fixture parity inside the
gateway suite (42 fixtures) plus a mutation/random differential run
outside it — every boolean field of every full-pass manifest flipped
and deleted in turn, top-level sections deleted, and randomized
task/claim/reading/graph payloads — **399/399 cases byte-identical**
between the Python oracles and the compiled TS ports, verdict dicts
and stamps both.

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +6 rows (category `engineering`
  assigned at onboarding for all six, per the registry's own rule —
  same as Batch 1).
- `rails/gateway/src/atoms-registry.ts`: +5 handlers via the
  `manifestAtom()` factory + 1 direct handler
  (`codebase-structural-query`, atom #1 pattern; invalid intent /
  graph / query input → InputError("query")).
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries 13
  atoms, every rate `null` / `pending` — pricing untouched everywhere.
- **Full gateway suite: 326/326 pass** (181 pre-batch + 145 new:
  103 ported oracle tests + 42 golden-fixture parity tests).

Shared-file edits in this batch: `src/atoms-registry.ts` (imports +
factory entries + 1 direct handler + HANDLERS rows),
`atoms.registry.json` (+6 rows), `src/generated.ts` (regenerated),
plus new per-atom test files and fixtures. NO edits to `billing.ts` /
`store.ts` / `callpath.ts` / `index.ts`.

### Parked this batch (gaps list — owner's ruling: never force-fit, never LLM-served)

- `code-with-verification-proof` (DELIVERABLE, bound skill
  `verified-code`): the deliverable is newly authored code from a
  natural-language spec, plus per-function verification cases written
  for that code. Generative authorship — the skill carries no fixed
  input manifest, check set, or verdict vocabulary to reduce.
- `codebase-graph-analysis` (REPORT, bound skill `code-graph`): the
  deliverable is an editorial report over a real codebase — map, hot
  spots, seams, and "the 3 things that matter most, in plain
  language". Hot-spot/seam selection and the verdict are judgment
  with no thresholds in the skill, and the input is a whole codebase,
  not a manifest the gateway can receive. (Its sibling
  `codebase-structural-query` WAS reducible and was built: that skill
  specifies deterministic intent routing over a submitted graph.)
- `company-fundamentals-report` (REPORT, bound skill
  `equity-fundamentals`): methods 4 (moat evidence — pricing power,
  switching costs) and 6 (management candor, capital-allocation
  rationality) and the narrative summary (strengths / weaknesses /
  unknowns) are analyst judgment. The computable fragments (ratios,
  red-flag checklist) do not constitute the report the contract
  sells; a ratio-only core would be a force-fit.
- Passed over in queue order: `calculation-rederivation` — already on
  the census G2 gaps list (no bound skill); not re-litigated.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy go:
gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×6, internal-key
scope grants ×6), per-atom live probes (401 keyless / 200 scoped
internal / health lists them), and registry publication of the six
regenerated `org.aimlds/<atom>` listings (all six server.json files
are local and carry "built-locally — NOT deployed; do not submit"
status until then).

Follow-ups noted: `listing/listing.md` stubs are still scaffold-grade
for the batch atoms (server.json is the registry-facing artifact and
is correct — same state as Batch 1 at this stage);
condition-monitoring readings use exceedance bands only (a
below-direction band shape, e.g. insulation resistance floors, would
need a `direction` field on the reading schema — not invented here).

## Batch 2 — DEPLOYED (2026-11-15)

Pre-deploy: gateway suite on the committed tree **326/326 green**.

Deploy (house path: declare → deploy2 → certify → close):
- Declaration `5e2e838e-1420-42ba-b8a7-9ec4368f010f` (scope
  `atoms-gateway`), closed after certify.
- Bindings read from LIVE worker settings and passed through
  unchanged (secrets omitted from the PUT, values persist
  server-side): DB → atoms-state D1
  `85e1564b-428c-431d-91ce-25143866e95c`,
  PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE=test**
  (verified live before deploy).
- **Deployment id: `b9a2de44d77647dab4530f240dc4aadc`**
- **Certified sha256:
  `21cc462c85899d26593e2a9acb5ae0d637510cbc32e7f473782dd33d6b55bc50`**
  (sign request 01d6fc42-f82d-4d5c-ae54-897def53a4a8).

D1 seeding (atoms-state, one statement per call, read back):
- `config`: `atom_enabled:<atom>=1` for all six — read-back shows
  13 enabled atoms.
- `key_scopes`: internal key id 1 (internal@aimlds.org) granted all
  six namespaces — read-back shows 13 scopes on key 1.

Live probes (curl):
- `GET /health` lists all 13 atoms.
- Keyless REST call per atom → **401** ×6.
- Internal-key call with each atom's golden fixture → **200** with
  the expected verdict/status; atom #1 re-probed READY (still live):

| Atom | Keyless | Scoped | Verdict/status |
|---|---|---|---|
| agent-evaluation-scorecard | 401 | 200 | TRUSTED |
| assumption-audit | 401 | 200 | SOUND |
| claim-verification-fact-check-stamp | 401 | 200 | STAMPED |
| codebase-structural-query | 401 | 200 | ok |
| condition-monitoring-triage | 401 | 200 | TRIAGE_SOUND |
| defined-flow-auditor | 401 | 200 | DEFINED |

- Internal key re-derived through the real endpoint (D1-seeded
  session for internal@aimlds.org, sha256(token) at rest, +
  `GET /v1/keys`); the seeded session row was deleted after the
  probes and temp key files shredded.
- Metering: exactly 1 `usage_internal` row per new atom from the
  probes; 0 external `usage_rows` for internal@aimlds.org (G7
  pattern holds, zero charge).

Registry listings: the six "built-locally" status texts were flipped
to atom #1's live shape ("live — release candidate since 2026-11-15
(one-week soak to 2026-11-22)"); all six published with
mcp-publisher (DNS login, aimlds.org) and verified by registry API
read-back — each `org.aimlds/atom-<atom>` v0.1.0, **status active,
isLatest true**, remote `https://atoms.pipavia.com/mcp/<atom>`.
Repo `server.json` copies content-match their published records
exactly (verified by diff against the read-back).

Program state: **13 of 162 atoms live** (1 + Batch 1's 6 + Batch 2's
6), 3 parked with evidence (Batch 2), 1 G2 passed over. All contract
rates remain `null`.

## Batch 3 — six Tier A atoms (2026-11-15) — AUTHORED, PORTED, TEST-GREEN; STAGED FOR DEPLOY

Next atoms in census Tier A queue order after `defined-flow-auditor`.
Walked in queue order: six atoms taken, one parked on the gaps list
(below). Each taken atom went through the full sequence: skill →
manifest design → Python oracle + tests FIRST → golden fixtures → TS
port with differential parity → contract + listing + SERVICE.md. All
six fit the `manifestAtom()` factory — including
`crypto-inventory-pq-migration-map`, a computed MAP whose evaluate
throws only TypeError on a non-object manifest and reports all other
invalid input in-band via status/counts (no direct handler needed).

| Atom | Checks | Sections | Verdicts / status | Python tests | Fixtures | Differential |
|---|---|---|---|---|---|---|
| correctness-verification-certificate | 26 | 7 | CERTIFIED / NOT_CERTIFIED / INSUFFICIENT_EVIDENCE | 21 | 7 | 69/69 |
| crypto-inventory-pq-migration-map | — (computed map: 5 classifications) | — | complete / partial / insufficient_evidence | 20 | 7 | 382/382 |
| decision-trap-sweep | 24 | 7 | TRAP_CLEAR / TRAPS_PRESENT / INSUFFICIENT_EVIDENCE | 20 | 7 | 66/66 |
| distribution-equipment-rating-condition-check | 27 | 6 | RATING_CONDITION_SOUND / RATING_CONDITION_UNSOUND / INSUFFICIENT_EVIDENCE | 18 | 7 | 142/142 |
| electrical-machinery-engineering-check | 38 | 7 | SOUND / NOT_SOUND / INSUFFICIENT_EVIDENCE | 18 | 7 | 863/863 |
| electrical-test-record-preparation | 41 | 6 | RECORD_READY / RECORD_NOT_READY / INSUFFICIENT_EVIDENCE | 19 | 7 | 840/840 |

Differential method this batch: per-atom standalone differentials by
the builders (golden fixtures + mutation sweeps: boolean flips and
leaf deletions, section deletions, numeric boundary/± sweeps,
algorithm×purpose sweeps, non-object manifests) — **2,362/2,362
cases byte-identical** between the Python oracles and the TS ports,
verdict dicts and stamps both — plus golden-fixture parity inside
the gateway suite (42 fixtures).

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +6 rows (category
  `engineering` assigned at onboarding for all six, per the
  registry's own rule — same as Batches 1–2).
- `rails/gateway/src/atoms-registry.ts`: +6 handlers, all via the
  `manifestAtom()` factory.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries 19
  atoms, every rate `null` / `pending` — pricing untouched
  everywhere.
- **Full gateway suite: 484/484 pass** (326 pre-batch + 158 new:
  116 ported oracle tests + 42 golden-fixture parity tests).

Shared-file edits in this batch: `src/atoms-registry.ts` (imports +
6 factory entries + HANDLERS rows), `atoms.registry.json` (+6 rows),
`src/generated.ts` (regenerated), plus new per-atom modules, test
files and fixtures. NO edits to `billing.ts` / `store.ts` /
`callpath.ts` / `index.ts`.

### Parked this batch (gaps list — owner's ruling: never force-fit, never LLM-served)

- `deep-research-synthesis` (REPORT, bound skill `deep-research`):
  the contract sells a prose research synthesis produced from an
  open question — scope the question, search the live web in waves,
  weigh provenance, test the strongest counter-case, stop on
  convergence, label uncertainty claim by claim. The skill is a
  research-production workflow: no input manifest (input is a
  question + the live web, cf. parked `codebase-graph-analysis`),
  no thresholds (no convergence metric, no rule mapping evidence to
  its settled/probable/contested/unknown labels — assigning them IS
  the analyst judgment sold, cf. parked
  `company-fundamentals-report`). The computable fragment (auditing
  a submitted evidence pack for citation completeness / label
  presence) is a different deliverable for a different buyer, and
  its substance is already sold by the live
  `claim-verification-fact-check-stamp`. Un-parking needs an owner
  ruling (LLM-backed handler architecture) or a re-scoped CHECK/
  STAMP contract — not a builder call.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy go:
gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×6, internal-key
scope grants ×6), per-atom live probes (401 keyless / 200 scoped
internal / health lists them), and registry publication of the six
regenerated `org.aimlds/<atom>` listings (all six server.json files
are local and carry "built-locally — NOT deployed; do not submit"
status until then).

Follow-ups noted: `listing/listing.md` stubs are still scaffold-grade
for the batch atoms (server.json is correct — same state as Batches
1–2 at this stage); contract `endpoints:` fields remain as
scaffolded (they vary — API/agent, API/agent/human, agent/human —
and were not normalized in Batches 1–2 either); per-atom encoding
limits are recorded in each atom's SERVICE.md — correctness-
verification certifies declared evidence, not the underlying proofs;
distribution-equipment bus-bracing and impedance/coordination rules
are qualitative in the skill and covered only as declared checks;
electrical-machinery states no numeric thresholds, so none were
invented (balance/IR/vibration/efficiency acceptance stays
declared); crypto classification is name-substring based on declared
algorithm strings, with shelf-life used as an ordering input only
(no migrate-by year exists in the skill); decision-trap-sweep and
electrical-test-record verify declared record fields only (timing
properties like "findable in 60 seconds" are declared, not
measured).

Program state: **19 of 162 atoms live-or-staged** (13 live, 6
staged), 4 parked with evidence (3 Batch 2 + deep-research-synthesis),
1 G2 passed over. All contract rates remain `null`.

## Batch 3 — deploy HELD (2026-11-15, coordinator safety stop)

The Batch 3 deploy did NOT run in this coordinator session. While
inspecting the deploy tooling before executing, the inspection's
tool result failed the runtime's prompt-injection check and a
system security notice instructed the coordinator not to run
anything that result named. The deploy cannot be completed without
that tooling, so the coordinator stopped before any deploy action
(no declaration opened, no upload, no D1 seeding, no probes, no
listing changes) and requested the parent's confirmation to proceed
with the standard house path (declare → deploy → certify → close,
bindings from live settings, STRIPE_MODE=test). Gateway state is
unchanged: Batch 2's deployment `b9a2de44…`, 13 atoms live. Batch 4
authoring (below) proceeded in parallel — it does not depend on the
deploy tooling.

**RESOLVED (2026-11-15):** the parent confirmed the standard house
path for `atoms-gateway`, and Batches 3 + 4 deployed together — see
"Batches 3 + 4 — DEPLOYED" at the end of this log. (The replacement
coordinator's inspection of the same tooling drew the same runtime
security notice; per the parent's instruction the source is named in
the coordinator's report, and the deploy proceeded on the parent's
confirmation, which named the path independently of any tool
output.)

## Batch 4 — seven Tier A atoms (2026-11-15) — AUTHORED, PORTED, TEST-GREEN; STAGED FOR DEPLOY

Next atoms in census Tier A queue order after
`electrical-test-record-preparation`, skipping all parked atoms and
the G2 `calculation-rederivation`. Walked in queue order: **seven
atoms taken, none parked** — every skill reduced to deterministic
checks or computation over a receivable manifest. Each went through
the full sequence: skill → manifest design → Python oracle + tests
FIRST → golden fixtures → TS port with differential parity →
contract + listing + SERVICE.md. All seven fit the `manifestAtom()`
factory, including the computed `portfolio-risk-analytics-report`.

| Atom | Checks / computations | Sections | Verdicts / status | Python tests | Fixtures | Differential |
|---|---|---|---|---|---|---|
| finance-content-compliance-check | 32 | 6 | COMPLIANT / NON_COMPLIANT / INSUFFICIENT_EVIDENCE | 28 | 7 | 516/516 |
| forecast-with-ranges-and-scorecard | 25 | 6 | FORECAST_READY / FORECAST_NOT_READY / INSUFFICIENT_EVIDENCE | 26 | 7 | 198/198 |
| lean4-formal-proof | 26 | 7 | VERIFIED / NOT_VERIFIED / INSUFFICIENT_EVIDENCE | 24 | 7 | 142/142 |
| link-rot-scan-and-notarized-archive | 33 | 6 | LINK_INTEGRITY_SOUND / LINK_INTEGRITY_UNSOUND / INSUFFICIENT_EVIDENCE | 27 | 7 | 420/420 |
| network-exposure-audit | 27 | 6 | SOUND / UNSOUND / INSUFFICIENT_EVIDENCE | 22 | 7 | 327/327 |
| portfolio-risk-analytics-report | computed (risk metrics, drawdown, VaR/CVaR, Sharpe/Sortino, beta/alpha, concentration, carry, OLS factor decomposition, correlations, caller-submitted stress, journal calibration) | — | complete / partial / insufficient_evidence | 32 | 7 | 590/590 |
| prediction-model-leakage-calibration-audit | 27 | 6 | PREDICTION_AUDIT_SOUND / PREDICTION_AUDIT_UNSOUND / INSUFFICIENT_EVIDENCE | 24 | 7 | 181/181 |

Differential method this batch: per-atom standalone differentials by
the builders (golden fixtures + mutation sweeps: boolean flips,
leaf/section deletions, type corruptions, numeric boundary sweeps,
seeded random manifests) — **2,374/2,374 cases byte-identical**
between the Python oracles and the TS ports, verdict dicts and
stamps both — plus golden-fixture parity inside the gateway suite
(49 fixtures). Computed quantities carry fixed serialization rules
in both implementations (portfolio-risk: exactly 6 decimal places,
round-half-away-from-zero; prediction-audit: round-half-up to 4dp),
stated in each atom's SERVICE.md.

Design notes (reductions, honestly scoped):
- `forecast-with-ranges-and-scorecard` validates/scores a DECLARED
  forecast artifact (baselines present, non-degenerate range,
  triggered scenarios, scorecard metrics re-derived from the
  declared history within 0.01) — it produces no forecast and
  invents no accuracy threshold.
- `lean4-formal-proof` audits a DECLARED Lean 4 proof artifact
  (zero sorry, axioms within the standard kernel set, no
  native_decide, kernel-checked) — the correctness-verification
  pattern; it runs no Lean toolchain and proves nothing.
- `link-rot-scan-and-notarized-archive` audits a DECLARED
  scan/archive manifest — the gateway never fetches a URL.
- `portfolio-risk-analytics-report` is the first REPORT atom built:
  its skill (`pae`) sells calculation, not judgment ("The tool
  calculates; the user decides"). The skill's Monte Carlo element
  was EXCLUDED (no seed/path-count specified) and is named as
  excluded in SERVICE.md rather than defaulted.

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +7 rows (category
  `engineering` assigned at onboarding for all seven, per the
  registry's own rule — same as Batches 1–3).
- `rails/gateway/src/atoms-registry.ts`: +7 handlers via the
  `manifestAtom()` factory (+ one `num` schema helper alongside
  obj/str/arr).
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries 26
  atoms, every rate `null` / `pending` — pricing untouched
  everywhere.
- **Full gateway suite: 716/716 pass** (484 pre-batch + 232 new:
  183 ported oracle tests + 49 golden-fixture parity tests).
  Python oracles re-run by the coordinator: 183/183 green.
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` (verified untouched in the working tree).

Deploy-readiness: **STAGED, not deployed**. Held for the deploy go
(Batch 3's six deploy first, per the held note above): gateway
deploy, D1 seeding (`atom_enabled:<atom>=1` ×13 across Batches 3–4,
internal-key scope grants ×13), per-atom live probes (health would
list 26 atoms), and registry publication of the thirteen
regenerated `org.aimlds/<atom>` listings (all thirteen server.json
files are local and carry "built-locally — NOT deployed; do not
submit" status until then).

Follow-ups noted: `listing/listing.md` stubs are still scaffold-grade
for the batch atoms (server.json is correct — same state as Batches
1–3 at this stage); forecast scorecard agreement tolerance (0.01)
assumes declared metrics rounded to 2dp, stated in SERVICE.md;
prediction-audit calibration boundary cases use exact binary
fractions in both suites (a 0.55/0.05 case exposed genuine IEEE
float error during authoring and was replaced, not papered over).

Program state: **26 of 162 atoms live-or-staged** (13 live, 13
staged), 4 parked with evidence, 5 G2 atoms passed over in queue
order so far (Tier A: calculation-rederivation, one-line-diagram-
to-data, protection-coordination-explainer, provenance-stamper,
study-clause-check — no bound skill; not re-litigated). All contract
rates remain `null`.

## Batches 3 + 4 — DEPLOYED (2026-11-15)

Pre-deploy: gateway suite on the committed tree (ac26e87)
**716/716 green**.

Deploy (house path: declare → deploy2 → certify → close), on the
parent's confirmation resolving the Batch 3 hold above:
- Declaration `05aa66b6-6b8d-4c0b-af18-a46b5485cded` (scope
  `atoms-gateway`), closed after certify.
- Bindings read from LIVE worker settings and passed through
  unchanged (secrets omitted from the PUT, values persist
  server-side): DB → atoms-state D1
  `85e1564b-428c-431d-91ce-25143866e95c`,
  PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE=test**
  (verified live before deploy).
- **Deployment id: `1310261d39fd46bc8ddf7cd5c6b801c1`**
- **Certified sha256:
  `e06cdd35da2a41176116297e084f7cabd6cba15d14873fec4908bcac37b41c6f`**
  (sign request 01a96aaf-e4f0-4320-a70b-346f011fe61a).

D1 seeding (atoms-state, one statement per call, read back):
- `config`: `atom_enabled:<atom>=1` for all thirteen — read-back
  shows 26 enabled atoms.
- `key_scopes`: internal key id 1 (internal@aimlds.org) granted all
  thirteen namespaces — read-back shows 26 scopes on key 1.

Live probes (curl):
- `GET /health` lists all 26 atoms (version 1.1.0).
- Keyless REST call per atom → **401** ×13.
- Internal-key call with each atom's golden full-pass manifest →
  **200** with the expected verdict/status; atom #1 re-probed READY
  (still live):

| Atom | Keyless | Scoped | Verdict/status |
|---|---|---|---|
| correctness-verification-certificate | 401 | 200 | CERTIFIED |
| crypto-inventory-pq-migration-map | 401 | 200 | complete |
| decision-trap-sweep | 401 | 200 | TRAP_CLEAR |
| distribution-equipment-rating-condition-check | 401 | 200 | RATING_CONDITION_SOUND |
| electrical-machinery-engineering-check | 401 | 200 | SOUND |
| electrical-test-record-preparation | 401 | 200 | RECORD_READY |
| finance-content-compliance-check | 401 | 200 | COMPLIANT |
| forecast-with-ranges-and-scorecard | 401 | 200 | FORECAST_READY |
| lean4-formal-proof | 401 | 200 | VERIFIED |
| link-rot-scan-and-notarized-archive | 401 | 200 | LINK_INTEGRITY_SOUND |
| network-exposure-audit | 401 | 200 | SOUND |
| portfolio-risk-analytics-report | 401 | 200 | complete |
| prediction-model-leakage-calibration-audit | 401 | 200 | PREDICTION_AUDIT_SOUND |

- Internal key re-derived through the real endpoint (D1-seeded
  session for internal@aimlds.org, sha256(token) at rest, +
  `GET /v1/keys`); seeded session rows deleted after the probes,
  temp key files shredded.
- Metering: exactly 1 `usage_internal` row per new atom from the
  probes, except `correctness-verification-certificate` with 2 —
  the first probe sent the fixture wrapper instead of its
  `manifest` field (verdict INSUFFICIENT_EVIDENCE) and was re-run
  corrected (CERTIFIED). 0 external `usage_rows` for
  internal@aimlds.org (G7 pattern holds, zero charge).

Registry listings: the thirteen "built-locally" status texts were
flipped to atom #1's live shape ("live — release candidate since
2026-11-15 (one-week soak to 2026-11-22)"); all thirteen published
with mcp-publisher (DNS login, aimlds.org) and verified by registry
API read-back — each `org.aimlds/atom-<atom>` v0.1.0, **status
active, isLatest true**, remote `https://atoms.pipavia.com/mcp/<atom>`.
Repo `server.json` copies content-match their published records
exactly (verified by diff against the read-back). Two listings
needed their `description` shortened to the registry's 100-char
limit before acceptance (`distribution-equipment-rating-condition-
check`, `prediction-model-leakage-calibration-audit` — "rating/
condition" and "leakage/calibration" slash forms; meaning
unchanged).

Program state: **26 of 162 atoms live**, 4 parked with evidence,
5 Tier A G2 atoms passed over. All contract rates remain `null`.

## Batch 5 — five Tier A atoms (2026-11-15) — AUTHORED, PORTED, TEST-GREEN; STAGED FOR DEPLOY

Next atoms in census Tier A queue order after
`prediction-model-leakage-calibration-audit`, skipping all parked
atoms and the G2 atoms. Walked in queue order: **five atoms taken,
two parked** on the gaps list (below). Each taken atom went through
the full sequence: skill → manifest design → Python oracle + tests
FIRST → golden fixtures → TS port with differential parity →
contract + listing + SERVICE.md. Four fit the `manifestAtom()`
factory; `semantic-code-taint-analysis-report` follows the
`codebase-structural-query` direct-handler pattern (its core raises
plain Errors for invalid graph internals, mapped to
InputError("graph")).

| Atom | Checks / computations | Sections | Verdicts / status | Python tests | Fixtures | Differential |
|---|---|---|---|---|---|---|
| predictive-maintenance-failure-risk-assessment | 24 | 6 | ASSESSMENT_SOUND / ASSESSMENT_UNSOUND / INSUFFICIENT_EVIDENCE | 21 | 7 | 991/991 |
| pump-conveyor-motor-suitability-check | 26 (5 computed) | 6 | SUITABLE / NOT_SUITABLE / INSUFFICIENT_EVIDENCE | 26 | 7 | 924/924 |
| rag-retrieval-evaluation-tuning | 36 (incl. computed recall@k / MRR / nDCG vs per-query declared thresholds, scope leakage, context budget) | 6 | RAG_EVALUATION_SOUND / RAG_EVALUATION_UNSOUND / INSUFFICIENT_EVIDENCE | 21 | 7 | 775/775 |
| reconciled-portfolio-performance-report | computed (TWR, periodic money-weighted IRR, 3-leg reconciliation, benchmark comparison) | — | complete / partial / insufficient_evidence | 23 | 7 | 909/909 |
| semantic-code-taint-analysis-report | computed (source→sink taint reachability over a declared graph, sanitizer cuts, fixed severity table) | — | TAINTED / CLEAN / INSUFFICIENT_EVIDENCE | 19 | 7 | 655/655 |

Differential method this batch: per-atom standalone differentials
by the builders (golden fixtures + mutation sweeps: boolean flips,
leaf/section deletions, type corruptions, numeric boundary sweeps,
seeded random manifests/graphs) — **4,254/4,254 cases
byte-identical** between the Python oracles and the TS ports,
verdict dicts and stamps both — plus golden-fixture parity inside
the gateway suite (35 fixtures). The reconciled-portfolio sweep
caught one real divergence (Python rendering a null IRR as `None`
vs JS `null`); fixed in both implementations to render "gap",
fixtures regenerated, suites re-run green. Computed quantities
carry fixed serialization rules in both implementations
(pump-conveyor margins and rag means: 4dp round-half-up;
reconciled-portfolio: 6dp round-half-away-from-zero, the
portfolio-risk rule; semantic-taint: integers/strings only),
stated in each atom's SERVICE.md.

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +5 rows (category
  `engineering` assigned at onboarding for all five, per the
  registry's own rule — same as Batches 1–4).
- `rails/gateway/src/atoms-registry.ts`: +4 handlers via the
  `manifestAtom()` factory + 1 direct handler
  (`semantic-code-taint-analysis-report`, structural-query
  pattern).
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries 31
  atoms, every rate `null` / `pending` — pricing untouched
  everywhere.
- **Full gateway suite: 861/861 pass** (716 pre-batch + 145 new:
  110 ported oracle tests + 35 golden-fixture parity tests).
  Python oracles re-run by the coordinator: 110/110 green,
  matching the builders' claims exactly.
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` (verified untouched in the working tree).

### Parked this batch (gaps list — owner's ruling: never force-fit, never LLM-served)

- `relay-fault-simulation-walkthrough` (DELIVERABLE, bound skill
  `fault-simulation`): the skill's deliverable is a live
  `relay_sim` engine run with a narrative teaching walkthrough;
  its only input is a natural-language prompt ("Simulate a
  line-to-ground fault and walk me through the relay response").
  The skill states no fault/relay vocabularies, no settings
  fields, no expected operation sequence, no timing values and no
  pass/fail criteria — the four method steps (setup / fault /
  protection / lesson) are narrative headings, and which relay
  sees the fault and how it decides IS the teaching judgment
  sold. Every check would have to be invented. Un-parking needs
  a skill refinement stating a declared-scenario schema plus
  deterministic rules, or an owner ruling for an LLM/engine-
  backed handler architecture.
- `seven-step-equity-research-brief` (REPORT, bound skill
  `stock-analysis`): the skill's only receivable input is a
  ticker; producing the brief requires gathering live/EDGAR data
  and judging it. Analyst judgment is load-bearing in at least
  five of the seven steps — technicals (15+ indicators never
  named, no thresholds), macro context (sector rotation and
  cycle position are calls), competitor dynamics (peer-set
  selection and moat assessment — the same ground that parked
  `company-fundamentals-report`), valuation (scenario and
  assumption construction IS the call; no model specified), and
  the mandatory variant-perception synthesis. The computable
  fragments (ratios, indicator arithmetic, scenario/P×I
  multiplication once ratings are supplied) do not constitute
  the brief the contract sells — the Batch 2
  `company-fundamentals-report` precedent applies directly.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×5,
internal-key scope grants ×5), per-atom live probes (401 keyless
/ 200 scoped internal / health lists them), and registry
publication of the five regenerated `org.aimlds/<atom>` listings
(all five server.json files are local and carry "built-locally —
NOT deployed; do not submit" status until then).

Follow-ups noted: `listing/listing.md` stubs are still
scaffold-grade for the batch atoms (server.json is correct — same
state as Batches 1–4 at this stage); predictive-maintenance
checks declared evidence only (no sensor ingestion, no ML
inference, no RPN arithmetic over raw scores — the skill states
no numeric thresholds, so none were invented);
reconciled-portfolio excludes XIRR (the skill names it but
states no day-count convention), attribution decomposition and
tax lots (no formula/data model in the skill), each named in
SERVICE.md.

Program state: **31 of 162 atoms live-or-staged** (26 live, 5
staged), 6 parked with evidence (3 Batch 2, 1 Batch 3, 2 Batch
5), 5 Tier A G2 atoms passed over. Tier A remaining: 6 G1 atoms
(strategy-backtest-validation, tested-authorization-policy-pack,
vfd-application-engineering-check,
vulnerability-triage-verified-closure, zero-knowledge-claim-audit,
zero-trust-evaluation-verdict) — one more batch closes Tier A.
All contract rates remain `null`.

## Batch 5 — DEPLOYED (2026-11-15)

Pre-deploy: gateway suite on the committed tree (d02fb91)
**861/861 green**.

Deploy (house path: declare → deploy2 → certify → close):
- Declaration `ed6aff4f-3979-4bd3-9ffc-5a4581700613` (scope
  `atoms-gateway`), closed after certify.
- Bindings read from LIVE worker settings and passed through
  unchanged (secrets omitted from the PUT, values persist
  server-side): DB → atoms-state D1
  `85e1564b-428c-431d-91ce-25143866e95c`,
  PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE=test**
  (verified live before deploy).
- **Deployment id: `3b3e714533d8480c84cdfa91e55988cd`**
- **Certified sha256:
  `13187d393e020325b783822677eafda2dc4a0cc09c77218df54e93eb84be158c`**
  (sign request 934f71bd-6c41-44d1-83d1-52560f9faff5).
- Note: this coordinator's pre-deploy inspection of the deploy
  tooling drew the same runtime security notice as the Batch 3
  inspection; the deploy proceeded on the parent's task brief,
  which named the standard house path independently of any tool
  output (named in the coordinator's report, per the standing
  instruction).

D1 seeding (atoms-state, one statement per call, read back):
- `config`: `atom_enabled:<atom>=1` for all five — read-back shows
  31 enabled atoms.
- `key_scopes`: internal key id 1 (internal@aimlds.org) granted all
  five namespaces — read-back shows 31 scopes on key 1.

Live probes (curl):
- `GET /health` lists all 31 atoms (version 1.1.0).
- Keyless REST call per atom → **401** ×5.
- Internal-key call with each atom's golden full-pass manifest →
  **200** with the expected verdict/status; atom #1 re-probed READY
  (still live):

| Atom | Keyless | Scoped | Verdict/status |
|---|---|---|---|
| predictive-maintenance-failure-risk-assessment | 401 | 200 | ASSESSMENT_SOUND |
| pump-conveyor-motor-suitability-check | 401 | 200 | SUITABLE |
| rag-retrieval-evaluation-tuning | 401 | 200 | RAG_EVALUATION_SOUND |
| reconciled-portfolio-performance-report | 401 | 200 | complete |
| semantic-code-taint-analysis-report | 401 | 200 | CLEAN |

- Internal key re-derived through the real endpoint (D1-seeded
  session for internal@aimlds.org, sha256(token) at rest, +
  `GET /v1/keys`); the seeded session row was deleted after the
  probes.
- Metering: exactly 1 `usage_internal` row per new atom from the
  probes; 0 external `usage_rows` for internal@aimlds.org (G7
  pattern holds, zero charge).

Registry listings: the five "built-locally" status texts were
flipped to atom #1's live shape ("live — release candidate since
2026-11-15 (one-week soak to 2026-11-22)"); all five published with
mcp-publisher (DNS login, aimlds.org) and verified by registry API
read-back — each `org.aimlds/atom-<atom>` v0.1.0, **status active,
isLatest true**, remote `https://atoms.pipavia.com/mcp/<atom>`.
Repo `server.json` copies field-match their published records
exactly (verified field-by-field against the read-back).

Program state: **31 of 162 atoms live**, 6 parked with evidence,
5 Tier A G2 atoms passed over. Tier A remaining: the 6 G1 atoms
named above (Batch 6, in authoring). All contract rates remain
`null`.

## Batch 6 — six Tier A atoms (2026-11-15) — AUTHORED, PORTED, TEST-GREEN; STAGED FOR DEPLOY — TIER A CLOSES

The final Tier A G1 atoms, in census queue order. Walked in queue
order: **six atoms taken, none parked** — every skill reduced to
deterministic checks or computation over a receivable manifest.
Each went through the full sequence: skill → manifest design →
Python oracle + tests FIRST → golden fixtures → TS port with
differential parity → contract + listing + SERVICE.md. All six fit
the `manifestAtom()` factory.

| Atom | Checks | Sections | Verdicts | Python tests | Fixtures | Differential |
|---|---|---|---|---|---|---|
| strategy-backtest-validation | 36 | 6 | VALIDATED / NOT_VALIDATED / INSUFFICIENT_EVIDENCE | 32 | 7 | 1125/1125 |
| tested-authorization-policy-pack | 29 | 6 | READY / NOT_READY / INSUFFICIENT_EVIDENCE | 21 | 7 | 498/498 |
| vfd-application-engineering-check | 37 | 7 | SOUND / NOT_SOUND / INSUFFICIENT_EVIDENCE | 29 | 7 | 859/859 |
| vulnerability-triage-verified-closure | 23 | 6 | CLOSURE_SOUND / CLOSURE_UNSOUND / INSUFFICIENT_EVIDENCE | 32 | 7 | 1163/1163 |
| zero-knowledge-claim-audit | 27 | 6 | CLAIMS_SOUND / CLAIMS_UNSOUND / INSUFFICIENT_EVIDENCE | 23 | 7 | 804/804 |
| zero-trust-evaluation-verdict | 26 | 6 | CLAIM_SUSTAINED / CLAIM_NOT_SUSTAINED / INSUFFICIENT_EVIDENCE | 26 | 7 | 644/644 |

Differential method this batch: per-atom standalone differentials
by the builders (golden fixtures + mutation sweeps: boolean flips,
leaf/section deletions, type corruptions, numeric/date boundary
sweeps, vocabulary sweeps, seeded random manifests) — **5,093/5,093
cases byte-identical** between the Python oracles and the TS ports,
verdict dicts and stamps both — plus golden-fixture parity inside
the gateway suite (42 fixtures). The vulnerability-triage sweep
caught and fixed one real Python bug (an unhashable list severity
crashed dict membership in the SLA check) before integration.

Design notes (reductions, honestly scoped):
- `strategy-backtest-validation` validates a DECLARED backtest
  artifact (the forecast pattern) — it runs no backtest. The
  parameters-to-data ratio is recomputed and reported with NO
  acceptance bar (the skill states none); the only numeric bar in
  the atom is the skill's own $500 house-gate threshold for
  clear-yes evidence on large trades.
- `tested-authorization-policy-pack` computes default-deny and
  per-policy test coverage (positive+negative+edge), naming
  untested policy ids; no coverage threshold (the skill states
  none) and no policy authoring or execution — declared evidence
  only.
- `vfd-application-engineering-check` carries exactly three
  computed checks, all declared-vs-declared: harmonic distortion
  vs the caller's declared site limit, cable length vs the
  declared OEM maximum, derated drive current vs declared
  required load current. No harmonic limit, dv/dt threshold,
  derating factor, or torque/speed relationship was invented —
  the skill states none.
- `vulnerability-triage-verified-closure` computes SLA ages only
  for the skill's stated windows (Critical ≤72h, High ≤14d),
  against the manifest's own declared `as_of_date` — no wall clock
  in either implementation. Medium/Low have no stated window, so
  they are presence-checked only; no risk scoring, no
  mean-time-to-patch figure.
- `zero-knowledge-claim-audit` records a scope correction: the
  bound skill is about zero-knowledge software ARCHITECTURE
  (server learns nothing, client-side encryption, key journey) and
  states no facts about ZK proof systems — the audit was built
  strictly from the skill, and proof-system/circuit checks are
  named as excluded in SERVICE.md pending a skill refinement,
  rather than invented.
- `zero-trust-evaluation-verdict` shares ground with the live
  `defined-flow-auditor` (same bound skill) — stated plainly in
  its SERVICE.md: the auditor audits declared flows per-principle;
  this atom is the evaluation-verdict framing (claim as stated,
  not-a-certification acknowledgement, server-knowledge gauntlet)
  plus the NIST authenticator-strength computed checks the auditor
  does not carry (KDF must be argon2id; declared minimum secret
  length ≥ the skill's stated 16). Where both cover the same
  principle, that is the skill offering the same ground twice.

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +6 rows (category
  `engineering` assigned at onboarding for all six, per the
  registry's own rule — same as Batches 1–5).
- `rails/gateway/src/atoms-registry.ts`: +6 handlers, all via the
  `manifestAtom()` factory.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries 37
  atoms, every rate `null` / `pending` — pricing untouched
  everywhere.
- **Full gateway suite: 1066/1066 pass** (861 pre-batch + 205 new:
  163 ported oracle tests + 42 golden-fixture parity tests).
  Python oracles re-run by the coordinator: 163/163 green,
  matching the builders' claims exactly.
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` (verified untouched in the working tree).

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×6,
internal-key scope grants ×6), per-atom live probes (401 keyless /
200 scoped internal / health lists them), and registry publication
of the six regenerated `org.aimlds/<atom>` listings (all six
server.json files are local and carry "built-locally — NOT
deployed; do not submit" status until then).

Follow-ups noted: `listing/listing.md` stubs are still
scaffold-grade for the batch atoms (server.json is correct — same
state as Batches 1–5 at this stage); the vfd differential excluded
one out-of-contract input class (a non-integer float assigned to
the string `asset` pass-through field renders differently in
Python vs JS string conversion — the same verbatim-carry behaviour
as every template atom).

### Tier A — CLOSED (2026-11-15)

Tier A (48 atoms) is fully accounted for — every atom is live,
staged, parked with evidence, or a named G2:

- **Live: 31** — atom #1 (`release-readiness-verdict`) + Batch 1
  (6) + Batch 2 (6) + Batch 3 (6) + Batch 4 (7) + Batch 5 (5).
- **Staged for deploy: 6** — Batch 6 (above).
- **Parked with evidence: 6** — `code-with-verification-proof`,
  `codebase-graph-analysis`, `company-fundamentals-report`
  (Batch 2); `deep-research-synthesis` (Batch 3);
  `relay-fault-simulation-walkthrough`,
  `seven-step-equity-research-brief` (Batch 5). Each needs an
  owner ruling (LLM-backed handler architecture) or a skill
  refinement / re-scoped contract — never force-fit.
- **G2 passed over: 5** — `calculation-rederivation`,
  `one-line-diagram-to-data`, `protection-coordination-explainer`,
  `provenance-stamper`, `study-clause-check` (no bound skill;
  cores must be authored from the knowledge corpus, not a skill
  text — not yet attempted).

Program state: **37 of 162 atoms live-or-staged** (31 live, 6
staged), 6 parked with evidence, 8 G2 atoms total (5 Tier A above
+ 3 Tier B not yet walked: `change-gate-plan`,
`coopetition-connector-plan`, `strategy-map-builder`), 111 Tier B
G1 atoms not yet walked. All contract rates remain `null`.

## Batch 6 — DEPLOYED (2026-11-15) — TIER A COMPLETE

Pre-deploy: gateway suite on the committed tree (c40a10e)
**1066/1066 green**.

Deploy (house path: declare → deploy2 → certify → close):
- Declaration `a7036c3a-d66b-4949-8868-fba14f85b636` (scope
  `atoms-gateway`), closed after certify.
- Bindings read from LIVE worker settings and passed through
  unchanged (secrets omitted from the PUT, values persist
  server-side): DB → atoms-state D1
  `85e1564b-428c-431d-91ce-25143866e95c`,
  PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE=test**
  (verified live before deploy).
- **Deployment id: `eb1a2390aa814a0397879799004db4ea`**
- **Certified sha256:
  `329b3bfb878b98c8a5f20c92462ef0b38a9ccd80f6b37d9d164bb11bdb16e4ab`**
  (sign request 1a1108b1-2f22-4bac-955b-b775d1ba8c8f).
- Note: this coordinator's pre-deploy read of the shared bindings
  helper drew the same runtime security notice as the Batch 3/5
  inspections; the deploy proceeded on the parent's task brief,
  which named the standard house path independently of any tool
  output, and the live bindings were read through the gateway's
  own in-repo CF helper pattern instead (named in the
  coordinator's report, per the standing instruction).

D1 seeding (atoms-state, one statement per call, read back):
- `config`: `atom_enabled:<atom>=1` for all six — read-back shows
  37 enabled atoms.
- `key_scopes`: internal key id 1 (internal@aimlds.org) granted all
  six namespaces — read-back shows 37 scopes on key 1.

Live probes (curl):
- `GET /health` lists all 37 atoms (version 1.1.0).
- Keyless REST call per atom → **401** ×6.
- Internal-key call with each atom's golden full-pass manifest →
  **200** with the expected verdict; atom #1 re-probed READY
  (still live):

| Atom | Keyless | Scoped | Verdict |
|---|---|---|---|
| strategy-backtest-validation | 401 | 200 | VALIDATED |
| tested-authorization-policy-pack | 401 | 200 | READY |
| vfd-application-engineering-check | 401 | 200 | SOUND |
| vulnerability-triage-verified-closure | 401 | 200 | CLOSURE_SOUND |
| zero-knowledge-claim-audit | 401 | 200 | CLAIMS_SOUND |
| zero-trust-evaluation-verdict | 401 | 200 | CLAIM_SUSTAINED |

- Internal key re-derived through the real endpoint (D1-seeded
  session for internal@aimlds.org, sha256(token) at rest, +
  `GET /v1/keys`); the seeded session rows were deleted after the
  probes. Atom #1's re-probe took two attempts — the first sent
  the fixture wrapper instead of its `manifest` field (verdict
  INSUFFICIENT_EVIDENCE) and was re-run corrected (READY); the
  same probe slip as Batch 3+4's correctness atom, recorded the
  same way.
- Metering: exactly 1 `usage_internal` row per new atom from the
  probes; 0 external `usage_rows` for internal@aimlds.org (G7
  pattern holds, zero charge).

Registry listings: the six "built-locally" status texts were
flipped to atom #1's live shape ("live — release candidate since
2026-11-15 (one-week soak to 2026-11-22)"); all six published with
mcp-publisher (DNS login, aimlds.org) and verified by registry API
read-back — each `org.aimlds/atom-<atom>` v0.1.0, **status active,
isLatest true**, remote `https://atoms.pipavia.com/mcp/<atom>`.
Repo `server.json` copies content-match their published records
exactly (verified field-by-field against the read-back, diffs
NONE for all six; all descriptions already within the registry's
100-char limit).

### Tier A closure tally (final, post-deploy)

Tier A (48 atoms) is fully accounted for:

- **Live: 37** — atom #1 (`release-readiness-verdict`) + Batch 1
  (6) + Batch 2 (6) + Batch 3 (6) + Batch 4 (7) + Batch 5 (5) +
  Batch 6 (6).
- **Parked with evidence: 6** — `code-with-verification-proof`,
  `codebase-graph-analysis`, `company-fundamentals-report`,
  `deep-research-synthesis`,
  `relay-fault-simulation-walkthrough`,
  `seven-step-equity-research-brief`. Each needs an owner ruling
  (LLM-backed handler architecture) or a skill refinement /
  re-scoped contract — never force-fit.
- **G2 passed over: 5** — `calculation-rederivation`,
  `one-line-diagram-to-data`, `protection-coordination-explainer`,
  `provenance-stamper`, `study-clause-check` (no bound skill).

Program state: **37 of 162 atoms live**, 6 parked with evidence,
8 G2 atoms total (5 Tier A above + 3 Tier B not yet walked:
`change-gate-plan`, `coopetition-connector-plan`,
`strategy-map-builder`), 111 Tier B G1 atoms not yet walked.
All contract rates remain `null`.

## Batch 7 — seven Tier B atoms (2026-11-15) — AUTHORED, PORTED, TEST-GREEN; STAGED FOR DEPLOY — TIER B OPENS

The first Tier B batch, in census Tier B queue order. Walked in
queue order: **seven atoms taken, none parked** — every skill
reduced to deterministic checks over a declared manifest (the
Tier A declared-artifact pattern: these DELIVERABLE/REVIEW skills
state explicit methods, quality gates and red lines, and the atom
audits a declared artifact against them rather than authoring
one). Each went through the full sequence: skill → manifest
design → Python oracle + tests FIRST → golden fixtures → TS port
with differential parity → contract + listing + SERVICE.md. All
seven fit the `manifestAtom()` factory.

| Atom | Checks | Sections | Verdicts | Python tests | Fixtures | Differential |
|---|---|---|---|---|---|---|
| acp-protocol-integration-review | 31 | 7 | INTEGRATION_SOUND / INTEGRATION_NOT_SOUND / INSUFFICIENT_EVIDENCE | 37 | 7 | 1,104/1,104 |
| agent-context-packaging | 29 | 6 | PACK_SOUND / PACK_NOT_SOUND / INSUFFICIENT_EVIDENCE | 41 | 7 | 832/832 |
| agent-interoperability-design | 36 | 8 | DESIGN_SOUND / DESIGN_UNSOUND / INSUFFICIENT_EVIDENCE | 32 | 7 | 654/654 (coordinator-run) |
| agentic-coding-practice | 27 | 6 | RELIABLE_PRACTICE / NOT_RELIABLE_PRACTICE / INSUFFICIENT_EVIDENCE | 36 | 7 | 609/609 + 518/518 (coordinator re-run) |
| algorithm-design-implementation | 31 | 6 | DESIGN_SOUND / DESIGN_UNSOUND / INSUFFICIENT_EVIDENCE | 42 | 7 | 768/768 |
| applied-ml-validation | 35 | 6 | VALIDATED / NOT_VALIDATED / INSUFFICIENT_EVIDENCE | 46 | 7 | 623/623 (coordinator-run) |
| architecture-decision-record | 32 | 6 | ADR_COMPLETE / ADR_NOT_COMPLETE / INSUFFICIENT_EVIDENCE | 38 | 7 | 1,228/1,228 |

Differential method this batch: per-atom standalone differentials
(golden fixtures + mutation sweeps: boolean flips, leaf/section
deletions, type corruptions, numeric/vocabulary boundary sweeps,
seeded random manifests) — byte-identical verdict dicts and
stamps throughout — plus golden-fixture parity inside the gateway
suite (49 fixtures). Three builders' final reports were lost in
transit (agent-interoperability-design, agentic-coding-practice,
applied-ml-validation); their on-disk artifacts were verified by
the coordinator rather than trusted — every Python suite re-run
(272/272 green, matching the builders' claims where reports did
arrive) and coordinator-run differentials for the three
report-less atoms (654 + 518 + 623 cases, 0 mismatches) — the
Batch 1 completion-worker precedent.

Design notes (reductions, honestly scoped):
- `acp-protocol-integration-review` gates its protocol-surface
  checks on the skill's own two-flavour vocabulary (ACP-client /
  ACP-comm, computed flavour-recognition); chunk/output bounds
  are declared booleans — the skill states the duties but no
  numbers, so none were invented.
- `agent-context-packaging` computes nothing numeric: the skill
  states no limit, expiry, or scoring formula, so dates are
  presence-checked only, never clock-compared. Two gated checks
  (handoff dossier, lawful basis) pass as not-applicable unless
  the manifest declares the triggering condition.
- `algorithm-design-implementation` audits a declared design
  record (the forecast/lean4 precedent), not generated code: the
  only scale bar is the skill's one stated anchor (O(n²) fatal at
  n=10⁷, exact combination only); Big-O is checked as stated,
  never proven.
- `architecture-decision-record` uses only the skill's two stated
  numeric limits as computed thresholds (alternatives 2–3;
  ADR one page max); the skill requires an ADR Status field but
  names no allowed values, so status is presence-checked only.
- `applied-ml-validation` validates declared ML evidence only
  (framing, baselines, split/leakage discipline, ladder order,
  metric directions) — it trains nothing and re-computes no
  metric the manifest does not declare.

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +7 rows (category
  `engineering` assigned at onboarding for all seven, per the
  registry's own rule — same as Batches 1–6).
- `rails/gateway/src/atoms-registry.ts`: +7 handlers, all via the
  `manifestAtom()` factory.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries 44
  atoms, every rate `null` / `pending` — pricing untouched
  everywhere.
- **Full gateway suite: 1387/1387 pass** (1066 pre-batch + 321
  new: 272 ported oracle tests + 49 golden-fixture parity tests).
  Python oracles re-run by the coordinator: 272/272 green.
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` (verified untouched in the working tree).

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×7,
internal-key scope grants ×7), per-atom live probes (401 keyless /
200 scoped internal / health lists them), and registry publication
of the seven regenerated `org.aimlds/<atom>` listings (all seven
server.json files are local and carry "built-locally — NOT
deployed; do not submit" status until then).

Follow-ups noted: `listing/listing.md` stubs are still
scaffold-grade for the batch atoms (server.json is correct — same
state as Batches 1–6 at this stage).

Program state: **44 of 162 atoms live-or-staged** (37 live, 7
staged), 6 parked with evidence, 8 G2 atoms total (5 Tier A
passed over + 3 Tier B not yet walked: `change-gate-plan`,
`coopetition-connector-plan`, `strategy-map-builder` — they pass
over in queue order when the Tier B walk reaches them), 104
Tier B G1 atoms not yet walked. All contract rates remain
`null`.

---

## FIX STREAM — F1 systemic remedy + F2 + Batch 7 deploy (2026-11-15)

Trigger: External Verification Wave 1 (independent tester, customer
key) returned 2 PASS / 35 FAIL on the 37 live atoms. F1 (35 atoms):
a manifest whose fields carry wrong JSON types was evaluated anyway
(HTTP 200, verdict over garbage) instead of HTTP 422
`{ok:false, error:"invalid_input"}`. F2 (reconciled-portfolio only):
a declared EMPTY holdings list was treated as absent. Owner routing:
fix at the batch boundary, one deploy carrying the 37 fixed atoms +
Batch 7's seven (which received the same validation before going
live). Fix commit `6c4afa3` (local only, never pushed).

Mechanism (shared, built once, proven on template atom
agent-safety-guardrail-audit before fan-out):
- New `rails/gateway/src/atoms/validate.ts`: `FieldTypeError`
  (carries `.field`) + `validateManifest(manifest, MANIFEST_SPEC)`.
  Spec DSL identical in both languages: `"string" | "boolean" |
  "number" | "any"` | object subspec | `[subspec]` list. Absent
  fields skipped; present null fails; unknown fields ignored;
  first failure in spec-declaration order; list paths use `[i]`.
  `"any"` = intentionally unvalidated (documented counted-invalid
  entry semantics).
- `atoms-registry.ts`: the `manifestAtom()` factory and atom #1's
  direct handler convert `FieldTypeError` → `InputError(field,
  message)` → HTTP 422. Plain-TypeError behaviour unchanged.
- Per atom: Python oracle gained module-level `MANIFEST_SPEC` +
  verbatim `_validate_*` helpers + regression tests FIRST (each
  mirroring the atom's recorded Wave-1 malformed case from
  `verification/work/<atom>/evidence.json`), then the TS port with
  the identical spec, proven by a spec-driven corruption
  differential (every documented path × every golden fixture,
  wrong-typed): **0 mismatches on all 42 atoms** (per-atom counts
  16–362 cases). No verdict logic changed anywhere — input
  validation only.

Test corrections (coordinator ruling, named): where a pre-existing
builder test asserted a VERDICT over a wrong-typed documented
field, the assertion encoded F1 itself and was corrected to expect
rejection — intent preserved, behaviour stricter. Corrected tests:
crypto-inventory `test_empty_or_non_list_inventory_is_insufficient_evidence`
(split: empty list stays a verdict; non-list now rejected);
decision-trap `test_options_not_a_list_fails` → `..._is_rejected`;
electrical-machinery `test_non_numeric_torque_fails_the_computed_check`
→ `..._is_rejected`; vfd `test_non_numeric_computed_value_fails`,
`test_starts_per_hour_non_numeric_fails` (the latter was the
recorded external case itself); zero-trust
`test_non_numeric_secret_length_is_missing`; forecast
`test_non_numeric_baseline_value_fails` → `..._rejected` (+ its
golden fixture `no-baselines-and-no-owner-fail` corrected to a
genuinely absent baseline, expected regenerated from the oracle,
verdict unchanged); lean4 `test_bool_sorry_count_fails` →
`..._rejected`; network-exposure `test_non_list_endpoints_fails_in_band`
→ `..._rejected`; portfolio-risk `test_single_observation_is_insufficient_evidence`
(split; non-list `returns` assertion moved to
`test_non_list_returns_rejected`); Batch 7 pre-live corrections:
acp (2), agent-context-packaging (1), agent-interoperability (1),
agentic-coding-practice (1), algorithm-design (1),
applied-ml-validation (3), architecture-decision-record (3).

Documented-semantics exceptions (validation deliberately partial,
each grounded in the atom's SERVICE.md): firewall-rules
`rules[].port_start/port_end` unvalidated (documented 0–65535
fallback; guarded by a dedicated test); crypto-inventory
`inventory` entries `["any"]` (counted in `counts.invalid_entries`);
portfolio-risk `returns`/`decision_journal`/`holdings`/
`benchmark_returns`/`factors[].returns`/`holding_returns`/
`stress_scenarios` entries `["any"]` (counted-invalid semantics);
reconciled-portfolio all six list fields container-validated only
(entries are counted gaps; implemented as a paired list-field check
in both languages instead of `["any"]` for identical semantics);
vulnerability-triage `findings` entries object-only `[{}]`
(counted-as-offender semantics; `resolved_date` documented
nullable); rag-retrieval `queries[].relevance_grades` object-only
(caller-chosen keys). SERVICE.md drift fixed in zero-trust,
algorithm-design-implementation, architecture-decision-record
("non-numeric is missing evidence" → absent is missing evidence;
present wrong-typed is rejected).

F2 (reconciled-portfolio-performance-report): list PRESENCE (not
non-emptiness) now drives the holdings layer and the
holdings-vs-declared leg, and — found by the ordered audit — the
transactions/flows-vs-ledger leg the same way. Recorded case now
computes holdings total `0.000000`, difference `-1210.000000`,
fraction `-1.000000`, status `partial`; absent lists still yield
absent layers. Regression: paired `EmptyLedgerTests` (Python) +
`f2:` tests (TS).

Suites on the final tree: **gateway 1675/1675** (1387 at Batch 7
staging + 288 fix-stream tests); **Python 1310 across the 42
atoms**, all green (coordinator re-ran every suite serially).

Deploy (house path): site-integrity declaration 93f1d20b opened
and closed; deploy2 upload of commit `6c4afa3` build —
**deployment `7f9cae9fdd60417eb72062905a066554`, certified sha256
`06c4e27b0c64faf2649ce3e92bfe8bec7fb2a1827e581e3870f6d33acc72ac80`**;
bindings passed through from live settings, STRIPE_MODE stays
`test`, all rates still `null`. D1 seeding for Batch 7: 7
`atom_enabled` rows + 7 internal-key scopes inserted; read back
**44 enabled / 44 scopes**. Catalogue `/api.json` lists 44 atoms.

Live probes (internal key derived via D1-seeded session → real
POST /v1/keys; session deleted after; per atom: golden fixture →
200 with verdict, malformed → 422 `invalid_input` naming the
field, keyless → 401): **44/44 PASS**. Malformed provenance:
recorded Wave-1 cases for the 37 previously live atoms (atom #1
included, field `product`); spec-derived first-field corruptions
for Batch 7's seven. F2 recorded case probed live: 200,
difference `-1210.000000`, fraction `-1.000000`, status `partial`
— PASS.

Listings: Batch 7's seven `org.aimlds/<atom>` records flipped to
"live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)", published via mcp-publisher, and read back from the
registry API — all seven match the repo server.json copies. The
37 existing listings needed no change.

Program state: **44 of 162 atoms live** (all release candidates;
the fix-stream deploy restarts no soak — gateway RC since
2026-11-15 graduates 2026-11-22; Batch 7 atoms enter the same
soak). 6 parked with evidence, 8 G2 passed over in queue order,
104 Tier B G1 not yet walked. Next: verification-lane retest of
the 37 + first test of Batch 7's seven (parent's instruction);
Batch 8 authoring follows in census queue order with the F1
pattern built in from the start.

---

## BATCH 8 — AUTHORED + TEST-GREEN, STAGED (2026-11-15)

Seven Tier B atoms in census queue order, all 7 taken, 0 parked:
`argument-analysis-review` (critical-reasoning skill; 24 checks,
computed fallacy/bias set-inclusion + confidence-range),
`audience-contract-design` (audience-contracts; 26 checks,
computed classes-with-path count + gated authority lattice),
`auth-design-review` (authentication-authorization; 40 checks,
password/OAuth checks gated on declared use; no numeric threshold
invented — the skill states none), `backend-engineering-advice`
(backend-engineering; 32 checks, computed error-taxonomy coverage
+ gated idempotency/migration/jobs checks), `base-rate-card`
(critical-thinking; 23 checks, computed base-rate consistency
re-derivation at 6dp + fallacy coverage; internal consistency
only — reference-class data is declared, never sourced),
`behavioral-finance-bias-check` (behavioral-finance; 30 checks,
computed 48h entry cooling-off + sizing vs caller-declared cap),
`behavioral-finance-debiasing` (behavioral-finance-expert; 36
checks, computed rebalancing drift vs caller-declared band;
position share report-only, no threshold invented; no cooling-off
duration checked — that skill states none).

F1 pattern built in from the start (the fix stream's standing
inheritance): every oracle carries MANIFEST_SPEC + the validation
helpers and validates before evaluation; malformed regression
tests in both suites per atom (8 per atom; 6 for
audience-contract-design and auth-design-review, whose skills
declare no list/numeric fields — the two inapplicable categories
exercised via the nearest typed corruptions, documented in the
tests). No `["any"]` used in this batch — no bound skill
documents counted-invalid entry semantics; list entries are fully
validated and unknown vocabulary entries are verdict-level
coverage gaps, never type errors.

Differentials (spec-corruption sweep, oracle vs port): argument
111, audience 109, auth 154, backend 182, base-rate 175,
bias-check 230, debiasing 276 = **1,237 cases, 0 mismatches**.

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +7 rows (category
  `engineering` per the registry's own rule).
- `rails/gateway/src/atoms-registry.ts`: +7 handlers, all via
  the `manifestAtom()` factory.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries
  51 atoms, every rate `null` / `pending` — pricing untouched.
- **Full gateway suite: 1960/1960 pass** (1675 post-fix-stream +
  285 new: 243 ported oracle tests + 42 golden-fixture parity).
  Python oracles re-run by the coordinator: 243/243 green.
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` / `validate.ts`.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×7,
internal-key scope grants ×7), per-atom live probes (401 keyless
/ 200 scoped internal / recorded-style malformed 422), and
registry publication of the seven regenerated `org.aimlds/<atom>`
listings (all seven server.json files are local and carry
"built-locally — NOT deployed; do not submit" status until then).

Program state: **51 of 162 atoms live-or-staged** (44 live, 7
staged), 6 parked with evidence, 8 G2 passed over in queue
order, 97 Tier B G1 atoms not yet walked. All contract rates
remain `null`.

## FIX ROUND 2 — F3 + F4 + BATCH 8 DEPLOYED (2026-11-15)

Trigger: external verification retest wave — 42 PASS / 2 FAIL across
44 live atoms. Both failures sat in the fix stream's own validation
layer. Parent rulings: F4 → option (a); F3 → validation follows
SERVICE.md exactly. One deploy carries both fixes + Batch 8's seven.

F3 (release-readiness-verdict, atom #1 — fix-stream regression):
SERVICE.md documents NO type for `release_notes.breaking_changes`
or `release_notes.migration_steps`, and the recorded Wave-1
full-pass/violations manifests carry `breaking_changes: false` and
`migration_steps: "none"` — the F1 pass had invented `["string"]`
for both, so both recorded cases returned 422 instead of
READY / NOT_READY. Remedy (oracle first, then the TS port):
both entries REMOVED from MANIFEST_SPEC — a field with no
documented type gets no type rejection; the core's existing
truthiness branch already implements the `false` semantics (no
breaking changes declared). No check logic changed. Regression
tests added in both suites embedding the recorded manifests
verbatim (full-pass → READY, violations → NOT_READY, recorded
malformed → still rejected naming `product`, minimal
false/"none" manifest → no rejection). No pre-existing test
asserted rejection for either field — none corrected. Parity:
14 inputs (4 recorded cases + 9 golden fixtures + minimal case),
full verdict dicts identical Python↔TS.

F4 (claim-verification-fact-check-stamp — parent ruling, option
(a)): the core consumes `claims[].primary_source` purely as a
boolean flag and SERVICE.md's blanket default ("all fields are
booleans unless noted") already made it boolean; the Wave-1
recorded cases (URL strings) were tester-design errors masked by
pre-fix coercion. Executed (a): SERVICE.md's claims-row notation
now declares `primary_source (boolean)` explicitly (contract.yaml
carries no field table — nothing to mirror). Validation NOT
relaxed. The verification lane redesigns its two cases and
retests after this deploy.

Over-strictness audit (the other 41 fixed atoms; mechanical +
documentary, five parallel auditors): every non-malformed recorded
external case (123 across the 41 atoms) re-run through the Python
oracles. PROVEN over-strictness: NONE beyond F3/F4 — the only
ValueError raised on a non-malformed case anywhere was
claim-verification's `primary_source`, which is F4 itself (ruled,
contract now explicit). Zero spec-vs-SERVICE.md type
contradictions. Documentary findings (listed per the ruling —
fix only where proven; NO behaviour changed for these):
wholesale-undocumented SERVICE.md input tables in
encryption-claim-audit (all 32 spec entries — no type notes, no
blanket rule), agent-safety-guardrail-audit (31 of 37 — no blanket
rule, no type column), zero-knowledge-claim-audit (26 clear + 2
borderline — no blanket rule, no type notes); partial:
rag-retrieval-evaluation-tuning `queries[]` entry fields (9),
pump-conveyor-motor-suitability-check `drives[]` (7:
`id` + six pump/conveyor numeric fields),
condition-monitoring-triage (2: `readings[].parameter`,
`alarms[].id`), distribution-equipment-rating-condition-check
(2: `equipment[].id`, `transformers[].id`),
agent-evaluation-scorecard `tasks[].name` (1; four numeric task
fields documented only by implication),
architecture-decision-record `options.alternatives[].name` (1 —
F4-shaped: unnoted, so the blanket default would read boolean
while the spec says string and every recorded case uses string
names; remedy direction noted for a future ruling: declare
`name (string)` in SERVICE.md — NOT applied this round),
license-compliance-check `public_claims.claims_made[]` element
type (1), portfolio-risk-analytics-report `factors[].name` (1),
prediction-model-leakage-calibration-audit
`evaluation.segments[].name` (1), tested-authorization-policy-pack
`tests[].policy_id` (1, borderline). Three integer→number
broadening notes (lean4 `theorems[].sorry_count`,
network-exposure `endpoints[].port`, portfolio-risk
`correlation_window`) are LESS strict than documented — not
findings. Documented exceptions re-verified in passing
(firewall port fallback, counted-invalid `["any"]` entries,
reconciled container-only lists + `holdings: []`, vulnerability
`[{}]` findings entries, rag `relevance_grades` object-only).

Suites on the final tree: **gateway 1964/1964** (1960 Batch 8
staging + 4 new F3 TS tests); atom #1 Python **27/27** (23 + 4 F3
regression). Fix commit `63fa092` (local only, never pushed).
NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
`index.ts` / `validate.ts`.

Deploy (house path): site-integrity declaration
`7eb83c33-5033-44ea-86aa-756478f5aa8c` opened and closed;
deploy2 upload of the `63fa092` build — **deployment
`babe764a73734f93a8016267e77af193`, certified sha256
`684aba370b131b58682188e6fdbb1b99b024296ca13ddb8ae960d84ea620092d`**
(sign request `282702cc-2274-494f-83ae-bbf049436f5c`); bindings
passed through from live settings, STRIPE_MODE stays `test`, all
rates still `null`. D1 seeding for Batch 8: 7 `atom_enabled` rows
+ 7 internal-key scopes inserted; read back **51 enabled / 51
internal scopes**; `/health` lists 51 atoms; catalogue `/api.json`
carries 51.

Live probes (internal key derived via D1-seeded session → real
POST /v1/keys; session deleted after; probe script shredded):
**25/25 PASS** —
- Batch 8 ×7: golden fixture → 200 with verdict
  (ARGUMENT_ANALYSIS_COMPLETE / AUDIENCE_CONTRACT_COMPLETE /
  AUTH_DESIGN_SOUND / PRODUCTION_READY / CARD_COMPLETE /
  BIAS_CHECK_CLEAR / DEBIASED); spec-derived first-field
  corruption → 422 `invalid_input` naming the field (`argument`,
  `artifact`, `system`, `system`, `claim`, `decision`, `decision`);
  keyless → 401.
- release-readiness-verdict: recorded full-pass → **200 READY**
  (F3 live proof); recorded malformed → 422 naming `product`.
- claim-verification-fact-check-stamp: golden → 200 STAMPED;
  golden with `claims[0].primary_source` as a string → **422**
  naming `claims[0].primary_source` (F4 explicit-boolean contract
  live).

Listings: Batch 8's seven `org.aimlds/<atom>` records flipped to
"live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)", published via mcp-publisher, and read back from the
registry API — all seven `active`, `isLatest`, matching the repo
server.json copies. The 44 existing listings unchanged
(release-readiness + claim-verification stay RC to 2026-11-22).

Program state: **51 of 162 atoms live** (all release candidates,
soak to 2026-11-22), 6 parked with evidence, 8 G2 passed over in
queue order, 90 Tier B G1 atoms not yet walked. All contract
rates remain `null`. Next: verification-lane retest of
release-readiness + claim-verification (with its two redesigned
cases) on the parent's instruction; Batch 9 authoring follows in
census queue order with the F1 pattern built in from the start.

## BATCH 9 — AUTHORED + TEST-GREEN, STAGED (2026-11-15)

Seven Tier B atoms in census queue order, all 7 taken, 0 parked:
`bias-controlled-quant-study-pack` (quant-research skill; 34
checks, computed cost-coverage + stability-across-periods +
reported-vs-tested coherence), `brand-mention-monitoring-triage-digest`
(social-listening; 37 checks, computed triage-dimension/route
coverage + evidence-for-every-action),
`browser-extension-engineering` (browser-extension-engineering;
37 checks, computed permission-justification + cross-browser
coverage), `budget-design-review` (budgeting; 29 checks, computed
line-amount/total/balance/horizon re-derivations),
`buyer-test-card` (poc-validation; 22 checks, computed timebox +
decision/disposition vocabularies), `c-engineering-review`
(c-engineering; 30 checks, computed zero-warnings +
no-banned-functions), `cash-flow-forecast` (cash-flow-management;
30 checks, computed weekly-balance/reserve-target/runway
re-derivations + stress-case coverage — the declared-artifact
framing of forecast-with-ranges, validates a declared forecast,
produces none).

F1 pattern built in from the start (the fix stream's standing
inheritance): every oracle carries MANIFEST_SPEC + the validation
helpers and validates before evaluation; malformed regression
tests in both suites per atom. SERVICE.md input tables document
a type for every field (blanket boolean rule + explicit notes
for every non-boolean — the F3/F4 audit lesson applied at
authoring). No `["any"]` used in this batch — no bound skill
documents counted-invalid entry semantics. Thresholds declined
to invent, each named in its SERVICE.md: no significance level /
sample minimum (quant), no alert-threshold values or sentiment
scale (brand-mention), no numeric threshold of any kind
(browser-extension — the skill states none), no variance or
contingency percentage (budget), no numeric timebox cap
(buyer-test — the skill's "days, not weeks" states no number),
no static-analysis pass mark or coverage % (c-engineering), no
minimum reserve months or runway (cash-flow).

Differentials (spec-corruption sweep, oracle vs port): bias 540,
brand-mention 306, browser-extension 636, budget 287,
buyer-test 420, c-engineering 234, cash-flow 300 = **2,723
cases, 0 mismatches**.

Integration (coordinator, serial):
- `rails/gateway/atoms.registry.json`: +7 rows (category
  `engineering` per the registry's own rule).
- `rails/gateway/src/atoms-registry.ts`: +7 handlers, all via
  the `manifestAtom()` factory.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries
  58 atoms, every rate `null` / `pending` — pricing untouched.
- **Full gateway suite: 2305/2305 pass** (1964 post-fix-round-2
  + 341 new: 296 ported oracle tests + 45 golden-fixture parity).
  Python oracles re-run by the coordinator: 296/296 green
  (45 + 41 + 40 + 50 + 39 + 34 + 47).
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` / `validate.ts`.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×7,
internal-key scope grants ×7), per-atom live probes (401 keyless
/ 200 scoped internal / recorded-style malformed 422), and
registry publication of the seven regenerated `org.aimlds/<atom>`
listings (all seven server.json files are local and carry
"built-locally — NOT deployed; do not submit" status until then).

Program state: **58 of 162 atoms live-or-staged** (51 live, 7
staged), 6 parked with evidence, 8 G2 passed over in queue
order, 83 Tier B G1 atoms not yet walked. All contract rates
remain `null`.

## Batch 9 — DEPLOYED (2026-11-15)

Trigger: Wave 3 verification fully green (all 51 live atoms carry an
external PASS; F3 + F4 closed on evidence; Batch 8 cohort 7/7 at
first test) — the Batch 9 deploy go.

Doc line (parent ruling from the fix-round-2 audit):
architecture-decision-record SERVICE.md now declares
`options.alternatives[].name (string)` explicitly in the input
table — documentation alignment only; spec and every recorded case
already treated the field as string. No behaviour or validation
change.

Deploy (house path): site-integrity declaration
`dcfcf984-9631-4b6a-81c4-b73c5f64ead8` opened and closed;
deploy2 upload of the `5657a13` build (suite **2305/2305** on the
final tree, re-run by the coordinator before deploy) —
**deployment `fa3faa42fac649da873fcc00cfa20f82`, certified sha256
`548300e5b49e8daa791859ded08f166df2d91957063e6c3daaa91f0d29bae4f1`**
(sign request `4c5da828-2ad3-4883-ad00-cc71c247929b`); bindings
passed through from live settings, STRIPE_MODE stays `test`, all
rates still `null`. D1 seeding for Batch 9: 7 `atom_enabled` rows
+ 7 internal-key scopes inserted; read back **58 enabled / 58
internal scopes**; `/health` lists 58 atoms; catalogue `/api.json`
carries 58.

Live probes (internal key via D1-seeded session → real
GET /v1/keys; session deleted after; probe script shredded):
**21/21 PASS** — Batch 9 ×7: golden fixture → 200 with verdict
(STUDY_PACK_COMPLETE / TRIAGE_DIGEST_READY / EXTENSION_DESIGN_SOUND
/ BUDGET_DESIGN_SOUND / CARD_COMPLETE / REVIEW_SOUND /
CASH_FLOW_FORECAST_READY); spec-derived first-field corruption →
422 `invalid_input` naming the field (`study`, `brand`,
`extension_name`, `budget`, `idea`, `subject`, `entity`); keyless
→ 401. (First probe attempt 403'd on the sandbox urllib
egress-proxy artifact against our own domain; re-run over curl —
the banked lesson — passed clean.)

Listings: Batch 9's seven `org.aimlds/<atom>` records flipped to
"live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)", published via mcp-publisher (one DNS login attempt
failed on a ±15 s timestamp window during a clock-drift moment;
retry succeeded), and read back from the registry API — all seven
`active`, `isLatest`, records identical to the repo server.json
copies. The 51 existing listings unchanged.

Program state: **58 of 162 atoms live** (all release candidates,
soak to 2026-11-22), 6 parked with evidence, 8 G2 passed over in
queue order, 76 Tier B G1 atoms not yet walked. All contract
rates remain `null`. Next: Batch 10 authoring in census queue
order with the F1 pattern + documented field types built in from
the start.

## BATCH 10 — AUTHORED + TEST-GREEN, STAGED (2026-11-15)

Seven Tier B atoms in census queue order, all 7 taken, 0 parked
(the Tier B G2 atoms `change-gate-plan` and
`coopetition-connector-plan` sit between `cash-flow-forecast` and
`cicd-pipeline-design` in the table and were passed over in queue
order, as before): `cicd-pipeline-design` (ci-cd-pipeline; 36
checks, computed stage-order vs the skill's stated sequence +
stage-minutes sum + monthly minutes vs the caller-declared
budget), `claim-evaluation-review` (critical-thinking; 26 checks,
computed claim-entry completeness + fallacy coverage over the
skill's stated set + hit-rate re-derivation — a review over a
declared claim set, distinct from the narrower live
`base-rate-card` on the same skill), `code-review-service`
(code-review-practice; 29 checks, computed PR size vs the skill's
stated ~400-line aim + checklist coverage of the five stated
categories + labeled/answered/unresolved comment arithmetic),
`codebase-visualization` (code-visualization; 32 checks, computed
diagram-entry completeness + dependency coverage + C4 coverage +
hotspot score = frequency × complexity),
`community-support-operations` (community-support; 38 checks,
computed SLA severity order + tracked-message equality +
top-theme coverage + thread closure),
`confidential-computing-design` (confidential-computing; 35
checks, computed threat protects/excludes coverage +
trusted-component completeness + trusted-codebase total — the
data-in-use design record, boundary with the live
`encryption-claim-audit` stated in its SERVICE.md),
`cost-estimate-preparation` (cost-estimation; 35 checks, computed
line amounts + subtotal + three-point spreads + contingency /
escalation / grand-total chain + should-cost variance).

F1 pattern built in from the start (the standing inheritance):
every oracle carries MANIFEST_SPEC + the validation helpers and
validates before evaluation; malformed regression tests in both
suites per atom. SERVICE.md input tables document a type for
every field (blanket boolean rule + explicit notes for every
non-boolean — the F3/F4 audit lesson applied at authoring).
Thresholds declined to invent, each named in its SERVICE.md: no
pipeline duration or budget number (cicd — only the
caller-declared budget is compared), no claim count / base-rate /
confidence / hit-rate levels (claim-evaluation), no test-coverage
% or review SLA (code-review), no diagram count / coverage % /
hotspot cutoff (codebase-visualization), no SLA hour values or
satisfaction score (community-support), no trusted-codebase size
cap or attestation-freshness window (confidential-computing), no
estimate-class percentage bands or contingency % (cost-estimate —
the class bands are vocabulary, never pass marks).

Differentials (spec-corruption sweep, oracle vs port): cicd 56,
claim-evaluation 47, code-review 50, codebase-visualization 56,
community-support 58, confidential-computing 56, cost-estimate 63
= **386 cases, 0 mismatches**.

Integration (coordinator, serial; builders' on-disk artifacts
verified, not trusted — every Python suite re-run by the
coordinator first):
- `rails/gateway/atoms.registry.json`: +7 rows (category
  `engineering` per the registry's own rule).
- `rails/gateway/src/atoms-registry.ts`: +7 handlers, all via
  the `manifestAtom()` factory; handler properties generated
  from each oracle's own MANIFEST_SPEC top level.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries
  65 atoms, every rate `null` / `pending` — pricing untouched.
- **Full gateway suite: 2690/2690 pass** (2305 post-Batch-9 +
  385 new: 336 ported oracle tests + 49 golden-fixture parity).
  Python oracles re-run by the coordinator: 336/336 green
  (45 + 52 + 50 + 47 + 46 + 46 + 50).
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` / `validate.ts`.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×7,
internal-key scope grants ×7), per-atom live probes (401 keyless
/ 200 scoped internal / spec-derived malformed 422), and
registry publication of the seven regenerated `org.aimlds/<atom>`
listings (all seven server.json files are local and carry
"built-locally — NOT deployed; do not submit" status until then).

Program state: **65 of 162 atoms live-or-staged** (58 live, 7
staged), 6 parked with evidence, 8 G2 passed over in queue
order, 69 Tier B G1 atoms not yet walked. All contract rates
remain `null`.

## Batch 10 — DEPLOYED (2026-11-15)

Trigger: Wave 4 verification fully green (all 58 live atoms carry an
external PASS; third consecutive cohort 7/7 at first test; no
findings open) — the Batch 10 deploy go.

Doc line (Wave 4 adjudication): budget-design-review SERVICE.md —
the `computed_status` parenthetical now states the fleet
fail-precedence rule in full (any scalar check fails →
`outside_stated_limits_on_declared_evidence`; null only when
nothing fails and a scalar check is incomplete; all five pass →
`within_stated_limits_on_declared_evidence`) — documentation only,
matching the oracle's implemented rule exactly; no behaviour
change.

Deploy (house path): gateway suite **2690/2690** re-run on the
final tree → site-integrity declaration
`7dfd58b8-7be8-4094-8e9f-f1ba2e9aa5a7` opened and closed →
deploy2 upload — **deployment `56f92826f4284ec9a8570d683113aa86`,
certified sha256
`24482a8cd72b0387ae175597ac01bef7f7d8b4198565708961144758324ca3f0`**
(sign request `5cca668d-2a0b-4c73-9624-b5216afccbdc`); bindings
passed through from live settings, STRIPE_MODE stays `test`, all
rates still `null`. D1 seeding for Batch 10: 7 `atom_enabled` rows
+ 7 internal-key scopes inserted; read back **65 enabled / 65
internal scopes**; `/health` lists 65 atoms; catalogue `/api.json`
carries 65.

Live probes (internal key via D1-seeded session → real
GET /v1/keys; session deleted after; probe script shredded):
**21/21 PASS** — Batch 10 ×7: golden fixture → 200 with verdict
(CICD_PIPELINE_READY / CLAIM_EVALUATION_COMPLETE /
CODE_REVIEW_READY / CODEBASE_VISUALIZATION_READY /
COMMUNITY_SUPPORT_READY / CONFIDENTIAL_COMPUTING_DESIGN_READY /
COST_ESTIMATE_READY); spec-derived first-field corruption
(`entity` set to a number) → 422 `invalid_input` naming `entity`;
keyless → 401.

Listings: Batch 10's seven `org.aimlds/<atom>` records flipped to
"live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)", published via mcp-publisher (fresh DNS login), and
read back from the registry API — all seven `active`, `isLatest`,
meta status identical to the repo server.json copies. The 58
existing listings unchanged.

Program state: **65 of 162 atoms live** (all release candidates,
soak to 2026-11-22), 6 parked with evidence, 8 G2 passed over in
queue order, 69 Tier B G1 atoms not yet walked. All contract
rates remain `null`. Next: Batch 11 authoring in census queue
order with the F1 pattern + documented field types built in from
the start.

## BATCH 11 — AUTHORED + TEST-GREEN, STAGED (2026-11-15)

Seven Tier B atoms in census queue order, all 7 taken, 0 parked
(no G2 atoms sit in this stretch of the queue):
`cpp-engineering-review` (cpp-engineering; 34 checks, computed
zero-warnings + no-forbidden-constructs — the skill's own gate
vocabulary), `creative-ideation-session` (creative-ideation; 24
checks, computed volume-vs-declared-target + dedup arithmetic +
shortlist-within-pool + method vocabulary — the declared session
record audited, no ideas generated), `crm-pipeline-operations`
(crm; 38 checks, computed stage coverage + deal completeness +
next-step presence + staleness vs the caller-declared threshold),
`data-analysis-deliverable` (data-analytics; 40 checks, computed
re-derivation of stated total / mean / percent change from
declared values), `data-ml-pipeline-engineering`
(data-ml-pipelines; 46 checks, computed total-rows + split-total
+ latency/cost vs caller-declared budgets),
`data-visualization-design` (data-visualization; 38 checks,
computed chart-type-vs-question mapping + bar-axis-starts-at-zero
+ no-dual-axis + the skill's stated ≤7 category limit),
`database-design-review` (database-sme; 42 checks, computed
primary-key / constraint declaration + query-pattern index
coverage over declared rows).

F1 pattern built in from the start (the standing inheritance):
every oracle carries MANIFEST_SPEC + the validation helpers and
validates before evaluation; malformed regression tests in both
suites per atom. SERVICE.md input tables document a type for
every field (blanket boolean rule + explicit notes for every
non-boolean — the F3/F4 audit lesson applied at authoring).
Thresholds declined to invent, each named in its SERVICE.md: no
clang-tidy findings count / sanitizer count / coverage %
(cpp), no minimum idea count / method quota / shortlist cap
(creative-ideation), no staleness day count / conversion target
(crm — caller-declared threshold only), no sample-size /
significance / effect-size marks (data-analysis), no split ratio
/ drift threshold / freshness window (data-ml), no contrast-ratio
/ font-size numbers (data-visualization — only the skill's own
≤7 and exact-zero rules enforced), no table/index counts or
coverage % below completeness (database).

Differentials (spec-corruption sweep, oracle vs port): cpp 55,
creative-ideation 118, crm 53, data-analysis 108, data-ml 66,
data-visualization 53, database 77 = **530 cases, 0 mismatches**.

Integration (coordinator, serial; builders' on-disk artifacts
verified, not trusted — every Python suite re-run by the
coordinator first):
- `rails/gateway/atoms.registry.json`: +7 rows (category
  `engineering` per the registry's own rule).
- `rails/gateway/src/atoms-registry.ts`: +7 handlers, all via
  the `manifestAtom()` factory; handler properties generated
  from each oracle's own MANIFEST_SPEC top level.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries
  72 atoms, every rate `null` / `pending` — pricing untouched.
- **Full gateway suite: 3032/3032 pass** (2690 post-Batch-10 +
  342 new: 293 ported oracle tests + 49 golden-fixture parity).
  Python oracles re-run by the coordinator: 293/293 green
  (38 + 45 + 43 + 42 + 39 + 48 + 38, plus 7 subtests in
  data-ml-pipeline-engineering).
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` / `validate.ts`.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×7,
internal-key scope grants ×7), per-atom live probes (401 keyless
/ 200 scoped internal / spec-derived malformed 422), and
registry publication of the seven regenerated `org.aimlds/<atom>`
listings (all seven server.json files are local and carry
"built-locally — NOT deployed; do not submit" status until then).

Program state: **72 of 162 atoms live-or-staged** (65 live, 7
staged), 6 parked with evidence, 8 G2 passed over in queue
order, 62 Tier B G1 atoms not yet walked. All contract rates
remain `null`.

## BATCH 11 — DEPLOYED (2026-11-15)

Deploy (house path): gateway suite **3032/3032** re-run on the
final tree → site-integrity declaration
`793f6b04-d54a-49b7-824e-21a858eda8a7` opened and closed →
deploy2 upload — **deployment `05ec9d2252ec4e26a46fc028eede90ab`,
certified sha256
`63e83b1fc7041f52abbb7f6972aff5e6b0caff224c4e781dce0c8bb8edee6ecf`**
(sign request `eed55a47-5f16-4239-b516-925e48bde14f`); bindings
read from LIVE worker settings and passed through unchanged
(DB → atoms-state D1, PUBLIC_BASE_URL=https://atoms.pipavia.com,
STRIPE_MODE stays `test`, three pack price IDs intact), all rates
still `null`. D1 seeding for Batch 11: 7 `atom_enabled` rows + 7
internal-key scopes inserted; read back **72 enabled / 72
internal scopes**; `/health` lists 72 atoms; catalogue `/api.json`
carries 72.

Live probes (internal key via D1-seeded session → real
POST /v1/keys; session deleted after; probe script shredded):
**21/21 PASS** — Batch 11 ×7: golden fixture → 200 with verdict
(REVIEW_SOUND / SESSION_COMPLETE / CRM_PIPELINE_READY /
DELIVERABLE_COMPLETE / DATA_ML_PIPELINE_READY /
DATA_VISUALIZATION_DESIGN_SOUND / DATABASE_DESIGN_SOUND);
spec-derived first-field corruption (`subject` / `session_title`
/ `entity` / `question` / `entity` / `entity` / `design` set to a
number) → 422 `invalid_input` naming the field; keyless → 401.

Listings: Batch 11's seven `org.aimlds/<atom>` records flipped to
"live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)", published via mcp-publisher (fresh DNS login), and
read back from the registry API — all seven `active`, `isLatest`,
meta status identical to the repo server.json copies. The 65
existing listings unchanged. **Read-back caught one staging
defect:** cpp-engineering-review's server.json carried the name
`io.github.nrupala/atom-cpp-engineering-review` instead of
`org.aimlds/atom-cpp-engineering-review` (the registry refused it
403); the name was corrected in the repo copy and republished —
the other six were correct. Batch 12 authoring briefs now carry
the org.aimlds name rule explicitly.

Program state: **72 of 162 atoms live** (all release candidates,
soak to 2026-11-22), 6 parked with evidence, 8 G2 passed over in
queue order, 62 Tier B G1 atoms not yet walked. All contract
rates remain `null`. Next: Batch 12 authoring in census queue
order with the F1 pattern + documented field types + org.aimlds
listing names from the start.

## BATCH 12 — AUTHORED + TEST-GREEN, STAGED (2026-11-15)

Seven Tier B atoms in census queue order, all 7 taken, 0 parked
(no G2 atoms sit in this stretch of the queue):
`decision-process-design` (decision-intelligence; 36 checks,
computed option/criteria coverage + loss-cost ratio),
`decision-ready-research-brief` (research-tooling; 42 checks,
computed source-provenance + claim-sourcing + triangulation
coverage — the declared brief record audited, no research
performed), `delivery-plan-preparation` (delivery-planning; 38
checks, computed schedule arithmetic + dependency resolution +
coverage ratios), `designed-test-case-pack` (test-design; 30
checks, computed traceability + expected-result coverage +
duplicate-id detection), `difficult-conversation-coaching`
(emotional-intelligence-manager; 31 checks, computed
preparation-domain order + SBI completeness — the declared
preparation record audited, no coaching generated, no wording
judged), `document-operations-service` (document-operations; 32
checks, computed output-verification + finding-location +
exact-quote coverage), `domain-portfolio-audit`
(domain-portfolio-ops; 44 checks, computed canonical-per-cluster
+ redirect-graph loops/hops + email-auth coverage + renewal vs
declared evaluation date — no live DNS lookups).

F1 pattern built in from the start (the standing inheritance):
every oracle carries MANIFEST_SPEC + the validation helpers and
validates before evaluation; malformed regression tests in both
suites per atom. SERVICE.md input tables document a type for
every field (blanket boolean rule + explicit notes for every
non-boolean — the F3/F4 audit lesson applied at authoring).
Listing names carry `org.aimlds/` from the start (the Batch 11
cpp staging defect named in the briefs; all seven correct).
Thresholds declined to invent, each named in its SERVICE.md:
no minimum option/criterion counts or loss-cost bands
(decision-process), no source-age/freshness window — dates are
provenance only, never parsed (research-brief), no numeric WIP
limit or phase/milestone counts (delivery-plan), no coverage
percentage below completeness or case-count bounds (test-case),
no pause length / rehearsal count / numeric empathy score
(conversation), no finding/document count bounds or retention
period (document-operations), no renewal-warning window — the
skill's 60/30/7 alerts checked only as an attestation, the
reporting window caller-declared (domain-portfolio).

Differentials (spec-corruption sweep, oracle vs port):
decision-process 350, research-brief 208, delivery-plan 828,
test-case-pack 139, conversation-coaching 435,
document-operations 279, domain-portfolio 224 = **2,463 cases,
0 mismatches**.

Integration (coordinator, serial; builders' on-disk artifacts
verified, not trusted — every Python suite re-run by the
coordinator first):
- `rails/gateway/atoms.registry.json`: +7 rows (category
  `engineering` per the registry's own rule).
- `rails/gateway/src/atoms-registry.ts`: +7 handlers, all via
  the `manifestAtom()` factory; handler properties generated
  from each oracle's own MANIFEST_SPEC top level.
- `tools/sync-rates.mjs` re-run: `src/generated.ts` now carries
  79 atoms, every rate `null` / `pending` — pricing untouched.
- **Full gateway suite: 3369/3369 pass** (3032 post-Batch-11 +
  337 new: 287 ported oracle tests + 50 golden-fixture parity).
  Python oracles re-run by the coordinator: 287/287 green
  (41 + 45 + 41 + 43 + 35 + 40 + 42).
- NO edits to `billing.ts` / `store.ts` / `callpath.ts` /
  `index.ts` / `validate.ts`.

Deploy-readiness: **STAGED, not deployed**. Held for the deploy
go: gateway deploy, D1 seeding (`atom_enabled:<atom>=1` ×7,
internal-key scope grants ×7), per-atom live probes (401 keyless
/ 200 scoped internal / spec-derived malformed 422), and
registry publication of the seven regenerated `org.aimlds/<atom>`
listings (all seven server.json files are local and carry
"built-locally — NOT deployed; do not submit" status until then).

Program state: **79 of 162 atoms live-or-staged** (72 live, 7
staged), 6 parked with evidence, 8 G2 passed over in queue
order, 55 Tier B G1 atoms not yet walked. All contract rates
remain `null`.

## BATCH 12 — DEPLOYED (2026-11-15) + data-visualization-design wording fix

**Doc wording fix (Wave 6 observation, shipped in this deploy):**
data-visualization-design's `comparison_charts_sorted` and
`bar_charts_y_axis_starts_at_zero` checks carried a static
"(no … chart is declared, so this passes vacuously)" evidence
parenthetical that printed even when the check FAILED on declared
rows (and even on passes over declared rows). The parenthetical is
now emitted only when the relevant row set is actually empty, in
both the Python oracle and the TS port — wording only; no check
logic, status, verdict, or computed value changed. Proof: the six
golden fixtures regenerated from the edited oracle differ in
exactly 12 evidence strings (every diff a vacuous-parenthetical
removal on the two named checks; the empty fixture, where the rows
genuinely are absent, is byte-identical); Python suite 48/48, TS
atom suite 55/55; spec-corruption differential (7 fixtures + 420
single-leaf corruptions) oracle vs port: **427 cases, 0
mismatches**.

**Deploy (house path: declare → deploy2 → certify → close):**
gateway suite on the final tree — **3369/3369 green**;
site-integrity declaration `e9fb5582-e2b8-40d3-a613-4177b9e6fa32`
opened and closed; bindings read from LIVE worker settings and
passed through unchanged (DB → atoms-state D1, PUBLIC_BASE_URL=
https://atoms.pipavia.com, STRIPE_MODE stays `test`, three pack
price IDs intact), all rates still `null`; deploy2 upload —
**deployment `7bad54c4e4a145e493e8766eb2f3bafb`, certified sha256
`75bc38a706bbbdd7c3ad5ba2c2376792a563d35dc008a2bf45bb1aa018fe63d5`**
(sign request `a9053ca9-97ee-47c7-bbb0-ec94e82239cb`). D1 seeding
for Batch 12: 7 `atom_enabled` rows + 7 internal-key scopes
inserted; read back **79 enabled / 79 internal scopes**; `/health`
lists 79 atoms; catalogue `/api.json` carries 79.

Live probes (internal key via D1-seeded session → real
GET /v1/keys; session deleted after; probe script shredded):
**23/23 PASS** — Batch 12 ×7: golden fixture → 200 with verdict
(DECISION_PROCESS_SOUND / RESEARCH_BRIEF_DECISION_READY /
DELIVERY_PLAN_READY / TEST_CASE_PACK_SOUND /
CONVERSATION_PREPARATION_COMPLETE / DOCUMENT_OPERATIONS_SOUND /
DOMAIN_PORTFOLIO_SOUND); spec-derived first-field corruption
(`decision` / `brief` / `plan` / `pack` / `conversation_title` /
`operation` / `portfolio` set to a number) → 422 `invalid_input`
naming the field; keyless → 401. Plus the wording-fix probe:
data-visualization-design's recorded violations manifest → 200
DATA_VISUALIZATION_DESIGN_NOT_SOUND with both corrected checks at
status `fail` and evidence free of the vacuous parenthetical.

Listings: Batch 12's seven `org.aimlds/<atom>` records flipped to
"live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)", published via mcp-publisher (fresh DNS login), and
read back from the registry API — all seven `active`, `isLatest`,
content identical to the repo server.json copies. The 72 existing
listings unchanged. One publish correction: delivery-plan-
preparation's registry description was 106 chars (over the
100-char limit, refused 422) — shortened to the house pattern
("Delivery plan preparation, delivered per API call as an atom
service on Conduit Atoms.", 86 chars, meaning unchanged) in the
repo copy and republished clean.

Program state: **79 of 162 atoms live** (all release candidates,
soak to 2026-11-22), 6 parked with evidence, 8 G2 passed over in
queue order, 48 Tier B G1 atoms not yet walked. All contract
rates remain `null`. Next: Batch 13 authoring in census queue
order with the F1 pattern + documented field types + org.aimlds
listing names from the start.

## Batch 13 — AUTHORED + TEST-GREEN, STAGED (2026-11-15, coordinator session)

**7 taken, 0 parked** (census Tier B queue order after domain-portfolio-audit; all G1 with bound skills). F1 type validation built into every core from the start AND every SERVICE.md field type documented at authoring. Python suites re-run by the coordinator: **271/271**. Full gateway suite on the integrated tree: **3689/3689** (3369 Batch 12 + 320 new). Registry rows +7 (86 total); sync-rates regenerated (86 atoms, every rate null/pending); frozen files (billing/store/callpath/index/validate) untouched. NOT deployed — staged for the next deploy go (after Wave 7 verification of Batch 12).

| atom | checks/sections | verdicts | Py | TS | differential |
|---|---|---|---|---|---|
| edge-platform-engineering | 38 / 5 | EDGE_PLATFORM_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 37 | 44 | 260/260 |
| efficient-web-build-standard | 49 / 4 | EFFICIENT_WEB_BUILD_STANDARD_MET / _NOT_MET / INSUFFICIENT_EVIDENCE | 41 | 48 | 425/425 |
| electrical-machines-expert-advice | 44 / 7 | SOUND / NOT_SOUND / INSUFFICIENT_EVIDENCE | 26 | 33 | 308/308 |
| engineering-project-budget-pack | 42 / 6 | BUDGET_PACK_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 47 | 54 | 462/462 |
| engineering-work-package-structuring | 42 / 4 | WORK_PACKAGE_STRUCTURED / _NOT_STRUCTURED / INSUFFICIENT_EVIDENCE | 48 | 55 | 654/654 |
| fare-construction-savings-strategy | 21 / 6 | FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 41 | 48 | 220/220 |
| finance-education-article | 19 / 5 | ARTICLE_READY / NOT_ARTICLE_READY / INSUFFICIENT_EVIDENCE | 31 | 38 | 179/179 |

Differentials total **2,508 cases, 0 mismatches**. Distinct-ground statements recorded in SERVICE.md for the two sibling-adjacent atoms: electrical-machines-expert-advice (SME advice record vs the live electrical-machinery-engineering-check's machinery manifest; zero check overlap) and finance-education-article (article-production record vs finance-content-compliance-check's compliance posture; no shared checks). One builder-found oracle bug fixed during authoring (edge-platform-engineering: storage-rationale double-count). Declined thresholds named per atom in SERVICE.md (no invented numeric limits anywhere; efficient-web-build-standard's computed checks use only the skill's own stated numbers). Noted for a future house ruling (no action taken): the F1 error class convention — oracles raise a FieldTypeError subclassing both ValueError and TypeError; gateway behavior (422) is unaffected.

**Program state after Batch 13 staging:** 162 = **79 live** (all externally PASSING through Wave 6; Batch 12's seven await Wave 7 first-test) + **7 staged** (Batch 13) + **6 parked** (Tier A set, owner's ruling outstanding) + **8 G2 passed over** + **62 Tier B G1 unwalked**. All batches RC, soak to 2026-11-22. All contract rates null.
