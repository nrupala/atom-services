# Algorithm design implementation — `algorithm-design-implementation`

**Display name:** Algorithm design implementation · **Slug:** `algorithm-design-implementation` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "algorithm-design-implementation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the algorithm design manifest.** Fill every group in the [Input reference](#input-reference): the identifier field `problem` plus one object per section. Declare values truthfully — the atom judges declared evidence (see Explanation). The recorded run's manifest is example 1 below.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/algorithm-design-implementation` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `DESIGN_SOUND` — 31 pass, 0 fail, 0 missing of 31 checks across six sections. The declared key operation / chosen structure pair matches the skill's mapping table exactly, the declared pattern is one of the skill's nine toolbox patterns, and no fatal scale combination (exactly `"O(n^2)"` at `max_input_size` ≥ 10,000,000) is declared — so all three computed checks pass and `design_status` reports `sound_on_declared_evidence`.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "algorithm-design-implementation"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/algorithm-design-implementation` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/algorithm-design-implementation` with the same `Authorization: Bearer <key>` header and call the tool `algorithm_design_implementation` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `DESIGN_UNSOUND` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples), five checks fail: `quadratic_at_fatal_scale_absent`, `structure_matches_skill_mapping`, `structure_does_not_force_quadratic`, `pattern_in_skill_toolbox` and `not_optimized_before_measuring`. Fix = pick the structure the skill's table pairs with your key operation (one that does not force quadratic behaviour), declare a pattern from the skill's nine-pattern toolbox, avoid the fatal `"O(n^2)"` at ≥ 10⁷ combination (or reduce the declared scale honestly), and measure before optimizing — then resubmit.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `decomposition` with detail "decomposition must be an object" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/algorithm-design-implementation` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/algorithm-design-implementation` — tool name `algorithm_design_implementation`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks. Types are from SERVICE.md's field table (all fields are booleans unless noted), corroborated by contract.yaml and the recorded evidence input schema. An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `problem` | string | — | string; carried into the verdict output, not itself checked |
| `decomposition.inputs_stated` | boolean | decomposition |  |
| `decomposition.outputs_stated` | boolean | decomposition |  |
| `decomposition.constraints_stated` | boolean | decomposition |  |
| `decomposition.invariant_stated` | boolean | decomposition |  |
| `decomposition.pseudocode_sketched` | boolean | decomposition |  |
| `decomposition.input_scale_stated` | boolean | decomposition |  |
| `decomposition.max_input_size` | number | complexity_reasoning | number; read by the computed scale check below |
| `complexity.time_big_o_stated` | boolean | complexity_reasoning |  |
| `complexity.space_big_o_stated` | boolean | complexity_reasoning |  |
| `complexity.dominant_term_identified` | boolean | complexity_reasoning |  |
| `complexity.bottleneck_identified` | boolean | complexity_reasoning |  |
| `complexity.tradeoffs_named` | boolean | complexity_reasoning |  |
| `complexity.time_complexity` | string | complexity_reasoning | string; read by the computed scale check below |
| `design.key_operation_identified` | boolean | data_structure_choice |  |
| `design.key_operation` | string | data_structure_choice | string; read by the computed mapping check below |
| `design.chosen_structure` | string | data_structure_choice | string; read by the computed mapping check below |
| `design.structure_forces_quadratic` | boolean | data_structure_choice | must be `false` to pass — skill anti-pattern |
| `design.pattern` | string | pattern_application | string; read by the computed toolbox check and the three conditional checks below |
| `design.greedy_safety_proven` | boolean | pattern_application | required when the declared pattern is `greedy`; otherwise the check passes as not applicable |
| `design.dp_state_defined` | boolean | pattern_application | required when the declared pattern is `dynamic_programming` |
| `design.dp_transition_defined` | boolean | pattern_application | required when the declared pattern is `dynamic_programming` |
| `design.dp_base_case_defined` | boolean | pattern_application | required when the declared pattern is `dynamic_programming` |
| `design.graph_traversal_variant_named` | boolean | pattern_application | required when the declared pattern is `graph_traversal`; otherwise the check passes as not applicable |
| `correctness.invariant_reasoned` | boolean | correctness_and_edges |  |
| `correctness.termination_reasoned` | boolean | correctness_and_edges |  |
| `correctness.edge_cases.empty` | boolean | correctness_and_edges |  |
| `correctness.edge_cases.single_element` | boolean | correctness_and_edges |  |
| `correctness.edge_cases.duplicates` | boolean | correctness_and_edges |  |
| `correctness.edge_cases.boundaries` | boolean | correctness_and_edges |  |
| `correctness.edge_cases.integer_overflow` | boolean | correctness_and_edges |  |
| `correctness.edges_and_properties_tested` | boolean | correctness_and_edges |  |
| `verification.correctness_critical` | boolean | verification_and_optimization | gates the method check below |
| `verification.method` | string | verification_and_optimization | string; required when correctness is declared critical; otherwise the check passes as not applicable |
| `optimization.correctness_established_first` | boolean | verification_and_optimization |  |
| `optimization.profiled_before_optimizing` | boolean | verification_and_optimization |  |
| `optimization.optimized_before_measuring` | boolean | verification_and_optimization | must be `false` to pass — skill anti-pattern |

### Checks

All 31 checks, exactly as named in the recorded full-pass REST response, grouped by section/bar. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence (a gated check whose gate is closed also reports `pass`, as not applicable); `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. There is no separate not-applicable status value in the output.

#### Section: `decomposition` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `inputs_stated` | decompose first: the inputs are stated before coding |
| `outputs_stated` | decompose first: the outputs are stated before coding |
| `constraints_stated` | decompose first: the constraints are stated before coding |
| `invariant_stated` | decompose first: the invariant is stated before coding |
| `pseudocode_sketched_before_coding` | sketch pseudocode before coding |
| `input_scale_stated` | know the input scale — O(n^2) is fine at n=100, fatal at n=10^7 |
#### Section: `complexity_reasoning` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `time_big_o_stated` | reason Big-O for time up front, so you don't design an O(n^2) corner you can't escape |
| `space_big_o_stated` | reason Big-O for space up front |
| `dominant_term_identified` | identify the dominant term of the cost |
| `bottleneck_identified` | identify the real bottleneck |
| `tradeoffs_named` | name the trade-offs: time vs space, exact vs approximate, latency vs throughput, simplicity vs speed |
| `quadratic_at_fatal_scale_absent` | know the input scale: O(n^2) is fine at n=100, fatal at n=10^7 — a quadratic design at or above that scale is the fatal combination |
#### Section: `data_structure_choice` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `key_operation_identified` | pick the structure that makes the key operation cheap — the key operation is identified |
| `structure_matches_skill_mapping` | the skill's mapping: hash map -> O(1) lookup; heap -> top-k / priority; BST/B-tree -> ordered range; trie -> prefix; union-find -> connectivity; deque -> sliding window; prefix sums -> range queries |
| `structure_does_not_force_quadratic` | anti-pattern: the wrong data structure forcing O(n^2) |
#### Section: `pattern_application` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `pattern_in_skill_toolbox` | pattern toolbox: two pointers, sliding window, binary search (including on the answer), divide & conquer, greedy, dynamic programming, graph traversal, hashing |
| `greedy_safety_proven_when_greedy` | greedy is used only when proven safe |
| `dp_definition_complete_when_dp` | the declared pattern is not dynamic programming — no DP state / transition / base case is required |
| `graph_traversal_variant_named_when_graph` | the declared pattern is not graph traversal — no traversal variant is required |
#### Section: `correctness_and_edges` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `invariant_defined_and_reasoned` | correctness: define invariants and reason about them |
| `termination_reasoned` | correctness: reason about termination |
| `edge_case_empty_handled` | hit the edge cases: empty |
| `edge_case_single_element_handled` | hit the edge cases: single element |
| `edge_case_duplicates_handled` | hit the edge cases: duplicates |
| `edge_case_boundaries_handled` | hit the edge cases: boundaries |
| `edge_case_integer_overflow_handled` | hit the edge cases: integer overflow |
| `edges_and_properties_tested` | test the edges and properties, not just the happy path — no edge-case tests is an anti-pattern |
#### Section: `verification_and_optimization` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `verification_method_declared_when_critical` | where correctness is critical: prove the invariant, use property-based testing (hypothesis / proptest), or attach a formal / cryptographic certificate of correctness |
| `correctness_established_before_optimization` | correct first, fast second — clever code over correct code is an anti-pattern |
| `profiled_before_optimizing` | optimize last, measured: get it correct, profile, then optimize the proven bottleneck |
| `not_optimized_before_measuring` | anti-pattern: optimizing before measuring — never optimize before measuring |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug.
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `problem` — The caller's identifier value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 31 per-check results: `section`, `check`, `status`, `evidence`.
- `design_status` — `sound_on_declared_evidence` / `not_sound_on_declared_evidence` over the three computed checks (structure mapping, pattern toolbox, fatal scale); `null` when any of the three cannot be completed.
- `scale_status` — `no_fatal_scale_combination_declared` / `fatal_scale_combination_declared` for the scale check alone; `null` when it cannot be completed.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, identifier, verdict, per-section statuses, summary) for logs and tickets.

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `DESIGN_SOUND` — All 31 checks pass.
- `DESIGN_UNSOUND` — At least one check fails.
- `INSUFFICIENT_EVIDENCE` — Nothing fails, but at least one check is `missing` — evidence was not declared.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks. Gated/not-applicable checks report `pass` when their gate is closed; there is no distinct not-applicable value.

**Computed fields:**

- `design_status` — `sound_on_declared_evidence` / `not_sound_on_declared_evidence` over the three computed checks (structure mapping, pattern toolbox, fatal scale); `null` when any of the three cannot be completed.
- `scale_status` — `no_fatal_scale_combination_declared` / `fatal_scale_combination_declared` for the scale check alone; `null` when it cannot be completed.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key. No verdict is produced.
- **403** — the key lacks this atom's scope. Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "decomposition", "detail": "decomposition must be an object"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); prices are set only from measured production cost per unit.

## Explanation

The atom audits a declared design record for one algorithm problem across six sections. Three checks are computed against vocabularies the skill itself states — no outside criterion is imported. **Structure mapping:** the skill pairs each key operation with the structure that makes it cheap — `lookup` → `hash_map`, `top_k_or_priority` → `heap`, `ordered_range` → `bst_or_btree`, `prefix` → `trie`, `connectivity` → `union_find`, `sliding_window` → `deque`, `range_queries` → `prefix_sums`; any other declared pair fails, because the skill names no mapping for it. **Pattern toolbox:** the pattern passes only as one of nine — `two_pointers`, `sliding_window`, `binary_search`, `binary_search_on_answer`, `divide_and_conquer`, `greedy`, `dynamic_programming`, `graph_traversal`, `hashing`. **Fatal scale:** the skill states O(n²) is 'fine at n=100, fatal at n=10^7', so the check fails only for exactly `"O(n^2)"` at `max_input_size` ≥ 10,000,000, compared on unrounded declared values (9,999,999.5 passes, 10,000,000 fails); an absent size or complexity string is missing evidence, not a failure. Pattern-conditional checks (greedy safety; DP state/transition/base case; graph traversal variant) and the verification-method gate (`verification.correctness_critical`) pass as not applicable when their gate is closed.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is the not-passing verdict). Any single `fail` decides the verdict immediately in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns the passing verdict. Where a check is gated, a closed gate makes it pass as not applicable rather than missing: the gate field itself carries the evidence that the check does not apply.

**What it does NOT do.** It audits a **declared** design record — it does not write code, read code, run code, execute tests, profile anything, or verify that a declared fact is true. Named exclusions: no judgment of whether the chosen algorithm is the *best* one beyond the skill's stated mapping and toolbox; no Big-O correctness verification — Big-O, dominant term, bottleneck and trade-offs are checked as *stated*, and scale is judged only at the one anchor the skill states; no complexity classes beyond the exact string `"O(n^2)"` are treated as quadratic; key operations and patterns outside the skill's table and toolbox cannot pass; verification methods are checked only for membership in the skill's stated options, not for proof quality.

**Buyer / use context.** Teams and agents in engineering & code doing performance-critical code builds who need a deterministic soundness verdict on an algorithm design record before implementation. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/algorithm_design_implementation.py` — `evaluate(manifest) -> verdict dict`; tests: tests/test_algorithm_design_implementation.py — 42 tests, all passing 2026-11-15). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/algorithm-design-implementation` and MCP `POST /mcp/algorithm-design-implementation` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-15T23:51:30.770590+00:00 against gateway v1.1.0, external verification lane, source `verification/work/algorithm-design-implementation/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

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

Response (`response_text`):

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
  "checks": [
    {
      "section": "decomposition",
      "check": "inputs_stated",
      "status": "pass",
      "evidence": "decompose first: the inputs are stated before coding"
    },
    {
      "section": "decomposition",
      "check": "outputs_stated",
      "status": "pass",
      "evidence": "decompose first: the outputs are stated before coding"
    },
    {
      "section": "decomposition",
      "check": "constraints_stated",
      "status": "pass",
      "evidence": "decompose first: the constraints are stated before coding"
    },
    {
      "section": "decomposition",
      "check": "invariant_stated",
      "status": "pass",
      "evidence": "decompose first: the invariant is stated before coding"
    },
    {
      "section": "decomposition",
      "check": "pseudocode_sketched_before_coding",
      "status": "pass",
      "evidence": "sketch pseudocode before coding"
    },
    {
      "section": "decomposition",
      "check": "input_scale_stated",
      "status": "pass",
      "evidence": "know the input scale \u2014 O(n^2) is fine at n=100, fatal at n=10^7"
    },
    {
      "section": "complexity_reasoning",
      "check": "time_big_o_stated",
      "status": "pass",
      "evidence": "reason Big-O for time up front, so you don't design an O(n^2) corner you can't escape"
    },
    {
      "section": "complexity_reasoning",
      "check": "space_big_o_stated",
      "status": "pass",
      "evidence": "reason Big-O for space up front"
    },
    {
      "section": "complexity_reasoning",
      "check": "dominant_term_identified",
      "status": "pass",
      "evidence": "identify the dominant term of the cost"
    },
    {
      "section": "complexity_reasoning",
      "check": "bottleneck_identified",
      "status": "pass",
      "evidence": "identify the real bottleneck"
    },
    {
      "section": "complexity_reasoning",
      "check": "tradeoffs_named",
      "status": "pass",
      "evidence": "name the trade-offs: time vs space, exact vs approximate, latency vs throughput, simplicity vs speed"
    },
    {
      "section": "complexity_reasoning",
      "check": "quadratic_at_fatal_scale_absent",
      "status": "pass",
      "evidence": "know the input scale: O(n^2) is fine at n=100, fatal at n=10^7 \u2014 a quadratic design at or above that scale is the fatal combination"
    },
    {
      "section": "data_structure_choice",
      "check": "key_operation_identified",
      "status": "pass",
      "evidence": "pick the structure that makes the key operation cheap \u2014 the key operation is identified"
    },
    {
      "section": "data_structure_choice",
      "check": "structure_matches_skill_mapping",
      "status": "pass",
      "evidence": "the skill's mapping: hash map -> O(1) lookup; heap -> top-k / priority; BST/B-tree -> ordered range; trie -> prefix; union-find -> connectivity; deque -> sliding window; prefix sums -> range queries"
    },
    {
      "section": "data_structure_choice",
      "check": "structure_does_not_force_quadratic",
      "status": "pass",
      "evidence": "anti-pattern: the wrong data structure forcing O(n^2)"
    },
    {
      "section": "pattern_application",
      "check": "pattern_in_skill_toolbox",
      "status": "pass",
      "evidence": "pattern toolbox: two pointers, sliding window, binary search (including on the answer), divide & conquer, greedy, dynamic programming, graph traversal, hashing"
    },
    {
      "section": "pattern_application",
      "check": "greedy_safety_proven_when_greedy",
      "status": "pass",
      "evidence": "greedy is used only when proven safe"
    },
    {
      "section": "pattern_application",
      "check": "dp_definition_complete_when_dp",
      "status": "pass",
      "evidence": "the declared pattern is not dynamic programming \u2014 no DP state / transition / base case is required"
    },
    {
      "section": "pattern_application",
      "check": "graph_traversal_variant_named_when_graph",
      "status": "pass",
      "evidence": "the declared pattern is not graph traversal \u2014 no traversal variant is required"
    },
    {
      "section": "correctness_and_edges",
      "check": "invariant_defined_and_reasoned",
      "status": "pass",
      "evidence": "correctness: define invariants and reason about them"
    },
    {
      "section": "correctness_and_edges",
      "check": "termination_reasoned",
      "status": "pass",
      "evidence": "correctness: reason about termination"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_empty_handled",
      "status": "pass",
      "evidence": "hit the edge cases: empty"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_single_element_handled",
      "status": "pass",
      "evidence": "hit the edge cases: single element"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_duplicates_handled",
      "status": "pass",
      "evidence": "hit the edge cases: duplicates"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_boundaries_handled",
      "status": "pass",
      "evidence": "hit the edge cases: boundaries"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_integer_overflow_handled",
      "status": "pass",
      "evidence": "hit the edge cases: integer overflow"
    },
    {
      "section": "correctness_and_edges",
      "check": "edges_and_properties_tested",
      "status": "pass",
      "evidence": "test the edges and properties, not just the happy path \u2014 no edge-case tests is an anti-pattern"
    },
    {
      "section": "verification_and_optimization",
      "check": "verification_method_declared_when_critical",
      "status": "pass",
      "evidence": "where correctness is critical: prove the invariant, use property-based testing (hypothesis / proptest), or attach a formal / cryptographic certificate of correctness"
    },
    {
      "section": "verification_and_optimization",
      "check": "correctness_established_before_optimization",
      "status": "pass",
      "evidence": "correct first, fast second \u2014 clever code over correct code is an anti-pattern"
    },
    {
      "section": "verification_and_optimization",
      "check": "profiled_before_optimizing",
      "status": "pass",
      "evidence": "optimize last, measured: get it correct, profile, then optimize the proven bottleneck"
    },
    {
      "section": "verification_and_optimization",
      "check": "not_optimized_before_measuring",
      "status": "pass",
      "evidence": "anti-pattern: optimizing before measuring \u2014 never optimize before measuring"
    }
  ],
  "design_status": "sound_on_declared_evidence",
  "scale_status": "no_fatal_scale_combination_declared",
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across six sections.",
  "stamp": "ALGORITHM DESIGN IMPLEMENTATION\nproblem: Find top K elements\nVERDICT: DESIGN_SOUND\n  decomposition                    pass\n  complexity_reasoning             pass\n  data_structure_choice            pass\n  pattern_application              pass\n  correctness_and_edges            pass\n  verification_and_optimization    pass\n31 pass, 0 fail, 0 missing of 31 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "problem": "Quadratic search",
  "decomposition": {
    "inputs_stated": true,
    "outputs_stated": true,
    "constraints_stated": true,
    "invariant_stated": true,
    "pseudocode_sketched": true,
    "input_scale_stated": true,
    "max_input_size": 10000000
  },
  "complexity": {
    "time_big_o_stated": true,
    "space_big_o_stated": true,
    "dominant_term_identified": true,
    "bottleneck_identified": true,
    "tradeoffs_named": true,
    "time_complexity": "O(n^2)"
  },
  "design": {
    "key_operation_identified": true,
    "key_operation": "lookup",
    "chosen_structure": "bst_or_btree",
    "structure_forces_quadratic": true,
    "pattern": "invalid_pattern"
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
    "correctness_critical": false
  },
  "optimization": {
    "correctness_established_first": true,
    "profiled_before_optimizing": true,
    "optimized_before_measuring": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "algorithm-design-implementation",
  "atom_version": "0.1.0",
  "problem": "Quadratic search",
  "verdict": "DESIGN_UNSOUND",
  "sections": {
    "decomposition": "pass",
    "complexity_reasoning": "fail",
    "data_structure_choice": "fail",
    "pattern_application": "fail",
    "correctness_and_edges": "pass",
    "verification_and_optimization": "fail"
  },
  "checks": [
    {
      "section": "decomposition",
      "check": "inputs_stated",
      "status": "pass",
      "evidence": "decompose first: the inputs are stated before coding"
    },
    {
      "section": "decomposition",
      "check": "outputs_stated",
      "status": "pass",
      "evidence": "decompose first: the outputs are stated before coding"
    },
    {
      "section": "decomposition",
      "check": "constraints_stated",
      "status": "pass",
      "evidence": "decompose first: the constraints are stated before coding"
    },
    {
      "section": "decomposition",
      "check": "invariant_stated",
      "status": "pass",
      "evidence": "decompose first: the invariant is stated before coding"
    },
    {
      "section": "decomposition",
      "check": "pseudocode_sketched_before_coding",
      "status": "pass",
      "evidence": "sketch pseudocode before coding"
    },
    {
      "section": "decomposition",
      "check": "input_scale_stated",
      "status": "pass",
      "evidence": "know the input scale \u2014 O(n^2) is fine at n=100, fatal at n=10^7"
    },
    {
      "section": "complexity_reasoning",
      "check": "time_big_o_stated",
      "status": "pass",
      "evidence": "reason Big-O for time up front, so you don't design an O(n^2) corner you can't escape"
    },
    {
      "section": "complexity_reasoning",
      "check": "space_big_o_stated",
      "status": "pass",
      "evidence": "reason Big-O for space up front"
    },
    {
      "section": "complexity_reasoning",
      "check": "dominant_term_identified",
      "status": "pass",
      "evidence": "identify the dominant term of the cost"
    },
    {
      "section": "complexity_reasoning",
      "check": "bottleneck_identified",
      "status": "pass",
      "evidence": "identify the real bottleneck"
    },
    {
      "section": "complexity_reasoning",
      "check": "tradeoffs_named",
      "status": "pass",
      "evidence": "name the trade-offs: time vs space, exact vs approximate, latency vs throughput, simplicity vs speed"
    },
    {
      "section": "complexity_reasoning",
      "check": "quadratic_at_fatal_scale_absent",
      "status": "fail",
      "evidence": "know the input scale: O(n^2) is fine at n=100, fatal at n=10^7 \u2014 a quadratic design at or above that scale is the fatal combination"
    },
    {
      "section": "data_structure_choice",
      "check": "key_operation_identified",
      "status": "pass",
      "evidence": "pick the structure that makes the key operation cheap \u2014 the key operation is identified"
    },
    {
      "section": "data_structure_choice",
      "check": "structure_matches_skill_mapping",
      "status": "fail",
      "evidence": "the skill's mapping: hash map -> O(1) lookup; heap -> top-k / priority; BST/B-tree -> ordered range; trie -> prefix; union-find -> connectivity; deque -> sliding window; prefix sums -> range queries"
    },
    {
      "section": "data_structure_choice",
      "check": "structure_does_not_force_quadratic",
      "status": "fail",
      "evidence": "anti-pattern: the wrong data structure forcing O(n^2)"
    },
    {
      "section": "pattern_application",
      "check": "pattern_in_skill_toolbox",
      "status": "fail",
      "evidence": "pattern toolbox: two pointers, sliding window, binary search (including on the answer), divide & conquer, greedy, dynamic programming, graph traversal, hashing"
    },
    {
      "section": "pattern_application",
      "check": "greedy_safety_proven_when_greedy",
      "status": "pass",
      "evidence": "the declared pattern is not greedy \u2014 no greedy safety proof is required"
    },
    {
      "section": "pattern_application",
      "check": "dp_definition_complete_when_dp",
      "status": "pass",
      "evidence": "the declared pattern is not dynamic programming \u2014 no DP state / transition / base case is required"
    },
    {
      "section": "pattern_application",
      "check": "graph_traversal_variant_named_when_graph",
      "status": "pass",
      "evidence": "the declared pattern is not graph traversal \u2014 no traversal variant is required"
    },
    {
      "section": "correctness_and_edges",
      "check": "invariant_defined_and_reasoned",
      "status": "pass",
      "evidence": "correctness: define invariants and reason about them"
    },
    {
      "section": "correctness_and_edges",
      "check": "termination_reasoned",
      "status": "pass",
      "evidence": "correctness: reason about termination"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_empty_handled",
      "status": "pass",
      "evidence": "hit the edge cases: empty"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_single_element_handled",
      "status": "pass",
      "evidence": "hit the edge cases: single element"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_duplicates_handled",
      "status": "pass",
      "evidence": "hit the edge cases: duplicates"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_boundaries_handled",
      "status": "pass",
      "evidence": "hit the edge cases: boundaries"
    },
    {
      "section": "correctness_and_edges",
      "check": "edge_case_integer_overflow_handled",
      "status": "pass",
      "evidence": "hit the edge cases: integer overflow"
    },
    {
      "section": "correctness_and_edges",
      "check": "edges_and_properties_tested",
      "status": "pass",
      "evidence": "test the edges and properties, not just the happy path \u2014 no edge-case tests is an anti-pattern"
    },
    {
      "section": "verification_and_optimization",
      "check": "verification_method_declared_when_critical",
      "status": "pass",
      "evidence": "correctness is not declared critical \u2014 no verification method is required"
    },
    {
      "section": "verification_and_optimization",
      "check": "correctness_established_before_optimization",
      "status": "pass",
      "evidence": "correct first, fast second \u2014 clever code over correct code is an anti-pattern"
    },
    {
      "section": "verification_and_optimization",
      "check": "profiled_before_optimizing",
      "status": "pass",
      "evidence": "optimize last, measured: get it correct, profile, then optimize the proven bottleneck"
    },
    {
      "section": "verification_and_optimization",
      "check": "not_optimized_before_measuring",
      "status": "fail",
      "evidence": "anti-pattern: optimizing before measuring \u2014 never optimize before measuring"
    }
  ],
  "design_status": "not_sound_on_declared_evidence",
  "scale_status": "fatal_scale_combination_declared",
  "summary": "26 pass, 5 fail, 0 missing of 31 checks across six sections.",
  "stamp": "ALGORITHM DESIGN IMPLEMENTATION\nproblem: Quadratic search\nVERDICT: DESIGN_UNSOUND\n  decomposition                    pass\n  complexity_reasoning             fail\n  data_structure_choice            fail\n  pattern_application              fail\n  correctness_and_edges            pass\n  verification_and_optimization    fail\n26 pass, 5 fail, 0 missing of 31 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "problem": "Malformed input",
  "decomposition": "not_an_object"
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "decomposition",
  "detail": "decomposition must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 31 / 31 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 37 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom is an engineering/design review over declared evidence; its verdict is not itself compliance or audit evidence and its domain is not a regulated one (finance, security, licensing, privacy), so no regulator role view is included.
