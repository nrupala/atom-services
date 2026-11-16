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
