// Agent interoperability design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/agent-interoperability-design/src/agent_interoperability_design.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed protocol
// status, integration count and the summary string are
// byte-identical to the Python output for the same input. The
// protocol mapping is the bound skill's own Method step 1
// vocabulary; no outside criterion is imported.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  design: "string",
  integrations: [{
    counterparty_type: "string",
    protocol: "string",
    rationale_documented: "boolean",
  }],
  architecture: {
    single_core: "boolean",
    protocol_adapters: "boolean",
    business_logic_per_protocol: "boolean",
  },
  gateway: {
    remote_or_untrusted_agents_present: "boolean",
    single_authenticated_broker: "boolean",
    broker_authenticated: "boolean",
    broker_audited: "boolean",
    broker_rate_limited: "boolean",
    direct_doors_to_remote_agents: "boolean",
  },
  handoff: {
    contracts_used_for_non_trivial_coordination: "boolean",
    contract_states_goal: "boolean",
    contract_states_constraints: "boolean",
    contract_states_acceptance_criteria: "boolean",
    contract_states_report_back_location: "boolean",
  },
  identity: {
    each_agent_own_credential: "boolean",
    credentials_least_privilege: "boolean",
    credentials_short_lived: "boolean",
    credentials_revocable: "boolean",
    shared_forever_keys_present: "boolean",
  },
  discovery: {
    capabilities_published: "boolean",
    version_published: "boolean",
    negotiation_supported: "boolean",
    graceful_degradation_declared: "boolean",
  },
  audit: {
    message_log_kept: "boolean",
    log_records_who_asked: "boolean",
    log_records_what_ran: "boolean",
    log_records_what_changed: "boolean",
  },
  testing: {
    handshake_tests_exist: "boolean",
    handshake_tests_pass: "boolean",
    handshake_tests_both_directions: "boolean",
    handshake_tests_per_protocol: "boolean",
  },
  red_lines: {
    unsandboxed_third_party_agents_present: "boolean",
    secrets_or_private_data_in_messages_by_default: "boolean",
  },
};

export const SECTIONS = [
  "protocol_selection",
  "bridge_architecture",
  "gateway_and_remote_access",
  "handoff_contracts",
  "identity_and_credentials",
  "versioning_and_discovery",
  "audit_and_provenance",
  "handshake_testing_and_red_lines",
] as const;

export const COUNTERPARTY_PROTOCOLS: Record<string, string[]> = {
  tools_for_models: ["mcp"],
  editor_agent_session: ["acp_stdio"],
  agent_to_agent: ["acp_rest", "a2a"],
  human_or_script: ["rest_cli_web"],
};

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
  design: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  protocol_status: string | null;
  integration_count: number | null;
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

function gatewayCheck(
  results: CheckResult[],
  name: string,
  manifest: Record<string, unknown>,
  field: string,
  evidence: string,
  okIf: (v: unknown) => boolean,
): void {
  const [gate, hasGate] = getPath(
    manifest, "gateway", "remote_or_untrusted_agents_present");
  const [value, hasValue] = getPath(manifest, "gateway", field);
  if (hasGate && pyTruthy(gate)) {
    check(results, "gateway_and_remote_access", name, value,
      hasValue, okIf(value), evidence);
  } else {
    check(results, "gateway_and_remote_access", name, gate,
      hasGate, true,
      "no remote or untrusted agents declared — the gateway pattern is not applicable");
  }
}

function entryField(entry: unknown, field: string): [unknown, boolean] {
  if (!isPyDict(entry) ||
      !Object.prototype.hasOwnProperty.call(entry, field)) {
    return [null, false];
  }
  return [entry[field], true];
}

function isValidCounterparty(value: unknown): boolean {
  return typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(COUNTERPARTY_PROTOCOLS, value);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: protocol_selection ----
  const [integrations, hasIntegrations] = getPath(manifest, "integrations");
  const integrationsIsList = hasIntegrations && Array.isArray(integrations);
  const integrationCount: number | null = integrationsIsList
    ? (integrations as unknown[]).length
    : null;
  check(results, "protocol_selection", "integrations_declared",
    integrations, integrationsIsList,
    integrationsIsList && (integrations as unknown[]).length > 0,
    "the design declares its integrations — protocol choice is made per integration, by counterparty");
  const entries: unknown[] = integrationsIsList
    ? (integrations as unknown[])
    : [];

  let counterpartyMissing = false;
  let counterpartyInvalid = false;
  for (const entry of entries) {
    const [ctype, hasCtype] = entryField(entry, "counterparty_type");
    if (!hasCtype) {
      counterpartyMissing = true;
    } else if (!isValidCounterparty(ctype)) {
      counterpartyInvalid = true;
    }
  }
  check(results, "protocol_selection",
    "counterparty_types_in_skill_vocabulary", null,
    integrationsIsList && !counterpartyMissing,
    integrationsIsList && !counterpartyInvalid && entries.length > 0,
    "Method step 1 names four counterparty classes: tools/resources for models, editor <-> agent sessions, agent <-> agent runs/services, humans/scripts/anything");

  let matchMissing = false;
  let matchFailed = false;
  for (const entry of entries) {
    const [ctype, hasCtype] = entryField(entry, "counterparty_type");
    const [protocol, hasProtocol] = entryField(entry, "protocol");
    if (!hasCtype || !hasProtocol) {
      matchMissing = true;
    } else if (!isValidCounterparty(ctype)) {
      matchFailed = true;
    } else if (!COUNTERPARTY_PROTOCOLS[ctype as string].includes(protocol as string)) {
      matchFailed = true;
    }
  }
  check(results, "protocol_selection",
    "protocols_match_counterparty_per_skill", null,
    integrationsIsList && !matchMissing,
    integrationsIsList && !matchFailed && entries.length > 0,
    "Method step 1: tools/resources for models -> MCP; editor <-> agent sessions -> ACP (stdio); agent <-> agent runs/services -> ACP (REST) or A2A; humans, scripts, anything -> REST/CLI/web");

  let rationaleMissing = false;
  let rationaleFailed = false;
  for (const entry of entries) {
    const [rationale, hasRationale] = entryField(
      entry, "rationale_documented");
    if (!hasRationale) {
      rationaleMissing = true;
    } else if (rationale !== true) {
      rationaleFailed = true;
    }
  }
  check(results, "protocol_selection",
    "protocol_choice_documented_with_why_per_integration", null,
    integrationsIsList && !rationaleMissing,
    integrationsIsList && !rationaleFailed && entries.length > 0,
    "quality gate: protocol choice documented per integration + why");

  // ---- Section 2: bridge_architecture ----
  boolCheck(results, "bridge_architecture", "single_core_declared",
    manifest, ["architecture", "single_core"],
    "bridge, don't fork: one core, many protocol adapters (the multi-surface pattern)");
  boolCheck(results, "bridge_architecture",
    "protocol_adapters_declared",
    manifest, ["architecture", "protocol_adapters"],
    "bridge, don't fork: many protocol adapters over the one core");
  falseCheck(results, "bridge_architecture",
    "no_business_logic_per_protocol",
    manifest, ["architecture", "business_logic_per_protocol"],
    "never implement business logic per protocol");

  // ---- Section 3: gateway_and_remote_access ----
  gatewayCheck(results, "single_authenticated_broker_in_front",
    manifest, "single_authenticated_broker",
    "gateway pattern for remote/untrusted agents: a single authenticated broker in front of remote paths — not N direct doors",
    (v) => v === true);
  gatewayCheck(results, "broker_authenticated", manifest,
    "broker_authenticated",
    "the broker is authenticated (mTLS/tokens)",
    (v) => v === true);
  gatewayCheck(results, "broker_audited", manifest,
    "broker_audited",
    "the broker is audited",
    (v) => v === true);
  gatewayCheck(results, "broker_rate_limited", manifest,
    "broker_rate_limited",
    "the broker is rate-limited",
    (v) => v === true);
  gatewayCheck(results, "no_direct_doors_to_remote_agents",
    manifest, "direct_doors_to_remote_agents",
    "gateway pattern: not N direct doors to remote agents",
    (v) => v === false);

  // ---- Section 4: handoff_contracts ----
  boolCheck(results, "handoff_contracts",
    "contracts_used_for_non_trivial_coordination",
    manifest, ["handoff", "contracts_used_for_non_trivial_coordination"],
    "quality gate: handoff contracts used for non-trivial coordination");
  boolCheck(results, "handoff_contracts", "contract_states_goal",
    manifest, ["handoff", "contract_states_goal"],
    "every cross-agent message states the goal");
  boolCheck(results, "handoff_contracts",
    "contract_states_constraints",
    manifest, ["handoff", "contract_states_constraints"],
    "every cross-agent message states the constraints");
  boolCheck(results, "handoff_contracts",
    "contract_states_acceptance_criteria",
    manifest, ["handoff", "contract_states_acceptance_criteria"],
    "every cross-agent message states the acceptance criteria");
  boolCheck(results, "handoff_contracts",
    "contract_states_report_back_location",
    manifest, ["handoff", "contract_states_report_back_location"],
    "every cross-agent message states the report-back location");

  // ---- Section 5: identity_and_credentials ----
  boolCheck(results, "identity_and_credentials",
    "each_agent_has_own_credential",
    manifest, ["identity", "each_agent_own_credential"],
    "identity between agents: each agent has its own credential");
  boolCheck(results, "identity_and_credentials",
    "credentials_least_privilege",
    manifest, ["identity", "credentials_least_privilege"],
    "identity between agents: least privilege — credentials are scoped");
  boolCheck(results, "identity_and_credentials",
    "credentials_short_lived",
    manifest, ["identity", "credentials_short_lived"],
    "identity between agents: credentials are short-lived");
  boolCheck(results, "identity_and_credentials",
    "credentials_revocable",
    manifest, ["identity", "credentials_revocable"],
    "identity between agents: credentials are revocable (quality gate: scoped + revocable)");
  falseCheck(results, "identity_and_credentials",
    "no_shared_forever_keys",
    manifest, ["identity", "shared_forever_keys_present"],
    "no shared 'service-to-service forever' keys");

  // ---- Section 6: versioning_and_discovery ----
  boolCheck(results, "versioning_and_discovery",
    "capabilities_published",
    manifest, ["discovery", "capabilities_published"],
    "versioning + discovery: publish capabilities (tools list, agent card, version)");
  boolCheck(results, "versioning_and_discovery",
    "version_published",
    manifest, ["discovery", "version_published"],
    "versioning + discovery: the version is published with the capabilities");
  boolCheck(results, "versioning_and_discovery",
    "negotiation_supported",
    manifest, ["discovery", "negotiation_supported"],
    "versioning + discovery: negotiate with the counterparty");
  boolCheck(results, "versioning_and_discovery",
    "graceful_degradation_declared",
    manifest, ["discovery", "graceful_degradation_declared"],
    "degrade gracefully when the counterparty is older/newer");

  // ---- Section 7: audit_and_provenance ----
  boolCheck(results, "audit_and_provenance", "message_log_kept",
    manifest, ["audit", "message_log_kept"],
    "audit everything: a message log is kept — history is the dispute resolver");
  boolCheck(results, "audit_and_provenance",
    "log_records_who_asked",
    manifest, ["audit", "log_records_who_asked"],
    "provenance: the log records who asked");
  boolCheck(results, "audit_and_provenance",
    "log_records_what_ran",
    manifest, ["audit", "log_records_what_ran"],
    "provenance: the log records what ran");
  boolCheck(results, "audit_and_provenance",
    "log_records_what_changed",
    manifest, ["audit", "log_records_what_changed"],
    "provenance: the log records what changed");

  // ---- Section 8: handshake_testing_and_red_lines ----
  boolCheck(results, "handshake_testing_and_red_lines",
    "handshake_tests_exist",
    manifest, ["testing", "handshake_tests_exist"],
    "test the handshake: scripted counterparty tests per protocol — not just 'it worked once in the demo' (quality gate: handshake test exists)");
  boolCheck(results, "handshake_testing_and_red_lines",
    "handshake_tests_pass",
    manifest, ["testing", "handshake_tests_pass"],
    "quality gate: the handshake test passes");
  boolCheck(results, "handshake_testing_and_red_lines",
    "handshake_tests_both_directions",
    manifest, ["testing", "handshake_tests_both_directions"],
    "quality gate: the handshake test passes in both directions");
  boolCheck(results, "handshake_testing_and_red_lines",
    "handshake_tests_per_protocol",
    manifest, ["testing", "handshake_tests_per_protocol"],
    "test the handshake: scripted counterparty tests exist per protocol");
  falseCheck(results, "handshake_testing_and_red_lines",
    "no_unsandboxed_third_party_agents",
    manifest, ["red_lines", "unsandboxed_third_party_agents_present"],
    "red line: no unsandboxed third-party agents hitting your systems");
  falseCheck(results, "handshake_testing_and_red_lines",
    "no_secrets_or_private_data_in_messages_by_default",
    manifest, ["red_lines", "secrets_or_private_data_in_messages_by_default"],
    "red line: no secrets or private data in agent-to-agent messages by default");

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
    verdict = "DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DESIGN_SOUND";
  }

  const computedStatuses = results
    .filter((r) => r.check === "counterparty_types_in_skill_vocabulary" ||
      r.check === "protocols_match_counterparty_per_skill")
    .map((r) => r.status);
  let protocolStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    protocolStatus = "not_sound_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    protocolStatus = "sound_on_declared_evidence";
  } else {
    protocolStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "agent-interoperability-design",
    atom_version: "0.1.0",
    design: manifest["design"] ?? null,
    verdict,
    sections,
    checks: results,
    protocol_status: protocolStatus,
    integration_count: integrationCount,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "AGENT INTEROPERABILITY DESIGN VERDICT",
    `design: ${pyStr(verdict.design ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
