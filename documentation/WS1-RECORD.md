# WS1 — Atoms documentation remediation: record

**Program:** owner finding + remediation, 2026-11-15 20:22 MST —
per-atom documentation was scaffold-grade; WS1 brings every live
atom's documentation to the AppDoc Studio methodology
(`~/workspace/appdocstudio/PRODUCT-BRIEF.md` standards table:
Diátaxis architecture, CommonMark output, role views; API-atom role
set = Integrators (Users) / Developers / Ops, plus Regulators where
the atom is compliance-facing).

**Per-atom deliverable:** `services/<atom>/DOCUMENTATION.md` —
Diátaxis set (tutorial / how-to / reference / explanation), every
check named against the recorded full-pass response, full verdict
vocabulary with meanings, full input reference with types, and
worked examples that are VERBATIM recorded trial runs (request +
REST response from `verification/work/<atom>/evidence.json`:
full-pass, violations, malformed — mechanically re-verified as JSON
values against the evidence by the coordinator). `USER-GUIDE.md`
stays the quick-start and links to `DOCUMENTATION.md`.
`TEST-REPORT.md` is evidence, referenced not rewritten.

**Scope:** the 72 externally verified live atoms (atom #1 + Batches
1–11), in batch order. Batch 12's seven join on the parent's scope
extension when Wave 7 verification lands. Batch 13+ atoms take the
docs pass as a named step before their listing counts complete.

**Catalogue link:** staged change for the Batch 13 deploy stream —
[CATALOGUE-DOC-LINK-STAGED-CHANGE.md](CATALOGUE-DOC-LINK-STAGED-CHANGE.md)
(gateway serves the docs itself via a `sync-docs.mjs` generated
module; the WS1 lane does not touch the gateway tree).

## Batch progress

(Filled per batch as workers report and the coordinator's mechanical
verbatim verification passes; commits are local, per batch, never
pushed.)

| Cohort | Atoms | Documented | Verbatim-verified (coordinator) | Commit |
|---|---|---|---|---|
| Atom #1 + Batch 1 | 7 | 7 | 7/7 (42/42 blocks) | `0ca03a0` |
| Batch 2 | 6 | 6 | 6/6 (36/36 blocks) | `863bdba` |
| Batch 3 | 6 | 6 | 6/6 (36/36 blocks) | `1122a76` |
| Batch 4 | 7 | 7 | 7/7 (42/42 blocks) | `ad02714` |
| Batches 5 + 6 | 11 | 11 | 11/11 (66/66 blocks) | `642a976` |
| Batch 7 | 7 | 7 | 7/7 (42/42 blocks) | `2543856` |
| Batch 8 | 7 | 7 | 7/7 (42/42 blocks) | `7ce35d1` |
| Batch 12 | 7 | 7 | 7/7 (42/42 blocks) | `7993d66` |
| Batch 9 | 7 | 7 | 7/7 (42/42 blocks) | `3e53086` |
| Batch 10 | 7 | 7 | 7/7 (42/42 blocks) | `47f3401` |
| Batch 11 | 7 | 7 | 7/7 (42/42 blocks) | `f7f340e` |

## Per-atom checklist results

### Batch 7 (all Diátaxis quadrants present; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| acp-protocol-integration-review | 31/31 | 3 + flavor_status | 33 | Y/Y/Y | N/A — protocol-integration design review; not compliance evidence, domain unregulated |
| agent-context-packaging | 29/29 | 3 | 32 | Y/Y/Y | N/A — packaging-soundness review; privacy-posture checks are declared-evidence checks, not a privacy attestation |
| agent-interoperability-design | 36/36 | 3 + protocol_status | 38 | Y/Y/Y | N/A — design review; "not a security audit" per SERVICE.md |
| agentic-coding-practice | 27/27 | 3 | 29 | Y/Y/Y | N/A — coding-workflow practice review |
| algorithm-design-implementation | 31/31 | 3 + design_status/scale_status | 37 | Y/Y/Y | N/A — design-record audit |
| applied-ml-validation | 35/35 | 3 + baseline_status | 38 | Y/Y/Y | N/A — ML engineering validation; licensing/consent is one declared check, verdict not a compliance certification |
| architecture-decision-record | 32/32 | 3 + computed_status | 33 | Y/Y/Y | N/A — ADR completeness audit; "not an architecture review" |

### Batch 8 (all Diátaxis quadrants present; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| argument-analysis-review | 24/24 | 3 | 25 | Y/Y/Y | N/A — reasoning-quality audit; unregulated domain |
| audience-contract-design | 26/26 | 3 | 28 | Y/Y/Y | N/A — design-record completeness audit |
| auth-design-review | 40/40 | 3 | 43 | Y/Y/Y | Y — security-design evidence (evidence-production support; doc states it is not a penetration test or certification) |
| backend-engineering-advice | 32/32 | 3 | 37 | Y/Y/Y | N/A — production-readiness completeness audit |
| base-rate-card | 23/23 | 3 | 26 | Y/Y/Y | N/A — judgment-card method check |
| behavioral-finance-bias-check | 30/30 | 3 | 34 | Y/Y/Y | N/A — finance-domain but advisory method check per SERVICE.md (not investment advice, not a diagnosis); verdict not compliance evidence |
| behavioral-finance-debiasing | 36/36 | 3 | 41 | Y/Y/Y | N/A — advisory method check per SERVICE.md (not financial advice / diagnosis / trade nudge) |

Batch 8 notes: check names systematically differ from input field names
(field `anatomy.steelman_stated` → check `steelman_stated_before_critique`);
both documented faithfully; no recorded check lacks a SERVICE.md basis.
SERVICE.md stale-status class B (see Batch 7) confirmed again in all 7.

### Batch 11 (all Diátaxis quadrants present; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| cpp-engineering-review | 34/34 | 3 | 35 | Y/Y/Y | N/A — engineering-evidence completeness review; no regulation named |
| creative-ideation-session | 24/24 | 3 | 27 | Y/Y/Y | N/A — session-record completeness audit |
| crm-pipeline-operations | 38/38 | 3 | 43 | Y/Y/Y | N/A — carries consent/privacy process declarations; verdict is an operations readiness audit, not a privacy-compliance determination |
| data-analysis-deliverable | 40/40 | 3 | 44 | Y/Y/Y | N/A — deliverable completeness audit |
| data-ml-pipeline-engineering | 46/46 | 3 | 54 | Y/Y/Y | N/A — carries a PII/lawful-basis declaration; verdict is a design-readiness audit, not a privacy-compliance determination |
| data-visualization-design | 38/38 | 3 | 44 | Y/Y/Y | N/A — carries accessibility declarations but imposes no accessibility standard (SERVICE.md declines a WCAG ratio) |
| database-design-review | 42/42 | 3 | 50 | Y/Y/Y | N/A — carries security declarations; verdict is a design-record completeness review, not a security-compliance determination |

Batch 11 semantics note (documented in the affected docs, not papered
over): no not-applicable per-check status exists in any recorded
response — conditional and vacuous checks record as `pass` with
evidence stating the gate/no-row condition. No discrepancies found:
every recorded check is described in its SERVICE.md; counts agree.

### Batch 10 (all Diátaxis quadrants present; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| cicd-pipeline-design | 36/36 | 3 | 40 | Y/Y/Y | N/A — engineering pipeline readiness judgment |
| claim-evaluation-review | 26/26 | 3 | 31 | Y/Y/Y | N/A — reviews rigour of a claim evaluation (epistemic quality); not regulatory compliance evidence |
| code-review-service | 29/29 | 3 | 35 | Y/Y/Y | N/A — engineering-process readiness judgment |
| codebase-visualization | 32/32 | 3 | 40 | Y/Y/Y | N/A — documentation-readiness judgment. NOTE: premise corrected — its responses DO carry a checks array (32); documented normally, computed outputs are extra top-level fields |
| community-support-operations | 38/38 | 3 | 43 | Y/Y/Y | N/A — operations-readiness judgment |
| confidential-computing-design | 35/35 | 3 | 38 | Y/Y/Y | Y — privacy/security design evidence (threat model, attestation, key management, claims discipline); declared-evidence-only limit stated — not a certification |
| cost-estimate-preparation | 35/35 | 3 | 48 | Y/Y/Y | N/A — verdict is preparation quality on declared evidence; estimating is not a regulated filing |

Batch 10 notes: SERVICE.md does not name most checks verbatim (6 of 7
atoms) — check names are grounded in the recorded full-pass response
(the ground-truth rule); SERVICE.md describes the requirements by
field/prose and aligns by section; no recorded check contradicts
SERVICE.md. Only claim-evaluation-review lists all 26 check names
exactly. SERVICE.md stale-status class B confirmed again in all 7
(confidential-computing-design's SERVICE.md even reads "do not
submit" against its recorded live battery).

### Batch 2 (all Diátaxis quadrants present; USER-GUIDE link added ×6)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| agent-evaluation-scorecard | 32/32 | 3 | 34 | Y/Y/Y | N/A — evaluates an internal evaluation process; not compliance evidence |
| assumption-audit | 18/18 | 3 | 19 | Y/Y/Y | N/A — decision-process audit |
| claim-verification-fact-check-stamp | 16/16 | 3 | 20 | Y/Y/Y | Y — the stamp is itself publication fact-check evidence used for content-compliance decisions |
| codebase-structural-query | N/A — computed atom, 0 recorded (no checks array); 6 intents + 4 statuses enumerated | 4 result statuses (ok / not_found / no_path / stale_index) | 7 | Y/Y/Y | N/A — computes structural answers over a submitted graph |
| condition-monitoring-triage | 19/19 | 3 (+ highest_band vocabulary) | 20 | Y/Y/Y | N/A — safety-adjacent monitoring discipline; SME makes the calls, verdict not a regulated-domain determination |
| defined-flow-auditor | 24/24 | 3 | 27 | Y/Y/Y | Y — verdict is itself security-audit evidence, incl. NIST-control naming when alignment is claimed |

Batch 2 gaps (all named in the docs):
- **claim-verification-fact-check-stamp USER-GUIDE example is WRONG
  against the recorded evidence:** the guide's worked example shows
  `primary_source: "nasa.gov"` (a string) — the exact value the
  recorded battery rejects with 422 (`claims[0].primary_source` must
  be a boolean; the F4 ruling (a) made the field boolean explicitly).
  The atom also carries a 5th recorded case (`primary-source-string`,
  malformed) — reproduced in the doc's Errors section with provenance.
  USER-GUIDE content is outside WS1's edit scope (link line only) —
  **the guide example needs a fix by the owning lane.**
- **codebase-structural-query unexercised vocabulary:** the battery
  exercised only intents `descendants` + `path` and statuses
  `ok` / `not_found`; `ancestors`, `blast_radius`, `stats`,
  `snapshot`, `no_path`, `stale_index` are documented from SERVICE.md
  definitions only — named in the doc's checklist + Reference.
- agent-evaluation-scorecard: recorded MCP inputSchema carries a
  `version` property absent from SERVICE.md and all recorded inputs —
  Input reference follows SERVICE.md; discrepancy named. (The
  violations case's expect-note error was already dispositioned in
  its TEST-REPORT.md as a tester-note error; the doc follows the
  recorded response.)

### Batch 9 (all Diátaxis quadrants present; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| bias-controlled-quant-study-pack | 34/34 | 3 (+ computed_status) | 36 | Y/Y/Y | N/A — method-completeness audit; SERVICE.md: not a research review, not compliance evidence |
| brand-mention-monitoring-triage-digest | 37/37 | 3 | 40 | Y/Y/Y | N/A — declared monitoring-setup audit; unregulated activity |
| browser-extension-engineering | 37/37 | 3 | 41 | Y/Y/Y | N/A — design-completeness audit; SERVICE.md: not a code/store review, no privacy/security certification |
| budget-design-review | 29/29 | 3 | 33 | Y/Y/Y | N/A — finance-domain but validates a declared design; SERVICE.md: not financial advice → advisory. computed_status fail-precedence documented exactly as SERVICE.md states it |
| buyer-test-card | 22/22 | 3 | 24 | Y/Y/Y | N/A — declared POC-record completeness |
| c-engineering-review | 30/30 | 3 | 31 | Y/Y/Y | N/A — declared engineering-evidence review; SERVICE.md: not a code review, no safety/compliance certification |
| cash-flow-forecast | 30/30 | 3 | 38 | Y/Y/Y | N/A — finance-domain but validates a declared artifact; SERVICE.md: no financial advice, not a forecast review → advisory |

Batch 9 notes: recorded check names govern where SERVICE.md prose
differs (e.g. budget `rolling_forecast_covers_twelve_months`);
no not-applicable per-check status exists in the recorded cases —
documented explicitly rather than inventing N/A semantics (same
finding as Batch 11).

### Batch 3 (all Diátaxis quadrants present; USER-GUIDE link added ×6)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| correctness-verification-certificate | 26/26 | 3 | 28 | Y/Y/Y | Y — verdict is a signed certificate binding claim→artifact→commit; audit evidence |
| crypto-inventory-pq-migration-map | N/A — computed map, no checks array; 5 classifications / 5 actions / counts / ordering documented | 3 statuses (complete / partial / insufficient_evidence) + classifications + actions | 8 | Y/Y/Y | Y — security-domain PQ migration inventory; FIPS 203/204/205 audit evidence |
| decision-trap-sweep | 24/24 | 3 | 27 | Y/Y/Y | N/A — decision-process quality sweep |
| distribution-equipment-rating-condition-check | 27/27 | 3 (+ rating_status) | 43 (27 rows + 16 expanded subfields from SERVICE.md prose) | Y/Y/Y | N/A — engineering check vs caller-declared limits; judgment artifact, not regulatory evidence |
| electrical-machinery-engineering-check | 38/38 | 3 | 43 | Y/Y/Y | N/A — engineering check vs declared ratings/OEM criteria |
| electrical-test-record-preparation | 41/41 | 3 (+ declared-verdict vocabulary) | 54 | Y/Y/Y | N/A — audit-supporting record readiness, but the verdict is not itself regulatory compliance evidence |

Batch 3 notes: field→check folding documented (gate fields fold into
single conditional checks; no recorded check lacks a SERVICE.md basis).
Distribution violations case: transformer checks record as `missing`
(empty `transformers[]`), verdict driven by the 2 computed rating
fails — documented in that atom's how-to. TEST-REPORT.md case tables
still carry the wave-1 F1 narrative while the latest evidence.json
records the fixed 422 behaviour — docs follow evidence.json (evidence
files are referenced, not rewritten, per the brief).

### Batch 4 (all Diátaxis quadrants present; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| finance-content-compliance-check | 32/32 | 3 | 43 | Y/Y/Y | Y — verdict is itself compliance evidence for finance-education content in a regulated domain |
| forecast-with-ranges-and-scorecard | 25/25 | 3 | 37 | Y/Y/Y | N/A — forecast-artifact readiness judgment; no regulatory claim |
| lean4-formal-proof | 26/26 | 3 | 28 | Y/Y/Y | Y — audit/assurance evidence about a formal-verification claim; doc states plainly it audits a DECLARED artifact and does not run Lean |
| link-rot-scan-and-notarized-archive | 33/33 | 3 | 44 | Y/Y/Y | Y — notarized-capture / evidence-integrity audit evidence + access-control compliance section |
| network-exposure-audit | 27/27 | 3 | 41 | Y/Y/Y | Y — security-audit evidence; declared-not-scanned limit stated |
| portfolio-risk-analytics-report | N/A — computed report, no checks array in any case; computed outputs enumerated (risk_metrics 22 keys, benchmark, concentration, carry, factor decomposition, correlations, stress tests, journal, counts, layers, gaps) | 3 statuses (complete / partial / insufficient_evidence) + layer statuses | 21 | Y/Y/Y | N/A — computed analytics with non-advisory disclaimer; SERVICE.md's named doubt "product-internal and regulated borderline" noted in the doc; Monte Carlo exclusion by design stated |
| prediction-model-leakage-calibration-audit | 27/27 | 3 | 38 | Y/Y/Y | N/A — model-quality audit of declared evidence; no regulatory claim |

Batch 4 gaps (all named in the docs):
- **Tester-expect vs recorded-response discrepancies (docs follow the
  recorded response):** network-exposure expect lists a cert-check
  fail the recorded response does not have (planted endpoint was
  plaintext, so the cert check correctly does not fail); finance
  expect lists 2 failing paths, recorded response has 3 failing
  checks; link-rot + forecast + prediction expects name sections,
  not check names. Substance matches; the expect notes are the
  tester's, and TEST-REPORTs already carry the verdicts.
- **portfolio-risk-analytics-report:** SERVICE.md defines `complete`
  as "no gaps of any kind", yet the recorded full-pass run is
  `complete` with two layers `absent` and four computed blocks `null`
  (inputs not submitted) — flagged in the doc's verdict vocabulary.
  Its USER-GUIDE.md input table is EMPTY (heading, no rows); the
  typed table comes from SERVICE.md. Guide fix is the owning lane's.
- **Computed-check count wording:** forecast SERVICE.md says "four
  checks are computed", realised as 7 named checks in the recorded
  response (prediction: "five" → 6). Docs phrase it as computed
  themes realised as named checks, counts from the recording.
- prediction-model-leakage-calibration-audit contract.yaml omits MCP
  from endpoints though MCP is live and recorded (contract gap class
  A again — see Batch 7).

### Batches 5 + 6 (all Diátaxis quadrants present; USER-GUIDE link added ×11)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| predictive-maintenance-failure-risk-assessment | 24/24 | 3 | 25 | Y/Y/Y | N/A — engineering programme assessment |
| pump-conveyor-motor-suitability-check | 26/26 | 3 (+ suitability_status) | 37 | Y/Y/Y | N/A — engineering sizing check |
| rag-retrieval-evaluation-tuning | 36/36 | 3 | 48 | Y/Y/Y | N/A — engineering evaluation; privacy is one manifest section, verdict not compliance evidence |
| reconciled-portfolio-performance-report | N/A — computed atom, no checks array; 10 computed operations/outputs enumerated | 3 (+ layers present/absent) | 14 | Y/Y/Y | Y — finance-domain reporting evidence (not advice). Empty-holdings-reconciles-to-0 semantics stated exactly: a discrepancy is a finding, not a gap |
| semantic-code-taint-analysis-report | N/A — computed atom, no checks array; 8 operations enumerated | 3 (+ tainted/sanitized/unreachable, severity table) | 8 | Y/Y/Y | N/A — code-analysis report over a declared graph. Case-shape note: its "full-pass" run's verdict is TAINTED (a correctly detected taint is the pass) and its "violations" run returns CLEAN (pair unreachable) — documented as recorded |
| strategy-backtest-validation | 36/36 | 3 (+ paper_gate_status) | 42 | Y/Y/Y | Y — validation evidence over a backtest record, finance-adjacent |
| tested-authorization-policy-pack | 29/29 | 3 (+ coverage_status) | 32 | Y/Y/Y | Y — audit evidence over an authorization policy pack |
| vfd-application-engineering-check | 37/37 | 3 (+ engineering_status) | 42 | Y/Y/Y | N/A — electrical engineering check over declared values |
| vulnerability-triage-verified-closure | 23/23 | 3 (+ closure_status, finding vocabulary) | 33 | Y/Y/Y | Y — audit evidence over a vulnerability register |
| zero-knowledge-claim-audit | 27/27 | 3 (+ claim_basis/client_type vocabulary) | 29 | Y/Y/Y | Y — privacy claim audit evidence; scope correction stated (bound skill = ZK software architecture, no proof-system facts). SERVICE.md states no types for most fields — types grounded from recorded evidence inputs + SERVICE narrative |
| zero-trust-evaluation-verdict | 26/26 | 3 (+ claim_status) | 29 | Y/Y/Y | Y — security evaluation evidence, explicitly not a certification |

Batches 5+6 gaps (all named in the docs):
- **MCP inputSchema vs recorded manifests diverge (systematic):** the
  recorded `mcp_tools` inputSchema uses section names as top-level
  properties while recorded manifests use SERVICE.md group names.
  Sharpest case: zero-trust's schema declares `findings` an ARRAY;
  the recorded manifest carries it as an OBJECT. Docs follow
  SERVICE.md + recorded inputs. (Gateway/registry-side schema fix is
  the owning lane's — named here.)
- Predictive check-name drift (recorded names differ from SERVICE.md
  field names; both forms shown). RAG violations case is sparse-like
  (3 computed fails, 33 missing). Reconciled violations response
  renders `benchmark.name` as the string "None" — reproduced verbatim.
- Error bodies refinement: the gateway's real 401 `unauthorized` /
  403 `scope_required` / 429 `rate_limit` body shapes ARE evidenced
  in `rails/gateway/src/callpath.ts` and are documented from source
  in these 11 docs; the recorded-probe gap (no battery captured them)
  still stands — see the fleet-wide gap entry.

### Batch 12 — scope extension (Wave 7 verified PASS; all Diátaxis quadrants present; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| decision-process-design | 36/36 | 3 (+ computed_status) | 50 | Y/Y/Y | N/A — process-completeness audit |
| decision-ready-research-brief | 42/42 | 3 (+ computed_status) | 50 | Y/Y/Y | N/A — research decision-readiness audit |
| delivery-plan-preparation | 38/38 | 3 (+ computed_status) | 45 | Y/Y/Y | N/A — planning-completeness audit |
| designed-test-case-pack | 30/30 | 3 (+ computed_status) | 34 | Y/Y/Y | N/A — test-design audit |
| difficult-conversation-coaching | 31/31 | 3 (+ computed_status) | 36 | Y/Y/Y | N/A — preparation-completeness audit |
| document-operations-service | 32/32 | 3 (+ computed_status) | 41 | Y/Y/Y | N/A — workmanship-completeness audit |
| domain-portfolio-audit | 44/44 | 3 (+ computed_status) | 52 | Y/Y/Y | N/A — considered edge case: audits a DECLARED operations record (no live DNS/registrar/cert verification), so not compliance/audit evidence |

Batch 12 notes: no orphan checks — recorded counts match SERVICE.md's
stated totals exactly for all 7. Error shapes documented from gateway
source (`callpath.ts`) incl. MCP-face bodies and JSON-RPC codes.
SERVICE.md stale-status class B confirmed again in all 7.

### Atom #1 + Batch 1 (all Diátaxis quadrants present; Regulators view in all 7 — audit/compliance-facing cohort; USER-GUIDE link added ×7)

| Atom | Checks doc/recorded | Verdict values | Input fields typed | Examples verbatim | Regulators |
|---|---|---|---|---|---|
| release-readiness-verdict | 19/19 | 3 (READY / NOT_READY / INSUFFICIENT_EVIDENCE) | 21 | Y/Y/Y | Y |
| agent-safety-guardrail-audit | 34/34 | 3 | 37 | Y/Y/Y | Y |
| append-only-ledger-design-audit | 29/29 | 3 | 32 | Y/Y/Y | Y |
| dependency-governance-audit | 21/21 | 3 | 25 | Y/Y/Y | Y |
| encryption-claim-audit | 28/28 | 3 | 32 | Y/Y/Y | Y |
| firewall-rules-audit | 20/20 | 3 | 32 | Y/Y/Y | Y |
| license-compliance-check | 19/19 | 3 | 28 | Y/Y/Y | Y |

Cohort gaps (all named in the docs): release-readiness
`breaking_changes`/`migration_steps` type discrepancy (SERVICE.md
declares no type; recorded full-pass carries boolean/string; MCP
inputSchema describes list forms — the F3 history; doc documents the
recorded types and flags it); agent-safety violations case is not a
full manifest (4 declared fields → 0 pass / 4 fail / 30 missing,
documented as-is); append-only-ledger money-gate asymmetry
(double-entry check passes as not-applicable, the other four money
checks report `missing`; SERVICE.md's gate note covers only the
double-entry check); field↔check folding in dependency-governance
and encryption-claim (gate fields and many-to-one mappings noted);
firewall optional rule fields unexercised in recorded runs
(documented from SERVICE.md's rule schema); license-compliance two
conditional fields absent from the full-pass by design (documented
with the reason).

## Evidence gaps named

- **ALL COHORTS (confirmed Batch 8; expected fleet-wide) — 401 / 403 /
  429 have no recorded response bodies** in any atom's evidence.json.
  Only the 422 `invalid_input` body is recorded verbatim. Docs carry
  401/403/429 as HTTP status + meaning from USER-GUIDE.md, explicitly
  flagged as unrecorded in each Errors section; no payload shapes
  invented. (Refinement from Batches 5+6: the gateway's real body
  shapes exist in `rails/gateway/src/callpath.ts` — `unauthorized` /
  `scope_required` / `rate_limit` — and those 11 docs quote them from
  source. The unrecorded-PROBE gap stands: no verification battery
  has captured a live 401/403/429 response. Closing it needs a
  recorded auth/rate-limit probe in a future verification wave —
  the verification lane's call.)
- **Batch 7, gap class A — contract.yaml `endpoints` understates live
  surfaces (5 of 7 atoms):** agent-context-packaging, agentic-coding-practice
  and algorithm-design-implementation list only `agent`; applied-ml-validation
  and architecture-decision-record list `agent` + `human`. USER-GUIDE.md and
  the recorded evidence prove REST + MCP live for all 7. DOCUMENTATION.md
  follows the evidenced surfaces. (Contract fix is the replication lane's
  file — named here, not edited by WS1.)
- **Batch 7, gap class B — SERVICE.md status stale (all 7):** every
  SERVICE.md still says "built-locally … no endpoint is live", contradicted
  by the live gateway v1.1.0 evidence. DOCUMENTATION.md carries the true
  status (live — release candidate, RC soak to 2026-11-22). SERVICE.md is
  out of WS1's edit scope — flagged for the parent/lane that owns it.
- Batch 7 field-row vs check-count differences verified as by-design
  (gate-only fields produce no check; computed checks consume several
  fields); SERVICE.md's stated check counts match recorded counts for
  all 7 — no undocumented checks found.

## N-10 readiness (process binding, owner ruling 2026-11-15 20:40 MST)

Checklist line: **N-10** (`corporate/processes/product-documentation.md`)
— user-facing guides follow the AppDoc Studio methodology: Diátaxis
structure, role views for the audiences the product actually has,
worked examples that are REAL RECORDED RUNS (inputs and outputs
verbatim from verification evidence), provenance named per example.
Summary-only description is a FAIL state.

**Readiness counts (79 live atoms in scope):**

| State | Count |
|---|---|
| N-10 PROVEN (full set filed per atom; worked examples mechanically re-verified verbatim by the coordinator: 474/474 blocks across 79 atoms) | **79** |
| N-10 OPEN (per-atom set incomplete) | **0** |
| N-10 WAIVED | **0** |
| N-10 NOT RUN | **0 in scope** — stated explicitly: Batch 13's seven staged atoms are NOT RUN for WS1 (not yet live; their docs pass is a named step before their listings count complete) |

**Per-atom N-10 verdict: PASS ×79** (atom list = the per-batch
checklist tables above; checks documented/recorded, verdict
vocabulary, typed input fields, and verbatim Y/Y/Y example columns
are the per-atom evidence).

**Worked-example provenance (named per example in every doc):**
each atom's three worked examples are the recorded cases
`full-pass`, `violations`, `malformed` from
`verification/work/<atom>/evidence.json` — the external verification
lane's battery against the live gateway; each doc's Worked examples
section carries the provenance line (recorded timestamp, gateway
version, source file). Per-atom recording provenance:

| Atom | Recorded (UTC) | Gateway |
|---|---|---|
| acp-protocol-integration-review | 2026-11-15T23:51:58.696662+00:00 | gateway v1.1.0 |
| agent-context-packaging | 2026-11-15T23:56:03.993588+00:00 | gateway v1.1.0 |
| agent-evaluation-scorecard | 2026-11-15T23:52:08.413337+00:00 | gateway v1.1.0 |
| agent-interoperability-design | 2026-11-15T23:59:26.168368+00:00 | gateway v1.1.0 |
| agent-safety-guardrail-audit | 2026-11-15T23:52:20.777333+00:00 | gateway v1.1.0 |
| agentic-coding-practice | 2026-11-16T00:01:51.397569+00:00 | gateway v1.1.0 |
| algorithm-design-implementation | 2026-11-15T23:51:30.770590+00:00 | gateway v1.1.0 |
| append-only-ledger-design-audit | 2026-11-15T23:54:03.899990+00:00 | gateway v1.1.0 |
| applied-ml-validation | 2026-11-15T23:57:53.660257+00:00 | gateway v1.1.0 |
| architecture-decision-record | 2026-11-16T00:02:12.128302+00:00 | gateway v1.1.0 |
| argument-analysis-review | 2026-11-16T00:43:12.360253+00:00 | gateway v1.1.0 |
| assumption-audit | 2026-11-15T23:53:33.776739+00:00 | gateway v1.1.0 |
| audience-contract-design | 2026-11-16T00:44:25.779459+00:00 | gateway v1.1.0 |
| auth-design-review | 2026-11-16T00:45:05.394321+00:00 | gateway v1.1.0 |
| backend-engineering-advice | 2026-11-16T00:43:21.623705+00:00 | gateway v1.1.0 |
| base-rate-card | 2026-11-16T00:43:46.452334+00:00 | gateway v1.1.0 |
| behavioral-finance-bias-check | 2026-11-16T00:43:49.204353+00:00 | gateway v1.1.0 |
| behavioral-finance-debiasing | 2026-11-16T00:44:11.512359+00:00 | gateway v1.1.0 |
| bias-controlled-quant-study-pack | 2026-11-16T01:18:09.384325+00:00 | gateway v1.1.0 |
| brand-mention-monitoring-triage-digest | 2026-11-16T01:19:17.861099+00:00 | gateway v1.1.0 |
| browser-extension-engineering | 2026-11-16T01:18:52.566235+00:00 | gateway v1.1.0 |
| budget-design-review | 2026-11-16T01:32:23.660221+00:00 | gateway v1.1.0 |
| buyer-test-card | 2026-11-16T01:18:27.465674+00:00 | gateway v1.1.0 |
| c-engineering-review | 2026-11-16T01:18:12.084097+00:00 | gateway v1.1.0 |
| cash-flow-forecast | 2026-11-16T01:21:59.564171+00:00 | gateway v1.1.0 |
| cicd-pipeline-design | 2026-11-16T02:00:55.962679+00:00 | gateway v1.1.0 |
| claim-evaluation-review | 2026-11-16T02:00:53.386692+00:00 | gateway v1.1.0 |
| claim-verification-fact-check-stamp | 2026-11-16T00:43:04.830422+00:00 | gateway v1.1.0 |
| code-review-service | 2026-11-16T02:00:44.355286+00:00 | gateway v1.1.0 |
| codebase-structural-query | 2026-11-15T23:49:58.778183+00:00 | gateway v1.1.0 |
| codebase-visualization | 2026-11-16T02:00:27.455816+00:00 | gateway v1.1.0 |
| community-support-operations | 2026-11-16T02:00:12.639737+00:00 | gateway v1.1.0 |
| condition-monitoring-triage | 2026-11-15T23:56:07.774356+00:00 | gateway v1.1.0 |
| confidential-computing-design | 2026-11-16T02:00:48.684613+00:00 | gateway v1.1.0 |
| correctness-verification-certificate | 2026-11-15T23:51:12.763343+00:00 | gateway v1.1.0 |
| cost-estimate-preparation | 2026-11-16T02:00:57.377313+00:00 | gateway v1.1.0 |
| cpp-engineering-review | 2026-11-16T02:43:48.397605+00:00 | gateway v1.1.0 |
| creative-ideation-session | 2026-11-16T02:44:23.807330+00:00 | gateway v1.1.0 |
| crm-pipeline-operations | 2026-11-16T02:44:00.657096+00:00 | gateway v1.1.0 |
| crypto-inventory-pq-migration-map | 2026-11-15T23:52:38.309356+00:00 | gateway v1.1.0 |
| data-analysis-deliverable | 2026-11-16T02:43:03.804596+00:00 | gateway v1.1.0 |
| data-ml-pipeline-engineering | 2026-11-16T02:44:00.806685+00:00 | gateway v1.1.0 |
| data-visualization-design | 2026-11-16T02:44:03.758233+00:00 | gateway v1.1.0 |
| database-design-review | 2026-11-16T02:43:55.180625+00:00 | gateway v1.1.0 |
| decision-process-design | 2026-11-16T03:28:08.284482+00:00 | gateway v1.1.0 |
| decision-ready-research-brief | 2026-11-16T03:28:16.846496+00:00 | gateway v1.1.0 |
| decision-trap-sweep | 2026-11-15T23:52:28.162829+00:00 | gateway v1.1.0 |
| defined-flow-auditor | 2026-11-15T23:57:26.442338+00:00 | gateway v1.1.0 |
| delivery-plan-preparation | 2026-11-16T03:29:08.588468+00:00 | gateway v1.1.0 |
| dependency-governance-audit | 2026-11-15T23:56:06.311339+00:00 | gateway v1.1.0 |
| designed-test-case-pack | 2026-11-16T03:29:31.287305+00:00 | gateway v1.1.0 |
| difficult-conversation-coaching | 2026-11-16T03:29:45.995467+00:00 | gateway v1.1.0 |
| distribution-equipment-rating-condition-check | 2026-11-15T23:53:55.491375+00:00 | gateway v1.1.0 |
| document-operations-service | 2026-11-16T03:30:02.269601+00:00 | gateway v1.1.0 |
| domain-portfolio-audit | 2026-11-16T03:30:37.282481+00:00 | gateway v1.1.0 |
| electrical-machinery-engineering-check | 2026-11-15T23:55:26.502067+00:00 | gateway v1.1.0 |
| electrical-test-record-preparation | 2026-11-15T23:56:30.661945+00:00 | gateway v1.1.0 |
| encryption-claim-audit | 2026-11-15T23:57:32.303331+00:00 | gateway v1.1.0 |
| finance-content-compliance-check | 2026-11-15T23:57:40.882345+00:00 | gateway v1.1.0 |
| firewall-rules-audit | 2026-11-15T23:59:33.075358+00:00 | gateway v1.1.0 |
| forecast-with-ranges-and-scorecard | 2026-11-15T23:49:15.081373+00:00 | gateway v1.1.0 |
| lean4-formal-proof | 2026-11-15T23:51:47.966841+00:00 | gateway v1.1.0 |
| license-compliance-check | 2026-11-15T23:50:32.222342+00:00 | gateway v1.1.0 |
| link-rot-scan-and-notarized-archive | 2026-11-15T23:53:47.280450+00:00 | gateway v1.1.0 |
| network-exposure-audit | 2026-11-15T23:56:03.416977+00:00 | gateway v1.1.0 |
| portfolio-risk-analytics-report | 2026-11-15T23:53:46.382331+00:00 | gateway v1.1.0 |
| prediction-model-leakage-calibration-audit | 2026-11-15T23:57:56.668655+00:00 | gateway v1.1.0 |
| predictive-maintenance-failure-risk-assessment | 2026-11-15T23:59:40.560259+00:00 | gateway v1.1.0 |
| pump-conveyor-motor-suitability-check | 2026-11-15T23:54:36.491012+00:00 | gateway v1.1.0 |
| rag-retrieval-evaluation-tuning | 2026-11-15T23:55:44.081438+00:00 | gateway v1.1.0 |
| reconciled-portfolio-performance-report | 2026-11-15T23:56:28.690961+00:00 | gateway v1.1.0 |
| release-readiness-verdict | 2026-11-16T00:42:41.829362+00:00 | gateway v1.1.0 |
| semantic-code-taint-analysis-report | 2026-11-15T23:51:44.782658+00:00 | gateway v1.1.0 |
| strategy-backtest-validation | 2026-11-15T23:50:14.990445+00:00 | gateway v1.1.0 |
| tested-authorization-policy-pack | 2026-11-15T23:51:55.166579+00:00 | gateway v1.1.0 |
| vfd-application-engineering-check | 2026-11-15T23:52:43.798032+00:00 | gateway v1.1.0 |
| vulnerability-triage-verified-closure | 2026-11-15T23:53:50.813622+00:00 | gateway v1.1.0 |
| zero-knowledge-claim-audit | 2026-11-15T23:55:56.371091+00:00 | gateway v1.1.0 |
| zero-trust-evaluation-verdict | 2026-11-15T23:54:40.487423+00:00 | gateway v1.1.0 |
**Named OPEN items (not per-atom N-10 fails; each is filed above in
its batch section and belongs to the named lane):**
1. claim-verification-fact-check-stamp USER-GUIDE worked example
   contradicts the recorded evidence (string `primary_source` where
   the live battery 422s it) — guide-content fix, owning lane.
2. codebase-structural-query: 4 intents + 2 statuses no recorded run
   demonstrates — documented from SERVICE.md and NAMED as
   unexercised in the doc (never presented as runs); evidence
   completion is a verification-lane item.
3. No verification battery has captured a live 401/403/429 response
   body; docs quote the gateway's source-evidenced shapes
   (`callpath.ts`) where used — recorded-probe completion is a
   verification-lane item.
4. SERVICE.md stale status + contract.yaml endpoints understatement
   across cohorts — owning (replication) lane's files; docs follow
   the evidenced state throughout.
