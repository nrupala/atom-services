#!/usr/bin/env python3
"""Algorithm design implementation — deterministic core.

Built from the bound skill `algorithmic-implementer`: "Think before
you type: the right data structure usually dissolves the hard part.
Correct first, fast second — but reason about cost up front."

The caller submits a design manifest (a dict, or JSON on the CLI):
a declared design record for one algorithm problem. Every check
reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Three checks are computed against vocabularies the skill itself
states — no outside criterion is imported:

- the chosen data structure must be the one the skill's mapping
  table pairs with the declared key operation (hash map -> O(1)
  lookup; heap -> top-k / priority; BST/B-tree -> ordered range;
  trie -> prefix; union-find -> connectivity; deque -> sliding
  window; prefix sums -> range queries);
- the declared pattern must be one of the skill's pattern toolbox
  (two pointers, sliding window, binary search, binary search on
  the answer, divide & conquer, greedy, dynamic programming,
  graph traversal, hashing);
- the skill's stated scale anchor: O(n^2) is "fine at n=100,
  fatal at n=10^7" — a declared quadratic time complexity at a
  declared maximum input size at or above 10,000,000 is the fatal
  combination and fails; comparisons use the unrounded declared
  values. The check is named for exactly that prohibition: it
  passes whenever the fatal combination is not declared.

Conditional duties follow the skill's own gates: greedy requires
a safety proof, dynamic programming requires state + transition
+ base case, graph traversal requires a named variant (BFS / DFS
/ Dijkstra / topological sort), and a verification method (prove
the invariant, property-based testing, or a formal /
cryptographic certificate) is required only where correctness is
declared critical.

The computed outcome over the three vocabulary/scale checks is
also reported as `design_status`, and the scale check alone as
`scale_status`.

Verdict:
- any fail             -> DESIGN_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DESIGN_SOUND

This atom audits a declared design record — it does not write
code, run code, or verify that a declared fact about an
implementation is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "decomposition",
    "complexity_reasoning",
    "data_structure_choice",
    "pattern_application",
    "correctness_and_edges",
    "verification_and_optimization",
)

# The skill's mapping table: key operation -> structure that makes
# the key operation cheap.
STRUCTURE_FOR_OPERATION = {
    "lookup": "hash_map",
    "top_k_or_priority": "heap",
    "ordered_range": "bst_or_btree",
    "prefix": "trie",
    "connectivity": "union_find",
    "sliding_window": "deque",
    "range_queries": "prefix_sums",
}

# The skill's pattern toolbox.
PATTERNS = (
    "two_pointers",
    "sliding_window",
    "binary_search",
    "binary_search_on_answer",
    "divide_and_conquer",
    "greedy",
    "dynamic_programming",
    "graph_traversal",
    "hashing",
)

# The skill's verification options where correctness is critical.
VERIFICATION_METHODS = (
    "invariant_proof",
    "property_based_testing",
    "formal_or_cryptographic_certificate",
)

QUADRATIC_TIME = "O(n^2)"
FATAL_SCALE = 10000000

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "problem": "string",
    "decomposition": {
        "inputs_stated": "boolean",
        "outputs_stated": "boolean",
        "constraints_stated": "boolean",
        "invariant_stated": "boolean",
        "pseudocode_sketched": "boolean",
        "input_scale_stated": "boolean",
        "max_input_size": "number",
    },
    "complexity": {
        "time_big_o_stated": "boolean",
        "space_big_o_stated": "boolean",
        "dominant_term_identified": "boolean",
        "bottleneck_identified": "boolean",
        "tradeoffs_named": "boolean",
        "time_complexity": "string",
    },
    "design": {
        "key_operation_identified": "boolean",
        "key_operation": "string",
        "chosen_structure": "string",
        "structure_forces_quadratic": "boolean",
        "pattern": "string",
        "greedy_safety_proven": "boolean",
        "dp_state_defined": "boolean",
        "dp_transition_defined": "boolean",
        "dp_base_case_defined": "boolean",
        "graph_traversal_variant_named": "boolean",
    },
    "correctness": {
        "invariant_reasoned": "boolean",
        "termination_reasoned": "boolean",
        "edge_cases": {
            "empty": "boolean",
            "single_element": "boolean",
            "duplicates": "boolean",
            "boundaries": "boolean",
            "integer_overflow": "boolean",
        },
        "edges_and_properties_tested": "boolean",
    },
    "verification": {
        "correctness_critical": "boolean",
        "method": "string",
    },
    "optimization": {
        "correctness_established_first": "boolean",
        "profiled_before_optimizing": "boolean",
        "optimized_before_measuring": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def evaluate(manifest):
    """Return the verdict dict for an algorithm design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: decomposition (skill: decompose first — state
    #      inputs, outputs, constraints, and the invariant; sketch
    #      pseudocode before coding; know the input scale) ----
    _bool_check(results, "decomposition", "inputs_stated",
                manifest, ("decomposition", "inputs_stated"),
                "decompose first: the inputs are stated before coding")
    _bool_check(results, "decomposition", "outputs_stated",
                manifest, ("decomposition", "outputs_stated"),
                "decompose first: the outputs are stated before coding")
    _bool_check(results, "decomposition", "constraints_stated",
                manifest, ("decomposition", "constraints_stated"),
                "decompose first: the constraints are stated before "
                "coding")
    _bool_check(results, "decomposition", "invariant_stated",
                manifest, ("decomposition", "invariant_stated"),
                "decompose first: the invariant is stated before coding")
    _bool_check(results, "decomposition",
                "pseudocode_sketched_before_coding",
                manifest, ("decomposition", "pseudocode_sketched"),
                "sketch pseudocode before coding")
    _bool_check(results, "decomposition", "input_scale_stated",
                manifest, ("decomposition", "input_scale_stated"),
                "know the input scale — O(n^2) is fine at n=100, "
                "fatal at n=10^7")

    # ---- Section 2: complexity_reasoning (skill: reason Big-O for
    #      time and space; identify the dominant term and the real
    #      bottleneck; name the trade-offs) ----
    _bool_check(results, "complexity_reasoning", "time_big_o_stated",
                manifest, ("complexity", "time_big_o_stated"),
                "reason Big-O for time up front, so you don't design "
                "an O(n^2) corner you can't escape")
    _bool_check(results, "complexity_reasoning", "space_big_o_stated",
                manifest, ("complexity", "space_big_o_stated"),
                "reason Big-O for space up front")
    _bool_check(results, "complexity_reasoning",
                "dominant_term_identified",
                manifest, ("complexity", "dominant_term_identified"),
                "identify the dominant term of the cost")
    _bool_check(results, "complexity_reasoning", "bottleneck_identified",
                manifest, ("complexity", "bottleneck_identified"),
                "identify the real bottleneck")
    _bool_check(results, "complexity_reasoning", "tradeoffs_named",
                manifest, ("complexity", "tradeoffs_named"),
                "name the trade-offs: time vs space, exact vs "
                "approximate, latency vs throughput, simplicity vs "
                "speed")
    max_n, has_max_n = _get(manifest, "decomposition", "max_input_size")
    time_complexity, has_tc = _get(manifest, "complexity",
                                   "time_complexity")
    max_n_is_number = has_max_n and _is_number(max_n)
    scale_present = bool(max_n_is_number and has_tc
                         and isinstance(time_complexity, str))
    scale_ok = scale_present and not (
        time_complexity == QUADRATIC_TIME and max_n >= FATAL_SCALE)
    _check(results, "complexity_reasoning",
           "quadratic_at_fatal_scale_absent", time_complexity,
           scale_present, scale_ok,
           "know the input scale: O(n^2) is fine at n=100, fatal "
           "at n=10^7 — a quadratic design at or above that scale "
           "is the fatal combination")

    # ---- Section 3: data_structure_choice (skill: data structures
    #      are the algorithm — pick the structure that makes the
    #      key operation cheap) ----
    _bool_check(results, "data_structure_choice",
                "key_operation_identified",
                manifest, ("design", "key_operation_identified"),
                "pick the structure that makes the key operation "
                "cheap — the key operation is identified")
    operation, has_operation = _get(manifest, "design", "key_operation")
    structure, has_structure = _get(manifest, "design",
                                    "chosen_structure")
    mapping_ok = (
        isinstance(operation, str) and isinstance(structure, str)
        and STRUCTURE_FOR_OPERATION.get(operation) == structure
    )
    _check(results, "data_structure_choice",
           "structure_matches_skill_mapping", operation,
           has_operation and has_structure, mapping_ok,
           "the skill's mapping: hash map -> O(1) lookup; heap -> "
           "top-k / priority; BST/B-tree -> ordered range; trie -> "
           "prefix; union-find -> connectivity; deque -> sliding "
           "window; prefix sums -> range queries")
    _false_check(results, "data_structure_choice",
                 "structure_does_not_force_quadratic",
                 manifest, ("design", "structure_forces_quadratic"),
                 "anti-pattern: the wrong data structure forcing "
                 "O(n^2)")

    # ---- Section 4: pattern_application (skill: pattern toolbox,
    #      with its conditional duties) ----
    pattern, has_pattern = _get(manifest, "design", "pattern")
    pattern_ok = isinstance(pattern, str) and pattern in PATTERNS
    _check(results, "pattern_application", "pattern_in_skill_toolbox",
           pattern, has_pattern, pattern_ok,
           "pattern toolbox: two pointers, sliding window, binary "
           "search (including on the answer), divide & conquer, "
           "greedy, dynamic programming, graph traversal, hashing")
    if has_pattern and pattern == "greedy":
        proven, has_proven = _get(manifest, "design",
                                  "greedy_safety_proven")
        _check(results, "pattern_application",
               "greedy_safety_proven_when_greedy", proven, has_proven,
               proven is True,
               "greedy is used only when proven safe")
    else:
        _check(results, "pattern_application",
               "greedy_safety_proven_when_greedy", pattern,
               has_pattern, True,
               "the declared pattern is not greedy — no greedy "
               "safety proof is required")
    if has_pattern and pattern == "dynamic_programming":
        state, has_state = _get(manifest, "design", "dp_state_defined")
        transition, has_transition = _get(
            manifest, "design", "dp_transition_defined")
        base, has_base = _get(manifest, "design",
                              "dp_base_case_defined")
        dp_present = has_state and has_transition and has_base
        dp_ok = state is True and transition is True and base is True
        _check(results, "pattern_application",
               "dp_definition_complete_when_dp", state, dp_present,
               dp_ok,
               "dynamic programming: define state + transition + "
               "base case")
    else:
        _check(results, "pattern_application",
               "dp_definition_complete_when_dp", pattern, has_pattern,
               True,
               "the declared pattern is not dynamic programming — "
               "no DP state / transition / base case is required")
    if has_pattern and pattern == "graph_traversal":
        variant, has_variant = _get(
            manifest, "design", "graph_traversal_variant_named")
        _check(results, "pattern_application",
               "graph_traversal_variant_named_when_graph", variant,
               has_variant, variant is True,
               "graph traversal: name the variant — BFS / DFS / "
               "Dijkstra / topological sort")
    else:
        _check(results, "pattern_application",
               "graph_traversal_variant_named_when_graph", pattern,
               has_pattern, True,
               "the declared pattern is not graph traversal — no "
               "traversal variant is required")

    # ---- Section 5: correctness_and_edges (skill: define
    #      invariants and reason about termination; hit the edge
    #      cases; test the edges and properties) ----
    _bool_check(results, "correctness_and_edges",
                "invariant_defined_and_reasoned",
                manifest, ("correctness", "invariant_reasoned"),
                "correctness: define invariants and reason about them")
    _bool_check(results, "correctness_and_edges", "termination_reasoned",
                manifest, ("correctness", "termination_reasoned"),
                "correctness: reason about termination")
    _bool_check(results, "correctness_and_edges",
                "edge_case_empty_handled",
                manifest, ("correctness", "edge_cases", "empty"),
                "hit the edge cases: empty")
    _bool_check(results, "correctness_and_edges",
                "edge_case_single_element_handled",
                manifest,
                ("correctness", "edge_cases", "single_element"),
                "hit the edge cases: single element")
    _bool_check(results, "correctness_and_edges",
                "edge_case_duplicates_handled",
                manifest, ("correctness", "edge_cases", "duplicates"),
                "hit the edge cases: duplicates")
    _bool_check(results, "correctness_and_edges",
                "edge_case_boundaries_handled",
                manifest, ("correctness", "edge_cases", "boundaries"),
                "hit the edge cases: boundaries")
    _bool_check(results, "correctness_and_edges",
                "edge_case_integer_overflow_handled",
                manifest,
                ("correctness", "edge_cases", "integer_overflow"),
                "hit the edge cases: integer overflow")
    _bool_check(results, "correctness_and_edges",
                "edges_and_properties_tested",
                manifest, ("correctness", "edges_and_properties_tested"),
                "test the edges and properties, not just the happy "
                "path — no edge-case tests is an anti-pattern")

    # ---- Section 6: verification_and_optimization (skill: where
    #      correctness is critical, prove / property-test / certify;
    #      optimize last, measured — correct first, profile, then
    #      optimize the proven bottleneck) ----
    critical, has_critical = _get(manifest, "verification",
                                  "correctness_critical")
    method, has_method = _get(manifest, "verification", "method")
    if has_critical and critical:
        method_ok = (isinstance(method, str)
                     and method in VERIFICATION_METHODS)
        _check(results, "verification_and_optimization",
               "verification_method_declared_when_critical", method,
               has_method, method_ok,
               "where correctness is critical: prove the invariant, "
               "use property-based testing (hypothesis / proptest), "
               "or attach a formal / cryptographic certificate of "
               "correctness")
    else:
        _check(results, "verification_and_optimization",
               "verification_method_declared_when_critical", critical,
               has_critical, True,
               "correctness is not declared critical — no "
               "verification method is required")
    _bool_check(results, "verification_and_optimization",
                "correctness_established_before_optimization",
                manifest,
                ("optimization", "correctness_established_first"),
                "correct first, fast second — clever code over "
                "correct code is an anti-pattern")
    _bool_check(results, "verification_and_optimization",
                "profiled_before_optimizing",
                manifest, ("optimization", "profiled_before_optimizing"),
                "optimize last, measured: get it correct, profile, "
                "then optimize the proven bottleneck")
    _false_check(results, "verification_and_optimization",
                 "not_optimized_before_measuring",
                 manifest, ("optimization", "optimized_before_measuring"),
                 "anti-pattern: optimizing before measuring — never "
                 "optimize before measuring")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "DESIGN_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DESIGN_SOUND"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("quadratic_at_fatal_scale_absent",
                          "structure_matches_skill_mapping",
                          "pattern_in_skill_toolbox")
    ]
    if any(s == "fail" for s in computed_statuses):
        design_status = "not_sound_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        design_status = "sound_on_declared_evidence"
    else:
        design_status = None

    scale_check_status = next(
        r["status"] for r in results
        if r["check"] == "quadratic_at_fatal_scale_absent")
    if scale_check_status == "fail":
        scale_status = "fatal_scale_combination_declared"
    elif scale_check_status == "pass":
        scale_status = "no_fatal_scale_combination_declared"
    else:
        scale_status = None

    return {
        "service": "algorithm-design-implementation",
        "atom_version": "0.1.0",
        "problem": manifest.get("problem"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "design_status": design_status,
        "scale_status": scale_status,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "ALGORITHM DESIGN IMPLEMENTATION",
        f"problem: {verdict.get('problem')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: algorithm_design_implementation.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
