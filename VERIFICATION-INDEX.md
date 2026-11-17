# External verification index — Conduit Atoms

Independent external testing of the live atoms at
https://atoms.pipavia.com (Academy Tester Doctrine, 2026-10-25: the
tester is never the builder; corrections follow findings; loop until
pass).

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house
`custom.gemini` connector — case design + output judgment.
**Second tester:** DeepSeek on computed-value atoms (12 atoms
this wave: codebase-structural-query, crypto-inventory-pq-migration-map, portfolio-risk-analytics-report, pump-conveyor-motor-suitability-check, rag-retrieval-evaluation-tuning, reconciled-portfolio-performance-report, semantic-code-taint-analysis-report, strategy-backtest-validation, tested-authorization-policy-pack, vfd-application-engineering-check, vulnerability-triage-verified-closure, zero-trust-evaluation-verdict); verdict agreement with Gemini 12/12, and it
raised the wave's only non-systemic finding (reconciled-portfolio F2).
**Execution:** verification harness (`verification/harness.py`) making
real HTTP calls; raw evidence per atom in `verification/work/<atom>/`.
**Tester identity:** `external-verification@aimlds.org`, gateway key
`atm_1_ac543f43d09d66…` (last-4 `b1a2`), **non-internal** — key auth,
scope fence and external metering all exercised as a real customer
(282 external usage rows recorded for the wave, 0 internal — D1 count re-verified at wave close).
**Key issuance note:** the key itself was issued through the real
`POST /v1/keys` endpoint with per-atom scopes. The session behind it
was seeded directly in D1 in the gateway's session format because the
tester address has no readable mailbox for the magic-link leg of the
public signup; if a readable mailbox is ever provided for the tester
identity, the full public signup path will be used instead.
**Gateway under test:** atoms-gateway v1.1.0.

## Wave 1 — 2026-11-15 — all 37 live atoms

**Result: 2 PASS / 35 FAIL.** Every FAIL except one finding
is a single systemic defect (F1 class, below). Core verdict logic,
check-level correctness, computed values, determinism (byte-identical
repeat calls) and MCP↔REST parity passed on **all 37 atoms**.
Tester errors caught and corrected during the wave: 12 — none was
recorded as an atom failure.

| Atom | Verdict | Findings | 2nd tester | Tested | Report | Guide |
|---|---|---|---|---|---|---|
| agent-evaluation-scorecard | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/agent-evaluation-scorecard/TEST-REPORT.md) | [USER-GUIDE.md](services/agent-evaluation-scorecard/USER-GUIDE.md) |
| agent-safety-guardrail-audit | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict (NOT_GUARDED) instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/agent-safety-guardrail-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/agent-safety-guardrail-audit/USER-GUIDE.md) |
| append-only-ledger-design-audit | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict (INSUFFICIENT_EVIDENCE) instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/append-only-ledger-design-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/append-only-ledger-design-audit/USER-GUIDE.md) |
| assumption-audit | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/assumption-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/assumption-audit/USER-GUIDE.md) |
| claim-verification-fact-check-stamp | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/claim-verification-fact-check-stamp/TEST-REPORT.md) | [USER-GUIDE.md](services/claim-verification-fact-check-stamp/USER-GUIDE.md) |
| codebase-structural-query | **PASS** | — | deepseek | 2026-11-15 | [TEST-REPORT.md](services/codebase-structural-query/TEST-REPORT.md) | [USER-GUIDE.md](services/codebase-structural-query/USER-GUIDE.md) |
| condition-monitoring-triage | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/condition-monitoring-triage/TEST-REPORT.md) | [USER-GUIDE.md](services/condition-monitoring-triage/USER-GUIDE.md) |
| correctness-verification-certificate | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/correctness-verification-certificate/TEST-REPORT.md) | [USER-GUIDE.md](services/correctness-verification-certificate/USER-GUIDE.md) |
| crypto-inventory-pq-migration-map | **FAIL** | F1: type-violating manifest fields return HTTP 200 status instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/crypto-inventory-pq-migration-map/TEST-REPORT.md) | [USER-GUIDE.md](services/crypto-inventory-pq-migration-map/USER-GUIDE.md) |
| decision-trap-sweep | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/decision-trap-sweep/TEST-REPORT.md) | [USER-GUIDE.md](services/decision-trap-sweep/USER-GUIDE.md) |
| defined-flow-auditor | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/defined-flow-auditor/TEST-REPORT.md) | [USER-GUIDE.md](services/defined-flow-auditor/USER-GUIDE.md) |
| dependency-governance-audit | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict (NOT_GOVERNED) instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/dependency-governance-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/dependency-governance-audit/USER-GUIDE.md) |
| distribution-equipment-rating-condition-check | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/distribution-equipment-rating-condition-check/TEST-REPORT.md) | [USER-GUIDE.md](services/distribution-equipment-rating-condition-check/USER-GUIDE.md) |
| electrical-machinery-engineering-check | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/electrical-machinery-engineering-check/TEST-REPORT.md) | [USER-GUIDE.md](services/electrical-machinery-engineering-check/USER-GUIDE.md) |
| electrical-test-record-preparation | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/electrical-test-record-preparation/TEST-REPORT.md) | [USER-GUIDE.md](services/electrical-test-record-preparation/USER-GUIDE.md) |
| encryption-claim-audit | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict (INSUFFICIENT_EVIDENCE) instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/encryption-claim-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/encryption-claim-audit/USER-GUIDE.md) |
| finance-content-compliance-check | **FAIL** | F1: type-violating input returns HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/finance-content-compliance-check/TEST-REPORT.md) | [USER-GUIDE.md](services/finance-content-compliance-check/USER-GUIDE.md) |
| firewall-rules-audit | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict (UNSOUND) instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/firewall-rules-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/firewall-rules-audit/USER-GUIDE.md) |
| forecast-with-ranges-and-scorecard | **FAIL** | F1: type-violating input returns HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/forecast-with-ranges-and-scorecard/TEST-REPORT.md) | [USER-GUIDE.md](services/forecast-with-ranges-and-scorecard/USER-GUIDE.md) |
| lean4-formal-proof | **FAIL** | F1: type-violating input returns HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/lean4-formal-proof/TEST-REPORT.md) | [USER-GUIDE.md](services/lean4-formal-proof/USER-GUIDE.md) |
| license-compliance-check | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict (NON_COMPLIANT) instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/license-compliance-check/TEST-REPORT.md) | [USER-GUIDE.md](services/license-compliance-check/USER-GUIDE.md) |
| link-rot-scan-and-notarized-archive | **FAIL** | F1: type-violating input returns HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/link-rot-scan-and-notarized-archive/TEST-REPORT.md) | [USER-GUIDE.md](services/link-rot-scan-and-notarized-archive/USER-GUIDE.md) |
| network-exposure-audit | **FAIL** | F1: type-violating input returns HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/network-exposure-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/network-exposure-audit/USER-GUIDE.md) |
| portfolio-risk-analytics-report | **FAIL** | F1: type-violating input returns HTTP 200 status instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/portfolio-risk-analytics-report/TEST-REPORT.md) | [USER-GUIDE.md](services/portfolio-risk-analytics-report/USER-GUIDE.md) |
| prediction-model-leakage-calibration-audit | **FAIL** | F1: type-violating input returns HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/prediction-model-leakage-calibration-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/prediction-model-leakage-calibration-audit/USER-GUIDE.md) |
| predictive-maintenance-failure-risk-assessment | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/predictive-maintenance-failure-risk-assessment/TEST-REPORT.md) | [USER-GUIDE.md](services/predictive-maintenance-failure-risk-assessment/USER-GUIDE.md) |
| pump-conveyor-motor-suitability-check | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/pump-conveyor-motor-suitability-check/TEST-REPORT.md) | [USER-GUIDE.md](services/pump-conveyor-motor-suitability-check/USER-GUIDE.md) |
| rag-retrieval-evaluation-tuning | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/rag-retrieval-evaluation-tuning/TEST-REPORT.md) | [USER-GUIDE.md](services/rag-retrieval-evaluation-tuning/USER-GUIDE.md) |
| reconciled-portfolio-performance-report | **FAIL** | F1: type-violating manifest fields return HTTP 200 report instead of 422 invalid_input; F2: declared empty holdings ledger (holdings: []) treated as absent — holdings_vs_declared_value nulled instead of printing difference -1210.000000 / fraction -1.000000 | deepseek | 2026-11-15 | [TEST-REPORT.md](services/reconciled-portfolio-performance-report/TEST-REPORT.md) | [USER-GUIDE.md](services/reconciled-portfolio-performance-report/USER-GUIDE.md) |
| release-readiness-verdict | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/release-readiness-verdict/TEST-REPORT.md) | [USER-GUIDE.md](services/release-readiness-verdict/USER-GUIDE.md) |
| semantic-code-taint-analysis-report | **PASS** | — | deepseek | 2026-11-15 | [TEST-REPORT.md](services/semantic-code-taint-analysis-report/TEST-REPORT.md) | [USER-GUIDE.md](services/semantic-code-taint-analysis-report/USER-GUIDE.md) |
| strategy-backtest-validation | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/strategy-backtest-validation/TEST-REPORT.md) | [USER-GUIDE.md](services/strategy-backtest-validation/USER-GUIDE.md) |
| tested-authorization-policy-pack | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/tested-authorization-policy-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/tested-authorization-policy-pack/USER-GUIDE.md) |
| vfd-application-engineering-check | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/vfd-application-engineering-check/TEST-REPORT.md) | [USER-GUIDE.md](services/vfd-application-engineering-check/USER-GUIDE.md) |
| vulnerability-triage-verified-closure | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/vulnerability-triage-verified-closure/TEST-REPORT.md) | [USER-GUIDE.md](services/vulnerability-triage-verified-closure/USER-GUIDE.md) |
| zero-knowledge-claim-audit | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | — | 2026-11-15 | [TEST-REPORT.md](services/zero-knowledge-claim-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/zero-knowledge-claim-audit/USER-GUIDE.md) |
| zero-trust-evaluation-verdict | **FAIL** | F1: type-violating manifest fields return HTTP 200 verdict instead of 422 invalid_input | deepseek | 2026-11-15 | [TEST-REPORT.md](services/zero-trust-evaluation-verdict/TEST-REPORT.md) | [USER-GUIDE.md](services/zero-trust-evaluation-verdict/USER-GUIDE.md) |

## The F1 defect class (systemic)

35 of 37 atoms fail exactly one case: a manifest whose fields carry
wrong JSON types (a string where an object/list/boolean is required, a
number where a string is required) returns **HTTP 200 with a verdict
computed over the garbage values** instead of the gateway's clean
input error, **HTTP 422 `invalid_input`**. The two atoms that validate
input types in their handlers (`codebase-structural-query`,
`semantic-code-taint-analysis-report`) return 422 correctly and are
the wave's two PASSes — the gateway mechanism works; the manifest-atom
handlers do not use it. One remedy shape covers the class; per-atom
fix specs are in `verification/FIX-SPECS.md`. Retest on redeploy: the
malformed case must return 422 and the other five cases must still
pass; an atom's verdict flips to PASS when both hold.

## Wave boundary

Wave 1 covers all 37 atoms live at wave close: the 31 live at wave
start (2026-11-15 ~14:57 MST) plus the six Batch 6 atoms that deployed
during the wave (strategy-backtest-validation,
tested-authorization-policy-pack, vfd-application-engineering-check,
vulnerability-triage-verified-closure, zero-knowledge-claim-audit,
zero-trust-evaluation-verdict) — the tester key already held their
scopes (37 total) and they were tested the same day to the identical
standard (DeepSeek second reads on the five computed ones). Wave 2's
scope is retests of every atom fixed from this wave's fix specs,
together with any atoms deployed after this wave.

## Retest wave — 2026-11-15 — all 44 live atoms

Triggered by the fix-stream deploy (deployment
`7f9cae9fdd60417eb72062905a066554`, gateway v1.1.0). Scope: retest of
all 37 Wave 1 atoms on their **recorded, unchanged** batteries, plus
first tests of Batch 7's seven atoms (Gemini-designed cases, same
standard). Tester key scopes were extended to all 44 atoms before the
wave (same key, `atm_1_ac543f43d09d66…`, last-4 `b1a2`). Wave 1 evidence
is preserved per atom as `verification/work/<atom>/evidence-wave1.json`
and `judgment-wave1.json`; `evidence.json` / `judgment.json` now hold
the retest run. DeepSeek second reads ran on the 12 computed Wave 1
atoms plus applied-ml-validation (13 atoms); agreement with Gemini on
every computed quantity and every verdict, except one DeepSeek headline
on vulnerability-triage-verified-closure that its own recomputation
contradicted (dispositioned as a tester error — see below).

**Result: 42 PASS / 2 FAIL.** Of the 37 retested atoms, 35 flipped
FAIL → PASS: **F1 is closed** on all 35 (malformed case → HTTP 422
`invalid_input` naming the field; full-pass, violations, sparse,
determinism and parity all green). **F2 is closed** on
reconciled-portfolio-performance-report — the declared-empty-holdings
case now prints difference `-1210.000000` / fraction `-1.000000`
(mechanically verified from the raw response; DeepSeek recomputed the
same leg independently). The two Wave 1 PASSes held. All seven Batch 7
atoms PASS at first test — they were built with type validation from
the start, and their malformed cases return 422.

The two FAILs are both in the fix's own validation layer:

- **release-readiness-verdict — F3 (fix regression):** the fix demands
  a list for `release_notes.breaking_changes`; SERVICE.md declares no
  type for the field, and the recorded manifests' `false` value —
  HTTP 200 `READY`/`NOT_READY` in Wave 1 — now returns 422, breaking
  full-pass, violations and parity. Fix spec F3 in
  `verification/FIX-SPECS.md`.
- **claim-verification-fact-check-stamp — F4 (contested):** the
  recorded cases carry `claims[].primary_source` as URL strings; the
  fix rejects them as non-boolean. SERVICE.md's blanket rule ("All
  fields are booleans unless noted", this field unnoted) and the
  boolean-flag check logic support the fix — the recorded cases are
  arguably Wave 1 tester-design errors the pre-fix atom's tolerance
  masked. The wave verdict stays FAIL on the recorded battery; fix spec
  F4 routes the decision (declare the boolean explicitly + redesigned
  cases, recommended; or declare the field a string + relax
  validation).

**Tester errors this wave: 10** — none recorded as an atom failure.
Four were Batch 7 design-time case defects (Gemini nested fields under
the wrong section on acp-protocol-integration-review and
agent-context-packaging; a non-vocabulary method value on
algorithm-design-implementation; an omitted must-be-false field on
architecture-decision-record), corrected before execution. Four were
judgment-stage: Gemini's self-contradictory finding/tester-error pair
on release-readiness-verdict (its tester-error claim rejected on Wave 1
evidence); Gemini's two internally contradictory entries on
claim-verification-fact-check-stamp (named, not used to override the
recorded battery); DeepSeek's vulnerability-triage headline FAIL,
contradicted by its own all-matching recomputation (the extra failing
check follows from the planted values inside an expected failing
section). Two were carry-over re-flags on codebase-structural-query of
Wave 1 tester errors already corrected in the recorded cases.

| Atom | Verdict | Wave 1 | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| release-readiness-verdict | **FAIL** | FAIL | F1 closed for malformed (422 invalid_input, field: product), but fix-stream regression: recorded full-pass and violations manifests now return 422 invalid_input on release_notes.breaking_changes (must be a list) instead of 200 READY / NOT_READY — previously-valid Wave 1 inputs rejected; Full-pass MCP/REST parity fails (parity_structured_equal=false; MCP JSON-RPC -32602 validation error, no structuredContent) | — | [TEST-REPORT.md](services/release-readiness-verdict/TEST-REPORT.md) | [USER-GUIDE.md](services/release-readiness-verdict/USER-GUIDE.md) |
| agent-safety-guardrail-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/agent-safety-guardrail-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/agent-safety-guardrail-audit/USER-GUIDE.md) |
| append-only-ledger-design-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/append-only-ledger-design-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/append-only-ledger-design-audit/USER-GUIDE.md) |
| dependency-governance-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/dependency-governance-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/dependency-governance-audit/USER-GUIDE.md) |
| encryption-claim-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/encryption-claim-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/encryption-claim-audit/USER-GUIDE.md) |
| firewall-rules-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/firewall-rules-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/firewall-rules-audit/USER-GUIDE.md) |
| license-compliance-check | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/license-compliance-check/TEST-REPORT.md) | [USER-GUIDE.md](services/license-compliance-check/USER-GUIDE.md) |
| agent-evaluation-scorecard | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/agent-evaluation-scorecard/TEST-REPORT.md) | [USER-GUIDE.md](services/agent-evaluation-scorecard/USER-GUIDE.md) |
| assumption-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/assumption-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/assumption-audit/USER-GUIDE.md) |
| claim-verification-fact-check-stamp | **FAIL** | FAIL | Full-pass and violations return HTTP 422 invalid_input on claims[0].primary_source instead of HTTP 200 STAMPED / NOT_STAMPED; parity_structured_equal=false (determinism_byte_identical=true, of the 422 responses) | — | [TEST-REPORT.md](services/claim-verification-fact-check-stamp/TEST-REPORT.md) | [USER-GUIDE.md](services/claim-verification-fact-check-stamp/USER-GUIDE.md) |
| codebase-structural-query | **PASS** | PASS | — | deepseek | [TEST-REPORT.md](services/codebase-structural-query/TEST-REPORT.md) | [USER-GUIDE.md](services/codebase-structural-query/USER-GUIDE.md) |
| condition-monitoring-triage | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/condition-monitoring-triage/TEST-REPORT.md) | [USER-GUIDE.md](services/condition-monitoring-triage/USER-GUIDE.md) |
| defined-flow-auditor | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/defined-flow-auditor/TEST-REPORT.md) | [USER-GUIDE.md](services/defined-flow-auditor/USER-GUIDE.md) |
| correctness-verification-certificate | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/correctness-verification-certificate/TEST-REPORT.md) | [USER-GUIDE.md](services/correctness-verification-certificate/USER-GUIDE.md) |
| crypto-inventory-pq-migration-map | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/crypto-inventory-pq-migration-map/TEST-REPORT.md) | [USER-GUIDE.md](services/crypto-inventory-pq-migration-map/USER-GUIDE.md) |
| decision-trap-sweep | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/decision-trap-sweep/TEST-REPORT.md) | [USER-GUIDE.md](services/decision-trap-sweep/USER-GUIDE.md) |
| distribution-equipment-rating-condition-check | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/distribution-equipment-rating-condition-check/TEST-REPORT.md) | [USER-GUIDE.md](services/distribution-equipment-rating-condition-check/USER-GUIDE.md) |
| electrical-machinery-engineering-check | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/electrical-machinery-engineering-check/TEST-REPORT.md) | [USER-GUIDE.md](services/electrical-machinery-engineering-check/USER-GUIDE.md) |
| electrical-test-record-preparation | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/electrical-test-record-preparation/TEST-REPORT.md) | [USER-GUIDE.md](services/electrical-test-record-preparation/USER-GUIDE.md) |
| finance-content-compliance-check | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/finance-content-compliance-check/TEST-REPORT.md) | [USER-GUIDE.md](services/finance-content-compliance-check/USER-GUIDE.md) |
| forecast-with-ranges-and-scorecard | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/forecast-with-ranges-and-scorecard/TEST-REPORT.md) | [USER-GUIDE.md](services/forecast-with-ranges-and-scorecard/USER-GUIDE.md) |
| lean4-formal-proof | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/lean4-formal-proof/TEST-REPORT.md) | [USER-GUIDE.md](services/lean4-formal-proof/USER-GUIDE.md) |
| link-rot-scan-and-notarized-archive | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/link-rot-scan-and-notarized-archive/TEST-REPORT.md) | [USER-GUIDE.md](services/link-rot-scan-and-notarized-archive/USER-GUIDE.md) |
| network-exposure-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/network-exposure-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/network-exposure-audit/USER-GUIDE.md) |
| portfolio-risk-analytics-report | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/portfolio-risk-analytics-report/TEST-REPORT.md) | [USER-GUIDE.md](services/portfolio-risk-analytics-report/USER-GUIDE.md) |
| prediction-model-leakage-calibration-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/prediction-model-leakage-calibration-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/prediction-model-leakage-calibration-audit/USER-GUIDE.md) |
| predictive-maintenance-failure-risk-assessment | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/predictive-maintenance-failure-risk-assessment/TEST-REPORT.md) | [USER-GUIDE.md](services/predictive-maintenance-failure-risk-assessment/USER-GUIDE.md) |
| pump-conveyor-motor-suitability-check | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/pump-conveyor-motor-suitability-check/TEST-REPORT.md) | [USER-GUIDE.md](services/pump-conveyor-motor-suitability-check/USER-GUIDE.md) |
| rag-retrieval-evaluation-tuning | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/rag-retrieval-evaluation-tuning/TEST-REPORT.md) | [USER-GUIDE.md](services/rag-retrieval-evaluation-tuning/USER-GUIDE.md) |
| reconciled-portfolio-performance-report | **PASS** | FAIL | F1 closed; F2 closed — holdings leg prints difference -1210.000000 / fraction -1.000000 | deepseek | [TEST-REPORT.md](services/reconciled-portfolio-performance-report/TEST-REPORT.md) | [USER-GUIDE.md](services/reconciled-portfolio-performance-report/USER-GUIDE.md) |
| semantic-code-taint-analysis-report | **PASS** | PASS | — | deepseek | [TEST-REPORT.md](services/semantic-code-taint-analysis-report/TEST-REPORT.md) | [USER-GUIDE.md](services/semantic-code-taint-analysis-report/USER-GUIDE.md) |
| strategy-backtest-validation | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/strategy-backtest-validation/TEST-REPORT.md) | [USER-GUIDE.md](services/strategy-backtest-validation/USER-GUIDE.md) |
| tested-authorization-policy-pack | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/tested-authorization-policy-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/tested-authorization-policy-pack/USER-GUIDE.md) |
| vfd-application-engineering-check | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/vfd-application-engineering-check/TEST-REPORT.md) | [USER-GUIDE.md](services/vfd-application-engineering-check/USER-GUIDE.md) |
| vulnerability-triage-verified-closure | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/vulnerability-triage-verified-closure/TEST-REPORT.md) | [USER-GUIDE.md](services/vulnerability-triage-verified-closure/USER-GUIDE.md) |
| zero-knowledge-claim-audit | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | — | [TEST-REPORT.md](services/zero-knowledge-claim-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/zero-knowledge-claim-audit/USER-GUIDE.md) |
| zero-trust-evaluation-verdict | **PASS** | FAIL | F1 closed — malformed now 422 invalid_input | deepseek | [TEST-REPORT.md](services/zero-trust-evaluation-verdict/TEST-REPORT.md) | [USER-GUIDE.md](services/zero-trust-evaluation-verdict/USER-GUIDE.md) |
| acp-protocol-integration-review | **PASS** | — (first test) | — | — | [TEST-REPORT.md](services/acp-protocol-integration-review/TEST-REPORT.md) | [USER-GUIDE.md](services/acp-protocol-integration-review/USER-GUIDE.md) |
| agent-context-packaging | **PASS** | — (first test) | — | — | [TEST-REPORT.md](services/agent-context-packaging/TEST-REPORT.md) | [USER-GUIDE.md](services/agent-context-packaging/USER-GUIDE.md) |
| agent-interoperability-design | **PASS** | — (first test) | — | — | [TEST-REPORT.md](services/agent-interoperability-design/TEST-REPORT.md) | [USER-GUIDE.md](services/agent-interoperability-design/USER-GUIDE.md) |
| agentic-coding-practice | **PASS** | — (first test) | — | — | [TEST-REPORT.md](services/agentic-coding-practice/TEST-REPORT.md) | [USER-GUIDE.md](services/agentic-coding-practice/USER-GUIDE.md) |
| algorithm-design-implementation | **PASS** | — (first test) | — | — | [TEST-REPORT.md](services/algorithm-design-implementation/TEST-REPORT.md) | [USER-GUIDE.md](services/algorithm-design-implementation/USER-GUIDE.md) |
| applied-ml-validation | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/applied-ml-validation/TEST-REPORT.md) | [USER-GUIDE.md](services/applied-ml-validation/USER-GUIDE.md) |
| architecture-decision-record | **PASS** | — (first test) | — | — | [TEST-REPORT.md](services/architecture-decision-record/TEST-REPORT.md) | [USER-GUIDE.md](services/architecture-decision-record/USER-GUIDE.md) |

## Wave 3 — 2026-11-15 — 9 atoms (2 retests + Batch 8 first tests)

Triggered by the fix-round-2 + Batch 8 deploy (deployment
`babe764a73734f93a8016267e77af193`, gateway v1.1.0; 51 atoms live).
Scope: retest of the retest wave's two FAILs — release-readiness-verdict
on its **recorded battery unchanged** (the F3 pass marks), and
claim-verification-fact-check-stamp on a **redesigned battery** under
the F4 ruling (option (a)) — plus first tests of Batch 8's seven atoms
(Gemini-designed cases, same standard). Tester key scopes were extended
to all 51 live atoms before the wave (same key,
`atm_1_ac543f43d09d66…`, last-4 `b1a2`). DeepSeek second reads ran on
all seven Batch 8 atoms — each computes checks from declared values —
and recomputed every computed quantity independently: **agreement with
Gemini full on all seven**. Prior-wave evidence preserved per atom:
release-readiness-verdict `evidence-retest.json` / `judgment-retest.json`;
claim-verification `cases-wave1.json` (the original recorded battery) +
`evidence-retest.json` / `judgment-retest.json`, with the Wave 1
evidence files untouched.

**Result: 9 PASS / 0 FAIL.** **F3 is closed** — the recorded
release-readiness manifests carrying `release_notes.breaking_changes:
false` return HTTP 200 `READY` / `NOT_READY` again, the malformed case
still returns 422 naming `product`, and MCP↔REST parity is restored.
**F4 is closed under ruling (a)** — SERVICE.md declares
`claims[].primary_source (boolean)` explicitly; on the redesigned
battery the atom returns `STAMPED` / `NOT_STAMPED` as designed, and a
string `primary_source` is rejected 422 naming
`claims[0].primary_source`. The Wave 1 FAIL on this atom's verdict
cases was a **tester-design error** under the now-explicit contract
(the Wave 1 cases carried URL strings for a boolean field); the battery
was redesigned, the atom was not relaxed. Verdict history stays on
record: FAIL (Wave 1) → FAIL (retest, old battery) → PASS (Wave 3,
corrected battery). All seven Batch 8 atoms PASS at first test. **With
this wave, all 51 live atoms carry an external PASS as their latest
verdict.** No new findings — no F5 issued.

**Tester errors this wave: 7** — all design-time, all on Batch 8
atoms, all corrected before execution, none recorded as an atom
failure: backend-engineering-advice ×2 (a full-pass expect note
corrected `taxonomy_categories_missing` null → `[]`; violations
`failing_checks` corrected from section names to the exact check
names), base-rate-card ×1 (the same check-name correction),
behavioral-finance-bias-check ×2 (violations `failing_checks`
corrected from input field names to exact check names; the
`computed_spot_checks` structured field added to the full-pass
expect), behavioral-finance-debiasing ×2 (violations `failing_checks`
corrected from section names to the exact three check names; the same
`computed_spot_checks` addition). Two further atoms
(argument-analysis-review, audience-contract-design) carried
section-name labels in their violations expects that were read against
the exact check names at judging, with no case change needed.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| release-readiness-verdict | **PASS** | FAIL (retest) | F3 closed — recorded full-pass/violations return 200 READY / NOT_READY; malformed 422 (field: product); determinism + parity true | — | [TEST-REPORT.md](services/release-readiness-verdict/TEST-REPORT.md) | [USER-GUIDE.md](services/release-readiness-verdict/USER-GUIDE.md) |
| claim-verification-fact-check-stamp | **PASS** | FAIL (retest) | F4 closed under ruling (a) — redesigned battery (primary_source boolean): STAMPED / NOT_STAMPED; string primary_source → 422 naming claims[0].primary_source; determinism + parity true | — | [TEST-REPORT.md](services/claim-verification-fact-check-stamp/TEST-REPORT.md) | [USER-GUIDE.md](services/claim-verification-fact-check-stamp/USER-GUIDE.md) |
| argument-analysis-review | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/argument-analysis-review/TEST-REPORT.md) | [USER-GUIDE.md](services/argument-analysis-review/USER-GUIDE.md) |
| audience-contract-design | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/audience-contract-design/TEST-REPORT.md) | [USER-GUIDE.md](services/audience-contract-design/USER-GUIDE.md) |
| auth-design-review | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/auth-design-review/TEST-REPORT.md) | [USER-GUIDE.md](services/auth-design-review/USER-GUIDE.md) |
| backend-engineering-advice | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/backend-engineering-advice/TEST-REPORT.md) | [USER-GUIDE.md](services/backend-engineering-advice/USER-GUIDE.md) |
| base-rate-card | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/base-rate-card/TEST-REPORT.md) | [USER-GUIDE.md](services/base-rate-card/USER-GUIDE.md) |
| behavioral-finance-bias-check | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/behavioral-finance-bias-check/TEST-REPORT.md) | [USER-GUIDE.md](services/behavioral-finance-bias-check/USER-GUIDE.md) |
| behavioral-finance-debiasing | **PASS** | — (first test) | — | deepseek | [TEST-REPORT.md](services/behavioral-finance-debiasing/TEST-REPORT.md) | [USER-GUIDE.md](services/behavioral-finance-debiasing/USER-GUIDE.md) |

## Wave 4 — 2026-11-15 — 7 atoms (Batch 9 first tests)

Triggered by the Batch 9 deploy (deployment
`fa3faa42fac649da873fcc00cfa20f82`, gateway v1.1.0; 58 atoms live).
Scope: first tests of Batch 9's seven atoms (Gemini-designed cases,
same battery and standard as Waves 1–3: full-pass / violations /
sparse / malformed, determinism byte-compare and MCP↔REST parity on
the full-pass case, real HTTP calls throughout). Tester key scopes
were extended to all 58 live atoms before the wave (same key,
`atm_1_ac543f43d09d66…`, last-4 `b1a2`, verified by read-back).
DeepSeek second reads ran on all seven atoms; the coordinator
re-verified all seven mechanically from the raw evidence after the
workstreams reported (statuses, verdict values, determinism/parity
flags, 422 field names, results-file consistency) — **zero
discrepancies**.

**Result: 7 PASS / 0 FAIL.** All seven Batch 9 atoms PASS at first
test — the third consecutive cohort to do so (Batch 7 in the retest
wave, Batch 8 in Wave 3, Batch 9 here), each built with F1 type
validation and documented field types from the start. **With this
wave, all 58 live atoms carry an external PASS as their latest
verdict.** No new findings — no F5 issued.

**DeepSeek↔Gemini agreement:** full on six atoms (every recomputed
quantity matched). On budget-design-review DeepSeek returned
`AGREEMENT: partial` on exactly one point — the violations case's
`computed_status`: DeepSeek expected `null` (a scalar input,
`rolling_horizon_months`, was absent from the violations manifest),
the artifact reports `outside_stated_limits_on_declared_evidence`.
Every quantity (both `computed_total`s, both `total_difference`s,
ownerless indexes, the exact 5-check fail set, all verdicts) matched.
The point was adjudicated in the atom's favour on the evidence and
is recorded in the atom's TEST-REPORT.md: fail-precedence (any scalar
check fails → `outside_…`; `null` only when nothing fails and a
scalar check is incomplete) is the rule the Python oracle implements,
the TS port is parity-proven against it, and every fleet atom
implements the same precedence — SERVICE.md's parenthetical
summarizes only the no-fail case. An optional SERVICE.md
clarification (state the fail-precedence explicitly) is noted in
FIX-SPECS.md as a documentation observation, not a defect.

**Tester errors this wave: 17** — all design-time, all corrected
before execution, none recorded as an atom failure: the recurring
class was Gemini listing section names (or input field paths) instead
of exact check names in violations `failing_checks`
(bias-controlled-quant-study-pack, brand-mention-monitoring-triage-digest,
browser-extension-engineering, budget-design-review, buyer-test-card,
c-engineering-review, cash-flow-forecast ×1 each), and full-pass
expects carrying computed quantities only as prose notes instead of a
structured `computed_spot_checks` list (the same seven atoms, one
each). Atom-specific: bias-controlled-quant-study-pack ×1 (a note's
sign error, `signals_reported_minus_tested` 95 → −95);
browser-extension-engineering ×1 (computed lists noted as `null`
where SERVICE.md defines `[]` when all lists are declared);
cash-flow-forecast ×2 (full-pass designed with 1 weekly bucket where
SERVICE.md requires exactly 13 — expanded to 13; violations input
designed sparse, which would have made planted violations read as
missing rather than failing — rebuilt as a full manifest carrying
exactly the five intended violations).

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| bias-controlled-quant-study-pack | **PASS** | — (first test) | — (malformed 422, field: hypothesis.hypothesis_written) | deepseek ✓ full | [TEST-REPORT.md](services/bias-controlled-quant-study-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/bias-controlled-quant-study-pack/USER-GUIDE.md) |
| brand-mention-monitoring-triage-digest | **PASS** | — (first test) | — (malformed 422, field: inventory) | deepseek ✓ full | [TEST-REPORT.md](services/brand-mention-monitoring-triage-digest/TEST-REPORT.md) | [USER-GUIDE.md](services/brand-mention-monitoring-triage-digest/USER-GUIDE.md) |
| browser-extension-engineering | **PASS** | — (first test) | — (malformed 422, field: extension_name) | deepseek ✓ full | [TEST-REPORT.md](services/browser-extension-engineering/TEST-REPORT.md) | [USER-GUIDE.md](services/browser-extension-engineering/USER-GUIDE.md) |
| budget-design-review | **PASS** | — (first test) | — (malformed 422, field: scope; DeepSeek partial on computed_status precedence — adjudicated for the atom, see above) | deepseek (partial, adjudicated) | [TEST-REPORT.md](services/budget-design-review/TEST-REPORT.md) | [USER-GUIDE.md](services/budget-design-review/USER-GUIDE.md) |
| buyer-test-card | **PASS** | — (first test) | — (malformed 422, field: hypothesis) | deepseek ✓ full | [TEST-REPORT.md](services/buyer-test-card/TEST-REPORT.md) | [USER-GUIDE.md](services/buyer-test-card/USER-GUIDE.md) |
| c-engineering-review | **PASS** | — (first test) | — (malformed 422, field: memory.one_owner_per_allocation) | deepseek ✓ full | [TEST-REPORT.md](services/c-engineering-review/TEST-REPORT.md) | [USER-GUIDE.md](services/c-engineering-review/USER-GUIDE.md) |
| cash-flow-forecast | **PASS** | — (first test) | — (malformed 422, field: forecast.opening_balance) | deepseek ✓ full | [TEST-REPORT.md](services/cash-flow-forecast/TEST-REPORT.md) | [USER-GUIDE.md](services/cash-flow-forecast/USER-GUIDE.md) |

## Wave 5 — 2026-11-15 — 7 atoms (Batch 10 first tests)

Triggered by the Batch 10 deploy (deployment
`56f92826f4284ec9a8570d683113aa86`, gateway v1.1.0; 65 atoms live).
Scope: first tests of Batch 10's seven atoms (Gemini-designed cases,
same battery and standard as Waves 1–4: full-pass / violations /
sparse / malformed, determinism byte-compare and MCP↔REST parity on
the full-pass case, real HTTP calls throughout). Tester key scopes
were extended 58 → 65 before the wave through the real
`POST /v1/keys` endpoint (the same key returned on every grant,
`atm_1_ac543f43d09d66…`, last-4 `b1a2`), verified by
`GET /v1/keys` read-back — 65 scopes, none missing. DeepSeek second
reads ran on all seven atoms; the coordinator re-verified all seven
mechanically from the raw evidence after the workstreams reported
(statuses, verdict values, failing-check sets, determinism/parity
flags, 422 field names, results-file consistency) — **zero
discrepancies**.

**Result: 7 PASS / 0 FAIL.** All seven Batch 10 atoms PASS at first
test — the fourth consecutive cohort to do so (Batch 7 in the retest
wave, Batch 8 in Wave 3, Batch 9 in Wave 4, Batch 10 here), each
built with F1 type validation and documented field types from the
start. **With this wave, all 65 live atoms carry an external PASS
as their latest verdict.** No new findings — no F5 issued.

**DeepSeek↔Gemini agreement:** full on all seven atoms — every
recomputed quantity matched (cicd stage/monthly minute chains,
claim-evaluation hit-rate percentages, code-review line/comment
counts, codebase-visualization coverage and hotspot score,
community-support computed sets, confidential-computing
trusted-codebase totals, cost-estimate subtotal/contingency/
escalation/grand-total chains), and the exact violations
failing-check sets were confirmed on every atom. No partials —
nothing required adjudication this wave.

**Process note (honest record):** the cicd-pipeline-design
workstream was interrupted after completing all of its artifacts
(cases, evidence, judgment, DeepSeek recompute, results file,
TEST-REPORT.md, USER-GUIDE.md) but before sending its report. Its
verdict was established by the coordinator from the on-disk
evidence — the report was verified against the raw evidence
(36 checks, the exact 10-check violations fail set, malformed 422
on field `pipeline`, determinism and parity true) under the same
recovery standard as Wave 4's silent workers. No atom's verdict
rests on a single unverified claim.

**Tester errors this wave: 29** — all design-time, all corrected
before execution, none recorded as an atom failure. The classes:
computed quantities carried only in prose notes with no structured
`computed_spot_checks` list (14 — a full-pass and a violations
instance on each of the seven atoms); violations `failing_checks`
naming section names, shorthand or field paths instead of exact
check names (6 — cicd-pipeline-design, claim-evaluation-review
counted under spot-checks only; the six are cicd-pipeline-design,
code-review-service, codebase-visualization,
community-support-operations, confidential-computing-design,
cost-estimate-preparation); violations inputs designed sparse,
which would have read planted violations as missing rather than
failing — rebuilt as full manifests (5 — cicd-pipeline-design,
code-review-service, codebase-visualization,
confidential-computing-design, cost-estimate-preparation);
malformed cases carrying two simultaneous type violations (making
the 422 field ambiguous) or an undocumented field — reduced to a
single violation of a documented typed field (4 —
claim-evaluation-review, codebase-visualization,
confidential-computing-design, cost-estimate-preparation).
Per-atom detail is in each atom's TEST-REPORT.md.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| cicd-pipeline-design | **PASS** | — (first test) | — (malformed 422, field: pipeline) | deepseek ✓ full | [TEST-REPORT.md](services/cicd-pipeline-design/TEST-REPORT.md) | [USER-GUIDE.md](services/cicd-pipeline-design/USER-GUIDE.md) |
| claim-evaluation-review | **PASS** | — (first test) | — (malformed 422, field: claims) | deepseek ✓ full | [TEST-REPORT.md](services/claim-evaluation-review/TEST-REPORT.md) | [USER-GUIDE.md](services/claim-evaluation-review/USER-GUIDE.md) |
| code-review-service | **PASS** | — (first test) | — (malformed 422, field: pr.changed_lines) | deepseek ✓ full | [TEST-REPORT.md](services/code-review-service/TEST-REPORT.md) | [USER-GUIDE.md](services/code-review-service/USER-GUIDE.md) |
| codebase-visualization | **PASS** | — (first test) | — (malformed 422, field: dependency.modules_total) | deepseek ✓ full | [TEST-REPORT.md](services/codebase-visualization/TEST-REPORT.md) | [USER-GUIDE.md](services/codebase-visualization/USER-GUIDE.md) |
| community-support-operations | **PASS** | — (first test) | — (malformed 422, field: intake.channels_defined) | deepseek ✓ full | [TEST-REPORT.md](services/community-support-operations/TEST-REPORT.md) | [USER-GUIDE.md](services/community-support-operations/USER-GUIDE.md) |
| confidential-computing-design | **PASS** | — (first test) | — (malformed 422, field: enclave.declared_trusted_codebase_lines) | deepseek ✓ full | [TEST-REPORT.md](services/confidential-computing-design/TEST-REPORT.md) | [USER-GUIDE.md](services/confidential-computing-design/USER-GUIDE.md) |
| cost-estimate-preparation | **PASS** | — (first test) | — (malformed 422, field: totals.declared_subtotal) | deepseek ✓ full | [TEST-REPORT.md](services/cost-estimate-preparation/TEST-REPORT.md) | [USER-GUIDE.md](services/cost-estimate-preparation/USER-GUIDE.md) |

## Wave 6 — 2026-11-15 — 7 atoms (Batch 11 first tests)

Triggered by the Batch 11 deploy (deployment
`05ec9d2252ec4e26a46fc028eede90ab`, gateway v1.1.0; 72 atoms live).
Scope: first tests of Batch 11's seven atoms (Gemini-designed cases,
same battery and standard as Waves 1–5: full-pass / violations /
sparse / malformed, determinism byte-compare and MCP↔REST parity on
the full-pass case, real HTTP calls throughout). Tester key scopes
were extended 65 → 72 before the wave through the real
`POST /v1/keys` endpoint (the same key returned on every grant,
`atm_1_ac543f43d09d66…`, last-4 `b1a2`), verified by
`GET /v1/keys` read-back — 72 scopes, none missing. DeepSeek second
reads ran on all seven atoms (each carries computed quantities);
the coordinator re-verified all seven mechanically from the raw
evidence after the workstreams reported (statuses, verdict values,
failing-check sets against the corrected case expects,
determinism/parity flags, 422 field names, judgment/results-file
consistency, report and guide presence) — **zero discrepancies**.

**Result: 7 PASS / 0 FAIL.** All seven Batch 11 atoms PASS at first
test — the fifth consecutive cohort to do so (Batch 7 in the retest
wave, Batch 8 in Wave 3, Batch 9 in Wave 4, Batch 10 in Wave 5,
Batch 11 here), each built with F1 type validation and documented
field types from the start. **With this wave, all 72 live atoms
carry an external PASS as their latest verdict.** No new findings —
no F6 issued.

**DeepSeek↔Gemini agreement:** full on all seven atoms — every
recomputed quantity matched (cpp warning counts and forbidden-
construct lists; creative-ideation volume gaps and dedup
discrepancies; CRM open/pipeline value totals, deal and stale
counts, stage coverage; data-analysis totals, means and percent
changes on both cases; data-ml row-sum differences and latency/cost
headrooms; data-visualization category maxima and differences;
database-design counts and 4dp coverage ratios), and the exact
violations failing-check sets were confirmed on every atom. No
partials — nothing required adjudication this wave.

**Case-design checklist — effect, stated plainly:** the standing
checklist from Waves 4–5 (exact check names; structured
`computed_spot_checks`; full-manifest violations inputs; exactly
one malformed type violation) was applied as a pre-execution
review step this wave. It did **not** reduce the tester-error
count: **31** design-time errors were caught and corrected, against
29 in Wave 5. Gemini's raw case designs still contain the same
slip classes at roughly the same rate. What the checklist
guaranteed is containment: every slip was caught at the
pre-execution review, none reached execution, and the Gemini
judge added **zero** further tester errors on all seven atoms.
The classes: computed quantities carried only in prose notes with
no structured `computed_spot_checks` list (12); violations
`failing_checks` naming section names, shorthand or field paths
instead of exact check names (7 — one per atom); violations inputs
designed sparse — rebuilt as full manifests (5 —
crm-pipeline-operations, data-analysis-deliverable,
data-ml-pipeline-engineering, data-visualization-design,
database-design-review); malformed cases carrying two simultaneous
type violations — reduced to one (5 — cpp-engineering-review,
crm-pipeline-operations, data-analysis-deliverable,
data-ml-pipeline-engineering, database-design-review); full-pass
inputs with fields mis-nested under the wrong section — rebuilt
with the documented nesting (2 — data-ml-pipeline-engineering,
database-design-review). Per-atom detail is in each atom's
TEST-REPORT.md.

**Documentation observation (not a defect, no fix required):**
data-visualization-design — two failing checks' static evidence
strings retain "(… passes vacuously)" wording while their statuses
are correctly `fail`. The verdicts, fail sets and computed values
are all correct; the wording is a leftover from the checks'
vacuous-pass phrasing. Recorded here and in FIX-SPECS.md for the
replication stream's convenience, as with the Wave 4
budget-design-review observation.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| cpp-engineering-review | **PASS** | — (first test) | — (malformed 422, field: tooling.warning_count) | deepseek ✓ full | [TEST-REPORT.md](services/cpp-engineering-review/TEST-REPORT.md) | [USER-GUIDE.md](services/cpp-engineering-review/USER-GUIDE.md) |
| creative-ideation-session | **PASS** | — (first test) | — (malformed 422, field: brief) | deepseek ✓ full | [TEST-REPORT.md](services/creative-ideation-session/TEST-REPORT.md) | [USER-GUIDE.md](services/creative-ideation-session/USER-GUIDE.md) |
| crm-pipeline-operations | **PASS** | — (first test) | — (malformed 422, field: pipeline.stale_threshold_days) | deepseek ✓ full | [TEST-REPORT.md](services/crm-pipeline-operations/TEST-REPORT.md) | [USER-GUIDE.md](services/crm-pipeline-operations/USER-GUIDE.md) |
| data-analysis-deliverable | **PASS** | — (first test) | — (malformed 422, field: figures.stated_total) | deepseek ✓ full | [TEST-REPORT.md](services/data-analysis-deliverable/TEST-REPORT.md) | [USER-GUIDE.md](services/data-analysis-deliverable/USER-GUIDE.md) |
| data-ml-pipeline-engineering | **PASS** | — (first test) | — (malformed 422, field: sources.declared_total_rows) | deepseek ✓ full | [TEST-REPORT.md](services/data-ml-pipeline-engineering/TEST-REPORT.md) | [USER-GUIDE.md](services/data-ml-pipeline-engineering/USER-GUIDE.md) |
| data-visualization-design | **PASS** | — (first test) | — (malformed 422, field: charts) | deepseek ✓ full | [TEST-REPORT.md](services/data-visualization-design/TEST-REPORT.md) | [USER-GUIDE.md](services/data-visualization-design/USER-GUIDE.md) |
| database-design-review | **PASS** | — (first test) | — (malformed 422, field: normalization.normalized_to_3nf) | deepseek ✓ full | [TEST-REPORT.md](services/database-design-review/TEST-REPORT.md) | [USER-GUIDE.md](services/database-design-review/USER-GUIDE.md) |

## Wave 7 — 2026-11-15 — 7 atoms (Batch 12 first tests)

Triggered by the Batch 12 deploy (deployment
`7bad54c4e4a145e493e8766eb2f3bafb`, gateway v1.1.0; 79 atoms live).
Scope: first tests of Batch 12's seven atoms (Gemini-designed cases,
same battery and standard as Waves 1–6: full-pass / violations /
sparse / malformed, determinism byte-compare and MCP↔REST parity on
the full-pass case, real HTTP calls throughout). Tester key scopes
were extended 72 → 79 before the wave through the real
`POST /v1/keys` endpoint (the same key returned on every grant,
`atm_1_ac543f43d09d66…`, last-4 `b1a2`), verified by
`GET /v1/keys` read-back — 79 scopes, none missing. DeepSeek second
reads ran on all seven atoms (each carries computed quantities);
the coordinator re-verified all seven mechanically from the raw
evidence after the workstreams reported (statuses, verdict values,
failing-check sets against the corrected case expects,
determinism/parity flags, 422 field names, judgment/results-file
consistency, report and guide presence, validator reports) —
**zero discrepancies**.

**The mechanical pre-flight case validator (new this wave).** The
Wave 6 checklist is now structure: `verification/validate_cases.py`
runs inside the harness on every designed case file BEFORE any call
is made, and a rejected file is not executed at all. It rejects,
naming the rule, when (R1) a violations `failing_checks` names
anything outside the atom's exact check register — extracted
mechanically from the atom's own Python oracle core by running
`evaluate({})`; (R2) an expected computed quantity appears only in
prose instead of a structured `computed_spot_checks`; (R3) a
violations input is sparse rather than a full manifest (its key
paths must cover the full-pass manifest's); (R4) a malformed case
carries other than exactly one type violation of a documented
typed field, counted by walking the input against the oracle's
MANIFEST_SPEC with the oracle's own type semantics. The validator
ships with its own tests (`verification/test_validate_cases.py`,
10/10: each rule fires on a bad file and passes a good one, the
recorded Wave 6 cpp-engineering-review battery passes, and the
harness demonstrably refuses a rejected file); each executed
battery's evidence records its validation, and each atom's raw
Gemini design validation report is preserved as
`verification/work/<atom>/validation-raw.json`.

**Validator effect, stated plainly:** Gemini's raw designs still
slip at the same rate — the validator issued **52 rejections**
across the seven raw designs (R1 check-register ×26, R2
structured-spot-checks ×14, R3 violations-full-manifest ×7, R4
malformed-exactly-one ×5). What changed is where the slips land:
detection is now mechanical and total rather than a human review
pass, every executed battery is validator-passed by construction,
and **tester errors in executed cases dropped to zero** — no
executed case was defective, the Gemini judge recorded zero
tester errors on all seven atoms, and no correction was needed
after execution on any atom. The 39 design-time corrections
recorded in the per-atom reports are the fixes those 52 rejections
(plus three reviewer-found items the validator does not cover: a
cascade plant on delivery-plan-preparation, omitted repair-section
fields on difficult-conversation-coaching, mis-nested fields on
domain-portfolio-audit) produced before execution; none was scored
against an atom.

**Result: 7 PASS / 0 FAIL.** All seven Batch 12 atoms PASS at
first test — the sixth consecutive cohort to do so (Batch 7 in
the retest wave, Batch 8 in Wave 3, Batch 9 in Wave 4, Batch 10
in Wave 5, Batch 11 in Wave 6, Batch 12 here), each built with
F1 type validation and documented field types from the start.
**With this wave, all 79 live atoms carry an external PASS as
their latest verdict.** No new findings — no F7 issued.

**DeepSeek↔Gemini agreement:** full on all seven atoms — every
recomputed quantity matched (decision-process counts, coverages
and the floor-rule loss-cost ratios including the violations
case's negative `-0.2000`; research-brief provenance, sourcing
and triangulation lists and ratios; delivery-plan counts,
duration and coverages; test-case-pack traceability counts,
ratios and row lists; conversation-coaching domain coverage and
SBI lists; document-operations counts, without-lists and
coverages; domain-portfolio counts, coverages, lapsed lists and
±365-day renewal figures), and the exact violations
failing-check sets were confirmed on every atom. No partials —
nothing required adjudication this wave.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| decision-process-design | **PASS** | — (first test) | — (malformed 422, field: loss.cost_of_false_action) | deepseek ✓ full | [TEST-REPORT.md](services/decision-process-design/TEST-REPORT.md) | [USER-GUIDE.md](services/decision-process-design/USER-GUIDE.md) |
| decision-ready-research-brief | **PASS** | — (first test) | — (malformed 422, field: scope) | deepseek ✓ full | [TEST-REPORT.md](services/decision-ready-research-brief/TEST-REPORT.md) | [USER-GUIDE.md](services/decision-ready-research-brief/USER-GUIDE.md) |
| delivery-plan-preparation | **PASS** | — (first test) | — (malformed 422, field: phases) | deepseek ✓ full | [TEST-REPORT.md](services/delivery-plan-preparation/TEST-REPORT.md) | [USER-GUIDE.md](services/delivery-plan-preparation/USER-GUIDE.md) |
| designed-test-case-pack | **PASS** | — (first test) | — (malformed 422, field: requirements) | deepseek ✓ full | [TEST-REPORT.md](services/designed-test-case-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/designed-test-case-pack/USER-GUIDE.md) |
| difficult-conversation-coaching | **PASS** | — (first test) | — (malformed 422, field: self_awareness.emotion_named) | deepseek ✓ full | [TEST-REPORT.md](services/difficult-conversation-coaching/TEST-REPORT.md) | [USER-GUIDE.md](services/difficult-conversation-coaching/USER-GUIDE.md) |
| document-operations-service | **PASS** | — (first test) | — (malformed 422, field: documents) | deepseek ✓ full | [TEST-REPORT.md](services/document-operations-service/TEST-REPORT.md) | [USER-GUIDE.md](services/document-operations-service/USER-GUIDE.md) |
| domain-portfolio-audit | **PASS** | — (first test) | — (malformed 422, field: portfolio) | deepseek ✓ full | [TEST-REPORT.md](services/domain-portfolio-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/domain-portfolio-audit/USER-GUIDE.md) |

## Wave 8 — 2026-11-15 — 7 atoms (Batch 13 first tests) + Part B evidence completions

**Recovery note:** the original Wave 8 coordinator ended
without a synthesized report. This section was written by the
recovery coordinator from the on-disk artifacts, and every
verdict below was **mechanically re-verified from the raw
evidence** (HTTP statuses, verdict values, exact failing-check
sets, computed spot checks, determinism byte-identity,
MCP↔REST parity, 422 field names, judgment↔results
consistency) — zero discrepancies. The one nuance: on
electrical-machines-expert-advice the spot-check quantity
`induction_starting_current_multiple` is carried in the
response's check evidence (the atom records the declared
multiple, never grades it); the judge and DeepSeek both
recomputed it from the manifest inputs (600 A / 100 A =
6.000000) and matched.

**Result: 6 PASS / 0 FAIL, + 1 atom DISABLED-BY-OWNER-RULING
(not scored).** Batch 13's seven were all live-tested against
deployment `5cf70cb60526415d89b4db5e5cd02744` (gateway
v1.1.0). Six pass at first test — the seventh consecutive
cohort with no atom failure (Batch 7 retest, Batches 8–13).
electrical-machines-expert-advice's battery was captured
**complete** on 2026-11-16T04:27Z and every leg passed
mechanical re-verification; the atom was then disabled by
the owner's regulatory ruling (below), so the wave records
it as DISABLED-BY-OWNER-RULING rather than scoring the
passing battery as a wave PASS.

**Validator:** 47 rejections across the seven raw Gemini
designs (per atom: edge-platform-engineering 5,
efficient-web-build-standard 8, electrical-machines-expert-advice
4, engineering-project-budget-pack 5,
engineering-work-package-structuring 14,
fare-construction-savings-strategy 4, finance-education-article
7 — full counts in each atom's `validation-raw.json`); every
executed battery was
validator-passed, the Gemini judge recorded zero tester
errors in executed cases on all seven atoms, and the 32
design-time corrections are recorded per atom in the
results files. No new findings — no F8 issued.

**DeepSeek↔Gemini agreement:** full on all seven atoms —
every recomputed quantity matched (edge-platform counts and
coverages; efficient-web payload and call figures;
electrical-machines starting-current multiple and ANSI
device validity; budget-pack totals and contingency
figures; work-package counts and coverages; fare headline
and driver totals; article structure counts), and the exact
violations failing-check sets were confirmed on every atom.
Nothing required adjudication.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| edge-platform-engineering | **PASS** | — (first test) | — (malformed 422, field: components) | deepseek ✓ full | [TEST-REPORT.md](services/edge-platform-engineering/TEST-REPORT.md) | [USER-GUIDE.md](services/edge-platform-engineering/USER-GUIDE.md) |
| efficient-web-build-standard | **PASS** | — (first test) | — (malformed 422, field: payload.interactive_js_gzipped_kb) | deepseek ✓ full | [TEST-REPORT.md](services/efficient-web-build-standard/TEST-REPORT.md) | [USER-GUIDE.md](services/efficient-web-build-standard/USER-GUIDE.md) |
| electrical-machines-expert-advice | **DISABLED-BY-OWNER-RULING** (complete pre-disable battery passed — see note) | — (first test) | — (malformed 422, field: engagement) | deepseek ✓ full | [TEST-REPORT.md](services/electrical-machines-expert-advice/TEST-REPORT.md) | [USER-GUIDE.md](services/electrical-machines-expert-advice/USER-GUIDE.md) |
| engineering-project-budget-pack | **PASS** | — (first test) | — (malformed 422, field: basis) | deepseek ✓ full | [TEST-REPORT.md](services/engineering-project-budget-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/engineering-project-budget-pack/USER-GUIDE.md) |
| engineering-work-package-structuring | **PASS** | — (first test) | — (malformed 422, field: deliverables) | deepseek ✓ full | [TEST-REPORT.md](services/engineering-work-package-structuring/TEST-REPORT.md) | [USER-GUIDE.md](services/engineering-work-package-structuring/USER-GUIDE.md) |
| fare-construction-savings-strategy | **PASS** | — (first test) | — (malformed 422, field: total_cost.headline_fare) | deepseek ✓ full | [TEST-REPORT.md](services/fare-construction-savings-strategy/TEST-REPORT.md) | [USER-GUIDE.md](services/fare-construction-savings-strategy/USER-GUIDE.md) |
| finance-education-article | **PASS** | — (first test) | — (malformed 422, field: topic) | deepseek ✓ full | [TEST-REPORT.md](services/finance-education-article/TEST-REPORT.md) | [USER-GUIDE.md](services/finance-education-article/USER-GUIDE.md) |

### Regulatory disable — owner ruling 2026-11-15 21:42 MST (process line U-13)

Seven live atoms were disabled by the owner's regulatory
ruling (kill switch `atom_enabled=0`, 503 on both faces,
executed by the Conduit lane's takedown worker, whose
per-atom 503-proof records are filed with the takedown).
Their rows in the wave tables above stand as their last
test record; their live status is superseded by this
ruling. They return only on the owner's explicit per-atom
ruling.

| Atom | Last external verdict | Disabled |
|---|---|---|
| electrical-machines-expert-advice | complete Wave 8 battery passed (this wave) | 2026-11-15, owner ruling |
| portfolio-risk-analytics-report | PASS (Wave 1/retest corpus) | 2026-11-15, owner ruling |
| reconciled-portfolio-performance-report | PASS (Wave 1/retest corpus) | 2026-11-15, owner ruling |
| strategy-backtest-validation | PASS (Wave 1/retest corpus) | 2026-11-15, owner ruling |
| behavioral-finance-bias-check | PASS (Wave 3) | 2026-11-15, owner ruling |
| behavioral-finance-debiasing | PASS (Wave 3) | 2026-11-15, owner ruling |
| difficult-conversation-coaching | PASS (Wave 7) | 2026-11-15, owner ruling |

Fleet state after Wave 8 and the ruling: **86 atoms tested,
79 live and PASSING as their latest verdict, 7 disabled by
owner ruling.**

### Part B — evidence completions (WS1 documentation record items)

1. **claim-verification-fact-check-stamp USER-GUIDE fix —
   DONE.** The guide's worked example showed
   `"primary_source": "nasa.gov"` (string) — the exact shape
   the recorded battery rejects with 422. Corrected to the
   recorded boolean shape (`true`); the atom's TEST-REPORT
   carries a Wave 8 addendum citing the recorded
   `primary-source-string` 422 case and the recorded
   full-pass case. Guide-content error only; no atom
   behavior changed.
2. **codebase-structural-query intent/status completion —
   DONE.** Supplementary battery
   (`verification/work/codebase-structural-query/cases-supplementary.json`,
   evidence `evidence-supplementary.json`) exercises the
   remaining vocabulary over one shared graph: intents
   `ancestors`, `blast_radius`, `stats`, `snapshot` and
   statuses `no_path`, `stale_index` — every live artifact
   deep-equals the atom oracle's independently pre-computed
   result. **Exercised set now complete: 6/6 intents, 4/4
   statuses.** The mechanical validator cannot run on this
   atom (its register extraction executes `evaluate({})`,
   which raises by design — this computed atom has no checks
   register; validator exit 2, recorded in the evidence's
   `case_validation` block); documented-shape pre-flight
   plus oracle pre-computation stood in, named rather than
   silently skipped.
3. **Recorded error-shape probes — DONE**
   (`verification/error-shape-probes.json`): **401** on both
   faces (REST `unauthorized`; MCP `missing or invalid
   gateway API key`), **403** `scope_required` (scope deleted
   from the tester key, forbidden call recorded, scope
   restored and read back — 86 scopes, same key, call
   succeeding after restore), and **429** `rate_limit` —
   captured 2026-11-16T04:45Z from Aetheris: 121 completions
   inside one minute window, exactly **60× 200 + 61× 429**,
   first 429 body verbatim: `{"ok":false,"error":"rate_limit",
   "detail":"per-key limit 60/minute for
   release-readiness-verdict exceeded"}`. The sandbox could
   not capture the 429 (egress proxy latency ~30 s/call;
   90-way parallel curl collapses at the proxy); the
   attempts also isolated a standing environmental fact —
   **Cloudflare error 1010: the zone bans the
   `Python-urllib` user-agent** (single-call A/B from
   Aetheris: default UA → 403/1010, curl/browser UA → 200,
   same key, same IP), which is the root cause of the
   long-standing sandbox-urllib 403 artifact. Full attempt
   history is preserved in the probes file.

### FIX-SPECS corpus item (WS2 gate-filed) — disposition

The WS2 per-atom gate's corpus entry is **committed** with
this wave, and the normalization it called for is
**executed and mechanically proven**: 32 early-wave case
files (Waves 1–3 corpora, incl. claim-verification's
preserved `cases-wave1.json`) had their violations
`failing_checks` expects rewritten from field paths /
section names to exact check-register names — **110 names,
every one verified against the atom's register extracted
by the validator's own method (R1-clean, zero exceptions);
recorded outputs were not touched.** Named follow-on, not
silently implied: R2/R3/R4 retro-conformance of those
pre-validator corpora was not part of the gate item and
remains undone — the full validator flags those rules on
the early files (they were designed before the rules
existed); any future replay runs the harness's validator
gate first.

## Wave 9 — 2026-11-15 — 7 atoms (Batch 14 first tests)

Triggered by the Batch 14 deploy (deployment
`38371decd3a447a1b2c82ff4ac4e8e42`, gateway v1.1.0, on the
takedown base; 93 atoms registered, 86 serving, 7 disabled by
the owner's U-13 ruling). Scope: first tests of Batch 14's
seven atoms (Gemini-designed cases, same battery and standard
as Waves 1–8: full-pass / violations / sparse / malformed,
determinism byte-compare and MCP↔REST parity on the full-pass
case, real HTTP calls throughout, every case file gated by
the mechanical pre-flight validator before execution).
Tester key scopes were extended 86 → 93 before the wave
through the real `POST /v1/keys` endpoint (the same key
returned on every grant, `atm_1_ac543f43d09d66…`, last-4
`b1a2`), verified by `GET /v1/keys` read-back — 93 scopes,
none missing. DeepSeek second reads ran on all seven atoms
(each carries computed quantities); the coordinator
re-verified all seven mechanically from the raw evidence
after the workstreams reported (statuses, verdict values,
exact failing-check sets, structured computed spot checks,
determinism/parity flags, 422 field names, judgment/results
consistency, report and guide presence, validator reports)
— **zero discrepancies** (20/20 mechanical checks per atom).

**Result: 7 PASS / 0 FAIL.** All seven Batch 14 atoms PASS
at first test — the eighth consecutive cohort with no atom
failure (Batch 7 in the retest wave, Batches 8–12 in Waves
3–7, Batch 13's six live atoms in Wave 8, Batch 14 here),
each built with F1 type validation and documented field
types from the start. **With this wave, all 93 registered
atoms have been externally tested: 86 live and PASSING as
their latest verdict, 7 disabled by owner ruling (U-13).**
No new findings — no F9 issued; `verification/FIX-SPECS.md`
is unchanged by this wave.

**Validator effect:** the raw Gemini designs drew **42
rejections** in total (R1 check-register ×22, R2
structured-spot-checks ×14, R3 violations-full-manifest
×4, R4 malformed-exactly-one ×2 — per-atom counts in each
atom's `validation-raw.json`). Every executed battery was
validator-passed, the Gemini judge recorded zero tester
errors in executed cases on all seven atoms, and the **29
design-time corrections** (per-atom counts in the results
files: 4 on six atoms, 5 on frontend-implementation) are
recorded per atom in the TEST-REPORT.md files. Two of the
corrections were genuine-validity fixes the validator does
not cover, both caught by running the Python oracle before
execution: framework-adoption-adr's manifests omitted
`plugins.plugins_treated_as_dependencies` (raw full-pass
evaluated INSUFFICIENT_EVIDENCE, not SOUND), and
frontend-implementation's Gemini design nested
`new_framework_introduced`/`adr_recorded` under `structure`
where SERVICE.md places them in a top-level `framework`
object. Neither was scored against its atom.

**DeepSeek↔Gemini agreement:** full on all seven atoms —
every recomputed quantity matched (finance-tool feature
counts and coverages; scoreboard mean/hit/gap/Brier chains
for both forecasters and the overall line, incl. the
violations case's declared-count mismatch; ADR candidate
and fit-assessment figures; frontend data-view counts and
state coverage; full-stack slice counts and end-to-end
coverage — including its violations case, where
`computed_status` correctly stays
`within_stated_limits_on_declared_evidence` because it
derives only from the two slice checks, which still pass
while the eight planted anti-pattern checks fail; gRPC
method/field counts and deadline/streaming coverages;
home-shortlist monthly carrying-cost chains, totals, spread
and ranking), and the exact violations failing-check sets
were confirmed on every atom. No partials — nothing
required adjudication this wave.

**Doc-link absence — verified, by design (not a finding):**
Batch 14's seven atoms have no DOCUMENTATION.md yet (their
WS1 documentation pass follows this wave), so the new
catalogue doc-link correctly does not serve them: `GET
/docs/finance-tool-design-advisory` and `GET
/docs/grpc-service-design` return **404**, and `/api.json`
carries **no `documentation` field** for any of the seven
(verified for all seven in the feed), while a documented
atom (edge-platform-engineering) carries its
`documentation` URL in the same feed. The seven USER-GUIDEs
claim no documentation link. When their WS1 pass lands, the
next deploy's doc guard brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| finance-tool-design-advisory | **PASS** | — (first test) | — (malformed 422, field: compliance) | deepseek ✓ full | [TEST-REPORT.md](services/finance-tool-design-advisory/TEST-REPORT.md) | [USER-GUIDE.md](services/finance-tool-design-advisory/USER-GUIDE.md) |
| forecast-confidence-scoreboard | **PASS** | — (first test) | — (malformed 422, field: forecasts) | deepseek ✓ full | [TEST-REPORT.md](services/forecast-confidence-scoreboard/TEST-REPORT.md) | [USER-GUIDE.md](services/forecast-confidence-scoreboard/USER-GUIDE.md) |
| framework-adoption-adr | **PASS** | — (first test) | — (malformed 422, field: adr) | deepseek ✓ full | [TEST-REPORT.md](services/framework-adoption-adr/TEST-REPORT.md) | [USER-GUIDE.md](services/framework-adoption-adr/USER-GUIDE.md) |
| frontend-implementation | **PASS** | — (first test) | — (malformed 422, field: structure) | deepseek ✓ full | [TEST-REPORT.md](services/frontend-implementation/TEST-REPORT.md) | [USER-GUIDE.md](services/frontend-implementation/USER-GUIDE.md) |
| full-stack-app-build-pack | **PASS** | — (first test) | — (malformed 422, field: slices) | deepseek ✓ full | [TEST-REPORT.md](services/full-stack-app-build-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/full-stack-app-build-pack/USER-GUIDE.md) |
| grpc-service-design | **PASS** | — (first test) | — (malformed 422, field: contract) | deepseek ✓ full | [TEST-REPORT.md](services/grpc-service-design/TEST-REPORT.md) | [USER-GUIDE.md](services/grpc-service-design/USER-GUIDE.md) |
| home-shortlist-carrying-cost-comparison | **PASS** | — (first test) | — (malformed 422, field: homes) | deepseek ✓ full | [TEST-REPORT.md](services/home-shortlist-carrying-cost-comparison/TEST-REPORT.md) | [USER-GUIDE.md](services/home-shortlist-carrying-cost-comparison/USER-GUIDE.md) |

Fleet state after Wave 9: **93 atoms tested, 86 live and
PASSING as their latest verdict, 7 disabled by owner
ruling.**

## Wave 10 — 2026-11-15 — 7 atoms (Batch 15 first tests)

Triggered by the Batch 15 deploy (deployment
`fe07be725c5a4817ad7b7e341310a97b`, gateway v1.1.0; 100
atoms registered, 93 serving, 7 disabled by the owner's
U-13 ruling). Scope: first tests of Batch 15's seven atoms
(Gemini-designed cases, same battery and standard as Waves
1–9: full-pass / violations / sparse / malformed,
determinism byte-compare and MCP↔REST parity on the
full-pass case, real HTTP calls throughout, every case
file gated by the mechanical pre-flight validator before
execution). Tester key scopes were extended 93 → 100
before the wave through the real `POST /v1/keys` endpoint
(the same key returned on every grant,
`atm_1_ac543f43d09d66…`, last-4 `b1a2`), verified by
`GET /v1/keys` read-back — 100 scopes, none missing.
DeepSeek second reads ran on all seven atoms (each
carries computed quantities); the coordinator re-verified
all seven mechanically from the raw evidence after the
workstreams reported (statuses, verdict values, exact
failing-check sets, structured computed spot checks,
determinism/parity flags, 422 field names, judgment/results
consistency, report and guide presence, validator
reports) — **zero discrepancies** (25/25 mechanical
checks per atom).

**Result: 7 PASS / 0 FAIL.** All seven Batch 15 atoms
PASS at first test — the ninth consecutive cohort with
no atom failure (Batch 7 in the retest wave, Batches
8–12 in Waves 3–7, Batch 13's six live atoms in Wave 8,
Batch 14 in Wave 9, Batch 15 here), each built with F1
type validation and documented field types from the
start. **With this wave, all 100 registered atoms have
been externally tested: 93 live and PASSING as their
latest verdict, 7 disabled by owner ruling (U-13).**
No new findings — no F10 issued; `verification/FIX-SPECS.md`
is unchanged by this wave.

**Validator effect:** the raw Gemini designs drew **46
rejections** in total (R1 check-register ×26, R2
structured-spot-checks ×14, R3 violations-full-manifest
×4, R4 malformed-exactly-one ×2 — per-atom counts in
each atom's `validation-raw.json`). Every executed
battery was validator-passed, the Gemini judge recorded
zero tester errors in executed cases on all seven atoms,
and the **40 design-time corrections** (per-atom counts
in the results files: 4 on honest-seo-audit-intent-map,
json-schema-design-check and local-first-sync-design,
5 on javascript-review-and-build and
knowledge-graph-design, 9 on local-llm-serving-setup
and local-voice-stack-engineering-pack) are recorded
per atom in the TEST-REPORT.md files. Three of the
corrections were genuine-validity fixes the validator
does not cover, all caught by running the Python oracle
before execution: javascript-review-and-build's
manifests omitted the unconditional
`tests.logic_extracted_from_event_handlers_and_tested`
field (raw full-pass evaluated INSUFFICIENT_EVIDENCE,
26/0/1, not SOUND); local-llm-serving-setup's design
nested the five `operations.*` fields inside
`performance` instead of the documented top-level
`operations` object (INSUFFICIENT_EVIDENCE, 27/0/5);
knowledge-graph-design's design placed the five query
fields under `storage` instead of the top-level `query`
object (INSUFFICIENT_EVIDENCE, 26/0/5). None was scored
against its atom.

**DeepSeek↔Gemini agreement:** full on all seven atoms —
every recomputed quantity matched (SEO page counts and
intent/answer coverages; JavaScript file counts and ESM
coverage with the exact 9-check violations set; JSON
schema payload counts and the four coverages in both
directions — 1.000000 on full-pass, 0.000000 on
violations; knowledge-graph declared core-type count,
assertion counts and provenance/origin coverages; sync
entity counts and merge/stable-id coverages; LLM model
counts and budget/performance/golden-eval coverages;
voice engine counts and license/golden-evaluation
coverages), and the exact violations failing-check sets
were confirmed on every atom. No partials — nothing
required adjudication this wave.

**Doc-link absence — verified, by design (not a
finding):** Batch 15's seven atoms have no
DOCUMENTATION.md yet (their WS1 documentation pass
follows this wave), so the catalogue doc-link correctly
does not serve them: `GET /docs/<atom>` returns **404**
for all seven, and `/api.json` carries **no
`documentation` field** for any of the seven (verified
for all seven in the feed, which lists all 100 atoms).
The seven USER-GUIDEs claim no documentation link. When
their WS1 pass lands, the next deploy's doc guard
brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| honest-seo-audit-intent-map | **PASS** | — (first test) | — (malformed 422, field: technical.crawlable_robots_and_sitemap) | deepseek ✓ full | [TEST-REPORT.md](services/honest-seo-audit-intent-map/TEST-REPORT.md) | [USER-GUIDE.md](services/honest-seo-audit-intent-map/USER-GUIDE.md) |
| javascript-review-and-build | **PASS** | — (first test) | — (malformed 422, field: modules) | deepseek ✓ full | [TEST-REPORT.md](services/javascript-review-and-build/TEST-REPORT.md) | [USER-GUIDE.md](services/javascript-review-and-build/USER-GUIDE.md) |
| json-schema-design-check | **PASS** | — (first test) | — (malformed 422, field: schema) | deepseek ✓ full | [TEST-REPORT.md](services/json-schema-design-check/TEST-REPORT.md) | [USER-GUIDE.md](services/json-schema-design-check/USER-GUIDE.md) |
| knowledge-graph-design | **PASS** | — (first test) | — (malformed 422, field: schema.core_type_count) | deepseek ✓ full | [TEST-REPORT.md](services/knowledge-graph-design/TEST-REPORT.md) | [USER-GUIDE.md](services/knowledge-graph-design/USER-GUIDE.md) |
| local-first-sync-design | **PASS** | — (first test) | — (malformed 422, field: local_truth.device_store_authoritative) | deepseek ✓ full | [TEST-REPORT.md](services/local-first-sync-design/TEST-REPORT.md) | [USER-GUIDE.md](services/local-first-sync-design/USER-GUIDE.md) |
| local-llm-serving-setup | **PASS** | — (first test) | — (malformed 422, field: workload) | deepseek ✓ full | [TEST-REPORT.md](services/local-llm-serving-setup/TEST-REPORT.md) | [USER-GUIDE.md](services/local-llm-serving-setup/USER-GUIDE.md) |
| local-voice-stack-engineering-pack | **PASS** | — (first test) | — (malformed 422, field: pipeline) | deepseek ✓ full | [TEST-REPORT.md](services/local-voice-stack-engineering-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/local-voice-stack-engineering-pack/USER-GUIDE.md) |

Fleet state after Wave 10: **100 atoms tested, 93 live
and PASSING as their latest verdict, 7 disabled by
owner ruling.**

## Wave 11 — 2026-11-16 — 7 atoms (Batch 16 first tests)

Triggered by the Batch 16 deploy (deployment
`a15298eb9b7f40bf80d306cea4a33f80`, gateway v1.1.0; 107
atoms registered, 100 serving, 7 disabled by the owner's
U-13 ruling). Scope: first tests of Batch 16's seven atoms
(Gemini-designed cases, same battery and standard as Waves
1–10: full-pass / violations / sparse / malformed,
determinism byte-compare and MCP↔REST parity on the
full-pass case, real HTTP calls throughout, every case
file gated by the mechanical pre-flight validator before
execution). Tester key scopes were extended 100 → 107
before the wave through the real `POST /v1/keys` endpoint
(the same key returned on every grant,
`atm_1_ac543f43d09d66…`, last-4 `b1a2`), verified by
`GET /v1/keys` read-back — 107 scopes, none missing.
DeepSeek second reads ran on all seven atoms (each
carries computed quantities); the coordinator re-verified
all seven mechanically from the raw evidence after the
workstreams reported (statuses, verdict values, exact
failing-check sets, structured computed spot checks,
determinism/parity flags, 422 field names, judgment/results
consistency, report and guide presence, validator
reports) — **zero discrepancies** (25/25 mechanical
checks per atom).

**Result: 7 PASS / 0 FAIL.** All seven Batch 16 atoms
PASS at first test — the tenth consecutive cohort with
no atom failure (Batch 7 in the retest wave, Batches
8–12 in Waves 3–7, Batch 13's six live atoms in Wave 8,
Batch 14 in Wave 9, Batch 15 in Wave 10, Batch 16 here),
each built with F1 type validation and documented field
types from the start. **With this wave, all 107
registered atoms have been externally tested: 100 live
and PASSING as their latest verdict, 7 disabled by
owner ruling (U-13).** No new findings — no F11 issued;
`verification/FIX-SPECS.md` is unchanged by this wave.

**Validator effect:** the raw Gemini designs drew **40
rejections** in total (R1 check-register ×20, R2
structured-spot-checks ×14, R3 violations-full-manifest
×5, R4 malformed-exactly-one ×1 — per-atom counts in
each atom's `validation-raw.json`: 7 on
localization-readiness-review and
long-form-authoring-pipeline, 6 on
meaning-first-translation-with-tone-note and
meeting-decisions-and-actions-extract, 5 on
mcp-server-design-and-review and ml-project-framing-review,
4 on multiplatform-core-design). Every executed battery
was validator-passed, the Gemini judge recorded zero
tester errors in executed cases on all seven atoms, and
the design-time corrections — rebuilding each violations
case as the full manifest plus planted violations,
injecting the structured computed spot checks from the
oracle outputs, replacing the sparse cases with
identity-only manifests — were applied by the
coordinator's scripted drivers (`verification/wave11_fix.py`,
`verification/wave11_fix2.py`) and are recorded per atom
in the TEST-REPORT.md files. Three corrections were
genuine-validity fixes the validator does not cover, all
caught by running the Python oracle before execution:
long-form-authoring-pipeline's design wrote the section
fields as flat dotted keys instead of nested objects (29
checks missing until unflattened);
ml-project-framing-review's design nested the three
baseline fields under `metric.*` instead of `baseline.*`
and left the four gated `llm` fields undeclared (an
absent gated field reads as missing even when the gate
is declared false); meaning-first-translation-with-tone-note's
design declared the two `sensitive` booleans at their
failing polarity (both checks require `true`). The
planted violations were adapted to the designed row
counts — Gemini designed single-row lists on six atoms,
so the plants landed on row 0, with a duplicate row
appended where a name-duplication plant needed a second
row (mcp-server-design-and-review,
ml-project-framing-review) — and
meeting-decisions-and-actions-extract's malformed case
was reduced from two type violations to exactly one
(kept `meeting`; `source` set to a type-correct object).
One prose-only blemish: multiplatform-core-design's
violations case `notes` text misdescribes the
`platform_code_isolated` flag; the input, expected
failing set, evidence, judgment and DeepSeek recompute
are all consistent on the four planted violations. None
of the corrections was scored against its atom.

**DeepSeek↔Gemini agreement:** full on all seven atoms —
every recomputed quantity matched (localization locale
counts and format-test/direction/screenshot coverages;
long-form unit and review-pass counts with
single-point/point-outcome coverages and the missing
`facts_attribution` type on violations; MCP tool counts
(1 full-pass / 2 violations) with typed-schema,
valid-operation and negative-test coverages at 0.500000
on violations and the duplicated `get_user` name;
translation segment and carryover counts with
translation/meaning-preserved/exact-match/valid-kind
coverages; meeting decision/action/open-question counts
with anchor/faithful/owner/due-date coverages and
`inferred_marking_coverage` null — no inferred decisions
declared; ML metric counts (1 full-pass / 2 violations)
with tied-to-decision coverage 0.500000, baseline
coverage 1.000000 and the duplicated `m1` name;
multiplatform surface counts with kind/core-contract/
isolation/no-reimplementation coverages), and the exact
violations failing-check sets were confirmed on every
atom. No partials — nothing required adjudication this
wave.

**Doc-link absence — verified, by design (not a
finding):** Batch 16's seven atoms have no
DOCUMENTATION.md yet (their WS1 documentation pass
follows this wave), so the catalogue doc-link correctly
does not serve them: `GET /docs/<atom>` returns **404**
for all seven, and `/api.json` carries **no
`documentation` field** for any of the seven (verified
for all seven in the feed, which lists all 107 atoms —
exactly 93 entries carry `documentation`, and no
disabled atom carries one). The seven USER-GUIDEs claim
no documentation link. When their WS1 pass lands, the
next deploy's doc guard brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| localization-readiness-review | **PASS** | — (first test) | — (malformed 422, field: externalization) | deepseek ✓ full | [TEST-REPORT.md](services/localization-readiness-review/TEST-REPORT.md) | [USER-GUIDE.md](services/localization-readiness-review/USER-GUIDE.md) |
| long-form-authoring-pipeline | **PASS** | — (first test) | — (malformed 422, field: units) | deepseek ✓ full | [TEST-REPORT.md](services/long-form-authoring-pipeline/TEST-REPORT.md) | [USER-GUIDE.md](services/long-form-authoring-pipeline/USER-GUIDE.md) |
| mcp-server-design-and-review | **PASS** | — (first test) | — (malformed 422, field: tool_design) | deepseek ✓ full | [TEST-REPORT.md](services/mcp-server-design-and-review/TEST-REPORT.md) | [USER-GUIDE.md](services/mcp-server-design-and-review/USER-GUIDE.md) |
| meaning-first-translation-with-tone-note | **PASS** | — (first test) | — (malformed 422, field: segments) | deepseek ✓ full | [TEST-REPORT.md](services/meaning-first-translation-with-tone-note/TEST-REPORT.md) | [USER-GUIDE.md](services/meaning-first-translation-with-tone-note/USER-GUIDE.md) |
| meeting-decisions-and-actions-extract | **PASS** | — (first test) | — (malformed 422, field: meeting) | deepseek ✓ full | [TEST-REPORT.md](services/meeting-decisions-and-actions-extract/TEST-REPORT.md) | [USER-GUIDE.md](services/meeting-decisions-and-actions-extract/USER-GUIDE.md) |
| ml-project-framing-review | **PASS** | — (first test) | — (malformed 422, field: framing) | deepseek ✓ full | [TEST-REPORT.md](services/ml-project-framing-review/TEST-REPORT.md) | [USER-GUIDE.md](services/ml-project-framing-review/USER-GUIDE.md) |
| multiplatform-core-design | **PASS** | — (first test) | — (malformed 422, field: core) | deepseek ✓ full | [TEST-REPORT.md](services/multiplatform-core-design/TEST-REPORT.md) | [USER-GUIDE.md](services/multiplatform-core-design/USER-GUIDE.md) |

Fleet state after Wave 11: **107 atoms tested, 100 live
and PASSING as their latest verdict, 7 disabled by
owner ruling.**

## Wave 12 — 2026-11-16 — 6 atoms (Batch 17 first tests)

Triggered by the Batch 17 deploy (deployment
`c64bdc48fce84cd4817fe3a293be6ae5`, gateway v1.1.0; 113
atoms registered, 106 serving, 7 disabled by the owner's
U-13 ruling). Batch 17 deployed as six atoms: the seventh
authored atom, personal-financial-snapshot, is held
staged under an open U-13 ruling — it is not deployed
and is out of this wave entirely; it appears in this
index only as this staged/held note, never as tested.
Scope: first tests of Batch 17's six atoms
(Gemini-designed cases, same battery and standard as Waves
1–11: full-pass / violations / sparse / malformed,
determinism byte-compare and MCP↔REST parity on the
full-pass case, real HTTP calls throughout, every case
file gated by the mechanical pre-flight validator before
execution). Tester key scopes were extended 107 → 113
before the wave through the real `POST /v1/keys` endpoint
(grant body `{"atom": "<hyphenated service name>"}` — the
underscore form returns 404 `unknown atom`; the same key
returned on every grant, `atm_1_ac543f43d09d66…`, last-4
`b1a2`), verified by `GET /v1/keys` read-back — 113
scopes, none missing. DeepSeek second reads ran on all
six atoms (each carries computed quantities); the
coordinator re-verified all six mechanically from the
raw evidence after the workstreams reported (statuses,
verdict values, exact failing-check sets, structured
computed spot checks, determinism/parity flags, 422
field names, judgment/results consistency, report and
guide presence, validator reports) — **zero
discrepancies**.

**Result: 6 PASS / 0 FAIL.** All six Batch 17 atoms
PASS at first test — the eleventh consecutive cohort
with no atom failure (Batch 7 in the retest wave,
Batches 8–12 in Waves 3–7, Batch 13's six live atoms in
Wave 8, Batch 14 in Wave 9, Batch 15 in Wave 10, Batch
16 in Wave 11, Batch 17 here), each built with F1 type
validation and documented field types from the start.
**With this wave, all 113 registered atoms have been
externally tested: 106 live and PASSING as their latest
verdict, 7 disabled by owner ruling (U-13).** No new
findings — no F12 issued; `verification/FIX-SPECS.md`
is unchanged by this wave.

**Validator effect:** the raw Gemini designs drew **39
rejections** in total (R1 check-register ×19, R2
structured-spot-checks ×12, R3 violations-full-manifest
×5, R4 malformed-exactly-one ×3 — per-atom counts in
each atom's `validation-raw.json`: 12 on
observability-and-runbook-design, 8 on
poc-design-kill-criteria-verdict, 6 on
negotiation-preparation-pack, 5 on
native-mobile-build-plan, 4 on
offline-first-pwa-engineering-pack and
personal-web-presence-audit). Every executed battery
was validator-passed, the Gemini judge recorded zero
tester errors in executed cases on all six atoms, and
the design-time corrections — rebuilding each violations
case as the full manifest plus planted violations,
injecting the structured computed spot checks from the
oracle outputs, replacing the sparse cases with
identity-only manifests — are recorded per atom in the
TEST-REPORT.md files (44 corrections in total, carried
as `tester_errors` in the results records: 13 on
observability-and-runbook-design, 8 on
poc-design-kill-criteria-verdict, 6 each on
native-mobile-build-plan, negotiation-preparation-pack
and offline-first-pwa-engineering-pack, 5 on
personal-web-presence-audit). One correction was a
genuine-validity fix the validator does not cover,
caught by running the Python oracle before execution:
offline-first-pwa-engineering-pack's design nested
`core_flows` inside `architecture` (3 checks missing
until moved to the top level per SERVICE.md /
MANIFEST_SPEC, after which the oracle read 41/0/0).
None of the corrections was scored against its atom.

**DeepSeek↔Gemini agreement:** full on all six atoms —
every recomputed quantity matched (including
offline-first-pwa-engineering-pack's offline coverage
1.000000 on the full-pass case and 0.500000 on
violations, with the duplicated `login` flow named),
and the exact violations failing-check sets were
confirmed on every atom. No partials — nothing required
adjudication this wave.

**Doc-link absence — verified, by design (not a
finding):** Batch 17's six atoms have no
DOCUMENTATION.md yet (their WS1 documentation pass
follows this wave), so the catalogue doc-link correctly
does not serve them: `GET /docs/<atom>` returns **404**
for all six, and `/api.json` carries **no
`documentation` field** for any of the six (verified
for all six in the feed, which lists all 113 atoms —
exactly 100 entries carry `documentation`, and no
disabled atom carries one). The six USER-GUIDEs claim
no documentation link. When their WS1 pass lands, the
next deploy's doc guard brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| native-mobile-build-plan | **PASS** | — (first test) | — (malformed 422, field: constraints) | deepseek ✓ full | [TEST-REPORT.md](services/native-mobile-build-plan/TEST-REPORT.md) | [USER-GUIDE.md](services/native-mobile-build-plan/USER-GUIDE.md) |
| negotiation-preparation-pack | **PASS** | — (first test) | — (malformed 422, field: batna_and_reservation) | deepseek ✓ full | [TEST-REPORT.md](services/negotiation-preparation-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/negotiation-preparation-pack/USER-GUIDE.md) |
| observability-and-runbook-design | **PASS** | — (first test) | — (malformed 422, field: signals) | deepseek ✓ full | [TEST-REPORT.md](services/observability-and-runbook-design/TEST-REPORT.md) | [USER-GUIDE.md](services/observability-and-runbook-design/USER-GUIDE.md) |
| offline-first-pwa-engineering-pack | **PASS** | — (first test) | — (malformed 422, field: architecture.local_store_is_primary_source) | deepseek ✓ full | [TEST-REPORT.md](services/offline-first-pwa-engineering-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/offline-first-pwa-engineering-pack/USER-GUIDE.md) |
| personal-web-presence-audit | **PASS** | — (first test) | — (malformed 422, field: hub) | deepseek ✓ full | [TEST-REPORT.md](services/personal-web-presence-audit/TEST-REPORT.md) | [USER-GUIDE.md](services/personal-web-presence-audit/USER-GUIDE.md) |
| poc-design-kill-criteria-verdict | **PASS** | — (first test) | — (malformed 422, field: design) | deepseek ✓ full | [TEST-REPORT.md](services/poc-design-kill-criteria-verdict/TEST-REPORT.md) | [USER-GUIDE.md](services/poc-design-kill-criteria-verdict/USER-GUIDE.md) |

Fleet state after Wave 12: **113 atoms tested, 106 live
and PASSING as their latest verdict, 7 disabled by
owner ruling.** personal-financial-snapshot remains
staged/held under the open U-13 ruling — not deployed,
not tested.

## Wave 13 — 2026-11-16 — 7 atoms (Batch 18 first tests)

Triggered by the Batch 18 deploy (deployment
`9595ea665b634289aad158b7fff277ac`, gateway v1.1.0; 120
atoms registered, 113 serving, 7 disabled by the owner's
U-13 ruling). personal-financial-snapshot remains held
staged under the open U-13 ruling — it is not deployed
and is out of this wave entirely; it appears in this
index only as this staged/held note, never as tested.
Two of the seven — pricing-unit-economics-pack and
process-waste-review-coaching — deployed census-style
under screen-NO U-13 flags (controls in their
SERVICE.md); the flags changed nothing about the
battery. Scope: first tests of Batch 18's seven atoms
(Gemini-designed cases, same battery and standard as
Waves 1–12: full-pass / violations / sparse /
malformed, determinism byte-compare and MCP↔REST
parity on the full-pass case, real HTTP calls
throughout, every case file gated by the mechanical
pre-flight validator before execution). Tester key
scopes were extended 113 → 120 before the wave through
the real `POST /v1/keys` endpoint (grant body
`{"atom": "<hyphenated service name>"}` — the
underscore form returns 404 `unknown atom`; the scopes
read back in underscore namespace form; the same key
returned on every grant, `atm_1_ac543f43d09d66…`,
last-4 `b1a2`), verified by `GET /v1/keys` read-back —
120 scopes, none missing. DeepSeek second reads ran on
all seven atoms (each carries computed quantities);
the coordinator re-verified all seven mechanically from
the raw evidence after the workstreams reported
(statuses, verdict values, exact failing-check sets,
structured computed spot checks, determinism/parity
flags, 422 field names, judgment/results consistency,
validator reports, corrections counts, report and guide
presence) — **zero discrepancies**.

**Result: 7 PASS / 0 FAIL.** All seven Batch 18 atoms
PASS at first test — the twelfth consecutive cohort
with no atom failure (Batch 7 in the retest wave,
Batches 8–12 in Waves 3–7, Batch 13's six live atoms in
Wave 8, Batch 14 in Wave 9, Batch 15 in Wave 10, Batch
16 in Wave 11, Batch 17 in Wave 12, Batch 18 here),
each built with F1 type validation and documented
field types from the start. **With this wave, all 120
registered atoms have been externally tested: 113 live
and PASSING as their latest verdict, 7 disabled by
owner ruling (U-13).** No new findings — no F13
issued; `verification/FIX-SPECS.md` is unchanged by
this wave.

**Validator effect:** the raw Gemini designs drew **41
rejections** in total (R1 check-register ×19, R2
structured-spot-checks ×14, R3 violations-full-manifest
×6, R4 malformed-exactly-one ×2 — per-atom counts in
each atom's `validation-raw.json`: 8 on
prd-with-testable-acceptance-criteria and
product-metrics-event-taxonomy-pack, 6 on
production-rust-engineering-pack, 5 on
process-waste-review-coaching,
production-python-engineering-pack and
production-python-engineering-pack-expert, 4 on
pricing-unit-economics-pack). Every executed battery
was validator-passed, the Gemini judge recorded zero
tester errors in executed cases on all seven atoms,
and the design-time corrections — rebuilding each
violations case as the full manifest plus planted
violations, injecting the structured computed spot
checks from the oracle outputs, replacing the sparse
cases with identity-only manifests — are recorded per
atom in the TEST-REPORT.md files (45 corrections in
total, carried as `tester_errors` in the results
records: 9 on production-rust-engineering-pack, 8 each
on prd-with-testable-acceptance-criteria and
product-metrics-event-taxonomy-pack, 6 on
production-python-engineering-pack, 5 each on
process-waste-review-coaching and
production-python-engineering-pack-expert, 4 on
pricing-unit-economics-pack). Four corrections were
genuine-validity fixes the validator does not cover,
caught by running the Python oracle before execution:
production-rust-engineering-pack's design nested
`unsafe_blocks` under `unsafe_policy` instead of the
top level (6 checks missing until moved), placed the
two workspace fields under `tooling` instead of
`workspace`, and carried an extra ownership field in
its sparse case; production-python-engineering-pack's
sparse case carried an extra environment field and was
reduced to identity-only. None of the corrections was
scored against its atom. The two Python packs were
designed and judged strictly from their own contracts
— their registers share zero check names, and no
sibling vocabulary leaked into either battery.

**DeepSeek↔Gemini agreement:** full on all seven
atoms — every recomputed quantity matched (including
pricing-unit-economics-pack's violations contribution
margin `0.800801`, break-even `6.250000` and closing
MRR `1200.000000`; process-waste-review-coaching's
wait_share `0.166667` with bottleneck `Pick`;
production-python-engineering-pack's pin_coverage
`1.000000` on full-pass and `0.500000` on violations),
and the exact violations failing-check sets were
confirmed on every atom. No partials — nothing
required adjudication this wave.

**Doc-link absence — verified, by design (not a
finding):** Batch 18's seven atoms have no
DOCUMENTATION.md yet (their WS1 documentation pass
follows this wave), so the catalogue doc-link correctly
does not serve them: `GET /docs/<atom>` returns **404**
for all seven (coordinator's own probes), and
`/api.json` carries **no `documentation` field** for
any of the seven (verified for all seven in the feed,
which lists all 120 atoms — exactly 106 entries carry
`documentation`, and no disabled atom carries one).
The seven USER-GUIDEs claim no documentation link.
When their WS1 pass lands, the next deploy's doc guard
brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| prd-with-testable-acceptance-criteria | **PASS** | — (first test) | — (malformed 422, field: problem) | deepseek ✓ full | [TEST-REPORT.md](services/prd-with-testable-acceptance-criteria/TEST-REPORT.md) | [USER-GUIDE.md](services/prd-with-testable-acceptance-criteria/USER-GUIDE.md) |
| pricing-unit-economics-pack | **PASS** | — (first test) | — (malformed 422, field: revenue_model) | deepseek ✓ full | [TEST-REPORT.md](services/pricing-unit-economics-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/pricing-unit-economics-pack/USER-GUIDE.md) |
| process-waste-review-coaching | **PASS** | — (first test) | — (malformed 422, field: define) | deepseek ✓ full | [TEST-REPORT.md](services/process-waste-review-coaching/TEST-REPORT.md) | [USER-GUIDE.md](services/process-waste-review-coaching/USER-GUIDE.md) |
| product-metrics-event-taxonomy-pack | **PASS** | — (first test) | — (malformed 422, field: product) | deepseek ✓ full | [TEST-REPORT.md](services/product-metrics-event-taxonomy-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/product-metrics-event-taxonomy-pack/USER-GUIDE.md) |
| production-python-engineering-pack | **PASS** | — (first test) | — (malformed 422, field: environment) | deepseek ✓ full | [TEST-REPORT.md](services/production-python-engineering-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/production-python-engineering-pack/USER-GUIDE.md) |
| production-python-engineering-pack-expert | **PASS** | — (first test) | — (malformed 422, field: expert_typing) | deepseek ✓ full | [TEST-REPORT.md](services/production-python-engineering-pack-expert/TEST-REPORT.md) | [USER-GUIDE.md](services/production-python-engineering-pack-expert/USER-GUIDE.md) |
| production-rust-engineering-pack | **PASS** | — (first test) | — (malformed 422, field: ownership.borrow_before_cloning_practised) | deepseek ✓ full | [TEST-REPORT.md](services/production-rust-engineering-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/production-rust-engineering-pack/USER-GUIDE.md) |

Fleet state after Wave 13: **120 atoms tested, 113 live
and PASSING as their latest verdict, 7 disabled by
owner ruling.** personal-financial-snapshot remains
staged/held under the open U-13 ruling — not deployed,
not tested.

## Wave 14 — 2026-11-16 — 6 atoms (Batch 19 first tests)

Triggered by the Batch 19 deploy (deployment
`b71b0351b5994d9da5dc7bebffcd3189`, gateway v1.1.0; 126
atoms registered, 119 serving, 7 disabled by the
owner's U-13 ruling). Batch 19 deployed as six atoms:
personal-financial-snapshot and
smart-grid-der-design-pack both remain held staged
under open U-13 rulings — neither is deployed and both
are out of this wave entirely; they appear in this
index only as this staged/held note, never as tested.
Three of the six —
production-rust-engineering-pack-expert,
quant-math-derivation-sanity-check and
service-isolation-hardening-review — deployed
census-style under screen-NO U-13 flags (controls in
their SERVICE.md); the flags changed nothing about
the battery. Scope: first tests of Batch 19's six
deployed atoms (Gemini-designed cases, same battery
and standard as Waves 1–13: full-pass / violations /
sparse / malformed, determinism byte-compare and
MCP↔REST parity on the full-pass case, real HTTP
calls throughout, every case file gated by the
mechanical pre-flight validator before execution).
Tester key scopes were extended 120 → 126 before the
wave through the real `POST /v1/keys` endpoint (grant
body `{"atom": "<hyphenated service name>"}` — the
underscore form returns 404 `unknown atom`; the scopes
read back in underscore namespace form; the same key
returned on every grant, `atm_1_ac543f43d09d66…`,
last-4 `b1a2`), verified by `GET /v1/keys` read-back —
126 scopes, none missing. DeepSeek second reads ran
on all six atoms (each carries computed quantities);
the coordinator re-verified all six mechanically from
the raw evidence after the workstreams reported
(statuses, verdict values, exact failing-check sets,
structured computed spot checks, determinism/parity
flags, 422 field names, judgment/results consistency,
validator reports, corrections counts, report and
guide presence) — **zero discrepancies**.

**Result: 6 PASS / 0 FAIL.** All six Batch 19 atoms
PASS at first test — the thirteenth consecutive
cohort with no atom failure (Batch 7 in the retest
wave, Batches 8–12 in Waves 3–7, Batch 13's six live
atoms in Wave 8, Batch 14 in Wave 9, Batch 15 in Wave
10, Batch 16 in Wave 11, Batch 17 in Wave 12, Batch
18 in Wave 13, Batch 19 here), each built with F1
type validation and documented field types from the
start. **With this wave, all 126 registered atoms
have been externally tested: 119 live and PASSING as
their latest verdict, 7 disabled by owner ruling
(U-13).** No new findings — no F14 issued;
`verification/FIX-SPECS.md` is unchanged by this wave.

**Validator effect:** the raw Gemini designs drew
**35 rejections** in total (R1 check-register ×16, R2
structured-spot-checks ×12, R3 violations-full-manifest
×4, R4 malformed-exactly-one ×3 — per-atom counts in
each atom's `validation-raw.json`: 8 on
release-pack-changelog-seal-rollback, 7 on
semantic-html-review, 6 on
single-living-trip-itinerary, 5 on
production-rust-engineering-pack-expert and
service-isolation-hardening-review, 4 on
quant-math-derivation-sanity-check). Every executed
battery was validator-passed, the Gemini judge
recorded zero tester errors in executed cases on all
six atoms, and the design-time corrections —
rebuilding each violations case as the full manifest
plus planted violations, injecting the structured
computed spot checks from the oracle outputs,
replacing the sparse cases with identity-only
manifests — are recorded per atom in the
TEST-REPORT.md files (37 corrections in total,
carried as `tester_errors` in the results records: 8
on release-pack-changelog-seal-rollback, 7 on
semantic-html-review, 6 each on
production-rust-engineering-pack-expert and
single-living-trip-itinerary, 5 each on
quant-math-derivation-sanity-check and
service-isolation-hardening-review). Two corrections
were genuine-validity fixes the validator does not
cover, caught by running the Python oracle before
execution: production-rust-engineering-pack-expert's
sparse case carried one lifetime flag (1 pass / 36
missing until reduced to the identity-only manifest);
quant-math-derivation-sanity-check's full-pass
declared a result unit of `m/s` where SERVICE.md's
unit algebra produces the literal `m/s^2*s` for
m/s^2 × s — the declared result units were repaired
to the algebra's literal output, after which the
oracle returns all 30 checks pass. None of the
corrections was scored against its atom.

**DeepSeek↔Gemini agreement:** full on all six
atoms — every recomputed quantity matched (including
quant-math-derivation-sanity-check's
`arithmetic_match_ratio` `1.000000` on full-pass and
`0.000000` on violations, from step arithmetic
10.0 × 5.0 = 50.0 against the declared 999.0;
single-living-trip-itinerary's
`computed_booked_total` `1000.000000` with
`booked_total_difference` `-1.000000` on violations;
release-pack-changelog-seal-rollback's six coverages
at `1.000000`), and the exact violations
failing-check sets were confirmed on every atom. No
partials — nothing required adjudication this wave.

**Doc-link absence — verified, by design (not a
finding):** Batch 19's six atoms have no
DOCUMENTATION.md yet (their WS1 documentation pass
follows this wave), so the catalogue doc-link
correctly does not serve them: `GET /docs/<atom>`
returns **404** for all six (coordinator's own
probes), and `/api.json` carries **no
`documentation` field** for any of the six (verified
for all six in the feed, which lists all 126 atoms —
exactly 113 entries carry `documentation`, and no
disabled atom carries one; the two held atoms do not
appear in the feed at all). The six USER-GUIDEs claim
no documentation link. When their WS1 pass lands, the
next deploy's doc guard brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| production-rust-engineering-pack-expert | **PASS** | — (first test) | — (malformed 422, field: project) | deepseek ✓ full | [TEST-REPORT.md](services/production-rust-engineering-pack-expert/TEST-REPORT.md) | [USER-GUIDE.md](services/production-rust-engineering-pack-expert/USER-GUIDE.md) |
| quant-math-derivation-sanity-check | **PASS** | — (first test) | — (malformed 422, field: steps) | deepseek ✓ full | [TEST-REPORT.md](services/quant-math-derivation-sanity-check/TEST-REPORT.md) | [USER-GUIDE.md](services/quant-math-derivation-sanity-check/USER-GUIDE.md) |
| release-pack-changelog-seal-rollback | **PASS** | — (first test) | — (malformed 422, field: version_detail) | deepseek ✓ full | [TEST-REPORT.md](services/release-pack-changelog-seal-rollback/TEST-REPORT.md) | [USER-GUIDE.md](services/release-pack-changelog-seal-rollback/USER-GUIDE.md) |
| semantic-html-review | **PASS** | — (first test) | — (malformed 422, field: headings) | deepseek ✓ full | [TEST-REPORT.md](services/semantic-html-review/TEST-REPORT.md) | [USER-GUIDE.md](services/semantic-html-review/USER-GUIDE.md) |
| service-isolation-hardening-review | **PASS** | — (first test) | — (malformed 422, field: services) | deepseek ✓ full | [TEST-REPORT.md](services/service-isolation-hardening-review/TEST-REPORT.md) | [USER-GUIDE.md](services/service-isolation-hardening-review/USER-GUIDE.md) |
| single-living-trip-itinerary | **PASS** | — (first test) | — (malformed 422, field: header) | deepseek ✓ full | [TEST-REPORT.md](services/single-living-trip-itinerary/TEST-REPORT.md) | [USER-GUIDE.md](services/single-living-trip-itinerary/USER-GUIDE.md) |

Fleet state after Wave 14: **126 atoms tested, 119
live and PASSING as their latest verdict, 7 disabled
by owner ruling.** personal-financial-snapshot and
smart-grid-der-design-pack remain staged/held under
open U-13 rulings — not deployed, not tested.

## Wave 15 — 2026-11-16 — 6 atoms (Batch 20 first tests)

Triggered by the Batch 20 deploy (deployment
`ac6ddba696934ceb84596876507fc08c`, gateway v1.1.0; 132
atoms registered, 125 serving, 7 disabled by the
owner's U-13 ruling). Batch 20 deployed as six atoms:
personal-financial-snapshot,
smart-grid-der-design-pack and
structured-root-cause-analysis all remain held staged
under open U-13 rulings — none is deployed and all
three are out of this wave entirely; they appear in
this index only as this staged/held note, never as
tested. Five of the six —
sourced-visual-reference-search,
sql-schema-query-engineering-pack,
statistical-study-design-report,
strict-typescript-engineering-pack and
structured-decision-making — deployed census-style
under screen-NO U-13 flags (controls in their
SERVICE.md); sourced-podcast-episode-production
screened No outright; the flags changed nothing about
the battery. Scope: first tests of Batch 20's six
deployed atoms (Gemini-designed cases, same battery
and standard as Waves 1–14: full-pass / violations /
sparse / malformed, determinism byte-compare and
MCP↔REST parity on the full-pass case, real HTTP
calls throughout, every case file gated by the
mechanical pre-flight validator before execution).
Tester key scopes were extended 126 → 132 before the
wave through the real `POST /v1/keys` endpoint (grant
body `{"atom": "<hyphenated service name>"}` — the
underscore form returns 404 `unknown atom`; the scopes
read back in underscore namespace form; the same key
returned on every grant, `atm_1_ac543f43d09d66…`,
last-4 `b1a2`), verified by `GET /v1/keys` read-back —
132 scopes, none missing. DeepSeek second reads ran
on all six atoms (each carries computed quantities);
the coordinator re-verified all six mechanically from
the raw evidence after the workstreams reported
(statuses, verdict values, exact failing-check sets,
structured computed spot checks, determinism/parity
flags, 422 field names, judgment/results consistency,
validator reports, corrections counts, report and
guide presence) — **zero discrepancies**.

**Result: 6 PASS / 0 FAIL.** All six Batch 20 atoms
PASS at first test — the fourteenth consecutive
cohort with no atom failure (Batch 7 in the retest
wave, Batches 8–12 in Waves 3–7, Batch 13's six live
atoms in Wave 8, Batch 14 in Wave 9, Batch 15 in Wave
10, Batch 16 in Wave 11, Batch 17 in Wave 12, Batch
18 in Wave 13, Batch 19 in Wave 14, Batch 20 here),
each built with F1 type validation and documented
field types from the start. **With this wave, all 132
registered atoms have been externally tested: 125
live and PASSING as their latest verdict, 7 disabled
by owner ruling (U-13).** No new findings — no F15
issued; `verification/FIX-SPECS.md` is unchanged by
this wave.

**Validator effect:** the raw Gemini designs drew
**38 rejections** in total (R1 check-register ×17, R2
structured-spot-checks ×12, R3 violations-full-manifest
×5, R4 malformed-exactly-one ×4 — per-atom counts in
each atom's `validation-raw.json`: 8 on
statistical-study-design-report, 7 on
sourced-podcast-episode-production and
sql-schema-query-engineering-pack, 6 on
sourced-visual-reference-search and
structured-decision-making, 4 on
strict-typescript-engineering-pack). Every executed
battery was validator-passed, the Gemini judge
recorded zero tester errors in executed cases on all
six atoms, and the design-time corrections —
rebuilding each violations case as the full manifest
with planted mutations whose failing set is the
oracle's exact failing set, injecting structured
computed spot checks from oracle output, and
rebuilding each malformed case to exactly one
documented type violation — totalled 39 across the
six atoms (structured-decision-making carried one
further oracle-pre-check correction beyond its six
validator rejections: its raw full-pass design
returned NOT_SOUND on the oracle and its design
values were repaired before execution). No executed
case was scored on a design error.

**DeepSeek agreement:** full on five atoms. On
strict-typescript-engineering-pack DeepSeek returned
"AGREEMENT: partial" — every quantity it recomputed
matched, but it claimed the artifact's summary text
("39 checks") was inconsistent with a checks array it
counted as 38 entries. The coordinator adjudicated by
direct recount of the recorded artifact: the checks
array carries exactly 39 entries (the
module_structure_and_declared_modules section carries
7, not the 6 DeepSeek tallied; 4+4+6+3+7+4+7+4 = 39),
and the summary is self-consistent. The partial rests
on the second tester's own miscount, recorded here
honestly; in substance the agreement is full on all
six atoms.

**Doc-link absence — verified, by design (recorded,
not scored):** `GET /docs/<atom>` returned 404 for
all six (coordinator's own probes), and `/api.json`
parsed as an object carries 132 entries — exactly 7
disabled, exactly 119 entries carry `documentation`,
none of the six, and no disabled atom carries one;
the three held atoms do not appear in the feed at
all. The six USER-GUIDEs claim no documentation link.
When their WS1 pass lands, the next deploy's doc
guard brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| sourced-podcast-episode-production | **PASS** | — (first test) | — (malformed 422, field: scoping) | deepseek ✓ full | [TEST-REPORT.md](services/sourced-podcast-episode-production/TEST-REPORT.md) | [USER-GUIDE.md](services/sourced-podcast-episode-production/USER-GUIDE.md) |
| sourced-visual-reference-search | **PASS** | — (first test) | — (malformed 422, field: brief) | deepseek ✓ full | [TEST-REPORT.md](services/sourced-visual-reference-search/TEST-REPORT.md) | [USER-GUIDE.md](services/sourced-visual-reference-search/USER-GUIDE.md) |
| sql-schema-query-engineering-pack | **PASS** | — (first test) | — (malformed 422, field: project) | deepseek ✓ full | [TEST-REPORT.md](services/sql-schema-query-engineering-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/sql-schema-query-engineering-pack/USER-GUIDE.md) |
| statistical-study-design-report | **PASS** | — (first test) | — (malformed 422, field: framing.decision_stated) | deepseek ✓ full | [TEST-REPORT.md](services/statistical-study-design-report/TEST-REPORT.md) | [USER-GUIDE.md](services/statistical-study-design-report/USER-GUIDE.md) |
| strict-typescript-engineering-pack | **PASS** | — (first test) | — (malformed 422, field: tsconfig) | deepseek ✓ full | [TEST-REPORT.md](services/strict-typescript-engineering-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/strict-typescript-engineering-pack/USER-GUIDE.md) |
| structured-decision-making | **PASS** | — (first test) | — (malformed 422, field: decision) | deepseek ✓ full | [TEST-REPORT.md](services/structured-decision-making/TEST-REPORT.md) | [USER-GUIDE.md](services/structured-decision-making/USER-GUIDE.md) |

Fleet state after Wave 15: **132 atoms tested, 125
live and PASSING as their latest verdict, 7 disabled
by owner ruling.** personal-financial-snapshot,
smart-grid-der-design-pack and
structured-root-cause-analysis remain staged/held
under open U-13 rulings — not deployed, not tested.

## Wave 16 — 2026-11-16 — 5 atoms (Batch 21 first tests)

Triggered by the Batch 21 deploy (deployment
`22647267ae414ecbb3a5ee342afd73f8`, gateway v1.1.0; 137
atoms registered, 130 serving, 7 disabled by the
owner's U-13 ruling). Batch 21 deployed as five atoms:
personal-financial-snapshot,
smart-grid-der-design-pack,
structured-root-cause-analysis,
system-design-failure-mode-pack and
technical-explainer-content-pack all remain held staged
under open U-13 rulings — none is deployed and all
five are out of this wave entirely; they appear in
this index only as this staged/held note, never as
tested. Batch 22's six staged atoms
(validated-simulation-scenario-pack — a hold
candidate — vendor-evaluation-three-way-match-pack,
verified-place-shortlist, voice-note-narration-audio,
zero-knowledge-system-design-pack,
zero-trust-architecture-design-pack) are likewise not
deployed and out of this wave. Two of the five —
tech-stack-decision-memo and
ux-flow-component-spec-pack — deployed census-style
under screen-NO U-13 flags (controls in their
SERVICE.md); technical-documentation-pack,
testing-strategy-regression-pack and
uat-scenario-sign-off-pack screened No outright; the
flags changed nothing about the battery. Scope: first
tests of Batch 21's five deployed atoms
(Gemini-designed cases, same battery and standard as
Waves 1–15: full-pass / violations / sparse /
malformed, determinism byte-compare and MCP↔REST
parity on the full-pass case, real HTTP calls
throughout, every case file gated by the mechanical
pre-flight validator before execution). Tester key
scopes were extended 132 → 137 before the wave through
the real `POST /v1/keys` endpoint (grant body
`{"atom": "<hyphenated service name>"}` — the
underscore form returns 404 `unknown atom`; the scopes
read back in underscore namespace form; the same key
returned on every grant, `atm_1_ac543f43d09d66…`,
last-4 `b1a2`), verified by `GET /v1/keys` read-back —
137 scopes, none missing. DeepSeek second reads ran
on all five atoms (each carries computed quantities);
the coordinator re-verified all five mechanically from
the raw evidence after the workstreams reported
(statuses, verdict values, exact failing-check sets,
structured computed spot checks, determinism/parity
flags, 422 field names, judgment/results consistency,
validator reports, corrections counts, report and
guide presence) — **zero discrepancies**.

**Result: 5 PASS / 0 FAIL.** All five Batch 21 atoms
PASS at first test — the fifteenth consecutive
cohort with no atom failure (Batch 7 in the retest
wave, Batches 8–12 in Waves 3–7, Batch 13's six live
atoms in Wave 8, Batch 14 in Wave 9, Batch 15 in Wave
10, Batch 16 in Wave 11, Batch 17 in Wave 12, Batch
18 in Wave 13, Batch 19 in Wave 14, Batch 20 in Wave
15, Batch 21 here), each built with F1 type
validation and documented field types from the start.
**With this wave, all 137 registered atoms have been
externally tested: 130 live and PASSING as their
latest verdict, 7 disabled by owner ruling (U-13).**
No new findings — no F16 issued;
`verification/FIX-SPECS.md` is unchanged by this wave.

**Validator effect:** the raw Gemini designs drew
**35 rejections** in total (R1 check-register ×18, R2
structured-spot-checks ×10, R3 violations-full-manifest
×5, R4 malformed-exactly-one ×2 — per-atom counts in
each atom's `validation-raw.json`: 8 on
tech-stack-decision-memo, 7 on
testing-strategy-regression-pack,
uat-scenario-sign-off-pack and
ux-flow-component-spec-pack, 6 on
technical-documentation-pack). Every executed
battery was validator-passed, the Gemini judge
recorded zero tester errors in executed cases on all
five atoms, and the design-time corrections —
rebuilding each violations case as the full manifest
with planted mutations whose failing set is the
oracle's exact failing set, injecting structured
computed spot checks from oracle output, and
rebuilding each malformed case to exactly one
documented type violation — totalled 36 across the
five atoms (tech-stack-decision-memo carried one
further oracle-pre-check correction beyond its eight
validator rejections: its raw full-pass design lacked
per-candidate `weighted_total_declared` values and
carried a stray top-level field; both repaired before
execution). No executed case was scored on a design
error.

**DeepSeek agreement:** full on four atoms. On
ux-flow-component-spec-pack DeepSeek returned
"AGREEMENT: partial" — every quantity it recomputed
matched, but it claimed the artifact's checks array
carries 46 entries against a summary of 45 checks.
The coordinator adjudicated by direct recount of the
recorded artifact: the checks array carries exactly
45 entries (the ux_data_surface_states section carries
5, not the 6 DeepSeek tallied), the oracle register
is 45, and the summary is self-consistent. The
partial rests on the second tester's own miscount,
recorded here honestly; in substance the agreement
is full on all five atoms.

**Doc-link absence — verified, by design (recorded,
not scored):** `GET /docs/<atom>` returned 404 for
all five (coordinator's own probes), and `/api.json`
parsed as an object carries 137 entries — exactly 7
disabled, exactly 125 entries carry `documentation`,
none of the five, and no disabled atom carries one;
the five held atoms and Batch 22's six staged atoms
do not appear in the feed at all. The five
USER-GUIDEs claim no documentation link. When their
WS1 pass lands, the next deploy's doc guard brings
them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| tech-stack-decision-memo | **PASS** | — (first test) | — (malformed 422, field: context) | deepseek ✓ full | [TEST-REPORT.md](services/tech-stack-decision-memo/TEST-REPORT.md) | [USER-GUIDE.md](services/tech-stack-decision-memo/USER-GUIDE.md) |
| technical-documentation-pack | **PASS** | — (first test) | — (malformed 422, field: documents) | deepseek ✓ full | [TEST-REPORT.md](services/technical-documentation-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/technical-documentation-pack/USER-GUIDE.md) |
| testing-strategy-regression-pack | **PASS** | — (first test) | — (malformed 422, field: scoping) | deepseek ✓ full | [TEST-REPORT.md](services/testing-strategy-regression-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/testing-strategy-regression-pack/USER-GUIDE.md) |
| uat-scenario-sign-off-pack | **PASS** | — (first test) | — (malformed 422, field: scope) | deepseek ✓ full | [TEST-REPORT.md](services/uat-scenario-sign-off-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/uat-scenario-sign-off-pack/USER-GUIDE.md) |
| ux-flow-component-spec-pack | **PASS** | — (first test) | — (malformed 422, field: flow_steps) | deepseek ✓ full in substance | [TEST-REPORT.md](services/ux-flow-component-spec-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/ux-flow-component-spec-pack/USER-GUIDE.md) |

Fleet state after Wave 16: **137 atoms tested, 130
live and PASSING as their latest verdict, 7 disabled
by owner ruling.** personal-financial-snapshot,
smart-grid-der-design-pack,
structured-root-cause-analysis,
system-design-failure-mode-pack and
technical-explainer-content-pack remain staged/held
under open U-13 rulings — not deployed, not tested.

## Wave 17 — 2026-11-16 — 5 atoms (Batch 22 first tests — FINAL WAVE)

Triggered by the Batch 22 deploy (deployment
`ee6a845a54d94e829dd0aad9f8cd9d41`, gateway v1.1.0; 142
atoms registered, 135 serving, 7 disabled by the
owner's U-13 ruling). Batch 22 deployed as five atoms:
personal-financial-snapshot,
smart-grid-der-design-pack,
structured-root-cause-analysis,
system-design-failure-mode-pack,
technical-explainer-content-pack and
validated-simulation-scenario-pack all remain held
staged under open U-13 rulings — none is deployed and
all six are out of this wave entirely; they appear in
this index only as this staged/held note, never as
tested. Three of the five —
vendor-evaluation-three-way-match-pack,
zero-knowledge-system-design-pack and
zero-trust-architecture-design-pack — deployed
census-style under screen-NO U-13 flags (controls in
their SERVICE.md); verified-place-shortlist and
voice-note-narration-audio screened No outright; the
flags changed nothing about the battery. Scope: first
tests of Batch 22's five deployed atoms
(Gemini-designed cases, same battery and standard as
Waves 1–16: full-pass / violations / sparse /
malformed, determinism byte-compare and MCP↔REST
parity on the full-pass case, real HTTP calls
throughout, every case file gated by the mechanical
pre-flight validator before execution). Tester key
scopes were extended 137 → 142 before the wave through
the real `POST /v1/keys` endpoint (grant body
`{"atom": "<hyphenated service name>"}` — the
underscore form returns 404 `unknown atom`; the scopes
read back in underscore namespace form; the same key
returned on every grant, `atm_1_ac543f43d09d66…`,
last-4 `b1a2`), verified by `GET /v1/keys` read-back —
142 scopes, none missing. DeepSeek second reads ran
on all five atoms (each carries computed quantities);
the coordinator re-verified all five mechanically from
the raw evidence after the workstreams reported
(statuses, verdict values, exact failing-check sets,
structured computed spot checks, determinism/parity
flags, 422 field names, judgment/results consistency,
validator reports, corrections counts, report and
guide presence) — **zero discrepancies**.

**Result: 5 PASS / 0 FAIL.** All five Batch 22 atoms
PASS at first test — the sixteenth consecutive
cohort with no atom failure (Batch 7 in the retest
wave, Batches 8–12 in Waves 3–7, Batch 13's six live
atoms in Wave 8, Batch 14 in Wave 9, Batch 15 in Wave
10, Batch 16 in Wave 11, Batch 17 in Wave 12, Batch
18 in Wave 13, Batch 19 in Wave 14, Batch 20 in Wave
15, Batch 21 in Wave 16, Batch 22 here), each built
with F1 type validation and documented field types
from the start.
**With this wave, all 142 registered atoms have been
externally tested: 135 live and PASSING as their
latest verdict, 7 disabled by owner ruling (U-13).**
No new findings — no F17 issued;
`verification/FIX-SPECS.md` is unchanged by this wave.

**Validator effect:** the raw Gemini designs drew
**26 rejections** in total (R1 check-register ×11, R2
structured-spot-checks ×10, R3 violations-full-manifest
×5, R4 malformed-exactly-one ×0 — per-atom counts in
each atom's `validation-raw.json`: 6 on
voice-note-narration-audio, 5 on each of the other
four). Every executed battery was validator-passed,
the Gemini judge recorded zero tester errors in
executed cases on all five atoms, and the design-time
corrections — rebuilding each violations case as the
full manifest with planted mutations whose failing
set is the oracle's exact failing set, injecting
structured computed spot checks from oracle output,
and rebuilding each malformed case to exactly one
documented type violation — totalled 27 across the
five atoms (voice-note-narration-audio carried one
further oracle-pre-check correction beyond its six
validator rejections: its raw sparse design — title
only — returns NOT_SOUND on the oracle because the
red-line voice-consent check fails when its field is
absent by design, so the sparse input was rebuilt to
declare consent and nothing else, returning
INSUFFICIENT_EVIDENCE with 1 pass / 0 fail / 45
missing; the atom's behavior was the contract's, the
design was the error). No executed case was scored
on a design error.

**DeepSeek agreement:** full on four atoms. On
zero-trust-architecture-design-pack DeepSeek returned
"AGREEMENT: partial" — every quantity it recomputed
matched, but it claimed the artifact's checks arrays
carry 55 entries against a summary of 54 checks. The
coordinator adjudicated by direct recount of the
recorded artifact: the checks array carries exactly
54 entries (the device_and_workload_trust section
carries 8, not the 9 DeepSeek tallied), the oracle
register is 54, and the summary is self-consistent.
The partial rests on the second tester's own
miscount — the same failure mode as Waves 15 and 16 —
recorded here honestly; in substance the agreement
is full on all five atoms. One observation, not a
disagreement: on verified-place-shortlist DeepSeek
noted that SERVICE.md's "integers, exactly" phrase
sits beside `verified_places_total_review_count`'s
6-decimal string serialization; DeepSeek itself
scored the value a match in both cases (the phrase
attaches to the count fields, which are integers;
the total is the oracle's fixed 6dp serialization),
and it affects no verdict or ratio.

**Doc-link absence — verified, by design (recorded,
not scored):** `GET /docs/<atom>` returned 404 for
all five (coordinator's own probes), and `/api.json`
parsed as an object carries 142 entries — exactly 7
disabled, exactly 130 entries carry `documentation`,
none of the five, and no disabled atom carries one;
the six held atoms do not appear in the feed at all.
The five USER-GUIDEs claim no documentation link.
When their WS1 pass lands, the next deploy's doc
guard brings them into scope.

| Atom | Verdict | Prior | Findings | 2nd tester | Report | Guide |
|---|---|---|---|---|---|---|
| vendor-evaluation-three-way-match-pack | **PASS** | — (first test) | — (malformed 422, field: pack_title) | deepseek ✓ full | [TEST-REPORT.md](services/vendor-evaluation-three-way-match-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/vendor-evaluation-three-way-match-pack/USER-GUIDE.md) |
| verified-place-shortlist | **PASS** | — (first test) | — (malformed 422, field: criteria) | deepseek ✓ full | [TEST-REPORT.md](services/verified-place-shortlist/TEST-REPORT.md) | [USER-GUIDE.md](services/verified-place-shortlist/USER-GUIDE.md) |
| voice-note-narration-audio | **PASS** | — (first test) | — (malformed 422, field: scoping) | deepseek ✓ full | [TEST-REPORT.md](services/voice-note-narration-audio/TEST-REPORT.md) | [USER-GUIDE.md](services/voice-note-narration-audio/USER-GUIDE.md) |
| zero-knowledge-system-design-pack | **PASS** | — (first test) | — (malformed 422, field: circuits) | deepseek ✓ full | [TEST-REPORT.md](services/zero-knowledge-system-design-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/zero-knowledge-system-design-pack/USER-GUIDE.md) |
| zero-trust-architecture-design-pack | **PASS** | — (first test) | — (malformed 422, field: assets) | deepseek ✓ full in substance | [TEST-REPORT.md](services/zero-trust-architecture-design-pack/TEST-REPORT.md) | [USER-GUIDE.md](services/zero-trust-architecture-design-pack/USER-GUIDE.md) |

Fleet state after Wave 17: **142 atoms tested, 135
live and PASSING as their latest verdict, 7 disabled
by owner ruling.** personal-financial-snapshot,
smart-grid-der-design-pack,
structured-root-cause-analysis,
system-design-failure-mode-pack,
technical-explainer-content-pack and
validated-simulation-scenario-pack remain staged/held
under open U-13 rulings — not deployed, not tested.

**Program end-state (Wave 17 is the final wave of
the replication program): the external verification
program now covers every deployed atom.** All 142
registered atoms have been externally tested: 135
serving atoms stand PASSING as their latest verdict,
and the 7 disabled atoms are accounted
DISABLED-BY-OWNER-RULING (U-13) — each was tested
while live or carries its recorded disposition in
this index, and none serves traffic. The six
staged-held atoms (personal-financial-snapshot,
smart-grid-der-design-pack,
structured-root-cause-analysis,
system-design-failure-mode-pack,
technical-explainer-content-pack,
validated-simulation-scenario-pack) are not deployed
and were never tested; they enter this program only
if the Director rules them publishable, at which
point each takes the same first-test battery before
it counts as verified. No atom failure is open:
F1–F4 are closed, no F5–F17 was ever issued, and
`verification/FIX-SPECS.md` carries no open spec.
