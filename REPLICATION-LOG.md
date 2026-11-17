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

## Batch 13 — DEPLOYED (2026-11-15)

**Deploy (house path: declare → deploy2 → certify → close):**
gateway suite on the final tree (commit `ec48d31` content) —
**3689/3689 green**; site-integrity declaration
`ea897b3d-2efa-4831-b4a9-e4b3da53c08c` opened and closed after
certify; bindings read from LIVE worker settings and passed
through unchanged (DB → atoms-state D1, PUBLIC_BASE_URL=
https://atoms.pipavia.com, **STRIPE_MODE stays `test`**, three
pack price IDs intact), all rates still `null`; deploy2 upload —
**deployment `5cf70cb60526415d89b4db5e5cd02744`, certified sha256
`c48a008621ac01028de010a6d01b692cf741548713c7ba832b1addb9db4531e4`**
(sign request `e190286e-7abe-4abd-ba0c-3c76138f7055`). D1 seeding
for Batch 13: 7 `atom_enabled` rows + 7 internal-key scopes
inserted; read back **86 enabled / 86 internal scopes**; `/health`
lists 86 atoms; catalogue `/api.json` carries 86.

Live probes (internal key via D1-seeded session → real
GET /v1/keys; session deleted after; probe script shredded):
**21/21 PASS** — Batch 13 ×7: golden fixture → 200 with the
oracle's verdict (EDGE_PLATFORM_SOUND /
EFFICIENT_WEB_BUILD_STANDARD_MET / SOUND / BUDGET_PACK_READY /
WORK_PACKAGE_STRUCTURED / FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY
/ ARTICLE_READY, each matched against the Python oracle run on the
same manifest); spec-derived first-field corruption (`project` /
`site` / `advice_id` / `entity` / `package` / `trip_label` /
`article` set to a number) → 422 `invalid_input` naming the field;
keyless → 401.

Listings: Batch 13's seven `org.aimlds/<atom>` records flipped to
"live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)", published via mcp-publisher (fresh DNS login), and
read back from the registry API — all seven `active`, `isLatest`,
content identical to the repo server.json copies. The 79 existing
listings unchanged. **Listing completion caveat (owner's
remediation program):** Batch 13's listings count COMPLETE only
when their WS1 documentation pass lands — see the process counts
below.

**Process-binding counts for Batch 13 (per-atom lines, owner
ruling 2026-11-15 20:40 MST):**
- N-10 documentation: PROVEN 0 / OPEN 0 / WAIVED 0 / **NOT RUN 7**
  (no DOCUMENTATION.md yet for the seven; WS1 pass is the named
  next step. WS1's own record for the prior fleet: PROVEN 79 /
  OPEN 0 / WAIVED 0 / NOT RUN 0 in its scope.)
- R-18 per-atom gate verdict: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (the WS2 per-atom gate run of 2026-11-15 covers
  the 79 prior atoms; its repo GATE-VERDICT records had not landed
  at this entry's writing, and Batch 13 is outside that run's
  scope.)
- Guardian Mesh disposition: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (WS2's run files GM disposition NOT RUN for every
  atom in its scope, with Spec Inputs GMSI-157…174; Batch 13 is
  outside that scope and is stated NOT RUN here.)

**Catalogue doc-link (WS1 staged change,
`documentation/CATALOGUE-DOC-LINK-STAGED-CHANGE.md`, committed
`08d48bd`):** did NOT ride this deploy — the deploy2 upload
completed before the carry instruction reached this lane (point
of no return passed). It rides Batch 14's deploy. Guard state at
this entry: DOCUMENTATION.md present for 79 of 86 live atoms —
Batch 13's seven outstanding (WS1). Ruling needed before Batch
14's deploy: the staged guard iterates the catalogue; a deploying
batch's own atoms cannot carry WS1 documentation before they are
live + externally verified, so the guard's scope must be read as
the atoms live before the deploying batch (or WS1 coverage of
Batch 13 + 14 must land first) — parent's call, named here so the
Batch 14 deploy does not discover it at build time.

Program state: **86 of 162 atoms live** (all release candidates,
soak to 2026-11-22), 6 parked with evidence, 8 G2 passed over in
queue order, 55 Tier B G1 atoms not yet walked. All contract
rates remain `null`. Next: Batch 14 authoring in census queue
order + the source-hygiene cleanup queued by the parent
(SERVICE.md status lines, contract.yaml endpoints alignment,
zero-trust-evaluation-verdict inputSchema alignment,
portfolio-risk-analytics-report guide/SERVICE alignment).

## Batch 14 — AUTHORED + TEST-GREEN, STAGED (2026-11-15, coordinator session)

**7 taken, 0 parked** (census Tier B queue order after
finance-education-article; all G1 with bound skills). F1 type
validation built into every core from the start AND every
SERVICE.md field type documented at authoring. Python suites
re-run by the coordinator: **275/275**. Full gateway suite on the
integrated tree: **4013/4013** (3689 Batch 13 + 324 new: 275
ported oracle tests + 49 golden-fixture parity). Registry rows
+7 (93 total); handlers +7 with properties generated from each
oracle's own MANIFEST_SPEC; sync-rates regenerated (93 atoms,
every rate null/pending); frozen files
(billing/store/callpath/index/validate) untouched. NOT deployed —
staged for the next deploy go (after Wave 8 verification of
Batch 13).

| atom | checks/sections | verdicts | Py | TS | differential |
|---|---|---|---|---|---|
| finance-tool-design-advisory | 32 / 5 | FINANCE_TOOL_DESIGN_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 35 | 42 | 142/142 |
| forecast-confidence-scoreboard | 26 / 5 | CONFIDENCE_SCOREBOARD_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 40 | 47 | 229/229 |
| framework-adoption-adr | 30 / 5 | FRAMEWORK_ADOPTION_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 43 | 50 | 192/192 |
| frontend-implementation | 39 / 5 | FRONTEND_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 37 | 44 | 228/228 |
| full-stack-app-build-pack | 57 / 6 | FULL_STACK_BUILD_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 34 | 41 | 255/255 |
| grpc-service-design | 39 / 5 | GRPC_SERVICE_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 46 | 53 | 211/211 |
| home-shortlist-carrying-cost-comparison | 25 / 5 | HOME_SHORTLIST_COMPARISON_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 40 | 47 | 219/219 |

Differentials total **1,476 cases, 0 mismatches**. Distinct-ground
statements recorded in SERVICE.md for the two sibling-adjacent
atoms (forecast-confidence-scoreboard vs forecast-with-ranges —
human-forecaster calibration ledger vs a single forecast artifact,
zero shared checks/fields/quantities; framework-adoption-adr vs
architecture-decision-record — framework adoption only, the
sibling's 2–3 alternatives rule deliberately NOT imported).
Declined thresholds named per atom in SERVICE.md (no invented
numeric limits anywhere). One coordinator hygiene fix during
integration: grpc-service-design's TS port carried two raw NUL
bytes as an internal map-key separator — replaced with `\u0000`
escapes (identical runtime string; the port's 53 tests in the full
suite re-prove it). **Listing completion caveat (remediation
program):** Batch 14's listings count COMPLETE only when their
WS1 documentation pass lands — see process counts below.

**Process-binding counts for Batch 14 (per-atom lines):**
- N-10 documentation: PROVEN 0 / OPEN 0 / WAIVED 0 / **NOT RUN 7**
  (WS1 pass follows live + external verification, per the program).
- R-18 per-atom gate verdict: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7**.
- Guardian Mesh disposition: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7**.

## Source-hygiene cleanup — DONE (2026-11-15, Batch 14 stream; ships with the next deploy)

Queued by the parent from WS1's record; each fix verified against
recorded evidence; re-diff after edits: **0 mismatches remaining**.

- **(a) SERVICE.md status lines — 86 files corrected.** Ten
  distinct stale wordings found (all claiming built-locally /
  scaffolded / no endpoint live); every live atom's status now
  reads live on Conduit Atoms as a release candidate since
  2026-11-15, soak to 2026-11-22 (tier preserved per file).
  Special case: release-readiness-verdict carries no `## Status`
  section — its stale "Endpoints (when live — none are yet)"
  heading was corrected in place.
- **(b) contract.yaml endpoints — 65 contracts aligned, 21
  already correct.** Additions only (49 API + 65 MCP lines; 0
  removed/changed; pricing untouched, rate null everywhere): 49
  atoms were missing both API and MCP surfaces, 16 were missing
  MCP only (incl. the named prediction-model-leakage-calibration-
  audit), 0 missing API only. Verified against the live /api.json
  feed (86 atoms, both surfaces each). Batch 7's cohort resolves
  exactly as WS1 named it (5 of 7 understated).
- **(c) zero-trust-evaluation-verdict MCP inputSchema — fixed.**
  The schema lives in the shared registry
  (`rails/gateway/src/atoms-registry.ts`, that atom's manifestAtom
  entry only): `findings` was declared `arr(...)`; every piece of
  recorded evidence (oracle MANIFEST_SPEC, TS port spec, 6/6
  fixtures, all recorded verification cases, SERVICE.md field
  paths) carries `findings` as an OBJECT of five booleans. One
  line changed: `arr(...)` → `obj(...)`. Re-proven: spec-corruption
  differential 311 cases, 0 mismatches (both shapes probed
  explicitly — array forms now reject identically in oracle and
  port); the atom's gateway test standalone 39/39; the compiled
  handler now serves `findings: {type: "object"}` and 422s the
  array shape. **The live gateway still serves the old array
  schema until the next deploy carries this line.**
- **(d) portfolio-risk-analytics-report docs — aligned to
  recorded behavior.** USER-GUIDE.md's empty input table filled
  (all 21 fields with types, house shape). SERVICE.md's `complete`
  definition was stricter than the atom's own recorded full-pass
  run (evidence 2026-11-15T23:53:46Z: verdict `complete`, 0 gaps,
  with two layers absent and four computed blocks null — absence
  of an unsubmitted optional section adds no gap); the status
  paragraph + layers bullet now state the implemented rule
  verbatim (status is a function of the returns series + the gaps
  list alone), confirmed against the oracle's evaluate(). Docs
  only; no code touched.

## Catalogue doc-link — disposition for Batch 14's deploy (2026-11-15)

Did NOT ride Batch 13's deploy (upload completed before the carry
instruction arrived). **Implementation now built and proven** in a
scratch tree by the coordinator: `tools/sync-docs.mjs` (committed
in this stream, rails/gateway/tools/), the renderer + page
(`documentation/docs.ts.reference`, to be copied to
`rails/gateway/src/docs.ts` at apply time), the index.ts
`/docs/<atom>` route, the catalogue.ts `documentation` feed field
+ row link, and the staged change's three test assertions —
**full suite 4014/4014** with a proof emit over the 79 documented
atoms; rendered pages verified (H1 title, tables/code/headings,
seller strip). **The guard is the blocker, by design:** run
against the current 93-atom catalogue, sync-docs exits non-zero
naming exactly 14 atoms — Batch 13's seven + Batch 14's seven —
with no DOCUMENTATION.md. The wiring therefore rides the first
deploy at which the guard passes; that needs (i) WS1 coverage of
Batch 13's seven (they are live + verified-eligible now) and
(ii) a ruling on the guard's scope for a deploying batch's own
atoms, which cannot carry WS1 documentation before they are live
+ externally verified (named in the Batch 13 entry; parent's
call). Until then the staged tree deliberately carries NO
docs wiring, so Batch 14 stays deployable on its own go.

**Program state after Batch 14 staging:** 162 = **86 live** +
**7 staged** (Batch 14) + **6 parked** (Tier A set, owner's ruling
outstanding) + **8 G2 passed over** + **55 Tier B G1 unwalked**.
All live batches RC, soak to 2026-11-22. All contract rates null;
STRIPE_MODE stays test.


## CI root placement (2026-11-15)

The defined workflow sat only at `rails/gateway/.github/workflows/ci.yml`
— a nested path GitHub Actions never discovers (the F-G1 run confirmed
0 workflows / 0 runs on the published repo, and the file declared no
`workflow_dispatch`). A repo-root copy now exists at
`.github/workflows/ci.yml`: identical job (ubuntu-latest, checkout@v4,
setup-node@v4 Node "24", working-directory `rails/gateway`,
`npm ci` → `npm test` → `npm run build`) plus a `workflow_dispatch`
trigger; the nested copy is retained for subtree locality. YAML
validated; the job block is structurally identical to the nested
definition — the same steps run green verbatim on the published
snapshot in the F-G1 CI run record (gate pack
`atoms-per-atom-gate-2026-11-15/pack.md`: 3689/3689, Node v24.22.1).
This lands in HEAD for the Product Atoms lane's follow-up push; after
that push, a hosted Actions run on HEAD is expected and must be
verified (F-G1 stays OPEN until then).

## Takedown-presentation patch — DEPLOYED (2026-11-15, owner directive 21:50 MST)

**The seven kill-switch-disabled atoms now come down on every
presentation surface, not only at the call path.** Ships on its own
— NOT in Batch 14. Deployed tree = the live Batch 13 base
(`108e899`, 86 atoms) + this patch only; Batch 14's staged tree
(93 atoms, incl. the catalogue doc-link / sync-docs wiring, the
zero-trust schema line, and the F-G3 security headers) does NOT
ride this deploy and must rebase onto it.

**What changed, per surface** (presentation + MCP discovery/status
only; frozen `billing.ts` / `store.ts` / `callpath.ts` /
`validate.ts` untouched — diff-verified):

1. **Catalogue page** (`catalogue.ts`): rows for disabled atoms are
   REMOVED entirely; live rows unchanged.
2. **`/api.json`**: every entry gains an explicit `status` field —
   `"live"` for serving atoms, `"disabled"` for the seven; a
   disabled atom is never presented as available.
3. **`/health`**: `atoms` lists serving atoms only (79), plus a new
   explicit `disabled_atoms` list naming the seven.
4. **MCP `tools/list`** on `/mcp/<disabled-atom>`: returns an EMPTY
   tools array; a live atom's list is unchanged. Surface census:
   the per-atom `/mcp/<atom>` route is the gateway's only MCP
   listing/discovery surface (no aggregate endpoint exists);
   `initialize` on a disabled atom is treated the same way (below).
5. **MCP `tools/call`** to a disabled atom: literal **HTTP 503**
   with the REST refusal body (`atom_disabled`) — previously HTTP
   200 with a JSON-RPC error object. `initialize` on a disabled
   atom returns the same literal 503. The change is at the MCP
   route layer (`index.ts`): after the same key + scope gates
   `mcpCall` applies (same order, same error bodies), the route
   renders the disabled state itself; `callpath.ts` refusal
   semantics are unchanged, and any other MCP method (ping,
   notifications, unknown methods) delegates to `mcpCall` as
   before. REST refusal behaviour is unchanged (literal 503 via
   the call path, re-proven live below).

**Live-state derivation (hard requirement):** every presentation
decision reads the SAME D1 config the call path reads —
`atom_enabled:<service>` via `store.getConfig` — AT REQUEST TIME
(per-request reads; catalogue/feed/health read the whole catalogue
set in parallel; no cache, no hardcoded disabled list in code,
nothing baked into `generated.ts` or the bundle). Flipping a D1
switch changes catalogue/feed/health/MCP presentation with NO
redeploy. The flip property is proven by the test harness (toggle
config in a MemoryStore → all surfaces flip in-process, both
directions); production switches were deliberately NOT flipped
for a probe.

**Tests:** new `test/takedown-presentation.test.ts` (8 tests: the
five forms, keyless-still-401, REST-503 unchanged, live golden 200
on both faces, and the flip test). Suite on the EXACT deployed
tree: **3697/3697 green** (3689 Batch 13 baseline + 8 new). The
same patch on the staged 93-atom tree: **4021/4021 green**.

**Release gate:** PASS WITH FINDINGS (the expected ceiling; GM /
Kali legs NOT RUN, as before) — pack
`~/workspace/release-gate-runs/atoms-gateway-takedown-presentation-2026-11-15/`
(`report.json` + `report.md` + `SUPPLEMENT.md` with the extended
families table — testing/UAT/user-security EVIDENCED, data/tenancy
families N/A with reasons, network/connection/zero-trust NOT RUN —
and Guardian Mesh Spec Inputs: one new GMSI requiring GM to prove
presentation state can never diverge from kill-switch state).
This patch is a RELEASE CANDIDATE in RC soak (to 2026-11-22,
alongside the fleet's existing RCs).

**Deploy (house path: declare → deploy2 → certify → close):**
site-integrity declaration `f90a60cf-c887-465d-975d-df2bc9251417`
opened and closed after certify; bindings read from LIVE worker
settings and passed through unchanged (DB → atoms-state D1,
PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE stays
`test`**, three pack price IDs intact); **NO D1 state changed by
this patch** (kill-switch rows read back after the probes: still
exactly 7 × `atom_enabled:* = 0`); deploy2 upload —
**deployment `905d3b13ed4f440b9e74c0928acb2c7d`, certified sha256
`4a216ecb784480cb12be05f15e022c0b581a13a16b3f73cd132bebac60a9afc0`**
(sign request `a212b04a-64ab-4075-8cc6-62dc9db3f6ea`).

**Live probes (all read back with curl):**
- `GET /health` 200 — `atoms` 79, `disabled_atoms` exactly the
  seven; `release-readiness-verdict` present in `atoms`.
- `GET /api.json` 200 — 86 entries, every entry carries `status`,
  exactly 7 `"disabled"` (the seven), `release-readiness-verdict`
  `"live"`.
- `GET /` catalogue 200 — each of the seven names: 0 matches;
  `release-readiness-verdict`: present.
- MCP `tools/list` disabled (`difficult-conversation-coaching`,
  scoped key): 200 `{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}`.
- MCP `tools/list` live (`release-readiness-verdict`): 200, 1 tool
  (`release_readiness_verdict`).
- MCP `tools/call` disabled: **HTTP 503**
  `{"ok":false,"error":"atom_disabled","detail":"difficult-conversation-coaching is currently disabled"}`.
- MCP `initialize` disabled: **HTTP 503**, same refusal body.
- REST `POST /v1/difficult-conversation-coaching`: **HTTP 503**,
  same refusal body (unchanged).
- Live golden calls: REST `POST /v1/release-readiness-verdict`
  200 verdict `READY`; MCP `tools/call` 200 verdict `READY`,
  `isError:false`.
- Probe hygiene: the probe session/key/user rows seeded for the
  authenticated probes were deleted afterwards (read back 0/0/0);
  probe credentials shredded.

**Program state:** 86 live (79 serving + 7 kill-switch-disabled,
now down on every surface), Batch 14's 7 still staged — its tree
rebases onto this deploy. All contract rates remain `null`.

## Batch 14 — DEPLOYED (2026-11-15)

**Integration onto the live base (Batch-13 base + takedown patch
`61792e5`):** the staged Batch 14 work (`0c16340`) rebased onto the
takedown deploy as commit `baf66d7` — the catalogue doc-link was
integrated WITH the takedown-presentation catalogue/feed code (which
reads live kill-switch state at request time), never over it. The
deploy tree was an isolated archive of `baf66d7`; Batch 15's
in-flight authoring files were excluded by construction (bundle
census at upload: exactly the 93 atom modules + docs.js +
docs.generated.js).

**What shipped:**
- **Batch 14's seven atoms** (staging evidence stands: Python
  oracles re-run by the coordinator on the integrated tree
  **275/275**; differentials re-anchored by the oracle-generated
  golden fixtures inside the gateway suite): finance-tool-design-
  advisory, forecast-confidence-scoreboard, framework-adoption-adr,
  frontend-implementation, full-stack-app-build-pack,
  grpc-service-design, home-shortlist-carrying-cost-comparison.
- **Catalogue doc-link** (WS1 staged change,
  `documentation/CATALOGUE-DOC-LINK-STAGED-CHANGE.md`):
  `tools/sync-docs.mjs` emits `src/docs.generated.ts` (**85 docs**);
  `src/docs.ts` renderer + `GET /docs/<atom>` route; feed gains a
  `documentation` field and catalogue rows a Documentation link —
  **only for a live atom with an emitted doc**. Disabled atoms keep
  their post-takedown presentation (no catalogue row, `status:
  disabled` in the feed, no doc link, `/docs/<atom>` 404). Build
  guard scoped per the parent's doc-guard ruling: every atom live
  before this deploy is documented (**85 PROVEN**),
  electrical-machines-expert-advice **WAIVED** under U-13 (disabled;
  documentation is a return precondition), Batch 14's seven
  **GUARD_PENDING** — they enter the guard's scope at the following
  deploy, which is blocked until their WS1 documentation is PROVEN.
- **Zero-trust schema line**: zero-trust-evaluation-verdict
  `findings: obj(...)` in atoms-registry.ts (from the staging
  commit; differential 311 cases, 0 mismatches).
- **F-G3 security headers**: a central wrapper in index.ts sets
  Strict-Transport-Security `max-age=31536000; includeSubDomains`,
  X-Content-Type-Options `nosniff`, X-Frame-Options `DENY`,
  Referrer-Policy `no-referrer`, Permissions-Policy
  `camera=(), microphone=(), geolocation=()`, and a
  Content-Security-Policy split by surface (HTML: `default-src
  'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline';
  img-src 'self' data:; frame-ancestors 'none'; base-uri 'self';
  form-action 'self'` — non-HTML: `default-src 'none';
  frame-ancestors 'none'; sandbox`) on EVERY gateway response.
  Frozen files (billing/store/callpath/validate) untouched.

**Gate:** PASS WITH FINDINGS — pack
`~/workspace/release-gate-runs/atoms-gateway-batch14-2026-11-15/`
(scanner PASS WITH FINDINGS, zero must-failures / secrets / vulns;
carried F-G2 Low; GMSI-175 filed). Suite on the exact deploy tree:
**4030/4030 green** (4021 baseline + 9 new doc-link/headers tests).

**Deploy (house path: declare → deploy2 → certify → close):**
site-integrity declaration `8880b691-0f43-4885-aa35-b584bdc70f46`
opened and closed after certify; bindings read from LIVE worker
settings and passed through unchanged (DB → atoms-state D1,
PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE stays
`test`**, three pack price IDs intact), all rates still `null`;
deploy2 upload — **deployment `38371decd3a447a1b2c82ff4ac4e8e42`,
certified sha256
`0b24dd21f12c1cb75a93a13fbac4f61c4315f2000ec726b09b38a1c4a69055c1`**
(sign request `ed599f4b-fc8e-48f6-a5db-35ac8e83b9a4`). D1 seeding
for Batch 14: 7 `atom_enabled` rows + 7 internal-key scopes
inserted, one statement per call; read back **93 internal scopes /
86 enabled / 7 disabled** — registered 93, serving 86, disabled 7.

**Live probes (internal key via D1-seeded session; session deleted
and read back 0 after; probe credentials never persisted):**
- Per-atom standard set **21/21 PASS** — golden → 200 with the
  Python oracle's output carried verbatim (explicit diff: the only
  delta vs the fixture is the gateway's `stamp` envelope field; no
  missing or differing keys; verdicts FINANCE_TOOL_DESIGN_SOUND /
  CONFIDENCE_SCOREBOARD_SOUND / FRAMEWORK_ADOPTION_SOUND /
  FRONTEND_SOUND / FULL_STACK_BUILD_SOUND / GRPC_SERVICE_SOUND /
  HOME_SHORTLIST_COMPARISON_READY); first-field corruption (`tool`
  / `subject` / `project` ×4 / `search_name` set to a number) →
  422 `invalid_input` naming the field; keyless → 401.
- Doc-link probes **6/6 PASS** — /api.json: 93 entries,
  `documentation` on exactly **79** atoms (85 emitted docs − 6
  disabled documented atoms correctly unlinked; Batch 14's seven
  and electrical-machines carry none); catalogue carries the
  Documentation link and excludes the disabled seven;
  /docs/release-readiness-verdict 200 with the doc's title;
  /docs/<undocumented live> 404; /docs/<disabled> 404.
- F-G3 header probes **3/3 PASS** — full header set on GET /
  (HTML CSP), GET /docs/<atom> (HTML CSP), GET /health (non-HTML
  CSP).
- Takedown regression **5/5 PASS** — catalogue excludes the seven;
  /api.json shows exactly 7 `disabled`; /health serves 86 with
  `disabled_atoms` exactly the seven; MCP `tools/list` for a
  disabled atom returns an empty tools array; MCP `tools/call`
  for a disabled atom returns a literal **HTTP 503**
  `atom_disabled`. Live MCP sanity: tools/list for a live atom
  returns its tool; tools/call for a Batch 14 atom returns its
  verdict.
- Two probe-side corrections, recorded: the first golden
  comparison demanded byte-equality with the fixture and flagged
  the `stamp` envelope (probe defect; resolved by the explicit
  diff); the first header probe used HEAD, which the gateway
  routes to 404 (re-probed with GET).

**Listings:** Batch 14's seven `org.aimlds/<atom>` records flipped
to "live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)" in the repo server.json copies, published via
mcp-publisher (fresh DNS login), and read back from the registry
API — all seven `active`, `isLatest`, description + remote
identical to the repo copies. **Listing completion caveat:** the
seven listings count COMPLETE only when their WS1 documentation
pass lands — see the process counts below.

**Process-binding counts for Batch 14 (per-atom lines, owner
ruling 2026-11-15 20:40 MST):**
- N-10 documentation: PROVEN 0 / OPEN 0 / WAIVED 0 / **NOT RUN 7**
  (no DOCUMENTATION.md yet for the seven; the WS1 extension after
  Wave 9 is the named next step. Fleet documentation line after
  this deploy: 85 PROVEN / 1 WAIVED (electrical-machines, U-13) /
  7 NOT RUN (Batch 14) / Batch 15's seven not yet in scope.)
- R-18 per-atom gate verdict: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (the WS2 extension follows Wave 9.)
- Guardian Mesh disposition: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (GM Spec Inputs GMSI-157…174 stand; GMSI-175
  filed by this deploy's gate run.)

**Program state:** 93 live (86 serving + 7 kill-switch-disabled,
down on every surface including docs), Batch 15 authoring in
flight. All batches RC, soak to 2026-11-22. All contract rates
remain `null`.

### Batch 15 — AUTHORED + STAGED (2026-11-15, same dispatch as the Batch 14 deploy)

The next seven unwalked Tier B G1 atoms in census queue order
(skip G2 + the parked six). **Seven taken, zero parked** — every
bound skill reduced cleanly to deterministic checks over a declared
record; no replacement atoms needed. **No regulatory flags** on any
of the seven (generic engineering/marketing-design records; the
register's standing "generic engineering advice" doubt on
knowledge-graph-design is carried in its SERVICE.md). Each atom:
Python oracle + tests + oracle-generated golden fixtures first, TS
port, differential parity byte-compared on full JSON (stamp and
error messages included), listing regenerated in the staged shape
("built-locally — NOT deployed; do not submit"). Central
integration by the coordinator: atoms-registry.ts (import +
manifestAtom + HANDLERS entry per atom), atoms.registry.json rows
(100 atoms, additions-only), sync-rates regen (100 atoms, all rates
null). Python suites re-run centrally by the coordinator:
**254/254**. Full gateway suite on the staged tree: **4351/4351**
(4030 deployed-tree + 321 new). STAGED ONLY — the deploy waits for
Wave 9 (Batch 14's verification wave) per cadence, and on Batch
14's WS1 documentation landing PROVEN: the doc guard rotated at
this staging (Batch 14's seven out of GUARD_PENDING, Batch 15's
seven in) and now REFUSES to emit, naming Batch 14's seven — the
next deploy is blocked until their documentation is PROVEN, by
design (guard proven live at this staging; src/docs.generated.ts
unchanged, still the deployed 85-doc emit).

| Atom | Checks / sections | Verdicts | Py | TS | Differential |
|---|---|---|---|---|---|
| honest-seo-audit-intent-map | 43 / 5 | HONEST_SEO_MAP_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 35 | 43 | 209 cases, 0 mismatches |
| javascript-review-and-build | 27 / 5 | JAVASCRIPT_REVIEW_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 40 | 51 | 170 cases, 0 mismatches |
| json-schema-design-check | 32 / 5 | JSON_SCHEMA_DESIGN_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 37 | 46 | 220 cases, 0 mismatches |
| knowledge-graph-design | 31 / 6 | KNOWLEDGE_GRAPH_DESIGN_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 37 | 47 | 332 cases, 0 mismatches |
| local-first-sync-design | 47 / 5 | LOCAL_FIRST_SYNC_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 38 | 49 | 224 cases, 0 mismatches |
| local-llm-serving-setup | 32 / 5 | LOCAL_LLM_SERVING_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 32 | 41 | 165 cases, 0 mismatches |
| local-voice-stack-engineering-pack | 30 / 5 | LOCAL_VOICE_STACK_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 35 | 44 | 223 cases, 0 mismatches |

Differentials total **1,543 cases, 0 mismatches**. Declined
thresholds are named in each SERVICE.md (no invented numbers
anywhere: e.g. no Core Web Vitals cutoffs, no bundle-size limit, no
tokens/s or TTFT bars, no latency/WER bars, no coverage percentage
below completeness). Distinct ground stated per atom against its
nearest siblings (zero shared checks in each case).

**Batch 15 per-atom process counts (staged):** N-10 documentation
NOT RUN ×7, R-18 gate NOT RUN ×7, GM NOT RUN ×7 — their WS1/WS2
passes follow their own verification wave, per the binding.

**Program state:** 162 = **93 deployed** (86 serving + 7 disabled
by owner ruling) + **7 staged (Batch 15)** + **6 parked** (owner's
set ruling outstanding) + **8 G2 passed over** + **48 Tier B G1
unwalked**. Next in queue: localization-readiness-review,
long-form-authoring-pipeline, mcp-server-design-and-review. All
contract rates remain `null`.

## Batch 15 — DEPLOYED (2026-11-15)

**Integration onto the live base (Batch 14 deploy tree `9cdf3b0`):**
the staged Batch 15 work (`8ee0189`) already sat on the Batch 14
deploy commit; the integration added the WS1 Batch 14 documentation
commits plus two integration commits — `ccfbd49` (docs emit
regenerated: **92 docs**, Batch 14's seven in, Batch 15's seven
GUARD_PENDING, electrical-machines waived) and `e1bf308` (test-only:
the doc-link suite's undocumented-live fixture rotated from
Batch 14 to Batch 15 — the first suite run on the deploy tree
failed exactly the 3 doc-link tests on the stale premise; gateway
behaviour unchanged). The deploy tree was an isolated archive of
`e1bf308` (bundle census at upload: exactly the 100 atom modules +
docs.js + docs.generated.js; no Batch 16 leakage — authoring had
not begun). Frozen files (billing/store/callpath/validate)
verified untouched against the Batch 14 deploy tree by diff.

**Gate:** PASS WITH FINDINGS — pack
`~/workspace/release-gate-runs/atoms-gateway-batch15-2026-11-15/`
(scanner PASS WITH FINDINGS, zero must-failures / secrets / vulns;
carried F-G2 Low; no new GM Spec Inputs). Suite on the exact
deploy tree: **4351/4351 green**.

**Deploy (house path: declare → deploy2 → certify → close):**
site-integrity declaration `2cb04876-5f51-409e-bf8a-53263442d796`
opened and closed after certify + probes; bindings read from LIVE
worker settings and passed through unchanged (DB → atoms-state D1,
PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE stays
`test`**, three pack price IDs intact), all rates still `null`;
deploy2 upload — **deployment `fe07be725c5a4817ad7b7e341310a97b`,
certified sha256
`8db5f04dd081dc9de3ec97aa91a2c34b516384da90cba1bafe6ebdf103d5aba8`**
(sign request `3db65b34-cae5-4135-a53f-4e4c9290eb5b`). D1 seeding
for Batch 15: 7 `atom_enabled` rows + 7 internal-key scopes
inserted, one statement per call; read back **100 registered /
93 serving / 7 disabled / 100 internal scopes**. Seeding
correction, recorded honestly: the first scope pass used
hyphenated service names; key scopes are atom NAMESPACE
identifiers (underscore form) — the first probe run caught it
(403 `scope_required` ×6; the seventh atom had been granted its
namespace scope by the keys endpoint itself during key
derivation). Rows deleted and re-inserted in namespace form;
read back 100 namespace scopes, 0 hyphen-form.

**Live probes (internal key via D1-seeded session; session
deleted and read back 0 after; probe credentials never
persisted): 54/54 PASS** on the final run —
- Per-atom standard set **21/21 PASS** — golden → 200 with the
  Python oracle's output verbatim modulo the gateway `stamp`
  envelope (verdicts HONEST_SEO_MAP_SOUND /
  JAVASCRIPT_REVIEW_SOUND / JSON_SCHEMA_DESIGN_SOUND /
  KNOWLEDGE_GRAPH_DESIGN_SOUND / LOCAL_FIRST_SYNC_SOUND /
  LOCAL_LLM_SERVING_SOUND / LOCAL_VOICE_STACK_SOUND);
  first-field corruption (`site` / `subject` / `artifact` /
  `graph` / `app` / `setup` / `stack` type-flipped) → 422
  `invalid_input` naming the field; keyless → 401.
- Doc-surface probes **22/22 PASS** — Batch 14's seven NOW LIVE
  (/docs/<atom> 200 ×7, feed `documentation` field present,
  catalogue link present); Batch 15's seven correctly doc-less
  (/docs 404 ×7, no feed field, catalogue rows present without
  links); /docs/<disabled> 404; feed: 100 entries, exactly 7
  `disabled`, `documentation` on exactly the 86 live documented
  atoms; /health serves 93 with `disabled_atoms` exactly the
  seven; catalogue excludes the seven.
- F-G3 header probes **3/3 PASS** (GET /, GET /docs/<atom>, GET
  /health — full header set, CSP split by surface). The first
  run's two header failures were a probe-side HEAD defect (the
  one the Batch 14 record names); re-probed with GET.
- Takedown regression **PASS** — MCP `tools/list` for a disabled
  atom returns an empty tools array; MCP `tools/call` returns a
  literal **HTTP 503** `atom_disabled`; REST call likewise 503.

**Listings:** Batch 15's seven `org.aimlds/<atom>` records flipped
to "live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)" in the repo server.json copies, published via
mcp-publisher (fresh DNS login), and read back from the registry
API — all seven `active`, `isLatest`, description + remote
identical to the repo copies. **Listing completion caveat:** the
seven listings count COMPLETE only when their WS1 documentation
pass lands — see the process counts below.

**Process-binding counts for Batch 15 (per-atom lines, owner
ruling 2026-11-15 20:40 MST):**
- N-10 documentation: PROVEN 0 / OPEN 0 / WAIVED 0 / **NOT RUN 7**
  (no DOCUMENTATION.md yet for the seven; the WS1 extension after
  Wave 10 is the named next step. Fleet documentation line after
  this deploy: 92 PROVEN / 1 WAIVED (electrical-machines, U-13) /
  7 NOT RUN (Batch 15) / Batch 16's seven not yet in scope.)
- R-18 per-atom gate verdict: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (the WS2 extension follows Wave 10.)
- Guardian Mesh disposition: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (GM Spec Inputs GMSI-157…176 stand.)

**Program state:** 100 live (93 serving + 7 kill-switch-disabled,
down on every surface including docs), Batch 16 authoring in
flight. All batches RC, soak to 2026-11-22. All contract rates
remain `null`.

### Batch 16 — AUTHORED + STAGED (2026-11-15, same dispatch as the Batch 15 deploy)

The next seven unwalked Tier B G1 atoms in census queue order
(skip G2 + the parked six). **Seven taken, zero parked** — every
bound skill reduced cleanly to deterministic checks over a declared
record; no replacement atoms needed. Each atom: Python oracle +
tests + oracle-generated golden fixtures first, TS port,
differential parity byte-compared on full JSON (stamp included),
listing regenerated in the staged shape ("built-locally — NOT
deployed; do not submit"). Central integration by the coordinator:
atoms-registry.ts (import + manifestAtom + HANDLERS entry per
atom), atoms.registry.json rows (107 atoms, additions-only),
sync-rates regen (107 atoms, all rates null). Python suites re-run
centrally by the coordinator: **255/255**. Full gateway suite on
the staged tree: **4672/4672** (4351 deployed-tree + 321 new).
STAGED ONLY — the deploy waits for Wave 10 (Batch 15's
verification wave) per cadence, and on Batch 15's WS1
documentation landing PROVEN: the doc guard rotated at this
staging (Batch 15's seven out of GUARD_PENDING, Batch 16's seven
in) and now REFUSES to emit, naming Batch 15's seven — the next
deploy is blocked until their documentation is PROVEN, by design
(guard proven live at this staging; src/docs.generated.ts
unchanged, still the deployed 92-doc emit).

| Atom | Checks / sections | Verdicts | Py | TS | Differential |
|---|---|---|---|---|---|
| localization-readiness-review | 37 / 5 | LOCALIZATION_READINESS_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 33 | 49 | 200 cases, 0 mismatches |
| long-form-authoring-pipeline | 36 / 6 | AUTHORING_PIPELINE_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 37 | 46 | 220 cases, 0 mismatches |
| mcp-server-design-and-review | 41 / 5 | MCP_SERVER_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 35 | 43 | 220 cases, 0 mismatches |
| meaning-first-translation-with-tone-note | 37 / 5 | MEANING_FIRST_TRANSLATION_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 40 | 48 | 220 cases, 0 mismatches |
| meeting-decisions-and-actions-extract | 35 / 6 | MEETING_EXTRACTION_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 39 | 48 | 220 cases, 0 mismatches |
| ml-project-framing-review | 43 / 5 | ML_FRAMING_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 38 | 46 | 200 cases, 0 mismatches |
| multiplatform-core-design | 37 / 5 | MULTIPLATFORM_CORE_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 33 | 41 | 200 cases, 0 mismatches |

Differentials total **1,480 cases, 0 mismatches**. Declined
thresholds are named in each SERVICE.md (no invented numbers
anywhere: no translation-quality score, no word-count or
review-pass-count bar beyond the skill's own four pass types, no
tool-count cap — the skill's "40 tools" is a review question, not
a cap — no BLEU/COMET figure, no coverage percentage below
completeness). Distinct ground stated per atom against its
nearest siblings (zero shared checks in each case; ml-project-
framing-review's framing-only ground separated from
applied-ml-validation's executed-record ground with zero shared
checks and zero shared field names). Regulatory notes: no atom
in this batch produces regulated professional advice; two
adjacencies carried on record in their SERVICE.md files —
multiplatform-core-design will likely trip a keyword screen for
"engineering" titles (a per-unit owner ruling before publication
is prudent under U-13, as with the earlier software-engineering
titles), and meaning-first-translation-with-tone-note checks only
that the caller DECLARED the certified-translation flag was
raised for sensitive documents — it certifies nothing and its
verdict must never be read as a certified translation.

**Batch 16 per-atom process counts (staged):** N-10 documentation
NOT RUN ×7, R-18 gate NOT RUN ×7, GM NOT RUN ×7 — their WS1/WS2
passes follow their own verification wave, per the binding.

**Program state:** 162 = **100 deployed** (93 serving + 7 disabled
by owner ruling) + **7 staged (Batch 16)** + **6 parked** (owner's
set ruling outstanding) + **8 G2 passed over** + **41 Tier B G1
unwalked**. Next in queue: native-mobile-build-plan,
negotiation-preparation-pack, observability-and-runbook-design.
All contract rates remain `null`.

## Batch 16 — DEPLOYED (2026-11-15)

**Integration onto the live base (Batch 15 deploy tree `e1bf308`):**
the staged Batch 16 work (`f31a252`) already sat on the Batch 15
deploy commit; the integration added the WS1 Batch 15 documentation
commits, the Director's U-13 ruling record for
multiplatform-core-design (`d63bfb4`), the WS2 Batch 15 verdicts,
plus two integration commits — `3d96666` (docs emit regenerated:
**99 docs**, Batch 15's seven in, Batch 16's seven GUARD_PENDING,
electrical-machines waived) and `7d2180f` (test-only: the doc-link
suite's undocumented-live fixture rotated from Batch 15 to
Batch 16's localization-readiness-review — Batch 15's seven are
documented in the 99-doc emit, so the fixture premise rotated with
the guard; gateway behaviour unchanged). The deploy tree was an
isolated archive of `7d2180f` (bundle census at upload: exactly
the 107 atom modules + validate.js + docs.js + docs.generated.js;
no Batch 17 leakage — authoring was in flight in the working tree
and is excluded by the archive construction). Frozen files
(billing/store/callpath/validate) verified untouched against the
Batch 15 deploy tree by diff.

**Gate:** PASS WITH FINDINGS — pack
`~/workspace/release-gate-runs/atoms-gateway-batch16-2026-11-15/`
(scanner PASS WITH FINDINGS, zero must-failures / secrets / vulns;
carried F-G2 Low; no new GM Spec Inputs). Suite on the exact
deploy tree: **4672/4672 green**. Batch 16 Python oracles
centrally re-verified on the deploy tree's sources: **255/255**.

**Deploy (house path: declare → deploy2 → certify → close):**
site-integrity declaration `fdbb7df6-1680-49e0-84b3-3b51290ffe0c`
opened and closed after certify + probes; bindings read from LIVE
worker settings and passed through unchanged (DB → atoms-state D1,
PUBLIC_BASE_URL=https://atoms.pipavia.com, **STRIPE_MODE stays
`test`**, three pack price IDs intact), all rates still `null`;
deploy2 upload — **deployment `a15298eb9b7f40bf80d306cea4a33f80`,
certified sha256
`28ffaee58bd012cb6cbd4795643373293306f2629006664a5e61ad85d0da4197`**
(sign request `b45a91f5-4ba2-48e0-ada4-0eb872a7a67d`). D1 seeding
for Batch 16: 7 `atom_enabled` rows + 7 internal-key scopes
inserted, one statement per call, scopes in namespace
(underscore) form per the Batch 15 lesson; read back **107
registered / 100 serving / 7 disabled / 107 internal scopes /
0 hyphen-form scopes** — no correction needed this time.

**Live probes (internal key via D1-seeded session; session
deleted and read back via post-delete 401; probe credentials
never persisted): 49/49 PASS** —
- Per-atom standard set **21/21 PASS** — golden → 200 with the
  Python oracle's output verbatim modulo the gateway `stamp`
  envelope (verdicts LOCALIZATION_READINESS_SOUND /
  AUTHORING_PIPELINE_SOUND / MCP_SERVER_SOUND /
  MEANING_FIRST_TRANSLATION_SOUND / MEETING_EXTRACTION_SOUND /
  ML_FRAMING_SOUND / MULTIPLATFORM_CORE_SOUND); first-field
  corruption (`product` / `work` / `server` / `document` /
  `meeting` / `project` ×2 type-flipped) → 422 `invalid_input`
  naming the field; keyless → 401.
- Doc-surface probes **15/15 PASS** — Batch 15's seven NOW LIVE
  (/docs/<atom> 200 ×7, feed `documentation` field present,
  catalogue link present); Batch 16's seven correctly doc-less
  (/docs 404 ×7, no feed field, catalogue rows present without
  links); /docs/<disabled> 404; feed: 107 entries, exactly 7
  `disabled`, `documentation` on exactly the 93 live documented
  atoms; /health serves 100 with `disabled_atoms` exactly the
  seven; catalogue excludes the seven. The feed was parsed as an
  object with an `atoms` array (its current shape) — the WS2-B15
  probe-artifact error was not repeated.
- F-G3 header probes **3/3 PASS** (GET /, GET /docs/<atom>, GET
  /health — full header set, CSP split by surface).
- Takedown regression **PASS** — MCP `tools/list` for a disabled
  atom returns an empty tools array; MCP `tools/call` returns a
  literal **HTTP 503** `atom_disabled`; REST call likewise 503.
  MCP sanity: tools/list for a live Batch 16 atom returns its
  tool; tools/call returns ML_FRAMING_SOUND.

**Listings:** Batch 16's seven `org.aimlds/<atom>` records flipped
to "live — release candidate since 2026-11-15 (one-week soak to
2026-11-22)" in the repo server.json copies, published via
mcp-publisher (fresh DNS login), and read back from the registry
API — all seven `active`, `isLatest`, description + remote
identical to the repo copies. **Listing completion caveat:** the
seven listings count COMPLETE only when their WS1 documentation
pass lands — see the process counts below.

**Process-binding counts for Batch 16 (per-atom lines, owner
ruling 2026-11-15 20:40 MST):**
- N-10 documentation: PROVEN 0 / OPEN 0 / WAIVED 0 / **NOT RUN 7**
  (no DOCUMENTATION.md yet for the seven; the WS1 extension after
  Wave 11 is the named next step. Fleet documentation line after
  this deploy: 99 PROVEN / 1 WAIVED (electrical-machines, U-13) /
  7 NOT RUN (Batch 16) / Batch 17's seven not yet in scope.)
- R-18 per-atom gate verdict: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (the WS2 extension follows Wave 11.)
- Guardian Mesh disposition: PROVEN 0 / OPEN 0 / WAIVED 0 /
  **NOT RUN 7** (GM Spec Inputs GMSI-157…177 stand.)

**Program state:** 107 live (100 serving + 7 kill-switch-disabled,
down on every surface including docs), Batch 17 authoring in
flight. All batches RC, soak to 2026-11-22. All contract rates
remain `null`.

## Batch 17 — AUTHORED + STAGED (2026-11-16, same dispatch as the Batch 16 deploy)

The next seven unwalked Tier B G1 atoms in census queue order
after Batch 16 (pass-overs in the walk: network-exposure-audit —
Tier A, already deployed; one-line-diagram-to-data — Tier A G2).
**Seven taken, zero parked** — every bound skill reduced cleanly
to deterministic checks over a declared record; no replacement
atoms needed. Each atom: Python oracle + tests + oracle-generated
golden fixtures first, TS port, differential parity byte-compared
on full JSON (stamp included), listing regenerated in the staged
shape ("built-locally — NOT deployed; do not submit"). Central
integration by the coordinator: atoms-registry.ts (import +
manifestAtom + HANDLERS entry per atom), atoms.registry.json rows
(114 atoms, additions-only), sync-rates regen (114 atoms, all
rates null). Python suites re-run centrally by the coordinator:
**258/258**. Full gateway suite on the staged tree: **4999/4999**
(4672 deployed-tree + 327 new). STAGED ONLY — the deploy waits
for Wave 11 (Batch 16's verification wave) per cadence, and on
Batch 16's WS1 documentation landing PROVEN: the doc guard
rotated at this staging (Batch 16's seven out of GUARD_PENDING,
Batch 17's seven in) and now REFUSES to emit, naming Batch 16's
seven — the next deploy is blocked until their documentation is
PROVEN, by design (guard proven live at this staging;
src/docs.generated.ts unchanged, still the deployed 99-doc emit).

| Atom | Checks / sections | Verdicts | Py | TS | Differential |
|---|---|---|---|---|---|
| native-mobile-build-plan | 46 / 6 | NATIVE_MOBILE_BUILD_PLAN_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 37 | 46 | 243 cases, 0 mismatches |
| negotiation-preparation-pack | 44 / 5 | NEGOTIATION_PREPARATION_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 41 | 50 | 240 cases, 0 mismatches |
| observability-and-runbook-design | 43 / 5 | OBSERVABILITY_DESIGN_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 35 | 44 | 326 cases, 0 mismatches |
| offline-first-pwa-engineering-pack | 41 / 7 | OFFLINE_FIRST_PWA_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 37 | 48 | 260 cases, 0 mismatches |
| personal-financial-snapshot | 34 / 5 | SNAPSHOT_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 36 | 45 | 402 cases, 0 mismatches |
| personal-web-presence-audit | 46 / 5 | PERSONAL_PRESENCE_CONSISTENT / _INCONSISTENT / INSUFFICIENT_EVIDENCE | 35 | 43 | 372 cases, 0 mismatches |
| poc-design-kill-criteria-verdict | 22 / 5 | POC_DESIGN_SOUND / _NOT_SOUND / INSUFFICIENT_EVIDENCE | 43 | 51 | 336 cases, 0 mismatches (coordinator-verified) |

Differentials total **2,179 cases, 0 mismatches**. The
poc-design-kill-criteria-verdict worker's completion report was
lost in delivery; its artifacts were re-verified centrally by
the coordinator instead of on the worker's word — Python 43/43,
fixtures 8/8 byte-identical on both implementations, and a
coordinator-run differential of 336 cases (56 single
flips/drops + 280 pairwise flips and row mutations), 0
mismatches on evaluate output and stamp. Declined thresholds
are named in each SERVICE.md (no invented numbers anywhere: no
measured touch-target or battery figure beyond the skill's own
declared-adoption check, no ZOPA width or BATNA strength score,
no alert-count cap or restore interval in days, no savings-rate
or liquidity bar, no maximum timebox length). Distinct ground
stated per atom against its nearest siblings (zero shared checks
in each case, verified mechanically — offline-first-pwa vs
local-first-sync-design, personal-web-presence-audit vs
honest-seo-audit-intent-map, poc-design vs buyer-test-card,
negotiation-preparation vs difficult-conversation-coaching).
Regulatory notes: six of the seven screen No under U-13.
**personal-financial-snapshot is FLAGGED for the owner's
per-unit ruling queue** — finance-adjacent (a declared personal
snapshot record: net worth, allocation, cash flow, fees); the
atom audits the record for completeness and arithmetic
consistency and gives no advice, recommendation or projection
(the bound skill's advice-shaped steps are excluded from
production and covered only as red lines, stated in SERVICE.md).
The flag does not block authoring; the atom's deploy disposition
follows the owner's ruling.

**Batch 17 per-atom process counts (staged):** N-10 documentation
NOT RUN ×7, R-18 gate NOT RUN ×7, GM NOT RUN ×7 — their WS1/WS2
passes follow their own verification wave, per the binding.

**Program state:** 162 = **107 deployed** (100 serving + 7
disabled by owner ruling) + **7 staged (Batch 17)** + **6 parked**
(owner's set ruling outstanding) + **8 G2 passed over** + **34
Tier B G1 unwalked**. Next in queue:
prd-with-testable-acceptance-criteria. All contract rates remain
`null`.

---

## Batch 17 — SIX ATOMS DEPLOYED 2026-11-16 (personal-financial-snapshot HELD)

The six cleared atoms of Batch 17 deployed on the house path.
**personal-financial-snapshot did NOT deploy**: its U-13 per-unit
ruling is still open with the Director (flagged above; parent
recommendation on record: hold staged). It stays fully staged on
master — no handler in the deploy tree, no registry row, no D1
seeding, no listing publication — and its absence was proven by
negative probes against the live gateway (below).

Deploy base (the takedown lesson, applied): the integration was
built on the LIVE Batch 16 deploy tree — master HEAD `ca6b724`
(the Batch 16 deploy commits `3d96666`/`7d2180f` + the WS1 Batch 15
verdicts + the WS1 Batch 16 documentation commits `a4e3ade` +
`9d43910` + the WS2 Batch 16 verdicts `ca6b724`) — in the isolated
worktree `~/workspace/atom-services-b17wt`, branch
`deploy/batch17`. The integration took Batch 17's SIX atoms only
from the staged set `20f3762`: integration commit `d81515c` (the
six atoms' handlers/registry/generated rates + the 106-doc emit +
the doc guard rotated to the six; personal-financial-snapshot's
handler, test, fixtures, registry-ts entries and registry-json row
removed) and fixture commit `d6604a7` (the doc-link test's
undocumented-live fixture rotated to native-mobile-build-plan;
test-only).

Verification on the exact deploy tree: gateway suite **4954/4954
green** (4999 staged − 45 personal-financial-snapshot TS tests,
exactly as predicted); the six atoms' Python oracles **228/228**
re-run on the deploy tree (native-mobile 37, negotiation 41,
observability 35, offline-first-pwa 37, personal-web-presence 35,
poc-design 43); differentials 2,179 cases, 0 mismatches (from
staging, the six's share); dist census **113 atom modules, no
personal-financial-snapshot.js**; frozen files (billing.ts,
store.ts, callpath.ts, atoms/validate.ts) verified byte-identical
against the Batch 16 deploy tree. All rates `null`.

**Gate: PASS WITH FINDINGS → RELEASE CANDIDATE** (pack
`~/workspace/release-gate-runs/atoms-gateway-batch17-2026-11-16/`
— scanner PASS WITH FINDINGS on the isolated archive of the
deploy tree, zero must-failures/secrets/vulns; the only FAIL line
is the carried F-G2 Low; GM/Kali/TLS legs NOT RUN as before).

**Deploy:** site-integrity declaration `048b968a-7f72-41e3-9716-
68dbebe3618f` → deploy2.py upload (bindings read from LIVE
settings, passed through unchanged; STRIPE_MODE stays `test`) →
**deployment `c64bdc48fce84cd4817fe3a293be6ae5`, certified sha256
`40eb72cb42c68e5dd601e44e6812e5a7529ab19edd0005b7a31fde3caab6c38e`**
(sign request `8558b8db-e415-4a09-932c-6bd93aeffaf4`) → declaration
closed after probes. The uploaded module list was read at deploy
time: the six new atom modules present, no
personal-financial-snapshot module, no Batch 18 leakage.

**D1:** seeded ×6 (`atom_enabled:<name>` = 1 + internal scopes in
namespace/underscore form) and read back: **113 registered / 106
serving / 7 disabled / 113 internal scopes / 0 hyphen-form
scopes**. The internal key holds exactly 113 scopes — no
personal_financial_snapshot scope.

**Live probes: 57/57 PASS** (pack probes.json): per-atom 18/18
(golden 200 = Python oracle output verbatim + the gateway `stamp`
envelope; first-field corruption → 422 `invalid_input` naming the
field; keyless → 401); **personal-financial-snapshot negative
probes: REST → 404, MCP → 404, absent from /api.json (113 entries)
and from the catalogue**; doc-surface 21/21 — Batch 16's seven
documentation surfaces are NOW LIVE (/docs 200 + feed
`documentation` field + catalogue link ×7) and the six are
correctly doc-less (404 + null, GUARD_PENDING until their WS1 pass
after Wave 12); feed `documentation` on exactly 100 live atoms
(106 emitted − 6 documented-but-disabled); /health serving 106 +
`disabled_atoms` exactly the takedown seven; F-G3 headers 3/3;
takedown regression 3/3 (MCP tools/list empty + literal 503
`atom_disabled`, REST 503); MCP sanity 2/2 (tools/list + tools/call
verdict on native-mobile-build-plan). Probe-seeded session deleted
and read back 0; post-delete key access 401; probe credentials
shredded.

**Listings:** the six `org.aimlds/<atom>` records published via
mcp-publisher (repo `_meta` status flipped to "live — release
candidate since 2026-11-16 (one-week soak to 2026-11-22)") and
read back from the registry API: active, isLatest,
version/description/remote/status-text identical to repo copies,
6/6.

**Batch 17 deployed-six per-atom process counts:** N-10
documentation NOT RUN ×6, R-18 gate NOT RUN ×6, GM NOT RUN ×6 —
their WS1/WS2 passes follow Wave 12 verification, per the
binding. personal-financial-snapshot: STAGED, awaiting the
Director's U-13 ruling (not a process line).

**Program state:** 162 = **113 deployed** (106 serving + 7
disabled by owner ruling) + **1 staged-held
(personal-financial-snapshot, U-13 ruling open)** + **6 parked**
(owner's set ruling outstanding) + **8 G2 passed over** + **34
Tier B G1 unwalked** (Batch 18 authoring in flight). All contract
rates remain `null`. **RC since 2026-11-16; soak to 2026-11-22.**

---

## Batch 18 — AUTHORED + STAGED 2026-11-16 (seven Tier B atoms)

The next seven unwalked Tier B G1 atoms in census order after
Batch 17's seven, authored under the house discipline (bound
skill → Python oracle + tests + golden fixtures FIRST → TS port
proven by differential parity → gateway onboarding at NULL rate →
SERVICE.md with declined thresholds named and distinct ground
stated → listing regenerated in the staged shape). Passed over in
the walk: prediction-model-leakage-calibration-audit and
predictive-maintenance-failure-risk-assessment (both Tier A,
already deployed). Zero parked in this batch — all seven reduced
to deterministic checks over caller-declared records.

Central integration on master: registry entries
(atoms-registry.ts import + manifestAtom + HANDLERS ×7),
atoms.registry.json rows (114 → 121), sync-rates regen (121
atoms, all rates `null`). Python suites re-run centrally by the
coordinator: **283/283**. Full gateway suite on the staged tree:
**5348/5348** (4999 staged base + 349 new). Differentials total
**3,339 cases, 0 mismatches**. The python / python-expert pair
was verified mechanically at integration: **zero shared check
names** across the pair (39 vs 48 checks, compared on live oracle
outputs; the one shared string between the two sources is a
manifest field name — `red_lines.bare_except_present` — not a
check name). STAGED ONLY — the deploy waits for Wave 12 (Batch
17's verification wave) and Batch 17's WS1 documentation landing
PROVEN: the doc guard rotated at this staging (Batch 17's six
deployed atoms out of GUARD_PENDING and into scope, Batch 18's
seven in; personal-financial-snapshot moved to GUARD_WAIVED with
its hold recorded — held staged under the open U-13 ruling,
documentation a precondition of its publish ruling) and now
REFUSES to emit, naming exactly Batch 17's six deployed atoms
(exit 1; src/docs.generated.ts unchanged, still the 99-doc emit
on master — the 106-doc emit lives on the Batch 17 deploy
branch).

| Atom | Checks / sections | Verdicts | Py | TS | Differential |
|---|---|---|---|---|---|
| prd-with-testable-acceptance-criteria | 38 / 6 | PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 43 | 52 | 421 cases, 0 mismatches |
| pricing-unit-economics-pack | 37 / 6 | PRICING_UNIT_ECONOMICS_PACK_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 40 | 49 | 364 cases, 0 mismatches |
| process-waste-review-coaching | 40 / 6 | PROCESS_WASTE_REVIEW_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 40 | 49 | 449 cases, 0 mismatches |
| product-metrics-event-taxonomy-pack | 48 / 6 | PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 48 | 57 | 656 cases, 0 mismatches |
| production-python-engineering-pack | 39 / 6 | PRODUCTION_PYTHON_ENGINEERING_PACK_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 37 | 46 | 739 cases, 0 mismatches |
| production-python-engineering-pack-expert | 48 / 7 | PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 41 | 51 | 465 cases, 0 mismatches |
| production-rust-engineering-pack | 37 / 7 | PRODUCTION_RUST_ENGINEERING_PACK_READY / _NOT_READY / INSUFFICIENT_EVIDENCE | 34 | 45 | 245 cases, 0 mismatches |

Declined thresholds are named in each SERVICE.md (no invented
numbers anywhere: no sentence limit beyond the PRD skill's own
five, no margin/discount/churn bar and no ARPU/LTV/CAC/payback
computation, no wait-share or Pareto percentage, no taxonomy
count or coverage bar, no coverage percentage or tool version,
no unsafe-block budget or MSRV pin). Distinct ground stated per
atom against its nearest siblings (zero shared check names in
each case, verified mechanically — including fleet-wide zero
overlap for process-waste-review-coaching, product-metrics-
event-taxonomy-pack and production-python-engineering-pack after
renames at authoring time).

Regulatory notes (U-13): five of the seven screen No outright.
Two watch items are reported to the owner's per-unit ruling
queue as flags-with-screens (flagging never blocks authoring or
staging; both atoms' deploy disposition follows the ruling):
**pricing-unit-economics-pack** — finance-adjacent keyword class;
the authoring screen is NO with five named controls (declared-
record audit only; no recommendation, projection or forecast; no
threshold grading a business good or bad; the skill's advice-
shaped steps excluded from production and named as exclusions/
red lines in SERVICE.md, the personal-financial-snapshot
precedent; a business's own operating record — no personal
position, security, portfolio or credit decision). **process-
waste-review-coaching** — "coaching" keyword (the class of the
disabled difficult-conversation-coaching); the authoring screen
is NO with a named exclusion: the atom audits an operations
process record only (declared step/waste rows), coaches no
person and assesses no behaviour or mental state, and the bound
skill's person-directed section is excluded by design and named
as an excluded red line in SERVICE.md.

**Batch 18 per-atom process counts (staged):** N-10
documentation NOT RUN ×7, R-18 gate NOT RUN ×7, GM NOT RUN ×7 —
their WS1/WS2 passes follow their own verification wave, per the
binding.

**Program state:** 162 = **113 deployed** (106 serving + 7
disabled by owner ruling) + **1 staged-held
(personal-financial-snapshot, U-13 ruling open)** + **7 staged
(Batch 18)** + **6 parked** (owner's set ruling outstanding) +
**8 G2 passed over** + **27 Tier B G1 unwalked**. Next in queue:
production-rust-engineering-pack-expert. All contract rates
remain `null`.

---

## Batch 18 — SEVEN ATOMS DEPLOYED 2026-11-16

The seven staged atoms of Batch 18 deployed on the house path.
The two U-13 flags deployed CENSUS-STYLE with the batch, per the
parent's recommendation on record (Delta 52) — no stricter ruling
arrived: **pricing-unit-economics-pack** (finance-adjacent; screen
NO with five named controls in its SERVICE.md) and
**process-waste-review-coaching** ("coaching" keyword; screen NO
with the named exclusion in its SERVICE.md). Both remain
kill-switchable in one flip if the Director rules otherwise.
**personal-financial-snapshot did NOT deploy** — its U-13 per-unit
ruling is still open; it stays fully staged on master, excluded
from the deploy tree entirely, its absence proven live by
negative probes (below).

Deploy base (the takedown lesson, applied): the integration was
built on the LIVE Batch 17 deploy tree (branch `deploy/batch17`,
tip `d6604a7`) in the isolated worktree
`~/workspace/atom-services-b18wt`, branch `deploy/batch18`. The
integration took Batch 18's seven atoms only from the staging
commit `e7b4655`: integration commit `1b312e9` (the seven atoms'
handlers/tests/fixtures/SERVICE.md/listings + registry-ts and
registry-json additions applied from the staging commit's own
diff + rates regenerated by sync-rates at `null` + the 112-doc
emit + the doc guard rotated to the seven; personal-financial-
snapshot's fixtures, which a first wholesale fixtures checkout
re-added, were removed before commit and verified absent) and
fixture commit `3508ef6` (the doc-link test's undocumented-live
fixture rotated to prd-with-testable-acceptance-criteria;
test-only).

Verification on the exact deploy tree: gateway suite **5303/5303
green** (5348 staged − 45 personal-financial-snapshot TS tests,
exactly as predicted by the exclusion); the seven atoms' Python
oracles **283/283** re-run on the deploy tree; differentials
**3,339 cases, 0 mismatches** (from staging); dist census **120
atom modules** (registry↔dist set equality proven mechanically;
no personal-financial-snapshot.js, no Batch 19 leakage); frozen
files (billing.ts, store.ts, callpath.ts, atoms/validate.ts)
verified byte-identical against the Batch 17 deploy tree. All
rates `null`.

**Gate: PASS WITH FINDINGS → RELEASE CANDIDATE** (pack
`~/workspace/release-gate-runs/atoms-gateway-batch18-2026-11-16/`
— scanner PASS WITH FINDINGS on the isolated archive of the
deploy tree, zero must-failures/secrets/vulns; the only
must-relevant FAIL line is the carried F-G2 Low; one further
OPTIONAL scanner line (.gitignore/.env at the repo root) is the
standing repo-root-archive artifact — the gateway subtree's own
.gitignore names .env; GM/Kali/TLS legs NOT RUN as before).

**Deploy:** site-integrity declaration `7c9c272e-3bdd-4aa7-8d64-
beebc05ba256` → deploy2.py upload (bindings read from LIVE
settings, passed through unchanged; STRIPE_MODE stays `test`) →
**deployment `9595ea665b634289aad158b7fff277ac`, certified sha256
`5332c1289922a616e22b2d9f4d30394b996ca6b3ddceeb2980905dbe2b85598d`**
(sign request `58204c00-daaf-416b-93e8-9fcc1e1c513b`) →
declaration closed after probes. The uploaded module list was
read at deploy time: the seven new atom modules present, no
personal-financial-snapshot module, no Batch 19 leakage.

**D1:** seeded ×7 (`atom_enabled:<name>` = 1 + internal scopes in
namespace/underscore form) and read back: **120 registered / 113
serving / 7 disabled / 120 internal scopes / 0 hyphen-form
scopes**; personal-financial-snapshot holds 0 config rows and 0
internal scopes.

**Live probes: 58/58 PASS** (pack probes.json): per-atom 21/21
(golden 200 = Python oracle output verbatim + the gateway `stamp`
envelope; first-field corruption → 422 `invalid_input` naming the
field; keyless → 401); **personal-financial-snapshot negative
probes: REST → 404, MCP → 404, absent from /api.json (120
entries) and from the catalogue**; doc-surface 22/22 — Batch 17's
six documentation surfaces are NOW LIVE (/docs 200 + feed
`documentation` field + catalogue link ×6) and the seven are
correctly doc-less (404 + null, GUARD_PENDING until their WS1
pass after Wave 13); feed `documentation` on exactly 106 live
atoms (112 emitted − 6 documented-but-disabled); /health serving
113 + `disabled_atoms` exactly the takedown seven; F-G3 headers
3/3; takedown regression 3/3 (MCP tools/list empty + literal 503
`atom_disabled`, REST 503); MCP sanity 2/2 (tools/list +
tools/call verdict on prd-with-testable-acceptance-criteria).
Probe session + key + user deleted and read back 0 (the first
cleanup pass FK-failed on the probe user's balances row; cleanup
completed in FK-safe order — balances then users — and the
post-delete session access reads 401; probe credentials
shredded; the probe's zero-charge usage metering rows remain as
the append-only trail).

**Listings:** the seven `org.aimlds/<atom>` records published via
mcp-publisher (repo `_meta` status flipped to "live — release
candidate since 2026-11-16 (one-week soak to 2026-11-22)") and
read back from the registry API: active, isLatest,
version/description/remote/status-text identical to repo copies,
7/7. Two listing descriptions were shortened at publish time to
fit the registry's 100-char limit (product-metrics-event-
taxonomy-pack 105 → 91 chars; production-python-engineering-
pack-expert 108 → 83 chars) — the repo copies carry the shortened
text; the gateway catalogue descriptions are unchanged.

**Batch 18 per-atom process counts:** N-10 documentation NOT RUN
×7, R-18 gate NOT RUN ×7, GM NOT RUN ×7 — their WS1/WS2 passes
follow Wave 13 verification, per the binding. The two U-13 flags
stand deployed-under-screen-NO pending the Director's review.
personal-financial-snapshot: STAGED, awaiting the Director's
U-13 ruling (not a process line).

**Program state:** 162 = **120 deployed** (113 serving + 7
disabled by owner ruling) + **1 staged-held
(personal-financial-snapshot, U-13 ruling open)** + **7 staged
(Batch 19, authoring in flight in this same dispatch)** + **6
parked** (owner's set ruling outstanding) + **8 G2 passed over**
+ **20 Tier B G1 unwalked**. All contract rates remain `null`.
**RC since 2026-11-16; soak to 2026-11-22.**

## Batch 19 — AUTHORED + STAGED 2026-11-16 (seven Tier B atoms)

Seven Tier B G1 atoms authored under the house discipline (bound
skill → Python oracle + tests + golden fixtures FIRST → TS port
proven by differential parity → gateway onboarding at NULL rate →
SERVICE.md with declined thresholds named and distinct ground
stated → listing regenerated in the staged shape). Registry rows
121 → 128. All seven reduced cleanly to deterministic checks;
nothing parked. Central integration by the coordinator; the full
staged gateway suite on master is **5694/5694 green** (5348 +
346 new TS tests); the seven Python suites re-run centrally
**272/272**. Combined differential parity **4,248 cases, 0
mismatches**.

| Atom | Bound skill | Checks | Py | TS | Differential |
|---|---|---|---|---|---|
| production-rust-engineering-pack-expert | rust-expert | 37 / 7 sections | 34 | 45 | 611, 0 mismatches |
| quant-math-derivation-sanity-check | quant-and-applied-math | 30 / 6 sections | 38 | 47 | 402, 0 mismatches |
| release-pack-changelog-seal-rollback | release-management | 41 / 7 sections | 47 | 57 | 702, 0 mismatches |
| semantic-html-review | html-craft | 45 / 9 sections | 39 | 52 | 702, 0 mismatches |
| service-isolation-hardening-review | non-docker-isolation | 39 / 7 sections | 36 | 47 | 567, 0 mismatches |
| single-living-trip-itinerary | trip-planning | 45 / 7 sections | 40 | 50 | 622, 0 mismatches |
| smart-grid-der-design-pack | smart-grid-engineering | 50 / 7 sections | 38 | 48 | 642, 0 mismatches |

287 checks total; zero shared check names with any other atom,
verified mechanically per atom against the full fleet register
(including zero overlap between the two Rust packs' 37-check
registers).

**U-13 screens (Batch 19):** No outright ×3 —
release-pack-changelog-seal-rollback, semantic-html-review,
single-living-trip-itinerary. Screen-NO flag-with-controls
(census class) ×4 — production-rust-engineering-pack-expert
(declared-record audit; advice-shaped skill steps excluded as red
lines), quant-math-derivation-sanity-check (finance-adjacent;
the skill's quant-application steps excluded; no output addressed
to any security/portfolio/credit/investment decision),
service-isolation-hardening-review (declared-record audit; no
recommendation/remediation; not a certification or pentest),
smart-grid-der-design-pack (engineering class; declared-record
audit; design/advice steps excluded as red lines; no imported
engineering limits; exclusion language carried — "This atom
audits a declared record; it is not engineering advice and not a
design service"). smart-grid-der-design-pack's SERVICE.md
additionally records that its deploy disposition is the owner's
explicit per-unit U-13 ruling — the strictest reading is carried
in this log so the ruling queue covers it either way.
Genuinely-open (pfs class) ×0.

**Queue walk / passed over:** protection-coordination-explainer
(G2, no bound skill), provenance-stamper (G2, no bound skill),
pump-conveyor-motor-suitability-check (Tier A, already deployed),
rag-retrieval-evaluation-tuning (Tier A, deployed),
reconciled-portfolio-performance-report (Tier A,
deployed/disabled), relay-fault-simulation-walkthrough (parked),
release-readiness-verdict (Tier A, atom #1),
semantic-code-taint-analysis-report (Tier A, deployed),
seven-step-equity-research-brief (parked).

**Doc-guard rotation (Batch 19 staging):** GUARD_PENDING rotated
from Batch 18's seven to Batch 19's seven on master; Batch 18's
seven entered scope. Proof: `node tools/sync-docs.mjs` exits 1
naming exactly Batch 18's seven deployed atoms (their WS1 pass
follows Wave 13); `src/docs.generated.ts` byte-unchanged.
personal-financial-snapshot remains GUARD_WAIVED (U-13 open).

**Batch 19 per-atom process counts (staged):** N-10 NOT RUN ×7 ·
R-18 NOT RUN ×7 · GM NOT RUN ×7 — their passes follow their
deploy, which waits for Wave 13 + the WS1-B18 pass per the
cadence. Rates null on all seven contracts; listings staged
("built-locally — NOT deployed; do not submit").

**Program state: 162 = 120 deployed (113 serving + 7 disabled by
owner ruling) + 1 staged-held (personal-financial-snapshot, U-13
ruling open) + 7 staged (Batch 19) + 6 parked (owner's set ruling
outstanding) + 8 G2 passed over + 20 Tier B G1 unwalked.** All
contract rates remain `null`.

---

## Batch 19 — SIX ATOMS DEPLOYED 2026-11-16 (one held by an open U-13 ruling)

Six of the seven staged Batch 19 atoms deployed on the house path.
The three screen-NO flags deployed CENSUS-STYLE with the batch,
their controls on record in their SERVICE.md files:
**production-rust-engineering-pack-expert** (declared-record audit;
advice-shaped skill steps excluded as red lines),
**quant-math-derivation-sanity-check** (finance-adjacent; the
skill's quant-application steps excluded; no output addressed to any
security/portfolio/credit/investment decision) and
**service-isolation-hardening-review** (declared-record audit; no
recommendation/remediation; not a certification or pentest). All
three remain kill-switchable in one flip if the Director rules
otherwise. **smart-grid-der-design-pack did NOT deploy** —
engineering class; its SERVICE.md records its deploy disposition as
the Director's explicit per-unit U-13 ruling (strictest reading) and
no ruling has arrived; it stays fully staged on master, excluded
from the deploy tree entirely, recorded GUARD_WAIVED alongside
personal-financial-snapshot (whose ruling also remains open), its
absence proven live by negative probes (below).

Deploy base (the takedown lesson, applied): the integration was
built on the LIVE Batch 18 deploy tree (branch `deploy/batch18`,
tip `3508ef6`) in the isolated worktree
`~/workspace/atom-services-b19wt`, branch `deploy/batch19`.
Integration commit `7df396d` (the six atoms' handlers/tests/
fixtures/SERVICE.md/listings + registry-ts and registry-json
additions applied from the staging commit `ff8941a`'s own diff +
rates regenerated by sync-rates at `null` + the 119-doc emit + the
doc guard rotated to the six) and fixture commit `8eaa112` (the
doc-link test's undocumented-live fixture rotated to
production-rust-engineering-pack-expert; test-only). Traps caught
before commit, on record: the wholesale fixtures checkout re-added
BOTH held atoms' fixture sets (smart-grid ×10,
personal-financial-snapshot ×9 — removed and verified absent); the
staged shared files carried both held atoms' registry rows and
atoms-registry.ts blocks (removed surgically — the registry JSON
edit round-trip-verified, the registry-ts diff vs the live base
proven purely additive before surgery, zero held-atom references
remaining).

Verification on the exact deploy tree: gateway suite **5601/5601
green** (5303 Batch 18 deploy tree + 298 Batch 19 six TS tests;
= staged 5694 − 48 smart-grid TS − 45 personal-financial-snapshot
TS, exactly as predicted by the two exclusions); the six atoms'
Python oracles **234/234** re-run on the deploy tree; differentials
**3,606 cases, 0 mismatches** for the six (from staging; the staged
batch total was 4,248 including smart-grid's 642); dist census
**126 atom modules** (registry↔dist set equality proven
mechanically, modulo the standing exception that atom #1's handler
file is `release-readiness.js`); frozen files (billing.ts,
store.ts, callpath.ts, atoms/validate.ts) verified byte-identical
against the Batch 18 deploy tree. All rates `null`.

**Gate: PASS WITH FINDINGS → RELEASE CANDIDATE** (pack
`~/workspace/release-gate-runs/atoms-gateway-batch19-2026-11-16/`
— scanner PASS WITH FINDINGS on the isolated archive of the
deploy tree, zero must-failures/secrets/vulns; the only
must-relevant FAIL line is the carried F-G2 Low; one further
OPTIONAL scanner line (.gitignore/.env at the repo root) is the
standing repo-root-archive artifact, recorded in the supplement;
GM/Kali/TLS legs NOT RUN as before).

**Deploy:** site-integrity declaration `2f6727e3-11f2-40bd-a63c-
35b49ae331a4` → deploy2.py upload (bindings read from LIVE
settings, passed through unchanged; STRIPE_MODE stays `test`) →
**deployment `b71b0351b5994d9da5dc7bebffcd3189`, certified sha256
`3da026ec0c077641587f50f83fc3c4393a5af18ab0c4b78e8f443177fe6dc5ef`**
(sign request `a3d20ec1-cff5-4c5e-8041-b00421bc9ece`) →
declaration closed after probes. The uploaded module list was
read at deploy time: the six new atom modules present, no
smart-grid-der-design-pack module, no personal-financial-snapshot
module, no Batch 20 leakage.

**D1:** seeded ×6 (`atom_enabled:<name>` = 1 + internal scopes in
namespace/underscore form) and read back: **126 registered / 119
serving / 7 disabled / 126 internal scopes / 0 hyphen-form
scopes**; smart-grid-der-design-pack and personal-financial-
snapshot each hold 0 config rows and 0 internal scopes.

**Live probes: full set PASS** (pack probes.json): per-atom 24/24
(fixture expected == Python oracle re-run locally; golden 200 =
oracle output verbatim + the gateway `stamp` envelope; first-field
corruption → 422 `invalid_input` naming the field — project /
derivation_title / release_label / page / subject / trip_title;
keyless → 401); **held-atom negative probes ×2 —
smart-grid-der-design-pack AND personal-financial-snapshot: REST
404, MCP 404, absent from /api.json (126 entries) and from the
catalogue**; doc-surface 13/13 — Batch 18's seven documentation
surfaces are NOW LIVE (/docs 200 + feed `documentation` field +
catalogue link ×7) and the six are correctly doc-less (404 + null,
GUARD_PENDING until their WS1 pass after Wave 14); feed
`documentation` on exactly 113 live atoms (119 emitted − 6
documented-but-disabled); /health serving 119 + `disabled_atoms`
exactly the takedown seven; F-G3 headers 3/3; takedown regression
3/3 (MCP tools/list empty + literal 503 `atom_disabled`, REST 503)
— passed on a scoped-key re-probe: the first battery's takedown
legs used a key scoped only to the six new atoms and stopped at
the scope gate (403 `scope_required`), the designed gate order
(key + scope gates precede the disabled gate); both runs are
recorded in probes.json. MCP sanity 2/2 (tools/list + tools/call
verdict on production-rust-engineering-pack-expert). Probe
users/keys/sessions deleted and read back 0; post-delete session
access reads 401; probe credentials shredded; the probes'
zero-charge usage metering rows remain as the append-only trail.

**Listings:** the six `org.aimlds/<atom>` records published via
mcp-publisher (repo `_meta` status flipped to "live — release
candidate since 2026-11-16 (one-week soak to 2026-11-22)") and
read back from the registry API: active, isLatest,
version/description/remote/status-text identical to repo copies,
6/6. Two listing descriptions were shortened at publish time to
fit the registry's 100-char limit
(production-rust-engineering-pack-expert 109 → 97 chars;
release-pack-changelog-seal-rollback 136 → 84 chars) — the repo
copies carry the shortened text; the gateway catalogue
descriptions are unchanged.

**Batch 19 per-atom process counts (the six deployed):** N-10
documentation NOT RUN ×6, R-18 gate NOT RUN ×6, GM NOT RUN ×6 —
their WS1/WS2 passes follow Wave 14 verification, per the binding.
The three U-13 flags stand deployed-under-screen-NO pending the
Director's review. smart-grid-der-design-pack and
personal-financial-snapshot: STAGED-HELD, awaiting the Director's
U-13 rulings (not process lines).

**Program state: 162 = 126 deployed (119 serving + 7 disabled by
owner ruling) + 2 staged-held (personal-financial-snapshot +
smart-grid-der-design-pack, U-13 rulings open) + 6 parked (owner's
set ruling outstanding) + 8 G2 passed over + 20 Tier B G1
unwalked (Batch 20 authoring follows in this same dispatch).** All
contract rates remain `null`. **RC since 2026-11-16; soak to
2026-11-22.**

## Batch 20 — AUTHORED + STAGED 2026-11-16 (seven Tier B atoms)

Authored in the same dispatch as the Batch 19 deploy, under the
house authoring discipline (bound skill read in full → Python
oracle + tests + golden fixtures FIRST → TS port proven by
differential parity → SERVICE.md with declined thresholds named
and distinct ground vs nearest siblings stated → listing
regenerated in the staged shape). Staged only — Batch 20's deploy
waits for Wave 14 + WS1-B19, per the cadence. Central integration
by the coordinator: all seven Python suites re-run centrally
(286/286), full-project `tsc --noEmit` clean, registry rows ×7
appended to `atoms.registry.json` (128 → 135) with matching
imports, manifestAtom blocks and handler-map entries in
`src/atoms-registry.ts`, `src/generated.ts` regenerated via
sync-rates (all 135 rates null), plus an independent coordinator
spot differential on sourced-podcast-episode-production
(62 seeded cases, 0 mismatches).

| Atom | Checks / sections | Python | TS | Differential |
|---|---|---|---|---|
| sourced-podcast-episode-production | 52 / 7 (13 computed, 6 gated) | 37 | 47 | 341 cases, 0 mismatches |
| sourced-visual-reference-search | 34 / 6 (17 computed) | 39 | 48 | 472 cases, 0 mismatches |
| sql-schema-query-engineering-pack | 44 / 8 (16 computed) | 31 | 43 | 345 cases, 0 mismatches |
| statistical-study-design-report | 46 / 7 (12 computed) | 43 | 53 | 352 cases, 0 mismatches |
| strict-typescript-engineering-pack | 39 / 8 | 38 | 51 | 337 cases, 0 mismatches |
| structured-decision-making | 46 / 8 (14 computed) | 55 | 67 | 356 cases, 0 mismatches |
| structured-root-cause-analysis | 38 / 6 (14 computed) | 43 | 52 | 376 cases, 0 mismatches |

Check-name uniqueness verified mechanically per atom: zero
overlap with the fleet register (4,000+ names) in every case.
Staged gateway suite on master: **6055/6055** (= 5694 staged
Batch 19 tree + 361 Batch 20 TS tests).

**U-13 screens (all seven):** sourced-podcast-episode-production
— **(a) No outright**, no flag (no regulated subject; declared-
record audit only, no episode content produced).
sourced-visual-reference-search — **(b) screen-NO flag-with-
controls** (image licensing/copyright-adjacent; controls: no
legal advice or rights clearance, a row claimed cleared without
a declared `explicitly_licensed` status FAILS, fetches nothing).
sql-schema-query-engineering-pack — **(b) screen-NO flag-with-
controls** (declared-record audit only; design/write-SQL/
choose-index/live-migration steps excluded by name).
statistical-study-design-report — **(b) screen-NO flag-with-
controls** (no statistical advice, design recommendation or
conclusion; no adequacy threshold — the conventional 0.8 power
bar is explicitly NOT imposed).
strict-typescript-engineering-pack — **(b) screen-NO flag-with-
controls** (census class, per its worker screen).
structured-decision-making — **(b) screen-NO flag-with-controls**
(no advice, recommendation or ranking; a non-highest-total
logged choice passes by design — the atom never checks the
choice against the totals).
structured-root-cause-analysis — **(b) screen-NO flag-with-
controls**, screened under the strictest engineering-class
reading (no engineering determination, no incident
investigation; person-blame as root cause is itself a red line
and fails). All six (b) flags stand for the Director's per-unit
ruling queue, census-style; none is genuinely-open (pfs class)
and none holds authoring or, by itself, its batch's deploy —
the engineering-class strictest reading applies at deploy-set
formation, per the smart-grid precedent.

**Passed over in this queue walk:** strategy-map-builder —
Tier B G2 (no bound skill), passed over per the standing rule.
Zero atoms parked in Batch 20 — all seven reduced cleanly to
deterministic checks over declared records.

**Doc-guard rotation (PROVEN):** GUARD_PENDING rotated to Batch
20's seven; smart-grid-der-design-pack moved to GUARD_WAIVED
alongside electrical-machines-expert-advice and
personal-financial-snapshot (both staged-held atoms now recorded
waived, documentation a precondition of their publish rulings).
Proof run: `node tools/sync-docs.mjs` exits 1 naming exactly
Batch 19's six deployed atoms (production-rust-engineering-pack-
expert, quant-math-derivation-sanity-check,
release-pack-changelog-seal-rollback, semantic-html-review,
service-isolation-hardening-review, single-living-trip-itinerary)
and leaves `src/docs.generated.ts` byte-unchanged (sha256
verified before/after).

**Program state: 162 = 126 deployed (119 serving + 7 disabled by
owner ruling) + 2 staged-held (personal-financial-snapshot +
smart-grid-der-design-pack, U-13 rulings open) + 7 staged
(Batch 20) + 6 parked + 8 G2 + 13 Tier B G1 unwalked.** All
contract rates remain `null`.

## Batch 20 — DEPLOYED (SIX atoms, 2026-11-16)

**Deployed:** sourced-podcast-episode-production,
sourced-visual-reference-search, sql-schema-query-engineering-pack,
statistical-study-design-report, strict-typescript-engineering-pack,
structured-decision-making — integrated from the staging commit
`accef15` onto the Batch 19 live base (`8eaa112`) as deploy-branch
`deploy/batch20` commits `f80c377` (integration) + `76fb7da`
(test-only doc-link fixture rotation), via an isolated `git archive`
of the branch — never repo HEAD. **structured-root-cause-analysis
EXCLUDED from the deploy** (see the hold note below); the five
screen-NO flags deployed census-style with their controls on
record; sourced-podcast-episode-production screened (a) No
outright.

**Verification on the exact deploy tree:** gateway suite
**5910/5910** (= staged 6055 − 52 RCA TS − 48 smart-grid TS − 45
pfs TS, exactly the three exclusions); the six's Python oracles
**243/243** re-run on the deploy tree; dist census **132 atom
modules** (registry↔dist set equality mechanical; no
structured-root-cause-analysis, smart-grid or
personal-financial-snapshot module; no Batch 21 leakage); frozen
files (billing/store/callpath/validate) byte-identical vs the
Batch 19 deploy tree; all rates `null`; STRIPE_MODE stayed `test`.
Integration traps caught pre-commit: the wholesale fixtures
checkout re-added held atoms' fixtures (cleaned to the six atoms'
66 fixture files, zero held-atom files verified); staged shared
files carried all three held atoms' entries, removed surgically
with the JSON round-trip-verified and both TS diffs proven purely
additive for exactly the six.

**Gate: PASS WITH FINDINGS → RELEASE CANDIDATE** (pack
`~/workspace/release-gate-runs/atoms-gateway-batch20-2026-11-16/` —
scanner PASS WITH FINDINGS, zero must-failures/secrets/vulns; the
only FAIL line is the carried F-G2 Low; GM/Kali/TLS NOT RUN as
before). Deployed via the house path (declaration
`0629af30-5c87-4608-9a1e-ae6edfd09b28`, closed after probes):
deployment `ac6ddba696934ceb84596876507fc08c`, certified sha256
`aaf359b8103db9780a0fe9e2d538d1530106b68970cfa5dcd00327ab6a11b285`;
uploaded module list verified at deploy time. D1 seeded ×6 in
namespace form, read back **132 registered / 125 serving / 7
disabled / 132 internal scopes / 0 hyphen-form**; held atoms 0
config rows, 0 scopes each. Listings published ×6 and read back
**6/6 active, isLatest** (no description shortenings needed).
**Live probes 73/73 PASS** (pack probes.json): per-atom golden =
oracle output verbatim + `stamp` envelope, corruption 422 naming
the field, keyless 401, MCP tool named; **negative probes for ALL
THREE held atoms** (REST + MCP 404, absent from feed + catalogue);
the **125-doc emit live** — Batch 19's six documentation surfaces
serving (/docs 200, feed `documentation` on exactly **119**,
catalogue links), Batch 20's six correctly doc-less (GUARD_PENDING);
F-G3 headers verified on the catalogue response; takedown
regression on a scoped key (REST literal 503, MCP tools/list
empty, MCP tools/call literal 503); probe rows deleted FK-safe,
read back 0, post-delete key 401. Battery record: the first run's
F-G3 leg probed the page body instead of response headers and its
cleanup FK-failed on the probe user's balances row — both
corrected and the battery re-run clean end-to-end.

**Hold note — structured-root-cause-analysis is now the third
staged-held atom.** Screened under the strictest engineering-class
reading at authoring (no engineering determination, no incident
investigation; person-blame as root cause is itself a failing red
line), it is held staged by the parent at deploy-set formation
under the smart-grid precedent, pending the Director's per-unit
U-13 ruling — no handler in the deploy tree, no registry row, no
D1 seeding, no listing publication, absence proven live above. It
joins personal-financial-snapshot and smart-grid-der-design-pack
in GUARD_WAIVED on master (documentation = precondition of a
publish ruling), rotated in with the Batch 21 guard rotation.

**Process counts for the six, plainly:** N-10 NOT RUN ×6 · R-18
NOT RUN ×6 · GM NOT RUN ×6 — WS1/WS2 extension passes follow
Wave 15. RC since 2026-11-16, soak to 2026-11-22.

## Batch 21 — AUTHORED + STAGED (seven Tier B atoms, 2026-11-16)

**Authored:** system-design-failure-mode-pack (56 checks),
tech-stack-decision-memo (51), technical-documentation-pack (46),
technical-explainer-content-pack (63),
testing-strategy-regression-pack (58), uat-scenario-sign-off-pack
(56), ux-flow-component-spec-pack (45) — the next seven unwalked
Tier B G1 atoms in census order. Zero parked; no pass-overs beyond
the known sets (the remaining six unwalked Tier B G1 form the
Batch 22 set: validated-simulation-scenario-pack,
vendor-evaluation-three-way-match-pack, verified-place-shortlist,
voice-note-narration-audio, zero-knowledge-system-design-pack,
zero-trust-architecture-design-pack).

**Verification (coordinator-re-run centrally, all seven):**
Python suites 256/256 (34+35+36+36+37+41+37); golden fixtures 74,
all oracle-true; TS tests 330/330 in scratch copies of the
integrated tree; independent seeded differentials 320 cases per
atom, 2,240 total, **0 mismatches** (worker-run differentials of
350–400 per atom also reported 0); check-name uniqueness proven
fleet-wide per atom, zero collisions, including mutual. Staged
gateway suite on master **6385/6385** (= 6055 + 330). Registry
135→142 rows; atoms-registry.ts and generated.ts purely additive
×7; all rates `null`; contract.yaml untouched ×7. Lane record,
honestly: three of the seven authoring workers errored in a
service-restart drain and one finished without a report — every
atom was inventoried from disk and completed by the coordinator
(the three errored atoms' code sides verified complete as found;
their SERVICE.md rewrites and listing regenerations were finished
as separate narrow passes and re-verified; the report-less atom
was complete on disk).

**U-13 screens:** (a) No outright ×3 —
technical-documentation-pack, testing-strategy-regression-pack,
uat-scenario-sign-off-pack. (b) screen-NO flag-with-controls ×4 —
tech-stack-decision-memo (census class: memo audit, no
recommendation, no ranking, no default stack) and
ux-flow-component-spec-pack (accessibility adjacency; certifies
no conformance, measures no contrast, tests no keyboard path) in
the ordinary census class; **system-design-failure-mode-pack**
(engineering class, strictest reading: FMEA vocabulary over a
declared record, no determination, RPN recomputation exact-only)
and **technical-explainer-content-pack** (the bound skill names
safety-relevant electrical/medical/money topics; controls include
expert-review declaration checks and the unlicensed-practice red
line) each carry in their SERVICE.md the stronger control that
they are flagged for the owner's explicit per-unit ruling before
any deployment — **both are deploy-set hold candidates for the
Batch 21 deploy-set formation, to be surfaced to the Director
before that deploy** (the smart-grid / structured-root-cause
precedent). Flagging blocked nothing in authoring.

**Doc-guard rotation (PROVEN):** GUARD_PENDING rotated to Batch
21's seven; structured-root-cause-analysis moved to GUARD_WAIVED
alongside electrical-machines-expert-advice,
personal-financial-snapshot and smart-grid-der-design-pack (all
three staged-held atoms now recorded waived, documentation a
precondition of their publish rulings). Proof run:
`node tools/sync-docs.mjs` exits 1 naming exactly Batch 20's six
deployed atoms (sourced-podcast-episode-production,
sourced-visual-reference-search,
sql-schema-query-engineering-pack,
statistical-study-design-report,
strict-typescript-engineering-pack, structured-decision-making)
and leaves `src/docs.generated.ts` byte-unchanged (sha256
72a2ed96… verified before/after).

**Program state: 162 = 132 deployed (125 serving + 7 disabled by
owner ruling) + 3 staged-held (personal-financial-snapshot +
smart-grid-der-design-pack + structured-root-cause-analysis,
U-13 rulings open) + 7 staged (Batch 21) + 6 parked + 8 G2 + 6
Tier B G1 unwalked.** All contract rates remain `null`. Batch
21's deploy waits for Wave 15 + the WS1 Batch 20 extension, per
cadence.

## Batch 21 — DEPLOYED (FIVE of seven staged atoms, 2026-11-16)

**Deploy set (five):** tech-stack-decision-memo,
technical-documentation-pack, testing-strategy-regression-pack,
uat-scenario-sign-off-pack, ux-flow-component-spec-pack.
**system-design-failure-mode-pack and
technical-explainer-content-pack EXCLUDED** — both flagged at
authoring as hold candidates for the Director's explicit per-unit
U-13 ruling (system-design: engineering class, strictest reading;
technical-explainer: bound skill names safety-relevant
electrical/medical/money topics) and no rulings arrived; they join
personal-financial-snapshot, smart-grid-der-design-pack and
structured-root-cause-analysis as staged-held, recorded GUARD_WAIVED
in master's sync-docs alongside the three earlier holds
(documentation = precondition of a publish ruling). tech-stack and
ux-flow deployed census-style as screen-NO flags with their controls
on record; the other three screened No outright.

Deploy-branch commits `4f4ab0d` + `a73974c` (+ record commit for the
listing description below) on the Batch 20 live base `76fb7da`,
worktree `~/workspace/atom-services-b21wt`. Gateway suite
**6149/6149** on the exact deploy tree (= staged 6385 − 45 pfs TS −
48 smart-grid TS − 52 RCA TS − 91 system-design +
technical-explainer TS); the five's Python oracles **186/186**
re-run on the deploy tree; dist census exactly **137 atom modules**
(registry↔dist set equality proven mechanically; standing
exceptions release-readiness.js + the shared validate.js helper).
Integration nuance on record: the three earlier held atoms'
RATES-only lines in generated.ts were preserved exactly as on every
live tree since their staging (a rates line alone serves nothing);
the two Batch 21 hold candidates carry no rates line, never having
entered a live tree. Doc guard rotated: GUARD_PENDING = Batch 21's
five; sync-docs on the deploy branch emits **131 docs**, exit 0 —
Batch 20's six documentation surfaces went LIVE with this deploy
(feed `documentation` on exactly 125). Gate **PASS WITH FINDINGS**
(pack `~/workspace/release-gate-runs/atoms-gateway-batch21-2026-11-16/`;
only FAIL line = carried F-G2; GM/Kali/TLS NOT RUN as before).
Deployment `22647267ae414ecbb3a5ee342afd73f8`, certified sha256
`7cebef8511a39daaddf2d1c829ff0acf324c8834eaacc218048933e3ffe0163b`,
declaration `6a6922b7-0e2e-46dc-a2ef-00e71372664d`; uploaded module
list verified at deploy time (137 atom modules; no held-atom
modules; no Batch 22 leakage); STRIPE_MODE stays `test`; all rates
`null`. **D1:** seeded ×5 (`atom_enabled:<name>` = 1 + internal
scopes in namespace form) and read back **137 registered / 130
serving / 7 disabled / 137 internal scopes / 0 hyphen-form**; all
five held atoms 0 config rows, 0 scopes each. **Listings:**
`org.aimlds/<atom>` ×5 published at 0.1.0 and read back **active /
isLatest true** (testing-strategy-regression-pack's description
shortened at publish, 102 → 93 chars, to the registry 100-char
limit; repo copies carry the shortened text). **Live probes: 74/74
PASS** on the corrected battery (pack probes.json) — per-atom golden
= oracle output verbatim + the gateway `stamp` envelope; corruption
422s naming the first field ×5; keyless 401 ×5; MCP tool names ×5;
**negative probes for ALL FIVE held atoms PASS** (REST 404, MCP
404, absent from /api.json's 137 entries and the catalogue);
doc-surface full set PASS; /health serving 130 + `disabled_atoms`
exactly the seven; F-G3 six-header set verified on response HEADERS;
takedown regression on a scoped key (REST literal 503, MCP
tools/list empty, MCP tools/call literal 503); probe rows deleted
FK-safe and read back 0 across eight tables, post-delete key 401.
Battery record, honestly: the first run's 16 FAILs were the
battery's own shape defects (strict equality vs the stamp envelope;
feed lookups on the wrong name key) — corrected and re-run clean;
the first cleanup pass's two wrong column names were likewise
corrected in-sitting (see the pack SUPPLEMENT). **Process counts
for the five: N-10 NOT RUN ×5, R-18 NOT RUN ×5, GM NOT RUN ×5** —
their WS1/WS2 passes follow Wave 16. **RC since 2026-11-16, soak to
2026-11-22.** Frozen files untouched.

**Program state: 162 = 137 deployed (130 serving + 7 disabled by
owner ruling) + 5 staged-held (personal-financial-snapshot,
smart-grid-der-design-pack, structured-root-cause-analysis,
system-design-failure-mode-pack, technical-explainer-content-pack —
U-13 rulings open) + 6 parked + 8 G2 + 6 Tier B G1 unwalked (the
Batch 22 set, authoring in flight).** All contract rates remain
`null`.

## Batch 22 — AUTHORED + STAGED (the FINAL six Tier B G1 atoms, 2026-11-16)

The last six unwalked Tier B G1 atoms, authored in census order
after Batch 21's seven. **Passed over in this queue walk:**
strategy-map-builder — Tier B **G2** (contract-only, NO bound
skill; one of the eight G2 atoms, not a G1 authoring candidate).
With this batch the unwalked Tier B G1 queue is EMPTY.

| Atom | Checks | Sections | Python | TS | Differential |
|---|---|---|---|---|---|
| validated-simulation-scenario-pack | 52 | 7 | 42/42 | 52/52 | 40 cases, 0 mismatches |
| vendor-evaluation-three-way-match-pack | 66 | 7 | 45/45 | 55/55 | 34 cases, 0 mismatches |
| verified-place-shortlist | 51 | 6 | 36/36 | 45/45 | 121 cases, 0 mismatches |
| voice-note-narration-audio | 46 | 7 | 40/40 | 50/50 | 148 cases, 0 mismatches |
| zero-knowledge-system-design-pack | 59 | 7 | 29/29 | 40/40 | 37 cases, 0 mismatches |
| zero-trust-architecture-design-pack | 54 | 6 | 26/26 | 35/35 | 24 cases, 0 mismatches |
| **Totals** | **328** | — | **218/218** | **277/277** | **404 cases, 0 mismatches** |

Zero parked. Every atom reduced to deterministic checks over a
caller-DECLARED record (oracle-first, TS port proven by differential
parity + golden-fixture parity legs inside the staged suite; 60
golden fixtures generated from the Python oracles). Coordinator
centrally re-verified: all six Python suites re-run green
(218/218), check-name audit over every fleet oracle's
`evaluate({})` output — **none of the 328 Batch 22 check names
collides with any other atom's** (the duplicate pairs the audit
lists are all between pre-Batch-22 atoms, an early-batch artifact
left as-is). Registry rows 142 → 148 (atoms.registry.json +
atoms-registry.ts + generated.ts via `tools/sync-rates.mjs`, all
rates `null`; verified-place-shortlist carries its contract's
`query` unit, the other five `deliverable`). Staged gateway suite
on master **6662/6662** (= 6385 + 277 Batch 22 TS). Listings
regenerated in staged shape (`_meta` status "built-locally — NOT
deployed; do not submit").

**U-13 screens (keyword + substantive, per atom, in each
SERVICE.md):**
- validated-simulation-scenario-pack — **HOLD CANDIDATE
  (coordinator classification, strictest engineering-class
  reading).** The authoring screen concluded (b) screen-NO
  flag-with-controls (declared-record audit only; runs no
  simulation, produces no simulated value, sets no tolerance or
  fidelity bar, refuses the skill's safety red lines), but the
  SERVICE.md itself records that if the verdict vocabulary
  (`SIMULATION_SCENARIO_PACK_SOUND`, the word "validated") reads
  as an engineering determination despite the controls, the unit
  is a hold candidate for the Director's explicit ruling. Under
  the house rule — engineering class takes the strictest reading
  by default (the smart-grid precedent), and a candidate whose
  record flags it for the Director's explicit ruling is a hold
  candidate — the coordinator classifies it HOLD CANDIDATE: it
  does **not** deploy with Batch 22 unless the Director rules it
  publishable; it deploys only on his per-unit ruling, with its
  WS1 documentation as a precondition of that ruling.
- vendor-evaluation-three-way-match-pack — screen-NO
  flag-with-controls (census class): finance-adjacent by keyword
  (invoices, payments, bank details), substance is a business
  procurement-record audit; no recommendation, no payment decision
  (a matched record is explicitly not a payment approval), no
  amount thresholds; explicitly distinguished from the
  personal-financial-snapshot hold class (no personal financial
  position is handled).
- verified-place-shortlist — No outright: audits a declared
  shortlist record; fetches nothing live, verifies no real-world
  fact, recommends and books nothing ("verified" names the
  caller's declared verification discipline — a named red line).
- voice-note-narration-audio — No outright: voice consent is a
  rights/control matter handled by red lines and gated consent
  checks (declared presence only, never legal sufficiency); an
  absent voice-consent declaration fails as a red line.
- zero-knowledge-system-design-pack — screen-NO flag-with-controls
  (census class): design-record audit only; proves nothing,
  verifies no proof, runs no cryptography, certifies no security
  property; distinct ground vs the live zero-knowledge-claim-audit
  stated mechanically (zero shared checks, verified).
- zero-trust-architecture-design-pack — screen-NO
  flag-with-controls (census class): design-record audit only;
  evaluates no live posture, probes no network, certifies no
  security outcome; distinct ground vs the live
  zero-trust-evaluation-verdict stated mechanically (zero shared
  checks, verified).

**Doc-guard rotation (master):** GUARD_PENDING = Batch 22's six;
GUARD_WAIVED gained system-design-failure-mode-pack and
technical-explainer-content-pack alongside
electrical-machines-expert-advice, personal-financial-snapshot,
smart-grid-der-design-pack and structured-root-cause-analysis (all
five staged-held atoms now recorded waived, documentation a
precondition of their publish rulings). Proof run:
`node tools/sync-docs.mjs` exits 1 naming exactly Batch 21's five
deployed atoms (tech-stack-decision-memo,
technical-documentation-pack, testing-strategy-regression-pack,
uat-scenario-sign-off-pack, ux-flow-component-spec-pack) and leaves
`src/docs.generated.ts` byte-unchanged (sha256 72a2ed96… verified
before/after).

**Program state: 162 = 137 deployed (130 serving + 7 disabled by
owner ruling) + 5 staged-held (personal-financial-snapshot +
smart-grid-der-design-pack + structured-root-cause-analysis +
system-design-failure-mode-pack +
technical-explainer-content-pack, U-13 rulings open) + 6 staged
(Batch 22, incl. validated-simulation-scenario-pack classified
HOLD CANDIDATE above — its deploy waits on the Director's ruling
independently of the batch) + 6 parked + 8 G2 + 0 Tier B G1
unwalked.** All contract rates remain `null`. Batch 22's deploy
waits for Wave 16 + the WS1 Batch 21 extension, per cadence.

## Batch 22 — DEPLOYED (FIVE of six staged atoms, 2026-11-16) — THE FINAL REPLICATION DEPLOY

**Deployed:** vendor-evaluation-three-way-match-pack,
verified-place-shortlist, voice-note-narration-audio,
zero-knowledge-system-design-pack,
zero-trust-architecture-design-pack — integrated from the staging
commit `60a53c8` onto the Batch 21 live base (`a34beaf`) as
deploy-branch `deploy/batch22` commits `fbc9463`
(integration) + `3408577` (test-only doc-link fixture rotation),
via an isolated `git archive` of the branch — never repo HEAD.
**validated-simulation-scenario-pack EXCLUDED from the deploy**
(see the hold note below); vendor-evaluation,
zero-knowledge-system-design and zero-trust-architecture deployed
census-style as screen-NO flags-with-controls with their controls
on record; verified-place-shortlist and voice-note-narration-audio
screened (a) No outright.

**Verification on the exact deploy tree:** gateway suite
**6374/6374** (= staged 6662 − 45 pfs TS − 48 smart-grid TS − 52
RCA TS − 91 system-design + technical-explainer TS − 52
validated-simulation TS, exactly the six exclusions); the five's
Python oracles **176/176** re-run on the deploy tree; dist census
**142 atom modules** (registry↔dist set equality mechanical; no
validated-simulation, system-design, technical-explainer,
structured-root-cause-analysis, smart-grid or
personal-financial-snapshot module); frozen files
(billing/store/callpath/validate) byte-identical vs the Batch 21
deploy tree; all rates `null`; STRIPE_MODE stayed `test`. The
three surgical files (atoms.registry.json, atoms-registry.ts,
generated.ts) were built by **verified-identity merge**: for each
file, the staged version minus the staged-only atoms' chunks was
first proven to reproduce the live base byte-for-byte (134/134
manifestAtom chunks identical; generated.ts strip identity exact
modulo timestamp; registry rows + re-dump byte-exact), and only
then was the target constructed and reverse-verified — final diffs
vs the live base are the timestamp plus purely additive lines for
exactly the five (atoms-registry.ts additions-only, 129 lines, 0
deletions); the three earlier held atoms' RATES-only lines
preserved exactly as on every live tree since their staging.

**Gate: PASS WITH FINDINGS → RELEASE CANDIDATE** (pack
`~/workspace/release-gate-runs/atoms-gateway-batch22-2026-11-16/` —
scanner PASS WITH FINDINGS, zero must-failures/secrets/vulns; the
only FAIL line is the carried F-G2 Low; GM/Kali/TLS NOT RUN as
before). Deployed via the house path (declaration
`bc77eab5-c633-478f-b52f-c1ed4a63c5db`, closed after probes):
deployment `ee6a845a54d94e829dd0aad9f8cd9d41`, certified sha256
`499fda5efd4116f59fff685dfa7b3395922710675687378b7a1ceb6fef4a4930`;
uploaded module list verified at deploy time. Certification note:
deploy2.py's inline certify timed out waiting for the signer; the
artifact was certified by a manual run of the same signing client
before any probe ran (recorded in the pack supplement). D1 seeded
×5 in namespace form, read back **142 registered / 135 serving / 7
disabled / 142 internal scopes / 0 hyphen-form**; held atoms 0
config rows, 0 scopes each. Listings published ×5 and read back
**5/5 active, isLatest** with correct remotes (no description
shortenings needed — 80/75/93/78/88 chars; the saved publisher
token had expired and login was renewed via the house DNS method
in the same sitting). **Live probes 61/61 PASS** (pack
probes.json): per-atom golden = oracle output verbatim + `stamp`
envelope, MCP parity, corruption 422 naming the field, keyless
401, MCP tool named; **negative probes for ALL SIX held atoms**
(REST + MCP 404, absent from feed + catalogue); the **136-doc emit
live** — Batch 21's five documentation surfaces serving (/docs
200, feed `documentation` on exactly **130**, catalogue links),
Batch 22's five correctly doc-less (GUARD_PENDING); F-G3 headers
verified on the catalogue response HEADERS; takedown regression
on a scoped key (REST literal 503, MCP tools/list empty, MCP
tools/call literal 503); probe rows deleted FK-safe across eight
tables, read back 0, post-delete key 401. Battery record: the
F-G3 leg's first run failed on the battery's own header parsing
(the sandbox proxy's CONNECT preamble block read as the response
block) — corrected and re-probed clean end-to-end, recorded in
the supplement; the gateway was never at fault.

**Hold note — validated-simulation-scenario-pack is now the sixth
staged-held atom.** Classified HOLD CANDIDATE at authoring under
the strictest engineering-class reading (its own SERVICE.md
records that if its verdict vocabulary — "validated",
`SIMULATION_SCENARIO_PACK_SOUND` — reads as an engineering
determination despite the controls, it is a hold candidate for
the Director's explicit ruling), it is held staged at deploy-set
formation under the smart-grid precedent, pending the Director's
per-unit U-13 ruling — no handler in the deploy tree, no registry
row, no D1 seeding, no listing publication, absence proven live
above. It joins personal-financial-snapshot,
smart-grid-der-design-pack, structured-root-cause-analysis,
system-design-failure-mode-pack and
technical-explainer-content-pack as staged-held; on the deploy
branch all six are recorded in the sync-docs guard header as
excluded from the tree (documentation = precondition of a publish
ruling for each).

**Process counts for the five, plainly:** N-10 NOT RUN ×5 · R-18
NOT RUN ×5 · GM NOT RUN ×5 — WS1/WS2 extension passes follow
Wave 17. RC since 2026-11-16, soak to 2026-11-22.

**Program state: 162 = 142 deployed (135 serving + 7 disabled by
owner ruling) + 6 staged-held (personal-financial-snapshot,
smart-grid-der-design-pack, structured-root-cause-analysis,
system-design-failure-mode-pack, technical-explainer-content-pack,
validated-simulation-scenario-pack — U-13 rulings open) + 6
parked + 8 G2 + 0 Tier B G1 unwalked.** The replication deploy
queue is complete. The only remaining cadence steps are Wave 17
(first-test the five) + WS1/WS2-B22 (their documentation + gate
passes), after which every deployed atom stands externally
verified, documented and gated, with Guardian Mesh NOT RUN the
sole standing NOT RUN class. All contract rates remain `null`.

---

## DOCS-ONLY DEPLOY — 141-doc emit live (2026-11-16)

Deployment `b078557a9168467d95175985cfd5e99e`, certified sha256
`911435e1a37b0773b46d47339b99270891aeea84d1c8f3578a975f080725323b`,
branch `deploy/docs-emit-141` (commit `96d01b5`) on the Batch 22
live base. The tree differs from the live base in exactly two
files: `src/docs.generated.ts` (136 → 141 docs; per-key identity
proven — added lines exactly Batch 22's five, all 136 prior lines
byte-identical, no held atom emitted) and one test-only doc-link
fixture rotation (the live + undocumented premise expired — every
live registered atom is now documented; the fixture re-bases on
electrical-machines-expert-advice, enabled in the test store only).
Suite 6374/6374 on the exact tree (zero delta vs Batch 22). Gate
PASS WITH FINDINGS → RC (pack
`~/workspace/release-gate-runs/atoms-gateway-docs-emit-2026-11-16/`;
only FAIL lines = carried F-G2 Low + the standing OPTIONAL
archive artifact). D1 read back unchanged: 142 registered / 135
serving / 7 disabled / 142 internal scopes; held atoms 0 rows,
0 scopes. Probes 73/73 PASS — Batch 22's five doc surfaces LIVE
(/docs 200, feed fields, catalogue links); doc census 200 ×135
serving, 404 ×7 disabled, 404 ×6 held; feed `documentation` on
exactly 135; takedown regression PASS. No D1 seeding, no listing
changes, no rate changes; STRIPE_MODE stayed `test`; frozen files
byte-identical.

**The fleet's public documentation is now complete for every
serving atom.** The replication program's deploy → test →
document → gate cadence stands complete for every deployed atom;
Guardian Mesh NOT RUN remains the sole standing NOT RUN class,
and the six staged-held atoms await the Director's U-13 rulings.
