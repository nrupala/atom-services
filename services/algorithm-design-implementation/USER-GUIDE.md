# Algorithm design implementation — user guide

## What it does

You are about to implement an algorithm. This atom reads a declared
design record for one algorithm problem — decomposition, complexity
reasoning, data-structure and pattern choices, correctness and
edge-case record, verification and optimisation record — and returns
one deterministic verdict across six sections: **DESIGN_SOUND**,
**DESIGN_UNSOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but
evidence is missing — the verdict names exactly which). Three checks
are computed: the chosen structure must match the skill's mapping for
the key operation, the pattern must be in the skill's toolbox, and an
`O(n^2)` design at `max_input_size` ≥ 10,000,000 is the fatal-scale
combination. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "algorithm-design-implementation"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/algorithm-design-implementation`
  — tool name `algorithm_design_implementation`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/algorithm-design-implementation`
  — body = the manifest object; same `Authorization` header.

## Input — the algorithm design manifest

| Field | Meaning |
|---|---|
| `problem` | problem name (string; carried into the output, not checked) |
| `decomposition.inputs_stated` / `outputs_stated` / `constraints_stated` / `invariant_stated` / `pseudocode_sketched` / `input_scale_stated` | decomposition evidence |
| `decomposition.max_input_size` | number; read by the computed fatal-scale check |
| `complexity.time_big_o_stated` / `space_big_o_stated` / `dominant_term_identified` / `bottleneck_identified` / `tradeoffs_named` | complexity reasoning evidence |
| `complexity.time_complexity` | string, e.g. `O(n^2)`; read by the fatal-scale check |
| `design.key_operation_identified`, `design.key_operation`, `design.chosen_structure` | key operation and structure; the pair must match the skill mapping (`lookup`→`hash_map`, `top_k_or_priority`→`heap`, `ordered_range`→`bst_or_btree`, `prefix`→`trie`, `connectivity`→`union_find`, `sliding_window`→`deque`, `range_queries`→`prefix_sums`) |
| `design.structure_forces_quadratic` | must be `false` to pass |
| `design.pattern` | one of `two_pointers`, `sliding_window`, `binary_search`, `binary_search_on_answer`, `divide_and_conquer`, `greedy`, `dynamic_programming`, `graph_traversal`, `hashing` |
| `design.greedy_safety_proven` / `dp_state_defined` / `dp_transition_defined` / `dp_base_case_defined` / `graph_traversal_variant_named` | conditional duties, required only for the matching pattern |
| `correctness.invariant_reasoned` / `termination_reasoned` / `edge_cases.*` / `edges_and_properties_tested` | correctness and edge-case evidence |
| `verification.correctness_critical`, `verification.method` | method required when critical; one of `invariant_proof`, `property_based_testing`, `formal_or_cryptographic_certificate` |
| `optimization.correctness_established_first` / `profiled_before_optimizing` / `optimized_before_measuring` | last field must be `false` to pass |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check
fails (counts toward DESIGN_UNSOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/algorithm-design-implementation`:

```json
{
  "problem": "Find top K elements",
  "decomposition": {
    "inputs_stated": true,
    "outputs_stated": true,
    "constraints_stated": true,
    "invariant_stated": true,
    "pseudocode_sketched": true,
    "input_scale_stated": true,
    "max_input_size": 1000
  },
  "complexity": {
    "time_big_o_stated": true,
    "space_big_o_stated": true,
    "dominant_term_identified": true,
    "bottleneck_identified": true,
    "tradeoffs_named": true,
    "time_complexity": "O(n log k)"
  },
  "design": {
    "key_operation_identified": true,
    "key_operation": "top_k_or_priority",
    "chosen_structure": "heap",
    "structure_forces_quadratic": false,
    "pattern": "greedy",
    "greedy_safety_proven": true
  },
  "correctness": {
    "invariant_reasoned": true,
    "termination_reasoned": true,
    "edge_cases": {
      "empty": true,
      "single_element": true,
      "duplicates": true,
      "boundaries": true,
      "integer_overflow": true
    },
    "edges_and_properties_tested": true
  },
  "verification": {
    "correctness_critical": true,
    "method": "invariant_proof"
  },
  "optimization": {
    "correctness_established_first": true,
    "profiled_before_optimizing": true,
    "optimized_before_measuring": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 31 checks
and a text stamp of the verdict):

```json
{
  "service": "algorithm-design-implementation",
  "atom_version": "0.1.0",
  "problem": "Find top K elements",
  "verdict": "DESIGN_SOUND",
  "sections": {
    "decomposition": "pass",
    "complexity_reasoning": "pass",
    "data_structure_choice": "pass",
    "pattern_application": "pass",
    "correctness_and_edges": "pass",
    "verification_and_optimization": "pass"
  },
  "design_status": "sound_on_declared_evidence",
  "scale_status": "no_fatal_scale_combination_declared",
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across six sections."
}
```

## Verdicts

- **DESIGN_SOUND** — every check passes; the design is sound on the declared evidence.
- **DESIGN_UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `design_status` (`sound_on_declared_evidence` / `not_sound_on_declared_evidence` / null) over the three computed checks and `scale_status` (`no_fatal_scale_combination_declared` / `fatal_scale_combination_declared` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
