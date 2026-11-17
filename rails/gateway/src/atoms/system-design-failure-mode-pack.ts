// System design failure mode pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/system-design-failure-mode-pack/src/system_design_failure_mode_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  design_name: "string",
  design_context: {
    requirement_stated: "boolean",
    data_flow_described: "boolean",
    analysis_performed_before_build: "boolean",
    component_boundaries_clear: "boolean",
    single_responsibility_per_component_declared: "boolean",
    loose_coupling_declared: "boolean",
    layer_failure_independence_declared: "boolean",
  },
  components: [{
    component_id: "string",
    responsibility: "string",
    contract_declared: "boolean",
  }],
  failure_modes: [{
    failure_id: "string",
    component_id: "string",
    failure_mode: "string",
    effect: "string",
    severity: "number",
    occurrence: "number",
    detection: "number",
    rpn_declared: "number",
    mitigation_id: "string",
  }],
  mitigations: [{
    mitigation_id: "string",
    description: "string",
    residual_risk_stated: "boolean",
  }],
  mitigation_work: {
    mitigations_considered_before_build: "boolean",
    residual_risk_acceptance_stated: "boolean",
  },
  state_and_reliability: {
    source_of_truth_identified: "boolean",
    distributed_state_minimized_declared: "boolean",
    idempotency_for_retryable_operations_declared: "boolean",
    cap_tradeoffs_stated_explicitly: "boolean",
    timeouts_declared: "boolean",
    retries_with_jitter_declared: "boolean",
    circuit_breakers_declared: "boolean",
    graceful_degradation_declared: "boolean",
    readiness_vs_liveness_distinguished: "boolean",
    slow_unreliable_work_behind_queue_declared: "boolean",
  },
  queues: {
    queues_used: "boolean",
    at_least_once_delivery_with_idempotent_consumers_declared: "boolean",
    queue_backpressure_declared: "boolean",
    dead_letter_handling_declared: "boolean",
  },
  observability_scaling_security: {
    structured_logs_declared: "boolean",
    metrics_declared: "boolean",
    traces_declared: "boolean",
    bottleneck_identified_before_scaling: "boolean",
    measure_before_scaling_declared: "boolean",
    stateless_horizontal_scaling_where_scaled_declared: "boolean",
    zero_trust_boundaries_declared: "boolean",
    least_privilege_declared: "boolean",
    secrets_management_declared: "boolean",
    external_trust_boundary_stated: "boolean",
  },
  caching: {
    caching_used: "boolean",
    cache_invalidation_stated: "boolean",
  },
  red_lines: {
    distributed_monolith_present: "boolean",
    shared_mutable_state_present: "boolean",
    retries_without_idempotency_or_backpressure_present: "boolean",
    design_without_observability_present: "boolean",
    premature_microservices_present: "boolean",
    strong_consistency_assumed_without_tradeoff_present: "boolean",
  },
};

export const SECTIONS = [
  "design_framing_and_boundaries",
  "component_inventory",
  "failure_mode_rows",
  "mitigation_coverage",
  "state_reliability_and_queues",
  "observability_scaling_and_security",
  "red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  design_name: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  failure_mode_components_count: number | null;
  failure_modes_count: number | null;
  failure_mode_mitigations_count: number | null;
  duplicate_failure_mode_component_ids: string[] | null;
  duplicate_failure_mode_ids: string[] | null;
  duplicate_failure_mode_mitigation_ids: string[] | null;
  failure_mode_components_without_responsibility: string[] | null;
  failure_mode_components_without_contract: string[] | null;
  failure_modes_with_unknown_component_reference: string[] | null;
  failure_modes_without_description: string[] | null;
  failure_modes_without_effect: string[] | null;
  failure_modes_with_nonpositive_rating: string[] | null;
  failure_modes_with_rpn_mismatch: string[] | null;
  failure_mode_components_without_failure_mode: string[] | null;
  failure_mode_mitigations_without_description: string[] | null;
  failure_mode_mitigations_without_residual_risk: string[] | null;
  failure_modes_with_unknown_mitigation_reference: string[] | null;
  component_contract_ratio: string | null;
  component_failure_coverage_ratio: string | null;
  rpn_recompute_ratio: string | null;
  mitigation_resolution_ratio: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

const RATING_FIELDS = ["severity", "occurrence", "detection"];
const RPN_FIELDS = ["severity", "occurrence", "detection", "rpn_declared"];

function ratingsPresent(c: unknown): boolean {
  return RATING_FIELDS.every((f) => hasField(c, f));
}

function ratingsOk(c: unknown): boolean {
  if (!isPyDict(c)) return false;
  return RATING_FIELDS.every((f) => isNumber(c[f]) && (c[f] as number) > 0);
}

function rpnPresent(c: unknown): boolean {
  return RPN_FIELDS.every((f) => hasField(c, f));
}

function rpnOk(c: unknown): boolean {
  if (!isPyDict(c)) return false;
  return isNumber(c["severity"]) && isNumber(c["occurrence"]) &&
    isNumber(c["detection"]) && isNumber(c["rpn_declared"]) &&
    c["rpn_declared"] ===
      (c["severity"] as number) * (c["occurrence"] as number) *
        (c["detection"] as number);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [componentsRaw, hasComponents] = getPath(manifest, "components");
  const compIsList = hasComponents && Array.isArray(componentsRaw);
  const compRows: unknown[] = compIsList ? (componentsRaw as unknown[]) : [];
  const compCount: number | null = compIsList ? compRows.length : null;
  const compIds = idsOf(compRows, "component_id");

  const [failuresRaw, hasFailures] = getPath(manifest, "failure_modes");
  const failIsList = hasFailures && Array.isArray(failuresRaw);
  const failRows: unknown[] = failIsList ? (failuresRaw as unknown[]) : [];
  const failCount: number | null = failIsList ? failRows.length : null;
  const failCompIds = idsOf(failRows, "component_id");

  const [mitigationsRaw, hasMitigations] = getPath(manifest, "mitigations");
  const mitIsList = hasMitigations && Array.isArray(mitigationsRaw);
  const mitRows: unknown[] = mitIsList ? (mitigationsRaw as unknown[]) : [];
  const mitCount: number | null = mitIsList ? mitRows.length : null;
  const mitIds = idsOf(mitRows, "mitigation_id");

  const duplicateComponentIds: string[] | null = compIsList
    ? duplicates(compRows, "component_id") : null;
  const duplicateFailureIds: string[] | null = failIsList
    ? duplicates(failRows, "failure_id") : null;
  const duplicateMitigationIds: string[] | null = mitIsList
    ? duplicates(mitRows, "mitigation_id") : null;

  const compsWithoutResp: string[] | null = compIsList
    ? compRows.filter((c) => hasField(c, "responsibility") &&
        !nonemptyStr((c as Record<string, unknown>)["responsibility"]))
        .map((c) => rowName(c, "component_id"))
    : null;
  const compsWithoutContract: string[] | null = compIsList
    ? compRows.filter((c) => hasField(c, "contract_declared") &&
        (c as Record<string, unknown>)["contract_declared"] !== true)
        .map((c) => rowName(c, "component_id"))
    : null;
  const failsUnknownComp: string[] | null = failIsList && compIsList
    ? failRows.filter((c) => hasField(c, "component_id") &&
        !compIds.includes((c as Record<string, unknown>)["component_id"] as string))
        .map((c) => rowName(c, "failure_id"))
    : null;
  const failsWithoutMode: string[] | null = failIsList
    ? failRows.filter((c) => hasField(c, "failure_mode") &&
        !nonemptyStr((c as Record<string, unknown>)["failure_mode"]))
        .map((c) => rowName(c, "failure_id"))
    : null;
  const failsWithoutEffect: string[] | null = failIsList
    ? failRows.filter((c) => hasField(c, "effect") &&
        !nonemptyStr((c as Record<string, unknown>)["effect"]))
        .map((c) => rowName(c, "failure_id"))
    : null;
  const failsNonpositive: string[] | null = failIsList
    ? failRows.filter((c) => ratingsPresent(c) && !ratingsOk(c))
        .map((c) => rowName(c, "failure_id"))
    : null;
  const failsRpnMismatch: string[] | null = failIsList
    ? failRows.filter((c) => rpnPresent(c) && !rpnOk(c))
        .map((c) => rowName(c, "failure_id"))
    : null;
  let compsWithoutFailure: string[] | null = null;
  if (compIsList && failIsList) {
    compsWithoutFailure = [];
    for (const cid of compIds) {
      if (!failCompIds.includes(cid) && !compsWithoutFailure.includes(cid)) {
        compsWithoutFailure.push(cid);
      }
    }
  }
  const mitsWithoutDesc: string[] | null = mitIsList
    ? mitRows.filter((c) => hasField(c, "description") &&
        !nonemptyStr((c as Record<string, unknown>)["description"]))
        .map((c) => rowName(c, "mitigation_id"))
    : null;
  const mitsWithoutResidual: string[] | null = mitIsList
    ? mitRows.filter((c) => hasField(c, "residual_risk_stated") &&
        (c as Record<string, unknown>)["residual_risk_stated"] !== true)
        .map((c) => rowName(c, "mitigation_id"))
    : null;
  const failsUnknownMit: string[] | null = failIsList && mitIsList
    ? failRows.filter((c) => hasField(c, "mitigation_id") &&
        !mitIds.includes((c as Record<string, unknown>)["mitigation_id"] as string))
        .map((c) => rowName(c, "failure_id"))
    : null;

  const compContractRatio: number | null =
    compIsList && compCount !== null && compCount > 0
      ? compRows.filter((c) => isPyDict(c) && c["contract_declared"] === true).length / compCount
      : null;
  const compCoverageRatio: number | null =
    compIsList && failIsList && compCount !== null && compCount > 0
      ? compIds.filter((s) => failCompIds.includes(s)).length / compCount
      : null;
  const rpnRatio: number | null =
    failIsList && failCount !== null && failCount > 0
      ? failRows.filter((c) => rpnOk(c)).length / failCount
      : null;
  const mitResolutionRatio: number | null =
    failIsList && mitIsList && failCount !== null && failCount > 0
      ? failRows.filter((c) => hasField(c, "mitigation_id") &&
          mitIds.includes((c as Record<string, unknown>)["mitigation_id"] as string)).length / failCount
      : null;

  const S1 = "design_framing_and_boundaries";
  boolCheck(results, S1, "failure_mode_pack_requirement_stated", manifest,
    ["design_context", "requirement_stated"],
    "framing: the requirement the design must meet is stated — design starts from the requirement, not the happy path");
  boolCheck(results, S1, "failure_mode_pack_data_flow_described", manifest,
    ["design_context", "data_flow_described"],
    "framing: the design's data flow is described — the design is framed from its data flow");
  boolCheck(results, S1, "failure_mode_pack_analysis_performed_before_build", manifest,
    ["design_context", "analysis_performed_before_build"],
    "framing / prospective gate: this failure-mode analysis was performed before the design was built — it is prospective, not a retrospective on an incident");
  boolCheck(results, S1, "failure_mode_pack_component_boundaries_clear", manifest,
    ["design_context", "component_boundaries_clear"],
    "boundaries: clear boundaries between the design's components are declared");
  boolCheck(results, S1, "failure_mode_pack_single_responsibility_per_component_declared", manifest,
    ["design_context", "single_responsibility_per_component_declared"],
    "boundaries: a single responsibility for each component is declared");
  boolCheck(results, S1, "failure_mode_pack_loose_coupling_declared", manifest,
    ["design_context", "loose_coupling_declared"],
    "boundaries: loose coupling between components is declared");
  boolCheck(results, S1, "failure_mode_pack_layer_failure_independence_declared", manifest,
    ["design_context", "layer_failure_independence_declared"],
    "boundaries: each layer or component is declared to fail independently of the others");

  const S2 = "component_inventory";
  check(results, S2, "failure_mode_pack_components_list_declared", componentsRaw,
    compIsList, compIsList && compCount !== null && compCount > 0,
    "components: the declared record names its components — the list is present and names at least one component; an absent list is missing evidence and an empty list declares no design at all");
  const compIdPresent = compIsList && compRows.every((c) => hasField(c, "component_id"));
  check(results, S2, "every_failure_mode_pack_component_id_unique", componentsRaw,
    compIdPresent,
    compIsList && duplicateComponentIds !== null && duplicateComponentIds.length === 0,
    "components: no declared component_id is owned by more than one row");
  const respPresent = compIsList && compRows.every((c) => hasField(c, "responsibility"));
  check(results, S2, "every_failure_mode_pack_component_responsibility_declared", componentsRaw,
    respPresent,
    compIsList && compRows.every((c) => isPyDict(c) && nonemptyStr(c["responsibility"])),
    "components: every declared component declares a non-empty responsibility — single responsibility, named per component");
  const contractPresent = compIsList && compRows.every((c) => hasField(c, "contract_declared"));
  check(results, S2, "every_failure_mode_pack_component_contract_declared", componentsRaw,
    contractPresent,
    compIsList && compRows.every((c) => isPyDict(c) && c["contract_declared"] === true),
    "components: every declared component declares a clear contract with the components it interacts with");

  const S3 = "failure_mode_rows";
  check(results, S3, "failure_mode_pack_failure_modes_list_declared", failuresRaw,
    failIsList, failIsList && failCount !== null && failCount > 0,
    "failure modes: the declared record names its failure-mode rows — the list is present and names at least one failure mode; an absent list is missing evidence and an empty list declares no failure-mode analysis at all");
  const failIdPresent = failIsList && failRows.every((c) => hasField(c, "failure_id"));
  check(results, S3, "every_failure_mode_pack_failure_id_unique", failuresRaw,
    failIdPresent,
    failIsList && duplicateFailureIds !== null && duplicateFailureIds.length === 0,
    "failure modes: no declared failure_id is owned by more than one row");
  const compRefPresent = failIsList && compIsList &&
    failRows.every((c) => hasField(c, "component_id"));
  check(results, S3, "every_failure_mode_pack_failure_component_referenced", failuresRaw,
    compRefPresent,
    failIsList && compIsList &&
      failRows.every((c) => hasField(c, "component_id") &&
        compIds.includes((c as Record<string, unknown>)["component_id"] as string)),
    "failure modes / gate: every declared failure mode names a component_id that is one of the declared components");
  const modePresent = failIsList && failRows.every((c) => hasField(c, "failure_mode"));
  check(results, S3, "every_failure_mode_pack_failure_mode_description_declared", failuresRaw,
    modePresent,
    failIsList && failRows.every((c) => isPyDict(c) && nonemptyStr(c["failure_mode"])),
    "failure modes: every declared row declares a non-empty failure-mode description");
  const effectPresent = failIsList && failRows.every((c) => hasField(c, "effect"));
  check(results, S3, "every_failure_mode_pack_failure_effect_declared", failuresRaw,
    effectPresent,
    failIsList && failRows.every((c) => isPyDict(c) && nonemptyStr(c["effect"])),
    "failure modes: every declared row declares a non-empty effect of that failure");
  const ratingsPresentAll = failIsList && failRows.every((c) => ratingsPresent(c));
  check(results, S3, "every_failure_mode_pack_failure_ratings_positive", failuresRaw,
    ratingsPresentAll,
    failIsList && failRows.every((c) => ratingsOk(c)),
    "failure modes: every declared row declares severity, occurrence and detection ratings, each a positive number — positivity only; no rating scale is imposed by this atom");
  const rpnPresentAll = failIsList && failRows.every((c) => rpnPresent(c));
  check(results, S3, "every_failure_mode_pack_failure_rpn_recomputes", failuresRaw,
    rpnPresentAll,
    failIsList && failRows.every((c) => rpnOk(c)),
    "failure modes / gate: every declared row's rpn_declared recomputes exactly as its declared severity x occurrence x detection — declared arithmetic only; no RPN cutoff is imposed");
  const coveragePresent = compIsList && failIsList &&
    compRows.every((c) => hasField(c, "component_id")) &&
    failRows.every((c) => hasField(c, "component_id"));
  check(results, S3, "every_failure_mode_pack_component_covered_by_failure_mode", failuresRaw,
    coveragePresent,
    coveragePresent && compsWithoutFailure !== null && compsWithoutFailure.length === 0,
    "failure modes: every declared component is covered by at least one declared failure mode — the analysis covers the whole declared design, not part of it");

  const S4 = "mitigation_coverage";
  boolCheck(results, S4, "failure_mode_pack_mitigations_considered_before_build", manifest,
    ["mitigation_work", "mitigations_considered_before_build"],
    "mitigations: mitigations for the declared failure modes were considered before the design was built");
  boolCheck(results, S4, "failure_mode_pack_residual_risk_acceptance_stated", manifest,
    ["mitigation_work", "residual_risk_acceptance_stated"],
    "mitigations: how the residual risk remaining after mitigation is accepted or carried is stated");
  check(results, S4, "failure_mode_pack_mitigations_list_declared", mitigationsRaw,
    mitIsList, mitIsList && mitCount !== null && mitCount > 0,
    "mitigations: the declared record names its mitigation rows — the list is present and names at least one mitigation; an absent list is missing evidence and an empty list declares no mitigations at all");
  const mitIdPresent = mitIsList && mitRows.every((c) => hasField(c, "mitigation_id"));
  check(results, S4, "every_failure_mode_pack_mitigation_id_unique", mitigationsRaw,
    mitIdPresent,
    mitIsList && duplicateMitigationIds !== null && duplicateMitigationIds.length === 0,
    "mitigations: no declared mitigation_id is owned by more than one row");
  const descPresent = mitIsList && mitRows.every((c) => hasField(c, "description"));
  check(results, S4, "every_failure_mode_pack_mitigation_description_declared", mitigationsRaw,
    descPresent,
    mitIsList && mitRows.every((c) => isPyDict(c) && nonemptyStr(c["description"])),
    "mitigations: every declared mitigation declares a non-empty description");
  const mitRefPresent = failIsList && mitIsList &&
    failRows.every((c) => hasField(c, "mitigation_id"));
  check(results, S4, "every_failure_mode_pack_failure_mitigation_referenced", failuresRaw,
    mitRefPresent,
    failIsList && mitIsList &&
      failRows.every((c) => hasField(c, "mitigation_id") &&
        mitIds.includes((c as Record<string, unknown>)["mitigation_id"] as string)),
    "mitigations / gate: every declared failure mode names a mitigation_id that is one of the declared mitigations");
  const residualPresent = mitIsList && mitRows.every((c) => hasField(c, "residual_risk_stated"));
  check(results, S4, "every_failure_mode_pack_mitigation_residual_risk_stated", mitigationsRaw,
    residualPresent,
    mitIsList && mitRows.every((c) => isPyDict(c) && c["residual_risk_stated"] === true),
    "mitigations: every declared mitigation declares the residual risk remaining after it");

  const S5 = "state_reliability_and_queues";
  boolCheck(results, S5, "failure_mode_pack_source_of_truth_identified", manifest,
    ["state_and_reliability", "source_of_truth_identified"],
    "state: exactly where the source of truth lives is identified");
  boolCheck(results, S5, "failure_mode_pack_distributed_state_minimized_declared", manifest,
    ["state_and_reliability", "distributed_state_minimized_declared"],
    "state: distributed state is declared minimised — a single store is preferred over premature distribution");
  boolCheck(results, S5, "failure_mode_pack_idempotency_for_retryable_operations_declared", manifest,
    ["state_and_reliability", "idempotency_for_retryable_operations_declared"],
    "state / reliability: idempotency is declared for anything that can be retried");
  boolCheck(results, S5, "failure_mode_pack_cap_tradeoffs_stated_explicitly", manifest,
    ["state_and_reliability", "cap_tradeoffs_stated_explicitly"],
    "state: CAP trade-offs are stated explicitly rather than strong consistency being assumed for free");
  boolCheck(results, S5, "failure_mode_pack_timeouts_declared", manifest,
    ["state_and_reliability", "timeouts_declared"],
    "reliability: timeouts are declared for partial failure");
  boolCheck(results, S5, "failure_mode_pack_retries_with_jitter_declared", manifest,
    ["state_and_reliability", "retries_with_jitter_declared"],
    "reliability: retries with jitter are declared for partial failure");
  boolCheck(results, S5, "failure_mode_pack_circuit_breakers_declared", manifest,
    ["state_and_reliability", "circuit_breakers_declared"],
    "reliability: circuit breakers are declared for partial failure");
  boolCheck(results, S5, "failure_mode_pack_graceful_degradation_declared", manifest,
    ["state_and_reliability", "graceful_degradation_declared"],
    "reliability: graceful degradation is declared for partial failure");
  boolCheck(results, S5, "failure_mode_pack_readiness_vs_liveness_distinguished", manifest,
    ["state_and_reliability", "readiness_vs_liveness_distinguished"],
    "reliability: health endpoints distinguish readiness from liveness");
  boolCheck(results, S5, "failure_mode_pack_slow_unreliable_work_behind_queue_declared", manifest,
    ["state_and_reliability", "slow_unreliable_work_behind_queue_declared"],
    "queues: slow or unreliable work is declared to sit behind a queue");
  gatedBoolCheck(results, S5,
    "failure_mode_pack_queue_delivery_semantics_declared_where_queues_used", manifest,
    ["queues", "queues_used"],
    ["queues", "at_least_once_delivery_with_idempotent_consumers_declared"],
    "queues: at-least-once delivery with idempotent consumers is declared for the queues used",
    "no queue use declared");
  gatedBoolCheck(results, S5,
    "failure_mode_pack_queue_backpressure_declared_where_queues_used", manifest,
    ["queues", "queues_used"],
    ["queues", "queue_backpressure_declared"],
    "queues: backpressure is declared for the queues used",
    "no queue use declared");
  gatedBoolCheck(results, S5,
    "failure_mode_pack_dead_letter_handling_declared_where_queues_used", manifest,
    ["queues", "queues_used"],
    ["queues", "dead_letter_handling_declared"],
    "queues: dead-letter handling is declared for the queues used",
    "no queue use declared");

  const S6 = "observability_scaling_and_security";
  boolCheck(results, S6, "failure_mode_pack_structured_logs_declared", manifest,
    ["observability_scaling_security", "structured_logs_declared"],
    "observability: structured logs are declared from day one");
  boolCheck(results, S6, "failure_mode_pack_metrics_declared", manifest,
    ["observability_scaling_security", "metrics_declared"],
    "observability: metrics are declared from day one");
  boolCheck(results, S6, "failure_mode_pack_traces_declared", manifest,
    ["observability_scaling_security", "traces_declared"],
    "observability: traces are declared from day one");
  boolCheck(results, S6, "failure_mode_pack_bottleneck_identified_before_scaling", manifest,
    ["observability_scaling_security", "bottleneck_identified_before_scaling"],
    "scaling: the bottleneck is identified — scaling targets the bottleneck, not everything");
  boolCheck(results, S6, "failure_mode_pack_measure_before_scaling_declared", manifest,
    ["observability_scaling_security", "measure_before_scaling_declared"],
    "scaling: measurement before scaling is declared");
  boolCheck(results, S6, "failure_mode_pack_stateless_horizontal_scaling_where_scaled_declared", manifest,
    ["observability_scaling_security", "stateless_horizontal_scaling_where_scaled_declared"],
    "scaling: services that scale are declared stateless and scaling horizontally");
  boolCheck(results, S6, "failure_mode_pack_zero_trust_boundaries_declared", manifest,
    ["observability_scaling_security", "zero_trust_boundaries_declared"],
    "security: zero-trust boundaries are declared");
  boolCheck(results, S6, "failure_mode_pack_least_privilege_declared", manifest,
    ["observability_scaling_security", "least_privilege_declared"],
    "security: least privilege is declared");
  boolCheck(results, S6, "failure_mode_pack_secrets_management_declared", manifest,
    ["observability_scaling_security", "secrets_management_declared"],
    "security: real secrets management is declared");
  boolCheck(results, S6, "failure_mode_pack_external_trust_boundary_stated", manifest,
    ["observability_scaling_security", "external_trust_boundary_stated"],
    "security: where the external trust boundary sits is stated — the skill's topology keeps it at the tunnel, not the app");
  gatedBoolCheck(results, S6,
    "failure_mode_pack_cache_invalidation_stated_where_caching_used", manifest,
    ["caching", "caching_used"],
    ["caching", "cache_invalidation_stated"],
    "scaling: cache invalidation is stated honestly for the caching used — caching is deliberate and its invalidation is named",
    "no caching use declared");

  const S7 = "red_lines";
  falseCheck(results, S7, "failure_mode_pack_free_of_distributed_monolith", manifest,
    ["red_lines", "distributed_monolith_present"],
    "red line: no distributed monolith is present in the record — the anti-pattern the skill refuses");
  falseCheck(results, S7, "failure_mode_pack_free_of_shared_mutable_state", manifest,
    ["red_lines", "shared_mutable_state_present"],
    "red line: no shared mutable state is present in the record — the anti-pattern the skill refuses");
  falseCheck(results, S7, "failure_mode_pack_free_of_retries_without_idempotency_or_backpressure", manifest,
    ["red_lines", "retries_without_idempotency_or_backpressure_present"],
    "red line: no retries without idempotency or backpressure are present in the record — the anti-pattern the skill refuses");
  falseCheck(results, S7, "failure_mode_pack_free_of_design_without_observability", manifest,
    ["red_lines", "design_without_observability_present"],
    "red line: no design without observability is present in the record — the anti-pattern the skill refuses");
  falseCheck(results, S7, "failure_mode_pack_free_of_premature_microservices", manifest,
    ["red_lines", "premature_microservices_present"],
    "red line: no microservices adopted before the monolith hurts are present in the record — the anti-pattern the skill refuses");
  falseCheck(results, S7, "failure_mode_pack_free_of_strong_consistency_assumed_without_tradeoff", manifest,
    ["red_lines", "strong_consistency_assumed_without_tradeoff_present"],
    "red line: no strong consistency assumed for free, without its trade-off stated, is present in the record");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "FAILURE_MODE_PACK_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "FAILURE_MODE_PACK_SOUND";
  }

  const computedNames = [
    "failure_mode_pack_components_list_declared",
    "every_failure_mode_pack_component_id_unique",
    "every_failure_mode_pack_component_responsibility_declared",
    "every_failure_mode_pack_component_contract_declared",
    "failure_mode_pack_failure_modes_list_declared",
    "every_failure_mode_pack_failure_id_unique",
    "every_failure_mode_pack_failure_component_referenced",
    "every_failure_mode_pack_failure_mode_description_declared",
    "every_failure_mode_pack_failure_effect_declared",
    "every_failure_mode_pack_failure_ratings_positive",
    "every_failure_mode_pack_failure_rpn_recomputes",
    "every_failure_mode_pack_component_covered_by_failure_mode",
    "failure_mode_pack_mitigations_list_declared",
    "every_failure_mode_pack_mitigation_id_unique",
    "every_failure_mode_pack_mitigation_description_declared",
    "every_failure_mode_pack_failure_mitigation_referenced",
    "every_failure_mode_pack_mitigation_residual_risk_stated",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "system-design-failure-mode-pack",
    atom_version: "0.1.0",
    design_name: manifest["design_name"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    failure_mode_components_count: compCount,
    failure_modes_count: failCount,
    failure_mode_mitigations_count: mitCount,
    duplicate_failure_mode_component_ids: duplicateComponentIds,
    duplicate_failure_mode_ids: duplicateFailureIds,
    duplicate_failure_mode_mitigation_ids: duplicateMitigationIds,
    failure_mode_components_without_responsibility: compsWithoutResp,
    failure_mode_components_without_contract: compsWithoutContract,
    failure_modes_with_unknown_component_reference: failsUnknownComp,
    failure_modes_without_description: failsWithoutMode,
    failure_modes_without_effect: failsWithoutEffect,
    failure_modes_with_nonpositive_rating: failsNonpositive,
    failure_modes_with_rpn_mismatch: failsRpnMismatch,
    failure_mode_components_without_failure_mode: compsWithoutFailure,
    failure_mode_mitigations_without_description: mitsWithoutDesc,
    failure_mode_mitigations_without_residual_risk: mitsWithoutResidual,
    failure_modes_with_unknown_mitigation_reference: failsUnknownMit,
    component_contract_ratio: fmt6(compContractRatio),
    component_failure_coverage_ratio: fmt6(compCoverageRatio),
    rpn_recompute_ratio: fmt6(rpnRatio),
    mitigation_resolution_ratio: fmt6(mitResolutionRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SYSTEM DESIGN FAILURE MODE PACK",
    `design_name: ${pyStr(verdict.design_name ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
