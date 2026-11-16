// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** The atom registry: resolves a service name to its handler.
 *
 *  GRADUATION SEAM (design-for, not built): a descriptor is either
 *  {kind: "local"} — the handler runs in this Worker — or, in a
 *  future release, {kind: "proxy", upstream} — the gateway proxies
 *  the call to a per-atom Worker behind this same route and meters
 *  from the response. Flipping a descriptor changes nothing public:
 *  same endpoints, same user keys, same scopes, same ledger shape.
 */

import { evaluate as evaluateCicdPipelineDesign, stamp as stampCicdPipelineDesign } from "./atoms/cicd-pipeline-design.js";
import { evaluate as evaluateClaimEvaluationReview, stamp as stampClaimEvaluationReview } from "./atoms/claim-evaluation-review.js";
import { evaluate as evaluateCodeReviewService, stamp as stampCodeReviewService } from "./atoms/code-review-service.js";
import { evaluate as evaluateCodebaseVisualization, stamp as stampCodebaseVisualization } from "./atoms/codebase-visualization.js";
import { evaluate as evaluateCommunitySupportOperations, stamp as stampCommunitySupportOperations } from "./atoms/community-support-operations.js";
import { evaluate as evaluateConfidentialComputingDesign, stamp as stampConfidentialComputingDesign } from "./atoms/confidential-computing-design.js";
import { evaluate as evaluateCostEstimatePreparation, stamp as stampCostEstimatePreparation } from "./atoms/cost-estimate-preparation.js";
import { evaluate as evaluateCppEngineeringReview, stamp as stampCppEngineeringReview } from "./atoms/cpp-engineering-review.js";
import { evaluate as evaluateCreativeIdeationSession, stamp as stampCreativeIdeationSession } from "./atoms/creative-ideation-session.js";
import { evaluate as evaluateCrmPipelineOperations, stamp as stampCrmPipelineOperations } from "./atoms/crm-pipeline-operations.js";
import { evaluate as evaluateDataAnalysisDeliverable, stamp as stampDataAnalysisDeliverable } from "./atoms/data-analysis-deliverable.js";
import { evaluate as evaluateDataMlPipelineEngineering, stamp as stampDataMlPipelineEngineering } from "./atoms/data-ml-pipeline-engineering.js";
import { evaluate as evaluateDataVisualizationDesign, stamp as stampDataVisualizationDesign } from "./atoms/data-visualization-design.js";
import { evaluate as evaluateDatabaseDesignReview, stamp as stampDatabaseDesignReview } from "./atoms/database-design-review.js";
import { evaluate as evaluateDecisionProcessDesign, stamp as stampDecisionProcessDesign } from "./atoms/decision-process-design.js";
import { evaluate as evaluateDecisionReadyResearchBrief, stamp as stampDecisionReadyResearchBrief } from "./atoms/decision-ready-research-brief.js";
import { evaluate as evaluateDeliveryPlanPreparation, stamp as stampDeliveryPlanPreparation } from "./atoms/delivery-plan-preparation.js";
import { evaluate as evaluateDesignedTestCasePack, stamp as stampDesignedTestCasePack } from "./atoms/designed-test-case-pack.js";
import { evaluate as evaluateDifficultConversationCoaching, stamp as stampDifficultConversationCoaching } from "./atoms/difficult-conversation-coaching.js";
import { evaluate as evaluateDocumentOperationsService, stamp as stampDocumentOperationsService } from "./atoms/document-operations-service.js";
import { evaluate as evaluateDomainPortfolioAudit, stamp as stampDomainPortfolioAudit } from "./atoms/domain-portfolio-audit.js";
import { evaluate, stamp } from "./atoms/release-readiness.js";
import { evaluate as evaluateAgentSafety, stamp as stampAgentSafety } from "./atoms/agent-safety-guardrail-audit.js";
import { evaluate as evaluateLedgerDesign, stamp as stampLedgerDesign } from "./atoms/append-only-ledger-design-audit.js";
import { evaluate as evaluateDependencyGovernance, stamp as stampDependencyGovernance } from "./atoms/dependency-governance-audit.js";
import { evaluate as evaluateEdgePlatformEngineering, stamp as stampEdgePlatformEngineering } from "./atoms/edge-platform-engineering.js";
import { evaluate as evaluateEfficientWebBuildStandard, stamp as stampEfficientWebBuildStandard } from "./atoms/efficient-web-build-standard.js";
import { evaluate as evaluateElectricalMachinesExpertAdvice, stamp as stampElectricalMachinesExpertAdvice } from "./atoms/electrical-machines-expert-advice.js";
import { evaluate as evaluateEncryptionClaim, stamp as stampEncryptionClaim } from "./atoms/encryption-claim-audit.js";
import { evaluate as evaluateEngineeringProjectBudgetPack, stamp as stampEngineeringProjectBudgetPack } from "./atoms/engineering-project-budget-pack.js";
import { evaluate as evaluateEngineeringWorkPackageStructuring, stamp as stampEngineeringWorkPackageStructuring } from "./atoms/engineering-work-package-structuring.js";
import { evaluate as evaluateFareConstructionSavingsStrategy, stamp as stampFareConstructionSavingsStrategy } from "./atoms/fare-construction-savings-strategy.js";
import { evaluate as evaluateFinanceEducationArticle, stamp as stampFinanceEducationArticle } from "./atoms/finance-education-article.js";
import { evaluate as evaluateFirewallRules, stamp as stampFirewallRules } from "./atoms/firewall-rules-audit.js";
import { evaluate as evaluateLicenseCompliance, stamp as stampLicenseCompliance } from "./atoms/license-compliance-check.js";
import { evaluate as evaluateAgentEvaluation, stamp as stampAgentEvaluation } from "./atoms/agent-evaluation-scorecard.js";
import { evaluate as evaluateAssumptionAudit, stamp as stampAssumptionAudit } from "./atoms/assumption-audit.js";
import { evaluate as evaluateClaimVerification, stamp as stampClaimVerification } from "./atoms/claim-verification-fact-check-stamp.js";
import { evaluate as evaluateStructuralQuery, stamp as stampStructuralQuery } from "./atoms/codebase-structural-query.js";
import { evaluate as evaluateConditionMonitoring, stamp as stampConditionMonitoring } from "./atoms/condition-monitoring-triage.js";
import { evaluate as evaluateDefinedFlow, stamp as stampDefinedFlow } from "./atoms/defined-flow-auditor.js";
import { evaluate as evaluateCorrectnessVerification, stamp as stampCorrectnessVerification } from "./atoms/correctness-verification-certificate.js";
import { evaluate as evaluateCryptoInventory, stamp as stampCryptoInventory } from "./atoms/crypto-inventory-pq-migration-map.js";
import { evaluate as evaluateDecisionTrapSweep, stamp as stampDecisionTrapSweep } from "./atoms/decision-trap-sweep.js";
import { evaluate as evaluateDistributionEquipment, stamp as stampDistributionEquipment } from "./atoms/distribution-equipment-rating-condition-check.js";
import { evaluate as evaluateElectricalMachinery, stamp as stampElectricalMachinery } from "./atoms/electrical-machinery-engineering-check.js";
import { evaluate as evaluateElectricalTestRecord, stamp as stampElectricalTestRecord } from "./atoms/electrical-test-record-preparation.js";
import { evaluate as evaluateFinanceContent, stamp as stampFinanceContent } from "./atoms/finance-content-compliance-check.js";
import { evaluate as evaluateForecastRanges, stamp as stampForecastRanges } from "./atoms/forecast-with-ranges-and-scorecard.js";
import { evaluate as evaluateLean4FormalProof, stamp as stampLean4FormalProof } from "./atoms/lean4-formal-proof.js";
import { evaluate as evaluateLinkRotScan, stamp as stampLinkRotScan } from "./atoms/link-rot-scan-and-notarized-archive.js";
import { evaluate as evaluateNetworkExposure, stamp as stampNetworkExposure } from "./atoms/network-exposure-audit.js";
import { evaluate as evaluatePortfolioRisk, stamp as stampPortfolioRisk } from "./atoms/portfolio-risk-analytics-report.js";
import { evaluate as evaluatePredictionLeakage, stamp as stampPredictionLeakage } from "./atoms/prediction-model-leakage-calibration-audit.js";
import { evaluate as evaluatePredictiveMaintenance, stamp as stampPredictiveMaintenance } from "./atoms/predictive-maintenance-failure-risk-assessment.js";
import { evaluate as evaluatePumpConveyor, stamp as stampPumpConveyor } from "./atoms/pump-conveyor-motor-suitability-check.js";
import { evaluate as evaluateRagRetrieval, stamp as stampRagRetrieval } from "./atoms/rag-retrieval-evaluation-tuning.js";
import { evaluate as evaluateReconciledPortfolio, stamp as stampReconciledPortfolio } from "./atoms/reconciled-portfolio-performance-report.js";
import { evaluate as evaluateSemanticTaint, stamp as stampSemanticTaint } from "./atoms/semantic-code-taint-analysis-report.js";
import { evaluate as evaluateStrategyBacktest, stamp as stampStrategyBacktest } from "./atoms/strategy-backtest-validation.js";
import { evaluate as evaluateTestedAuthorization, stamp as stampTestedAuthorization } from "./atoms/tested-authorization-policy-pack.js";
import { evaluate as evaluateVfdApplication, stamp as stampVfdApplication } from "./atoms/vfd-application-engineering-check.js";
import { evaluate as evaluateVulnerabilityTriage, stamp as stampVulnerabilityTriage } from "./atoms/vulnerability-triage-verified-closure.js";
import { evaluate as evaluateZeroKnowledgeClaim, stamp as stampZeroKnowledgeClaim } from "./atoms/zero-knowledge-claim-audit.js";
import { evaluate as evaluateZeroTrustEvaluation, stamp as stampZeroTrustEvaluation } from "./atoms/zero-trust-evaluation-verdict.js";
import { evaluate as evaluateAcpIntegration, stamp as stampAcpIntegration } from "./atoms/acp-protocol-integration-review.js";
import { evaluate as evaluateContextPackaging, stamp as stampContextPackaging } from "./atoms/agent-context-packaging.js";
import { evaluate as evaluateInteroperabilityDesign, stamp as stampInteroperabilityDesign } from "./atoms/agent-interoperability-design.js";
import { evaluate as evaluateAgenticCoding, stamp as stampAgenticCoding } from "./atoms/agentic-coding-practice.js";
import { evaluate as evaluateAlgorithmDesign, stamp as stampAlgorithmDesign } from "./atoms/algorithm-design-implementation.js";
import { evaluate as evaluateAppliedMlValidation, stamp as stampAppliedMlValidation } from "./atoms/applied-ml-validation.js";
import { evaluate as evaluateArchitectureDecision, stamp as stampArchitectureDecision } from "./atoms/architecture-decision-record.js";
import { evaluate as evaluateArgumentAnalysisReview, stamp as stampArgumentAnalysisReview } from "./atoms/argument-analysis-review.js";
import { evaluate as evaluateAudienceContractDesign, stamp as stampAudienceContractDesign } from "./atoms/audience-contract-design.js";
import { evaluate as evaluateAuthDesignReview, stamp as stampAuthDesignReview } from "./atoms/auth-design-review.js";
import { evaluate as evaluateBackendEngineeringAdvice, stamp as stampBackendEngineeringAdvice } from "./atoms/backend-engineering-advice.js";
import { evaluate as evaluateBaseRateCard, stamp as stampBaseRateCard } from "./atoms/base-rate-card.js";
import { evaluate as evaluateBehavioralFinanceBiasCheck, stamp as stampBehavioralFinanceBiasCheck } from "./atoms/behavioral-finance-bias-check.js";
import { evaluate as evaluateBehavioralFinanceDebiasing, stamp as stampBehavioralFinanceDebiasing } from "./atoms/behavioral-finance-debiasing.js";
import { evaluate as evaluateBiasControlledQuantStudyPack, stamp as stampBiasControlledQuantStudyPack } from "./atoms/bias-controlled-quant-study-pack.js";
import { evaluate as evaluateBrandMentionMonitoringTriageDigest, stamp as stampBrandMentionMonitoringTriageDigest } from "./atoms/brand-mention-monitoring-triage-digest.js";
import { evaluate as evaluateBrowserExtensionEngineering, stamp as stampBrowserExtensionEngineering } from "./atoms/browser-extension-engineering.js";
import { evaluate as evaluateBudgetDesignReview, stamp as stampBudgetDesignReview } from "./atoms/budget-design-review.js";
import { evaluate as evaluateBuyerTestCard, stamp as stampBuyerTestCard } from "./atoms/buyer-test-card.js";
import { evaluate as evaluateCEngineeringReview, stamp as stampCEngineeringReview } from "./atoms/c-engineering-review.js";
import { evaluate as evaluateCashFlowForecast, stamp as stampCashFlowForecast } from "./atoms/cash-flow-forecast.js";
import { CATALOGUE } from "./generated.js";
import { FieldTypeError } from "./atoms/validate.js";

export interface AtomToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
}

export interface AtomHandler {
  serviceName: string;
  namespace: string;
  displayName: string;
  atomVersion: string;
  tool: AtomToolDef;
  /** Run the atom over a caller-supplied input object. Throws
   *  InputError (→ 422, field named) on schema-invalid input. */
  run(input: Record<string, unknown>): Record<string, unknown>;
}

export class InputError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = "InputError";
  }
}

const releaseReadiness: AtomHandler = {
  serviceName: "release-readiness-verdict",
  namespace: "release_readiness_verdict",
  displayName: "Release-readiness verdict",
  atomVersion: "0.1.0",
  tool: {
    name: "release_readiness_verdict",
    title: "Release-readiness verdict",
    description:
      "Submit a release-evidence manifest; get a deterministic READY / NOT_READY / INSUFFICIENT_EVIDENCE verdict across five release bars (control, understanding, management, lifecycle, stability) with per-check evidence.",
    inputSchema: {
      type: "object",
      description: "The release-evidence manifest (see the atom's SERVICE.md for the field table).",
      properties: {
        product: { type: "string", description: "Product being released." },
        version: { type: "string", description: "Release version, semver (e.g. 1.2.0)." },
        version_bump_locations: { type: "array", items: { type: "string" }, description: "Places the version was bumped; must name exactly one." },
        tag: { type: "object", description: "Release tag evidence: {name: 'v<version>', annotated: bool, moved: bool}." },
        changelog: { type: "object", description: "Changelog evidence: {has_entry_for_version: bool, unreleased_section_moved: bool}." },
        release_notes: { type: "object", description: "Release-notes evidence: {present: bool, breaking_changes: [...], migration_steps: [...]}." },
        approver: { type: "string", description: "Named human who owns and approves the release." },
        approval: { type: "object", description: "Approval evidence: {hitl_recorded: bool}." },
        rollout_plan: { type: "object", description: "Rollout evidence: {present: bool}." },
        rollback_plan: { type: "object", description: "Rollback evidence: {present: bool, testable: bool}." },
        health_check: { type: "object", description: "Post-release health evidence: {window_hours: number, 24–48}." },
        artifacts: { type: "object", description: "Artifact evidence: {sealed: bool, checksum_manifest: bool, verified_before_announcement: bool}." },
        tests: { type: "object", description: "Test evidence: {passing: bool}." },
      },
      additionalProperties: true,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  run(input) {
    let verdict: Record<string, unknown>;
    try {
      verdict = (evaluate as unknown as (m: unknown) => Record<string, unknown>)(input);
    } catch (e) {
      if (e instanceof FieldTypeError) throw new InputError(e.field, e.message);
      if (e instanceof TypeError) throw new InputError("manifest", e.message);
      throw e;
    }
    return { ...verdict, stamp: (stamp as unknown as (v: unknown) => string)(verdict) };
  },
};

/** Manifest-check atoms (Batch 1+): every core follows atom #1's shape —
 *  evaluate(manifest) throws TypeError on a non-object manifest, and the
 *  handler returns the verdict dict plus its stamp. One entry per atom. */
function manifestAtom(def: {
  serviceName: string;
  namespace: string;
  displayName: string;
  description: string;
  schemaDescription: string;
  properties: Record<string, unknown>;
  evaluateFn: unknown;
  stampFn: unknown;
}): AtomHandler {
  const evaluateFn = def.evaluateFn as (m: unknown) => Record<string, unknown>;
  const stampFn = def.stampFn as (v: Record<string, unknown>) => string;
  return {
    serviceName: def.serviceName,
    namespace: def.namespace,
    displayName: def.displayName,
    atomVersion: "0.1.0",
    tool: {
      name: def.namespace,
      title: def.displayName,
      description: def.description,
      inputSchema: {
        type: "object",
        description: def.schemaDescription,
        properties: def.properties,
        additionalProperties: true,
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    run(input) {
      let verdict: Record<string, unknown>;
      try {
        verdict = evaluateFn(input);
      } catch (e) {
        if (e instanceof FieldTypeError) throw new InputError(e.field, e.message);
        if (e instanceof TypeError) throw new InputError("manifest", e.message);
        throw e;
      }
      return { ...verdict, stamp: stampFn(verdict) };
    },
  };
}

const obj = (description: string) => ({ type: "object", description });
const str = (description: string) => ({ type: "string", description });
const arr = (description: string) => ({ type: "array", description });
const num = (description: string) => ({ type: "number", description });

const agentSafetyGuardrailAudit = manifestAtom({
  serviceName: "agent-safety-guardrail-audit",
  namespace: "agent_safety_guardrail_audit",
  displayName: "Agent safety guardrail audit",
  description:
    "Submit an agent-safety evidence manifest; get a deterministic GUARDED / NOT_GUARDED / INSUFFICIENT_EVIDENCE verdict across eight guardrail sections (injection defense, tool least privilege, approval gates, sandboxing, budgets and circuit breakers, output validation, secrets hygiene, red teaming) with per-check evidence.",
  schemaDescription: "The agent-safety evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    system: str("Agent system being audited."),
    version: str("System version."),
    guardrails_disabled: { type: "boolean", description: "Master guardrail disable flag; must be false." },
    tool_access: obj("Tool least-privilege evidence."),
    approvals: obj("Approval-gate evidence: {covered_actions, ...}."),
    sandbox: obj("Sandboxing evidence."),
    budgets: obj("Budget and circuit-breaker evidence."),
    kill_switch: obj("Kill-switch evidence."),
    output_validation: obj("Output-validation evidence."),
    secrets: obj("Secrets-hygiene evidence."),
    red_team: obj("Red-teaming evidence."),
  },
  evaluateFn: evaluateAgentSafety,
  stampFn: stampAgentSafety
});

const appendOnlyLedgerDesignAudit = manifestAtom({
  serviceName: "append-only-ledger-design-audit",
  namespace: "append_only_ledger_design_audit",
  displayName: "Append only ledger design audit",
  description:
    "Submit a ledger-design evidence manifest; get a deterministic SOUND / UNSOUND / INSUFFICIENT_EVIDENCE verdict on append-only ledger invariants (no mutation paths, compensating-entry corrections, integrity, reconciliation, recovery) with per-check evidence.",
  schemaDescription: "The ledger-design evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    append_only: obj("Append-only enforcement evidence."),
    structure: obj("Ledger structure evidence."),
    money: obj("Money representation evidence (integer minor units, double entry)."),
    derived_state: obj("Derived-state / balance projection evidence."),
    reconciliation: obj("Reconciliation evidence."),
    recovery: obj("Recovery and period-close evidence."),
    reporting: obj("Reporting evidence."),
    security: obj("Access and integrity evidence."),
    tests: obj("Invariant-test evidence."),
  },
  evaluateFn: evaluateLedgerDesign,
  stampFn: stampLedgerDesign
});

const dependencyGovernanceAudit = manifestAtom({
  serviceName: "dependency-governance-audit",
  namespace: "dependency_governance_audit",
  displayName: "Dependency governance audit",
  description:
    "Submit a dependency-governance evidence manifest; get a deterministic GOVERNED / NOT_GOVERNED / INSUFFICIENT_EVIDENCE verdict across six sections (justification, verified sources, pinning, audit and updates, licences, SBOM) with per-check evidence.",
  schemaDescription: "The dependency-governance evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    project: str("Project being audited."),
    justification: obj("Per-dependency justification evidence."),
    sources: obj("Verified-source evidence."),
    pinning: obj("Version pinning and lockfile evidence."),
    audit: obj("Audit and vulnerability-response evidence."),
    updates: obj("Update cadence and auto-merge evidence."),
    licences: obj("Dependency licence evidence."),
    sbom: obj("SBOM evidence."),
  },
  evaluateFn: evaluateDependencyGovernance,
  stampFn: stampDependencyGovernance
});

const edgePlatformEngineering = manifestAtom({
  serviceName: "edge-platform-engineering",
  namespace: "edge_platform_engineering",
  displayName: "Edge platform engineering",
  description:
    "Submits an edge-platform engineering record (platform fit and storage, deploys and versioning, security and Access, reliability, tunnels, quotas and DNS/TLS) and returns a deterministic EDGE_PLATFORM_SOUND / EDGE_PLATFORM_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed storage-backend consistency and Access-coverage checks, with per-check evidence. Audits the declared record; it builds and deploys nothing.",
  schemaDescription: "The edge-platform manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Edge platform project being audited."),
    platform_fit: obj("Platform fit evidence."),
    components: arr("Declared components: {name, storage_backend, storage_rationale_documented, requires_strong_consistency, is_admin_surface, access_protected}."),
    deploy: obj("Deploy evidence."),
    security: obj("Security evidence."),
    reliability: obj("Reliability evidence."),
    tunnels: obj("Tunnels evidence."),
    quotas: obj("Quotas evidence."),
    dns_tls: obj("Dns tls evidence.")
  },
  evaluateFn: evaluateEdgePlatformEngineering,
  stampFn: stampEdgePlatformEngineering
});

const efficientWebBuildStandard = manifestAtom({
  serviceName: "efficient-web-build-standard",
  namespace: "efficient_web_build_standard",
  displayName: "Efficient web build standard",
  description:
    "Submits a web-build record (publish-time precompute and call discipline, caching layers, bytes, compression and client code, delivery, security and process) and returns a deterministic EFFICIENT_WEB_BUILD_STANDARD_MET / EFFICIENT_WEB_BUILD_STANDARD_NOT_MET / INSUFFICIENT_EVIDENCE verdict across four sections, including computed publish-render, per-load call, asset max-age, JS-budget and CPU checks against the skill's stated numbers, with per-check evidence. Audits the declared record; it builds and measures nothing.",
  schemaDescription: "The web-build manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    site: str("Site / build being audited."),
    plan: obj("Plan evidence."),
    precompute: obj("Precompute evidence."),
    calls: obj("Calls evidence."),
    search: obj("Search evidence."),
    pages: arr("Declared pages: {name, content_same_for_all_visitors, rendered_at_publish, calls_per_load}."),
    caching: obj("Caching evidence."),
    payload: obj("Payload evidence."),
    delivery: obj("Delivery evidence."),
    security: obj("Security evidence."),
    process: obj("Process evidence.")
  },
  evaluateFn: evaluateEfficientWebBuildStandard,
  stampFn: stampEfficientWebBuildStandard
});

const electricalMachinesExpertAdvice = manifestAtom({
  serviceName: "electrical-machines-expert-advice",
  namespace: "electrical_machines_expert_advice",
  displayName: "Electrical machines expert advice",
  description:
    "Submits an electrical-machines SME advice record (engagement, family-gated machine analysis, drives, protection, standards and hazardous areas, calculations, documents and disclosure) and returns a deterministic SOUND / NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including skill-vocabulary checks for machine family, control mode and ANSI device numbers, with per-check evidence. Audits the declared advice record; it gives no engineering advice.",
  schemaDescription: "The machines-advice manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    advice_id: str("Advice engagement identifier."),
    engagement: obj("Engagement evidence."),
    machine: obj("Machine evidence."),
    drives: obj("Drives evidence."),
    protection: obj("Protection evidence."),
    standards: obj("Standards evidence."),
    calculations: obj("Calculations evidence."),
    documents: obj("Documents evidence.")
  },
  evaluateFn: evaluateElectricalMachinesExpertAdvice,
  stampFn: stampElectricalMachinesExpertAdvice
});

const encryptionClaimAudit = manifestAtom({
  serviceName: "encryption-claim-audit",
  namespace: "encryption_claim_audit",
  displayName: "Encryption claim audit",
  description:
    "Submit an encryption-claims evidence manifest; get a deterministic CLAIMS_SOUND / CLAIMS_UNSOUND / INSUFFICIENT_EVIDENCE verdict across claim specificity, standard construction, key management, derivation and randomness, coverage, and claim-vs-posture consistency, with per-check evidence.",
  schemaDescription: "The encryption-evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    product: str("Product whose encryption claims are audited."),
    claims: obj("Declared encryption claims (e.g. end_to_end_encrypted, zero_knowledge)."),
    construction: obj("Algorithm/mode construction evidence."),
    key_management: obj("Key generation, storage, rotation and recovery evidence."),
    password_derivation: obj("Password-derivation (KDF) evidence."),
    randomness: obj("Randomness-source evidence."),
    coverage: obj("Data-state coverage evidence (transit, rest, logs, dumps)."),
    asymmetric: obj("Asymmetric construction evidence."),
    access: obj("Server plaintext/key access evidence (consistency checks)."),
  },
  evaluateFn: evaluateEncryptionClaim,
  stampFn: stampEncryptionClaim
});

const engineeringProjectBudgetPack = manifestAtom({
  serviceName: "engineering-project-budget-pack",
  namespace: "engineering_project_budget_pack",
  displayName: "Engineering project budget pack",
  description:
    "Submits an engineering project budget pack (basis document, budget build and line items, contingency, reserve and totals, approval and baseline, change control and tracking, closeout) and returns a deterministic BUDGET_PACK_READY / BUDGET_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed line-amount, subtotal, contingency, totals-chain, change and forecast-variance arithmetic, with per-check evidence. Audits the declared pack; it prepares no budget.",
  schemaDescription: "The project-budget-pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    entity: str("Project / budget pack being audited."),
    basis: obj("Basis evidence."),
    build: obj("Build evidence."),
    line_items: arr("Declared line items: {label, category, pricing_basis, quantity, unit_rate, declared_amount}."),
    contingency: obj("Contingency evidence."),
    totals: obj("Totals evidence."),
    approval: obj("Approval evidence."),
    changes: obj("Changes evidence."),
    change_entries: arr("Declared change entries: {label, cost_impact, impact_statement_present, approved_before_work}."),
    tracking: obj("Tracking evidence."),
    closeout: obj("Closeout evidence.")
  },
  evaluateFn: evaluateEngineeringProjectBudgetPack,
  stampFn: stampEngineeringProjectBudgetPack
});

const engineeringWorkPackageStructuring = manifestAtom({
  serviceName: "engineering-work-package-structuring",
  namespace: "engineering_work_package_structuring",
  displayName: "Engineering work package structuring",
  description:
    "Submits a work-package structure record (package definition, deliverables and documents, document control and revisions, check discipline and transmittals, delivery quality and handover) and returns a deterministic WORK_PACKAGE_STRUCTURED / WORK_PACKAGE_NOT_STRUCTURED / INSUFFICIENT_EVIDENCE verdict across four sections, including computed sign-off, independent-check and transmittal-coverage checks, with per-check evidence. Audits the declared record; it structures no package.",
  schemaDescription: "The work-package manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    package: str("Work package being audited."),
    definition: obj("Definition evidence."),
    deliverables: arr("Declared deliverables: {name, kind}."),
    documents: arr("Declared documents: {name, kind, status, revision, revision_reason_declared, revision_history_present, designer, checker, prepared_by, reviewed_by, approved_by, purpose_declared, inputs_declared, assumptions_declared, standards_cited_declared, units_declared, results_declared, check_signature_declared}."),
    document_control: obj("Document control evidence."),
    check_discipline: obj("Check discipline evidence."),
    transmittals: arr("Declared transmittals: {document, recipient, revision, date, return_status_declared}."),
    transmittal_log: obj("Transmittal log evidence."),
    handover: obj("Handover evidence.")
  },
  evaluateFn: evaluateEngineeringWorkPackageStructuring,
  stampFn: stampEngineeringWorkPackageStructuring
});

const fareConstructionSavingsStrategy = manifestAtom({
  serviceName: "fare-construction-savings-strategy",
  namespace: "fare_construction_savings_strategy",
  displayName: "Fare construction savings strategy",
  description:
    "Submits a fare-construction record (trip definition, fare drivers, search strategy, total-cost surface, fare construction, price integrity) and returns a deterministic FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY / FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed total-cost, constructed-total and savings arithmetic, with per-check evidence. Audits the declared record; it searches no fares and books nothing.",
  schemaDescription: "The fare-construction manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    trip_label: str("Trip the fare construction covers."),
    trip: obj("Trip evidence."),
    drivers: obj("Drivers evidence."),
    strategy: obj("Strategy evidence."),
    total_cost: obj("Total cost evidence."),
    construction: obj("Construction evidence."),
    integrity: obj("Integrity evidence.")
  },
  evaluateFn: evaluateFareConstructionSavingsStrategy,
  stampFn: stampFareConstructionSavingsStrategy
});

const financeEducationArticle = manifestAtom({
  serviceName: "finance-education-article",
  namespace: "finance_education_article",
  displayName: "Finance education article",
  description:
    "Submits a finance-education article-production record (article structure, worked example, no-signals discipline, disclosures, review) and returns a deterministic ARTICLE_READY / NOT_ARTICLE_READY / INSUFFICIENT_EVIDENCE verdict across five sections, including computed section-order and worked-example arithmetic checks, with per-check evidence. Audits the declared record; it writes no article.",
  schemaDescription: "The finance-article manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    article: str("Article being audited."),
    topic: str("Article topic."),
    structure: obj("Structure evidence."),
    worked_example: obj("Worked example evidence."),
    signals: obj("Signals evidence."),
    disclosure: obj("Disclosure evidence."),
    review: obj("Review evidence.")
  },
  evaluateFn: evaluateFinanceEducationArticle,
  stampFn: stampFinanceEducationArticle
});

const firewallRulesAudit = manifestAtom({
  serviceName: "firewall-rules-audit",
  namespace: "firewall_rules_audit",
  displayName: "Firewall rules audit",
  description:
    "Submit a firewall ruleset and management-posture manifest; get a deterministic SOUND / UNSOUND / INSUFFICIENT_EVIDENCE verdict, including rule-level checks (any-any allows, shadowed rules, broad port ranges, sensitive-service exposure, undocumented or expired temporary rules) that name the offending rules, with per-check evidence.",
  schemaDescription: "The firewall evidence manifest, including the declared rules[] list (see the atom's SERVICE.md for the field table and rule schema).",
  properties: {
    system: str("System / ruleset being audited."),
    environment: str("Environment (e.g. production)."),
    default_policy: obj("Default-policy evidence (default-deny, explicit deny rule)."),
    layers_consistent: { type: "boolean", description: "Whether enforcement layers are consistent." },
    egress: obj("Egress allowlist and alerting evidence."),
    rules: arr("Declared firewall rules: {id, direction, source, destination, ports, protocol, action, owner, reason, ...}."),
    change_control: obj("Change-review evidence."),
    logging: obj("Denial logging evidence."),
    review: obj("Review cadence and rule-retirement evidence."),
    testing: obj("Post-change testing evidence."),
  },
  evaluateFn: evaluateFirewallRules,
  stampFn: stampFirewallRules
});

const licenseComplianceCheck = manifestAtom({
  serviceName: "license-compliance-check",
  namespace: "license_compliance_check",
  displayName: "License compliance check",
  description:
    "Submit a licence-posture manifest (components, licences, distribution model); get a deterministic COMPLIANT / NON_COMPLIANT / INSUFFICIENT_EVIDENCE check across licence files, dependency compatibility, contributor terms, and claims/contracts, with per-check evidence. A check over declared evidence, not legal advice.",
  schemaDescription: "The licence-posture manifest (see the atom's SERVICE.md for the field table and component-list schema).",
  properties: {
    product: str("Product / distribution being checked."),
    distribution_model: str("Distribution model (e.g. proprietary_binary, saas, source_release)."),
    project_license: str("The project's own licence."),
    license_decision: obj("Licence-choice decision record evidence."),
    license_file: obj("LICENSE file evidence (verbatim text, present)."),
    notice_file: obj("NOTICE file evidence."),
    source_headers: obj("Source-header evidence."),
    components: arr("Declared components: {name, license, requires_attribution, requires_bundled_license}."),
    dependency_scan: obj("Dependency licence-scan evidence."),
    attribution: obj("Attribution-shipping evidence."),
    bundled_licenses: obj("Bundled third-party licence evidence."),
    contributor_terms: obj("Contributor terms evidence (DCO/CLA)."),
    trademark: obj("Trademark-use evidence."),
    public_claims: obj("Public licence-claims evidence."),
    client_work: obj("Client-work (SOW/MSA) constraint evidence."),
  },
  evaluateFn: evaluateLicenseCompliance,
  stampFn: stampLicenseCompliance
});

const agentEvaluationScorecard = manifestAtom({
  serviceName: "agent-evaluation-scorecard",
  namespace: "agent_evaluation_scorecard",
  displayName: "Agent evaluation scorecard",
  description:
    "Submit an agent-evaluation evidence manifest; get a deterministic TRUSTED / NOT_TRUSTED / INSUFFICIENT_EVIDENCE scorecard across eight sections (task suite, reproducible runs, judging, regression gates, beyond accuracy, incident replay, scorecard, benchmark hygiene), including a computed per-task acceptance check against declared cost/latency allowances, with per-check evidence.",
  schemaDescription: "The agent-evaluation evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    agent: str("Agent being evaluated."),
    version: str("Agent version."),
    suite: obj("Task-suite evidence (versioned, criteria written before the run, acceptance criteria per task)."),
    run: obj("Reproducible-run evidence (pinned model/settings/tools/fixtures, transcripts stored)."),
    judging: obj("Judging evidence (deterministic checks first, LLM-judge calibration/blinding, self-judging)."),
    gates: obj("Regression-gate evidence."),
    metrics: obj("Beyond-accuracy metric tracking evidence."),
    incidents: obj("Incident-replay evidence."),
    scorecard: obj("Scorecard publication/storage evidence."),
    hygiene: obj("Benchmark-hygiene evidence (contamination, variance, re-baselining)."),
    tasks: arr("Declared task results: {name, passed, cost, allowed_cost, latency_ms, allowed_latency_ms, safety_violation}."),
  },
  evaluateFn: evaluateAgentEvaluation,
  stampFn: stampAgentEvaluation
});

const assumptionAudit = manifestAtom({
  serviceName: "assumption-audit",
  namespace: "assumption_audit",
  displayName: "Assumption audit",
  description:
    "Submit a decision-process evidence manifest; get a deterministic SOUND / UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections (framing, preset criteria, loss function, rigor sizing, data discipline, review) with per-check evidence.",
  schemaDescription: "The decision-process evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    decision: str("Decision being audited."),
    framing: obj("Framing evidence (decision named, options, decision-maker, objective)."),
    preset: obj("Preset-criteria evidence (criteria, default action, change-my-mind threshold — all set before data)."),
    loss: obj("Loss-function evidence (cost of wrong in each direction, asymmetry in the threshold)."),
    rigor: obj("Rigor-sizing evidence (stakes, reversibility, effort matched)."),
    data: obj("Data-discipline evidence (exploratory vs confirmatory, roles clear)."),
    review: obj("Review evidence (decision quality reviewed separately from outcome)."),
  },
  evaluateFn: evaluateAssumptionAudit,
  stampFn: stampAssumptionAudit
});

const claimVerificationFactCheckStamp = manifestAtom({
  serviceName: "claim-verification-fact-check-stamp",
  namespace: "claim_verification_fact_check_stamp",
  displayName: "Claim verification fact check stamp",
  description:
    "Submit a claim-verification manifest (declared claims with labels, source records and re-check records, plus the publication process record); get a deterministic STAMPED / NOT_STAMPED / INSUFFICIENT_EVIDENCE stamp across six sections, including per-claim triangulation and math re-derivation checks that name offending claims, with per-check evidence.",
  schemaDescription: "The claim-verification manifest (see the atom's SERVICE.md for the field table and claim-row schema).",
  properties: {
    document: str("Document / content being verified."),
    process: obj("Publication-process evidence (extraction, corrections policy, versions, silent edits)."),
    claims: arr("Declared claims: {id, material, label, independent_sources, primary_source, sources_archived, source_metadata_recorded, independence_checked, has_numbers, math_rechecked, language_weakest_supported}."),
  },
  evaluateFn: evaluateClaimVerification,
  stampFn: stampClaimVerification
});

/** Codebase structural query does not fit the manifest shape: it
 *  computes over a submitted graph index. It follows atom #1's
 *  handler pattern directly (evaluate + stamp, input errors named). */
const codebaseStructuralQuery: AtomHandler = {
  serviceName: "codebase-structural-query",
  namespace: "codebase_structural_query",
  displayName: "Codebase structural query",
  atomVersion: "0.1.0",
  tool: {
    name: "codebase_structural_query",
    title: "Codebase structural query",
    description:
      "Submit a code-graph index (nodes and typed edges) plus one structural query; get a deterministic graph answer — descendants, ancestors, blast radius, shortest typed path, stats, or snapshot — aggregate-first (counts and kind breakdowns; full node lists only on expand). Never answers from an index declared stale.",
    inputSchema: {
      type: "object",
      description: "The graph index plus one query (see the atom's SERVICE.md for the graph and query schemas).",
      properties: {
        graph: obj("The code-graph index: {nodes: [{id, kind}], edges: [{from, to, kind}]}."),
        query: obj("The query: {intent: descendants|ancestors|blast_radius|path|stats|snapshot, target, target_b, expand}."),
        index: obj("Index metadata: {stale: bool} — a stale index is never answered from."),
      },
      additionalProperties: true,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  run(input) {
    let result: Record<string, unknown>;
    try {
      result = (evaluateStructuralQuery as unknown as (m: unknown) => Record<string, unknown>)(input);
    } catch (e) {
      if (e instanceof TypeError) throw new InputError("manifest", e.message);
      if (e instanceof Error && /^(graph|query|unknown intent)/.test(e.message)) {
        throw new InputError("query", e.message);
      }
      throw e;
    }
    return { ...result, stamp: (stampStructuralQuery as unknown as (v: unknown) => string)(result) };
  },
};

const conditionMonitoringTriage = manifestAtom({
  serviceName: "condition-monitoring-triage",
  namespace: "condition_monitoring_triage",
  displayName: "Condition monitoring triage",
  description:
    "Submit a condition-monitoring evidence manifest (baseline, monitoring/context/trending discipline, declared alert bands with readings, alarm triage record); get a deterministic TRIAGE_SOUND / TRIAGE_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed reading-vs-band classification and action-band triage checks, with per-check evidence.",
  schemaDescription: "The condition-monitoring evidence manifest (see the atom's SERVICE.md for the field table and reading/alarm schemas).",
  properties: {
    asset: str("Asset being monitored (e.g. MTR-101)."),
    baseline: obj("Baseline evidence (exists, known load, post-repair capture)."),
    monitoring: obj("Technique/route/instrument discipline evidence."),
    context: obj("Reading-context evidence (load, ambient, speed)."),
    trending: obj("Trending evidence (deltas, rate of change, repair annotations)."),
    bands: obj("Alert-band definition evidence."),
    readings: arr("Declared readings: {parameter, value, watch_limit, warning_limit, action_limit}."),
    alarms: arr("Alarm triage record: {id, disposition: noise|watch|act, reasoning_recorded, recheck_interval_set, work_request_raised}."),
    escalation: obj("Escalation and red-line evidence."),
  },
  evaluateFn: evaluateConditionMonitoring,
  stampFn: stampConditionMonitoring
});

const definedFlowAuditor = manifestAtom({
  serviceName: "defined-flow-auditor",
  namespace: "defined_flow_auditor",
  displayName: "Defined-flow auditor",
  description:
    "Submit a zero-trust evidence manifest; get a deterministic DEFINED / NOT_DEFINED / INSUFFICIENT_EVIDENCE verdict across seven sections (never trust always verify, identity-based access, least privilege, micro-segmentation, continuous verification, the claim gauntlet, scope and limits) with per-check evidence. One failure breaks the claim.",
  schemaDescription: "The zero-trust evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    system: str("System whose defined flows are audited."),
    auth: obj("Per-request authentication/authorization evidence."),
    identity: obj("Identity-based access evidence."),
    privilege: obj("Least-privilege evidence."),
    segmentation: obj("Micro-segmentation evidence."),
    verification: obj("Continuous-verification evidence."),
    gauntlet: obj("Claim-gauntlet evidence (server secrets, breach exposure, backdoors)."),
    scope: obj("Scope, honest-limits and NIST-alignment evidence."),
  },
  evaluateFn: evaluateDefinedFlow,
  stampFn: stampDefinedFlow
});

const correctnessVerificationCertificate = manifestAtom({
  serviceName: "correctness-verification-certificate",
  namespace: "correctness_verification_certificate",
  displayName: "Correctness verification certificate",
  description:
    "Submit a correctness-verification evidence manifest; get a deterministic CERTIFIED / NOT_CERTIFIED / INSUFFICIENT_EVIDENCE certificate across seven sections (claims register, evidence ladder, specs before tools, evidence artifacts, scope honesty, CI integration, adversarial review and certification) with per-check evidence. One failure breaks the claim.",
  schemaDescription: "The correctness-verification evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    component: str("Component whose correctness claim is certified."),
    register: obj("Claims-register evidence (existence, property, scope, evidence level, expiry per claim)."),
    ladder: obj("Evidence-ladder evidence (cheapest sufficient level; no claim exceeding its level; tests not presented as proof)."),
    specs: obj("Specs-before-tools evidence (invariants, pre/post-conditions, liveness, written before tools ran)."),
    artifacts: obj("Evidence-artifact evidence (machine-checkable artifacts, proof scripts/solver logs, counterexamples, reproduction recipe)."),
    scope: obj("Scope-honesty evidence (exclusions, versioned claims, re-verification triggers, verified at current version)."),
    ci: obj("CI-integration evidence (verification in pipeline; broken proof fails the build)."),
    review: obj("Adversarial-review evidence (independent review; counterexample found/disclosed)."),
    certificate: obj("Certificate evidence (signed attestation binding claim to artifact to commit; independently reproducible)."),
  },
  evaluateFn: evaluateCorrectnessVerification,
  stampFn: stampCorrectnessVerification
});

const cryptoInventoryPqMigrationMap = manifestAtom({
  serviceName: "crypto-inventory-pq-migration-map",
  namespace: "crypto_inventory_pq_migration_map",
  displayName: "Crypto inventory pq migration map",
  description:
    "Submit a crypto inventory (algorithm, purpose, shelf-life per use); get a deterministic post-quantum migration map — each use classified (quantum-vulnerable, hybrid, PQ-ready, symmetric/hash not broken, unknown), mapped to its NIST PQ target family (ML-KEM / ML-DSA / SLH-DSA, hybrid first), and ordered in migration priority by shelf-life.",
  schemaDescription: "The crypto inventory manifest (see the atom's SERVICE.md for the field table and entry schema).",
  properties: {
    system: str("System / estate whose cryptography is inventoried."),
    inventory: arr("Crypto inventory entries: {id, surface, algorithm, purpose, shelf_life_years, owner}."),
  },
  evaluateFn: evaluateCryptoInventory,
  stampFn: stampCryptoInventory
});

const decisionTrapSweep = manifestAtom({
  serviceName: "decision-trap-sweep",
  namespace: "decision_trap_sweep",
  displayName: "Decision-trap sweep",
  description:
    "Submit a declared decision record; get a deterministic TRAP_CLEAR / TRAPS_PRESENT / INSUFFICIENT_EVIDENCE sweep across seven trap sections (framing and classification, options, criteria before evaluation, evaluation and uncertainty, pre-mortem, rush and mood trap, decision log and review) with per-check evidence.",
  schemaDescription: "The declared decision record (see the atom's SERVICE.md for the field table).",
  properties: {
    decision: str("Decision being swept."),
    framing: obj("Framing/classification evidence (decision stated, decide-by, constraints, out-of-scope, classification reversible|irreversible, stakes)."),
    options: obj("Options evidence: {list: [...], includes_status_quo, includes_smaller_reversible_step}."),
    criteria: obj("Criteria evidence (listed, defined and weighted before scoring)."),
    evaluation: obj("Evaluation evidence (method named, uncertainty flagged, probabilities estimable, expected value used)."),
    premortem: obj("Pre-mortem evidence (materiality declared, conducted, top risks hedged)."),
    rush: obj("Rush/mood evidence for irreversible decisions: {made_in_rush, made_in_a_mood} — both must be false."),
    log: obj("Decision-log evidence (choice, rationale, assumptions, review date, communicated with why)."),
  },
  evaluateFn: evaluateDecisionTrapSweep,
  stampFn: stampDecisionTrapSweep
});

const distributionEquipmentRatingConditionCheck = manifestAtom({
  serviceName: "distribution-equipment-rating-condition-check",
  namespace: "distribution_equipment_rating_condition_check",
  displayName: "Distribution equipment rating condition check",
  description:
    "Submit a distribution-equipment evidence manifest (ratings vs the current fault study with declared equipment ratings, MCC and switchgear specifics, transformer loading/temperature/paralleling records, condition-awareness and coordination/safety records); get a deterministic RATING_CONDITION_SOUND / RATING_CONDITION_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed rating-coverage, nameplate-loading, declared-temperature-limit and paralleling-match checks, with per-check evidence.",
  schemaDescription: "The distribution-equipment evidence manifest (see the atom's SERVICE.md for the field table and equipment/transformer entry schemas).",
  properties: {
    lineup: str("Lineup / substation under check."),
    ratings: obj("Ratings-vs-fault-study evidence (study current, ratings verified against it)."),
    equipment: arr("Declared equipment entries: {id, interrupting_rating_ka, available_fault_current_ka, continuous_current_rating_a, load_current_a}."),
    mcc: obj("MCC-specific evidence."),
    switchgear: obj("Switchgear-specific evidence."),
    transformers: arr("Declared transformer entries: {id, nameplate_kva, load_kva, top_oil_temp_c, top_oil_limit_c, winding_temp_c, winding_limit_c, paralleled, vector_group_match, ratio_match, impedance_match}."),
    transformer: obj("Transformer posture evidence (paralleling gate, K-factor)."),
    condition: obj("Condition-awareness evidence."),
    coordination: obj("Coordination and safety evidence."),
  },
  evaluateFn: evaluateDistributionEquipment,
  stampFn: stampDistributionEquipment
});

const electricalMachineryEngineeringCheck = manifestAtom({
  serviceName: "electrical-machinery-engineering-check",
  namespace: "electrical_machinery_engineering_check",
  displayName: "Electrical machinery engineering check",
  description:
    "Submit a machinery engineering evidence manifest (duty, sizing, specification, acceptance tests, failure analysis, trending, records and safety); get a deterministic SOUND / NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections (duty, sizing, specification, acceptance tests, failure analysis, trending, records and safety), including computed worst-case-vs-rating and starting-current-vs-supply checks, with per-check evidence.",
  schemaDescription: "The machinery engineering evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    machine: str("Machine under check (e.g. pump-motor-P101)."),
    duty: obj("Duty evidence (torque profile, starts/hour, ambient, altitude, worst case)."),
    sizing: obj("Sizing evidence (worst-case vs rating, service factor, starting current vs supply, efficiency at actual load)."),
    specification: obj("Specification evidence (type, insulation class, enclosure, bearings, heaters, RTDs, vibration limits, standards)."),
    tests: obj("Acceptance-test evidence (criteria, IR/PI/DAR, winding balance, surge, runs, units, calibration)."),
    failure: obj("Failure-analysis evidence (investigation gate, timeline, operating history, typical modes)."),
    trending: obj("Trending evidence (per-asset baseline, like-for-like, deltas)."),
    records: obj("Records and red-line evidence (nameplate verification, re-energize rule, anomalies, records, deviations)."),
  },
  evaluateFn: evaluateElectricalMachinery,
  stampFn: stampElectricalMachinery
});

const electricalTestRecordPreparation = manifestAtom({
  serviceName: "electrical-test-record-preparation",
  namespace: "electrical_test_record_preparation",
  displayName: "Electrical test record preparation",
  description:
    "Submit a test-record evidence manifest (test sheet, data hygiene, readings with declared acceptance criteria, machine-readable format, trending and plotting discipline, retention/audit record); get a deterministic RECORD_READY / RECORD_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed readings-vs-criteria and declared-verdict consistency checks, with per-check evidence.",
  schemaDescription: "The test-record evidence manifest (see the atom's SERVICE.md for the field table and reading schema).",
  properties: {
    asset: str("Asset the test record covers."),
    record: obj("Test-sheet field evidence (template completeness)."),
    hygiene: obj("Data-hygiene evidence (raw data preserved, corrections via dated revision notes)."),
    readings: arr("Declared readings: {point, value, unit, acceptance_min, acceptance_max}."),
    format: obj("Machine-readable format evidence."),
    trending: obj("Trending evidence."),
    plotting: obj("Plotting-discipline evidence (labeled axes, version+date, no dual-axis charts)."),
    retention: obj("Retention and audit evidence."),
  },
  evaluateFn: evaluateElectricalTestRecord,
  stampFn: stampElectricalTestRecord
});

const financeContentComplianceCheck = manifestAtom({
  serviceName: "finance-content-compliance-check",
  namespace: "finance_content_compliance_check",
  displayName: "Finance content compliance check",
  description:
    "Submit a finance-education content evidence manifest (advice boundary, declared figures with sources, risk framing, calculators, commercial honesty, corrections); get a deterministic COMPLIANT / NON_COMPLIANT / INSUFFICIENT_EVIDENCE verdict across six sections, including computed figure-completeness and primary-sourced-and-rederived checks, with per-check evidence. A check over declared evidence, not legal or financial advice.",
  schemaDescription: "The finance-content evidence manifest (see the atom's SERVICE.md for the field table and figures[] schema).",
  properties: {
    content: str("Content artifact the manifest covers."),
    jurisdiction: str("Jurisdiction context for the content."),
    advice_boundary: obj("Advice-boundary evidence (frameworks taught, no personalized recommendations, disclaimer)."),
    figures: arr("Declared figures: {label, as_of, source, primary, rederived}."),
    accuracy: obj("Accuracy and sourcing evidence."),
    risk: obj("Risk-framing evidence (risk before upside, no return promises)."),
    calculators: obj("Calculator/tool evidence (gated on includes_calculator)."),
    commercial: obj("Commercial-honesty evidence (sponsorship labeling, conflicts)."),
    compliance: obj("Compliance evidence (jurisdiction notes, privacy)."),
    corrections: obj("Corrections evidence (log maintained, visible and dated)."),
  },
  evaluateFn: evaluateFinanceContent,
  stampFn: stampFinanceContent
});

const forecastWithRangesAndScorecard = manifestAtom({
  serviceName: "forecast-with-ranges-and-scorecard",
  namespace: "forecast_with_ranges_and_scorecard",
  displayName: "Forecast with ranges and scorecard",
  description:
    "Submit a declared forecast artifact (purpose and horizon, baselines, range, triggered scenarios, and a forecast-vs-actual scorecard history); get a deterministic FORECAST_READY / FORECAST_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed range-ordering, scenario-trigger and scorecard-metric re-derivation checks, with per-check evidence. Validates a declared forecast; it does not produce one.",
  schemaDescription: "The forecast artifact manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    series: str("Series the forecast covers."),
    forecast: obj("Forecast purpose, horizon and ownership evidence."),
    baselines: obj("Baseline values and comparison evidence (naive / moving-average / seasonal-naive)."),
    decomposition: obj("Decomposition evidence."),
    range: obj("Declared range: {low, base, high}."),
    scenarios: arr("Declared scenarios covering base / best / worst."),
    scenario_detail: obj("Scenario trigger-condition evidence."),
    scorecard: obj("Scorecard with forecast-vs-actual history and declared MAE / MAPE / bias."),
    revision: obj("Revision-hygiene evidence (history preserved, no silent restatement)."),
    cadence: obj("Rolling-forecast cadence evidence."),
  },
  evaluateFn: evaluateForecastRanges,
  stampFn: stampForecastRanges
});

const lean4FormalProof = manifestAtom({
  serviceName: "lean4-formal-proof",
  namespace: "lean4_formal_proof",
  displayName: "Lean4 formal proof",
  description:
    "Submit a declared Lean 4 proof-artifact manifest (project setup, statement integrity, definitions, proof integrity, theorem declarations, build attestation, model alignment); get a deterministic VERIFIED / NOT_VERIFIED / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed zero-sorry, standard-axioms-only and kernel-checked theorem checks, with per-check evidence. Audits declared evidence; it does not run Lean or prove theorems.",
  schemaDescription: "The Lean 4 proof-artifact manifest (see the atom's SERVICE.md for the field table and theorems[] schema).",
  properties: {
    project: str("Project the proof artifact covers."),
    setup: obj("Project-setup evidence (toolchain pinned, CI lake build, build green)."),
    statements: obj("Statement-integrity evidence (stated before proving, not weakened silently)."),
    definitions: obj("Definitions-and-model evidence (total, executable, specs separate)."),
    proof: obj("Proof-integrity evidence (structured, cheating items tracked, none smuggled)."),
    theorems: arr("Declared theorems: {name, sorry_count, axioms, native_decide, kernel_checked}."),
    attestation: obj("Build-attestation evidence (build log, axiom audit, reproduction recipe)."),
    alignment: obj("Model-alignment evidence (mapping documented, model/implementation in sync)."),
  },
  evaluateFn: evaluateLean4FormalProof,
  stampFn: stampLean4FormalProof
});

const linkRotScanAndNotarizedArchive = manifestAtom({
  serviceName: "link-rot-scan-and-notarized-archive",
  namespace: "link_rot_scan_and_notarized_archive",
  displayName: "Link rot scan and notarized archive",
  description:
    "Submit a link-integrity evidence manifest (scan posture, declared link rows with observed statuses, archive captures, canonicalization, notarization records, serving and repair records); get a deterministic LINK_INTEGRITY_SOUND / LINK_INTEGRITY_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed archived/notarized-citation and rotted-citation-repaired checks, with per-check evidence. Audits declared scan evidence; it does not fetch URLs.",
  schemaDescription: "The link-integrity evidence manifest (see the atom's SERVICE.md for the field table and links[] schema).",
  properties: {
    site: str("Site the scan covers."),
    scan: obj("Scan-coverage evidence (scheduled, statuses and content hashes recorded, cadence current)."),
    links: arr("Declared link rows with observed statuses, capture and notarization fields."),
    archive: obj("Archive-capture evidence (format, fallback chain, cite-time capture)."),
    canonicalization: obj("Canonicalization evidence (trackers stripped, redirects resolved, dedupe by hash)."),
    notarization: obj("Notarization evidence (SHA-256, RFC 3161 / transparency-log timestamps, verification recipe)."),
    serving: obj("Honest-serving evidence (as-seen views, provenance badge, never presented as current)."),
    repair: obj("Repair evidence (repairs logged, no silent drops)."),
    compliance: obj("Compliance evidence (robots/ToS, rate limits, no access-control bypass)."),
  },
  evaluateFn: evaluateLinkRotScan,
  stampFn: stampLinkRotScan
});

const networkExposureAudit = manifestAtom({
  serviceName: "network-exposure-audit",
  namespace: "network_exposure_audit",
  displayName: "Network exposure audit",
  description:
    "Submit a network-exposure evidence manifest (inventory, declared public endpoints and sending domains, segmentation, TLS, DNS/email authentication, edge/access and egress posture); get a deterministic SOUND / UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed plaintext-endpoint, public-admin-endpoint and email-authentication checks that name offending endpoints, with per-check evidence.",
  schemaDescription: "The network-exposure evidence manifest (see the atom's SERVICE.md for the field table and endpoints[]/domains[] schemas).",
  properties: {
    system: str("System the audit covers."),
    environment: str("Environment the audit covers."),
    inventory: obj("Inventory evidence (current, every public endpoint owned, none unlisted)."),
    endpoints: arr("Declared endpoints: {host, port, protocol, service, zone, owner, listed}."),
    segmentation: obj("Segmentation evidence (trust zones separated, admin plane separate, default-deny)."),
    tls: obj("TLS evidence (no plaintext, valid certs, HSTS, minimum version)."),
    dns: obj("DNS evidence (registrar lock and 2FA, DNSSEC)."),
    domains: arr("Declared sending domains with SPF / DKIM / DMARC posture."),
    email: obj("Email-authentication monitoring evidence."),
    edge: obj("Edge evidence (WAF/CDN in front, rate limits)."),
    access: obj("Access evidence (admin via authenticated path only, no unauthenticated tunnels, no default credentials)."),
    egress: obj("Egress evidence (outbound allowlist, unexpected egress logged)."),
    evidence: obj("Evidence-review evidence (logged events, reviewed on change/incident)."),
  },
  evaluateFn: evaluateNetworkExposure,
  stampFn: stampNetworkExposure
});

const portfolioRiskAnalyticsReport = manifestAtom({
  serviceName: "portfolio-risk-analytics-report",
  namespace: "portfolio_risk_analytics_report",
  displayName: "Portfolio risk analytics report",
  description:
    "Submit a portfolio manifest (returns series, optional benchmark, holdings, factors, stress scenarios, decision journal); get deterministic risk analytics — volatility, drawdown, VaR/CVaR, Sharpe/Sortino, beta/alpha, concentration, carry, factor decomposition — with status complete / partial / insufficient_evidence and every gap named. Numbers only: no recommendations, nothing labeled optimal. A non-advisory computation over submitted data.",
  schemaDescription: "The portfolio analytics manifest (see the atom's SERVICE.md for the field table and the 6-decimal serialization rule).",
  properties: {
    portfolio: str("Portfolio the report covers."),
    returns: arr("Per-period portfolio returns (numbers)."),
    benchmark_returns: arr("Per-period benchmark returns (numbers), aligned with returns."),
    periods_per_year: num("Periods per year for annualization."),
    risk_free_per_period: num("Risk-free return per period."),
    var_confidence: num("Confidence level for historical VaR/CVaR (e.g. 0.95)."),
    holdings: arr("Declared holdings with shares/weights, currency, carry fields."),
    factors: arr("Declared factor series for the decomposition."),
    holding_returns: arr("Per-holding return series for correlations."),
    correlation_window: num("Trailing window for the last-window correlation matrix."),
    stress_scenarios: arr("Caller-submitted stress scenarios (portfolio-level or per-holding shocks)."),
    decision_journal: arr("Decision-journal entries: {confidence, hit} for calibration."),
  },
  evaluateFn: evaluatePortfolioRisk,
  stampFn: stampPortfolioRisk
});

const predictionModelLeakageCalibrationAudit = manifestAtom({
  serviceName: "prediction-model-leakage-calibration-audit",
  namespace: "prediction_model_leakage_calibration_audit",
  displayName: "Prediction model leakage calibration audit",
  description:
    "Submit a prediction-model evidence manifest (target and decision, baseline and holdout, split/feature declarations with availability times, calibration observations, drift and deployment posture); get a deterministic PREDICTION_AUDIT_SOUND / PREDICTION_AUDIT_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed feature-availability leakage, temporal-split, holdout-beats-baseline and calibration-error checks, with per-check evidence.",
  schemaDescription: "The prediction-model evidence manifest (see the atom's SERVICE.md for the field table and features[]/calibration schemas).",
  properties: {
    model: str("Model the audit covers."),
    prediction_time: num("Prediction time features must be available by."),
    target: obj("Target, horizon and decision evidence."),
    baseline: obj("Baseline evidence (computed, same holdout)."),
    holdout: obj("Holdout evidence (untouched, model vs baseline scores)."),
    validation: obj("Validation evidence (split documented, no peeking, no random split for temporal data)."),
    features: arr("Declared features: {name, available_at, derived_from_target}."),
    approach: obj("Model-ladder and threshold evidence (simple first, thresholds from decision costs)."),
    calibration: obj("Calibration evidence: observations (predicted vs observed) and declared max tolerated error."),
    evaluation: obj("Evaluation evidence (calibration and segment errors reported)."),
    drift: obj("Drift-monitoring and retrain-policy evidence."),
    deployment: obj("Deployment evidence (versioned model and card, rollback path, no silent updates)."),
  },
  evaluateFn: evaluatePredictionLeakage,
  stampFn: stampPredictionLeakage
});

const predictiveMaintenanceFailureRiskAssessment = manifestAtom({
  serviceName: "predictive-maintenance-failure-risk-assessment",
  namespace: "predictive_maintenance_failure_risk_assessment",
  displayName: "Predictive maintenance failure risk assessment",
  description:
    "Submit a predictive-maintenance evidence manifest (strategy fit, P–F window, condition monitoring, prediction discipline, reliability frame, data and integration); get a deterministic ASSESSMENT_SOUND / ASSESSMENT_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections with per-check evidence. Checks declared evidence only; runs no inference and computes no failure probability.",
  schemaDescription: "The predictive-maintenance evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    asset: str("Asset the assessment covers."),
    strategy_fit: obj("Strategy-fit evidence (criticality and failure cost assessed, strategy matched, PdM justified)."),
    pf_window: obj("P–F window evidence (detectable point P, detection early in the window, planning runway)."),
    condition_monitoring: obj("Condition-monitoring evidence (techniques matched to failure modes, sensor coverage)."),
    prediction: obj("Prediction evidence (baseline, anomaly/RUL posture, fault labels, uncertainty, threshold tuning)."),
    reliability_frame: obj("Reliability-frame evidence (FMEA, RPN prioritisation, RCM strategy, MTBF/MTTR tracking)."),
    data_and_integration: obj("Data and integration evidence (sensor calibration, drift/label watch, edge-vs-cloud, CMMS closure)."),
  },
  evaluateFn: evaluatePredictiveMaintenance,
  stampFn: stampPredictiveMaintenance
});

const pumpConveyorMotorSuitabilityCheck = manifestAtom({
  serviceName: "pump-conveyor-motor-suitability-check",
  namespace: "pump_conveyor_motor_suitability_check",
  displayName: "Pump conveyor motor suitability check",
  description:
    "Submit a pump/conveyor drive manifest (declared duty and operating point, motor sizing, pump and conveyor records, baselines, interface and protection, declared drives with required duty vs motor ratings); get a deterministic SUITABLE / NOT_SUITABLE / INSUFFICIENT_EVIDENCE verdict across six sections, including computed rated-vs-required power/torque, NPSH and starting-torque checks, with per-check evidence. Declared values only; nothing is measured.",
  schemaDescription: "The pump/conveyor suitability manifest (see the atom's SERVICE.md for the field table and the drives[] schema).",
  properties: {
    asset: str("Asset the check covers."),
    equipment_kind: str("Equipment kind: pump | conveyor | mixed — gates the kind-specific sections."),
    load_and_operating_point: obj("Load and operating-point evidence."),
    motor_sizing: obj("Motor-sizing evidence (declared)."),
    pump_checks: obj("Pump evidence (declared; NPSH/flow comparisons are computed from drives[])."),
    conveyor_checks: obj("Conveyor evidence (declared; starting-torque comparison is computed from drives[])."),
    baselines: obj("Baseline records evidence."),
    interface_and_protection: obj("Interface and protection evidence (incl. the engineering-review red line)."),
    drives: arr("Declared drives: required duty vs motor ratings; pump entries add NPSH + flow fields, conveyor entries add starting-torque fields."),
  },
  evaluateFn: evaluatePumpConveyor,
  stampFn: stampPumpConveyor
});

const ragRetrievalEvaluationTuning = manifestAtom({
  serviceName: "rag-retrieval-evaluation-tuning",
  namespace: "rag_retrieval_evaluation_tuning",
  displayName: "Rag retrieval evaluation tuning",
  description:
    "Submit a retrieval-system evidence manifest (corpus and chunking, hybrid retrieval, reranking and filters, index hygiene, evaluation, serving and privacy); get a deterministic RAG_EVALUATION_SOUND / RAG_EVALUATION_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed recall@k, MRR and nDCG against per-query declared thresholds and scope-leakage checks, with per-check evidence. Declared evidence only; no live index is queried.",
  schemaDescription: "The retrieval evaluation manifest (see the atom's SERVICE.md for the field table and the golden-query schema).",
  properties: {
    corpus_and_chunking: obj("Corpus and chunking evidence (inventory, freshness, dedup, provenance, chunking discipline)."),
    hybrid_retrieval: obj("Hybrid retrieval evidence (lexical + vector, declared combination weights, pinned embedding model)."),
    reranking_and_filters: obj("Reranking and filter evidence (reranker budget, bounded top-N, context token budget)."),
    index_hygiene: obj("Index-hygiene evidence (incremental updates, tombstones, rebuild drill, versioning)."),
    evaluation: obj("Evaluation evidence: golden queries with declared relevance, retrieved lists and per-query thresholds; scope-leakage declarations."),
    serving_and_privacy: obj("Serving and privacy evidence (latency budgets, caching, fallback, query-time scopes)."),
  },
  evaluateFn: evaluateRagRetrieval,
  stampFn: stampRagRetrieval
});

const reconciledPortfolioPerformanceReport = manifestAtom({
  serviceName: "reconciled-portfolio-performance-report",
  namespace: "reconciled_portfolio_performance_report",
  displayName: "Reconciled portfolio performance report",
  description:
    "Submit a portfolio performance manifest (beginning value, period-end values, external flows, optional benchmark, declared returns, holdings, transactions); get deterministic reconciled performance — time-weighted and money-weighted returns, a three-leg reconciliation against the declared data, and benchmark comparison — with status complete / partial / insufficient_evidence and every gap named. Numbers only: no recommendations, nothing labeled optimal.",
  schemaDescription: "The portfolio performance manifest (see the atom's SERVICE.md for the field table and the 6-decimal serialization rule).",
  properties: {
    beginning_value: num("Declared portfolio value at the start of the first period."),
    period_end_values: arr("Declared period-end values, one per period."),
    external_flows: arr("Net external flow at the beginning of each period (contributions +, withdrawals −), aligned with period_end_values."),
    benchmark_returns: arr("Per-period benchmark returns (numbers), aligned with the periods."),
    benchmark_name: str("Benchmark name."),
    declared_returns: arr("Caller-declared per-period returns, reconciled against the computed returns."),
    holdings: arr("Declared holdings: {id, quantity, price}."),
    transactions: arr("Declared ledger transactions: {kind: contribution|withdrawal, amount}."),
  },
  evaluateFn: evaluateReconciledPortfolio,
  stampFn: stampReconciledPortfolio
});

/** Semantic taint analysis does not fit the manifestAtom factory: its
 *  core raises plain Errors for invalid graph internals (mapped here to
 *  InputError("graph"), the codebase-structural-query pattern). */
const semanticCodeTaintAnalysisReport: AtomHandler = {
  serviceName: "semantic-code-taint-analysis-report",
  namespace: "semantic_code_taint_analysis_report",
  displayName: "Semantic code taint analysis report",
  atomVersion: "0.1.0",
  tool: {
    name: "semantic_code_taint_analysis_report",
    title: "Semantic code taint analysis report",
    description:
      "Submit a declared code graph (sources, sinks, sanitizers, transforms and directed data-flow edges); get a deterministic taint analysis — every source→sink pair classified tainted (shortest unsanitized path reported), sanitized, or unreachable, with a fixed severity table on sink kind — with verdict TAINTED / CLEAN / INSUFFICIENT_EVIDENCE. Analyses the declared graph only; code is never parsed or fetched.",
    inputSchema: {
      type: "object",
      description: "The taint-analysis manifest (see the atom's SERVICE.md for the graph schema).",
      properties: {
        graph: obj("The declared code graph: {nodes: [{id, role, kind}], edges: [{from, to}]} — role ∈ source|sink|sanitizer|transform (default transform)."),
      },
      additionalProperties: true,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  run(input) {
    let result: Record<string, unknown>;
    try {
      result = (evaluateSemanticTaint as unknown as (m: unknown) => Record<string, unknown>)(input);
    } catch (e) {
      if (e instanceof TypeError) throw new InputError("manifest", e.message);
      if (e instanceof Error && /^graph/.test(e.message)) {
        throw new InputError("graph", e.message);
      }
      throw e;
    }
    return { ...result, stamp: (stampSemanticTaint as unknown as (v: unknown) => string)(result) };
  },
};

const strategyBacktestValidation = manifestAtom({
  serviceName: "strategy-backtest-validation",
  namespace: "strategy_backtest_validation",
  displayName: "Strategy backtest validation",
  description:
    "Submit a declared backtest-evidence manifest (harness standards, protocol and reporting, costs and frictions, overfit and fragility evidence, paper-trading gate, live monitoring and house gates); get a deterministic VALIDATED / NOT_VALIDATED / INSUFFICIENT_EVIDENCE verdict across six sections, including a recomputed parameters-to-data ratio reported without an invented acceptance bar, with per-check evidence. Declared evidence only; no backtest is run.",
  schemaDescription: "The backtest-validation manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    strategy: str("Strategy the validation covers."),
    harness: obj("Harness-standards evidence (determinism, snapshots, point-in-time universe, look-ahead, fills)."),
    protocol: obj("Protocol and reporting evidence (hypothesis, in/out-of-sample, holdout, walk-forward)."),
    costs: obj("Costs and frictions evidence (commissions, spreads, slippage, taxes)."),
    overfit: obj("Overfit evidence (parameter discipline, sensitivity, plateau checks)."),
    fragility: obj("Fragility evidence (regime, concentration, failure-mode declarations)."),
    paper: obj("Paper-trading gate evidence (completion, or conscious waiver with reason and approval)."),
    monitoring: obj("Live-monitoring evidence (drift, live-vs-model comparison, kill criteria)."),
    house_gates: obj("House-gate evidence (incl. the declared clear-yes record for trades over the stated threshold)."),
  },
  evaluateFn: evaluateStrategyBacktest,
  stampFn: stampStrategyBacktest
});

const testedAuthorizationPolicyPack = manifestAtom({
  serviceName: "tested-authorization-policy-pack",
  namespace: "tested_authorization_policy_pack",
  displayName: "Tested authorization policy pack",
  description:
    "Submit a declared authorization policy pack manifest (decision model, policy code, declared policies and their tests, rollout, decision logs, governance and enforcement); get a deterministic READY / NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed default-deny and per-policy test-coverage checks that name untested policies, with per-check evidence. Declared evidence only; no policy is executed.",
  schemaDescription: "The policy-pack manifest (see the atom's SERVICE.md for the field table and the policies[]/tests[] schemas).",
  properties: {
    pack: str("Policy pack the verdict covers."),
    decision_model: obj("Decision-model evidence (enumerated decisions, input schema, default deny)."),
    policies: arr("Declared policies: ids, effect, and the tests that cover them."),
    policy_code: obj("Policy-code evidence (composability, data/logic separation, versioning, explanations)."),
    tests: arr("Declared policy tests: policy id, kind (positive/negative/edge), and outcome."),
    testing: obj("Testing-posture evidence (tests green, lint/format, role coverage declared)."),
    rollout: obj("Rollout evidence (shadow mode, staged enforcement, rollback)."),
    decision_logs: obj("Decision-log evidence (logging, explanation capture, retention)."),
    governance: obj("Governance evidence (ownership, review, change control)."),
    enforcement: obj("Enforcement evidence (bypass paths, silent-edit prohibition, fail-closed behaviour)."),
  },
  evaluateFn: evaluateTestedAuthorization,
  stampFn: stampTestedAuthorization
});

const vfdApplicationEngineeringCheck = manifestAtom({
  serviceName: "vfd-application-engineering-check",
  namespace: "vfd_application_engineering_check",
  displayName: "VFD application engineering check",
  description:
    "Submit a declared VFD application manifest (application profile, power quality, motor/cable/drive records, protection and control, commissioning, troubleshooting, records and red lines); get a deterministic SOUND / NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed declared-vs-declared harmonic-distortion, cable-length and derated-current checks, with per-check evidence. Declared values only; nothing is measured.",
  schemaDescription: "The VFD application manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    asset: str("Asset the check covers."),
    application: obj("Application-profile evidence (load/torque type, duty, speed range, environment, selection to duty)."),
    power_quality: obj("Power-quality evidence (declared harmonic distortion vs the declared site limit, mitigation, capacitor interaction)."),
    cable: obj("Cable evidence (declared length vs the declared OEM maximum lead length)."),
    drive: obj("Drive evidence (declared derated current vs required load current, ratings, cooling)."),
    protection: obj("Protection and control evidence (declared)."),
    commissioning: obj("Commissioning evidence (declared)."),
    troubleshooting: obj("Troubleshooting evidence (checked when troubleshooting is declared open)."),
    records: obj("Records and red-line evidence."),
  },
  evaluateFn: evaluateVfdApplication,
  stampFn: stampVfdApplication
});

const vulnerabilityTriageVerifiedClosure = manifestAtom({
  serviceName: "vulnerability-triage-verified-closure",
  namespace: "vulnerability_triage_verified_closure",
  displayName: "Vulnerability triage verified closure",
  description:
    "Submit a declared vulnerability register manifest (inventory and scanning, triage, patch SLAs, mitigation and exceptions, verified closure, disclosure and metrics, with declared findings and dates); get a deterministic CLOSURE_SOUND / CLOSURE_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed SLA-age checks against the manifest's declared as-of date that name offending findings, with per-check evidence. Declared evidence only; nothing is scanned.",
  schemaDescription: "The vulnerability register manifest (see the atom's SERVICE.md for the field table and the findings[] schema).",
  properties: {
    scope: str("Scope the register covers."),
    as_of_date: str("Declared as-of date (YYYY-MM-DD); all ages are computed against it — no wall clock is read."),
    inventory: obj("Inventory evidence (existence, owners, scan coverage)."),
    scanning: obj("Scanning evidence (cadence, alert handling)."),
    triage: obj("Triage evidence (risk factors considered, calls recorded, not score-only)."),
    findings: arr("Declared findings: id, severity, dates, exposure, mitigation, closure and verification evidence."),
    patch_slas: obj("Patch-SLA evidence (defined, tracked, exceptions logged)."),
    mitigation: obj("Mitigation and exception evidence (logged, owned, expiring)."),
    closure: obj("Verified-closure evidence (rescan/test verification per closed finding)."),
    disclosure: obj("Disclosure evidence (declared)."),
    metrics: obj("Metrics evidence (declared tracking the skill requires)."),
  },
  evaluateFn: evaluateVulnerabilityTriage,
  stampFn: stampVulnerabilityTriage
});

const zeroKnowledgeClaimAudit = manifestAtom({
  serviceName: "zero-knowledge-claim-audit",
  namespace: "zero_knowledge_claim_audit",
  displayName: "Zero knowledge claim audit",
  description:
    "Submit a declared zero-knowledge architecture claims manifest (claim basis, server access and storage, client-side encryption, key journey, trusted parties and recovery, plaintext and metadata scope, theater and threat model); get a deterministic CLAIMS_SOUND / CLAIMS_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, with per-check evidence. Declared claims only; no proof or system is verified.",
  schemaDescription: "The zero-knowledge claims manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    product: str("Product the claims cover."),
    claims: obj("Claim-basis evidence (what is claimed and on what basis)."),
    access: obj("Server-access evidence (whether the server can read user data)."),
    storage: obj("Storage evidence (opaque-bytes-only declaration)."),
    encryption: obj("Client-side encryption evidence (device-side, authenticated, not TLS alone)."),
    keys: obj("Key-journey evidence (keys never leave the device, client-side derivation, backups)."),
    trust: obj("Trusted-parties evidence (escrow, recovery backdoors, trusted components)."),
    recovery: obj("Recovery evidence (recovery model and its consistency with the claims)."),
    scope: obj("Plaintext and metadata scope evidence."),
    theater: obj("Theater and threat-model evidence (incl. the web-app paradox where applicable)."),
  },
  evaluateFn: evaluateZeroKnowledgeClaim,
  stampFn: stampZeroKnowledgeClaim
});

const zeroTrustEvaluationVerdict = manifestAtom({
  serviceName: "zero-trust-evaluation-verdict",
  namespace: "zero_trust_evaluation_verdict",
  displayName: "Zero trust evaluation verdict",
  description:
    "Submit a declared zero-trust evaluation pack (the claim and its scope, the authentication and server-trust gauntlet, identity and authenticator strength, privilege segmentation and verification, trust inventory, honest limits); get a deterministic CLAIM_SUSTAINED / CLAIM_NOT_SUSTAINED / INSUFFICIENT_EVIDENCE verdict across six sections, including computed Argon2id and minimum-secret-length checks against the skill's stated values, with per-check evidence. Declared evidence only; not a certification.",
  schemaDescription: "The zero-trust evaluation pack manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    system: str("System the evaluation covers."),
    evaluation: obj("Claim and scope evidence (claim stated, adversaries and out-of-scope named, not-a-certification acknowledged)."),
    gauntlet: obj("Authentication and server-trust gauntlet evidence."),
    identity: obj("Identity evidence (checked before access, proof method named)."),
    cryptography: obj("Cryptography evidence (password KDF, declared minimum secret length — computed against the skill's stated values)."),
    findings: arr("Declared privilege/segmentation and verification findings."),
    inventory: obj("Trust-inventory evidence (trusted components enumerated)."),
    limits: obj("Honest-limits evidence (compromised-endpoint and residual-trust statements)."),
  },
  evaluateFn: evaluateZeroTrustEvaluation,
  stampFn: stampZeroTrustEvaluation
});

const acpProtocolIntegrationReview = manifestAtom({
  serviceName: "acp-protocol-integration-review",
  namespace: "acp_protocol_integration_review",
  displayName: "ACP protocol integration review",
  description:
    "Submit an ACP integration manifest; get a deterministic INTEGRATION_SOUND / INTEGRATION_NOT_SOUND / INSUFFICIENT_EVIDENCE review across seven sections (disambiguation and scope, adapter architecture, protocol surface, lifecycle correctness, streaming discipline, security, honesty/tests/upgrade path), including a computed flavour-recognition check against the skill's ACP-client / ACP-comm vocabulary, with per-check evidence.",
  schemaDescription: "The ACP integration manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    implementation: str("ACP integration being reviewed."),
    protocol: obj("Flavour, disambiguation, spec-version and supported-subset evidence."),
    adapter: obj("Adapter-architecture evidence (thin, single core at the edge, no business logic in the wire layer)."),
    surface: obj("Protocol-surface evidence, gated on the declared flavour (client flow/permissions or comm endpoints/typed message parts)."),
    lifecycle: obj("Session/run lifecycle evidence (unknown, cancels, errors, reconnects, no state leak)."),
    streaming: obj("Streaming-discipline evidence (ordered, bounded chunks, backpressure, clear terminal states)."),
    security: obj("Security evidence (remote-endpoint auth, input validation, output caps, sandboxed tool execution)."),
    honesty: obj("Honesty evidence (unimplemented modes noted, unsupported features not faked)."),
    tests: obj("Contract-test evidence (scripted handshake, lifecycle happy/error/cancel, in CI per protocol)."),
    upgrade: obj("Upgrade-path evidence (official-SDK path documented, adapter tests kept for swaps)."),
  },
  evaluateFn: evaluateAcpIntegration,
  stampFn: stampAcpIntegration
});

const agentContextPackaging = manifestAtom({
  serviceName: "agent-context-packaging",
  namespace: "agent_context_packaging",
  displayName: "Agent context packaging",
  description:
    "Submit a declared agent context-pack manifest; get a deterministic PACK_SOUND / PACK_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections (scope declaration, redaction, structure and manifest, reproducibility and signing, handoff dossier, freshness and privacy) with per-check evidence.",
  schemaDescription: "The agent context-pack manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    pack: str("Context pack being audited."),
    scope: obj("Scope-declaration evidence."),
    redaction: obj("Redaction evidence (secrets/PII removed before packaging)."),
    manifest: obj("Pack-manifest evidence: {manifest_present, manifest_lists_contents_version_date_generator_and_source}."),
    structure: obj("Structure evidence."),
    reproducibility: obj("Reproducibility evidence."),
    signing: obj("Signing evidence."),
    handoff: obj("Handoff-dossier evidence (gated on handoff.is_handoff_dossier)."),
    freshness: obj("Freshness evidence (declared dates/review dates; presence only, never clock-compared)."),
    privacy: obj("Privacy evidence (lawful basis gated on declared third-party personal data)."),
  },
  evaluateFn: evaluateContextPackaging,
  stampFn: stampContextPackaging
});

const agentInteroperabilityDesign = manifestAtom({
  serviceName: "agent-interoperability-design",
  namespace: "agent_interoperability_design",
  displayName: "Agent interoperability design",
  description:
    "Submit a declared agent-interoperability design manifest; get a deterministic DESIGN_SOUND / DESIGN_UNSOUND / INSUFFICIENT_EVIDENCE verdict across eight sections (protocol selection, bridge architecture, gateway and remote access, handoff contracts, identity and credentials, versioning and discovery, audit and provenance, handshake testing and red lines) with per-check evidence.",
  schemaDescription: "The agent-interoperability design manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    design: str("Interoperability design being audited."),
    integrations: obj("Protocol-selection evidence (counterparty protocols and mappings)."),
    architecture: obj("Bridge-architecture evidence."),
    gateway: obj("Gateway and remote-access evidence."),
    handoff: obj("Handoff-contract evidence."),
    identity: obj("Identity and credentials evidence."),
    discovery: obj("Versioning and discovery evidence."),
    audit: obj("Audit and provenance evidence."),
    testing: obj("Handshake-testing evidence."),
    red_lines: obj("Red-line evidence (declared refusals and limits)."),
  },
  evaluateFn: evaluateInteroperabilityDesign,
  stampFn: stampInteroperabilityDesign
});

const agenticCodingPractice = manifestAtom({
  serviceName: "agentic-coding-practice",
  namespace: "agentic_coding_practice",
  displayName: "Agentic coding practice",
  description:
    "Submit an agentic-coding practice manifest; get a deterministic RELIABLE_PRACTICE / NOT_RELIABLE_PRACTICE / INSUFFICIENT_EVIDENCE verdict across six practice sections (spec and slicing, hooks and events, feedback loop, guardrails, context and tools, delegation and access) with per-check evidence.",
  schemaDescription: "The agentic-coding practice manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    practice: str("Agentic-coding practice / workflow being audited."),
    spec: obj("Spec and slicing evidence."),
    hooks: obj("Hook and event evidence."),
    feedback: obj("Feedback-loop evidence: tests/linters wired into hooks."),
    guardrails: obj("Guardrail evidence: {docker_used: bool (must be false), agent_run_unbounded: bool (must be false), ...}."),
    context: obj("Context-hygiene evidence: {whole_repo_dumped: bool (must be false), ...}."),
    tools: obj("MCP tool evidence: typed, narrowly-scoped."),
    delegation: obj("Sub-agent delegation and orchestration evidence."),
    access: obj("Write-access evidence: {broad_write_access: bool, guardrails_present: bool}."),
  },
  evaluateFn: evaluateAgenticCoding,
  stampFn: stampAgenticCoding
});

const algorithmDesignImplementation = manifestAtom({
  serviceName: "algorithm-design-implementation",
  namespace: "algorithm_design_implementation",
  displayName: "Algorithm design implementation",
  description:
    "Submit an algorithm design manifest (decomposition, complexity reasoning, data-structure and pattern declarations, correctness and edge-case record, verification and optimization record); get a deterministic DESIGN_SOUND / DESIGN_UNSOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed skill-mapping, pattern-toolbox and fatal-scale checks, with per-check evidence.",
  schemaDescription: "The algorithm design manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    problem: str("Problem the design addresses."),
    decomposition: obj("Decomposition evidence: inputs/outputs/constraints/invariant stated, pseudocode sketched, input scale and max_input_size."),
    complexity: obj("Complexity evidence: time/space Big-O stated, dominant term, bottleneck, trade-offs named, time_complexity string."),
    design: obj("Design declarations: key_operation, chosen_structure, pattern, plus greedy/DP/graph conditional-duty fields."),
    correctness: obj("Correctness evidence: invariant and termination reasoned, edge_cases (empty/single/duplicates/boundaries/overflow), edges and properties tested."),
    verification: obj("Verification evidence: correctness_critical gate and method."),
    optimization: obj("Optimization-order evidence: correctness established first, profiled before optimizing, optimized_before_measuring must be false."),
  },
  evaluateFn: evaluateAlgorithmDesign,
  stampFn: stampAlgorithmDesign
});

const appliedMlValidation = manifestAtom({
  serviceName: "applied-ml-validation",
  namespace: "applied_ml_validation",
  displayName: "Applied ml validation",
  description:
    "Submit a declared applied-ML validation manifest; get a deterministic VALIDATED / NOT_VALIDATED / INSUFFICIENT_EVIDENCE verdict across six sections (framing and baseline, data audit and leakage, model ladder, evaluation and honesty, robustness and limits, deployment monitoring and card) with per-check evidence.",
  schemaDescription: "The applied-ML validation manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    model: str("ML model / system being validated."),
    framing: obj("Framing evidence (problem, target, decision the model informs)."),
    baseline: obj("Baseline evidence (simple baseline beaten or named)."),
    data: obj("Data-audit and leakage evidence (split type, leakage checks)."),
    validation: obj("Validation-design evidence."),
    ladder: obj("Model-ladder evidence (rungs attempted in order)."),
    evaluation: obj("Evaluation and honesty evidence (metrics with declared directions)."),
    robustness: obj("Robustness and limits evidence."),
    deployment: obj("Deployment and monitoring evidence."),
    documentation: obj("Model-card / documentation evidence."),
  },
  evaluateFn: evaluateAppliedMlValidation,
  stampFn: stampAppliedMlValidation
});

const architectureDecisionRecord = manifestAtom({
  serviceName: "architecture-decision-record",
  namespace: "architecture_decision_record",
  displayName: "Architecture decision record",
  description:
    "Submit an architecture-decision evidence manifest (NFRs, boundaries and versioned contracts, declared alternatives with trade-offs, ADR format, reversibility and security, dependency and supersession record); get a deterministic ADR_COMPLETE / ADR_NOT_COMPLETE / INSUFFICIENT_EVIDENCE verdict across six sections, including computed alternatives-count (stated 2–3 range) and one-page-max checks, with per-check evidence.",
  schemaDescription: "The architecture-decision evidence manifest (see the atom's SERVICE.md for the field table and alternatives[] schema).",
  properties: {
    decision: str("Decision the ADR records (e.g. 0007-choice-of-database)."),
    nfrs: obj("Non-functional-requirements evidence (NFRs first)."),
    boundaries: obj("Boundary evidence."),
    contracts: obj("Versioned-contract evidence (contracts before code)."),
    options: obj("Options evidence, including alternatives[]: {name, serious, tradeoffs_stated}."),
    adr: obj("ADR format evidence, including page_count."),
    reversibility: obj("Reversibility evidence."),
    security: obj("Security-by-design evidence."),
    dependencies: obj("Dependency evidence (new-dependency reason gate)."),
    supersession: obj("Supersession evidence (replacement links for superseded ADRs)."),
  },
  evaluateFn: evaluateArchitectureDecision,
  stampFn: stampArchitectureDecision
});

const argumentAnalysisReview = manifestAtom({
  serviceName: "argument-analysis-review",
  namespace: "argument_analysis_review",
  displayName: "Argument analysis review",
  description:
    "Submits an argument-analysis evidence manifest (argument anatomy, evidence quality, calibration, stress test, fallacy and bias screening, razors, countercase) and returns a deterministic ARGUMENT_ANALYSIS_COMPLETE / ARGUMENT_ANALYSIS_DEFICIENT / INSUFFICIENT_EVIDENCE verdict across six sections, including computed fallacy-screen and bias-screen set-inclusion checks against the skill's named fallacies and biases and a confidence-range check, with per-check evidence.",
  schemaDescription: "The argument-analysis evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    argument: str("Argument under review."),
    anatomy: obj("Argument anatomy evidence (claim, premises, conclusion, assumptions)."),
    evidence: obj("Evidence-quality evidence."),
    calibration: obj("Calibration evidence, including confidence_percent."),
    stress_test: obj("Stress-test evidence."),
    screening: obj("Screening evidence, including the fallacy and bias screening lists."),
    razors: obj("Razors evidence."),
    countercase: obj("Countercase evidence."),
  },
  evaluateFn: evaluateArgumentAnalysisReview,
  stampFn: stampArgumentAnalysisReview
});

const audienceContractDesign = manifestAtom({
  serviceName: "audience-contract-design",
  namespace: "audience_contract_design",
  displayName: "Audience contract design",
  description:
    "Submits an audience-contract evidence manifest (user classes, single source of truth, progressive formality, failure behaviour, authority lattice, verification, identity) and returns a deterministic AUDIENCE_CONTRACT_COMPLETE / AUDIENCE_CONTRACT_INCOMPLETE / INSUFFICIENT_EVIDENCE verdict across six sections, including a computed classes-with-path count and authority-lattice checks gated on declared dangerous actions, with per-check evidence.",
  schemaDescription: "The audience-contract evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    artifact: str("Artifact the contract governs."),
    classes: obj("User-class evidence (humans, agents, hybrid systems, software)."),
    single_truth: obj("Single-source-of-truth evidence."),
    progressive_formality: obj("Progressive-formality evidence."),
    failure: obj("Failure-behaviour evidence."),
    authority: obj("Authority-lattice evidence."),
    verification: obj("Verification evidence."),
    identity: obj("Identity evidence."),
  },
  evaluateFn: evaluateAudienceContractDesign,
  stampFn: stampAudienceContractDesign
});

const authDesignReview = manifestAtom({
  serviceName: "auth-design-review",
  namespace: "auth_design_review",
  displayName: "Auth design review",
  description:
    "Submits an authentication and authorization design evidence manifest (human auth, sessions, OAuth, service tokens, authorization, lifecycle, anti-abuse, audit) and returns a deterministic AUTH_DESIGN_SOUND / AUTH_DESIGN_DEFICIENT / INSUFFICIENT_EVIDENCE verdict across seven sections, including password checks gated on passwords being used and OAuth checks gated on OAuth being used, with per-check evidence.",
  schemaDescription: "The auth-design evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    system: str("System under review."),
    human_auth: obj("Human authentication evidence (passkeys / MFA)."),
    sessions: obj("Session and token evidence."),
    oauth: obj("OAuth evidence (checks gated on oauth_used)."),
    service_tokens: obj("Service-token evidence."),
    authorization: obj("Authorization evidence (least privilege)."),
    lifecycle: obj("Lifecycle evidence."),
    anti_abuse: obj("Anti-abuse evidence."),
    audit: obj("Audit evidence."),
  },
  evaluateFn: evaluateAuthDesignReview,
  stampFn: stampAuthDesignReview
});

const backendEngineeringAdvice = manifestAtom({
  serviceName: "backend-engineering-advice",
  namespace: "backend_engineering_advice",
  displayName: "Backend engineering advice",
  description:
    "Submits a backend-engineering evidence manifest (API contract, boundary validation, idempotency, error taxonomy, jobs and queues, data safety, observability) and returns a deterministic PRODUCTION_READY / NOT_PRODUCTION_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed error-taxonomy coverage against the skill's five named categories and checks gated on declared mutating operations, migrations and async jobs, with per-check evidence.",
  schemaDescription: "The backend-engineering evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    system: str("Backend system under review."),
    contract: obj("API-contract evidence (contract first)."),
    validation: obj("Boundary-validation evidence."),
    idempotency: obj("Idempotency evidence, including mutating_operation_count."),
    errors: obj("Error-taxonomy evidence, including categories_covered."),
    jobs: obj("Jobs and queues evidence (gated on has_async_jobs)."),
    data: obj("Data-safety evidence, including migrations (gated on has_migrations)."),
    observability: obj("Observability evidence."),
  },
  evaluateFn: evaluateBackendEngineeringAdvice,
  stampFn: stampBackendEngineeringAdvice
});

const baseRateCard = manifestAtom({
  serviceName: "base-rate-card",
  namespace: "base_rate_card",
  displayName: "Base-rate card",
  description:
    "Submits a base-rate card manifest (claim and evidence, declared reference class with counts and stated rate, steelman, fallacy spot-check, calibration, second-order judgment) and returns a deterministic CARD_COMPLETE / CARD_NOT_COMPLETE / INSUFFICIENT_EVIDENCE verdict across six sections, including a computed base-rate consistency check (stated rate re-derived from successes over class size) and a fallacy-coverage check against the skill's named fallacies, with per-check evidence. Checks the card's internal consistency; it does not source reference-class data.",
  schemaDescription: "The base-rate card manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    claim: str("Claim the card evaluates."),
    evidence: obj("Evidence-hierarchy evidence."),
    base_rate: obj("Base-rate evidence (reference class size, successes, stated rate)."),
    steelman: obj("Steelman evidence."),
    fallacies: obj("Fallacy spot-check evidence, including the checked list."),
    calibration: obj("Calibration evidence, including confidence_value."),
    judgment: obj("Second-order and judgment evidence."),
  },
  evaluateFn: evaluateBaseRateCard,
  stampFn: stampBaseRateCard
});

const behavioralFinanceBiasCheck = manifestAtom({
  serviceName: "behavioral-finance-bias-check",
  namespace: "behavioral_finance_bias_check",
  displayName: "Behavioral finance bias check",
  description:
    "Submits a behavioural-finance bias-check manifest (decision context, bias playbook with considered biases, precommitment, cooling-off, decision journal, watch-and-challenge, temptation and red lines) and returns a deterministic BIAS_CHECK_CLEAR / BIAS_CHECK_FAILED / INSUFFICIENT_EVIDENCE verdict across six sections, including computed cooling-off (48 hours for entry decisions) and position-size versus caller-declared cap checks, with per-check evidence.",
  schemaDescription: "The behavioural-finance bias-check manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    decision: str("Decision under check."),
    decision_context: obj("Decision-context gates (is_entry, is_major_move)."),
    bias_playbook: obj("Bias-playbook evidence, including biases_considered entries."),
    precommitment: obj("Precommitment evidence (written rules, stop levels, thesis)."),
    cooling_off: obj("Cooling-off evidence, including hours_elapsed."),
    journal: obj("Decision-journal evidence."),
    watch_and_challenge: obj("Watch-and-challenge evidence."),
    temptation_and_red_lines: obj("Temptation and red-lines evidence."),
  },
  evaluateFn: evaluateBehavioralFinanceBiasCheck,
  stampFn: stampBehavioralFinanceBiasCheck
});

const behavioralFinanceDebiasing = manifestAtom({
  serviceName: "behavioral-finance-debiasing",
  namespace: "behavioral_finance_debiasing",
  displayName: "Behavioral finance debiasing",
  description:
    "Submits a behavioural-finance debiasing manifest (bias screening against the skill's catalogue, found bias patterns, prospect-theory reframing, precommitment with rebalancing band, journal and checklists, whole-portfolio view, guardrails) and returns a deterministic DEBIASED / NOT_DEBIASED / INSUFFICIENT_EVIDENCE verdict across six sections, including a computed rebalancing-drift versus caller-declared band check and a report-only position-share figure, with per-check evidence.",
  schemaDescription: "The behavioural-finance debiasing manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    decision: str("Decision under debiasing."),
    context: obj("Context gates (is_big_trade)."),
    bias_screening: obj("Bias-screening evidence (one field per catalogued bias)."),
    bias_patterns: obj("Found-pattern evidence, including found entries."),
    prospect_theory: obj("Prospect-theory reframing evidence."),
    precommitment: obj("Precommitment evidence, including rebalancing target/current/band."),
    journal_and_checklists: obj("Journal and checklist evidence."),
    whole_portfolio: obj("Whole-portfolio evidence, including position and portfolio values."),
    guardrails: obj("Guardrails and anti-pattern evidence."),
  },
  evaluateFn: evaluateBehavioralFinanceDebiasing,
  stampFn: stampBehavioralFinanceDebiasing
});


const biasControlledQuantStudyPack = manifestAtom({
  serviceName: "bias-controlled-quant-study-pack",
  namespace: "bias_controlled_quant_study_pack",
  displayName: "Bias-controlled quant study pack",
  description:
    "Submits a quant study-pack manifest (preregistered hypothesis, data hygiene, distribution and stationarity evidence, multiple-testing discipline, cost coverage, reproducibility) and returns a deterministic STUDY_PACK_COMPLETE / STUDY_PACK_NOT_COMPLETE / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed cost-coverage, stability-across-periods and reported-vs-tested coherence checks, with per-check evidence. Audits the declared study pack; it does not run the study.",
  schemaDescription: "The quant study-pack manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    study: str("Study the pack covers."),
    hypothesis: obj("Hypothesis preregistration evidence."),
    data: obj("Data-hygiene evidence."),
    distribution: obj("Distribution-reality evidence."),
    stationarity: obj("Stationarity and stability evidence."),
    multiple_testing: obj("Multiple-testing discipline evidence."),
    costs: obj("Cost-coverage evidence, including the included list."),
    reproducibility: obj("Reproducibility evidence.")
  },
  evaluateFn: evaluateBiasControlledQuantStudyPack,
  stampFn: stampBiasControlledQuantStudyPack
});

const brandMentionMonitoringTriageDigest = manifestAtom({
  serviceName: "brand-mention-monitoring-triage-digest",
  namespace: "brand_mention_monitoring_triage_digest",
  displayName: "Brand-mention monitoring triage digest",
  description:
    "Submits a brand-mention monitoring manifest (inventory and coverage, triage rubric, response policy, alert hygiene, counts, digest reporting, conduct) and returns a deterministic TRIAGE_DIGEST_READY / TRIAGE_DIGEST_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed triage-dimension and triage-route coverage and evidence-for-every-action checks, with per-check evidence. Audits the declared monitoring record; it does not listen to live feeds.",
  schemaDescription: "The brand-mention monitoring manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    brand: str("Brand being monitored."),
    inventory: obj("Mention-inventory evidence."),
    coverage: obj("Monitoring-coverage evidence."),
    triage: obj("Triage-rubric evidence, including dimensions and routes."),
    response: obj("Response-policy evidence."),
    alerts: obj("Alert-hygiene evidence."),
    evidence: obj("Action-evidence evidence."),
    counts: obj("Declared mention and action counts."),
    digest: obj("Digest-reporting evidence."),
    conduct: obj("Conduct and red-line evidence.")
  },
  evaluateFn: evaluateBrandMentionMonitoringTriageDigest,
  stampFn: stampBrandMentionMonitoringTriageDigest
});

const browserExtensionEngineering = manifestAtom({
  serviceName: "browser-extension-engineering",
  namespace: "browser_extension_engineering",
  displayName: "Browser extension engineering",
  description:
    "Submits a browser-extension design manifest (MV3 architecture, permissions, messaging, UX honesty, privacy, distribution, security) and returns a deterministic EXTENSION_DESIGN_SOUND / EXTENSION_DESIGN_DEFICIENT / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed permission-justification and cross-browser coverage checks, with per-check evidence. Audits the declared design; it does not build the extension.",
  schemaDescription: "The browser-extension design manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    extension_name: str("Extension under review."),
    mv3: obj("MV3 architecture evidence."),
    permissions: obj("Permissions evidence, including requested and justified lists."),
    architecture: obj("Architecture and messaging evidence."),
    ux: obj("UX-honesty evidence."),
    privacy: obj("Privacy evidence."),
    distribution: obj("Distribution and cross-browser evidence, including target and tested lists."),
    security: obj("Security evidence.")
  },
  evaluateFn: evaluateBrowserExtensionEngineering,
  stampFn: stampBrowserExtensionEngineering
});

const budgetDesignReview = manifestAtom({
  serviceName: "budget-design-review",
  namespace: "budget_design_review",
  displayName: "Budget design review",
  description:
    "Submits a budget-design manifest (scope, lines with owners and drivers, totals, revenue link, contingency, approval baseline, monitoring, close) and returns a deterministic BUDGET_DESIGN_SOUND / BUDGET_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed line-amount, declared-total, balance-against-income and horizon checks, with per-check evidence. Reviews the declared design; it does not author a budget.",
  schemaDescription: "The budget-design manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    budget: str("Budget under review."),
    scope: obj("Scope and budget-type evidence."),
    lines: arr("Declared budget lines: {owner, approach, driver_quantity, driver_unit_cost, amount}."),
    totals: obj("Declared-totals evidence."),
    revenue: obj("Revenue-link evidence."),
    contingency: obj("Contingency evidence."),
    approval: obj("Approval and baseline evidence."),
    monitoring: obj("Monitoring evidence."),
    close: obj("Close-out evidence.")
  },
  evaluateFn: evaluateBudgetDesignReview,
  stampFn: stampBudgetDesignReview
});

const buyerTestCard = manifestAtom({
  serviceName: "buyer-test-card",
  namespace: "buyer_test_card",
  displayName: "Buyer-test card",
  description:
    "Submits a buyer-test / POC record manifest (hypothesis, criteria set upfront, timebox and scope, disposition and production boundary, evidence, decision and findings) and returns a deterministic CARD_COMPLETE / CARD_NOT_COMPLETE / INSUFFICIENT_EVIDENCE verdict across six sections, including computed timebox and decision/disposition vocabulary checks, with per-check evidence. Validates the declared record; it does not run the POC.",
  schemaDescription: "The buyer-test-card manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    idea: str("Idea under test (carried into the verdict output)."),
    decision: str("Declared decision (adopt / adapt / abandon; computed)."),
    disposition: str("Declared disposition (disposable / slated_for_hardening; computed)."),
    hypothesis: obj("Hypothesis evidence."),
    criteria: obj("Criteria-upfront evidence."),
    timebox: obj("Timebox evidence, including limit and elapsed days."),
    evidence: obj("Evidence-record evidence."),
    production_boundary: obj("Production-boundary evidence."),
    findings: obj("Findings evidence.")
  },
  evaluateFn: evaluateBuyerTestCard,
  stampFn: stampBuyerTestCard
});

const cEngineeringReview = manifestAtom({
  serviceName: "c-engineering-review",
  namespace: "c_engineering_review",
  displayName: "C engineering review",
  description:
    "Submits a C-engineering evidence manifest (memory discipline, undefined behavior, warnings and build, bounds and strings, sanitizers and static analysis, portability, build and test) and returns a deterministic REVIEW_SOUND / REVIEW_DEFICIENT / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed zero-warnings and no-banned-functions checks, with per-check evidence. Reviews declared records; it does not compile or review live code.",
  schemaDescription: "The C-engineering evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    subject: str("Subject under review."),
    memory: obj("Memory-discipline evidence."),
    undefined_behavior: obj("Undefined-behavior evidence."),
    warnings: obj("Warnings evidence, including warning_count."),
    bounds: obj("Bounds and strings evidence, including banned_calls."),
    sanitizers: obj("Sanitizers and static-analysis evidence."),
    portability: obj("Portability evidence."),
    build_and_test: obj("Build and test evidence.")
  },
  evaluateFn: evaluateCEngineeringReview,
  stampFn: stampCEngineeringReview
});

const cashFlowForecast = manifestAtom({
  serviceName: "cash-flow-forecast",
  namespace: "cash_flow_forecast",
  displayName: "Cash-flow forecast",
  description:
    "Submits a declared cash-flow forecast artifact (flows and lags, thirteen-week forecast, reserves and runway, working capital and levers, stress tests, reporting and commitments) and returns a deterministic CASH_FLOW_FORECAST_READY / CASH_FLOW_FORECAST_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed weekly-balance, reserve-target and runway re-derivations and stress-case coverage, with per-check evidence. Validates the declared forecast; it produces none.",
  schemaDescription: "The cash-flow forecast artifact manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Entity the forecast covers."),
    flows: obj("Flows and lags evidence."),
    forecast: obj("Thirteen-week forecast evidence, including weekly entries."),
    reserves: obj("Reserves evidence."),
    working_capital: obj("Working-capital evidence."),
    levers: obj("Levers evidence."),
    runway: obj("Runway evidence."),
    stress: obj("Stress-test evidence."),
    reporting: obj("Reporting evidence."),
    commitments: obj("Commitments evidence.")
  },
  evaluateFn: evaluateCashFlowForecast,
  stampFn: stampCashFlowForecast
});

const cicdPipelineDesign = manifestAtom({
  serviceName: "cicd-pipeline-design",
  namespace: "cicd_pipeline_design",
  displayName: "Cicd pipeline design",
  description:
    "Submits a CI/CD pipeline design manifest (declared stage list with per-stage minutes and a declared total, determinism and pinning record, caching and secrets record, minutes budget record, provenance record, deploy and gate record) and returns a deterministic CICD_PIPELINE_READY / CICD_PIPELINE_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed stage-order, stage-minutes-sum and monthly-minutes-vs-declared-budget checks, with per-check evidence. Validates the declared artifact; it does not design a pipeline.",
  schemaDescription: "The CI/CD pipeline design manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Pipeline / project the design covers."),
    pipeline: obj("Declared stage list, per-stage minutes and declared-total evidence."),
    determinism: obj("Determinism and pinning evidence."),
    caching: obj("Caching evidence."),
    secrets: obj("Secrets-handling evidence."),
    budget: obj("Minutes-budget evidence."),
    provenance: obj("Artifact provenance and signing evidence."),
    deploys: obj("Deploy evidence."),
    gates: obj("Release-gate evidence.")
  },
  evaluateFn: evaluateCicdPipelineDesign,
  stampFn: stampCicdPipelineDesign
});

const claimEvaluationReview = manifestAtom({
  serviceName: "claim-evaluation-review",
  namespace: "claim_evaluation_review",
  displayName: "Claim evaluation review",
  description:
    "Submits a claim-evaluation manifest (declared claim set, evidence-hierarchy and conflict record, base-rate and reference-class record, steelman and fallacy-screen record, calibration record, second-order and judgment record) and returns a deterministic CLAIM_EVALUATION_COMPLETE / CLAIM_EVALUATION_NOT_COMPLETE / INSUFFICIENT_EVIDENCE review across six sections, including computed claim-entry completeness, fallacy-coverage and hit-rate re-derivation checks, with per-check evidence. Validates the declared artifact; it does not evaluate the claims itself.",
  schemaDescription: "The claim-evaluation manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Subject the claim evaluation covers."),
    claims: arr("Declared claim entries: restated claim, evidence sought both ways, presence assessed."),
    hierarchy: obj("Evidence-hierarchy and conflict-handling evidence."),
    base_rates: obj("Base-rate / reference-class evidence."),
    steelman: obj("Steelman evidence."),
    fallacy_screen: obj("Fallacy-screen evidence (declared fallacies checked)."),
    calibration: obj("Calibration evidence (confidence and declared outcomes)."),
    second_order: obj("Second-order effects evidence."),
    judgment: obj("Judgment-record evidence.")
  },
  evaluateFn: evaluateClaimEvaluationReview,
  stampFn: stampClaimEvaluationReview
});

const codeReviewService = manifestAtom({
  serviceName: "code-review-service",
  namespace: "code_review_service",
  displayName: "Code review service",
  description:
    "Submits a declared code-review record manifest (PR size and description, review-checklist coverage, declared comment counts and labels, response and resolution record, approval-gate record, red-line and merge record) and returns a deterministic CODE_REVIEW_READY / CODE_REVIEW_NOT_READY / INSUFFICIENT_EVIDENCE review across six sections, including computed PR-size-vs-stated-aim, checklist-coverage, labeled and answered comment and unresolved-at-approval checks, with per-check evidence. Validates the declared record; it does not read or review code.",
  schemaDescription: "The code-review record manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Team / repository the review record covers."),
    pr: obj("PR size and description evidence."),
    checklist: obj("Review-checklist coverage evidence."),
    feedback: obj("Comment labeling and feedback evidence."),
    resolution: obj("Response and resolution evidence."),
    gates: obj("Approval-gate evidence."),
    red_lines: obj("Red-line evidence."),
    merge: obj("Merge-discipline evidence.")
  },
  evaluateFn: evaluateCodeReviewService,
  stampFn: stampCodeReviewService
});

const codebaseVisualization = manifestAtom({
  serviceName: "codebase-visualization",
  namespace: "codebase_visualization",
  displayName: "Codebase visualization",
  description:
    "Submits a codebase-visualization artifact manifest (declared diagram entries, dependency view and module counts, call and flow views, architecture map and declared C4 levels, metrics and history views, honesty and currency record) and returns a deterministic CODEBASE_VISUALIZATION_READY / CODEBASE_VISUALIZATION_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed diagram-entry completeness, dependency-coverage, C4-coverage and hotspot-score checks, with per-check evidence. Validates the declared record; it renders nothing and reads no code.",
  schemaDescription: "The codebase-visualization artifact manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Codebase the visualization record covers."),
    diagrams_as_code: obj("Diagrams-as-code evidence (declared diagram entries)."),
    dependency: obj("Dependency-view and module-count evidence."),
    call_and_flow: obj("Call and flow view evidence."),
    architecture: obj("Architecture-map and C4-level evidence."),
    metrics: obj("Metrics-view evidence."),
    history: obj("History-view evidence."),
    honesty: obj("Honesty and currency evidence.")
  },
  evaluateFn: evaluateCodebaseVisualization,
  stampFn: stampCodebaseVisualization
});

const communitySupportOperations = manifestAtom({
  serviceName: "community-support-operations",
  namespace: "community_support_operations",
  displayName: "Community support operations",
  description:
    "Submits a community-support operations manifest (intake channels and SLA record, help-doc and top-theme record, triage loop, response-craft and red-line record, release and incident comms, community norms, measurement record) and returns a deterministic COMMUNITY_SUPPORT_READY / COMMUNITY_SUPPORT_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed SLA severity-order, tracked-message, top-theme coverage and thread-closure checks, with per-check evidence. Validates the declared artifact; it does not run a support desk.",
  schemaDescription: "The community-support operations manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Product / community the operations record covers."),
    intake: obj("Intake channels and SLA evidence."),
    help_docs: obj("Help-doc and deflection evidence."),
    triage: obj("Triage-loop evidence (categories used, message counts)."),
    response: obj("Response-craft and red-line evidence."),
    comms: obj("Release and incident comms evidence."),
    community: obj("Community-norms evidence."),
    measurement: obj("Measurement evidence.")
  },
  evaluateFn: evaluateCommunitySupportOperations,
  stampFn: stampCommunitySupportOperations
});

const confidentialComputingDesign = manifestAtom({
  serviceName: "confidential-computing-design",
  namespace: "confidential_computing_design",
  displayName: "Confidential computing design",
  description:
    "Submits a confidential-computing design manifest (threat model, TEE technology selection, attestation record, enclave patterns and trusted-codebase accounting, engineering discipline, key-management record, claims record) and returns a deterministic CONFIDENTIAL_COMPUTING_DESIGN_READY / CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed threat-coverage, trusted-component completeness and trusted-codebase-total checks, with per-check evidence. Validates the declared design record; it does not design the system.",
  schemaDescription: "The confidential-computing design manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("System the design record covers."),
    threat_model: obj("Threat-model evidence (protects-against and does-not-protect lists)."),
    technology: obj("TEE technology-selection evidence."),
    attestation: obj("Attestation evidence."),
    enclave: obj("Enclave-pattern and trusted-component evidence."),
    engineering: obj("Engineering-discipline evidence."),
    keys: obj("Key-management evidence."),
    claims: obj("Claims-discipline evidence.")
  },
  evaluateFn: evaluateConfidentialComputingDesign,
  stampFn: stampConfidentialComputingDesign
});

const costEstimatePreparation = manifestAtom({
  serviceName: "cost-estimate-preparation",
  namespace: "cost_estimate_preparation",
  displayName: "Cost estimate preparation",
  description:
    "Submits a cost-estimate manifest (basis and class, element line items, three-point uncertainty items, declared totals chain, should-cost and vendor-quote record, estimate-vs-actual feedback record) and returns a deterministic COST_ESTIMATE_READY / COST_ESTIMATE_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed line-amount, subtotal, contingency, escalation, grand-total and should-cost-variance re-derivations, with per-check evidence. Validates the declared estimate; it produces no estimate.",
  schemaDescription: "The cost-estimate manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Project / scope the estimate covers."),
    basis: obj("Basis and estimate-class evidence."),
    elements: obj("Estimate-elements evidence."),
    line_items: arr("Declared line items: {quantity, unit_rate, amount}."),
    uncertainty: obj("Three-point uncertainty evidence (items with optimistic / likely / pessimistic)."),
    totals: obj("Declared totals-chain evidence (subtotal, contingency, escalation, grand total)."),
    should_cost: obj("Should-cost / vendor-quote evidence."),
    feedback: obj("Estimate-vs-actual feedback evidence.")
  },
  evaluateFn: evaluateCostEstimatePreparation,
  stampFn: stampCostEstimatePreparation
});

const cppEngineeringReview = manifestAtom({
  serviceName: "cpp-engineering-review",
  namespace: "cpp_engineering_review",
  displayName: "Cpp engineering review",
  description:
    "Submits a C++ engineering evidence manifest (RAII and ownership, value semantics, smart pointers, STL and templates, exceptions and ABI, tooling and warnings, sanitizers, safety red lines) and returns a deterministic REVIEW_SOUND / REVIEW_DEFICIENT / INSUFFICIENT_EVIDENCE verdict across eight sections, including computed zero-warnings and no-forbidden-constructs checks, with per-check evidence. Reviews declared records; it does not compile or review live code.",
  schemaDescription: "The C++ engineering evidence manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    subject: str("Codebase / component under review."),
    raii: obj("RAII and ownership evidence."),
    value_semantics: obj("Value-semantics evidence."),
    smart_pointers: obj("Smart-pointer evidence."),
    stl: obj("STL and templates evidence."),
    exceptions_and_abi: obj("Exceptions and ABI evidence."),
    tooling: obj("Tooling and warnings evidence."),
    sanitizers: obj("Sanitizer evidence."),
    safety: obj("Safety red-line evidence.")
  },
  evaluateFn: evaluateCppEngineeringReview,
  stampFn: stampCppEngineeringReview
});

const creativeIdeationSession = manifestAtom({
  serviceName: "creative-ideation-session",
  namespace: "creative_ideation_session",
  displayName: "Creative ideation session",
  description:
    "Submits a creative-ideation session record (brief and preparation, capture and generation, divergence methods, idea pool, selection criteria, shortlist and outcome) and returns a deterministic SESSION_COMPLETE / SESSION_NOT_COMPLETE / INSUFFICIENT_EVIDENCE verdict across six sections, including computed volume-vs-target, dedup-arithmetic, shortlist-within-pool and method-vocabulary checks, with per-check evidence. Audits the declared session record; it generates no ideas and judges none.",
  schemaDescription: "The ideation-session record manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    session_title: str("Session title."),
    brief: obj("Brief evidence."),
    preparation: obj("Preparation evidence."),
    capture: obj("Capture evidence."),
    generation: obj("Generation evidence."),
    divergence: obj("Divergence-methods evidence."),
    idea_pool: obj("Idea-pool evidence (declared counts)."),
    selection: obj("Selection-criteria evidence."),
    shortlist: obj("Shortlist evidence."),
    outcome: obj("Outcome and ship evidence.")
  },
  evaluateFn: evaluateCreativeIdeationSession,
  stampFn: stampCreativeIdeationSession
});

const crmPipelineOperations = manifestAtom({
  serviceName: "crm-pipeline-operations",
  namespace: "crm_pipeline_operations",
  displayName: "Crm pipeline operations",
  description:
    "Submits a CRM pipeline operations manifest (single source of truth, contact rules and privacy, declared pipeline stages and deal rows, follow-up cadence, reporting, consent, win/loss discipline, minimal data) and returns a deterministic CRM_PIPELINE_READY / CRM_PIPELINE_NOT_READY / INSUFFICIENT_EVIDENCE verdict across eight sections, including computed stage-coverage, deal-completeness, next-step and caller-declared-staleness checks, with per-check evidence. Checks declared evidence; it operates no CRM and moves no deals.",
  schemaDescription: "The CRM pipeline operations manifest (see the atom's SERVICE.md for the field table and deal-row schema).",
  properties: {
    entity: str("Organisation / pipeline the record covers."),
    source: obj("Single-source-of-truth evidence."),
    contact_rules: obj("Contact-rules and privacy evidence."),
    pipeline: obj("Pipeline stages and declared deal rows."),
    follow_up: obj("Follow-up cadence and logging evidence."),
    reporting: obj("Reporting and forecast evidence."),
    consent: obj("Consent and communications evidence."),
    win_loss: obj("Win/loss discipline evidence."),
    minimal_data: obj("Minimal-data and retention evidence.")
  },
  evaluateFn: evaluateCrmPipelineOperations,
  stampFn: stampCrmPipelineOperations
});

const dataAnalysisDeliverable = manifestAtom({
  serviceName: "data-analysis-deliverable",
  namespace: "data_analysis_deliverable",
  displayName: "Data analysis deliverable",
  description:
    "Submits a data-analysis deliverable record (question framing, data provenance, declared figures with re-derivation inputs, statistical care, insight and action, reporting and reproducibility) and returns a deterministic DELIVERABLE_COMPLETE / DELIVERABLE_NOT_COMPLETE / INSUFFICIENT_EVIDENCE verdict across six sections, including computed re-derivation of the stated total, mean and percent change from declared values, with per-check evidence. Audits the declared record; it runs no analysis and certifies no conclusions.",
  schemaDescription: "The analysis-deliverable record manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    question: str("Analysis question."),
    framing: obj("Question-framing evidence."),
    data: obj("Data sources and provenance evidence."),
    analysis: obj("Descriptive and diagnostic analysis evidence."),
    figures: obj("Declared figures with re-derivation inputs."),
    inference: obj("Statistical-care and inference evidence."),
    recommendation: obj("Insight and action evidence."),
    report: obj("Reporting evidence."),
    closure: obj("Reproducibility and close-the-loop evidence.")
  },
  evaluateFn: evaluateDataAnalysisDeliverable,
  stampFn: stampDataAnalysisDeliverable
});

const dataMlPipelineEngineering = manifestAtom({
  serviceName: "data-ml-pipeline-engineering",
  namespace: "data_ml_pipeline_engineering",
  displayName: "Data ml pipeline engineering",
  description:
    "Submits a data/ML pipeline design record (sources and contracts, ingestion, quality gates, lineage and reproducibility, ML hygiene and splits, lifecycle and serving, monitoring and drift) and returns a deterministic DATA_ML_PIPELINE_READY / DATA_ML_PIPELINE_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed total-rows, split-total, and latency/cost-vs-declared-budget checks, with per-check evidence. Checks the declared design record; it builds no pipeline and trains no model.",
  schemaDescription: "The data/ML pipeline design manifest (see the atom's SERVICE.md for the field table).",
  properties: {
    entity: str("Pipeline / system the design covers."),
    sources: obj("Declared sources and per-dataset rows."),
    pipeline: obj("Ingestion and orchestration evidence."),
    quality: obj("Quality-gate evidence."),
    lineage: obj("Lineage and reproducibility evidence."),
    training: obj("Training-pipeline evidence."),
    features: obj("Feature-handling evidence."),
    splits: obj("Train/eval/test split declarations."),
    privacy: obj("Privacy and PII evidence."),
    lifecycle: obj("Lifecycle evidence."),
    serving: obj("Serving evidence."),
    monitoring: obj("Monitoring and drift evidence.")
  },
  evaluateFn: evaluateDataMlPipelineEngineering,
  stampFn: stampDataMlPipelineEngineering
});

const dataVisualizationDesign = manifestAtom({
  serviceName: "data-visualization-design",
  namespace: "data_visualization_design",
  displayName: "Data visualization design",
  description:
    "Submits a data-visualization design record (brief, declared chart rows with encodings and axis declarations, honesty, perception, color, annotation, accessibility, dashboard and reproducibility declarations) and returns a deterministic DATA_VISUALIZATION_DESIGN_SOUND / DATA_VISUALIZATION_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed chart-type-vs-question, bar-axis-starts-at-zero, no-dual-axis and category-count checks, with per-check evidence. Checks declared evidence; it renders no chart and judges no aesthetics.",
  schemaDescription: "The visualization design manifest (see the atom's SERVICE.md for the field table and chart-row schema).",
  properties: {
    entity: str("Artifact / dashboard the design covers."),
    brief: obj("Audience and question brief evidence."),
    charts: arr("Declared chart rows: {question_type, chart_type, axis labels/unit, y_axis_start, categories_count, honesty flags}."),
    honesty: obj("Honesty and axes evidence."),
    perception: obj("Perception and chart-junk evidence."),
    color: obj("Color evidence."),
    annotation: obj("Annotation and labels evidence."),
    accessibility: obj("Accessibility evidence."),
    dashboard: obj("Dashboard evidence."),
    reproducibility: obj("Reproducibility evidence.")
  },
  evaluateFn: evaluateDataVisualizationDesign,
  stampFn: stampDataVisualizationDesign
});

const databaseDesignReview = manifestAtom({
  serviceName: "database-design-review",
  namespace: "database_design_review",
  displayName: "Database design review",
  description:
    "Submits a database design record (store selection, declared table rows with keys and constraints, normalization, declared query patterns and indexes, integrity, transactions and security, migrations and backups) and returns a deterministic DATABASE_DESIGN_SOUND / DATABASE_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across four sections, including computed primary-key, constraint-declaration and query-pattern-index-coverage checks, with per-check evidence. Reviews the declared record; it designs no schema and runs no database.",
  schemaDescription: "The database design manifest (see the atom's SERVICE.md for the field table and table/query-pattern/index row schemas).",
  properties: {
    design: str("Design / system under review."),
    store_selection: obj("Store-selection evidence."),
    tables: arr("Declared table rows: {name, primary_key, constraints}."),
    normalization: obj("Normalization evidence."),
    query_patterns: arr("Declared query patterns: {name, table, supporting_index}."),
    indexes: arr("Declared indexes: {name, table, columns}."),
    indexing: obj("Indexing-posture evidence."),
    performance: obj("Performance evidence."),
    integrity: obj("Integrity evidence."),
    transactions: obj("Transaction evidence."),
    security: obj("Security evidence."),
    migrations: obj("Migration evidence."),
    backups: obj("Backup and restore evidence.")
  },
  evaluateFn: evaluateDatabaseDesignReview,
  stampFn: stampDatabaseDesignReview
});

const decisionProcessDesign = manifestAtom({
  serviceName: "decision-process-design",
  namespace: "decision_process_design",
  displayName: "Decision process design",
  description:
    "Submits a decision-process record (framing and roles, declared options and criteria, precommitment, loss costs, rigor, evidence discipline, review) and returns a deterministic DECISION_PROCESS_SOUND / DECISION_PROCESS_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across four sections, including computed option and criteria coverage and loss-cost checks, with per-check evidence. Audits the declared record; it makes no decision.",
  schemaDescription: "The decision-process manifest (see the atom's SERVICE.md for the field table and option/criterion row schemas).",
  properties: {
    decision: str("Decision being designed."),
    framing: obj("Framing and roles evidence."),
    options: arr("Declared options: {name, viable}."),
    criteria: arr("Declared criteria: {name, set_before_data, threshold_declared}."),
    precommitment: obj("Precommitment-before-data evidence."),
    loss: obj("Loss-function and stakes evidence."),
    rigor: obj("Rigor-sizing evidence."),
    evidence: obj("Evidence-discipline evidence."),
    review: obj("Review evidence.")
  },
  evaluateFn: evaluateDecisionProcessDesign,
  stampFn: stampDecisionProcessDesign
});

const decisionReadyResearchBrief = manifestAtom({
  serviceName: "decision-ready-research-brief",
  namespace: "decision_ready_research_brief",
  displayName: "Decision ready research brief",
  description:
    "Submits a research-brief record (scope and questions, source strategy, declared sources, evidence notes, claims, synthesis, report structure, reuse and disclosure) and returns a deterministic RESEARCH_BRIEF_DECISION_READY / RESEARCH_BRIEF_NOT_DECISION_READY / INSUFFICIENT_EVIDENCE verdict across four sections, including computed source-provenance, claim-sourcing and triangulation-coverage checks, with per-check evidence. Audits the declared record; it performs no research and fetches nothing.",
  schemaDescription: "The research-brief manifest (see the atom's SERVICE.md for the field table and question/source/claim row schemas).",
  properties: {
    brief: str("Brief / research effort being audited."),
    scope: obj("Scoping evidence."),
    questions: arr("Declared research questions: {name}."),
    source_strategy: obj("Source-strategy evidence."),
    sources: arr("Declared sources: {name, link, date, quote, source_type, incentives_noted}."),
    evidence: obj("Evidence and notes evidence."),
    claims: arr("Declared claims: {name, kind, material, important, supporting_source_names, confidence_stated}."),
    synthesis: obj("Synthesis evidence."),
    report: obj("Report-structure evidence."),
    report_sections: arr("Declared report section names, in order."),
    reuse: obj("Reuse and verification evidence."),
    tooling: obj("Tooling evidence."),
    disclosure: obj("Disclosure and red-lines evidence.")
  },
  evaluateFn: evaluateDecisionReadyResearchBrief,
  stampFn: stampDecisionReadyResearchBrief
});

const deliveryPlanPreparation = manifestAtom({
  serviceName: "delivery-plan-preparation",
  namespace: "delivery_plan_preparation",
  displayName: "Delivery plan preparation",
  description:
    "Submits a delivery-plan manifest (framing and approval, declared phases, milestones, estimation, risks, decisions, execution discipline, status) and returns a deterministic DELIVERY_PLAN_READY / DELIVERY_PLAN_NOT_READY / INSUFFICIENT_EVIDENCE verdict across four sections, including computed schedule-arithmetic, dependency-resolution and coverage checks, with per-check evidence. Audits the declared plan; it writes no plan.",
  schemaDescription: "The delivery-plan manifest (see the atom's SERVICE.md for the field table and phase/milestone/risk/decision row schemas).",
  properties: {
    plan: str("Plan being prepared / audited."),
    framing: obj("Framing and approval evidence."),
    phases: arr("Declared phases: {name, owner, exit_criteria_declared, start_date, end_date, depends_on, size, assumptions_declared}."),
    milestones: arr("Declared milestones: {name, phase, owner, due_date}."),
    estimation: obj("Estimation evidence."),
    risks: arr("Declared risks: {name, mitigation_declared, trigger_declared}."),
    risk_management: obj("Risk-management evidence."),
    decisions: arr("Declared decision-log entries: {date, decision, rationale_declared, alternatives_declared}."),
    decision_log: obj("Decision-log evidence."),
    execution: obj("Execution-discipline evidence."),
    status: obj("Status-reporting evidence.")
  },
  evaluateFn: evaluateDeliveryPlanPreparation,
  stampFn: stampDeliveryPlanPreparation
});

const designedTestCasePack = manifestAtom({
  serviceName: "designed-test-case-pack",
  namespace: "designed_test_case_pack",
  displayName: "Designed test case pack",
  description:
    "Submits a test-case-pack manifest (declared requirements and cases, technique application, negative and error guessing, risk selection, coverage) and returns a deterministic TEST_CASE_PACK_SOUND / TEST_CASE_PACK_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across four sections, including computed traceability, expected-result coverage and duplicate-id checks, with per-check evidence. Audits the declared pack; it writes no test cases.",
  schemaDescription: "The test-case-pack manifest (see the atom's SERVICE.md for the field table and requirement/case row schemas).",
  properties: {
    pack: str("Test-case pack being audited."),
    requirements: arr("Declared requirements: {id}."),
    cases: arr("Declared test cases: {id, requirement_ids, level, preconditions_declared, steps_declared, expected_result, expected_result_written_before_execution, covers_boundary, covers_negative}."),
    technique_application: obj("Technique-application evidence."),
    negative_and_error_guessing: obj("Negative and error-guessing evidence."),
    risk_selection: obj("Risk-selection evidence."),
    coverage: obj("Coverage and suite-hygiene evidence.")
  },
  evaluateFn: evaluateDesignedTestCasePack,
  stampFn: stampDesignedTestCasePack
});

const difficultConversationCoaching = manifestAtom({
  serviceName: "difficult-conversation-coaching",
  namespace: "difficult_conversation_coaching",
  displayName: "Difficult conversation coaching",
  description:
    "Submits a conversation-preparation record (preparation domains, self-awareness and self-management, rehearsal, empathy, framing, structure, declared feedback points, safeguards, repair) and returns a deterministic CONVERSATION_PREPARATION_COMPLETE / CONVERSATION_PREPARATION_INCOMPLETE / INSUFFICIENT_EVIDENCE verdict across five sections, including computed preparation-domain and SBI-completeness checks, with per-check evidence. Audits the declared record; it coaches no one and judges no wording.",
  schemaDescription: "The conversation-preparation manifest (see the atom's SERVICE.md for the field table and feedback-point row schema).",
  properties: {
    conversation_title: str("Conversation being prepared for."),
    preparation_domains: arr("Declared preparation domains, in the skill's stated order."),
    self_awareness: obj("Self-awareness evidence."),
    self_management: obj("Self-management evidence."),
    rehearsal: obj("Rehearsal evidence."),
    empathy: obj("Empathy and social-awareness evidence."),
    framing: obj("Framing and assertiveness evidence."),
    structure: obj("Structure evidence."),
    feedback: obj("Feedback-posture evidence."),
    feedback_points: arr("Declared feedback points: {name, situation_stated, behavior_described, impact_stated, targets_identity}."),
    safeguards: obj("Safeguards evidence."),
    repair: obj("Repair and close evidence.")
  },
  evaluateFn: evaluateDifficultConversationCoaching,
  stampFn: stampDifficultConversationCoaching
});

const documentOperationsService = manifestAtom({
  serviceName: "document-operations-service",
  namespace: "document_operations_service",
  displayName: "Document operations service",
  description:
    "Submits a document-operation record (source and extraction, declared documents and findings, editing, preservation, conversion, verification, delivery) and returns a deterministic DOCUMENT_OPERATIONS_SOUND / DOCUMENT_OPERATIONS_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across four sections, including computed output-verification, finding-location and exact-quote coverage checks, with per-check evidence. Audits the declared record; it processes no documents.",
  schemaDescription: "The document-operation manifest (see the atom's SERVICE.md for the field table and document/finding row schemas).",
  properties: {
    operation: str("Document operation being audited."),
    source: obj("Source evidence."),
    documents: arr("Declared documents: {name, output_reopened_and_checked}."),
    findings: arr("Declared findings: {name, location, quoted_exactly_before_interpretation}."),
    extraction: obj("Extraction evidence."),
    editing: obj("Editing evidence."),
    preservation: obj("Preservation evidence."),
    conversion: obj("Conversion evidence."),
    verification: obj("Verification evidence."),
    deliverable: obj("Deliverable evidence."),
    delivery: obj("Delivery and hygiene evidence.")
  },
  evaluateFn: evaluateDocumentOperationsService,
  stampFn: stampDocumentOperationsService
});

const domainPortfolioAudit = manifestAtom({
  serviceName: "domain-portfolio-audit",
  namespace: "domain_portfolio_audit",
  displayName: "Domain portfolio audit",
  description:
    "Submits a domain-portfolio manifest (inventory, brand architecture, declared domain rows, DNS, redirects, email authentication, TLS, renewals, audit) and returns a deterministic DOMAIN_PORTFOLIO_SOUND / DOMAIN_PORTFOLIO_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across four sections, including computed canonical-per-cluster, redirect-graph, email-auth coverage and renewal checks, with per-check evidence. Audits the declared portfolio; it performs no live DNS lookups.",
  schemaDescription: "The domain-portfolio manifest (see the atom's SERVICE.md for the field table and domain row schema).",
  properties: {
    portfolio: str("Portfolio being audited."),
    evaluation_date: str("Evaluation date (ISO) renewal checks are computed against."),
    inventory: obj("Inventory evidence."),
    brand_architecture: obj("Brand-architecture evidence."),
    domains: arr("Declared domains: {name, registrar, renewal_date, status, purpose, owner, brand_cluster, is_canonical, is_personal_brand, redirect_target, redirect_status_code, sends_email, spf_declared, dkim_declared, dmarc_declared, spoofing_blocked, registrar_lock, auto_renew}."),
    dns: obj("DNS evidence."),
    redirects: obj("Redirect-posture evidence."),
    email_auth: obj("Email-authentication evidence."),
    tls: obj("TLS evidence."),
    renewals: obj("Renewal evidence."),
    audit: obj("Audit-cadence evidence.")
  },
  evaluateFn: evaluateDomainPortfolioAudit,
  stampFn: stampDomainPortfolioAudit
});

const HANDLERS: Record<string, AtomHandler> = {
  [cicdPipelineDesign.serviceName]: cicdPipelineDesign,
  [claimEvaluationReview.serviceName]: claimEvaluationReview,
  [codeReviewService.serviceName]: codeReviewService,
  [codebaseVisualization.serviceName]: codebaseVisualization,
  [communitySupportOperations.serviceName]: communitySupportOperations,
  [confidentialComputingDesign.serviceName]: confidentialComputingDesign,
  [costEstimatePreparation.serviceName]: costEstimatePreparation,
  [cppEngineeringReview.serviceName]: cppEngineeringReview,
  [creativeIdeationSession.serviceName]: creativeIdeationSession,
  [crmPipelineOperations.serviceName]: crmPipelineOperations,
  [dataAnalysisDeliverable.serviceName]: dataAnalysisDeliverable,
  [dataMlPipelineEngineering.serviceName]: dataMlPipelineEngineering,
  [dataVisualizationDesign.serviceName]: dataVisualizationDesign,
  [databaseDesignReview.serviceName]: databaseDesignReview,
  [decisionProcessDesign.serviceName]: decisionProcessDesign,
  [decisionReadyResearchBrief.serviceName]: decisionReadyResearchBrief,
  [deliveryPlanPreparation.serviceName]: deliveryPlanPreparation,
  [designedTestCasePack.serviceName]: designedTestCasePack,
  [difficultConversationCoaching.serviceName]: difficultConversationCoaching,
  [documentOperationsService.serviceName]: documentOperationsService,
  [domainPortfolioAudit.serviceName]: domainPortfolioAudit,
  [edgePlatformEngineering.serviceName]: edgePlatformEngineering,
  [efficientWebBuildStandard.serviceName]: efficientWebBuildStandard,
  [electricalMachinesExpertAdvice.serviceName]: electricalMachinesExpertAdvice,
  [engineeringProjectBudgetPack.serviceName]: engineeringProjectBudgetPack,
  [engineeringWorkPackageStructuring.serviceName]: engineeringWorkPackageStructuring,
  [fareConstructionSavingsStrategy.serviceName]: fareConstructionSavingsStrategy,
  [financeEducationArticle.serviceName]: financeEducationArticle,
  [releaseReadiness.serviceName]: releaseReadiness,
  [agentSafetyGuardrailAudit.serviceName]: agentSafetyGuardrailAudit,
  [appendOnlyLedgerDesignAudit.serviceName]: appendOnlyLedgerDesignAudit,
  [dependencyGovernanceAudit.serviceName]: dependencyGovernanceAudit,
  [encryptionClaimAudit.serviceName]: encryptionClaimAudit,
  [firewallRulesAudit.serviceName]: firewallRulesAudit,
  [licenseComplianceCheck.serviceName]: licenseComplianceCheck,
  [agentEvaluationScorecard.serviceName]: agentEvaluationScorecard,
  [assumptionAudit.serviceName]: assumptionAudit,
  [claimVerificationFactCheckStamp.serviceName]: claimVerificationFactCheckStamp,
  [codebaseStructuralQuery.serviceName]: codebaseStructuralQuery,
  [conditionMonitoringTriage.serviceName]: conditionMonitoringTriage,
  [definedFlowAuditor.serviceName]: definedFlowAuditor,
  [correctnessVerificationCertificate.serviceName]: correctnessVerificationCertificate,
  [cryptoInventoryPqMigrationMap.serviceName]: cryptoInventoryPqMigrationMap,
  [decisionTrapSweep.serviceName]: decisionTrapSweep,
  [distributionEquipmentRatingConditionCheck.serviceName]: distributionEquipmentRatingConditionCheck,
  [electricalMachineryEngineeringCheck.serviceName]: electricalMachineryEngineeringCheck,
  [electricalTestRecordPreparation.serviceName]: electricalTestRecordPreparation,
  [financeContentComplianceCheck.serviceName]: financeContentComplianceCheck,
  [forecastWithRangesAndScorecard.serviceName]: forecastWithRangesAndScorecard,
  [lean4FormalProof.serviceName]: lean4FormalProof,
  [linkRotScanAndNotarizedArchive.serviceName]: linkRotScanAndNotarizedArchive,
  [networkExposureAudit.serviceName]: networkExposureAudit,
  [portfolioRiskAnalyticsReport.serviceName]: portfolioRiskAnalyticsReport,
  [predictionModelLeakageCalibrationAudit.serviceName]: predictionModelLeakageCalibrationAudit,
  [predictiveMaintenanceFailureRiskAssessment.serviceName]: predictiveMaintenanceFailureRiskAssessment,
  [pumpConveyorMotorSuitabilityCheck.serviceName]: pumpConveyorMotorSuitabilityCheck,
  [ragRetrievalEvaluationTuning.serviceName]: ragRetrievalEvaluationTuning,
  [reconciledPortfolioPerformanceReport.serviceName]: reconciledPortfolioPerformanceReport,
  [semanticCodeTaintAnalysisReport.serviceName]: semanticCodeTaintAnalysisReport,
  [strategyBacktestValidation.serviceName]: strategyBacktestValidation,
  [testedAuthorizationPolicyPack.serviceName]: testedAuthorizationPolicyPack,
  [vfdApplicationEngineeringCheck.serviceName]: vfdApplicationEngineeringCheck,
  [vulnerabilityTriageVerifiedClosure.serviceName]: vulnerabilityTriageVerifiedClosure,
  [zeroKnowledgeClaimAudit.serviceName]: zeroKnowledgeClaimAudit,
  [zeroTrustEvaluationVerdict.serviceName]: zeroTrustEvaluationVerdict,
  [acpProtocolIntegrationReview.serviceName]: acpProtocolIntegrationReview,
  [agentContextPackaging.serviceName]: agentContextPackaging,
  [agentInteroperabilityDesign.serviceName]: agentInteroperabilityDesign,
  [agenticCodingPractice.serviceName]: agenticCodingPractice,
  [algorithmDesignImplementation.serviceName]: algorithmDesignImplementation,
  [appliedMlValidation.serviceName]: appliedMlValidation,
  [architectureDecisionRecord.serviceName]: architectureDecisionRecord,
  [argumentAnalysisReview.serviceName]: argumentAnalysisReview,
  [audienceContractDesign.serviceName]: audienceContractDesign,
  [authDesignReview.serviceName]: authDesignReview,
  [backendEngineeringAdvice.serviceName]: backendEngineeringAdvice,
  [baseRateCard.serviceName]: baseRateCard,
  [behavioralFinanceBiasCheck.serviceName]: behavioralFinanceBiasCheck,
  [behavioralFinanceDebiasing.serviceName]: behavioralFinanceDebiasing,
  [biasControlledQuantStudyPack.serviceName]: biasControlledQuantStudyPack,
  [brandMentionMonitoringTriageDigest.serviceName]: brandMentionMonitoringTriageDigest,
  [browserExtensionEngineering.serviceName]: browserExtensionEngineering,
  [budgetDesignReview.serviceName]: budgetDesignReview,
  [buyerTestCard.serviceName]: buyerTestCard,
  [cEngineeringReview.serviceName]: cEngineeringReview,
  [cashFlowForecast.serviceName]: cashFlowForecast,
};

/** Live atoms = registered handlers ∩ generated catalogue (contracts). */
export function liveAtoms(): AtomHandler[] {
  return CATALOGUE.filter((row) => HANDLERS[row.serviceName]).map((row) => HANDLERS[row.serviceName]);
}

export function resolveAtom(serviceName: string): AtomHandler | null {
  if (!HANDLERS[serviceName]) return null;
  if (!CATALOGUE.some((row) => row.serviceName === serviceName)) return null;
  return HANDLERS[serviceName];
}

export function atomByNamespace(namespace: string): AtomHandler | null {
  return liveAtoms().find((a) => a.namespace === namespace) ?? null;
}
