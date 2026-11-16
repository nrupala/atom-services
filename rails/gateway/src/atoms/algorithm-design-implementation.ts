// Algorithm design implementation — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/algorithm-design-implementation/src/algorithm_design_implementation.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed design
// status, scale status and the summary string are byte-identical
// to the Python output for the same input. The fatal-scale
// comparison uses the unrounded declared values, exactly as in
// Python.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  problem: "string",
  decomposition: {
    inputs_stated: "boolean",
    outputs_stated: "boolean",
    constraints_stated: "boolean",
    invariant_stated: "boolean",
    pseudocode_sketched: "boolean",
    input_scale_stated: "boolean",
    max_input_size: "number",
  },
  complexity: {
    time_big_o_stated: "boolean",
    space_big_o_stated: "boolean",
    dominant_term_identified: "boolean",
    bottleneck_identified: "boolean",
    tradeoffs_named: "boolean",
    time_complexity: "string",
  },
  design: {
    key_operation_identified: "boolean",
    key_operation: "string",
    chosen_structure: "string",
    structure_forces_quadratic: "boolean",
    pattern: "string",
    greedy_safety_proven: "boolean",
    dp_state_defined: "boolean",
    dp_transition_defined: "boolean",
    dp_base_case_defined: "boolean",
    graph_traversal_variant_named: "boolean",
  },
  correctness: {
    invariant_reasoned: "boolean",
    termination_reasoned: "boolean",
    edge_cases: {
      empty: "boolean",
      single_element: "boolean",
      duplicates: "boolean",
      boundaries: "boolean",
      integer_overflow: "boolean",
    },
    edges_and_properties_tested: "boolean",
  },
  verification: {
    correctness_critical: "boolean",
    method: "string",
  },
  optimization: {
    correctness_established_first: "boolean",
    profiled_before_optimizing: "boolean",
    optimized_before_measuring: "boolean",
  },
};

export const SECTIONS = [
  "decomposition",
  "complexity_reasoning",
  "data_structure_choice",
  "pattern_application",
  "correctness_and_edges",
  "verification_and_optimization",
] as const;

export const STRUCTURE_FOR_OPERATION: Record<string, string> = {
  lookup: "hash_map",
  top_k_or_priority: "heap",
  ordered_range: "bst_or_btree",
  prefix: "trie",
  connectivity: "union_find",
  sliding_window: "deque",
  range_queries: "prefix_sums",
};

export const PATTERNS = [
  "two_pointers",
  "sliding_window",
  "binary_search",
  "binary_search_on_answer",
  "divide_and_conquer",
  "greedy",
  "dynamic_programming",
  "graph_traversal",
  "hashing",
] as const;

export const VERIFICATION_METHODS = [
  "invariant_proof",
  "property_based_testing",
  "formal_or_cryptographic_certificate",
] as const;

export const QUADRATIC_TIME = "O(n^2)";
export const FATAL_SCALE = 10000000;

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
  problem: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  design_status: string | null;
  scale_status: string | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: decomposition ----
  boolCheck(results, "decomposition", "inputs_stated",
    manifest, ["decomposition", "inputs_stated"],
    "decompose first: the inputs are stated before coding");
  boolCheck(results, "decomposition", "outputs_stated",
    manifest, ["decomposition", "outputs_stated"],
    "decompose first: the outputs are stated before coding");
  boolCheck(results, "decomposition", "constraints_stated",
    manifest, ["decomposition", "constraints_stated"],
    "decompose first: the constraints are stated before coding");
  boolCheck(results, "decomposition", "invariant_stated",
    manifest, ["decomposition", "invariant_stated"],
    "decompose first: the invariant is stated before coding");
  boolCheck(results, "decomposition",
    "pseudocode_sketched_before_coding",
    manifest, ["decomposition", "pseudocode_sketched"],
    "sketch pseudocode before coding");
  boolCheck(results, "decomposition", "input_scale_stated",
    manifest, ["decomposition", "input_scale_stated"],
    "know the input scale — O(n^2) is fine at n=100, fatal at n=10^7");

  // ---- Section 2: complexity_reasoning ----
  boolCheck(results, "complexity_reasoning", "time_big_o_stated",
    manifest, ["complexity", "time_big_o_stated"],
    "reason Big-O for time up front, so you don't design an O(n^2) corner you can't escape");
  boolCheck(results, "complexity_reasoning", "space_big_o_stated",
    manifest, ["complexity", "space_big_o_stated"],
    "reason Big-O for space up front");
  boolCheck(results, "complexity_reasoning",
    "dominant_term_identified",
    manifest, ["complexity", "dominant_term_identified"],
    "identify the dominant term of the cost");
  boolCheck(results, "complexity_reasoning", "bottleneck_identified",
    manifest, ["complexity", "bottleneck_identified"],
    "identify the real bottleneck");
  boolCheck(results, "complexity_reasoning", "tradeoffs_named",
    manifest, ["complexity", "tradeoffs_named"],
    "name the trade-offs: time vs space, exact vs approximate, latency vs throughput, simplicity vs speed");
  const [maxN, hasMaxN] = getPath(
    manifest, "decomposition", "max_input_size");
  const [timeComplexity, hasTc] = getPath(
    manifest, "complexity", "time_complexity");
  const maxNIsNumber = hasMaxN && isNumber(maxN);
  const scalePresent = Boolean(maxNIsNumber && hasTc &&
    typeof timeComplexity === "string");
  const scaleOk = scalePresent && !(
    timeComplexity === QUADRATIC_TIME &&
    (maxN as number) >= FATAL_SCALE);
  check(results, "complexity_reasoning",
    "quadratic_at_fatal_scale_absent", timeComplexity,
    scalePresent, scaleOk,
    "know the input scale: O(n^2) is fine at n=100, fatal at n=10^7 — a quadratic design at or above that scale is the fatal combination");

  // ---- Section 3: data_structure_choice ----
  boolCheck(results, "data_structure_choice",
    "key_operation_identified",
    manifest, ["design", "key_operation_identified"],
    "pick the structure that makes the key operation cheap — the key operation is identified");
  const [operation, hasOperation] = getPath(
    manifest, "design", "key_operation");
  const [structure, hasStructure] = getPath(
    manifest, "design", "chosen_structure");
  const mappingOk =
    typeof operation === "string" && typeof structure === "string" &&
    STRUCTURE_FOR_OPERATION[operation] === structure;
  check(results, "data_structure_choice",
    "structure_matches_skill_mapping", operation,
    hasOperation && hasStructure, mappingOk,
    "the skill's mapping: hash map -> O(1) lookup; heap -> top-k / priority; BST/B-tree -> ordered range; trie -> prefix; union-find -> connectivity; deque -> sliding window; prefix sums -> range queries");
  falseCheck(results, "data_structure_choice",
    "structure_does_not_force_quadratic",
    manifest, ["design", "structure_forces_quadratic"],
    "anti-pattern: the wrong data structure forcing O(n^2)");

  // ---- Section 4: pattern_application ----
  const [pattern, hasPattern] = getPath(manifest, "design", "pattern");
  const patternOk = typeof pattern === "string" &&
    (PATTERNS as readonly string[]).includes(pattern);
  check(results, "pattern_application", "pattern_in_skill_toolbox",
    pattern, hasPattern, patternOk,
    "pattern toolbox: two pointers, sliding window, binary search (including on the answer), divide & conquer, greedy, dynamic programming, graph traversal, hashing");
  if (hasPattern && pattern === "greedy") {
    const [proven, hasProven] = getPath(
      manifest, "design", "greedy_safety_proven");
    check(results, "pattern_application",
      "greedy_safety_proven_when_greedy", proven, hasProven,
      proven === true,
      "greedy is used only when proven safe");
  } else {
    check(results, "pattern_application",
      "greedy_safety_proven_when_greedy", pattern,
      hasPattern, true,
      "the declared pattern is not greedy — no greedy safety proof is required");
  }
  if (hasPattern && pattern === "dynamic_programming") {
    const [state, hasState] = getPath(
      manifest, "design", "dp_state_defined");
    const [transition, hasTransition] = getPath(
      manifest, "design", "dp_transition_defined");
    const [base, hasBase] = getPath(
      manifest, "design", "dp_base_case_defined");
    const dpPresent = hasState && hasTransition && hasBase;
    const dpOk = state === true && transition === true && base === true;
    check(results, "pattern_application",
      "dp_definition_complete_when_dp", state, dpPresent, dpOk,
      "dynamic programming: define state + transition + base case");
  } else {
    check(results, "pattern_application",
      "dp_definition_complete_when_dp", pattern, hasPattern, true,
      "the declared pattern is not dynamic programming — no DP state / transition / base case is required");
  }
  if (hasPattern && pattern === "graph_traversal") {
    const [variant, hasVariant] = getPath(
      manifest, "design", "graph_traversal_variant_named");
    check(results, "pattern_application",
      "graph_traversal_variant_named_when_graph", variant,
      hasVariant, variant === true,
      "graph traversal: name the variant — BFS / DFS / Dijkstra / topological sort");
  } else {
    check(results, "pattern_application",
      "graph_traversal_variant_named_when_graph", pattern,
      hasPattern, true,
      "the declared pattern is not graph traversal — no traversal variant is required");
  }

  // ---- Section 5: correctness_and_edges ----
  boolCheck(results, "correctness_and_edges",
    "invariant_defined_and_reasoned",
    manifest, ["correctness", "invariant_reasoned"],
    "correctness: define invariants and reason about them");
  boolCheck(results, "correctness_and_edges", "termination_reasoned",
    manifest, ["correctness", "termination_reasoned"],
    "correctness: reason about termination");
  boolCheck(results, "correctness_and_edges",
    "edge_case_empty_handled",
    manifest, ["correctness", "edge_cases", "empty"],
    "hit the edge cases: empty");
  boolCheck(results, "correctness_and_edges",
    "edge_case_single_element_handled",
    manifest, ["correctness", "edge_cases", "single_element"],
    "hit the edge cases: single element");
  boolCheck(results, "correctness_and_edges",
    "edge_case_duplicates_handled",
    manifest, ["correctness", "edge_cases", "duplicates"],
    "hit the edge cases: duplicates");
  boolCheck(results, "correctness_and_edges",
    "edge_case_boundaries_handled",
    manifest, ["correctness", "edge_cases", "boundaries"],
    "hit the edge cases: boundaries");
  boolCheck(results, "correctness_and_edges",
    "edge_case_integer_overflow_handled",
    manifest, ["correctness", "edge_cases", "integer_overflow"],
    "hit the edge cases: integer overflow");
  boolCheck(results, "correctness_and_edges",
    "edges_and_properties_tested",
    manifest, ["correctness", "edges_and_properties_tested"],
    "test the edges and properties, not just the happy path — no edge-case tests is an anti-pattern");

  // ---- Section 6: verification_and_optimization ----
  const [critical, hasCritical] = getPath(
    manifest, "verification", "correctness_critical");
  const [method, hasMethod] = getPath(
    manifest, "verification", "method");
  if (hasCritical && pyTruthy(critical)) {
    const methodOk = typeof method === "string" &&
      (VERIFICATION_METHODS as readonly string[]).includes(method);
    check(results, "verification_and_optimization",
      "verification_method_declared_when_critical", method,
      hasMethod, methodOk,
      "where correctness is critical: prove the invariant, use property-based testing (hypothesis / proptest), or attach a formal / cryptographic certificate of correctness");
  } else {
    check(results, "verification_and_optimization",
      "verification_method_declared_when_critical", critical,
      hasCritical, true,
      "correctness is not declared critical — no verification method is required");
  }
  boolCheck(results, "verification_and_optimization",
    "correctness_established_before_optimization",
    manifest, ["optimization", "correctness_established_first"],
    "correct first, fast second — clever code over correct code is an anti-pattern");
  boolCheck(results, "verification_and_optimization",
    "profiled_before_optimizing",
    manifest, ["optimization", "profiled_before_optimizing"],
    "optimize last, measured: get it correct, profile, then optimize the proven bottleneck");
  falseCheck(results, "verification_and_optimization",
    "not_optimized_before_measuring",
    manifest, ["optimization", "optimized_before_measuring"],
    "anti-pattern: optimizing before measuring — never optimize before measuring");

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
    verdict = "DESIGN_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DESIGN_SOUND";
  }

  const computedStatuses = results
    .filter((r) => r.check === "quadratic_at_fatal_scale_absent" ||
      r.check === "structure_matches_skill_mapping" ||
      r.check === "pattern_in_skill_toolbox")
    .map((r) => r.status);
  let designStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    designStatus = "not_sound_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    designStatus = "sound_on_declared_evidence";
  } else {
    designStatus = null;
  }

  const scaleCheckStatus = results.find(
    (r) => r.check === "quadratic_at_fatal_scale_absent",
  )!.status;
  let scaleStatus: string | null;
  if (scaleCheckStatus === "fail") {
    scaleStatus = "fatal_scale_combination_declared";
  } else if (scaleCheckStatus === "pass") {
    scaleStatus = "no_fatal_scale_combination_declared";
  } else {
    scaleStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "algorithm-design-implementation",
    atom_version: "0.1.0",
    problem: manifest["problem"] ?? null,
    verdict,
    sections,
    checks: results,
    design_status: designStatus,
    scale_status: scaleStatus,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ALGORITHM DESIGN IMPLEMENTATION",
    `problem: ${pyStr(verdict.problem ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
