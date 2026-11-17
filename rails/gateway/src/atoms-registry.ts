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
import { evaluate as evaluateFinanceToolDesignAdvisory, stamp as stampFinanceToolDesignAdvisory } from "./atoms/finance-tool-design-advisory.js";
import { evaluate as evaluateForecastConfidenceScoreboard, stamp as stampForecastConfidenceScoreboard } from "./atoms/forecast-confidence-scoreboard.js";
import { evaluate as evaluateFrameworkAdoptionAdr, stamp as stampFrameworkAdoptionAdr } from "./atoms/framework-adoption-adr.js";
import { evaluate as evaluateFrontendImplementation, stamp as stampFrontendImplementation } from "./atoms/frontend-implementation.js";
import { evaluate as evaluateFullStackAppBuildPack, stamp as stampFullStackAppBuildPack } from "./atoms/full-stack-app-build-pack.js";
import { evaluate as evaluateGrpcServiceDesign, stamp as stampGrpcServiceDesign } from "./atoms/grpc-service-design.js";
import { evaluate as evaluateHomeShortlistCarryingCostComparison, stamp as stampHomeShortlistCarryingCostComparison } from "./atoms/home-shortlist-carrying-cost-comparison.js";
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
import { evaluate as evaluateLocalizationReadinessReview, stamp as stampLocalizationReadinessReview } from "./atoms/localization-readiness-review.js";
import { evaluate as evaluateLongFormAuthoringPipeline, stamp as stampLongFormAuthoringPipeline } from "./atoms/long-form-authoring-pipeline.js";
import { evaluate as evaluateMcpServerDesignAndReview, stamp as stampMcpServerDesignAndReview } from "./atoms/mcp-server-design-and-review.js";
import { evaluate as evaluateMeaningFirstTranslationWithToneNote, stamp as stampMeaningFirstTranslationWithToneNote } from "./atoms/meaning-first-translation-with-tone-note.js";
import { evaluate as evaluateMeetingDecisionsAndActionsExtract, stamp as stampMeetingDecisionsAndActionsExtract } from "./atoms/meeting-decisions-and-actions-extract.js";
import { evaluate as evaluateMlProjectFramingReview, stamp as stampMlProjectFramingReview } from "./atoms/ml-project-framing-review.js";
import { evaluate as evaluateMultiplatformCoreDesign, stamp as stampMultiplatformCoreDesign } from "./atoms/multiplatform-core-design.js";
import { evaluate as evaluateNativeMobileBuildPlan, stamp as stampNativeMobileBuildPlan } from "./atoms/native-mobile-build-plan.js";
import { evaluate as evaluateNegotiationPreparationPack, stamp as stampNegotiationPreparationPack } from "./atoms/negotiation-preparation-pack.js";
import { evaluate as evaluateNetworkExposure, stamp as stampNetworkExposure } from "./atoms/network-exposure-audit.js";
import { evaluate as evaluateObservabilityAndRunbookDesign, stamp as stampObservabilityAndRunbookDesign } from "./atoms/observability-and-runbook-design.js";
import { evaluate as evaluateOfflineFirstPwaEngineeringPack, stamp as stampOfflineFirstPwaEngineeringPack } from "./atoms/offline-first-pwa-engineering-pack.js";
import { evaluate as evaluatePersonalFinancialSnapshot, stamp as stampPersonalFinancialSnapshot } from "./atoms/personal-financial-snapshot.js";
import { evaluate as evaluatePersonalWebPresenceAudit, stamp as stampPersonalWebPresenceAudit } from "./atoms/personal-web-presence-audit.js";
import { evaluate as evaluatePocDesignKillCriteriaVerdict, stamp as stampPocDesignKillCriteriaVerdict } from "./atoms/poc-design-kill-criteria-verdict.js";
import { evaluate as evaluatePortfolioRisk, stamp as stampPortfolioRisk } from "./atoms/portfolio-risk-analytics-report.js";
import { evaluate as evaluatePrdWithTestableAcceptanceCriteria, stamp as stampPrdWithTestableAcceptanceCriteria } from "./atoms/prd-with-testable-acceptance-criteria.js";
import { evaluate as evaluatePredictionLeakage, stamp as stampPredictionLeakage } from "./atoms/prediction-model-leakage-calibration-audit.js";
import { evaluate as evaluatePredictiveMaintenance, stamp as stampPredictiveMaintenance } from "./atoms/predictive-maintenance-failure-risk-assessment.js";
import { evaluate as evaluatePricingUnitEconomicsPack, stamp as stampPricingUnitEconomicsPack } from "./atoms/pricing-unit-economics-pack.js";
import { evaluate as evaluateProcessWasteReviewCoaching, stamp as stampProcessWasteReviewCoaching } from "./atoms/process-waste-review-coaching.js";
import { evaluate as evaluateProductMetricsEventTaxonomyPack, stamp as stampProductMetricsEventTaxonomyPack } from "./atoms/product-metrics-event-taxonomy-pack.js";
import { evaluate as evaluateProductionPythonEngineeringPack, stamp as stampProductionPythonEngineeringPack } from "./atoms/production-python-engineering-pack.js";
import { evaluate as evaluateProductionPythonEngineeringPackExpert, stamp as stampProductionPythonEngineeringPackExpert } from "./atoms/production-python-engineering-pack-expert.js";
import { evaluate as evaluateProductionRustEngineeringPack, stamp as stampProductionRustEngineeringPack } from "./atoms/production-rust-engineering-pack.js";
import { evaluate as evaluatePumpConveyor, stamp as stampPumpConveyor } from "./atoms/pump-conveyor-motor-suitability-check.js";
import { evaluate as evaluateRagRetrieval, stamp as stampRagRetrieval } from "./atoms/rag-retrieval-evaluation-tuning.js";
import { evaluate as evaluateReconciledPortfolio, stamp as stampReconciledPortfolio } from "./atoms/reconciled-portfolio-performance-report.js";
import { evaluate as evaluateSemanticTaint, stamp as stampSemanticTaint } from "./atoms/semantic-code-taint-analysis-report.js";
import { evaluate as evaluateStrategyBacktest, stamp as stampStrategyBacktest } from "./atoms/strategy-backtest-validation.js";
import { evaluate as evaluateSystemDesignFailureModePack, stamp as stampSystemDesignFailureModePack } from "./atoms/system-design-failure-mode-pack.js";
import { evaluate as evaluateTechStackDecisionMemo, stamp as stampTechStackDecisionMemo } from "./atoms/tech-stack-decision-memo.js";
import { evaluate as evaluateTechnicalDocumentationPack, stamp as stampTechnicalDocumentationPack } from "./atoms/technical-documentation-pack.js";
import { evaluate as evaluateTechnicalExplainerContentPack, stamp as stampTechnicalExplainerContentPack } from "./atoms/technical-explainer-content-pack.js";
import { evaluate as evaluateTestedAuthorization, stamp as stampTestedAuthorization } from "./atoms/tested-authorization-policy-pack.js";
import { evaluate as evaluateTestingStrategyRegressionPack, stamp as stampTestingStrategyRegressionPack } from "./atoms/testing-strategy-regression-pack.js";
import { evaluate as evaluateUatScenarioSignOffPack, stamp as stampUatScenarioSignOffPack } from "./atoms/uat-scenario-sign-off-pack.js";
import { evaluate as evaluateUxFlowComponentSpecPack, stamp as stampUxFlowComponentSpecPack } from "./atoms/ux-flow-component-spec-pack.js";
import { evaluate as evaluateValidatedSimulationScenarioPack, stamp as stampValidatedSimulationScenarioPack } from "./atoms/validated-simulation-scenario-pack.js";
import { evaluate as evaluateVendorEvaluationThreeWayMatchPack, stamp as stampVendorEvaluationThreeWayMatchPack } from "./atoms/vendor-evaluation-three-way-match-pack.js";
import { evaluate as evaluateVerifiedPlaceShortlist, stamp as stampVerifiedPlaceShortlist } from "./atoms/verified-place-shortlist.js";
import { evaluate as evaluateVfdApplication, stamp as stampVfdApplication } from "./atoms/vfd-application-engineering-check.js";
import { evaluate as evaluateVoiceNoteNarrationAudio, stamp as stampVoiceNoteNarrationAudio } from "./atoms/voice-note-narration-audio.js";
import { evaluate as evaluateVulnerabilityTriage, stamp as stampVulnerabilityTriage } from "./atoms/vulnerability-triage-verified-closure.js";
import { evaluate as evaluateZeroKnowledgeClaim, stamp as stampZeroKnowledgeClaim } from "./atoms/zero-knowledge-claim-audit.js";
import { evaluate as evaluateZeroKnowledgeSystemDesignPack, stamp as stampZeroKnowledgeSystemDesignPack } from "./atoms/zero-knowledge-system-design-pack.js";
import { evaluate as evaluateZeroTrustArchitectureDesignPack, stamp as stampZeroTrustArchitectureDesignPack } from "./atoms/zero-trust-architecture-design-pack.js";
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
import { evaluate as evaluateHonestSeoAuditIntentMap, stamp as stampHonestSeoAuditIntentMap } from "./atoms/honest-seo-audit-intent-map.js";
import { evaluate as evaluateJavascriptReviewAndBuild, stamp as stampJavascriptReviewAndBuild } from "./atoms/javascript-review-and-build.js";
import { evaluate as evaluateJsonSchemaDesignCheck, stamp as stampJsonSchemaDesignCheck } from "./atoms/json-schema-design-check.js";
import { evaluate as evaluateKnowledgeGraphDesign, stamp as stampKnowledgeGraphDesign } from "./atoms/knowledge-graph-design.js";
import { evaluate as evaluateLocalFirstSyncDesign, stamp as stampLocalFirstSyncDesign } from "./atoms/local-first-sync-design.js";
import { evaluate as evaluateLocalLlmServingSetup, stamp as stampLocalLlmServingSetup } from "./atoms/local-llm-serving-setup.js";
import { evaluate as evaluateLocalVoiceStackEngineeringPack, stamp as stampLocalVoiceStackEngineeringPack } from "./atoms/local-voice-stack-engineering-pack.js";
import { evaluate as evaluateProductionRustEngineeringPackExpert, stamp as stampProductionRustEngineeringPackExpert } from "./atoms/production-rust-engineering-pack-expert.js";
import { evaluate as evaluateQuantMathDerivationSanityCheck, stamp as stampQuantMathDerivationSanityCheck } from "./atoms/quant-math-derivation-sanity-check.js";
import { evaluate as evaluateReleasePackChangelogSealRollback, stamp as stampReleasePackChangelogSealRollback } from "./atoms/release-pack-changelog-seal-rollback.js";
import { evaluate as evaluateSemanticHtmlReview, stamp as stampSemanticHtmlReview } from "./atoms/semantic-html-review.js";
import { evaluate as evaluateServiceIsolationHardeningReview, stamp as stampServiceIsolationHardeningReview } from "./atoms/service-isolation-hardening-review.js";
import { evaluate as evaluateSingleLivingTripItinerary, stamp as stampSingleLivingTripItinerary } from "./atoms/single-living-trip-itinerary.js";
import { evaluate as evaluateSmartGridDerDesignPack, stamp as stampSmartGridDerDesignPack } from "./atoms/smart-grid-der-design-pack.js";
import { evaluate as evaluateSourcedPodcastEpisodeProduction, stamp as stampSourcedPodcastEpisodeProduction } from "./atoms/sourced-podcast-episode-production.js";
import { evaluate as evaluateSourcedVisualReferenceSearch, stamp as stampSourcedVisualReferenceSearch } from "./atoms/sourced-visual-reference-search.js";
import { evaluate as evaluateSqlSchemaQueryEngineeringPack, stamp as stampSqlSchemaQueryEngineeringPack } from "./atoms/sql-schema-query-engineering-pack.js";
import { evaluate as evaluateStatisticalStudyDesignReport, stamp as stampStatisticalStudyDesignReport } from "./atoms/statistical-study-design-report.js";
import { evaluate as evaluateStrictTypescriptEngineeringPack, stamp as stampStrictTypescriptEngineeringPack } from "./atoms/strict-typescript-engineering-pack.js";
import { evaluate as evaluateStructuredDecisionMaking, stamp as stampStructuredDecisionMaking } from "./atoms/structured-decision-making.js";
import { evaluate as evaluateStructuredRootCauseAnalysis, stamp as stampStructuredRootCauseAnalysis } from "./atoms/structured-root-cause-analysis.js";
import { evaluate as evaluateMarkdownSanitizer, stamp as stampMarkdownSanitizer } from "./atoms/markdown-sanitizer.js";
import { evaluate as evaluateTokenEstimator, stamp as stampTokenEstimator } from "./atoms/token-estimator.js";
import { evaluate as evaluateJsonSchemaEnforcer, stamp as stampJsonSchemaEnforcer } from "./atoms/json-schema-enforcer.js";

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

const financeToolDesignAdvisory = manifestAtom({
  serviceName: "finance-tool-design-advisory",
  namespace: "finance_tool_design_advisory",
  displayName: "Finance tool design advisory",
  description:
    "Submits a finance-tool design record (advice boundary and compliance framing, quant fundamentals, reproducibility, privacy and open finance, business model and behavioural design, anti-patterns) and returns a deterministic FINANCE_TOOL_DESIGN_SOUND / FINANCE_TOOL_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed feature-consistency and scenario/traceability coverage checks, with per-check evidence. Audits the declared design record; it gives no financial advice.",
  schemaDescription: "The finance-tool design manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    tool: str("Finance tool being designed."),
    compliance: obj("Compliance evidence."),
    margin: obj("Margin evidence."),
    quant: obj("Quant evidence."),
    features: arr("Declared features: {name, shows_scenarios_and_tradeoffs, implies_advice_present, figures_traceable, is_backtest, overfit_and_survivorship_addressed}."),
    open_building_blocks: obj("Open building blocks evidence."),
    privacy: obj("Privacy evidence."),
    business_model: obj("Business model evidence."),
    behavioral: obj("Behavioral evidence."),
    anti_patterns: obj("Anti patterns evidence.")
  },
  evaluateFn: evaluateFinanceToolDesignAdvisory,
  stampFn: stampFinanceToolDesignAdvisory
});

const forecastConfidenceScoreboard = manifestAtom({
  serviceName: "forecast-confidence-scoreboard",
  namespace: "forecast_confidence_scoreboard",
  displayName: "Confidence scoreboard",
  description:
    "Submits a forecast-confidence scoreboard record (a ledger of resolved binary probabilistic forecasts by named forecasters, per-forecaster scoreboard rows, calibration reporting, ranking and honesty in use) and returns a deterministic CONFIDENCE_SCOREBOARD_SOUND / CONFIDENCE_SCOREBOARD_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including recomputed per-forecaster Brier score, hit rate and calibration-gap checks, with per-check evidence. Scores the declared ledger; it makes no forecast.",
  schemaDescription: "The forecast-confidence scoreboard manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    subject: str("Scoreboard subject (the forecaster population / forecast programme)."),
    record: obj("Record evidence."),
    forecasts: arr("Declared forecasts: {forecaster, claim, stated_probability, outcome}."),
    scoreboard: arr("Declared scoreboard: {forecaster, forecasts_count, mean_stated_probability, hit_rate, calibration_gap, brier_score, rank}."),
    confidence_reporting: obj("Confidence reporting evidence."),
    scoreboard_use: obj("Scoreboard use evidence."),
    honesty: obj("Honesty evidence.")
  },
  evaluateFn: evaluateForecastConfidenceScoreboard,
  stampFn: stampForecastConfidenceScoreboard
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

const frameworkAdoptionAdr = manifestAtom({
  serviceName: "framework-adoption-adr",
  namespace: "framework_adoption_adr",
  displayName: "Framework adoption adr",
  description:
    "Submits a framework-adoption ADR record (the adoption decision and candidate fit assessments, house-stack conformity, pinning and upgrades, runtime explicitness, plugins and deprecations) and returns a deterministic FRAMEWORK_ADOPTION_SOUND / FRAMEWORK_ADOPTION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed candidate-fit and plugin-compliance coverage checks, with per-check evidence. Audits the declared adoption record; it adopts nothing.",
  schemaDescription: "The framework-adoption ADR manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project adopting the framework."),
    framework: str("Framework being adopted."),
    adr: obj("Adr evidence."),
    candidates: arr("Declared candidates: {name, team_familiarity_assessed, maintenance_health_assessed, ecosystem_assessed, performance_assessed, exit_cost_assessed, selected}."),
    house_stack: obj("House stack evidence."),
    versions: obj("Versions evidence."),
    runtime: obj("Runtime evidence."),
    plugins: obj("Plugins evidence."),
    deprecations: obj("Deprecations evidence.")
  },
  evaluateFn: evaluateFrameworkAdoptionAdr,
  stampFn: stampFrameworkAdoptionAdr
});

const frontendImplementation = manifestAtom({
  serviceName: "frontend-implementation",
  namespace: "frontend_implementation",
  displayName: "Frontend implementation",
  description:
    "Submits a frontend implementation record (structure and components, states and data layer, responsive and accessibility, performance and errors, verification and red lines) and returns a deterministic FRONTEND_SOUND / FRONTEND_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed data-view state-coverage checks, with per-check evidence. Audits the declared record; it builds and renders nothing.",
  schemaDescription: "The frontend implementation manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Frontend project being audited."),
    structure: obj("Structure evidence."),
    framework: obj("Framework evidence."),
    data_views: arr("Declared data views: {name, loading_implemented, empty_implemented, error_implemented, success_implemented}."),
    interactions: obj("Interactions evidence."),
    data_layer: obj("Data layer evidence."),
    verification: obj("Verification evidence."),
    responsive: obj("Responsive evidence."),
    accessibility: obj("Accessibility evidence."),
    performance: obj("Performance evidence."),
    errors: obj("Errors evidence."),
    security: obj("Security evidence.")
  },
  evaluateFn: evaluateFrontendImplementation,
  stampFn: stampFrontendImplementation
});

const fullStackAppBuildPack = manifestAtom({
  serviceName: "full-stack-app-build-pack",
  namespace: "full_stack_app_build_pack",
  displayName: "Full stack app build pack",
  description:
    "Submits a full-stack app build record (approach and contracts, frontend, backend and data, security, testing and quality, deploy and delivery) and returns a deterministic FULL_STACK_BUILD_SOUND / FULL_STACK_BUILD_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed end-to-end slice coverage checks, with per-check evidence. Audits the declared build record; it builds no app.",
  schemaDescription: "The full-stack build-pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("App build being audited."),
    approach: obj("Approach evidence."),
    slices: arr("Declared slices: {name, end_to_end_complete}."),
    frontend: obj("Frontend evidence."),
    backend: obj("Backend evidence."),
    data: obj("Data evidence."),
    security: obj("Security evidence."),
    testing: obj("Testing evidence."),
    deploy: obj("Deploy evidence.")
  },
  evaluateFn: evaluateFullStackAppBuildPack,
  stampFn: stampFullStackAppBuildPack
});

const grpcServiceDesign = manifestAtom({
  serviceName: "grpc-service-design",
  namespace: "grpc_service_design",
  displayName: "Grpc service design",
  description:
    "Submits a gRPC service design record (contract and compatibility, API shape and deadlines, server hygiene, security and transport, observability, testing and interop) and returns a deterministic GRPC_SERVICE_SOUND / GRPC_SERVICE_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed method deadline and streaming-boundedness and proto field-number checks, with per-check evidence. Audits the declared design record; it serves no RPCs.",
  schemaDescription: "The gRPC service design manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("gRPC service / platform being designed."),
    contract: obj("Contract evidence."),
    methods: arr("Declared methods: {name, streaming_mode, deadline_set, stream_bounded}."),
    proto_fields: arr("Declared proto fields: {message, name, number}."),
    api_shape: obj("Api shape evidence."),
    server: obj("Server evidence."),
    security: obj("Security evidence."),
    observability: obj("Observability evidence."),
    testing: obj("Testing evidence."),
    interop: obj("Interop evidence.")
  },
  evaluateFn: evaluateGrpcServiceDesign,
  stampFn: stampGrpcServiceDesign
});

const homeShortlistCarryingCostComparison = manifestAtom({
  serviceName: "home-shortlist-carrying-cost-comparison",
  namespace: "home_shortlist_carrying_cost_comparison",
  displayName: "Home shortlist carrying cost comparison",
  description:
    "Submits a home-shortlist carrying-cost comparison record (criteria declared before search, candidate home records, declared monthly carrying-cost components, tracking and ranking) and returns a deterministic HOME_SHORTLIST_COMPARISON_READY / HOME_SHORTLIST_COMPARISON_NOT_READY / INSUFFICIENT_EVIDENCE verdict across five sections, including recomputed per-home carrying-cost totals, spread and budget-coverage figures, with per-check evidence. Compares the declared figures; it fetches no listings and values no homes.",
  schemaDescription: "The home-shortlist comparison manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    search_name: str("Name of the home search / shortlist."),
    currency: str("Currency all declared figures are in."),
    criteria: obj("Criteria evidence."),
    homes: arr("Declared homes: {name, listing_source, fetch_date, status, ruled_out_reason, asking_price, monthly_housing_payment, monthly_property_tax, monthly_utilities_estimate, monthly_condo_or_hoa_fees, declared_monthly_carrying_cost, open_questions, meets_criteria}."),
    tracking: obj("Tracking evidence."),
    presentation: obj("Presentation evidence.")
  },
  evaluateFn: evaluateHomeShortlistCarryingCostComparison,
  stampFn: stampHomeShortlistCarryingCostComparison
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

const localizationReadinessReview = manifestAtom({
  serviceName: "localization-readiness-review",
  namespace: "localization_readiness_review",
  displayName: "Localization readiness review",
  description:
    "Submits a localization readiness record (externalized strings and translation units, locale formats plurals and grammar, flexible layout and RTL readiness, content workflow and glossary, locale testing and red lines) and returns a deterministic LOCALIZATION_READINESS_SOUND / LOCALIZATION_READINESS_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-locale format-test, direction and screenshot coverage checks, with per-check evidence. Audits the declared record; it inspects no code and runs no tests.",
  schemaDescription: "The localization readiness review manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    product: str("Product or property the review covers."),
    externalization: obj("Externalization evidence."),
    formats: obj("Locale formats evidence."),
    grammar: obj("Plurals and grammar evidence."),
    layout: obj("Flexible layout evidence."),
    rtl: obj("RTL readiness evidence."),
    workflow: obj("Content workflow evidence."),
    testing: obj("Locale testing evidence."),
    locales: arr("Declared locales: {name, code, direction, format_tests_passed, screenshots_reviewed}."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateLocalizationReadinessReview,
  stampFn: stampLocalizationReadinessReview
});

const longFormAuthoringPipeline = manifestAtom({
  serviceName: "long-form-authoring-pipeline",
  namespace: "long_form_authoring_pipeline",
  displayName: "Long-form authoring pipeline",
  description:
    "Submits a long-form authoring pipeline record (outline as contract, drafting loop, review passes, versioning and builds, publishing, feedback loop and red lines) and returns a deterministic AUTHORING_PIPELINE_SOUND / AUTHORING_PIPELINE_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed per-unit single-point and review-pass coverage checks, with per-check evidence. Audits the declared record; it writes nothing and runs no build.",
  schemaDescription: "The long-form authoring pipeline manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    work: str("Work the pipeline produces."),
    outline: obj("Outline-as-contract evidence."),
    units: arr("Declared units: {name, point_or_outcome, has_single_point}."),
    drafting: obj("Drafting loop evidence."),
    review: obj("Review evidence."),
    review_passes: arr("Declared review passes: {name, pass_type, recorded}."),
    versioning: obj("Versioning evidence."),
    builds: obj("Builds evidence."),
    publishing: obj("Publishing evidence."),
    feedback: obj("Feedback loop evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateLongFormAuthoringPipeline,
  stampFn: stampLongFormAuthoringPipeline
});

const mcpServerDesignAndReview = manifestAtom({
  serviceName: "mcp-server-design-and-review",
  namespace: "mcp_server_design_and_review",
  displayName: "MCP server design and review",
  description:
    "Submits an MCP server design record (tool design and budget, transports and auth, safety rails and injection awareness, versioning contract tests and observability, red lines) and returns a deterministic MCP_SERVER_SOUND / MCP_SERVER_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-tool schema, single-job, operation and destructive-gate checks, with per-check evidence. Audits the declared record; it connects to no server.",
  schemaDescription: "The mcp server design and review manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    server: str("Server under review."),
    tool_design: obj("Tool design evidence."),
    budget: obj("Budget evidence."),
    tools: arr("Declared tools: {name, operation, has_typed_schema, single_job, has_negative_test, approval_or_scope_gate_present}."),
    transport: obj("Transport evidence."),
    auth: obj("Auth evidence."),
    safety: obj("Safety rails evidence."),
    injection: obj("Injection awareness evidence."),
    versioning: obj("Versioning evidence."),
    tests: obj("Contract tests evidence."),
    observability: obj("Observability evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateMcpServerDesignAndReview,
  stampFn: stampMcpServerDesignAndReview
});

const meaningFirstTranslationWithToneNote = manifestAtom({
  serviceName: "meaning-first-translation-with-tone-note",
  namespace: "meaning_first_translation_with_tone_note",
  displayName: "Meaning-first translation with tone note",
  description:
    "Submits a meaning-first translation record (context and meaning-first method, register tone and send readiness, idiom ambiguity and uncertainty, exact carryover and segment coverage, sensitive documents and red lines) and returns a deterministic MEANING_FIRST_TRANSLATION_SOUND / MEANING_FIRST_TRANSLATION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-segment coverage and exact-carryover checks, with per-check evidence. Audits the declared record; it translates nothing and certifies nothing.",
  schemaDescription: "The meaning-first translation with tone note manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    document: str("Document the record covers."),
    context: obj("Context evidence."),
    tone: obj("Register and tone evidence."),
    handling: obj("Idiom and ambiguity handling evidence."),
    segments: arr("Declared segments: {name, has_translation, meaning_preserved, idiom_ambiguity_handling_complete, exact_carryover_checked}."),
    carryover: obj("Exact carryover evidence."),
    carryover_items: arr("Declared carryover items: {name, kind, matches_original_exactly}."),
    sensitive: obj("Sensitive documents evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateMeaningFirstTranslationWithToneNote,
  stampFn: stampMeaningFirstTranslationWithToneNote
});

const meetingDecisionsAndActionsExtract = manifestAtom({
  serviceName: "meeting-decisions-and-actions-extract",
  namespace: "meeting_decisions_and_actions_extract",
  displayName: "Meeting decisions and actions extract",
  description:
    "Submits a meeting decisions-and-actions extraction record (source and meeting identity, decisions fidelity, action ownership and dates, open questions and carry-forward, recap draft and handoff, red lines) and returns a deterministic MEETING_EXTRACTION_SOUND / MEETING_EXTRACTION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed per-decision anchor and per-action owner/date coverage checks, with per-check evidence. Audits the declared record; it extracts nothing from any transcript.",
  schemaDescription: "The meeting decisions and actions extract manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    meeting: str("Meeting the extraction covers."),
    source: obj("Source and identity evidence."),
    decisions_record: obj("Decisions record evidence."),
    decisions: arr("Declared decisions: {name, source_anchor, faithful_to_source, is_inferred, inference_marked}."),
    actions_record: obj("Actions record evidence."),
    actions: arr("Declared actions: {name, owner, due_date, source_anchor}."),
    open_questions_record: obj("Open questions record evidence."),
    open_questions: arr("Declared open questions: {name, source_anchor}."),
    recap: obj("Recap draft evidence."),
    handoff: obj("Handoff evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateMeetingDecisionsAndActionsExtract,
  stampFn: stampMeetingDecisionsAndActionsExtract
});

const mlProjectFramingReview = manifestAtom({
  serviceName: "ml-project-framing-review",
  namespace: "ml_project_framing_review",
  displayName: "ML project framing review",
  description:
    "Submits an ML project framing record (necessity and decision framing, metric and baseline framing, data and evaluation plan, approach reproducibility and LLM framing, anti-pattern red lines) and returns a deterministic ML_FRAMING_SOUND / ML_FRAMING_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-metric decision-tie and baseline-recorded coverage checks, with per-check evidence. Audits the declared framing record; it trains nothing and runs no model.",
  schemaDescription: "The ml project framing review manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under framing review."),
    framing: obj("Necessity and decision framing evidence."),
    metric: obj("Metric framing evidence."),
    baseline: obj("Baseline framing evidence."),
    metrics: arr("Declared metrics: {name, decision_action, tied_to_decision, baseline_recorded_before_modeling}."),
    data_plan: obj("Data plan evidence."),
    evaluation_plan: obj("Evaluation plan evidence."),
    approach: obj("Approach and reproducibility evidence."),
    llm: obj("LLM framing evidence."),
    serving: obj("Serving evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateMlProjectFramingReview,
  stampFn: stampMlProjectFramingReview
});

const multiplatformCoreDesign = manifestAtom({
  serviceName: "multiplatform-core-design",
  namespace: "multiplatform_core_design",
  displayName: "Multiplatform core design",
  description:
    "Submits a multiplatform core design record (core architecture, surfaces and thin adapters, local-first and portability, packaging and testing, anti-pattern red lines) and returns a deterministic MULTIPLATFORM_CORE_SOUND / MULTIPLATFORM_CORE_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-surface kind, core-contract and isolation checks, with per-check evidence. Audits the declared record; it builds nothing.",
  schemaDescription: "The multiplatform core design manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under design review."),
    core: obj("Core architecture evidence."),
    web: obj("Web surface evidence."),
    mobile: obj("Mobile surface evidence."),
    desktop_cli: obj("Desktop/CLI surface evidence."),
    api: obj("API surface evidence."),
    surfaces: arr("Declared surfaces: {name, kind, consumes_core_contract, platform_code_isolated, core_logic_reimplemented}."),
    local_first: obj("Local-first evidence."),
    portability: obj("Portability evidence."),
    packaging: obj("Packaging evidence."),
    testing: obj("Testing evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateMultiplatformCoreDesign,
  stampFn: stampMultiplatformCoreDesign
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

const prdWithTestableAcceptanceCriteria = manifestAtom({
  serviceName: "prd-with-testable-acceptance-criteria",
  namespace: "prd_with_testable_acceptance_criteria",
  displayName: "Prd with testable acceptance criteria",
  description:
    "Submits a product requirements record (problem and outcome statements, user-story and acceptance-criteria rows, scope fences with declared out-of-scope items, priorities and decisions, open-question rows and approval, red lines) and returns a deterministic PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY / PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed story-to-criteria traceability and testable/binary coverage checks over the declared rows, with per-check evidence. Audits the declared PRD record only; it writes no requirements and judges no product's worth.",
  schemaDescription: "The prd with testable acceptance criteria manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    product: str("Product under review."),
    problem: obj("Problem evidence."),
    outcome: obj("Outcome evidence."),
    stories: arr("Declared stories rows."),
    acceptance_criteria: arr("Declared acceptance criteria rows."),
    out_of_scope_items: arr("Declared out of scope items (plain strings)."),
    scope: obj("Scope evidence."),
    priorities: obj("Priorities evidence."),
    decisions: obj("Decisions evidence."),
    open_questions: arr("Declared open questions rows."),
    open_question_tracking: obj("Open question tracking evidence."),
    approval: obj("Approval evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluatePrdWithTestableAcceptanceCriteria,
  stampFn: stampPrdWithTestableAcceptanceCriteria
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

const pricingUnitEconomicsPack = manifestAtom({
  serviceName: "pricing-unit-economics-pack",
  namespace: "pricing_unit_economics_pack",
  displayName: "Pricing unit economics pack",
  description:
    "Submits a pricing and unit-economics record (revenue model and recognition, pricing tiers as declared rows, discount policy with declared discount rows, unit economics, churn and the MRR bridge, reporting, red lines) and returns a deterministic PRICING_UNIT_ECONOMICS_PACK_READY / PRICING_UNIT_ECONOMICS_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed tier arithmetic, contribution-margin, break-even and MRR-bridge closure checks re-derived from the declared figures, with per-check evidence. Audits the declared record only; it recommends no price, approves no deal and projects nothing.",
  schemaDescription: "The pricing unit economics pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    product: str("Product under review."),
    revenue_model: obj("Revenue model evidence."),
    pricing: obj("Pricing evidence."),
    tiers: arr("Declared tiers rows."),
    discount_policy: obj("Discount policy evidence."),
    discounts: arr("Declared discounts rows."),
    unit_economics: obj("Unit economics evidence."),
    churn: obj("Churn evidence."),
    mrr_bridge: obj("Mrr bridge evidence."),
    reporting: obj("Reporting evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluatePricingUnitEconomicsPack,
  stampFn: stampPricingUnitEconomicsPack
});

const processWasteReviewCoaching = manifestAtom({
  serviceName: "process-waste-review-coaching",
  namespace: "process_waste_review_coaching",
  displayName: "Process waste review coaching",
  description:
    "Submits a process waste review record (define and visibility, process mapping with declared step and waste rows, measurement and metrics, analysis and constraint, improvement and control, red lines) and returns a deterministic PROCESS_WASTE_REVIEW_READY / PROCESS_WASTE_REVIEW_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed step/waste consistency, wait-share and bottleneck-agreement checks over the declared rows, with per-check evidence. Audits the declared operations record only; it coaches no person and assesses no behaviour or mental state.",
  schemaDescription: "The process waste review coaching manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    process: str("Process under review."),
    define: obj("Define evidence."),
    mapping: obj("Mapping evidence."),
    steps: arr("Declared steps rows."),
    wastes: arr("Declared wastes rows."),
    measure: obj("Measure evidence."),
    metrics: obj("Metrics evidence."),
    analyze: obj("Analyze evidence."),
    constraint: obj("Constraint evidence."),
    improve: obj("Improve evidence."),
    control: obj("Control evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateProcessWasteReviewCoaching,
  stampFn: stampProcessWasteReviewCoaching
});

const productMetricsEventTaxonomyPack = manifestAtom({
  serviceName: "product-metrics-event-taxonomy-pack",
  namespace: "product_metrics_event_taxonomy_pack",
  displayName: "Product metrics event taxonomy pack",
  description:
    "Submits a product metrics and event taxonomy record (decision and KPI tree, declared metric, event and property rows, data quality, privacy by construction, dashboards, experiments and feedback, red lines) and returns a deterministic PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY / PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed naming-convention, traceability and coverage checks over the declared rows, with per-check evidence. Audits the declared taxonomy record only; it collects no data and judges no product's performance.",
  schemaDescription: "The product metrics event taxonomy pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    product: str("Product under review."),
    decision: obj("Decision evidence."),
    metrics: arr("Declared metrics rows."),
    taxonomy: obj("Taxonomy evidence."),
    events: arr("Declared events rows."),
    properties: arr("Declared properties rows."),
    data_quality: obj("Data quality evidence."),
    privacy: obj("Privacy evidence."),
    dashboards: obj("Dashboards evidence."),
    experiments: obj("Experiments evidence."),
    feedback: obj("Feedback evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateProductMetricsEventTaxonomyPack,
  stampFn: stampProductMetricsEventTaxonomyPack
});

const productionPythonEngineeringPack = manifestAtom({
  serviceName: "production-python-engineering-pack",
  namespace: "production_python_engineering_pack",
  displayName: "Production python engineering pack",
  description:
    "Submits a production Python engineering record (environment, declared dependency rows, typing and style, errors, resources and async practices, testing, packaging, red lines) and returns a deterministic PRODUCTION_PYTHON_ENGINEERING_PACK_READY / PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed dependency pinning and duplication checks over the declared rows, with per-check evidence. Audits the declared engineering record only; it runs no code and reviews no repository.",
  schemaDescription: "The production python engineering pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under review."),
    environment: obj("Environment evidence."),
    dependencies: arr("Declared dependencies rows."),
    typing: obj("Typing evidence."),
    style: obj("Style evidence."),
    errors: obj("Errors evidence."),
    resources: obj("Resources evidence."),
    async_practices: obj("Async practices evidence."),
    testing: obj("Testing evidence."),
    packaging: obj("Packaging evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateProductionPythonEngineeringPack,
  stampFn: stampProductionPythonEngineeringPack
});

const productionPythonEngineeringPackExpert = manifestAtom({
  serviceName: "production-python-engineering-pack-expert",
  namespace: "production_python_engineering_pack_expert",
  displayName: "Production python engineering pack expert",
  description:
    "Submits an expert production Python engineering record (expert typing and idioms, expert packaging, expert async, expert performance with declared hot-path rows, expert surfaces, expert testing, red lines) and returns a deterministic PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY / PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed hot-path profiling-first and acceleration-route checks over the declared rows, with per-check evidence. Audits the declared engineering record only; it runs no code and profiles nothing.",
  schemaDescription: "The production python engineering pack expert manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under review."),
    expert_typing: obj("Expert typing evidence."),
    expert_idioms: obj("Expert idioms evidence."),
    expert_packaging: obj("Expert packaging evidence."),
    expert_async: obj("Expert async evidence."),
    expert_performance: obj("Expert performance evidence."),
    hot_paths: arr("Declared hot paths rows."),
    expert_surfaces: obj("Expert surfaces evidence."),
    expert_testing: obj("Expert testing evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateProductionPythonEngineeringPackExpert,
  stampFn: stampProductionPythonEngineeringPackExpert
});

const productionRustEngineeringPack = manifestAtom({
  serviceName: "production-rust-engineering-pack",
  namespace: "production_rust_engineering_pack",
  displayName: "Production rust engineering pack",
  description:
    "Submits a production Rust engineering record (ownership and lifetimes, error handling, unsafe policy with declared unsafe-block rows, async runtime, testing, tooling, workspace and supply chain, red lines) and returns a deterministic PRODUCTION_RUST_ENGINEERING_PACK_READY / PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed unsafe-block invariant and test-coverage checks over the declared rows, with per-check evidence. Audits the declared engineering record only; it compiles nothing and reviews no repository.",
  schemaDescription: "The production rust engineering pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under review."),
    ownership: obj("Ownership evidence."),
    errors: obj("Errors evidence."),
    unsafe_policy: obj("Unsafe policy evidence."),
    unsafe_blocks: arr("Declared unsafe blocks rows."),
    async_runtime: obj("Async runtime evidence."),
    testing: obj("Testing evidence."),
    tooling: obj("Tooling evidence."),
    workspace: obj("Workspace evidence."),
    supply_chain: obj("Supply chain evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateProductionRustEngineeringPack,
  stampFn: stampProductionRustEngineeringPack
});

const productionRustEngineeringPackExpert = manifestAtom({
  serviceName: "production-rust-engineering-pack-expert",
  namespace: "production_rust_engineering_pack_expert",
  displayName: "Production rust engineering pack expert",
  description:
    "Submits an expert-level production Rust engineering record (lifetime architecture, type-system and API design, async runtime depth, performance measurement and allocation discipline, unsafe/FFI/wasm practice with declared FFI binding rows, cryptography and secret handling, expert red lines) and returns a deterministic PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY / PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed per-binding safe-wrapper, SAFETY-comment and miri-test coverage checks over the declared rows, with per-check evidence. Audits the declared engineering record only; it inspects no real code and prescribes no design.",
  schemaDescription: "The production rust engineering pack expert manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under review."),
    lifetime_design: obj("Lifetime design evidence."),
    type_design: obj("Type design evidence."),
    async_depth: obj("Async depth evidence."),
    performance: obj("Performance evidence."),
    unsafe_ffi: obj("Unsafe and FFI evidence."),
    ffi_bindings: arr("Declared FFI binding rows."),
    crypto: obj("Cryptography evidence."),
    expert_red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateProductionRustEngineeringPackExpert,
  stampFn: stampProductionRustEngineeringPackExpert
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

const quantMathDerivationSanityCheck = manifestAtom({
  serviceName: "quant-math-derivation-sanity-check",
  namespace: "quant_math_derivation_sanity_check",
  displayName: "Quant math derivation sanity check",
  description:
    "Submits a quantitative derivation record (declared goal and givens, declared derivation steps with operands, results and units, declared final result, assumptions and method declarations, red lines) and returns a deterministic DERIVATION_SOUND / DERIVATION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including exact recomputation of every declared step's arithmetic and unit algebra over the declared rows, with per-check evidence. Audits the declared derivation record only; it derives nothing itself and gives no financial advice.",
  schemaDescription: "The quant math derivation sanity check manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    derivation_title: str("Derivation under review."),
    derivation: obj("Derivation structure evidence."),
    steps: arr("Declared derivation step rows."),
    dimensions: obj("Dimensions and units evidence."),
    assumptions: obj("Assumptions evidence."),
    method: obj("Method evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateQuantMathDerivationSanityCheck,
  stampFn: stampQuantMathDerivationSanityCheck
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

const releasePackChangelogSealRollback = manifestAtom({
  serviceName: "release-pack-changelog-seal-rollback",
  namespace: "release_pack_changelog_seal_rollback",
  displayName: "Release pack changelog seal rollback",
  description:
    "Submits a release-pack record (version stamp and bump classification, changelog pack declarations with declared entry rows, seal record with declared sealed-artifact rows, tag and attachment, rollback detail with declared step rows, staged-rollout and health record, red lines) and returns a deterministic RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY / RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including semver bump arithmetic, declared checksum-format checks and rollback step-order checks over the declared rows, with per-check evidence. Audits the declared release-pack record only; it fetches no real release and verifies no real artifact.",
  schemaDescription: "The release pack changelog seal rollback manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    release_label: str("Release under review."),
    version_detail: obj("Version detail evidence."),
    changelog_pack: obj("Changelog pack evidence."),
    changelog_entries: arr("Declared changelog entry rows."),
    seal_record: obj("Seal record evidence."),
    sealed_artifacts: arr("Declared sealed artifact rows."),
    tag_and_attachment: obj("Tag and attachment evidence."),
    rollback_detail: obj("Rollback detail evidence."),
    rollback_steps: arr("Declared rollback step rows."),
    rollout_record: obj("Rollout record evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateReleasePackChangelogSealRollback,
  stampFn: stampReleasePackChangelogSealRollback
});

const semanticHtmlReview = manifestAtom({
  serviceName: "semantic-html-review",
  namespace: "semantic_html_review",
  displayName: "Semantic html review",
  description:
    "Submits a semantic HTML review record for one page (declared landmarks, heading outline rows, semantic elements, controls with declared form-input rows, media with declared image rows, declared data-table rows, document head, ARIA practice, validation, red lines) and returns a deterministic SEMANTIC_HTML_REVIEW_SOUND / SEMANTIC_HTML_REVIEW_DEFICIENT / INSUFFICIENT_EVIDENCE verdict across nine sections, including computed heading-outline, label-binding, alt-text and table-structure checks over the declared rows, with per-check evidence. Audits the declared review record only; it fetches and parses no live page.",
  schemaDescription: "The semantic html review manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    page: str("Page under review."),
    landmarks: obj("Landmarks evidence."),
    headings: arr("Declared heading outline rows."),
    semantic_elements: obj("Semantic elements evidence."),
    controls: obj("Controls evidence."),
    form_inputs: arr("Declared form input rows."),
    media: obj("Media evidence."),
    images: arr("Declared image rows."),
    data_tables: arr("Declared data table rows."),
    document_head: obj("Document head evidence."),
    aria_practice: obj("ARIA practice evidence."),
    validation: obj("Validation evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateSemanticHtmlReview,
  stampFn: stampSemanticHtmlReview
});

const serviceIsolationHardeningReview = manifestAtom({
  serviceName: "service-isolation-hardening-review",
  namespace: "service_isolation_hardening_review",
  displayName: "Service isolation hardening review",
  description:
    "Submits a service-isolation hardening record (declared least-privilege identity with a declared service roster, systemd sandbox directives, confinement and sandbox tooling, resource containment, egress monitoring and kill switch, isolation verification, red lines) and returns a deterministic SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED / SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed per-service dedicated-user, filesystem-scope and egress-restriction coverage checks over the declared roster, with per-check evidence. Audits the declared isolation record only; it probes no live system and certifies no host.",
  schemaDescription: "The service isolation hardening review manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    subject: str("Subject under review."),
    identity: obj("Identity evidence."),
    services: arr("Declared service roster rows."),
    systemd: obj("Systemd sandbox evidence."),
    confinement: obj("Confinement evidence."),
    resources: obj("Resource containment evidence."),
    egress_monitoring: obj("Egress monitoring evidence."),
    verification: obj("Verification evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateServiceIsolationHardeningReview,
  stampFn: stampServiceIsolationHardeningReview
});

const singleLivingTripItinerary = manifestAtom({
  serviceName: "single-living-trip-itinerary",
  namespace: "single_living_trip_itinerary",
  displayName: "Single living trip itinerary",
  description:
    "Submits a single living trip itinerary record (trip header, entry and transit constraint declarations, itinerary entries in idea/held/booked states with declared totals, skeleton and ordering, declared totals, conflicts, pre-departure read-through, red lines) and returns a deterministic SINGLE_LIVING_TRIP_ITINERARY_READY / SINGLE_LIVING_TRIP_ITINERARY_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed date-ordering, leg-connection and booked-total summation checks over the declared entries, with per-check evidence. Audits the declared itinerary record only; it searches nothing, prices nothing live and books nothing.",
  schemaDescription: "The single living trip itinerary manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    trip_title: str("Trip under review."),
    header: obj("Trip header evidence."),
    constraints: obj("Constraints evidence."),
    entries: arr("Declared itinerary entry rows."),
    skeleton: obj("Skeleton evidence."),
    totals: obj("Totals evidence."),
    conflicts: obj("Conflicts evidence."),
    readiness: obj("Readiness evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateSingleLivingTripItinerary,
  stampFn: stampSingleLivingTripItinerary
});

const smartGridDerDesignPack = manifestAtom({
  serviceName: "smart-grid-der-design-pack",
  namespace: "smart_grid_der_design_pack",
  displayName: "Smart grid der design pack",
  description:
    "Submits a smart-grid DER design record (layered architecture and standards citations, network model with declared telemetry-point rows, DER interconnection and protection declarations with declared DER-unit rows, latency tiers with declared control-loop rows, OT cybersecurity, pilot economics and authority, red lines) and returns a deterministic SMART_GRID_DER_DESIGN_PACK_READY / SMART_GRID_DER_DESIGN_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed per-point and per-unit completeness checks and declared-capacity versus declared-hosting-capacity arithmetic over the declared rows, with per-check evidence. Audits the declared design record only; it is not engineering advice and not a design service.",
  schemaDescription: "The smart grid der design pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under review."),
    architecture: obj("Architecture evidence."),
    network_model: obj("Network model evidence."),
    telemetry_points: arr("Declared telemetry point rows."),
    der: obj("DER interconnection evidence."),
    der_units: arr("Declared DER unit rows."),
    latency: obj("Latency evidence."),
    control_loops: arr("Declared control loop rows."),
    cyber: obj("OT cybersecurity evidence."),
    pilot: obj("Pilot evidence."),
    economics: obj("Economics evidence."),
    review: obj("Review evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateSmartGridDerDesignPack,
  stampFn: stampSmartGridDerDesignPack
});

const sourcedPodcastEpisodeProduction = manifestAtom({
  serviceName: "sourced-podcast-episode-production",
  namespace: "sourced_podcast_episode_production",
  displayName: "Sourced podcast episode production",
  description:
    "Submit a podcast episode production record (declared scoping and outline sections, sources, quote/statistic claim rows with source references, script, narration and assembly, show-notes source list, rights, guest-release and publishing declarations, red lines) and return a deterministic EPISODE_PRODUCTION_SOUND / EPISODE_PRODUCTION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed claim-to-source traceability and show-notes source-list matching, with per-check evidence. Audits the declared record only; produces no audio, writes no script, publishes nothing.",
  schemaDescription: "The sourced podcast episode production manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    episode_title: str("Episode under review."),
    scoping: obj("Scoping evidence."),
    episode_sections: arr("Declared episode section rows."),
    source_work: obj("Source work evidence."),
    sources: arr("Declared source rows."),
    claims: arr("Declared claim rows."),
    script: obj("Script evidence."),
    narration: obj("Narration and assembly evidence."),
    show_notes: obj("Show notes evidence."),
    rights: obj("Rights evidence."),
    guests: obj("Guest evidence."),
    publishing: obj("Publishing evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateSourcedPodcastEpisodeProduction,
  stampFn: stampSourcedPodcastEpisodeProduction
});

const sourcedVisualReferenceSearch = manifestAtom({
  serviceName: "sourced-visual-reference-search",
  namespace: "sourced_visual_reference_search",
  displayName: "Sourced visual reference search",
  description:
    "Submits a declared visual-reference search record (brief in searchable terms, result rows with direct and source page URLs, source verification, viewed relevance, context notes, licence status/note/credit, selection and licensing records, red lines) and returns a deterministic VISUAL_REFERENCE_SET_SOUND / VISUAL_REFERENCE_SET_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, with source-pairing, dedupe and licence/attribution coverage computed over the declared rows. Audits the declared record only; searches nothing, fetches no image, identifies no person, clears no image.",
  schemaDescription: "The sourced visual reference search manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    search_title: str("Search under review."),
    brief: obj("Search brief evidence."),
    search: obj("Search adjustment evidence."),
    results: arr("Declared visual reference result rows."),
    quality: obj("Relevance and quality evidence."),
    selection: obj("Selection evidence."),
    licensing: obj("Licensing evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateSourcedVisualReferenceSearch,
  stampFn: stampSourcedVisualReferenceSearch
});

const sqlSchemaQueryEngineeringPack = manifestAtom({
  serviceName: "sql-schema-query-engineering-pack",
  namespace: "sql_schema_query_engineering_pack",
  displayName: "Sql schema query engineering pack",
  description:
    "Submits a SQL schema and query engineering record (schema design with declared table rows, index design with declared index rows, declared query rows, query practice, transactions, SQL safety, migrations, performance evidence, red lines) and returns a deterministic SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY / SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across eight sections, including computed coverage ratios over the declared rows, with per-check evidence. Audits the declared record only; it connects to no database, executes no SQL and reviews no live codebase.",
  schemaDescription: "The SQL schema & query engineering manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under review."),
    schema_design: obj("Schema design evidence."),
    tables: arr("Declared table rows."),
    index_design: obj("Index design evidence."),
    indexes: arr("Declared index rows."),
    queries: arr("Declared query rows."),
    query_practice: obj("Query practice evidence."),
    transactions: obj("Transaction evidence."),
    sql_safety: obj("SQL safety evidence."),
    migrations: obj("Migration evidence."),
    performance_evidence: obj("Performance evidence."),
    sql_red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateSqlSchemaQueryEngineeringPack,
  stampFn: stampSqlSchemaQueryEngineeringPack
});

const statisticalStudyDesignReport = manifestAtom({
  serviceName: "statistical-study-design-report",
  namespace: "statistical_study_design_report",
  displayName: "Statistical study design report",
  description:
    "Submits a statistical study design record (framed decision and research question, declared design type, variables and groups, sampling and declared alpha / target power / effect size inputs, analysis-plan, validation and delivery declarations, red lines) and returns a deterministic STUDY_DESIGN_READY / STUDY_DESIGN_NOT_READY / INSUFFICIENT_EVIDENCE verdict across seven sections, including exact recomputation of the declared total sample size from the declared group sizes, with per-check evidence. Audits the declared design record only; it runs no study, analyses no data and gives no statistical advice or conclusion.",
  schemaDescription: "The statistical study design report manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    study_title: str("Study under review."),
    framing: obj("Decision framing evidence."),
    design: obj("Design evidence."),
    variables: arr("Declared variable rows."),
    sampling: obj("Sampling and power evidence."),
    groups: arr("Declared group rows."),
    analysis: obj("Analysis plan evidence."),
    validation: obj("Validation and bias-control evidence."),
    delivery: obj("Delivery and reproducibility evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateStatisticalStudyDesignReport,
  stampFn: stampStatisticalStudyDesignReport
});

const strictTypescriptEngineeringPack = manifestAtom({
  serviceName: "strict-typescript-engineering-pack",
  namespace: "strict_typescript_engineering_pack",
  displayName: "Strict typescript engineering pack",
  description:
    "Submits a strict TypeScript record (tsconfig strictness, no-any typing discipline, schema-validated boundaries with declared boundary rows, discriminated-union state modelling, modules with declared module rows, async discipline, tests/build tooling, red lines) and returns a deterministic STRICT_TYPESCRIPT_ENGINEERING_PACK_READY / STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY / INSUFFICIENT_EVIDENCE verdict across eight sections, including computed strict-flag, per-boundary schema and per-module any-free coverage, with per-check evidence. Audits the declared record only; compiles no code.",
  schemaDescription: "The strict typescript engineering pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    project: str("Project under review."),
    tsconfig: obj("Tsconfig evidence."),
    typing: obj("Typing discipline evidence."),
    boundary_validation: obj("Boundary validation evidence."),
    boundaries: arr("Declared boundary rows."),
    state_modelling: obj("State modelling evidence."),
    module_structure: obj("Module structure evidence."),
    modules: arr("Declared module rows."),
    async_practices: obj("Async practice evidence."),
    testing: obj("Testing evidence."),
    build_tooling: obj("Build tooling evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateStrictTypescriptEngineeringPack,
  stampFn: stampStrictTypescriptEngineeringPack
});

const structuredDecisionMaking = manifestAtom({
  serviceName: "structured-decision-making",
  namespace: "structured_decision_making",
  displayName: "Structured decision making",
  description:
    "Submits a structured decision record (framing and classification, option rows incl. status-quo and smaller-step rows, criteria with weights defined before scoring, a score matrix with declared weighted totals, evaluation, pre-mortem, commit log, review and red-line declarations) and returns a deterministic DECISION_RECORD_SOUND / DECISION_RECORD_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across eight sections, including exact recomputation of every declared weighted total from declared scores x weights, with per-check evidence. Audits the declared record only; makes no decision, recommends no option.",
  schemaDescription: "The structured decision making manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    decision: str("Decision under review."),
    framing: obj("Framing and classification evidence."),
    options: arr("Declared option rows with score rows and declared weighted totals."),
    criteria: arr("Declared criterion rows with weights."),
    evaluation: obj("Evaluation method, score scale and uncertainty evidence."),
    premortem: obj("Pre-mortem evidence."),
    log: obj("Commit log evidence."),
    review: obj("Review plan evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateStructuredDecisionMaking,
  stampFn: stampStructuredDecisionMaking
});

const structuredRootCauseAnalysis = manifestAtom({
  serviceName: "structured-root-cause-analysis",
  namespace: "structured_root_cause_analysis",
  displayName: "Structured root cause analysis",
  description:
    "Submits a root-cause analysis record (problem and classified inference, decomposition and hypothesis tree, timeline rows, fishbone factor rows with evidence tiers, 5-whys causal chain, verification and falsification record, corrective-action rows, red lines) and returns a deterministic ROOT_CAUSE_ANALYSIS_SOUND / ROOT_CAUSE_ANALYSIS_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed timeline-order, chain-depth and factor-reference checks over the declared rows, with per-check evidence. Audits the declared record only; it investigates nothing, asserts no cause.",
  schemaDescription: "The structured root cause analysis manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    analysis_title: str("Root-cause analysis under review."),
    problem: obj("Problem framing and inference evidence."),
    decomposition: obj("Decomposition evidence."),
    timeline_events: arr("Declared timeline event rows."),
    factors: arr("Declared fishbone factor rows."),
    causal_chain: arr("Declared causal chain (5-whys) link rows."),
    evidence: obj("Evidence and quantification evidence."),
    verification: obj("Verification and falsification evidence."),
    conclusion: obj("Conclusion evidence."),
    corrective_actions: arr("Declared corrective action rows."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateStructuredRootCauseAnalysis,
  stampFn: stampStructuredRootCauseAnalysis
});

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

const systemDesignFailureModePack = manifestAtom({
  serviceName: "system-design-failure-mode-pack",
  namespace: "system_design_failure_mode_pack",
  displayName: "System design failure mode pack",
  description:
    "Submits a system-design failure-mode analysis record (design framing and boundaries, declared component rows, declared failure-mode rows with severity/occurrence/detection ratings and declared RPN values, declared mitigation rows and mitigation work, state/reliability and queue declarations, observability/scaling/security declarations, red lines) and returns a deterministic FAILURE_MODE_PACK_SOUND / FAILURE_MODE_PACK_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed duplicate-id, component-reference, mitigation-coverage and exact RPN-recomputation checks over the declared rows, with per-check evidence. Audits the declared record only; it designs no system, performs no failure-mode analysis, assigns no rating and certifies nothing.",
  schemaDescription: "The system design failure mode pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    design_name: str("Design under review."),
    design_context: obj("Design context evidence."),
    components: obj("Components evidence."),
    failure_modes: obj("Failure modes evidence."),
    mitigations: obj("Mitigations evidence."),
    mitigation_work: obj("Mitigation work evidence."),
    state_and_reliability: obj("State and reliability evidence."),
    queues: obj("Queues evidence."),
    observability_scaling_security: obj("Observability scaling security evidence."),
    caching: obj("Caching evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateSystemDesignFailureModePack,
  stampFn: stampSystemDesignFailureModePack
});

const techStackDecisionMemo = manifestAtom({
  serviceName: "tech-stack-decision-memo",
  namespace: "tech_stack_decision_memo",
  displayName: "Tech stack decision memo",
  description:
    "Submits a tech-stack decision memo record (context and constraints, declared candidate rows and boring-technology declarations, evaluation criteria rows and evidence, total-cost and operability declarations, decision and rationale, reversibility and exit declarations, red lines) and returns a deterministic TECH_STACK_DECISION_SOUND / TECH_STACK_DECISION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed criterion-reference, weighted-score recomputation and decision-candidate consistency checks over the declared rows, with per-check evidence. Audits the declared memo record only; it recommends no stack, picks no stack and ranks no candidate.",
  schemaDescription: "The tech stack decision memo manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    memo_title: str("Memo under review."),
    context: obj("Context evidence."),
    candidate_work: obj("Candidate work evidence."),
    candidates: obj("Candidates evidence."),
    evaluation: obj("Evaluation evidence."),
    criteria: obj("Criteria evidence."),
    tco: obj("Tco evidence."),
    decision: obj("Decision evidence."),
    reversibility: obj("Reversibility evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateTechStackDecisionMemo,
  stampFn: stampTechStackDecisionMemo
});

const technicalDocumentationPack = manifestAtom({
  serviceName: "technical-documentation-pack",
  namespace: "technical_documentation_pack",
  displayName: "Technical documentation pack",
  description:
    "Submits a technical documentation production record (README and doc-set structure, docs-as-code and source-of-truth declarations, declared document rows, declared config-option rows, API docs and declared endpoint rows, decision work and declared decision-record rows, review/verification and plain-language declarations, changelog and versioning declarations, red lines) and returns a deterministic TECHNICAL_DOCUMENTATION_SOUND / TECHNICAL_DOCUMENTATION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across eight sections, including computed document-reference and version-consistency checks over the declared rows, with per-check evidence. Audits the declared record only; it writes no documentation and verifies no document against the real product.",
  schemaDescription: "The technical documentation pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    product_name: str("Product under review."),
    product_version: str("Declared product version."),
    readme: obj("Readme evidence."),
    documents: obj("Documents evidence."),
    source_of_truth: obj("Source of truth evidence."),
    config_options: obj("Config options evidence."),
    api_docs: obj("Api docs evidence."),
    endpoints: obj("Endpoints evidence."),
    decision_work: obj("Decision work evidence."),
    decision_records: obj("Decision records evidence."),
    review_verification: obj("Review verification evidence."),
    plain_language: obj("Plain language evidence."),
    changelog: obj("Changelog evidence."),
    versioning: obj("Versioning evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateTechnicalDocumentationPack,
  stampFn: stampTechnicalDocumentationPack
});

const technicalExplainerContentPack = manifestAtom({
  serviceName: "technical-explainer-content-pack",
  namespace: "technical_explainer_content_pack",
  displayName: "Technical explainer content pack",
  description:
    "Submits a technical-explainer content production record (audience and declared prerequisite rows, learning-objective framing and declared objective rows, structure and declared explanation-section rows, simplification and analogy declarations, example work and declared worked-example rows, declared misconception rows, accuracy and declared source rows, safety declarations, canonical and declared rendering rows, corrections, red lines) and returns a deterministic EXPLAINER_CONTENT_SOUND / EXPLAINER_CONTENT_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across eight sections, including computed objective-to-section coverage, misconception-resolution and source-traceability checks over the declared rows, with per-check evidence. Audits the declared record only; it writes no explainer, teaches nothing and certifies no learning.",
  schemaDescription: "The technical explainer content pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    explainer_title: str("Explainer under review."),
    audience: obj("Audience evidence."),
    prerequisites: obj("Prerequisites evidence."),
    learning_objective_framing: obj("Learning objective framing evidence."),
    learning_objectives: obj("Learning objectives evidence."),
    structure: obj("Structure evidence."),
    explanation_sections: obj("Explanation sections evidence."),
    simplification: obj("Simplification evidence."),
    analogy: obj("Analogy evidence."),
    example_work: obj("Example work evidence."),
    worked_examples: obj("Worked examples evidence."),
    misconceptions: obj("Misconceptions evidence."),
    accuracy: obj("Accuracy evidence."),
    sources: obj("Sources evidence."),
    safety: obj("Safety evidence."),
    canonical: obj("Canonical evidence."),
    renderings: obj("Renderings evidence."),
    corrections: obj("Corrections evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateTechnicalExplainerContentPack,
  stampFn: stampTechnicalExplainerContentPack
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

const testingStrategyRegressionPack = manifestAtom({
  serviceName: "testing-strategy-regression-pack",
  namespace: "testing_strategy_regression_pack",
  displayName: "Testing strategy regression pack",
  description:
    "Submits a testing strategy and regression plan record (scoping, declared risk rows, level planning and declared test-level rows, regression planning, declared change rows and declared regression rows, fixture and determinism declarations, flake policy, negative-testing declarations, entry/exit and reporting declarations, red lines) and returns a deterministic TESTING_STRATEGY_SOUND / TESTING_STRATEGY_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across eight sections, including computed risk-to-level coverage, pyramid-order and change-to-regression coverage checks over the declared rows, with per-check evidence. Audits the declared record only; it runs no tests and inspects no code.",
  schemaDescription: "The testing strategy regression pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    plan_title: str("Plan under review."),
    scoping: obj("Scoping evidence."),
    risk_rows: obj("Risk rows evidence."),
    level_planning: obj("Level planning evidence."),
    test_level_rows: obj("Test level rows evidence."),
    regression_planning: obj("Regression planning evidence."),
    declared_changes: obj("Declared changes evidence."),
    regression_rows: obj("Regression rows evidence."),
    fixtures: obj("Fixtures evidence."),
    flake_policy: obj("Flake policy evidence."),
    negative_testing: obj("Negative testing evidence."),
    entry_exit_and_reporting: obj("Entry exit and reporting evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateTestingStrategyRegressionPack,
  stampFn: stampTestingStrategyRegressionPack
});

const uatScenarioSignOffPack = manifestAtom({
  serviceName: "uat-scenario-sign-off-pack",
  namespace: "uat_scenario_sign_off_pack",
  displayName: "Uat scenario sign off pack",
  description:
    "Submits a UAT scenario and sign-off record (scope, declared acceptance-criterion rows, declared scenario rows, environment and people declarations, execution declarations, declared defect rows, triage declarations, declared required sign-off role rows, declared sign-off rows, retest declarations, declared totals, red lines) and returns a deterministic UAT_SIGN_OFF_SOUND / UAT_SIGN_OFF_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed criterion-to-scenario coverage, sign-off completeness over the declared required roles and recomputation of the declared totals over the declared rows, with per-check evidence. Audits the declared record only; it runs no UAT, executes no scenario and accepts nothing on anyone's behalf.",
  schemaDescription: "The uat scenario sign off pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    uat_round_title: str("UAT round under review."),
    scope: obj("Scope evidence."),
    acceptance_criteria: obj("Acceptance criteria evidence."),
    scenarios: obj("Scenarios evidence."),
    environment: obj("Environment evidence."),
    people: obj("People evidence."),
    execution: obj("Execution evidence."),
    defects: obj("Defects evidence."),
    triage: obj("Triage evidence."),
    required_sign_off_roles: obj("Required sign off roles evidence."),
    sign_offs: obj("Sign offs evidence."),
    sign_off: obj("Sign off evidence."),
    retest: obj("Retest evidence."),
    declared_totals: obj("Declared totals evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateUatScenarioSignOffPack,
  stampFn: stampUatScenarioSignOffPack
});

const uxFlowComponentSpecPack = manifestAtom({
  serviceName: "ux-flow-component-spec-pack",
  namespace: "ux_flow_component_spec_pack",
  displayName: "Ux flow component spec pack",
  description:
    "Submits a UX flow and component specification record (flow design and declared flow-step rows, design-token declarations, declared component rows, declared screen rows, accessibility declarations, microcopy and critique declarations, red lines) and returns a deterministic UX_SPEC_SOUND / UX_SPEC_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed next-step reference resolution, interactive-state inventory and data-surface state checks over the declared rows, with per-check evidence. Audits the declared specification record only; it designs no interface, measures no contrast, tests no keyboard path and certifies no accessibility conformance.",
  schemaDescription: "The ux flow component spec pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    spec_title: str("Specification under review."),
    flow_design: obj("Flow design evidence."),
    flow_steps: obj("Flow steps evidence."),
    design_tokens: obj("Design tokens evidence."),
    components: obj("Components evidence."),
    screens: obj("Screens evidence."),
    accessibility: obj("Accessibility evidence."),
    microcopy: obj("Microcopy evidence."),
    critique: obj("Critique evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateUxFlowComponentSpecPack,
  stampFn: stampUxFlowComponentSpecPack
});

const validatedSimulationScenarioPack = manifestAtom({
  serviceName: "validated-simulation-scenario-pack",
  namespace: "validated_simulation_scenario_pack",
  displayName: "Validated simulation scenario pack",
  description:
    "Submits a validated simulation scenario pack record (purpose and fidelity declarations, model core and unit declarations, declared parameter rows, randomness and reproducibility declarations, declared scenario rows and scenario-library declarations, validation declarations and declared validation-case rows, interaction and performance declarations, red lines) and returns a deterministic SIMULATION_SCENARIO_PACK_SOUND / SIMULATION_SCENARIO_PACK_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed parameter, scenario and validation-case row checks and exact recomputation of each declared validation error from the declared simulated and expected values, with per-check evidence. Audits the declared pack record only; it runs no simulation, produces no simulated value and makes no validation or fitness determination.",
  schemaDescription: "The validated simulation scenario pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    pack_title: str("Pack under review."),
    purpose: obj("Purpose evidence."),
    core: obj("Core evidence."),
    parameters: arr("Declared parameter rows."),
    randomness: obj("Randomness evidence."),
    scenarios: arr("Declared scenario rows."),
    scenario_library: obj("Scenario library evidence."),
    model_version: str("Model version."),
    validation: obj("Validation evidence."),
    validation_cases: arr("Declared validation case rows."),
    interaction: obj("Interaction evidence."),
    performance: obj("Performance evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateValidatedSimulationScenarioPack,
  stampFn: stampValidatedSimulationScenarioPack
});

const vendorEvaluationThreeWayMatchPack = manifestAtom({
  serviceName: "vendor-evaluation-three-way-match-pack",
  namespace: "vendor_evaluation_three_way_match_pack",
  displayName: "Vendor evaluation three way match pack",
  description:
    "Submits a vendor evaluation and three-way match record (spec and sourcing declarations, evaluation setup, declared vendor rows and declared criteria rows, contract and terms declarations, purchase-order discipline declarations, three-way match declarations, declared purchase-order, receipt and invoice line rows, vendor-record declarations, red lines) and returns a deterministic VENDOR_EVALUATION_AND_MATCH_SOUND / VENDOR_EVALUATION_AND_MATCH_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including exact recomputation of weighted vendor totals, per-line totals, cross-document quantity and unit-price matching and both grand totals over the declared rows, with per-check evidence. Audits the declared record only; it contacts no vendor, approves no payment and gives no procurement advice.",
  schemaDescription: "The vendor evaluation three way match pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    pack_title: str("Pack under review."),
    spec: obj("Spec evidence."),
    sourcing: obj("Sourcing evidence."),
    evaluation_setup: obj("Evaluation setup evidence."),
    vendors: arr("Declared vendor rows."),
    criteria: arr("Declared criteria rows."),
    contract: obj("Contract evidence."),
    po_discipline: obj("Po discipline evidence."),
    three_way_match: obj("Three way match evidence."),
    purchase_order_lines: arr("Declared purchase order line rows."),
    receipt_lines: arr("Declared receipt line rows."),
    invoice_lines: arr("Declared invoice line rows."),
    vendor_records: obj("Vendor records evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateVendorEvaluationThreeWayMatchPack,
  stampFn: stampVendorEvaluationThreeWayMatchPack
});

const verifiedPlaceShortlist = manifestAtom({
  serviceName: "verified-place-shortlist",
  namespace: "verified_place_shortlist",
  displayName: "Verified place shortlist",
  description:
    "Submits a verified place shortlist record (constraint declarations, declared criterion rows, declared place rows with declared verification evidence, evaluation declarations, ranking declarations, freshness and uncertainty handling declarations, red lines) and returns a deterministic VERIFIED_PLACE_SHORTLIST_SOUND / VERIFIED_PLACE_SHORTLIST_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed criterion-to-place coverage, per-row evidence completeness and winner and backup resolution checks over the declared rows, with per-check evidence. Audits the declared shortlist record only; it fetches nothing live, verifies no real-world fact and recommends or books nothing. The word verified in its name refers to the caller's declared verification discipline, not to any live verification by the atom.",
  schemaDescription: "The verified place shortlist manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    shortlist_title: str("Shortlist under review."),
    constraints: obj("Constraints evidence."),
    criteria: arr("Declared criteria rows."),
    places: arr("Declared place rows."),
    evaluation: obj("Evaluation evidence."),
    ranking: obj("Ranking evidence."),
    handling: obj("Handling evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateVerifiedPlaceShortlist,
  stampFn: stampVerifiedPlaceShortlist
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

const voiceNoteNarrationAudio = manifestAtom({
  serviceName: "voice-note-narration-audio",
  namespace: "voice_note_narration_audio",
  displayName: "Voice note narration audio",
  description:
    "Submits a voice-note and narration production record (scoping and confirmation declarations, voice declarations, rights and voice-consent declarations, listening-adaptation declarations, chunking declarations, declared segment rows, audio-spec and assembly declarations, delivery and disclosure declarations, red lines) and returns a deterministic VOICE_NOTE_NARRATION_SOUND / VOICE_NOTE_NARRATION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed segment sequence coverage and exact recomputation of the declared total duration from the declared segment durations, with per-check evidence. Audits the declared record only; it synthesizes no audio, records nothing and clones no voice.",
  schemaDescription: "The voice note narration audio manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    production_title: str("Production under review."),
    scoping: obj("Scoping evidence."),
    voice: obj("Voice evidence."),
    rights: obj("Rights evidence."),
    adaptation: obj("Adaptation evidence."),
    chunking: obj("Chunking evidence."),
    segments: arr("Declared segment rows."),
    audio_spec: obj("Audio spec evidence."),
    assembly: obj("Assembly evidence."),
    delivery: obj("Delivery evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateVoiceNoteNarrationAudio,
  stampFn: stampVoiceNoteNarrationAudio
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

const zeroKnowledgeSystemDesignPack = manifestAtom({
  serviceName: "zero-knowledge-system-design-pack",
  namespace: "zero_knowledge_system_design_pack",
  displayName: "Zero knowledge system design pack",
  description:
    "Submits a zero-knowledge system design record (trust-model and key-custody declarations, client-encryption and sharing design declarations, proof-system and circuit design declarations, declared circuit rows, setup and verifier declarations, declared verifier rows, property and proof-selection declarations, recovery, limits and claim-mapping declarations with declared claim-mapping rows, red lines) and returns a deterministic ZK_DESIGN_RECORD_SOUND / ZK_DESIGN_RECORD_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed row completeness and uniqueness checks and exact recomputation of the declared constraint-count total over the declared circuit rows, with per-check evidence. Audits the declared design record only; it proves nothing, verifies no proof, runs no cryptography and certifies no security property.",
  schemaDescription: "The zero knowledge system design pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    design_title: str("Design under review."),
    trust_model: obj("Trust model evidence."),
    e2ee_design: obj("E2ee design evidence."),
    proof_design: obj("Proof design evidence."),
    circuits: arr("Declared circuit rows."),
    setup_and_verifier: obj("Setup and verifier evidence."),
    verifiers: arr("Declared verifier rows."),
    properties: obj("Properties evidence."),
    recovery_and_limits: obj("Recovery and limits evidence."),
    claim_mappings: arr("Declared claim mapping rows."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateZeroKnowledgeSystemDesignPack,
  stampFn: stampZeroKnowledgeSystemDesignPack
});

const zeroTrustArchitectureDesignPack = manifestAtom({
  serviceName: "zero-trust-architecture-design-pack",
  namespace: "zero_trust_architecture_design_pack",
  displayName: "Zero trust architecture design pack",
  description:
    "Submits a zero-trust architecture design record (identity and perimeter framing declarations, declared asset rows, declared policy rows, segmentation declarations, device and workload trust declarations, monitoring, audit and response declarations, migration and rollout declarations, red lines) and returns a deterministic ZERO_TRUST_DESIGN_SOUND / ZERO_TRUST_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed policy-coverage recomputation over the declared asset and policy rows, with per-check evidence. Audits the declared design record only; it evaluates no live posture, probes no network and certifies no security outcome.",
  schemaDescription: "The zero trust architecture design pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    design_title: str("Design under review."),
    identity: obj("Identity evidence."),
    assets: arr("Declared asset rows."),
    policies: arr("Declared policy rows."),
    segmentation: obj("Segmentation evidence."),
    trust: obj("Trust evidence."),
    monitoring: obj("Monitoring evidence."),
    migration: obj("Migration evidence."),
    red_lines: obj("Red lines evidence.")
  },
  evaluateFn: evaluateZeroTrustArchitectureDesignPack,
  stampFn: stampZeroTrustArchitectureDesignPack
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
    findings: obj("Declared privilege/segmentation and verification findings."),
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

const honestSeoAuditIntentMap = manifestAtom({
  serviceName: "honest-seo-audit-intent-map",
  namespace: "honest_seo_audit_intent_map",
  displayName: "Honest SEO audit intent map",
  description:
    "Submits an SEO audit and search-intent map record (technical foundation, intent map and on-page craft, structured data and entity clarity, earned authority and measurement, white-hat red lines) and returns a deterministic HONEST_SEO_MAP_SOUND / HONEST_SEO_MAP_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-page intent-ownership and coverage checks, with per-check evidence. Audits the declared record; it crawls nothing and reads no live data.",
  schemaDescription: "The honest seo audit intent map manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    site: str("Site or property the audit covers."),
    technical: obj("Technical foundation evidence."),
    intent: obj("Intent map evidence."),
    on_page: obj("On-page craft evidence."),
    pages: arr("Declared pages: {name, intent, intent_type, has_single_intent, fully_answers_question}."),
    structured_data: obj("Structured data evidence."),
    entity: obj("Entity clarity evidence."),
    authority: obj("Earned authority evidence."),
    measurement: obj("Measurement evidence."),
    ai_era: obj("AI-era extraction evidence."),
    red_lines: obj("White-hat red-line evidence.")
  },
  evaluateFn: evaluateHonestSeoAuditIntentMap,
  stampFn: stampHonestSeoAuditIntentMap
});

const javascriptReviewAndBuild = manifestAtom({
  serviceName: "javascript-review-and-build",
  namespace: "javascript_review_and_build",
  displayName: "JavaScript review and build",
  description:
    "Submits a JavaScript review-and-build record (modules and strictness, async discipline, DOM safety, environment and bundle, tests and red lines) and returns a deterministic JAVASCRIPT_REVIEW_SOUND / JAVASCRIPT_REVIEW_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-file ESM, var and promise-handling checks, with per-check evidence. Audits the declared record; it runs no code.",
  schemaDescription: "The javascript review and build manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    subject: str("Codebase or package under review."),
    modules: obj("Modules and strictness evidence."),
    async: obj("Async discipline evidence."),
    dom: obj("DOM safety evidence."),
    environment: obj("Environment evidence."),
    bundle: obj("Bundle evidence."),
    files: arr("Declared files: {name, esm_module, var_present, unhandled_promise_present, inner_html_with_user_input_present}."),
    tests: obj("Tests evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateJavascriptReviewAndBuild,
  stampFn: stampJavascriptReviewAndBuild
});

const jsonSchemaDesignCheck = manifestAtom({
  serviceName: "json-schema-design-check",
  namespace: "json_schema_design_check",
  displayName: "JSON schema design check",
  description:
    "Submits a JSON schema design record (schema-first boundary, canonical form and number care, versioning, parsing safety and encoding, streaming operations and red lines) and returns a deterministic JSON_SCHEMA_DESIGN_SOUND / JSON_SCHEMA_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-payload schema, version and canonical-coverage checks, with per-check evidence. Audits the declared record; it parses no live payloads.",
  schemaDescription: "The json schema design check manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    artifact: str("Artifact or interface the schema design covers."),
    schema: obj("Schema-first and boundary evidence."),
    writer_reader: obj("Writer/reader contract evidence."),
    payloads: arr("Declared payloads: {name, has_schema, has_sample, has_version_field, money_and_bigint_fields_as_strings, is_hashed_or_signed, canonical_rules_documented}."),
    canonical: obj("Canonical form and number care evidence."),
    versioning: obj("Versioning evidence."),
    parsing: obj("Parsing safety and encoding evidence."),
    streaming_ops: obj("Streaming operations evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateJsonSchemaDesignCheck,
  stampFn: stampJsonSchemaDesignCheck
});

const knowledgeGraphDesign = manifestAtom({
  serviceName: "knowledge-graph-design",
  namespace: "knowledge_graph_design",
  displayName: "Knowledge graph design",
  description:
    "Submits a knowledge-graph design record (schema and modeling, provenance, immutable history, storage and query retrieval, portability and ownership, privacy and red lines) and returns a deterministic KNOWLEDGE_GRAPH_DESIGN_SOUND / KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across six sections, including computed per-assertion provenance and origin-classification coverage checks, with per-check evidence. Audits the declared design; it stores and queries no graph.",
  schemaDescription: "The knowledge graph design manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    graph: str("Knowledge graph being designed."),
    schema: obj("Schema and modeling evidence."),
    provenance: obj("Provenance evidence."),
    assertions: arr("Declared assertions: {name, source_declared, date_declared, confidence_declared, origin_classified}."),
    history: obj("Immutable history evidence."),
    storage: obj("Storage evidence."),
    query: obj("Query and retrieval evidence."),
    portability: obj("Portability and ownership evidence."),
    privacy: obj("Privacy evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateKnowledgeGraphDesign,
  stampFn: stampKnowledgeGraphDesign
});

const localFirstSyncDesign = manifestAtom({
  serviceName: "local-first-sync-design",
  namespace: "local_first_sync_design",
  displayName: "Local-first sync design",
  description:
    "Submits a local-first sync design record (local truth and data model, sync protocol, encryption and keys, conflicts and state UI, testing and quality gates) and returns a deterministic LOCAL_FIRST_SYNC_SOUND / LOCAL_FIRST_SYNC_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-entity merge-semantics and silent-last-write-wins checks, with per-check evidence. Audits the declared design; it syncs nothing.",
  schemaDescription: "The local first sync design manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    app: str("Application the sync design covers."),
    local_truth: obj("Local truth evidence."),
    data_model: obj("Data model evidence."),
    entities: arr("Declared entities: {name, per_field_merge_semantics_declared, stable_id_declared, is_user_prose, silent_last_write_wins_present}."),
    sync_protocol: obj("Sync protocol evidence."),
    encryption: obj("Encryption and keys evidence."),
    personal_data_sync: obj("Personal-data sync evidence (gates the encryption checks)."),
    conflicts: obj("Conflicts evidence."),
    state_ui: obj("State UI evidence."),
    testing: obj("Testing and quality-gate evidence.")
  },
  evaluateFn: evaluateLocalFirstSyncDesign,
  stampFn: stampLocalFirstSyncDesign
});

const localLlmServingSetup = manifestAtom({
  serviceName: "local-llm-serving-setup",
  namespace: "local_llm_serving_setup",
  displayName: "Local LLM serving setup",
  description:
    "Submits a local LLM serving setup record (workload and memory budget, model selection and provenance, serving stack and exposure, performance and operations, fallback chains and evaluation) and returns a deterministic LOCAL_LLM_SERVING_SOUND / LOCAL_LLM_SERVING_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-model budget, pinning, license and evaluation coverage checks, with per-check evidence. Audits the declared setup record; it serves no models.",
  schemaDescription: "The local llm serving setup manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    setup: str("Serving setup being audited."),
    workload: obj("Workload and memory budget evidence."),
    model_selection: obj("Model selection and provenance evidence."),
    models: arr("Declared models: {name, vram_ram_and_context_budget_documented, version_pinned_and_checksum_recorded, license_vetted_for_commercial_use, performance_measured_at_realistic_context, golden_task_eval_recorded}."),
    serving: obj("Serving stack and exposure evidence."),
    performance: obj("Performance evidence."),
    operations: obj("Operations evidence."),
    fallback: obj("Fallback chain evidence."),
    evaluation: obj("Evaluation evidence.")
  },
  evaluateFn: evaluateLocalLlmServingSetup,
  stampFn: stampLocalLlmServingSetup
});

const localVoiceStackEngineeringPack = manifestAtom({
  serviceName: "local-voice-stack-engineering-pack",
  namespace: "local_voice_stack_engineering_pack",
  displayName: "Local voice stack engineering pack",
  description:
    "Submits a local voice-stack engineering record (pipeline and engine selection, cloning consent and ethics, audio engineering and latency, accessibility, testing and quality gates) and returns a deterministic LOCAL_VOICE_STACK_SOUND / LOCAL_VOICE_STACK_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-engine license, golden-evaluation and cloning-consent checks, with per-check evidence. Audits the declared record; it processes no audio.",
  schemaDescription: "The local voice stack engineering pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    stack: str("Voice stack being engineered."),
    pipeline: obj("Pipeline evidence."),
    engine_selection: obj("Engine selection evidence."),
    engines: arr("Declared engines: {name, license_cleared_for_commercial_use, evaluated_on_own_golden_sentences, is_voice_cloning, cloning_consent_recorded}."),
    cloning: obj("Cloning consent and ethics evidence."),
    audio_engineering: obj("Audio engineering evidence."),
    latency: obj("Latency evidence."),
    accessibility: obj("Accessibility evidence."),
    testing: obj("Testing and quality-gate evidence.")
  },
  evaluateFn: evaluateLocalVoiceStackEngineeringPack,
  stampFn: stampLocalVoiceStackEngineeringPack
});

const nativeMobileBuildPlan = manifestAtom({
  serviceName: "native-mobile-build-plan",
  namespace: "native_mobile_build_plan",
  displayName: "Native mobile build plan",
  description:
    "Submits a native mobile build-plan record (device constraints and platform citizenship, offline-first and sync, builds and signing, testing and accessibility, release/store and privacy, red lines) and returns a deterministic NATIVE_MOBILE_BUILD_PLAN_READY / NATIVE_MOBILE_BUILD_PLAN_NOT_READY / INSUFFICIENT_EVIDENCE verdict across six sections, including computed per-permission feature-coverage checks, with per-check evidence. Audits the declared build-plan record; it builds no app and submits nothing to any store.",
  schemaDescription: "The native mobile build plan manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    app: str("Mobile app under build-plan review."),
    constraints: obj("Device-constraint evidence."),
    platform_citizenship: obj("Platform citizenship evidence."),
    permissions: arr("Declared permissions: {name, feature_needing_it}."),
    offline: obj("Offline-first and sync evidence."),
    builds: obj("Builds and signing evidence."),
    testing: obj("Testing and accessibility evidence."),
    release: obj("Release and store evidence."),
    privacy: obj("Privacy evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateNativeMobileBuildPlan,
  stampFn: stampNativeMobileBuildPlan
});

const negotiationPreparationPack = manifestAtom({
  serviceName: "negotiation-preparation-pack",
  namespace: "negotiation_preparation_pack",
  displayName: "Negotiation preparation pack",
  description:
    "Submits a negotiation preparation record (BATNA, reservation price and ZOPA, interests and value creation, improvisation and adaptation, openings/moments/closing and tactics, debrief and anti-pattern red lines) and returns a deterministic NEGOTIATION_PREPARATION_SOUND / NEGOTIATION_PREPARATION_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-issue interest and trade-potential coverage checks, with per-check evidence. Audits the declared preparation record; it negotiates nothing and sets no figures.",
  schemaDescription: "The negotiation preparation pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    negotiation: str("Negotiation being prepared for."),
    batna_and_reservation: obj("BATNA and reservation-price evidence."),
    interests: obj("Interests evidence."),
    value_creation: obj("Value-creation evidence."),
    issues: arr("Declared issues: {name, own_underlying_interest, counterpart_underlying_interest, trade_potential_assessed}."),
    direction: obj("Direction evidence."),
    presence_and_awareness: obj("Presence and awareness evidence."),
    sequence: obj("Sequence evidence."),
    anchoring: obj("Anchoring evidence."),
    tactics: obj("Tactics evidence."),
    learning: obj("Debrief and learning evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateNegotiationPreparationPack,
  stampFn: stampNegotiationPreparationPack
});

const observabilityAndRunbookDesign = manifestAtom({
  serviceName: "observability-and-runbook-design",
  namespace: "observability_and_runbook_design",
  displayName: "Observability and runbook design",
  description:
    "Submits an observability and runbook design record (signals and dashboards, alert design and runbook linkage, runbook content and failure modes, incident flow and postmortem, backups/silent failure and red lines) and returns a deterministic OBSERVABILITY_DESIGN_SOUND / OBSERVABILITY_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-alert and per-failure-mode coverage checks, with per-check evidence. Audits the declared design record; it monitors no live system.",
  schemaDescription: "The observability and runbook design manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    service_name: str("Service under observability design review."),
    signals: obj("Signals and dashboards evidence."),
    alert_design: obj("Alert-design evidence."),
    alerts: arr("Declared alerts: {name, owner, runbook_linked, actionable, symptom_based}."),
    failure_modes: arr("Declared failure modes: {name, runbook_present, symptoms_described, check_steps_present, mitigation_present, escalation_present, recovery_verification_present}."),
    incident: obj("Incident flow and postmortem evidence."),
    resilience: obj("Backups and silent-failure evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateObservabilityAndRunbookDesign,
  stampFn: stampObservabilityAndRunbookDesign
});

const offlineFirstPwaEngineeringPack = manifestAtom({
  serviceName: "offline-first-pwa-engineering-pack",
  namespace: "offline_first_pwa_engineering_pack",
  displayName: "Offline first pwa engineering pack",
  description:
    "Submits an offline-first PWA engineering record (offline-first architecture, service worker discipline, storage engineering, sync and honest state, installability/encryption/UX, testing and quality gates, red lines) and returns a deterministic OFFLINE_FIRST_PWA_SOUND / OFFLINE_FIRST_PWA_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across seven sections, including computed per-core-flow offline-coverage checks, with per-check evidence. Audits the declared engineering record; it builds no PWA and runs no browser test.",
  schemaDescription: "The offline first pwa engineering pack manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    app: str("PWA under engineering review."),
    architecture: obj("Offline-first architecture evidence."),
    core_flows: arr("Declared core flows: {name, works_fully_offline}."),
    service_worker: obj("Service worker discipline evidence."),
    storage: obj("Storage engineering evidence."),
    sync: obj("Sync and honest-state evidence."),
    installability: obj("Installability evidence."),
    encryption: obj("Encryption and UX evidence."),
    testing: obj("Testing and quality-gates evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluateOfflineFirstPwaEngineeringPack,
  stampFn: stampOfflineFirstPwaEngineeringPack
});

const personalFinancialSnapshot = manifestAtom({
  serviceName: "personal-financial-snapshot",
  namespace: "personal_financial_snapshot",
  displayName: "Personal financial snapshot",
  description:
    "Submits a personal financial snapshot record (snapshot completeness, balance-sheet arithmetic, cash-flow and fees arithmetic, lenses and costs, traceability and the advice boundary) and returns a deterministic SNAPSHOT_SOUND / SNAPSHOT_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed row-sum and net-worth arithmetic checks over the declared figures, with per-check evidence. Audits the declared snapshot record; it gives no financial advice, recommendation or projection.",
  schemaDescription: "The personal financial snapshot manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    subject: str("Snapshot subject label."),
    snapshot: obj("Snapshot completeness evidence."),
    figures: obj("Declared headline figures."),
    assets: arr("Declared asset rows: {name, category, amount}."),
    liabilities: arr("Declared liability rows: {name, amount}."),
    fees: arr("Declared fee rows: {name, amount}."),
    lenses: obj("Lens statements (risk, liquidity, tax-efficiency, time horizon)."),
    costs: obj("Costs and drag evidence."),
    traceability: obj("Traceability and advice-boundary evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluatePersonalFinancialSnapshot,
  stampFn: stampPersonalFinancialSnapshot
});

const personalWebPresenceAudit = manifestAtom({
  serviceName: "personal-web-presence-audit",
  namespace: "personal_web_presence_audit",
  displayName: "Personal web presence audit",
  description:
    "Submits a personal web-presence record (hub and spokes, identity facts and structured data, content standards and name SEO, cadence/contact/measurement, red lines) and returns a deterministic PERSONAL_PRESENCE_CONSISTENT / PERSONAL_PRESENCE_INCONSISTENT / INSUFFICIENT_EVIDENCE verdict across five sections, including computed per-spoke and per-profile consistency checks, with per-check evidence. Audits the declared presence record; it fetches nothing and verifies no live page.",
  schemaDescription: "The personal web presence audit manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    person: str("Person whose presence record is audited."),
    hub: obj("Canonical hub evidence."),
    spokes: arr("Declared spokes: {domain, redirects_to_hub_or_purpose_page, title_description_consistent_with_hub}."),
    identity: obj("Identity facts evidence."),
    structured_data: obj("Structured-data evidence."),
    profiles: arr("Declared profiles: {platform, bio_matches_canonical, links_to_hub}."),
    content: obj("Content standards evidence."),
    name_seo: obj("Name-search evidence."),
    cadence: obj("Refresh cadence evidence."),
    contact: obj("Contact-path evidence."),
    measurement: obj("Measurement evidence."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluatePersonalWebPresenceAudit,
  stampFn: stampPersonalWebPresenceAudit
});

const pocDesignKillCriteriaVerdict = manifestAtom({
  serviceName: "poc-design-kill-criteria-verdict",
  namespace: "poc_design_kill_criteria_verdict",
  displayName: "Poc design kill criteria verdict",
  description:
    "Submits a proof-of-concept design record (design premise, criteria-row consistency, timebox window, scope-row consistency, production boundary by design) and returns a deterministic POC_DESIGN_SOUND / POC_DESIGN_NOT_SOUND / INSUFFICIENT_EVIDENCE verdict across five sections, including computed criteria-kind and row-consistency checks over the declared rows and window, with per-check evidence. Audits the declared design record made before the run; it runs no POC and judges no idea's worth.",
  schemaDescription: "The poc design kill criteria verdict manifest (see the atom's SERVICE.md for the field table and row schemas).",
  properties: {
    poc: str("Proof of concept under design review."),
    design: obj("Design premise evidence."),
    criteria: arr("Declared criteria rows: {name, kind, condition_stated, declared_before_run, assesses_house_stack_fit}."),
    timebox: obj("Timebox window evidence."),
    scope_items: arr("Declared scope items: {name, on_critical_path}."),
    red_lines: obj("Red-line evidence.")
  },
  evaluateFn: evaluatePocDesignKillCriteriaVerdict,
  stampFn: stampPocDesignKillCriteriaVerdict
});


const markdownSanitizer = manifestAtom({
  serviceName: "markdown-sanitizer",
  namespace: "markdown_sanitizer",
  displayName: "Markdown sanitizer",
  description:
    "Submit raw markdown text; get the sanitized text back with a per-rule removal report — active blocks (script, style, iframe, object, embed, form) removed whole, raw HTML stripped, comments removed, dangerous link targets (javascript:, data:, vbscript:, file:) neutralized, whitespace tidied. Fenced and inline code are protected; wording is never edited.",
  schemaDescription: "The sanitization payload (see the atom's SERVICE.md for the field table).",
  properties: {
    text: str("Raw markdown text to sanitize."),
    options: obj("Options: {strip_html, strip_images, collapse_blank_lines} (all optional, safe defaults)."),
  },
  evaluateFn: evaluateMarkdownSanitizer,
  stampFn: stampMarkdownSanitizer
});

const tokenEstimator = manifestAtom({
  serviceName: "token-estimator",
  namespace: "token_estimator",
  displayName: "Token estimator",
  description:
    "Submit text or a chat messages list; get a deterministic token estimate with its range, the measured char/word counts, and the method and factor-table version stated on the result. A segment-weighted heuristic for pre-flight budget and context-fit checks — an estimate, never a tokenizer count.",
  schemaDescription: "The estimation payload (see the atom's SERVICE.md for the field table).",
  properties: {
    text: str("Text to estimate (give text or messages, not both)."),
    messages: arr("Chat messages: [{role, content}]."),
    model_family: str("gpt | claude | llama | generic (default generic)."),
  },
  evaluateFn: evaluateTokenEstimator,
  stampFn: stampTokenEstimator
});

const jsonSchemaEnforcer = manifestAtom({
  serviceName: "json-schema-enforcer",
  namespace: "json_schema_enforcer",
  displayName: "JSON schema enforcer",
  description:
    "Submit a JSON payload and a JSON Schema; get a validity verdict with every violation listed by path, rule, expected and found, over a documented schema subset — with any keyword outside the subset named as unsupported, never silently ignored.",
  schemaDescription: "The enforcement payload (see the atom's SERVICE.md for the field table).",
  properties: {
    payload: { description: "The JSON payload under test (any JSON value)." },
    schema: obj("The schema object, over the documented subset."),
  },
  evaluateFn: evaluateJsonSchemaEnforcer,
  stampFn: stampJsonSchemaEnforcer
});

const HANDLERS: Record<string, AtomHandler> = {
  [markdownSanitizer.serviceName]: markdownSanitizer,
  [tokenEstimator.serviceName]: tokenEstimator,
  [jsonSchemaEnforcer.serviceName]: jsonSchemaEnforcer,
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
  [financeToolDesignAdvisory.serviceName]: financeToolDesignAdvisory,
  [forecastConfidenceScoreboard.serviceName]: forecastConfidenceScoreboard,
  [frameworkAdoptionAdr.serviceName]: frameworkAdoptionAdr,
  [frontendImplementation.serviceName]: frontendImplementation,
  [fullStackAppBuildPack.serviceName]: fullStackAppBuildPack,
  [grpcServiceDesign.serviceName]: grpcServiceDesign,
  [homeShortlistCarryingCostComparison.serviceName]: homeShortlistCarryingCostComparison,
  [honestSeoAuditIntentMap.serviceName]: honestSeoAuditIntentMap,
  [javascriptReviewAndBuild.serviceName]: javascriptReviewAndBuild,
  [jsonSchemaDesignCheck.serviceName]: jsonSchemaDesignCheck,
  [knowledgeGraphDesign.serviceName]: knowledgeGraphDesign,
  [localFirstSyncDesign.serviceName]: localFirstSyncDesign,
  [localLlmServingSetup.serviceName]: localLlmServingSetup,
  [localVoiceStackEngineeringPack.serviceName]: localVoiceStackEngineeringPack,
  [productionRustEngineeringPackExpert.serviceName]: productionRustEngineeringPackExpert,
  [quantMathDerivationSanityCheck.serviceName]: quantMathDerivationSanityCheck,
  [releasePackChangelogSealRollback.serviceName]: releasePackChangelogSealRollback,
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
  [localizationReadinessReview.serviceName]: localizationReadinessReview,
  [longFormAuthoringPipeline.serviceName]: longFormAuthoringPipeline,
  [mcpServerDesignAndReview.serviceName]: mcpServerDesignAndReview,
  [meaningFirstTranslationWithToneNote.serviceName]: meaningFirstTranslationWithToneNote,
  [meetingDecisionsAndActionsExtract.serviceName]: meetingDecisionsAndActionsExtract,
  [mlProjectFramingReview.serviceName]: mlProjectFramingReview,
  [multiplatformCoreDesign.serviceName]: multiplatformCoreDesign,
  [nativeMobileBuildPlan.serviceName]: nativeMobileBuildPlan,
  [negotiationPreparationPack.serviceName]: negotiationPreparationPack,
  [networkExposureAudit.serviceName]: networkExposureAudit,
  [observabilityAndRunbookDesign.serviceName]: observabilityAndRunbookDesign,
  [offlineFirstPwaEngineeringPack.serviceName]: offlineFirstPwaEngineeringPack,
  [personalFinancialSnapshot.serviceName]: personalFinancialSnapshot,
  [personalWebPresenceAudit.serviceName]: personalWebPresenceAudit,
  [pocDesignKillCriteriaVerdict.serviceName]: pocDesignKillCriteriaVerdict,
  [portfolioRiskAnalyticsReport.serviceName]: portfolioRiskAnalyticsReport,
  [prdWithTestableAcceptanceCriteria.serviceName]: prdWithTestableAcceptanceCriteria,
  [predictionModelLeakageCalibrationAudit.serviceName]: predictionModelLeakageCalibrationAudit,
  [predictiveMaintenanceFailureRiskAssessment.serviceName]: predictiveMaintenanceFailureRiskAssessment,
  [pricingUnitEconomicsPack.serviceName]: pricingUnitEconomicsPack,
  [processWasteReviewCoaching.serviceName]: processWasteReviewCoaching,
  [productMetricsEventTaxonomyPack.serviceName]: productMetricsEventTaxonomyPack,
  [productionPythonEngineeringPack.serviceName]: productionPythonEngineeringPack,
  [productionPythonEngineeringPackExpert.serviceName]: productionPythonEngineeringPackExpert,
  [productionRustEngineeringPack.serviceName]: productionRustEngineeringPack,
  [pumpConveyorMotorSuitabilityCheck.serviceName]: pumpConveyorMotorSuitabilityCheck,
  [ragRetrievalEvaluationTuning.serviceName]: ragRetrievalEvaluationTuning,
  [reconciledPortfolioPerformanceReport.serviceName]: reconciledPortfolioPerformanceReport,
  [semanticCodeTaintAnalysisReport.serviceName]: semanticCodeTaintAnalysisReport,
  [semanticHtmlReview.serviceName]: semanticHtmlReview,
  [serviceIsolationHardeningReview.serviceName]: serviceIsolationHardeningReview,
  [singleLivingTripItinerary.serviceName]: singleLivingTripItinerary,
  [smartGridDerDesignPack.serviceName]: smartGridDerDesignPack,
  [sourcedPodcastEpisodeProduction.serviceName]: sourcedPodcastEpisodeProduction,
  [sourcedVisualReferenceSearch.serviceName]: sourcedVisualReferenceSearch,
  [sqlSchemaQueryEngineeringPack.serviceName]: sqlSchemaQueryEngineeringPack,
  [statisticalStudyDesignReport.serviceName]: statisticalStudyDesignReport,
  [strictTypescriptEngineeringPack.serviceName]: strictTypescriptEngineeringPack,
  [structuredDecisionMaking.serviceName]: structuredDecisionMaking,
  [structuredRootCauseAnalysis.serviceName]: structuredRootCauseAnalysis,
  [strategyBacktestValidation.serviceName]: strategyBacktestValidation,
  [systemDesignFailureModePack.serviceName]: systemDesignFailureModePack,
  [techStackDecisionMemo.serviceName]: techStackDecisionMemo,
  [technicalDocumentationPack.serviceName]: technicalDocumentationPack,
  [technicalExplainerContentPack.serviceName]: technicalExplainerContentPack,
  [testedAuthorizationPolicyPack.serviceName]: testedAuthorizationPolicyPack,
  [testingStrategyRegressionPack.serviceName]: testingStrategyRegressionPack,
  [uatScenarioSignOffPack.serviceName]: uatScenarioSignOffPack,
  [uxFlowComponentSpecPack.serviceName]: uxFlowComponentSpecPack,
[validatedSimulationScenarioPack.serviceName]: validatedSimulationScenarioPack,
  [vendorEvaluationThreeWayMatchPack.serviceName]: vendorEvaluationThreeWayMatchPack,
  [verifiedPlaceShortlist.serviceName]: verifiedPlaceShortlist,
  [vfdApplicationEngineeringCheck.serviceName]: vfdApplicationEngineeringCheck,
  [voiceNoteNarrationAudio.serviceName]: voiceNoteNarrationAudio,
  [vulnerabilityTriageVerifiedClosure.serviceName]: vulnerabilityTriageVerifiedClosure,
  [zeroKnowledgeClaimAudit.serviceName]: zeroKnowledgeClaimAudit,
  [zeroKnowledgeSystemDesignPack.serviceName]: zeroKnowledgeSystemDesignPack,
  [zeroTrustArchitectureDesignPack.serviceName]: zeroTrustArchitectureDesignPack,
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
