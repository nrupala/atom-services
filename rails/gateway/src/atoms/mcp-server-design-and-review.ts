// MCP server design and review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/mcp-server-design-and-review/src/mcp_server_design_and_review.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  server: "string",
  tool_design: {
    names_are_verb_noun: "boolean",
    typed_json_schemas: "boolean",
    descriptions_state_when_to_use: "boolean",
    errors_teach_fix: "boolean",
    one_job_per_tool: "boolean",
    god_tools_present: "boolean",
  },
  budget: {
    smallest_set_covers_job: "boolean",
    related_operations_grouped: "boolean",
  },
  tools: [{
    name: "string",
    operation: "string",
    has_typed_schema: "boolean",
    single_job: "boolean",
    has_negative_test: "boolean",
    approval_or_scope_gate_present: "boolean",
  }],
  transport: {
    transport_matches_deployment: "boolean",
    handlers_stateless_where_possible: "boolean",
    boundary_validation_applied: "boolean",
  },
  auth: {
    remote_transports_authenticated: "boolean",
    remote_tls_present: "boolean",
    least_privilege_tokens_per_server: "boolean",
  },
  safety: {
    destructive_actions_gated_by_approval_or_scope: "boolean",
    read_and_write_separated: "boolean",
  },
  injection: {
    tool_results_treated_as_untrusted: "boolean",
    fetched_text_never_treated_as_instructions: "boolean",
    response_sizes_capped: "boolean",
    outputs_sanitized_before_echoing: "boolean",
  },
  versioning: {
    capabilities_negotiated: "boolean",
    changes_additive: "boolean",
    deprecations_announced_loudly: "boolean",
    protocol_versions_pinned: "boolean",
  },
  tests: {
    handshake_smoke_in_ci: "boolean",
    per_tool_happy_and_error_cases_covered: "boolean",
    malformed_input_tests_present: "boolean",
    schema_valid_tool_definitions: "boolean",
  },
  observability: {
    calls_logged_with_tool_duration_outcome: "boolean",
    error_rate_spike_alerts_present: "boolean",
    secrets_or_sensitive_payloads_logged_present: "boolean",
  },
  red_lines: {
    shell_passthrough_without_sandboxing_present: "boolean",
    secrets_echoed_back_present: "boolean",
    unbounded_resource_reads_present: "boolean",
  },
};

export const SECTIONS = [
  "tool_design_and_budget",
  "transports_and_auth",
  "safety_rails_and_injection_awareness",
  "versioning_contract_tests_and_observability",
  "red_lines",
] as const;

const OPERATIONS = ["read", "write", "destructive"];

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
  server: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  tools_count: number | null;
  tools_without_typed_schema: string[] | null;
  typed_schema_coverage: string | null;
  tools_not_single_job: string[] | null;
  single_job_coverage: string | null;
  tools_with_invalid_operation: string[] | null;
  valid_operation_coverage: string | null;
  duplicate_tool_names: string[] | null;
  destructive_tools_without_gate: string[] | null;
  destructive_gate_coverage: string | null;
  tools_without_negative_test: string[] | null;
  negative_test_coverage: string | null;
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

  const [toolsRaw, hasTools] = getPath(manifest, "tools");
  const toolsIsList = hasTools && Array.isArray(toolsRaw);
  const rows: unknown[] = toolsIsList ? (toolsRaw as unknown[]) : [];
  const toolsCount: number | null = toolsIsList ? rows.length : null;

  const toolsWithoutTypedSchema: string[] | null = toolsIsList
    ? rows.filter((c) => hasField(c, "has_typed_schema") &&
        (c as Record<string, unknown>)["has_typed_schema"] !== true)
        .map(rowName)
    : null;
  const toolsNotSingleJob: string[] | null = toolsIsList
    ? rows.filter((c) => hasField(c, "single_job") &&
        (c as Record<string, unknown>)["single_job"] !== true)
        .map(rowName)
    : null;
  const toolsWithInvalidOperation: string[] | null = toolsIsList
    ? rows.filter((c) => hasField(c, "operation") &&
        !OPERATIONS.includes(
          (c as Record<string, unknown>)["operation"] as string))
        .map(rowName)
    : null;
  let duplicateToolNames: string[] | null = null;
  if (toolsIsList) {
    const seen: string[] = [];
    duplicateToolNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const name = c["name"] as string;
        if (seen.includes(name) && !duplicateToolNames.includes(name)) {
          duplicateToolNames.push(name);
        }
        seen.push(name);
      }
    }
  }
  const destructiveRows: Record<string, unknown>[] = toolsIsList
    ? rows.filter((c): c is Record<string, unknown> =>
        isPyDict(c) && c["operation"] === "destructive")
    : [];
  const destructiveToolsWithoutGate: string[] | null = toolsIsList
    ? destructiveRows.filter((c) =>
        hasField(c, "approval_or_scope_gate_present") &&
        c["approval_or_scope_gate_present"] !== true)
        .map(rowName)
    : null;
  const toolsWithoutNegativeTest: string[] | null = toolsIsList
    ? rows.filter((c) => hasField(c, "has_negative_test") &&
        (c as Record<string, unknown>)["has_negative_test"] !== true)
        .map(rowName)
    : null;
  const typedSchemaCoverage: number | null =
    toolsIsList && toolsCount !== null && toolsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["has_typed_schema"] === true).length / toolsCount
      : null;
  const singleJobCoverage: number | null =
    toolsIsList && toolsCount !== null && toolsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["single_job"] === true).length / toolsCount
      : null;
  const validOperationCoverage: number | null =
    toolsIsList && toolsCount !== null && toolsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          OPERATIONS.includes(c["operation"] as string)).length / toolsCount
      : null;
  const destructiveGateCoverage: number | null =
    toolsIsList && destructiveRows.length > 0
      ? destructiveRows.filter((c) =>
          c["approval_or_scope_gate_present"] === true).length /
          destructiveRows.length
      : null;
  const negativeTestCoverage: number | null =
    toolsIsList && toolsCount !== null && toolsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["has_negative_test"] === true).length / toolsCount
      : null;

  // ---- Section 1: tool_design_and_budget ----
  boolCheck(results, "tool_design_and_budget",
    "names_are_verb_noun", manifest,
    ["tool_design", "names_are_verb_noun"],
    "tool design: tool names are clear verb_noun names");
  boolCheck(results, "tool_design_and_budget",
    "typed_json_schemas", manifest,
    ["tool_design", "typed_json_schemas"],
    "tool design: tools carry typed JSON schemas");
  boolCheck(results, "tool_design_and_budget",
    "descriptions_state_when_to_use", manifest,
    ["tool_design", "descriptions_state_when_to_use"],
    "tool design: concise descriptions say when to use each tool");
  boolCheck(results, "tool_design_and_budget",
    "errors_teach_fix", manifest,
    ["tool_design", "errors_teach_fix"],
    "tool design: errors teach the fix");
  boolCheck(results, "tool_design_and_budget",
    "one_job_per_tool", manifest,
    ["tool_design", "one_job_per_tool"],
    "tool design: one job per tool");
  falseCheck(results, "tool_design_and_budget",
    "no_god_tools", manifest,
    ["tool_design", "god_tools_present"],
    "tool design: no god-tools are present");
  boolCheck(results, "tool_design_and_budget",
    "smallest_set_covers_job", manifest,
    ["budget", "smallest_set_covers_job"],
    "respect the budget: the tool set is the smallest set that covers the job — each tool costs context and confusion");
  boolCheck(results, "tool_design_and_budget",
    "related_operations_grouped", manifest,
    ["budget", "related_operations_grouped"],
    "respect the budget: related operations are grouped");
  check(results, "tool_design_and_budget",
    "tools_declared", toolsRaw, toolsIsList,
    toolsIsList && (toolsCount as number) > 0,
    "the declared record names its tools — the tools list is present and non-empty");
  const schemaPresent = toolsIsList &&
    rows.every((c) => hasField(c, "has_typed_schema"));
  check(results, "tool_design_and_budget",
    "every_tool_has_typed_schema", toolsRaw, schemaPresent,
    toolsIsList && (toolsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["has_typed_schema"] === true),
    "tool design: every declared tool row carries a typed schema");
  const jobPresent = toolsIsList &&
    rows.every((c) => hasField(c, "single_job"));
  check(results, "tool_design_and_budget",
    "every_tool_single_job", toolsRaw, jobPresent,
    toolsIsList && (toolsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["single_job"] === true),
    "tool design: every declared tool row does a single job — no god-tools");
  const operationPresent = toolsIsList &&
    rows.every((c) => hasField(c, "operation"));
  check(results, "tool_design_and_budget",
    "every_tool_operation_valid", toolsRaw, operationPresent,
    toolsIsList && (toolsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        OPERATIONS.includes(c["operation"] as string)),
    "tool design: every declared tool row declares an operation from the skill's separation set — read / write / destructive");
  const namePresent = toolsIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "tool_design_and_budget",
    "no_tool_name_duplicated", toolsRaw, namePresent,
    toolsIsList && duplicateToolNames !== null &&
      duplicateToolNames.length === 0,
    "tool design: no declared tool name appears on more than one tool row");

  // ---- Section 2: transports_and_auth ----
  boolCheck(results, "transports_and_auth",
    "transport_matches_deployment", manifest,
    ["transport", "transport_matches_deployment"],
    "transports: the transport matches the deployment — stdio for local single-user, HTTP for remote");
  boolCheck(results, "transports_and_auth",
    "handlers_stateless_where_possible", manifest,
    ["transport", "handlers_stateless_where_possible"],
    "transports: handlers are stateless where possible");
  boolCheck(results, "transports_and_auth",
    "boundary_validation_applied", manifest,
    ["transport", "boundary_validation_applied"],
    "transports: everything is validated at the boundary");
  boolCheck(results, "transports_and_auth",
    "remote_transports_authenticated", manifest,
    ["auth", "remote_transports_authenticated"],
    "transports: remote transports are authenticated");
  boolCheck(results, "transports_and_auth",
    "remote_tls_present", manifest,
    ["auth", "remote_tls_present"],
    "transports: remote HTTP runs with TLS");
  boolCheck(results, "transports_and_auth",
    "least_privilege_tokens_per_server", manifest,
    ["auth", "least_privilege_tokens_per_server"],
    "auth: least-privilege tokens are held per server");

  // ---- Section 3: safety_rails_and_injection_awareness ----
  boolCheck(results, "safety_rails_and_injection_awareness",
    "destructive_actions_gated_by_approval_or_scope", manifest,
    ["safety", "destructive_actions_gated_by_approval_or_scope"],
    "safety rails: destructive actions — delete, send, pay, deploy — are gated by human approval or explicit scopes");
  boolCheck(results, "safety_rails_and_injection_awareness",
    "read_and_write_separated", manifest,
    ["safety", "read_and_write_separated"],
    "safety rails: read and write tools are separated");
  boolCheck(results, "safety_rails_and_injection_awareness",
    "tool_results_treated_as_untrusted", manifest,
    ["injection", "tool_results_treated_as_untrusted"],
    "injection-aware: tool results are treated as untrusted content");
  boolCheck(results, "safety_rails_and_injection_awareness",
    "fetched_text_never_treated_as_instructions", manifest,
    ["injection", "fetched_text_never_treated_as_instructions"],
    "injection-aware: fetched text is never treated as instructions");
  boolCheck(results, "safety_rails_and_injection_awareness",
    "response_sizes_capped", manifest,
    ["injection", "response_sizes_capped"],
    "injection-aware: response sizes are capped");
  boolCheck(results, "safety_rails_and_injection_awareness",
    "outputs_sanitized_before_echoing", manifest,
    ["injection", "outputs_sanitized_before_echoing"],
    "injection-aware: outputs are sanitized before echoing anywhere");
  const gatePresent = toolsIsList &&
    destructiveRows.every((c) =>
      hasField(c, "approval_or_scope_gate_present"));
  check(results, "safety_rails_and_injection_awareness",
    "every_destructive_tool_gated", toolsRaw, gatePresent,
    toolsIsList &&
      destructiveRows.every((c) =>
        c["approval_or_scope_gate_present"] === true),
    "safety rails: every declared destructive tool row carries an approval or scope gate — a record with no destructive rows passes vacuously");

  // ---- Section 4: versioning_contract_tests_and_observability ----
  boolCheck(results, "versioning_contract_tests_and_observability",
    "capabilities_negotiated", manifest,
    ["versioning", "capabilities_negotiated"],
    "versioning: capabilities are negotiated");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "changes_additive", manifest,
    ["versioning", "changes_additive"],
    "versioning: changes are additive");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "deprecations_announced_loudly", manifest,
    ["versioning", "deprecations_announced_loudly"],
    "versioning: deprecations are announced loudly");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "protocol_versions_pinned", manifest,
    ["versioning", "protocol_versions_pinned"],
    "versioning: the protocol versions clients speak are pinned");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "handshake_smoke_in_ci", manifest,
    ["tests", "handshake_smoke_in_ci"],
    "contract tests: handshake — initialize / list / call — smoke runs in CI");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "per_tool_happy_and_error_cases_covered", manifest,
    ["tests", "per_tool_happy_and_error_cases_covered"],
    "contract tests: per-tool happy and error cases are covered");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "malformed_input_tests_present", manifest,
    ["tests", "malformed_input_tests_present"],
    "contract tests: malformed-input tests are present");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "schema_valid_tool_definitions", manifest,
    ["tests", "schema_valid_tool_definitions"],
    "quality gate: tool definitions are schema-valid");
  const negativePresent = toolsIsList &&
    rows.every((c) => hasField(c, "has_negative_test"));
  check(results, "versioning_contract_tests_and_observability",
    "every_tool_has_negative_test", toolsRaw, negativePresent,
    toolsIsList && (toolsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["has_negative_test"] === true),
    "quality gate: every declared tool row carries a negative test");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "calls_logged_with_tool_duration_outcome", manifest,
    ["observability", "calls_logged_with_tool_duration_outcome"],
    "observability: calls are logged with tool, duration and outcome");
  boolCheck(results, "versioning_contract_tests_and_observability",
    "error_rate_spike_alerts_present", manifest,
    ["observability", "error_rate_spike_alerts_present"],
    "observability: alerts fire on error-rate spikes");
  falseCheck(results, "versioning_contract_tests_and_observability",
    "no_secrets_or_sensitive_payloads_logged", manifest,
    ["observability", "secrets_or_sensitive_payloads_logged_present"],
    "observability: no secrets or full payloads of sensitive data are logged");

  // ---- Section 5: red_lines ----
  falseCheck(results, "red_lines",
    "no_shell_passthrough_without_sandboxing", manifest,
    ["red_lines", "shell_passthrough_without_sandboxing_present"],
    "red line: no shell passthrough tools without sandboxing are present");
  falseCheck(results, "red_lines",
    "no_secrets_echoed_back", manifest,
    ["red_lines", "secrets_echoed_back_present"],
    "red line: no secrets are echoed back");
  falseCheck(results, "red_lines",
    "no_unbounded_resource_reads", manifest,
    ["red_lines", "unbounded_resource_reads_present"],
    "red line: no unbounded resource reads are present");

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
    verdict = "MCP_SERVER_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "MCP_SERVER_SOUND";
  }

  const computedNames = [
    "tools_declared",
    "every_tool_has_typed_schema",
    "every_tool_single_job",
    "every_tool_operation_valid",
    "no_tool_name_duplicated",
    "every_destructive_tool_gated",
    "every_tool_has_negative_test",
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
    service: "mcp-server-design-and-review",
    atom_version: "0.1.0",
    server: manifest["server"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    tools_count: toolsCount,
    tools_without_typed_schema: toolsWithoutTypedSchema,
    typed_schema_coverage: fmt6(typedSchemaCoverage),
    tools_not_single_job: toolsNotSingleJob,
    single_job_coverage: fmt6(singleJobCoverage),
    tools_with_invalid_operation: toolsWithInvalidOperation,
    valid_operation_coverage: fmt6(validOperationCoverage),
    duplicate_tool_names: duplicateToolNames,
    destructive_tools_without_gate: destructiveToolsWithoutGate,
    destructive_gate_coverage: fmt6(destructiveGateCoverage),
    tools_without_negative_test: toolsWithoutNegativeTest,
    negative_test_coverage: fmt6(negativeTestCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "MCP SERVER DESIGN AND REVIEW",
    `server: ${pyStr(verdict.server ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
