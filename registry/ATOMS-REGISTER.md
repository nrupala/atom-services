# Atoms Register — merged inventory (PREPARATION ONLY)

Built 2026-10-18 by Wright from the FULL text of all 239 Milo `SKILL.md` files
(three parallel full-text reads) plus the 16 knowledge atoms in
`PRODUCT-ATOM-CATALOGUE-FIRST-PASS.md`, under the rules in `ATOM-DEPLOYMENT-PLAN.md`
(six qualification tests, atom↔skill binding R1, Wright as internal caller R2,
self-use gate R3) and `ATOMS-APP-AND-KEY-DESIGN.md`. **Nothing in this register is
listed, deployed, priced for sale, or built. No repos were created.**

## Summary counts

- **Candidates in: 255** (239 skills + 16 knowledge atoms)
- **Distinct service units out: 255** — full merges applied: **0**. Honest
  note: the earlier 230–240 estimate assumed the knowledge atoms duplicated skills;
  on full-text read they do not — each knowledge atom is a distinct *deliverable*
  (verdict/check/map/stamp) built on top of, not identical to, the nearest skill
  (which is usually process advice). 8 knowledge atoms are **bound** to a related
  skill without merging (binding column); near-duplicate clusters *inside* the
  skill inventory are listed after the table as consolidation candidates.
- **Tier A (strong sellable): 48** — skills 39 + knowledge atoms 9
- **Tier B (packs only): 114** — skills 108 + knowledge atoms 6
- **Tier C (internal only, never sell): 34** — skills 34 + knowledge atoms 0
- **Tier D (hold/screen): 40** — skills 39 + knowledge atoms 1
- **FAIL-self-use: 19** — all skill-side; every knowledge atom passed
  the self-use gate with a named workflow (we run most of them already, by hand).

Six tests key: T1 bounded service (verdict/check/map/stamp) · T2 servable via
API/MCP/agent · T3 no private substrate · T4 measurable production cost ·
T5 buyer pays per use (not a copyable prompt wrapper) · T6 safe to expose.
Tier B = fails T5 standalone (sells in packs). Tier D = held on T6 (regulated,
executable/key-handling, account-acting, safety, or owner gate). Tier C = internal
by design. FAIL-self-use = R3 gate failed before tiering, whatever the market story.

Uncertainty honesty: tiers are full-text *reading* judgments, one pass, three
readers + adjudication. Borderline calls are flagged in the Doubt column; treat
any single tier as ±1 until the build-time screening pass. Versions are the
SKILL.md frontmatter values as read (`?` = no version field found).

## Full register

| Service | Source(s) | Binding (skill @ver) | Self-use — workflow / fail reason | Tests | Tier | Endpoints | Price unit | Doubt / risk |
|---|---|---|---|---|---|---|---|---|
| agent-evaluation-scorecard | skill:agent-evaluation | agent-evaluation @1 | pass: Agent model change regression gates | 6/6 | A | API,MCP,agent | deliverable | — |
| agent-safety-guardrail-audit | skill:agent-safety-guardrails | agent-safety-guardrails @1 | pass: Agent autonomy safety reviews | 6/6 | A | API,MCP,agent | deliverable | Audit scope must stay advisory |
| append-only-ledger-design-audit | skill:ledger-engineering | ledger-engineering @1 | pass: Vault product ledger design work | 6/6 | A | API,MCP,agent | deliverable | Invariant tests make it checkable |
| assumption-audit | knowledge-atom:#6 | decision-intelligence @? | pass: Reviewing every plan and proposal | 6/6 | A | API,MCP,agent,human | tokens | Buyers may resist paying for doubt; pair with base-rate-card |
| calculation-rederivation | knowledge-atom:#2 | — (knowledge corpus) | pass: Re-deriving EE calcs in project work | 6/6 | A | API,MCP,agent | call | Calculation families at v1 unscoped; binding: none (EE corpus) |
| claim-verification-fact-check-stamp | skill:verification-and-fact-checking | verification-and-fact-checking @1 | pass: Fact-checking content before publishing | 6/6 | A | API,agent | deliverable | — |
| code-with-verification-proof | skill:verified-code | verified-code @1 | pass: AxiomCode verified code generation | 6/6 | A | API,MCP,agent | deliverable | Anchor doubt: AxiomCode product, separable per-spec service |
| codebase-graph-analysis | skill:code-graph | code-graph @1 | pass: codetopo codebase analysis runs | 6/6 | A | API,MCP,agent | query | — |
| codebase-structural-query | skill:codebase-intelligence | codebase-intelligence @1 | pass: codetopo structural codebase questions | 6/6 | A | API,MCP,agent | query | — |
| company-fundamentals-report | skill:equity-fundamentals | equity-fundamentals @1 | pass: Research Analyst company fundamental analysis | 6/6 | A | API,MCP,agent | query | Borderline regulated if personalised |
| condition-monitoring-triage | skill:condition-monitoring | condition-monitoring @1 | pass: EE asset monitoring reviews | 6/6 | A | API,agent,human | deliverable | Safety-adjacent; SME makes calls |
| correctness-verification-certificate | skill:correctness-verification | correctness-verification @1 | pass: Product correctness claim checks | 6/6 | A | API,agent | deliverable | — |
| crypto-inventory-pq-migration-map | skill:post-quantum-cryptography | post-quantum-cryptography @1 | pass: Long-lived product signing and archives | 6/6 | A | API,agent | deliverable | — |
| decision-trap-sweep | knowledge-atom:#9 | decision-making @1 | pass: Sweeping proposals before approval | 6/6 | A | API,agent,human | deliverable | Commoditized advice risk; the signed-record form is the differentiator |
| deep-research-synthesis | skill:deep-research | deep-research @1 | pass: Market and technology research sweeps | 6/6 | A | API,agent,human | deliverable | — |
| defined-flow-auditor | knowledge-atom:#15 | zero-trust @1 | pass: Guardian Mesh audits of our systems | 6/6 | A | API,MCP,agent | call | Guardian Mesh capabilities are spec inputs until behaviour-proven |
| dependency-governance-audit | skill:dependency-governance | dependency-governance @1 | pass: Release supply-chain checks | 6/6 | A | API,agent | deliverable | — |
| distribution-equipment-rating-condition-check | skill:power-distribution-equipment | power-distribution-equipment @1 | pass: EE consulting equipment reviews | 6/6 | A | agent,human | deliverable | — |
| electrical-machinery-engineering-check | skill:electrical-machinery-engineering | electrical-machinery-engineering @1 | pass: EE motor sizing reviews | 6/6 | A | agent,human | deliverable | — |
| electrical-test-record-preparation | skill:electrical-test-records | electrical-test-records @1 | pass: EE test record preparation | 6/6 | A | agent,human | deliverable | Audit-grade records; safety-adjacent |
| encryption-claim-audit | skill:encryption | encryption @1 | pass: Release-gate crypto review for products | 6/6 | A | API,MCP,agent | deliverable | Standard constructions; differentiation is checklist |
| finance-content-compliance-check | skill:financial-education-content | financial-education-content @1 | pass: Think With Finance compliance content review | 6/6 | A | API,MCP,agent | deliverable | — |
| firewall-rules-audit | skill:firewall-engineering | firewall-engineering @1 | pass: Product release-gate firewall audit | 6/6 | A | API,MCP,agent | deliverable | — |
| forecast-with-ranges-and-scorecard | skill:forecasting | forecasting @1 | pass: Portfolio revenue and demand forecasting | 6/6 | A | API,MCP,agent | deliverable | Methods are commodity; scorecard differentiates |
| lean4-formal-proof | skill:lean4-proving | lean4-proving @1 | pass: SAIC formal verification proof work | 6/6 | A | API,MCP,agent | deliverable | Checkable: lake build, zero sorry |
| license-compliance-check | skill:legal-licensing | legal-licensing @1 | pass: Product release license compliance check | 6/6 | A | API,MCP,agent | deliverable | Not legal advice; scan-based |
| link-rot-scan-and-notarized-archive | skill:link-integrity-and-archiving | link-integrity-and-archiving @1 | pass: Content site citation link audits | 6/6 | A | API,MCP,agent | query | — |
| network-exposure-audit | skill:network-security | network-security @1 | pass: Product release network exposure audit | 6/6 | A | API,MCP,agent | deliverable | — |
| one-line-diagram-to-data | knowledge-atom:#5 | — (knowledge corpus) | pass: Building EE platform study models | 6/6 | A | API,MCP,agent | query | Input-format sprawl; binding: none (EE corpus) |
| portfolio-risk-analytics-report | skill:pae | pae @1 | pass: Personal portfolio risk analytics runs | 6/6 | A | API,MCP,agent | query | Product-internal and regulated borderline |
| prediction-model-leakage-calibration-audit | skill:prediction | prediction @1 | pass: Validating RA and PdM models | 6/6 | A | API,agent | deliverable | — |
| predictive-maintenance-failure-risk-assessment | skill:predictive-maintenance | predictive-maintenance @? | pass: Industrial motor and transformer clients | 6/6 | A | API,agent | deliverable | — |
| protection-coordination-explainer | knowledge-atom:#3 | — (knowledge corpus) | pass: Explaining coordination on EE projects | 6/6 | A | API,agent,human | deliverable | Engineering-advice liability framing; nearest skill fault-simulation is a different capability |
| provenance-stamper | knowledge-atom:#14 | — (knowledge corpus) | pass: Stamping RA datasets and reports | 6/6 | A | API,MCP,agent | call | Binding: none (Research Analyst first-source backbone); position as shared spine |
| pump-conveyor-motor-suitability-check | skill:pump-conveyor-systems | pump-conveyor-systems @1 | pass: EE driven-equipment sizing reviews | 6/6 | A | agent,human | deliverable | — |
| rag-retrieval-evaluation-tuning | skill:retrieval-engineering | retrieval-engineering @1 | pass: Fixing product search and RAG | 6/6 | A | API,agent | deliverable | Golden-set scores are checkable deliverable |
| reconciled-portfolio-performance-report | skill:portfolio-tracking | portfolio-tracking @1 | pass: Investment ledger review and attribution | 6/6 | A | API,agent | deliverable | Finance-adjacent; reporting not advice |
| relay-fault-simulation-walkthrough | skill:fault-simulation | fault-simulation @1 | pass: EE protection training simulation sessions | 6/6 | A | API,MCP,agent,human | deliverable | Training only, never plant settings |
| release-readiness-verdict | knowledge-atom:#13 | release-management @1 | pass: Release gates run on every product | 6/6 | A | API,MCP,agent,human | call | Guardian Mesh adjacency; benches still unbuilt. Distinct from release-management skill (doing releases vs judging readiness) |
| semantic-code-taint-analysis-report | skill:semantic-analysis | semantic-analysis @1 | pass: Codetopo-style codebase impact reviews | 6/6 | A | API,MCP,agent | deliverable | Codetopo-adjacent; separable as analysis report |
| seven-step-equity-research-brief | skill:stock-analysis | stock-analysis @1 | pass: Research Analyst stock reports | 6/6 | A | API,agent | query | Anchor doubt: RA product method, separable per-ticker brief |
| strategy-backtest-validation | skill:backtesting-validation | backtesting-validation @1 | pass: Sail strategy validation gates | 6/6 | A | API,agent | deliverable | Finance-adjacent; validation not advice |
| study-clause-check | knowledge-atom:#1 | — (knowledge corpus) | pass: EE study reviews in consulting work | 6/6 | A | API,agent,human | deliverable | IEEE excerpt licence path unresolved; binding: none (Color Books corpus) |
| tested-authorization-policy-pack | skill:policy-as-code | policy-as-code @1 | pass: Access policy for agents and products | 6/6 | A | API,MCP,agent | deliverable | — |
| vfd-application-engineering-check | skill:drives-and-vfd-engineering | drives-and-vfd-engineering @1 | pass: EE drive application reviews | 6/6 | A | agent,human | deliverable | — |
| vulnerability-triage-verified-closure | skill:vulnerability-management | vulnerability-management @1 | pass: Patch triage across product fleet | 6/6 | A | API,agent | deliverable | — |
| zero-knowledge-claim-audit | skill:zero-knowledge | zero-knowledge @1 | pass: Auditing vault and zerok claims | 6/6 | A | agent,human | deliverable | Evaluation only, not a certification |
| zero-trust-evaluation-verdict | skill:zero-trust | zero-trust @1 | pass: Reviewing home and product access | 6/6 | A | agent,human | deliverable | Evaluation only, not a certification |
| acp-protocol-integration-review | skill:acp-engineering | acp-engineering @1 | pass: Agent protocol integration builds | 5/6 (T5) | B | API,MCP,agent | deliverable | — |
| agent-context-packaging | skill:context-packaging | context-packaging @1 | pass: Agent handoff package builds | 5/6 (T5) | B | agent | deliverable | Redaction deliverable could reach A |
| agent-interoperability-design | skill:agent-interoperability | agent-interoperability @1 | pass: Connecting agents across protocols | 5/6 (T5) | B | API,MCP,agent | deliverable | — |
| agentic-coding-practice | skill:agentic-coding | agentic-coding @? | pass: Coding agent build workflows | 5/6 (T5) | B | agent | tokens | — |
| algorithm-design-implementation | skill:algorithmic-implementer | algorithmic-implementer @? | pass: Performance-critical code builds | 5/6 (T5) | B | agent | deliverable | — |
| applied-ml-validation | skill:applied-machine-learning | applied-machine-learning @1 | pass: Model evaluation for products | 5/6 (T5) | B | agent,human | deliverable | Overlaps ai-ml-ds-engineer |
| architecture-decision-record | skill:architecture-decisions | architecture-decisions @1 | pass: Architecture reviews before builds | 5/6 (T5) | B | agent,human | deliverable | — |
| argument-analysis-review | skill:critical-reasoning | critical-reasoning @? | pass: Claim checking in research | 5/6 (T5) | B | agent,human | deliverable | Overlaps critical-thinking |
| audience-contract-design | skill:audience-contracts | audience-contracts @1 | pass: Product surface design audits | 5/6 (T5) | B | agent,human | deliverable | — |
| auth-design-review | skill:authentication-authorization | authentication-authorization @1 | pass: Product login and permissions builds | 5/6 (T5) | B | API,agent | deliverable | Could become audit tier A |
| backend-engineering-advice | skill:backend-engineering | backend-engineering @1 | pass: Product API and service builds | 5/6 (T5) | B | agent | deliverable | How-to advice, per task rule |
| base-rate-card | knowledge-atom:#7 | critical-thinking @1 | pass: Decision support on product calls | 5/6 (T5) | B | agent,human | deliverable | Reference-class data sourcing per domain unresolved |
| behavioral-finance-bias-check | skill:behavioral-finance | behavioral-finance @1 | pass: Investment decision journal reviews | 5/6 (T5) | B | agent,human | deliverable | Personal finance framing |
| behavioral-finance-debiasing | skill:behavioral-finance-expert | behavioral-finance-expert @? | pass: PAE decision debiasing work | 5/6 (T5) | B | agent,human | deliverable | Overlaps behavioral-finance |
| bias-controlled-quant-study-pack | skill:quant-research | quant-research @1 | pass: Research Analyst signal research | 5/6 (T5) | B | API,agent | deliverable | — |
| brand-mention-monitoring-triage-digest | skill:social-listening | social-listening @1 | pass: Monitoring Nrupal and product mentions | 5/6 (T5) | B | API,agent | deliverable | — |
| browser-extension-engineering | skill:browser-extension-engineering | browser-extension-engineering @1 | pass: Reader extension builds | 5/6 (T5) | B | agent | deliverable | — |
| budget-design-review | skill:budgeting | budgeting @1 | pass: Business budget planning work | 5/6 (T5) | B | agent,human | deliverable | Finance advice adjacency |
| buyer-test-card | knowledge-atom:#16 | poc-validation @1 | pass: Buyer test gates every offer | 5/6 (T5) | B | agent,human | deliverable | Small alone; closest cross-inventory pair (cf. poc-validation) — merge decision is the owner's at build time |
| c-engineering-review | skill:c-engineering | c-engineering @1 | pass: Native and embedded code work | 5/6 (T5) | B | agent | deliverable | — |
| cash-flow-forecast | skill:cash-flow-management | cash-flow-management @1 | pass: Business cash runway planning | 5/6 (T5) | B | agent,human | deliverable | Finance advice adjacency |
| change-gate-plan | knowledge-atom:#12 | — (knowledge corpus) | pass: Org and process change planning | 5/6 (T5) | B | agent,human | deliverable | Crowded change-consulting field |
| cicd-pipeline-design | skill:ci-cd-pipeline | ci-cd-pipeline @1 | pass: Repo pipeline setup work | 5/6 (T5) | B | agent | deliverable | — |
| claim-evaluation-review | skill:critical-thinking | critical-thinking @1 | pass: Pitch and claim evaluations | 5/6 (T5) | B | agent,human | deliverable | Overlaps critical-reasoning |
| code-review-service | skill:code-review-practice | code-review-practice @1 | pass: PR reviews before merge | 5/6 (T5) | B | agent | deliverable | — |
| codebase-visualization | skill:code-visualization | code-visualization @1 | pass: Codebase onboarding diagrams | 5/6 (T5) | B | agent | deliverable | — |
| community-support-operations | skill:community-support | community-support @1 | pass: Product support channel operations | 5/6 (T5) | B | agent,human | deliverable | Touches user messages |
| confidential-computing-design | skill:confidential-computing | confidential-computing @1 | pass: Enclave product design reviews | 5/6 (T5) | B | agent,human | deliverable | — |
| coopetition-connector-plan | knowledge-atom:#11 | — (knowledge corpus) | pass: Color Books ecosystem partner planning | 5/6 (T5) | B | agent,human | tokens | Bespoke per market; may belong inside the consulting engine, not standalone |
| cost-estimate-preparation | skill:cost-estimation | cost-estimation @1 | pass: EE work package estimates | 5/6 (T5) | B | agent,human | deliverable | — |
| cpp-engineering-review | skill:cpp-engineering | cpp-engineering @1 | pass: C++ tooling and service builds | 5/6 (T5) | B | agent | deliverable | — |
| creative-ideation-session | skill:creative-ideation | creative-ideation @? | pass: Content and product ideation | 5/6 (T5) | B | agent,human | tokens | Thinking-style; pack only |
| crm-pipeline-operations | skill:crm | crm @1 | pass: Consulting pipeline follow-ups | 5/6 (T5) | B | agent,human | deliverable | Contact privacy rules apply |
| data-analysis-deliverable | skill:data-analytics | data-analytics @1 | pass: Product and operations analysis | 5/6 (T5) | B | agent | deliverable | — |
| data-ml-pipeline-engineering | skill:data-ml-pipelines | data-ml-pipelines @1 | pass: RA data pipeline builds | 5/6 (T5) | B | agent | deliverable | — |
| data-visualization-design | skill:data-visualization | data-visualization @1 | pass: Report chart production | 5/6 (T5) | B | agent | deliverable | — |
| database-design-review | skill:database-sme | database-sme @? | pass: Product schema design work | 5/6 (T5) | B | agent | deliverable | — |
| decision-process-design | skill:decision-intelligence | decision-intelligence @? | pass: Product decision framing work | 5/6 (T5) | B | agent,human | deliverable | Named-thinker discipline |
| decision-ready-research-brief | skill:research-tooling | research-tooling @1 | pass: Deep research for product decisions | 5/6 (T5) | B | agent | deliverable | — |
| delivery-plan-preparation | skill:delivery-planning | delivery-planning @1 | pass: Multi-step project planning | 5/6 (T5) | B | agent,human | deliverable | — |
| designed-test-case-pack | skill:test-design | test-design @1 | pass: Test planning for product builds | 5/6 (T5) | B | agent | deliverable | — |
| difficult-conversation-coaching | skill:emotional-intelligence-manager | emotional-intelligence-manager @? | pass: Vendor escalation communication coaching | 5/6 (T5) | B | agent,human | deliverable | Generic coaching advice |
| document-operations-service | skill:document-operations | document-operations @1 | pass: Client document revision work | 5/6 (T5) | B | API,agent | deliverable | Commodity document handling |
| domain-portfolio-audit | skill:domain-portfolio-ops | domain-portfolio-ops @1 | pass: Domain portfolio audits | 5/6 (T5) | B | API,agent | deliverable | Could reach A as audit |
| edge-platform-engineering | skill:edge-platform-engineering | edge-platform-engineering @1 | pass: Cloudflare Workers product builds | 5/6 (T5) | B | agent | deliverable | — |
| efficient-web-build-standard | skill:efficient-web-builder | efficient-web-builder @? | pass: Product site performance builds | 5/6 (T5) | B | agent | deliverable | Nrupal standard; commodity advice |
| electrical-machines-expert-advice | skill:electrical-machines-sme | electrical-machines-sme @? | pass: EE peer consultation work | 5/6 (T5) | B | agent,human | tokens | Expert persona, no bounded deliverable |
| engineering-project-budget-pack | skill:project-budgets | project-budgets @1 | pass: EE capital project estimates | 5/6 (T5) | B | agent,human | deliverable | — |
| engineering-work-package-structuring | skill:engineering-work-packages | engineering-work-packages @1 | pass: EE consulting work package structuring | 5/6 (T5) | B | agent,human | deliverable | Method, not a verdict stamp |
| fare-construction-savings-strategy | skill:travel-fares | travel-fares @1 | pass: Finding lowest fares for trips | 5/6 (T5) | B | agent | query | Anchor doubt: FareSutra product-internal, separable as strategy |
| finance-education-article | skill:finance-content | finance-content @1 | pass: Think With Finance article production | 5/6 (T5) | B | agent | deliverable | Commodity content writing |
| finance-tool-design-advisory | skill:financial-innovation-expert | financial-innovation-expert @? | pass: PAE feature design work | 5/6 (T5) | B | agent,human | deliverable | PAE-tied; generic design advice |
| forecast-confidence-scoreboard | knowledge-atom:#8 | prediction @1 | pass: Scoring our own product forecasts | 5/6 (T5) | B | API,agent | query | Needs longitudinal adoption; slow first revenue. Distinct from prediction skill (ML-model audit vs human forecaster scoring) |
| framework-adoption-adr | skill:framework-discipline | framework-discipline @1 | pass: Product stack framework adoption decisions | 5/6 (T5) | B | agent | deliverable | Advice plus ADR, easily replicated |
| frontend-implementation | skill:frontend-engineering | frontend-engineering @1 | pass: Content site and product UI builds | 5/6 (T5) | B | agent | deliverable | Generic engineering skill |
| full-stack-app-build-pack | skill:senior-fullstack-engineer | senior-fullstack-engineer @? | pass: Building product web apps end-to-end | 5/6 (T5) | B | agent | deliverable | Generic engineering persona |
| grpc-service-design | skill:grpc-service-engineering | grpc-service-engineering @1 | pass: Conduit agent infrastructure service builds | 5/6 (T5) | B | agent | deliverable | Generic engineering skill |
| home-shortlist-carrying-cost-comparison | skill:home-search | home-search @1 | pass: Calgary family home search | 5/6 (T5) | B | agent | query | Self-use marginal; no active search |
| honest-seo-audit-intent-map | skill:seo | seo @1 | pass: Growing content and product sites | 5/6 (T5) | B | agent | deliverable | Commodity despite audit shape |
| javascript-review-and-build | skill:javascript-engineering | javascript-engineering @1 | pass: No-build site script engineering | 5/6 (T5) | B | agent | deliverable | Generic engineering skill |
| json-schema-design-check | skill:json-data-interchange | json-data-interchange @1 | pass: Product API payload schema design | 5/6 (T5) | B | API,MCP,agent | deliverable | Validator shape could lift to A |
| knowledge-graph-design | skill:knowledge-graph-engineering | knowledge-graph-engineering @1 | pass: Knowledge mining graph build work | 5/6 (T5) | B | agent | deliverable | Generic engineering advice |
| local-first-sync-design | skill:local-first-engineering | local-first-engineering @1 | pass: Vault app offline sync design | 5/6 (T5) | B | agent | deliverable | Generic engineering advice |
| local-llm-serving-setup | skill:local-llm-serving | local-llm-serving @1 | pass: Fleet local model serving operations | 5/6 (T5) | B | agent | deliverable | Fleet-tied; method is general |
| local-voice-stack-engineering-pack | skill:voice-and-speech-engineering | voice-and-speech-engineering @1 | pass: Reader and assistant voice features | 5/6 (T5) | B | agent | deliverable | — |
| localization-readiness-review | skill:i18n-localization | i18n-localization @1 | pass: Product UI localization readiness work | 5/6 (T5) | B | agent | deliverable | Generic engineering pack item |
| long-form-authoring-pipeline | skill:authoring-pipeline | authoring-pipeline @1 | pass: Book and course authoring | 5/6 (T5) | B | agent,human | deliverable | — |
| mcp-server-design-and-review | skill:mcp-engineering | mcp-engineering @1 | pass: Conduit MCP server builds | 5/6 (T5) | B | agent | deliverable | Generic engineering pack item |
| meaning-first-translation-with-tone-note | skill:translation | translation @1 | pass: Translating family and travel messages | 5/6 (T5) | B | agent | deliverable | Certified flag for legal/medical texts |
| meeting-decisions-and-actions-extract | skill:meeting-follow-up | meeting-follow-up @1 | pass: Meeting notes to action items | 5/6 (T5) | B | agent | deliverable | Commodity productivity service |
| ml-project-framing-review | skill:ai-ml-ds-engineer | ai-ml-ds-engineer @? | pass: Research Analyst model framing | 5/6 (T5) | B | agent,human | deliverable | — |
| multiplatform-core-design | skill:multiplatform-engineering | multiplatform-engineering @? | pass: Vault product cross-platform design | 5/6 (T5) | B | agent | deliverable | Generic architecture advice |
| native-mobile-build-plan | skill:mobile-native | mobile-native @1 | pass: MyMilo vault app mobile builds | 5/6 (T5) | B | agent | deliverable | Generic engineering skill |
| negotiation-preparation-pack | skill:negotiation | negotiation @? | pass: Vendor escalation negotiation preparation | 5/6 (T5) | B | agent,human | deliverable | Generic coaching advice |
| observability-and-runbook-design | skill:observability-ops | observability-ops @1 | pass: Product service launch observability design | 5/6 (T5) | B | agent | deliverable | Generic engineering pack item |
| offline-first-pwa-engineering-pack | skill:pwa-offline-engineering | pwa-offline-engineering @1 | pass: Dogear and vault app builds | 5/6 (T5) | B | agent | deliverable | — |
| personal-financial-snapshot | skill:financial-analytics | financial-analytics @1 | pass: PAE personal portfolio snapshot analysis | 5/6 (T5) | B | API,agent | deliverable | Borderline regulated; education only |
| personal-web-presence-audit | skill:personal-web-presence | personal-web-presence @1 | pass: nrupalakolkar.com brand estate operations | 5/6 (T5) | B | agent | deliverable | His-site use is internal; method general |
| poc-design-kill-criteria-verdict | skill:poc-validation | poc-validation @1 | pass: Spike-then-commit product architecture decisions | 5/6 (T5) | B | agent,human | deliverable | — |
| prd-with-testable-acceptance-criteria | skill:product-requirements | product-requirements @1 | pass: Specifying products before build phases | 5/6 (T5) | B | agent,human | deliverable | — |
| pricing-unit-economics-pack | skill:revenue-management | revenue-management @1 | pass: Pricing reviews for product launches | 5/6 (T5) | B | agent,human | deliverable | — |
| process-waste-review-coaching | skill:operational-excellence-coach | operational-excellence-coach @? | pass: Release process improvement coaching | 5/6 (T5) | B | agent,human | deliverable | Generic coaching; Nrupal-specific framing |
| product-metrics-event-taxonomy-pack | skill:product-analytics | product-analytics @1 | pass: Feature success measurement for products | 5/6 (T5) | B | API,agent | deliverable | — |
| production-python-engineering-pack | skill:python-engineering | python-engineering @1 | pass: Product services and automation builds | 5/6 (T5) | B | agent | deliverable | Duplicate of python-expert |
| production-python-engineering-pack-expert | skill:python-expert | python-expert @? | pass: Product services and automation builds | 5/6 (T5) | B | agent | deliverable | Duplicate of python-engineering |
| production-rust-engineering-pack | skill:rust-engineering | rust-engineering @1 | pass: Guardian Mesh and hot-path builds | 5/6 (T5) | B | agent | deliverable | Duplicate of rust-expert |
| production-rust-engineering-pack-expert | skill:rust-expert | rust-expert @? | pass: Guardian Mesh and hot-path builds | 5/6 (T5) | B | agent | deliverable | Duplicate of rust-engineering |
| quant-math-derivation-sanity-check | skill:quant-and-applied-math | quant-and-applied-math @? | pass: Derivations for RA and EE analytics | 5/6 (T5) | B | agent | deliverable | — |
| release-pack-changelog-seal-rollback | skill:release-management | release-management @1 | pass: Shipping product releases safely | 5/6 (T5) | B | agent | deliverable | — |
| semantic-html-review | skill:html-craft | html-craft @1 | pass: Content site page builds reviews | 5/6 (T5) | B | agent | deliverable | Validator check is commodity |
| service-isolation-hardening-review | skill:non-docker-isolation | non-docker-isolation @1 | pass: Fleet service sandbox hardening work | 5/6 (T5) | B | agent | deliverable | House no-Docker rule colours method |
| single-living-trip-itinerary | skill:trip-planning | trip-planning @1 | pass: Family trips to India planning | 5/6 (T5) | B | agent,human | deliverable | Booking acts excluded; planning only |
| smart-grid-der-design-pack | skill:smart-grid-engineering | smart-grid-engineering @1 | pass: Onsmartgrid content and EE consulting | 5/6 (T5) | B | agent,human | deliverable | Broad design advice, no bounded check |
| sourced-podcast-episode-production | skill:podcast-production | podcast-production @1 | pass: Narrated briefings for content sites | 5/6 (T5) | B | agent,human | deliverable | — |
| sourced-visual-reference-search | skill:image-search | image-search @1 | pass: Research brief visual reference sourcing | 5/6 (T5) | B | agent | query | Commodity search; licensing caution |
| sql-schema-query-engineering-pack | skill:sql-engineering | sql-engineering @1 | pass: Product database design and migrations | 5/6 (T5) | B | agent | deliverable | — |
| statistical-study-design-report | skill:statistical-consulting | statistical-consulting @1 | pass: Studies behind RA and product decisions | 5/6 (T5) | B | agent,human | deliverable | — |
| strategy-map-builder | knowledge-atom:#10 | — (knowledge corpus) | pass: Strategy maps for our products | 5/6 (T5) | B | agent,human | tokens | Consulting-shaped; productize as template + agent, not hours |
| strict-typescript-engineering-pack | skill:typescript-engineering | typescript-engineering @1 | pass: Frontend and tooling builds | 5/6 (T5) | B | agent | deliverable | — |
| structured-decision-making | skill:decision-making | decision-making @1 | pass: Technical and project decisions | 5/6 (T5) | B | agent,human | deliverable | — |
| structured-root-cause-analysis | skill:analytical-reasoning | analytical-reasoning @1 | pass: Incident root-cause investigations | 5/6 (T5) | B | agent,human | deliverable | — |
| system-design-failure-mode-pack | skill:systems-builder | systems-builder @? | pass: Designing product systems before builds | 5/6 (T5) | B | agent | deliverable | — |
| tech-stack-decision-memo | skill:tech-stack-architect | tech-stack-architect @? | pass: Stack choices for new products | 5/6 (T5) | B | agent,human | deliverable | House stack defaults inside |
| technical-documentation-pack | skill:technical-writing | technical-writing @1 | pass: READMEs and runbooks for products | 5/6 (T5) | B | agent | deliverable | — |
| technical-explainer-content-pack | skill:technical-education-content | technical-education-content @1 | pass: Explainers for content sites | 5/6 (T5) | B | agent | deliverable | — |
| testing-strategy-regression-pack | skill:testing-strategy | testing-strategy @1 | pass: QA planning for product builds | 5/6 (T5) | B | agent | deliverable | — |
| uat-scenario-sign-off-pack | skill:user-acceptance-testing | user-acceptance-testing @1 | pass: Acceptance rounds before product releases | 5/6 (T5) | B | agent,human | deliverable | — |
| ux-flow-component-spec-pack | skill:ux-ui-design | ux-ui-design @1 | pass: Designing product interfaces before build | 5/6 (T5) | B | agent | deliverable | — |
| validated-simulation-scenario-pack | skill:simulation-engineering | simulation-engineering @1 | pass: Relay simulation and backtest harnesses | 5/6 (T5) | B | agent | deliverable | — |
| vendor-evaluation-three-way-match-pack | skill:procurement-vendor-management | procurement-vendor-management @1 | pass: EE and software vendor purchases | 5/6 (T5) | B | agent,human | deliverable | — |
| verified-place-shortlist | skill:place-discovery | place-discovery @1 | pass: Family outing travel place shortlists | 5/6 (T5) | B | agent | query | Commodity local search |
| voice-note-narration-audio | skill:voice-notes-and-narration | voice-notes-and-narration @1 | pass: Audio versions of briefings and articles | 5/6 (T5) | B | agent | deliverable | — |
| zero-knowledge-system-design-pack | skill:zero-knowledge-systems | zero-knowledge-systems @1 | pass: Designing vault-family apps | 5/6 (T5) | B | agent | deliverable | Design how-to; audit form is zero-knowledge skill |
| zero-trust-architecture-design-pack | skill:zero-trust-architecture | zero-trust-architecture @1 | pass: Hardening product service access | 5/6 (T5) | B | agent | deliverable | Design how-to; verdict form is zero-trust skill |
| aetheris-server-management | skill:aetheris-mgmt-api | aetheris-mgmt-api @? | pass: Aetheris box service operations | — internal | C | API,agent | call | Contains mgmt token procedure |
| aetheris-sovereign-infra-ops | skill:cloud-sovereign-infra | cloud-sovereign-infra @? | pass: Aetheris infrastructure operations | — internal | C | API,agent | call | His infrastructure topology |
| agent-fleet-orchestration | skill:multi-agent-orchestration | multi-agent-orchestration @1 | pass: Agent fleet orchestration operations | — internal | C | agent | deliverable | Orchestration is internal by rule |
| aiorg-sdse-development-method | skill:aiorg-sdse | aiorg-sdse @? | pass: Milo internal software builds | — internal | C | agent | deliverable | Milo internal method |
| app-versioning-standard | skill:app-versioning-standard | app-versioning-standard @? | pass: Product release versioning checks | — internal | C | agent | call | Nrupal house standard |
| axiomcode-certification-pipeline | skill:certification | certification @1 | pass: AxiomCode proof certification work | — internal | C | API,agent | deliverable | Product-internal; bounded proof candidate |
| certified-safe-short-link | skill:safe-link | safe-link @1 | pass: Linktary links for published content | — internal | C | API,agent | call | Product-internal: Linktary procedure, not separable |
| cloudflare-pages-deploy-procedure | skill:cloudflare-pages-deploy | cloudflare-pages-deploy @? | pass: Product site Pages deploys | — internal | C | agent | call | Uses his Cloudflare accounts |
| codetopo-verification-ritual | skill:codetopo-verify | codetopo-verify @1 | pass: codetopo release verification | — internal | C | agent | call | codetopo-internal procedure |
| commitment-tracking-follow-up | skill:tasks-and-reminders | tasks-and-reminders @1 | pass: Tracking Nrupal's commitments and follow-ups | — internal | C | agent | call | Milo personal orchestration, internal only |
| dogear-reading-position | skill:document-reader | document-reader @1 | pass: dogear reading resume support | — internal | C | agent | call | dogear-internal procedure |
| file-based-task-planning | skill:planning-with-files | planning-with-files @1 | pass: Multi-step build plan persistence | — internal | C | agent | tokens | Internal working method |
| goal-progress-check-in | skill:goals-tracking | goals-tracking @1 | pass: Nrupal goal check-in progress logging | — internal | C | agent,human | deliverable | Personal goals system, internal only |
| kalabodha-public-sanitization-check | skill:kalabodha-public-sanitization | kalabodha-public-sanitization @? | pass: KalaBodha public post sanitization | — internal | C | agent | deliverable | Anchor: internal, product-specific |
| kritvega-architecture-reference | skill:kritvega-architecture | kritvega-architecture @? | pass: Kritvega engine build work | — internal | C | agent | tokens | Anchor: internal, product-specific |
| mcp-bridge-connection-playbook | skill:mcp-behind-cloudflare-access | mcp-behind-cloudflare-access @? | pass: MCP bridge connection debugging work | — internal | C | agent | deliverable | His bridge infrastructure, internal |
| memory-forget-execution | skill:memory-forgetting | memory-forgetting @1 | pass: Milo memory forget requests | — internal | C | agent | call | Anchor: internal only |
| milo-autonomy-charter | skill:autonomy-charter | autonomy-charter @? | pass: Milo action permission decisions | — internal | C | agent | call | Milo operating contract |
| milo-inc-convergence-review | skill:milo-inc-os | milo-inc-os @? | pass: Milo Inc project convergence operations | — internal | C | agent | deliverable | Anchor: internal operating system |
| multi-agent-orchestration-pattern | skill:allinoneagency | allinoneagency @1 | pass: Subagent orchestration workflows | — internal | C | agent | call | Internal orchestration pattern |
| no-lockout-resilience-review | skill:resilient-systems-no-lockout | resilient-systems-no-lockout @? | pass: Release-gate reviews of live sites | — internal | C | agent | deliverable | Nrupal house standard, never sell |
| nrupal-calendar-system | skill:calendar-organized-human | calendar-organized-human @? | pass: Nrupal calendar scheduling reviews | — internal | C | agent | call | Nrupal-personal system |
| nrupal-contact-handling-rules | skill:contact-handling-rules | contact-handling-rules @? | pass: Inbound message triage decisions | — internal | C | agent | call | Personal contact rules, never sell |
| nrupal-voice-drafting | skill:nrupal-writing-voice | nrupal-writing-voice @? | pass: All Nrupal correspondence drafting work | — internal | C | agent | deliverable | Anchor: personal, internal only |
| onsmartgrid-article-drafting | skill:article-draft | article-draft @1 | pass: onsmartgrid article pipeline | — internal | C | agent | deliverable | Product-internal pipeline voice |
| opencode-task-dispatch | skill:opencode-bridge | opencode-bridge @1 | pass: Coding task dispatch to Aetheris | — internal | C | agent | call | Anchor: internal; also executes code |
| pae-architecture-reference | skill:pae-architecture | pae-architecture @? | pass: PAE flagship build reference work | — internal | C | agent | tokens | Anchor: internal, product-specific |
| personal-library-organization | skill:knowledge-organization | knowledge-organization @1 | pass: Research filing across Drive Notion Vault | — internal | C | agent | deliverable | Personal stores, internal only |
| phased-delivery-discipline | skill:phased-delivery | phased-delivery @? | pass: All product build delivery phases | — internal | C | agent | tokens | House delivery law, internal |
| read-aloud-text-preparation | skill:read-aloud | read-aloud @1 | pass: Reader-core and dogear listening sessions | — internal | C | agent | call | Product-internal: reader-core/dogear surface, not separable |
| token-economy-operating-discipline | skill:token-economy | token-economy @? | pass: Keeping Milo sessions within credits | — internal | C | agent | call | Anchor: Milo internal operating discipline |
| weekly-accountability-review | skill:weekly-accountability | weekly-accountability @? | pass: Nrupal weekly review against commitments | — internal | C | agent | call | Personal standing role, never sell |
| workout-session-planning | skill:workout-planning | workout-planning @1 | pass: Planning Nrupal's calendar exercise blocks | — internal | C | agent | deliverable | Personal health planning, internal only |
| zero-knowledge-product-security-design | skill:security-zero-knowledge | security-zero-knowledge @? | pass: Designing vault-family product security | — internal | C | agent | deliverable | Governs Nrupal's own product line doctrine |
| agent-infrastructure-operations | skill:agent-infrastructure-ops | agent-infrastructure-ops @1 | pass: Agent stack health and upgrades | T6 hold | D | API,agent | call | Executes ops on user systems |
| booked-flight-change-watch | skill:flight-tracking | flight-tracking @1 | pass: Booked trip disruption monitoring | T6 hold | D | agent | call | Tied to live bookings |
| clinician-visit-summary | skill:health-records-review | health-records-review @1 | pass: Clinician visit preparation summaries | T6 hold | D | agent,human | deliverable | — |
| compliance-evidence-pack-control-map | skill:regulatory-compliance | regulatory-compliance @1 | pass: Audits for regulated product claims | T6 hold | D | agent,human | deliverable | Regulated domain; attestation-gated |
| contacts-calendar-resolution | skill:contacts-and-calendar | contacts-and-calendar @1 | pass: Contact and availability lookups | T6 hold | D | agent | query | Reads users' private accounts data |
| controlled-file-sharing | skill:file-sharing | file-sharing @1 | pass: Sharing deliverables with named recipients | T6 hold | D | agent,human | call | Grants access to user files |
| cross-timezone-meeting-scheduling | skill:scheduling-operations | scheduling-operations @1 | pass: Booking meetings across Nrupal's calendars | T6 hold | D | agent | call | Acts on calendar accounts and bookings |
| cryptography-design-review | skill:cryptography-engineering | cryptography-engineering @1 | pass: Product encryption design work | T6 hold | D | agent | deliverable | Key-handling procedures screen |
| dcf-comparables-valuation | skill:valuation-methods | valuation-methods @1 | pass: Valuing stocks and businesses pre-entry | T6 hold | D | agent | deliverable | Regulated investment advice; A if business-only valuation |
| delegated-messaging | skill:messaging | messaging @1 | pass: Delegated WhatsApp Messenger follow-ups | T6 hold | D | agent,human | deliverable | — |
| derivatives-options-analysis | skill:derivatives-and-options | derivatives-and-options @1 | pass: Options structure evaluations | T6 hold | D | agent,human | deliverable | Regulated finance advice screen |
| electrical-code-qa | skill:electrical-code | electrical-code @1 | pass: SAIC code question answering | T6 hold | D | API,agent | query | Safety-critical code advice screen |
| electrical-safety-planning | skill:electrical-safety | electrical-safety @1 | pass: EE work safety planning | T6 hold | D | agent,human | deliverable | Safety-critical advice screen |
| event-ticket-comparison | skill:event-tickets | event-tickets @1 | pass: Family event ticket comparison purchase | T6 hold | D | agent,human | deliverable | — |
| fitness-baseline-review | skill:fitness-tracking | fitness-tracking @1 | pass: Weekly fitness and accountability review | T6 hold | D | agent | deliverable | Acts on personal health data |
| flight-booking-comparison | skill:flight-booking | flight-booking @1 | pass: Family Calgary-Mumbai flight booking | T6 hold | D | agent,human | deliverable | — |
| grocery-order-building | skill:groceries | groceries @1 | pass: Household weekly grocery ordering | T6 hold | D | agent,human | deliverable | — |
| home-device-control | skill:home-control | home-control @1 | pass: Household device and camera control | T6 hold | D | agent | call | — |
| hotel-stay-comparison-and-booking | skill:hotel-booking | hotel-booking @1 | pass: Family travel hotel booking | T6 hold | D | agent,human | deliverable | — |
| household-budget-report | skill:budget-engine | budget-engine @1 | pass: Household budget analysis requests | T6 hold | D | agent,human | deliverable | Personal finance advice screen |
| inbox-triage-and-drafting | skill:email-operations | email-operations @1 | pass: Inbox triage for Nrupal correspondence | T6 hold | D | agent,human | deliverable | — |
| investment-decision-journal | skill:investment-decision-process | investment-decision-process @1 | pass: Personal portfolio decision journaling | T6 hold | D | agent | deliverable | Regulated, money decisions |
| milo-skill-catalogue-lifecycle | skill:skill-ops | skill-ops @1 | pass: Maintaining Milo's own skill catalogue | T6 hold | D | agent | deliverable | Anchor: held out; C Milo-internal lifecycle also applies |
| mortgage-offer-total-cost-comparison | skill:mortgage-comparison | mortgage-comparison @1 | pass: Household mortgage renewal comparison | T6 hold | D | agent | deliverable | Regulated mortgage advice screen |
| motor-health-verdict | knowledge-atom:#4 | condition-monitoring @1 | pass: Motor reliability work (MotorVerdict line) | T6 hold | D | API,agent | deliverable | REFLECTION GATE: flagship adjacency; plant data access is the real constraint; overlaps predictive-maintenance |
| multi-surface-app-pattern-review | skill:multi-surface-webapp | multi-surface-webapp @1 | pass: Product surface architecture reviews | T6 hold | D | agent | deliverable | Anchor: held out on screening |
| nutrition-and-meal-plan-guidance | skill:nutrition-health | nutrition-health @? | pass: Sunday meal plan nutrition guidance | T6 hold | D | agent,human | deliverable | Health guidance screen |
| payments-and-billing-integration | skill:payments-and-billing | payments-and-billing @1 | pass: Product Stripe billing integration work | T6 hold | D | agent | deliverable | Anchor: acts on money, keys |
| personal-product-purchase-research | skill:personal-shopping | personal-shopping @1 | pass: Household product purchase research | T6 hold | D | agent | query | Prepares purchases on accounts |
| photo-library-selection | skill:media-library | media-library @1 | pass: Family photo selection assembly | T6 hold | D | agent | query | Accesses personal photo accounts |
| playlist-and-playback-curation | skill:music-discovery | music-discovery @1 | pass: Personal playlist playback curation | T6 hold | D | agent | call | Acts on personal music account |
| portfolio-allocation-rebalancing-policy | skill:portfolio-construction | portfolio-construction @1 | pass: Nrupal personal portfolio policy review | T6 hold | D | agent,human | deliverable | Regulated financial advice |
| privacy-data-map-dsar-readiness | skill:privacy-compliance | privacy-compliance @1 | pass: Product launches handling personal data | T6 hold | D | agent,human | deliverable | Regulated legal-adjacent advice; counsel signs |
| restaurant-table-booking | skill:restaurant-reservations | restaurant-reservations @1 | pass: Booking dinners for Nrupal and guests | T6 hold | D | agent,human | call | Anchor: acts on bookings |
| secrets-hygiene-leak-response | skill:secrets-management | secrets-management @1 | pass: Credential rotation for product services | T6 hold | D | agent | deliverable | Key-handling and credential procedures |
| secure-build-provenance-review | skill:secure-build-pattern | secure-build-pattern @1 | pass: Release-gate build trust reviews | T6 hold | D | agent | deliverable | Anchor: held out of Milo catalogue on screening |
| tax-records-planning-pack | skill:tax-planning | tax-planning @1 | pass: Corporate tax package for CPA | T6 hold | D | agent,human | deliverable | Anchor: regulated tax advice |
| trading-risk-limits-kill-criteria | skill:risk-management | risk-management @1 | pass: Sail and personal trading risk | T6 hold | D | agent,human | deliverable | Regulated financial advice plus house gates |
| trip-ground-transport-comparison-booking | skill:trip-transport | trip-transport @1 | pass: Airport transfers and rentals on trips | T6 hold | D | agent | call | Acts on transport bookings and payment |
| used-item-valuation-listing-pack | skill:resale-marketplaces | resale-marketplaces @1 | pass: Selling Nrupal's used equipment | T6 hold | D | agent,human | deliverable | Acts on marketplace accounts and money; B valuation separable |
| achievement-goal-plan | skill:achievement-mindset | achievement-mindset @? | fail: Personal mindset for Nrupal, no service workflow | — self-use gate | FAIL-self-use | agent | - | Think and Grow Rich persona-style |
| behaviour-pattern-read | skill:psychological-analyst | psychological-analyst @? | fail: No named product or operating workflow | — self-use gate | FAIL-self-use | - | - | Personal lens; diagnosis-adjacent risk |
| clarity-writing-pass | skill:clarity | clarity @? | fail: Generic thinking style, no bounded service | — self-use gate | FAIL-self-use | agent | - | Style skill, prompt-wrapper shaped |
| co-thinking-partner | skill:co-thinking | co-thinking @? | fail: Personal thinking partner for Nrupal | — self-use gate | FAIL-self-use | human,agent | - | Persona-style, Nrupal-specific |
| commercial-photography-workflow | skill:photography-workflow | photography-workflow @1 | fail: No named Wright photography workflow; brother's business | — self-use gate | FAIL-self-use | agent,human | - | Could pass via Shubham support |
| consistency-system-design | skill:consistency | consistency @? | fail: Personal habit system for Nrupal | — self-use gate | FAIL-self-use | agent | - | Mindset skill, Nrupal-specific |
| conviction-from-evidence | skill:conviction-from-evidence | conviction-from-evidence @? | fail: Thinking style, no bounded deliverable | — self-use gate | FAIL-self-use | agent | - | Mindset skill |
| curiosity-exploration | skill:curiosity | curiosity @? | fail: Exploration posture, no service workflow | — self-use gate | FAIL-self-use | agent | - | Thinking-style skill |
| first-principles-breakdown | skill:first-principles-thinking | first-principles-thinking @? | fail: Generic reasoning lens; no named service workflow | — self-use gate | FAIL-self-use | agent | - | Could be B in thinking pack |
| gita-equanimity-reflection | skill:gita-equanimity | gita-equanimity @? | fail: Personal philosophy lens; no named service workflow | — self-use gate | FAIL-self-use | agent,human | - | Personal to Nrupal |
| graham-investing-lens | skill:intelligent-investor-thinking | intelligent-investor-thinking @? | fail: Persona investing lens; RA uses fundamentals not this | — self-use gate | FAIL-self-use | agent | - | Education only if ever sold |
| inferential-learning-tutoring | skill:inferential-learning | inferential-learning @? | fail: Learning method lens; no named service workflow | — self-use gate | FAIL-self-use | agent,human | - | Could be B in learning pack |
| marketplace-design-review | skill:marketplace-platforms | marketplace-platforms @1 | fail: No active marketplace build workflow named | — self-use gate | FAIL-self-use | agent,human | - | Conduit marketplace angle is speculative |
| munger-mental-models-scan | skill:mental-models-munger | mental-models-munger @? | fail: Thinking lens; no named service workflow calls it | — self-use gate | FAIL-self-use | agent | - | Could be B in thinking pack |
| musk-algorithm-review | skill:elon-musk-thinking | elon-musk-thinking @? | fail: Persona thinking lens; no named Wright workflow calls it | — self-use gate | FAIL-self-use | agent | - | Could be B in thinking pack |
| organized-mind-system-design | skill:organized-mind-levitin | organized-mind-levitin @? | fail: Book lens on personal organization; no service workflow | — self-use gate | FAIL-self-use | agent,human | - | Personal productivity only |
| power-dynamics-defensive-read | skill:power-and-strategy | power-and-strategy @? | fail: No named product or operating workflow | — self-use gate | FAIL-self-use | - | - | Personal lens, not a callable service |
| problem-solving-strategy-toolkit | skill:problem-solving-strategies | problem-solving-strategies @? | fail: Generic heuristics; no distinct callable workflow | — self-use gate | FAIL-self-use | - | - | Agent reasoning itself, not a service |
| vedic-mental-math-tricks | skill:vedic-mental-math | vedic-mental-math @? | fail: No workflow needs mental-math tricks separately | — self-use gate | FAIL-self-use | - | - | Novelty skill; checks use quant math |

## Near-duplicate clusters inside the skill inventory (consolidation candidates, not merged)

These pairs are separate catalogue entries teaching overlapping capability. They
stay separate register units (each may bind differently), but building both as
services would duplicate — consolidate at build time, owner's call per cluster:

- `python-engineering` / `python-expert`; `rust-engineering` / `rust-expert` (process vs expert-persona forms of the same language capability)
- `behavioral-finance` / `behavioral-finance-expert`; `finance-content` / `financial-education-content`
- `critical-reasoning` / `critical-thinking` (readers flagged the overlap in both directions)
- `zero-trust` (A, evaluation verdict) / `zero-trust-architecture` (B, design pack) / `security-zero-knowledge` (C) — three slices of one trust capability
- `encryption` / `cryptography-engineering` (one held D on key-handling grounds)
- Cross-inventory closest pair: knowledge atom #16 `buyer-test-card` ↔ skill `poc-validation` — bound, not merged; merge decision is the owner's at build time.

## Strongest 12 services

1. **release-readiness-verdict** — knowledge #13 — we run this gate on every product already; the prototype exists and the buyer pain (shipping broken software) is proven.
2. **assumption-audit** — knowledge #6 — highest-scoring knowledge atom; every plan/proposal we review uses it by hand today.
3. **study-clause-check** — knowledge #1 — kernel of the Color Books platform; clause-cited answers are un-copyable without the corpus. Licence path is the one open doubt.
4. **calculation-rederivation** — knowledge #2 — deterministic code re-derivation = a stamp a buyer can trust and we can price per call.
5. **provenance-stamper** — knowledge #14 — already our RA discipline; first-source stamps are the trust-rail differentiator.
6. **defined-flow-auditor** — knowledge #15 — Guardian Mesh's core as a service; undefined-path enumeration is a bounded, checkable deliverable.
7. **agent-evaluation** — skill — agent scorecards are a live market need and we evaluate agents in our own fleet weekly.
8. **agent-safety-guardrails** — skill — injection/tool-privilege guardrails as a check; safety demand is rising and we run these probes ourselves.
9. **code-graph** — skill — codetopo's capability as a service; structural codebase answers are data-shaped, not prompt-shaped.
10. **codebase-intelligence** — skill — pairs with code-graph; index-once/query-as-data is exactly an API-shaped atom.
11. **condition-monitoring-triage** — skill — EE asset triage in Nrupal's specialist domain; few credible competitors, clear deliverable.
12. **deep-research** — skill — multi-source, citation-triangulated research is our daily workhorse and a proven per-deliverable buy.

## What this register does not decide

- No prices (units only) — prices wait on measured production cost per atom.
- No build order beyond the deployment plan's Wave 1 pilots (#1, #6, #13, #2).
- Tier D screening, the #4 reflection gate, and every GO remain the owner's.
