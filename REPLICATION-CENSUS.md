# Replication Census — atom-services

**Date:** 2026-11-15 (Step 0 of the replication program)
**Method:** direct filesystem read of every unit under `services/` (162 dirs), YAML parse of every `contract.yaml`, presence checks for `src/`, `tests/`, `listing/`, and test execution where tests exist. No inference from the register alone.
**Owner rules applied:** every contract's pricing stays `null` (verified: 162/162 `rate: null`); contract-only atoms go on the GAPS list — never silently skipped, never force-ported past a failing (or absent) oracle.

## Counts by readiness class

| Class | Definition | Count |
|---|---|---|
| **LIVE — already replicated** | Contract + deterministic Python core + passing tests + TS port in gateway + handler registered + catalogue row + registry listing published (`org.aimlds/…`) | **1** |
| **GAP-G1 — contract-only, bound skill exists** | Contract + SERVICE.md + scaffold listing present; NO `src/` core, NO `tests/`, NO oracle. Bound skill is an LLM judgment text (`SKILL.md` in `workspace/mymilo-build/skills/` — verified present on disk for all in this class), not deterministic code | **153** |
| **GAP-G2 — contract-only, no bound skill** | As G1, plus no bound skill at all (knowledge-corpus atoms; core must be authored from the corpus, not a skill text) | **8** |
| **Core present but tests failing** | — | **0** |
| **Total** | | **162** |

Tier split: Tier A = 48 (1 live + 47 gap), Tier B = 114 (all gap).

## The one live atom (template)

- `release-readiness-verdict` (Tier A, VERDICT, unit: call)
  - Contract: present, hand-built, `status: built-locally`, pricing `rate: null / pending`
  - Core: `src/release_readiness.py` (+ `keys.py`, `bench.py`) — deterministic, stdlib-only
  - Tests: `tests/test_release_readiness.py` — **16/16 passing** (re-run 2026-11-15, pytest: `16 passed in 0.09s`)
  - TS port: `rails/gateway/src/atoms/release-readiness.ts` + handler in `src/atoms-registry.ts`; gateway suite **37/37 passing** (re-run 2026-11-15, incl. 11 ported tests + 9 golden-fixture parity checks)
  - Listing: `listing/server.json` refreshed to the published record, name `org.aimlds/atom-release-readiness-verdict`, verified live by registry API read-back (parent record)

## What every gap atom DOES have (verified 162/162 unless noted)

- `contract.yaml` — present and YAML-parseable (162/162); `pricing.rate: null` (162/162); namespace + prefix, rate-limit SPEC defaults, qualification tests T1–T6 all true (register-level, not code-level)
- `SERVICE.md`, `growth.md`, `retention.md`, `maintenance.md` — present (162/162)
- `listing/server.json` + `listing/listing.md` — present (162/162) **but scaffold-grade**: name is the old `io.github.nrupala/atom-…` namespace, `_meta.status` says "scaffolded — NOT deployed; do not submit", and the header copy still describes the superseded per-atom key model instead of the gateway-key + scope model. Every listing must be regenerated at replication time (as #1's was), never submitted as-is.

## What every gap atom LACKS (the actual replication work)

1. **A deterministic core.** There is no Python (or any-language) implementation to port. The bound skill is a prose judgment playbook for an LLM, not an algorithm. Atom #1's core was hand-authored from its skill into 19 explicit checks with evidence strings — that authoring step, per atom, IS the build. It cannot be mechanical: input schema, check set, verdict logic, and evidence wording must be designed per atom and then proven.
2. **An oracle / test suite.** No tests exist to port or diff against. Tests + golden fixtures must be authored with the core (the #1 standard: ported tests + golden fixtures + differential spot-checks).
3. **A TS port + gateway handler** (follows 1–2), registry/catalogue onboarding (`atoms.registry.json` row, `tools/sync-rates.mjs` regen), D1 seeding (scope namespace exists in the contract already; `atom_enabled:<atom>=1` at deploy), and a refreshed registry listing.

## GAPS list — G2 (no bound skill, 8)

| Atom | Tier | Deliverable | Unit |
|---|---|---|---|
| calculation-rederivation | A | DELIVERABLE | call |
| one-line-diagram-to-data | A | DELIVERABLE | query |
| protection-coordination-explainer | A | DELIVERABLE | deliverable |
| provenance-stamper | A | STAMP | call |
| study-clause-check | A | CHECK | deliverable |
| change-gate-plan | B | DELIVERABLE | deliverable |
| coopetition-connector-plan | B | DELIVERABLE | tokens |
| strategy-map-builder | B | MAP | tokens |

## GAPS list — G1 (contract-only, bound skill exists, 153)

Every atom in the full table below except `release-readiness-verdict` (live) and the 8 G2 atoms above.

## Full census table

| Atom | Tier | Deliverable | Unit | Bound skill |
|---|---|---|---|---|
| acp-protocol-integration-review | B | REVIEW | deliverable | acp-engineering |
| agent-context-packaging | B | DELIVERABLE | deliverable | context-packaging |
| agent-evaluation-scorecard | A | EVALUATION | deliverable | agent-evaluation |
| agent-interoperability-design | B | DELIVERABLE | deliverable | agent-interoperability |
| agent-safety-guardrail-audit | A | CHECK | deliverable | agent-safety-guardrails |
| agentic-coding-practice | B | DELIVERABLE | tokens | agentic-coding |
| algorithm-design-implementation | B | DELIVERABLE | deliverable | algorithmic-implementer |
| append-only-ledger-design-audit | A | CHECK | deliverable | ledger-engineering |
| applied-ml-validation | B | VALIDATION | deliverable | applied-machine-learning |
| architecture-decision-record | B | DELIVERABLE | deliverable | architecture-decisions |
| argument-analysis-review | B | REVIEW | deliverable | critical-reasoning |
| assumption-audit | A | CHECK | tokens | decision-intelligence |
| audience-contract-design | B | DELIVERABLE | deliverable | audience-contracts |
| auth-design-review | B | REVIEW | deliverable | authentication-authorization |
| backend-engineering-advice | B | DELIVERABLE | deliverable | backend-engineering |
| base-rate-card | B | DELIVERABLE | deliverable | critical-thinking |
| behavioral-finance-bias-check | B | CHECK | deliverable | behavioral-finance |
| behavioral-finance-debiasing | B | DELIVERABLE | deliverable | behavioral-finance-expert |
| bias-controlled-quant-study-pack | B | DELIVERABLE | deliverable | quant-research |
| brand-mention-monitoring-triage-digest | B | CHECK | deliverable | social-listening |
| browser-extension-engineering | B | DELIVERABLE | deliverable | browser-extension-engineering |
| budget-design-review | B | REVIEW | deliverable | budgeting |
| buyer-test-card | B | DELIVERABLE | deliverable | poc-validation |
| c-engineering-review | B | REVIEW | deliverable | c-engineering |
| calculation-rederivation | A | DELIVERABLE | call | None |
| cash-flow-forecast | B | DELIVERABLE | deliverable | cash-flow-management |
| change-gate-plan | B | DELIVERABLE | deliverable | None |
| cicd-pipeline-design | B | DELIVERABLE | deliverable | ci-cd-pipeline |
| claim-evaluation-review | B | REVIEW | deliverable | critical-thinking |
| claim-verification-fact-check-stamp | A | STAMP | deliverable | verification-and-fact-checking |
| code-review-service | B | REVIEW | deliverable | code-review-practice |
| code-with-verification-proof | A | DELIVERABLE | deliverable | verified-code |
| codebase-graph-analysis | A | REPORT | query | code-graph |
| codebase-structural-query | A | DELIVERABLE | query | codebase-intelligence |
| codebase-visualization | B | DELIVERABLE | deliverable | code-visualization |
| community-support-operations | B | DELIVERABLE | deliverable | community-support |
| company-fundamentals-report | A | REPORT | query | equity-fundamentals |
| condition-monitoring-triage | A | CHECK | deliverable | condition-monitoring |
| confidential-computing-design | B | DELIVERABLE | deliverable | confidential-computing |
| coopetition-connector-plan | B | DELIVERABLE | tokens | None |
| correctness-verification-certificate | A | DELIVERABLE | deliverable | correctness-verification |
| cost-estimate-preparation | B | DELIVERABLE | deliverable | cost-estimation |
| cpp-engineering-review | B | REVIEW | deliverable | cpp-engineering |
| creative-ideation-session | B | DELIVERABLE | tokens | creative-ideation |
| crm-pipeline-operations | B | DELIVERABLE | deliverable | crm |
| crypto-inventory-pq-migration-map | A | MAP | deliverable | post-quantum-cryptography |
| data-analysis-deliverable | B | REPORT | deliverable | data-analytics |
| data-ml-pipeline-engineering | B | DELIVERABLE | deliverable | data-ml-pipelines |
| data-visualization-design | B | DELIVERABLE | deliverable | data-visualization |
| database-design-review | B | REVIEW | deliverable | database-sme |
| decision-process-design | B | DELIVERABLE | deliverable | decision-intelligence |
| decision-ready-research-brief | B | REPORT | deliverable | research-tooling |
| decision-trap-sweep | A | DELIVERABLE | deliverable | decision-making |
| deep-research-synthesis | A | REPORT | deliverable | deep-research |
| defined-flow-auditor | A | CHECK | call | zero-trust |
| delivery-plan-preparation | B | DELIVERABLE | deliverable | delivery-planning |
| dependency-governance-audit | A | CHECK | deliverable | dependency-governance |
| designed-test-case-pack | B | DELIVERABLE | deliverable | test-design |
| difficult-conversation-coaching | B | DELIVERABLE | deliverable | emotional-intelligence-manager |
| distribution-equipment-rating-condition-check | A | CHECK | deliverable | power-distribution-equipment |
| document-operations-service | B | DELIVERABLE | deliverable | document-operations |
| domain-portfolio-audit | B | CHECK | deliverable | domain-portfolio-ops |
| edge-platform-engineering | B | DELIVERABLE | deliverable | edge-platform-engineering |
| efficient-web-build-standard | B | DELIVERABLE | deliverable | efficient-web-builder |
| electrical-machinery-engineering-check | A | CHECK | deliverable | electrical-machinery-engineering |
| electrical-machines-expert-advice | B | DELIVERABLE | tokens | electrical-machines-sme |
| electrical-test-record-preparation | A | DELIVERABLE | deliverable | electrical-test-records |
| encryption-claim-audit | A | CHECK | deliverable | encryption |
| engineering-project-budget-pack | B | DELIVERABLE | deliverable | project-budgets |
| engineering-work-package-structuring | B | DELIVERABLE | deliverable | engineering-work-packages |
| fare-construction-savings-strategy | B | DELIVERABLE | query | travel-fares |
| finance-content-compliance-check | A | CHECK | deliverable | financial-education-content |
| finance-education-article | B | DELIVERABLE | deliverable | finance-content |
| finance-tool-design-advisory | B | DELIVERABLE | deliverable | financial-innovation-expert |
| firewall-rules-audit | A | CHECK | deliverable | firewall-engineering |
| forecast-confidence-scoreboard | B | DELIVERABLE | query | prediction |
| forecast-with-ranges-and-scorecard | A | DELIVERABLE | deliverable | forecasting |
| framework-adoption-adr | B | DELIVERABLE | deliverable | framework-discipline |
| frontend-implementation | B | DELIVERABLE | deliverable | frontend-engineering |
| full-stack-app-build-pack | B | DELIVERABLE | deliverable | senior-fullstack-engineer |
| grpc-service-design | B | DELIVERABLE | deliverable | grpc-service-engineering |
| home-shortlist-carrying-cost-comparison | B | DELIVERABLE | query | home-search |
| honest-seo-audit-intent-map | B | MAP | deliverable | seo |
| javascript-review-and-build | B | REVIEW | deliverable | javascript-engineering |
| json-schema-design-check | B | CHECK | deliverable | json-data-interchange |
| knowledge-graph-design | B | DELIVERABLE | deliverable | knowledge-graph-engineering |
| lean4-formal-proof | A | DELIVERABLE | deliverable | lean4-proving |
| license-compliance-check | A | CHECK | deliverable | legal-licensing |
| link-rot-scan-and-notarized-archive | A | CHECK | query | link-integrity-and-archiving |
| local-first-sync-design | B | DELIVERABLE | deliverable | local-first-engineering |
| local-llm-serving-setup | B | DELIVERABLE | deliverable | local-llm-serving |
| local-voice-stack-engineering-pack | B | DELIVERABLE | deliverable | voice-and-speech-engineering |
| localization-readiness-review | B | REVIEW | deliverable | i18n-localization |
| long-form-authoring-pipeline | B | DELIVERABLE | deliverable | authoring-pipeline |
| mcp-server-design-and-review | B | REVIEW | deliverable | mcp-engineering |
| meaning-first-translation-with-tone-note | B | DELIVERABLE | deliverable | translation |
| meeting-decisions-and-actions-extract | B | DELIVERABLE | deliverable | meeting-follow-up |
| ml-project-framing-review | B | REVIEW | deliverable | ai-ml-ds-engineer |
| multiplatform-core-design | B | DELIVERABLE | deliverable | multiplatform-engineering |
| native-mobile-build-plan | B | DELIVERABLE | deliverable | mobile-native |
| negotiation-preparation-pack | B | DELIVERABLE | deliverable | negotiation |
| network-exposure-audit | A | CHECK | deliverable | network-security |
| observability-and-runbook-design | B | DELIVERABLE | deliverable | observability-ops |
| offline-first-pwa-engineering-pack | B | DELIVERABLE | deliverable | pwa-offline-engineering |
| one-line-diagram-to-data | A | DELIVERABLE | query | None |
| personal-financial-snapshot | B | DELIVERABLE | deliverable | financial-analytics |
| personal-web-presence-audit | B | CHECK | deliverable | personal-web-presence |
| poc-design-kill-criteria-verdict | B | VERDICT | deliverable | poc-validation |
| portfolio-risk-analytics-report | A | REPORT | query | pae |
| prd-with-testable-acceptance-criteria | B | DELIVERABLE | deliverable | product-requirements |
| prediction-model-leakage-calibration-audit | A | CHECK | deliverable | prediction |
| predictive-maintenance-failure-risk-assessment | A | DELIVERABLE | deliverable | predictive-maintenance |
| pricing-unit-economics-pack | B | DELIVERABLE | deliverable | revenue-management |
| process-waste-review-coaching | B | REVIEW | deliverable | operational-excellence-coach |
| product-metrics-event-taxonomy-pack | B | DELIVERABLE | deliverable | product-analytics |
| production-python-engineering-pack | B | DELIVERABLE | deliverable | python-engineering |
| production-python-engineering-pack-expert | B | DELIVERABLE | deliverable | python-expert |
| production-rust-engineering-pack | B | DELIVERABLE | deliverable | rust-engineering |
| production-rust-engineering-pack-expert | B | DELIVERABLE | deliverable | rust-expert |
| protection-coordination-explainer | A | DELIVERABLE | deliverable | None |
| provenance-stamper | A | STAMP | call | None |
| pump-conveyor-motor-suitability-check | A | CHECK | deliverable | pump-conveyor-systems |
| quant-math-derivation-sanity-check | B | CHECK | deliverable | quant-and-applied-math |
| rag-retrieval-evaluation-tuning | A | EVALUATION | deliverable | retrieval-engineering |
| reconciled-portfolio-performance-report | A | REPORT | deliverable | portfolio-tracking |
| relay-fault-simulation-walkthrough | A | DELIVERABLE | deliverable | fault-simulation |
| release-pack-changelog-seal-rollback | B | DELIVERABLE | deliverable | release-management |
| release-readiness-verdict | A | VERDICT | call | release-management |
| semantic-code-taint-analysis-report | A | REPORT | deliverable | semantic-analysis |
| semantic-html-review | B | REVIEW | deliverable | html-craft |
| service-isolation-hardening-review | B | REVIEW | deliverable | non-docker-isolation |
| seven-step-equity-research-brief | A | REPORT | query | stock-analysis |
| single-living-trip-itinerary | B | DELIVERABLE | deliverable | trip-planning |
| smart-grid-der-design-pack | B | DELIVERABLE | deliverable | smart-grid-engineering |
| sourced-podcast-episode-production | B | DELIVERABLE | deliverable | podcast-production |
| sourced-visual-reference-search | B | DELIVERABLE | query | image-search |
| sql-schema-query-engineering-pack | B | DELIVERABLE | deliverable | sql-engineering |
| statistical-study-design-report | B | REPORT | deliverable | statistical-consulting |
| strategy-backtest-validation | A | VALIDATION | deliverable | backtesting-validation |
| strategy-map-builder | B | MAP | tokens | None |
| strict-typescript-engineering-pack | B | DELIVERABLE | deliverable | typescript-engineering |
| structured-decision-making | B | DELIVERABLE | deliverable | decision-making |
| structured-root-cause-analysis | B | REPORT | deliverable | analytical-reasoning |
| study-clause-check | A | CHECK | deliverable | None |
| system-design-failure-mode-pack | B | DELIVERABLE | deliverable | systems-builder |
| tech-stack-decision-memo | B | DELIVERABLE | deliverable | tech-stack-architect |
| technical-documentation-pack | B | DELIVERABLE | deliverable | technical-writing |
| technical-explainer-content-pack | B | DELIVERABLE | deliverable | technical-education-content |
| tested-authorization-policy-pack | A | DELIVERABLE | deliverable | policy-as-code |
| testing-strategy-regression-pack | B | DELIVERABLE | deliverable | testing-strategy |
| uat-scenario-sign-off-pack | B | DELIVERABLE | deliverable | user-acceptance-testing |
| ux-flow-component-spec-pack | B | DELIVERABLE | deliverable | ux-ui-design |
| validated-simulation-scenario-pack | B | DELIVERABLE | deliverable | simulation-engineering |
| vendor-evaluation-three-way-match-pack | B | EVALUATION | deliverable | procurement-vendor-management |
| verified-place-shortlist | B | DELIVERABLE | query | place-discovery |
| vfd-application-engineering-check | A | CHECK | deliverable | drives-and-vfd-engineering |
| voice-note-narration-audio | B | DELIVERABLE | deliverable | voice-notes-and-narration |
| vulnerability-triage-verified-closure | A | CHECK | deliverable | vulnerability-management |
| zero-knowledge-claim-audit | A | CHECK | deliverable | zero-knowledge |
| zero-knowledge-system-design-pack | B | DELIVERABLE | deliverable | zero-knowledge-systems |
| zero-trust-architecture-design-pack | B | DELIVERABLE | deliverable | zero-trust-architecture |
| zero-trust-evaluation-verdict | A | VERDICT | deliverable | zero-trust |

## Step 0 conclusion — design-level blocker for bulk replication as specified

The replication brief's per-atom recipe ("TS port of its core proven against its Python oracle/tests, same standard as #1") presupposes a Python core + oracle per atom. **That presupposition holds for exactly 1 of 162 atoms.** For the other 161 there is nothing to port and nothing to diff against — the prerequisite build (author a deterministic core + oracle tests from the bound skill, per atom) has not been done for any of them.

This is therefore reported as a **design-level blocker** under the program's stop conditions, with the recommended shape in REPLICATION-LOG.md: per-atom core-authoring builds in batches (each atom: design its input schema + deterministic check logic from its skill, author the Python oracle + tests first, then the TS port proven against it, then gateway onboarding + listing — exactly the sequence #1 actually went through, where the core itself was the hand-built part). Batch size for core-authoring will realistically be smaller than 15–20 unless the parent rules a different handler shape for judgment atoms (e.g. an LLM-backed handler — a different architecture with cost, determinism, and gate implications that must not be improvised here).

**No atom was force-ported, no listing was bulk-submitted, and no rate was set. The 161 gap atoms are named above, not skipped.**
