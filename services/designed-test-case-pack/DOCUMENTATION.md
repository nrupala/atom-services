# Designed test case pack — documentation

**Designed test case pack** · slug `designed-test-case-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `pack` "Login Feature Suite"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "designed-test-case-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the designed-test-case-pack manifest.** You declare a record of work already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the pack `Login Feature Suite`: requirements and cases are both declared; every requirement is traced to at least one case and every case traces to at least one declared requirement; case ids are unique and non-empty; every case declares its level, preconditions and steps, names a non-empty expected result, and declares that result was written before execution. At least one case is declared a boundary case and at least one a negative case. Equivalence partitioning and boundary value analysis are declared applied. Decision tables are not declared applicable, no stateful behaviour is declared present, and not many configuration axes are declared present, so those three gated technique checks pass as not applicable. Negative and error-guessing coverage, risk-based selection (ranked by damage × likelihood, highest-risk first, not-tested stated explicitly), stated coverage gaps, and cases written before execution complete the record, with no duplicate-path or happy-path-only suite declared.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/designed-test-case-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `TEST_CASE_PACK_SOUND`: "30 pass, 0 fail, 0 missing of 30 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `TEST_CASE_PACK_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "designed-test-case-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/designed-test-case-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/designed-test-case-pack` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `designed_test_case_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `TEST_CASE_PACK_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `every_requirement_traced_to_at_least_one_case`, `every_case_traces_to_at_least_one_requirement`, `every_case_has_expected_result`, `at_least_one_boundary_case_declared`, `at_least_one_negative_case_declared`, and the summary reads "25 pass, 5 fail, 0 missing of 30 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "requirements",
  "detail": "requirements must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/designed-test-case-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/designed-test-case-pack` — tool name `designed_test_case_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `designed_test_case_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `TEST_CASE_PACK_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `pack` | string | Carried into the verdict output, not itself checked |

#### Read by: traceability_and_case_format

| Field | Type | Notes |
|---|---|---|
| `requirements` | list | list of requirement-row objects, each `{id}` — see the entry field below; computed, see below |
| `requirements[].id` | string | The identifier a case's `requirement_ids` must name for the requirement to count as traced; must be a non-empty string |
| `cases[].id` | string | Names the row in the computed `cases_without_*` outputs; must be a non-empty string and unique across the pack |
| `cases[].requirement_ids` | list of strings | The declared requirements this case traces to — at least one entry must name a declared requirement `id` for the case to pass the computed traceability check; an absent field is missing evidence, an empty list fails |
| `cases[].level` | string | Must be a non-empty string for the row to pass the computed level check — an absent field is missing evidence, an empty string fails; no level vocabulary is imposed, see the declined thresholds |
| `cases[].preconditions_declared` | boolean | — |
| `cases[].steps_declared` | boolean | — |
| `cases[].expected_result` | string | Must be a non-empty string for the row to pass the computed expected-result check — an absent field is missing evidence, an empty string fails |
| `cases[].expected_result_written_before_execution` | boolean | — |

#### Read by: traceability_and_case_format, technique_coverage, negative_and_risk_selection

| Field | Type | Notes |
|---|---|---|
| `cases` | list | list of test-case-row objects, each `{id, requirement_ids, level, preconditions_declared, steps_declared, expected_result, expected_result_written_before_execution, covers_boundary, covers_negative}` — see the entry fields below; computed, see below |

#### Read by: technique_coverage

| Field | Type | Notes |
|---|---|---|
| `cases[].covers_boundary` | boolean | — |
| `technique_application.equivalence_partitioning_applied` | boolean | — |
| `technique_application.equivalence_representative_and_edges_per_class` | boolean | — |
| `technique_application.boundary_value_analysis_applied` | boolean | — |
| `technique_application.boundary_just_below_at_and_above_covered` | boolean | — |
| `technique_application.decision_tables_applicable` | boolean (gate) | gates the decision-table check below |
| `technique_application.decision_table_rules_covered_including_awkward` | boolean | required when decision tables are declared applicable; otherwise the check passes as not applicable |
| `technique_application.stateful_behaviour_present` | boolean (gate) | gates the state-transition check below |
| `technique_application.state_transitions_allowed_forbidden_and_interrupts_tested` | boolean | required when stateful behaviour is declared present; otherwise the check passes as not applicable |
| `technique_application.many_config_axes_present` | boolean (gate) | gates the pairwise check below |
| `technique_application.pairwise_pair_coverage_used` | boolean | required when many configuration axes are declared present; otherwise the check passes as not applicable |

#### Read by: negative_and_risk_selection

| Field | Type | Notes |
|---|---|---|
| `cases[].covers_negative` | boolean | — |
| `negative_and_error_guessing.negative_cases_designed` | boolean | — |
| `negative_and_error_guessing.invalid_inputs_covered` | boolean | — |
| `negative_and_error_guessing.wrong_order_retries_and_partial_failure_covered` | boolean | — |
| `risk_selection.risk_based_selection_applied` | boolean | — |
| `risk_selection.cases_ranked_by_damage_and_likelihood` | boolean | — |
| `risk_selection.highest_risk_cases_selected_first` | boolean | — |
| `risk_selection.not_tested_stated_explicitly` | boolean | — |

#### Read by: coverage_gaps_and_suite_hygiene

| Field | Type | Notes |
|---|---|---|
| `coverage.coverage_gaps_stated_explicitly` | boolean | — |
| `coverage.duplicate_path_suites_present` | boolean | must be `false` to pass — skill red line |
| `coverage.happy_path_only_suite_present` | boolean | must be `false` to pass — skill quality gate |
| `coverage.cases_written_before_execution` | boolean | — |

### Checks

All 30 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: traceability_and_case_format

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `requirements_declared` | case format: the declared pack record names its requirements — the requirements list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `cases_declared` | case format: the declared pack record names its test cases — the cases list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_requirement_traced_to_at_least_one_case` | quality gate: every requirement is traced to at least one case | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_case_traces_to_at_least_one_requirement` | case format: every declared case is traceable to at least one declared requirement | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_case_has_unique_nonempty_id` | case format: every declared case carries an id, and no id is declared twice | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_case_declares_level` | case format: every declared case declares its level | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_case_declares_preconditions` | case format: every declared case declares its preconditions | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_case_declares_steps` | case format: every declared case declares its steps | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_case_has_expected_result` | red line: no case without an expected result — every declared case names a non-empty expected result | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_case_expected_result_written_before_execution` | quality gate: expected results are written before execution — every declared case declares its expected result was written before running | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: technique_coverage

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `equivalence_partitioning_applied` | equivalence partitioning: inputs are grouped into classes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `equivalence_representative_and_edges_per_class` | equivalence partitioning: one representative plus the edges per class — not every value | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `boundary_value_analysis_applied` | boundary value analysis: boundaries are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `boundary_just_below_at_and_above_covered` | boundary value analysis: just-below / at / just-above each boundary is covered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `at_least_one_boundary_case_declared` | quality gate: boundaries are present — at least one declared case is declared a boundary case | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `decision_table_rules_covered_when_applicable` | decision tables not declared applicable | Conditional on `technique_application.decision_tables_applicable`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `state_transitions_tested_when_stateful` | no stateful behaviour declared present | Conditional on `technique_application.stateful_behaviour_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `pairwise_coverage_used_when_many_config_axes` | not many configuration axes declared present | Conditional on `technique_application.many_config_axes_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
#### Section: negative_and_risk_selection

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `negative_cases_designed` | negative + error guessing: negative cases are designed — accidents and attackers live here | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `invalid_inputs_covered` | negative + error guessing: invalid inputs are covered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `wrong_order_retries_and_partial_failure_covered` | negative + error guessing: wrong order, retries, and partial failure are covered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `at_least_one_negative_case_declared` | quality gate: negatives are present — at least one declared case is declared a negative case | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `risk_based_selection_applied` | risk-based selection: techniques and cases are chosen by risk | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cases_ranked_by_damage_and_likelihood` | risk-based selection: cases are ranked by damage times likelihood | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `highest_risk_cases_selected_first` | risk-based selection: the highest-risk cases are selected first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `not_tested_stated_explicitly` | risk-based selection: what is NOT tested is stated explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: coverage_gaps_and_suite_hygiene

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `coverage_gaps_stated_explicitly` | quality gate: coverage gaps are stated explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_duplicate_path_suites` | red line: no copy-paste suites that re-test the same path | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `not_happy_path_only` | quality gate: the suite is not happy paths only — boundaries and negatives are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `cases_written_before_execution` | case format: cases are written BEFORE running | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"designed-test-case-pack"`), `atom_version` (`"0.1.0"`), and `pack` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `requirements_count` and `cases_count` (declared list lengths as integers, or null when the list is not declared); the row-name lists `untraced_requirements`, `cases_without_expected_result` and `cases_without_traceability` (null when an underlying list is not declared; a case whose `requirement_ids` field is absent is missing evidence and does not appear in `cases_without_traceability`), `duplicate_case_ids` (null when the cases list is not declared), the ratios `requirement_trace_coverage` and `expected_result_coverage` (strings with exactly four decimal places; null when the denominator list is absent or empty — and, for requirement trace coverage, when the cases list is absent), and `computed_status` (see Verdict vocabulary). Ratios use the fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "30 pass, 0 fail, 0 missing of 30 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `TEST_CASE_PACK_SOUND` — all 30 checks pass: the declared record is complete and consistent with the bound skill's checklist, gates and red lines.
- `TEST_CASE_PACK_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the designed_test_case_pack scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the designed_test_case_pack scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"requirements","detail":"requirements must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for designed-test-case-pack exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Design test cases that find real bugs — partitioning, boundaries, decision tables, state machines, pairwise (bound from the test-design skill). You submit one declared record — the designed-test-case-pack manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 4 sections (`traceability_and_case_format`, `technique_coverage`, `negative_and_risk_selection`, `coverage_gaps_and_suite_hygiene`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness, cross-row consistency and, where the skill states them, its own arithmetic — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `TEST_CASE_PACK_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `TEST_CASE_PACK_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: no minimum or maximum case or requirement count; no coverage percentage below completeness (the skill's gate is *every* requirement traced, so 100% traceability over the declared rows is the skill's own bar); no number of cases per requirement beyond at-least-one; no boundary-case or negative-case count beyond presence; no decision-table rule-coverage percentage; no pairwise strength beyond the skill's all-pairs definition; no numeric damage × likelihood risk-score cut-off; no test-level vocabulary (a case's level must be declared; no allowed values are imposed); and no duplicate-path repetition count (the red line's "five times" is an illustration, not a stated limit).

**What it does NOT do.** The atom audits a **declared** record: a verdict of `TEST_CASE_PACK_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It is a completeness and consistency audit, not a certification of the underlying work. Specifically: it writes no test cases, executes no case, reads no requirements document or test suite, and does not verify that a declared case actually exists as written or would catch any bug. No execution or pass/fail result of any case is read or reported — the atom audits the design record, not a test run. No requirement text is read: traceability is over declared requirement ids only. It never judges whether the equivalence classes are the right classes, whether a declared expected result is the correct oracle, whether the decision-table rules chosen are truly the interesting or awkward ones, whether the state model is complete, or whether the risk ranking is wise. Duplicate-path detection goes no further than duplicate declared case ids plus the caller's duplicate-suite declaration — two differently-id'd cases re-testing the same path cannot be detected from the declared record.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: test planning for product builds. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared test-case design record; its verdict is a design-completeness judgment, not compliance or audit evidence, and test design is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `designed_test_case_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly four decimal places under the fixed rule `floor(v * 10000 + 0.5) / 10000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/designed_test_case_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_designed_test_case_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/designed-test-case-pack` (REST) and `POST /mcp/designed-test-case-pack` (MCP, tool `designed_test_case_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `designed_test_case_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T03:29:31.287305+00:00 against gateway v1.1.0, external verification lane, source `verification/work/designed-test-case-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "pack": "Login Feature Suite",
  "requirements": [
    {
      "id": "REQ-01"
    }
  ],
  "cases": [
    {
      "id": "TC-01",
      "requirement_ids": [
        "REQ-01"
      ],
      "level": "L1",
      "preconditions_declared": true,
      "steps_declared": true,
      "expected_result": "User logged in",
      "expected_result_written_before_execution": true,
      "covers_boundary": true,
      "covers_negative": true
    }
  ],
  "technique_application": {
    "equivalence_partitioning_applied": true,
    "equivalence_representative_and_edges_per_class": true,
    "boundary_value_analysis_applied": true,
    "boundary_just_below_at_and_above_covered": true,
    "decision_tables_applicable": false,
    "stateful_behaviour_present": false,
    "many_config_axes_present": false
  },
  "negative_and_error_guessing": {
    "negative_cases_designed": true,
    "invalid_inputs_covered": true,
    "wrong_order_retries_and_partial_failure_covered": true
  },
  "risk_selection": {
    "risk_based_selection_applied": true,
    "cases_ranked_by_damage_and_likelihood": true,
    "highest_risk_cases_selected_first": true,
    "not_tested_stated_explicitly": true
  },
  "coverage": {
    "coverage_gaps_stated_explicitly": true,
    "duplicate_path_suites_present": false,
    "happy_path_only_suite_present": false,
    "cases_written_before_execution": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "designed-test-case-pack",
  "atom_version": "0.1.0",
  "pack": "Login Feature Suite",
  "verdict": "TEST_CASE_PACK_SOUND",
  "sections": {
    "traceability_and_case_format": "pass",
    "technique_coverage": "pass",
    "negative_and_risk_selection": "pass",
    "coverage_gaps_and_suite_hygiene": "pass"
  },
  "checks": [
    {
      "section": "traceability_and_case_format",
      "check": "requirements_declared",
      "status": "pass",
      "evidence": "case format: the declared pack record names its requirements \u2014 the requirements list is present and non-empty"
    },
    {
      "section": "traceability_and_case_format",
      "check": "cases_declared",
      "status": "pass",
      "evidence": "case format: the declared pack record names its test cases \u2014 the cases list is present and non-empty"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_requirement_traced_to_at_least_one_case",
      "status": "pass",
      "evidence": "quality gate: every requirement is traced to at least one case"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_traces_to_at_least_one_requirement",
      "status": "pass",
      "evidence": "case format: every declared case is traceable to at least one declared requirement"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_has_unique_nonempty_id",
      "status": "pass",
      "evidence": "case format: every declared case carries an id, and no id is declared twice"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_declares_level",
      "status": "pass",
      "evidence": "case format: every declared case declares its level"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_declares_preconditions",
      "status": "pass",
      "evidence": "case format: every declared case declares its preconditions"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_declares_steps",
      "status": "pass",
      "evidence": "case format: every declared case declares its steps"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_has_expected_result",
      "status": "pass",
      "evidence": "red line: no case without an expected result \u2014 every declared case names a non-empty expected result"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_expected_result_written_before_execution",
      "status": "pass",
      "evidence": "quality gate: expected results are written before execution \u2014 every declared case declares its expected result was written before running"
    },
    {
      "section": "technique_coverage",
      "check": "equivalence_partitioning_applied",
      "status": "pass",
      "evidence": "equivalence partitioning: inputs are grouped into classes"
    },
    {
      "section": "technique_coverage",
      "check": "equivalence_representative_and_edges_per_class",
      "status": "pass",
      "evidence": "equivalence partitioning: one representative plus the edges per class \u2014 not every value"
    },
    {
      "section": "technique_coverage",
      "check": "boundary_value_analysis_applied",
      "status": "pass",
      "evidence": "boundary value analysis: boundaries are tested"
    },
    {
      "section": "technique_coverage",
      "check": "boundary_just_below_at_and_above_covered",
      "status": "pass",
      "evidence": "boundary value analysis: just-below / at / just-above each boundary is covered"
    },
    {
      "section": "technique_coverage",
      "check": "at_least_one_boundary_case_declared",
      "status": "pass",
      "evidence": "quality gate: boundaries are present \u2014 at least one declared case is declared a boundary case"
    },
    {
      "section": "technique_coverage",
      "check": "decision_table_rules_covered_when_applicable",
      "status": "pass",
      "evidence": "decision tables not declared applicable"
    },
    {
      "section": "technique_coverage",
      "check": "state_transitions_tested_when_stateful",
      "status": "pass",
      "evidence": "no stateful behaviour declared present"
    },
    {
      "section": "technique_coverage",
      "check": "pairwise_coverage_used_when_many_config_axes",
      "status": "pass",
      "evidence": "not many configuration axes declared present"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "negative_cases_designed",
      "status": "pass",
      "evidence": "negative + error guessing: negative cases are designed \u2014 accidents and attackers live here"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "invalid_inputs_covered",
      "status": "pass",
      "evidence": "negative + error guessing: invalid inputs are covered"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "wrong_order_retries_and_partial_failure_covered",
      "status": "pass",
      "evidence": "negative + error guessing: wrong order, retries, and partial failure are covered"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "at_least_one_negative_case_declared",
      "status": "pass",
      "evidence": "quality gate: negatives are present \u2014 at least one declared case is declared a negative case"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "risk_based_selection_applied",
      "status": "pass",
      "evidence": "risk-based selection: techniques and cases are chosen by risk"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "cases_ranked_by_damage_and_likelihood",
      "status": "pass",
      "evidence": "risk-based selection: cases are ranked by damage times likelihood"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "highest_risk_cases_selected_first",
      "status": "pass",
      "evidence": "risk-based selection: the highest-risk cases are selected first"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "not_tested_stated_explicitly",
      "status": "pass",
      "evidence": "risk-based selection: what is NOT tested is stated explicitly"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "coverage_gaps_stated_explicitly",
      "status": "pass",
      "evidence": "quality gate: coverage gaps are stated explicitly"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "no_duplicate_path_suites",
      "status": "pass",
      "evidence": "red line: no copy-paste suites that re-test the same path"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "not_happy_path_only",
      "status": "pass",
      "evidence": "quality gate: the suite is not happy paths only \u2014 boundaries and negatives are present"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "cases_written_before_execution",
      "status": "pass",
      "evidence": "case format: cases are written BEFORE running"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "requirements_count": 1,
  "cases_count": 1,
  "untraced_requirements": [],
  "requirement_trace_coverage": "1.0000",
  "cases_without_expected_result": [],
  "expected_result_coverage": "1.0000",
  "cases_without_traceability": [],
  "duplicate_case_ids": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across four sections.",
  "stamp": "DESIGNED TEST CASE PACK\npack: Login Feature Suite\nVERDICT: TEST_CASE_PACK_SOUND\n  traceability_and_case_format         pass\n  technique_coverage                   pass\n  negative_and_risk_selection          pass\n  coverage_gaps_and_suite_hygiene      pass\n30 pass, 0 fail, 0 missing of 30 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "pack": "Broken Suite",
  "requirements": [
    {
      "id": "REQ-01"
    }
  ],
  "cases": [
    {
      "id": "TC-01",
      "requirement_ids": [
        "MISSING-REQ"
      ],
      "level": "L1",
      "preconditions_declared": true,
      "steps_declared": true,
      "expected_result": "",
      "expected_result_written_before_execution": true,
      "covers_boundary": false,
      "covers_negative": false
    }
  ],
  "technique_application": {
    "equivalence_partitioning_applied": true,
    "equivalence_representative_and_edges_per_class": true,
    "boundary_value_analysis_applied": true,
    "boundary_just_below_at_and_above_covered": true,
    "decision_tables_applicable": false,
    "stateful_behaviour_present": false,
    "many_config_axes_present": false
  },
  "negative_and_error_guessing": {
    "negative_cases_designed": true,
    "invalid_inputs_covered": true,
    "wrong_order_retries_and_partial_failure_covered": true
  },
  "risk_selection": {
    "risk_based_selection_applied": true,
    "cases_ranked_by_damage_and_likelihood": true,
    "highest_risk_cases_selected_first": true,
    "not_tested_stated_explicitly": true
  },
  "coverage": {
    "coverage_gaps_stated_explicitly": true,
    "duplicate_path_suites_present": false,
    "happy_path_only_suite_present": false,
    "cases_written_before_execution": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "designed-test-case-pack",
  "atom_version": "0.1.0",
  "pack": "Broken Suite",
  "verdict": "TEST_CASE_PACK_NOT_SOUND",
  "sections": {
    "traceability_and_case_format": "fail",
    "technique_coverage": "fail",
    "negative_and_risk_selection": "fail",
    "coverage_gaps_and_suite_hygiene": "pass"
  },
  "checks": [
    {
      "section": "traceability_and_case_format",
      "check": "requirements_declared",
      "status": "pass",
      "evidence": "case format: the declared pack record names its requirements \u2014 the requirements list is present and non-empty"
    },
    {
      "section": "traceability_and_case_format",
      "check": "cases_declared",
      "status": "pass",
      "evidence": "case format: the declared pack record names its test cases \u2014 the cases list is present and non-empty"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_requirement_traced_to_at_least_one_case",
      "status": "fail",
      "evidence": "quality gate: every requirement is traced to at least one case"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_traces_to_at_least_one_requirement",
      "status": "fail",
      "evidence": "case format: every declared case is traceable to at least one declared requirement"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_has_unique_nonempty_id",
      "status": "pass",
      "evidence": "case format: every declared case carries an id, and no id is declared twice"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_declares_level",
      "status": "pass",
      "evidence": "case format: every declared case declares its level"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_declares_preconditions",
      "status": "pass",
      "evidence": "case format: every declared case declares its preconditions"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_declares_steps",
      "status": "pass",
      "evidence": "case format: every declared case declares its steps"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_has_expected_result",
      "status": "fail",
      "evidence": "red line: no case without an expected result \u2014 every declared case names a non-empty expected result"
    },
    {
      "section": "traceability_and_case_format",
      "check": "every_case_expected_result_written_before_execution",
      "status": "pass",
      "evidence": "quality gate: expected results are written before execution \u2014 every declared case declares its expected result was written before running"
    },
    {
      "section": "technique_coverage",
      "check": "equivalence_partitioning_applied",
      "status": "pass",
      "evidence": "equivalence partitioning: inputs are grouped into classes"
    },
    {
      "section": "technique_coverage",
      "check": "equivalence_representative_and_edges_per_class",
      "status": "pass",
      "evidence": "equivalence partitioning: one representative plus the edges per class \u2014 not every value"
    },
    {
      "section": "technique_coverage",
      "check": "boundary_value_analysis_applied",
      "status": "pass",
      "evidence": "boundary value analysis: boundaries are tested"
    },
    {
      "section": "technique_coverage",
      "check": "boundary_just_below_at_and_above_covered",
      "status": "pass",
      "evidence": "boundary value analysis: just-below / at / just-above each boundary is covered"
    },
    {
      "section": "technique_coverage",
      "check": "at_least_one_boundary_case_declared",
      "status": "fail",
      "evidence": "quality gate: boundaries are present \u2014 at least one declared case is declared a boundary case"
    },
    {
      "section": "technique_coverage",
      "check": "decision_table_rules_covered_when_applicable",
      "status": "pass",
      "evidence": "decision tables not declared applicable"
    },
    {
      "section": "technique_coverage",
      "check": "state_transitions_tested_when_stateful",
      "status": "pass",
      "evidence": "no stateful behaviour declared present"
    },
    {
      "section": "technique_coverage",
      "check": "pairwise_coverage_used_when_many_config_axes",
      "status": "pass",
      "evidence": "not many configuration axes declared present"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "negative_cases_designed",
      "status": "pass",
      "evidence": "negative + error guessing: negative cases are designed \u2014 accidents and attackers live here"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "invalid_inputs_covered",
      "status": "pass",
      "evidence": "negative + error guessing: invalid inputs are covered"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "wrong_order_retries_and_partial_failure_covered",
      "status": "pass",
      "evidence": "negative + error guessing: wrong order, retries, and partial failure are covered"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "at_least_one_negative_case_declared",
      "status": "fail",
      "evidence": "quality gate: negatives are present \u2014 at least one declared case is declared a negative case"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "risk_based_selection_applied",
      "status": "pass",
      "evidence": "risk-based selection: techniques and cases are chosen by risk"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "cases_ranked_by_damage_and_likelihood",
      "status": "pass",
      "evidence": "risk-based selection: cases are ranked by damage times likelihood"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "highest_risk_cases_selected_first",
      "status": "pass",
      "evidence": "risk-based selection: the highest-risk cases are selected first"
    },
    {
      "section": "negative_and_risk_selection",
      "check": "not_tested_stated_explicitly",
      "status": "pass",
      "evidence": "risk-based selection: what is NOT tested is stated explicitly"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "coverage_gaps_stated_explicitly",
      "status": "pass",
      "evidence": "quality gate: coverage gaps are stated explicitly"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "no_duplicate_path_suites",
      "status": "pass",
      "evidence": "red line: no copy-paste suites that re-test the same path"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "not_happy_path_only",
      "status": "pass",
      "evidence": "quality gate: the suite is not happy paths only \u2014 boundaries and negatives are present"
    },
    {
      "section": "coverage_gaps_and_suite_hygiene",
      "check": "cases_written_before_execution",
      "status": "pass",
      "evidence": "case format: cases are written BEFORE running"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "requirements_count": 1,
  "cases_count": 1,
  "untraced_requirements": [
    "REQ-01"
  ],
  "requirement_trace_coverage": "0.0000",
  "cases_without_expected_result": [
    "TC-01"
  ],
  "expected_result_coverage": "0.0000",
  "cases_without_traceability": [
    "TC-01"
  ],
  "duplicate_case_ids": [],
  "summary": "25 pass, 5 fail, 0 missing of 30 checks across four sections.",
  "stamp": "DESIGNED TEST CASE PACK\npack: Broken Suite\nVERDICT: TEST_CASE_PACK_NOT_SOUND\n  traceability_and_case_format         fail\n  technique_coverage                   fail\n  negative_and_risk_selection          fail\n  coverage_gaps_and_suite_hygiene      pass\n25 pass, 5 fail, 0 missing of 30 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "pack": "Malformed",
  "requirements": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "requirements",
  "detail": "requirements must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared test-case design record; its verdict is a design-completeness judgment, not compliance or audit evidence, and test design is not a regulated domain. |
| Checks named | 30 documented / 30 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 34 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/designed-test-case-pack/evidence.json` |
