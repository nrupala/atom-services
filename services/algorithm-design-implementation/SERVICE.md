# Algorithm design implementation — `algorithm-design-implementation`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Algorithmic implementation discipline — pick the right data structure and algorithm before writing code, reason about cost up front, implement it correctly first and fast second.

A caller submits a declared design record for one algorithm problem and receives one deterministic verdict back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Performance-critical code builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the algorithm design manifest

The caller submits one JSON manifest: a declared design record for
one algorithm problem. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`DESIGN_UNSOUND`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `problem` (string; carried into the verdict output, not itself checked) | — |
| `decomposition.inputs_stated` | decomposition |
| `decomposition.outputs_stated` | decomposition |
| `decomposition.constraints_stated` | decomposition |
| `decomposition.invariant_stated` | decomposition |
| `decomposition.pseudocode_sketched` | decomposition |
| `decomposition.input_scale_stated` | decomposition |
| `decomposition.max_input_size` (number; read by the computed scale check below) | complexity_reasoning |
| `complexity.time_big_o_stated` | complexity_reasoning |
| `complexity.space_big_o_stated` | complexity_reasoning |
| `complexity.dominant_term_identified` | complexity_reasoning |
| `complexity.bottleneck_identified` | complexity_reasoning |
| `complexity.tradeoffs_named` | complexity_reasoning |
| `complexity.time_complexity` (string; read by the computed scale check below) | complexity_reasoning |
| `design.key_operation_identified` | data_structure_choice |
| `design.key_operation` (string; read by the computed mapping check below) | data_structure_choice |
| `design.chosen_structure` (string; read by the computed mapping check below) | data_structure_choice |
| `design.structure_forces_quadratic` (must be `false` to pass — skill anti-pattern) | data_structure_choice |
| `design.pattern` (string; read by the computed toolbox check and the three conditional checks below) | pattern_application |
| `design.greedy_safety_proven` (required when the declared pattern is `greedy`; otherwise the check passes as not applicable) | pattern_application |
| `design.dp_state_defined` (required when the declared pattern is `dynamic_programming`) | pattern_application |
| `design.dp_transition_defined` (required when the declared pattern is `dynamic_programming`) | pattern_application |
| `design.dp_base_case_defined` (required when the declared pattern is `dynamic_programming`) | pattern_application |
| `design.graph_traversal_variant_named` (required when the declared pattern is `graph_traversal`; otherwise the check passes as not applicable) | pattern_application |
| `correctness.invariant_reasoned` | correctness_and_edges |
| `correctness.termination_reasoned` | correctness_and_edges |
| `correctness.edge_cases.empty` | correctness_and_edges |
| `correctness.edge_cases.single_element` | correctness_and_edges |
| `correctness.edge_cases.duplicates` | correctness_and_edges |
| `correctness.edge_cases.boundaries` | correctness_and_edges |
| `correctness.edge_cases.integer_overflow` | correctness_and_edges |
| `correctness.edges_and_properties_tested` | correctness_and_edges |
| `verification.correctness_critical` (gates the method check below) | verification_and_optimization |
| `verification.method` (string; required when correctness is declared critical; otherwise the check passes as not applicable) | verification_and_optimization |
| `optimization.correctness_established_first` | verification_and_optimization |
| `optimization.profiled_before_optimizing` | verification_and_optimization |
| `optimization.optimized_before_measuring` (must be `false` to pass — skill anti-pattern) | verification_and_optimization |

Three checks are computed from the declared values against
vocabularies the skill itself states — no outside criterion is
imported:

- **Structure mapping:** the skill's table pairs each key operation
  with the structure that makes it cheap — `lookup` → `hash_map`,
  `top_k_or_priority` → `heap`, `ordered_range` → `bst_or_btree`,
  `prefix` → `trie`, `connectivity` → `union_find`,
  `sliding_window` → `deque`, `range_queries` → `prefix_sums`. The
  declared pair passes only when it matches the table exactly; any
  other declared operation or structure fails, because the skill
  names no mapping for it.
- **Pattern toolbox:** the declared pattern passes only when it is
  one of the skill's nine — `two_pointers`, `sliding_window`,
  `binary_search`, `binary_search_on_answer`, `divide_and_conquer`,
  `greedy`, `dynamic_programming`, `graph_traversal`, `hashing`.
- **Fatal scale:** the skill states O(n^2) is "fine at n=100,
  fatal at n=10^7". The check therefore fails only for the fatal
  combination the skill names — declared `time_complexity` exactly
  `"O(n^2)"` at a declared `max_input_size` at or above 10,000,000
  — and passes whenever that combination is not declared. An
  absent size or an absent complexity string is missing
  evidence, not a failure; a present value of the wrong type is
  rejected as invalid input. Comparisons use the unrounded declared
  values, so 9,999,999.5 passes and 10,000,000 fails. No other
  complexity class is judged against scale: the skill states no
  other scale anchor, so none is invented.

The output also reports the computed `design_status`
(`sound_on_declared_evidence` / `not_sound_on_declared_evidence` /
null when any of the three computed checks cannot be completed)
over the mapping, toolbox and scale checks, and `scale_status`
(`no_fatal_scale_combination_declared` /
`fatal_scale_combination_declared` / null) for the scale check
alone.

The verdict is one of `DESIGN_SOUND` (all 31 checks pass),
`DESIGN_UNSOUND` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
decomposition, complexity_reasoning, data_structure_choice,
pattern_application, correctness_and_edges,
verification_and_optimization.

## Honest scoping

This atom audits a **declared** design record — it does not write
code, read code, run code, execute tests, profile anything, or
verify that a declared fact is true. A design is sound *on the
caller's declared evidence*: a record that declares a heap for a
top-k operation and a proven-safe greedy passes those checks even
if the implementation does something else.

Named exclusions: no judgment of whether the chosen algorithm is
the *best* one for the problem beyond the skill's stated mapping
and toolbox (the skill names no ranking among valid patterns, so
none is invented); no Big-O correctness verification — the atom
checks that time/space Big-O, the dominant term, the bottleneck
and the trade-offs are *stated*, and judges scale only at the one
anchor the skill states; no complexity classes beyond the exact
declared string `"O(n^2)"` are treated as quadratic; key operations
and patterns outside the skill's stated table and toolbox cannot
pass, because the skill names no mapping or pattern for them;
verification methods are checked only for membership in the
skill's three stated options, not for quality of the proof,
property suite, or certificate.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
