// Full-stack app build pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/full-stack-app-build-pack/src/full_stack_app_build_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  approach: {
    problem_and_data_flow_understood: "boolean",
    user_visible_outcome_defined: "boolean",
    source_of_truth_identified: "boolean",
    contract_defined_first: "boolean",
    data_shape_defined_first: "boolean",
    vertical_slice_before_widening: "boolean",
  },
  slices: [{
    name: "string",
    end_to_end_complete: "boolean",
  }],
  frontend: {
    vanilla_ts_web_components_used: "boolean",
    progressive_enhancement_applied: "boolean",
    dependency_tree_kept_small: "boolean",
    mobile_first_responsive: "boolean",
    viewport_configured: "boolean",
    touch_targets_at_least_44px: "boolean",
    semantic_html_used: "boolean",
    keyboard_navigation_supported: "boolean",
    aria_only_where_needed: "boolean",
    sufficient_contrast: "boolean",
    boundaries_typed_no_any: "boolean",
    undefined_fields_guarded_when_rendering: "boolean",
    framework_bloat_present: "boolean",
  },
  backend: {
    api_contracts_versioned: "boolean",
    input_validated_at_boundary: "boolean",
    handlers_stateless: "boolean",
    idempotency_for_retried_writes: "boolean",
    error_taxonomy_defined: "boolean",
    structured_error_responses: "boolean",
    bare_500_responses_present: "boolean",
    health_endpoint_present: "boolean",
  },
  data: {
    schema_is_source_of_truth: "boolean",
    migrations_forward_only: "boolean",
    migrations_backward_compatible: "boolean",
    parametrized_queries_only: "boolean",
    string_concatenated_sql_present: "boolean",
  },
  security: {
    authn_authz_separated: "boolean",
    least_privilege_enforced: "boolean",
    secrets_via_env_or_secret_store: "boolean",
    secrets_rotatable: "boolean",
    secrets_in_repo_present: "boolean",
    owasp_top10_reviewed: "boolean",
    zero_knowledge_required: "boolean",
    client_side_encryption_applied: "boolean",
    user_held_keys: "boolean",
  },
  testing: {
    unit_tests_for_logic: "boolean",
    integration_tests_for_boundaries: "boolean",
    e2e_critical_path_tested: "boolean",
    tests_target_contract_not_implementation: "boolean",
    tests_deferred_present: "boolean",
    observability_in_place: "boolean",
    graceful_degradation: "boolean",
    stranger_readable_code: "boolean",
  },
  deploy: {
    docker_used_present: "boolean",
    uses_direct_or_platform_native_deploy: "boolean",
    staging_deployed_first: "boolean",
    direct_to_production_used: "boolean",
    direct_to_prod_named_bridge_with_end_date: "boolean",
    github_repo_in_sync_with_deployed: "boolean",
    big_bang_release_present: "boolean",
    premature_optimization_present: "boolean",
  },
};

export const SECTIONS = [
  "approach_and_contracts",
  "frontend",
  "backend_and_data",
  "security",
  "testing_and_quality",
  "deploy_and_delivery",
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
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  slices_count: number | null;
  slices_not_end_to_end: string[] | null;
  slice_end_to_end_coverage: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
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
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [slicesRaw, hasSlices] = getPath(manifest, "slices");
  const slicesIsList = hasSlices && Array.isArray(slicesRaw);
  const rows: unknown[] = slicesIsList ? (slicesRaw as unknown[]) : [];
  const slicesCount: number | null = slicesIsList ? rows.length : null;

  const e2eRows = rows.filter(
    (c) => isPyDict(c) && c["end_to_end_complete"] === true);
  const sliceEndToEndCoverage: number | null =
    slicesIsList && slicesCount !== null && slicesCount > 0
      ? e2eRows.length / slicesCount
      : null;
  const slicesNotEndToEnd: string[] | null = slicesIsList
    ? rows.filter((c) => hasField(c, "end_to_end_complete") &&
        (c as Record<string, unknown>)["end_to_end_complete"] !== true)
        .map(rowName)
    : null;

  // ---- Section 1: approach_and_contracts ----
  boolCheck(results, "approach_and_contracts",
    "problem_and_data_flow_understood", manifest,
    ["approach", "problem_and_data_flow_understood"],
    "approach: the problem and the data flow are understood before writing code");
  boolCheck(results, "approach_and_contracts",
    "user_visible_outcome_defined", manifest,
    ["approach", "user_visible_outcome_defined"],
    "approach: the user-visible outcome is defined");
  boolCheck(results, "approach_and_contracts",
    "source_of_truth_identified", manifest,
    ["approach", "source_of_truth_identified"],
    "approach: the source of truth is identified");
  boolCheck(results, "approach_and_contracts",
    "contract_defined_first", manifest,
    ["approach", "contract_defined_first"],
    "contract-first: the API/interface is defined first; both ends code to the contract");
  boolCheck(results, "approach_and_contracts",
    "data_shape_defined_first", manifest,
    ["approach", "data_shape_defined_first"],
    "contract-first: the data shape is defined first");
  boolCheck(results, "approach_and_contracts",
    "vertical_slice_before_widening", manifest,
    ["approach", "vertical_slice_before_widening"],
    "thin vertical slice: one end-to-end path is shipped before widening");
  check(results, "approach_and_contracts", "slices_declared",
    slicesRaw, slicesIsList,
    slicesIsList && (slicesCount as number) > 0,
    "thin vertical slice: the declared record names its slices — the slices list is present and non-empty");
  const e2ePresent = slicesIsList &&
    rows.every((c) => hasField(c, "end_to_end_complete"));
  check(results, "approach_and_contracts",
    "every_slice_end_to_end", slicesRaw, e2ePresent,
    slicesIsList && (slicesCount as number) > 0 &&
      e2eRows.length === slicesCount,
    "thin vertical slice: every declared slice row declares itself end-to-end complete — UI to API to store and back");

  // ---- Section 2: frontend ----
  boolCheck(results, "frontend",
    "vanilla_ts_web_components_used", manifest,
    ["frontend", "vanilla_ts_web_components_used"],
    "frontend: vanilla TypeScript + Web Components are used — no framework bloat");
  boolCheck(results, "frontend",
    "progressive_enhancement_applied", manifest,
    ["frontend", "progressive_enhancement_applied"],
    "frontend: progressive enhancement is applied");
  boolCheck(results, "frontend",
    "dependency_tree_kept_small", manifest,
    ["frontend", "dependency_tree_kept_small"],
    "frontend: the dependency tree is kept small");
  boolCheck(results, "frontend",
    "mobile_first_responsive", manifest,
    ["frontend", "mobile_first_responsive"],
    "frontend: the layout is mobile-first / responsive by default");
  boolCheck(results, "frontend",
    "viewport_configured", manifest,
    ["frontend", "viewport_configured"],
    "frontend: a proper viewport is configured");
  boolCheck(results, "frontend",
    "touch_targets_at_least_44px", manifest,
    ["frontend", "touch_targets_at_least_44px"],
    "frontend: touch targets are at least 44px — a standing devinfo.dev requirement, declared as a caller attestation");
  boolCheck(results, "frontend",
    "semantic_html_used", manifest,
    ["frontend", "semantic_html_used"],
    "accessibility: semantic HTML is used");
  boolCheck(results, "frontend",
    "keyboard_navigation_supported", manifest,
    ["frontend", "keyboard_navigation_supported"],
    "accessibility: keyboard navigation is supported");
  boolCheck(results, "frontend",
    "aria_only_where_needed", manifest,
    ["frontend", "aria_only_where_needed"],
    "accessibility: ARIA is used only where needed");
  boolCheck(results, "frontend",
    "sufficient_contrast", manifest,
    ["frontend", "sufficient_contrast"],
    "accessibility: contrast is sufficient");
  boolCheck(results, "frontend",
    "boundaries_typed_no_any", manifest,
    ["frontend", "boundaries_typed_no_any"],
    "frontend: the boundaries are typed — unknown is narrowed at the edge; any is never used through");
  boolCheck(results, "frontend",
    "undefined_fields_guarded_when_rendering", manifest,
    ["frontend", "undefined_fields_guarded_when_rendering"],
    "frontend: rendering from KV/JSON guards against undefined fields");
  falseCheck(results, "frontend",
    "no_framework_bloat", manifest,
    ["frontend", "framework_bloat_present"],
    "anti-pattern: no framework-of-the-week for a static page — no framework bloat is present");

  // ---- Section 3: backend_and_data ----
  boolCheck(results, "backend_and_data",
    "api_contracts_versioned", manifest,
    ["backend", "api_contracts_versioned"],
    "backend: API contracts are clear and versioned");
  boolCheck(results, "backend_and_data",
    "input_validated_at_boundary", manifest,
    ["backend", "input_validated_at_boundary"],
    "backend: every input is validated at the boundary; the client is never trusted");
  boolCheck(results, "backend_and_data",
    "handlers_stateless", manifest,
    ["backend", "handlers_stateless"],
    "backend: handlers are stateless");
  boolCheck(results, "backend_and_data",
    "idempotency_for_retried_writes", manifest,
    ["backend", "idempotency_for_retried_writes"],
    "backend: writes that can be retried carry explicit idempotency");
  boolCheck(results, "backend_and_data",
    "error_taxonomy_defined", manifest,
    ["backend", "error_taxonomy_defined"],
    "backend: a real error taxonomy is defined — client vs server vs upstream");
  boolCheck(results, "backend_and_data",
    "structured_error_responses", manifest,
    ["backend", "structured_error_responses"],
    "backend: error responses are structured");
  falseCheck(results, "backend_and_data",
    "no_bare_500_responses", manifest,
    ["backend", "bare_500_responses_present"],
    "backend: no bare 500 responses are present");
  boolCheck(results, "backend_and_data",
    "health_endpoint_present", manifest,
    ["backend", "health_endpoint_present"],
    "backend: a health endpoint (/api/health) is present on every service");
  boolCheck(results, "backend_and_data",
    "schema_is_source_of_truth", manifest,
    ["data", "schema_is_source_of_truth"],
    "data layer: the schema is the source of truth");
  boolCheck(results, "backend_and_data",
    "migrations_forward_only", manifest,
    ["data", "migrations_forward_only"],
    "data layer: migrations are forward-only");
  boolCheck(results, "backend_and_data",
    "migrations_backward_compatible", manifest,
    ["data", "migrations_backward_compatible"],
    "data layer: migrations are backward-compatible (expand/contract)");
  boolCheck(results, "backend_and_data",
    "parametrized_queries_only", manifest,
    ["data", "parametrized_queries_only"],
    "data layer: parametrized queries only");
  falseCheck(results, "backend_and_data",
    "no_string_concatenated_sql", manifest,
    ["data", "string_concatenated_sql_present"],
    "data layer: SQL is never built by string concatenation");

  // ---- Section 4: security ----
  boolCheck(results, "security",
    "authn_authz_separated", manifest,
    ["security", "authn_authz_separated"],
    "security: AuthN and authZ are separate concerns");
  boolCheck(results, "security",
    "least_privilege_enforced", manifest,
    ["security", "least_privilege_enforced"],
    "security: least privilege is enforced");
  boolCheck(results, "security",
    "secrets_via_env_or_secret_store", manifest,
    ["security", "secrets_via_env_or_secret_store"],
    "security: secrets come via environment / secret store");
  boolCheck(results, "security",
    "secrets_rotatable", manifest,
    ["security", "secrets_rotatable"],
    "security: secrets are rotate-able");
  falseCheck(results, "security",
    "no_secrets_in_repo", manifest,
    ["security", "secrets_in_repo_present"],
    "security / anti-pattern: no secrets in the repo — no secrets in code");
  boolCheck(results, "security",
    "owasp_top10_reviewed", manifest,
    ["security", "owasp_top10_reviewed"],
    "security: the OWASP Top 10 is reviewed — injection, broken access control, SSRF, XSS, CSRF");
  gatedBoolCheck(results, "security",
    "client_side_encryption_applied", manifest,
    ["security", "zero_knowledge_required"],
    ["security", "client_side_encryption_applied"],
    "security: where the product calls for zero-knowledge, data is encrypted client-side and stored as ciphertext",
    "zero-knowledge posture not required by the product");
  gatedBoolCheck(results, "security",
    "user_held_keys", manifest,
    ["security", "zero_knowledge_required"],
    ["security", "user_held_keys"],
    "security: where the product calls for zero-knowledge, keys are user-held",
    "zero-knowledge posture not required by the product");

  // ---- Section 5: testing_and_quality ----
  boolCheck(results, "testing_and_quality",
    "unit_tests_for_logic", manifest,
    ["testing", "unit_tests_for_logic"],
    "testing: logic is unit-tested");
  boolCheck(results, "testing_and_quality",
    "integration_tests_for_boundaries", manifest,
    ["testing", "integration_tests_for_boundaries"],
    "testing: boundaries are integration-tested");
  boolCheck(results, "testing_and_quality",
    "e2e_critical_path_tested", manifest,
    ["testing", "e2e_critical_path_tested"],
    "testing: the critical path is tested end-to-end");
  boolCheck(results, "testing_and_quality",
    "tests_target_contract_not_implementation", manifest,
    ["testing", "tests_target_contract_not_implementation"],
    "testing: tests target the contract, not the implementation");
  falseCheck(results, "testing_and_quality",
    "no_tests_deferred", manifest,
    ["testing", "tests_deferred_present"],
    "anti-pattern: tests are not deferred — no \"we'll add tests later\"");
  boolCheck(results, "testing_and_quality",
    "observability_in_place", manifest,
    ["testing", "observability_in_place"],
    "definition of done: the build is observable");
  boolCheck(results, "testing_and_quality",
    "graceful_degradation", manifest,
    ["testing", "graceful_degradation"],
    "definition of done: the build degrades gracefully");
  boolCheck(results, "testing_and_quality",
    "stranger_readable_code", manifest,
    ["testing", "stranger_readable_code"],
    "definition of done: a stranger could read the code");

  // ---- Section 6: deploy_and_delivery ----
  falseCheck(results, "deploy_and_delivery",
    "no_docker_used", manifest,
    ["deploy", "docker_used_present"],
    "deploy: no Docker is used");
  boolCheck(results, "deploy_and_delivery",
    "uses_direct_or_platform_native_deploy", manifest,
    ["deploy", "uses_direct_or_platform_native_deploy"],
    "deploy: the deploy method is direct Python (venv/pip/PYTHONPATH), systemd, or platform-native");
  boolCheck(results, "deploy_and_delivery",
    "staging_deployed_first", manifest,
    ["deploy", "staging_deployed_first"],
    "deploy: staging comes first");
  gatedBoolCheck(results, "deploy_and_delivery",
    "direct_to_prod_named_bridge_with_end_date", manifest,
    ["deploy", "direct_to_production_used"],
    ["deploy", "direct_to_prod_named_bridge_with_end_date"],
    "deploy: direct-to-production is used only as a named bridge with an end date",
    "no direct-to-production deploy declared");
  boolCheck(results, "deploy_and_delivery",
    "github_repo_in_sync_with_deployed", manifest,
    ["deploy", "github_repo_in_sync_with_deployed"],
    "deploy: the GitHub repo is kept in sync with what's actually deployed");
  falseCheck(results, "deploy_and_delivery",
    "no_big_bang_release", manifest,
    ["deploy", "big_bang_release_present"],
    "anti-pattern: no big-bang features with no vertical slice");
  falseCheck(results, "deploy_and_delivery",
    "no_premature_optimization", manifest,
    ["deploy", "premature_optimization_present"],
    "anti-pattern: no optimizing before measuring");

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
    verdict = "FULL_STACK_BUILD_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "FULL_STACK_BUILD_SOUND";
  }

  const computedNames = [
    "slices_declared",
    "every_slice_end_to_end",
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
    service: "full-stack-app-build-pack",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    slices_count: slicesCount,
    slices_not_end_to_end: slicesNotEndToEnd,
    slice_end_to_end_coverage: fmt6(sliceEndToEndCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FULL STACK APP BUILD PACK",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
