# Quant math derivation sanity check — documentation

**Quant math derivation sanity check** · slug `quant-math-derivation-sanity-check` · deliverable type CHECK · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189, RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

The atom audits a caller-declared mathematical derivation record for internal consistency only — arithmetic recomputation, unit algebra, step completeness, and declared assumption/method attestations. It surfaces REST `POST /v1/quant-math-derivation-sanity-check` and MCP `POST /mcp/quant-math-derivation-sanity-check`. Pricing rate is `null` — free during trial.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/quant-math-derivation-sanity-check/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment b71b0351b5994d9da5dc7bebffcd3189), RC soak to 2026-11-22. This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the derivation `Simple Velocity Calculation`); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "quant-math-derivation-sanity-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the derivation manifest.** You declare a record of a mathematical derivation for one derivation, made from the derivation as actually written — the atom audits the declared record, it does not derive anything itself or inspect any paper, data or code (see Explanation). The recorded full-pass manifest declares the derivation `Simple Velocity Calculation`: the goal quantity stated, givens defined before use and the derivation shown step by step all `true`, a declared final result value `50.0` / unit `m/s^2*s`, one step `s1` (`multiply`, `operand_a` `10.0`, `operand_b` `5.0`, declared result `50.0`, units `m/s^2` / `s` / `m/s^2*s`), all three dimensions flags `true`, all six assumptions flags `true`, all four method flags `true`, and all five red-line flags `false` (no black-box trust without derivation, no ignored assumptions, no correlation presented as causation, no p-hacking, no overfitting).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/quant-math-derivation-sanity-check` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `DERIVATION_SOUND`: "30 pass, 0 fail, 0 missing of 30 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `derivation_steps_count` is 1, `duplicate_derivation_step_ids`, `derivation_steps_with_arithmetic_mismatch`, `derivation_steps_with_unit_mismatch` and `derivation_steps_missing_units` are each `[]`, and `arithmetic_match_ratio` and `unit_match_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `DERIVATION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "quant-math-derivation-sanity-check"}`.
3. Call: `POST https://atoms.pipavia.com/v1/quant-math-derivation-sanity-check` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/quant-math-derivation-sanity-check` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `quant_math_derivation_sanity_check`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `DERIVATION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `derivation_final_result_value_matches_last_step` and `every_derivation_step_arithmetic_recomputes`, and the summary reads "28 pass, 2 fail, 0 missing of 30 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `steps[0].declared_result` is declared `999.0` where `10.0` × `5.0` recomputes to `50.0`, failing `every_derivation_step_arithmetic_recomputes` with `derivation_steps_with_arithmetic_mismatch` `["s1"]` and `arithmetic_match_ratio` `"0.000000"`, and the declared final result value `50.0` no longer equals the last step's declared result `999.0`, failing `derivation_final_result_value_matches_last_step`; sections `derivation_structure` and `step_arithmetic` report `fail`, the other four sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "steps",
  "detail": "steps must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/quant-math-derivation-sanity-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/quant-math-derivation-sanity-check` — tool name `quant_math_derivation_sanity_check`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `quant_math_derivation_sanity_check` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `derivation_title` and `derivation.final_result_unit` are noted as strings, `derivation.final_result_value` as a number, `steps` as a list, the step-row `step_id` and `operation` fields as strings, `operand_a`, `operand_b` and `declared_result` as numbers, and the three step unit fields as non-empty strings there. Where SERVICE.md states no type — the section container objects (`derivation`, `dimensions`, `assumptions`, `method`, `red_lines`) and the row object (`steps[]`) — the type below is grounded in the recorded evidence inputs and in the MCP `inputSchema` recorded in evidence.json, which types the top-level containers `object` and `steps` as `array`; that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `DERIVATION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `derivation_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md; recorded MCP `inputSchema` types it `string`) |

#### Read by: derivation_structure

| Field | Type | Notes |
|---|---|---|
| `derivation` | object | The derivation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `derivation.goal_quantity_stated` | boolean | — |
| `derivation.givens_defined_before_use` | boolean | — |
| `derivation.shown_step_by_step` | boolean | — |
| `derivation.final_result_value` | number | Computed — must equal the last step's declared result, compared on the 6dp serialization (type stated in SERVICE.md) |
| `derivation.final_result_unit` | string | Computed — must equal the last step's declared result unit (type stated in SERVICE.md) |

#### Read by: step_arithmetic

| Field | Type | Notes |
|---|---|---|
| `steps` | list | list of step-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`). Also read by dimensions_and_units for the unit checks |
| `steps[]` | object | One declared step row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `steps[].step_id` | string | Must be unique per row (type stated in SERVICE.md) |
| `steps[].operation` | string | One of `add`, `subtract`, `multiply`, `divide` (type stated in SERVICE.md). Also read by dimensions_and_units |
| `steps[].operand_a` | number | (type stated in SERVICE.md) |
| `steps[].operand_b` | number | Must be non-zero on a `divide` step (type stated in SERVICE.md) |
| `steps[].declared_result` | number | Computed — must recompute from the operands under the declared operation (type stated in SERVICE.md) |

#### Read by: dimensions_and_units

| Field | Type | Notes |
|---|---|---|
| `steps[].operand_a_unit` | string | Non-empty string (type stated in SERVICE.md) |
| `steps[].operand_b_unit` | string | Non-empty string (type stated in SERVICE.md) |
| `steps[].declared_result_unit` | string | Non-empty string; computed — must follow the unit algebra from the operand units (type stated in SERVICE.md) |
| `dimensions` | object | The dimensions section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `dimensions.dimensions_checked` | boolean | — |
| `dimensions.units_checked` | boolean | — |
| `dimensions.unit_conversions_shown_where_needed` | boolean | — |

#### Read by: assumptions_and_failure_modes

| Field | Type | Notes |
|---|---|---|
| `assumptions` | object | The assumptions section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `assumptions.assumptions_listed` | boolean | — |
| `assumptions.normality_checked_where_assumed` | boolean | — |
| `assumptions.independence_checked_where_assumed` | boolean | — |
| `assumptions.stationarity_checked_where_assumed` | boolean | — |
| `assumptions.failure_modes_named` | boolean | — |
| `assumptions.domain_restrictions_stated` | boolean | — |

#### Read by: method_choice_and_verification

| Field | Type | Notes |
|---|---|---|
| `method` | object | The method section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `method.method_named` | boolean | — |
| `method.simplest_method_that_fits_chosen` | boolean | — |
| `method.method_choice_justified_from_problem_structure` | boolean | — |
| `method.small_numerical_example_verified` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.black_box_trust_without_derivation_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.assumptions_ignored_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.correlation_presented_as_causation_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.p_hacking_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.overfitting_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 30 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: derivation_structure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `derivation_goal_quantity_stated` | derivation: the goal quantity the derivation derives is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_givens_defined_before_use` | derivation: every given quantity is defined before it is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_shown_step_by_step` | derivation: the derivation is shown step by step, not asserted as a black-box result | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_final_result_value_matches_last_step` | derivation: the declared final result value equals the last declared step's declared result value | Computed over the declared record. Pass: the declared `derivation.final_result_value` equals the last declared step's `declared_result`, compared on the 6dp serialization. Fail: the values differ. Missing: steps are missing, the final value is missing, or the last step has no declared result. |
| `derivation_final_result_unit_matches_last_step` | derivation: the declared final result unit equals the last declared step's declared result unit | Computed over the declared record. Pass: the declared `derivation.final_result_unit` equals the last declared step's `declared_result_unit`. Fail: the units differ. Missing: either side is absent or empty. |

#### Section: step_arithmetic

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `derivation_steps_list_declared` | the declared record names its derivation steps — the steps list is present and names at least one step; an absent list is missing evidence and an empty list declares no derivation at all | Computed over the declared record. Pass: the `steps` list is present and names at least one step. Fail: the list is present but empty — it declares no derivation at all. Missing: the list is absent. |
| `every_derivation_step_id_unique` | derivation steps: no declared step_id is owned by more than one row | Computed over the declared record. Pass: no declared `step_id` appears on more than one row (duplicates are named in `duplicate_derivation_step_ids`). Fail: a `step_id` is declared on more than one row. Missing: the list is absent, or a row has `step_id` absent. |
| `every_derivation_step_operation_recognised` | derivation steps: every declared step's operation is one of add, subtract, multiply, divide | Computed over the declared record. Pass: every declared step's `operation` is one of `add`, `subtract`, `multiply`, `divide`. Fail: a row declares any other value. Missing: the list is absent, or a row has `operation` absent. |
| `every_derivation_step_arithmetic_recomputes` | derivation steps: every declared step's declared result recomputes exactly from its declared operands under its declared operation (6dp serialization) | Computed over the declared record. Pass: every declared step's `declared_result` recomputes from its declared operands under its declared operation, compared on the fixed 6dp serialization. Fail: a row whose recomputed value differs (named in `derivation_steps_with_arithmetic_mismatch`). Missing: a row is missing its operation or any of its three values. |
| `no_derivation_step_divides_by_zero` | derivation steps: no declared divide step has a zero second operand | Computed over the declared record. Pass: no declared `divide` step has a zero `operand_b`. Fail: a `divide` step has a zero `operand_b`. Missing: a row is missing its operation or `operand_b`. |

#### Section: dimensions_and_units

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `derivation_dimensions_checked` | dimensions: the derivation's dimensions are checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_units_checked` | units: the derivation's units are checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_unit_conversions_shown_where_needed` | units: every unit conversion the derivation needs is shown where it is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_derivation_step_declares_all_units` | derivation steps: every declared step declares its operand_a_unit, operand_b_unit and declared_result_unit, none empty | Computed over the declared record. Pass: every declared step declares `operand_a_unit`, `operand_b_unit` and `declared_result_unit`, none empty. Fail: a row declares an empty unit. Missing: a row has a unit field absent. |
| `every_derivation_step_result_unit_follows_unit_algebra` | derivation steps: every declared step's result unit is the unit the declared unit algebra produces — add/subtract keep the shared operand unit, multiply gives <a>*<b>, divide gives <a>/<b>, and the dimensionless unit 1 drops out | Computed over the declared record. Pass: every declared step's `declared_result_unit` is the unit the declared unit algebra produces from its operand units. Fail: a row whose result unit differs (named in `derivation_steps_with_unit_mismatch`). Missing: a row whose units are incomplete. |

#### Section: assumptions_and_failure_modes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `derivation_assumptions_listed` | assumptions: the derivation's assumptions are listed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_normality_checked_where_assumed` | assumptions: normality is checked wherever the derivation assumes it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_independence_checked_where_assumed` | assumptions: independence is checked wherever the derivation assumes it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_stationarity_checked_where_assumed` | assumptions: stationarity is checked wherever the derivation assumes it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_failure_modes_named` | assumptions: the method's failure modes are named | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_domain_restrictions_stated` | assumptions: the derivation's domain restrictions are stated (where its steps are defined) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: method_choice_and_verification

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `derivation_method_named` | method: the method the derivation uses is named | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_simplest_fitting_method_chosen` | method: the simplest method that fits is the method chosen | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_method_choice_justified_from_problem_structure` | method: the method choice is justified from the problem's structure, not from library habit | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `derivation_verified_with_small_numerical_example` | verification: the derivation is verified with a small numerical example | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `derivation_free_of_black_box_trust` | red line: no black-box result trusted without a derivation is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `derivation_free_of_ignored_assumptions` | red line: no ignored assumptions are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `derivation_free_of_correlation_as_causation` | red line: no correlation presented as causation is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `derivation_free_of_p_hacking` | red line: no p-hacking is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `derivation_free_of_overfitting` | red line: no overfitting is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"quant-math-derivation-sanity-check"`), `atom_version` (`"0.1.0"`), and `derivation_title` (the manifest's declared derivation title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `derivation_steps_count` (the declared steps list length as an integer, or null when the list is not declared); `duplicate_derivation_step_ids` (ids declared on more than one row, in the order their second occurrence appears); the row-name lists `derivation_steps_with_arithmetic_mismatch` and `derivation_steps_with_unit_mismatch` (steps complete enough to verify whose declared values do not verify; a step with a field absent is missing evidence and does not appear) and `derivation_steps_missing_units` (steps with any unit field absent or empty) — the count and lists in this group are null when the `steps` list is not declared, as recorded in the sparse case; and the ratios `arithmetic_match_ratio` (steps whose arithmetic recomputes ÷ declared steps) and `unit_match_ratio` (steps whose result unit follows the unit algebra ÷ declared steps) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios and arithmetic / final-result comparisons use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "30 pass, 0 fail, 0 missing of 30 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared derivation title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `DERIVATION_SOUND` — all 30 checks pass: the declared derivation record is complete and internally consistent with the bound skill's practice and red lines.
- `DERIVATION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the nine computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `derivation_steps_count`, `duplicate_derivation_step_ids`, `derivation_steps_with_arithmetic_mismatch`, `derivation_steps_with_unit_mismatch`, `derivation_steps_missing_units`, `arithmetic_match_ratio`, `unit_match_ratio` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"steps","detail":"steps must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type CHECK — this atom sells the check it produces, a bounded judgment artifact, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** The rigorous math layer — linear algebra, probability, and statistics derived and sanity-checked, not just library calls (the bound capability, from the skill): derive before you trust; check dimensions and units; verify with a small numerical example; know each method's assumptions and failure modes; prefer the simplest method that fits. You submit one declared record — the derivation manifest, made from the derivation as actually written — and the atom audits that record for internal consistency only (arithmetic recomputation, unit algebra, step completeness, and declared assumption/method attestations) against the bound skill's practice and red lines, returning one deterministic verdict across 6 sections (`derivation_structure`, `step_arithmetic`, `dimensions_and_units`, `assumptions_and_failure_modes`, `method_choice_and_verification`, `red_lines`). The atom sells that check — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows and fields themselves — the declared `steps` list must be present and name at least one step, no `step_id` may be duplicated, every step's `operation` must be one of `add`, `subtract`, `multiply` or `divide`, every step's `declared_result` must recompute exactly from its declared operands under its declared operation on the fixed 6dp serialization, no `divide` step may have a zero `operand_b`, every step must declare all three units non-empty, every step's `declared_result_unit` must follow the unit algebra (for `add` / `subtract` the operands must share one unit and the result keeps it; for `multiply` the result unit is `<a_unit>*<b_unit>`; for `divide` it is `<a_unit>/<b_unit>`; the dimensionless unit `"1"` drops out of a product, a quotient by `"1"` keeps the numerator unit, and a quotient of a unit by itself is `"1"`), and the declared final result value and unit must each equal the last declared step's declared result and result unit — using only the skill's own stated practice plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `DERIVATION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `DERIVATION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric tolerance and no numeric threshold at all — its demands are exact recomputation, declared assumption checks and qualitative declarations the record makes, not bars the atom can set. Declined, named: an arithmetic tolerance or epsilon beyond the fixed 6dp serialization (a declared step that differs at the 6dp serialization fails rather than passing approximately); a p-value or significance level (no hypothesis test is run or graded); a confidence level or interval width; a correlation, covariance or variance magnitude bar; a minimum or maximum number of derivation steps beyond at least one; a convergence epsilon, iteration count or gradient norm for optimization derivations; a probability-mass or distribution fit bar (normality and the other assumptions are checked as declared where-assumed attestations, never re-tested from data — the atom receives no data); a numerical-example size or closeness bar beyond the declaration that a small example was verified; any judgment that the chosen method is the mathematically right one for the problem (only that a method is named, is declared the simplest that fits, and is declared justified from the problem's structure is checked). Quantities are computed and reported; the only bars on the computed rows are exact recomputation and completeness over the caller's own declared steps.

**What it does NOT do.** The atom audits a **declared** derivation record: a verdict of `DERIVATION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its assumptions checked, its failure modes named and every step recomputing passes those checks even if the real derivation did none of it. It is a completeness and consistency audit of the derivation record the skill requires, **not a proof checker, a mathematics review, or a guarantee that the derivation is correct**: it certifies no derivation as correct mathematics — internal consistency only. Specifically: it derives nothing itself, solves no problem, runs no model, test or statistical procedure, inspects no data, code or paper, and does not verify that any declared check (of dimensions, units, assumptions or a numerical example) was ever actually carried out. It never judges whether a declared step is a valid mathematical inference (only that its declared arithmetic recomputes and its declared units follow the algebra), whether the declared assumptions actually hold, whether the named method is appropriate, or whether the final result answers the stated goal — only that the record contains what the skill's practice and anti-patterns demand, and that its declared steps are internally consistent. Named exclusions: symbolic or multi-operand steps — the record format covers exactly the four binary operations above, and a derivation step that is a symbolic manipulation, a limit, an integral, a matrix operation or any other transformation is outside this atom's computed reach (it can be declared in the step record only insofar as it reduces to a declared binary arithmetic step; the atom takes no position on such steps' validity); no numeric thresholds at all (see the declined list above); no live verification of any declared fact; no judgment of derivation *quality* — whether the mathematics is right is the caller's work, checked only for declared presence and internal consistency; the skill's topic catalogue (linear algebra, probability, statistics, calculus and optimization, stochastic and quant methods) is not itself checked topic by topic — the atom checks the practice the skill wraps around every topic, not coverage of any topic. It gives no financial advice, no valuation, no recommendation, no forecast and no projection, and it never says what a quantity should be (see For regulators).

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this check on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Derivations for RA and EE analytics (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For integrators (Users)

You need: a gateway key with the `quant_math_derivation_sanity_check` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/quant_math_derivation_sanity_check.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_quant_math_derivation_sanity_check.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/quant-math-derivation-sanity-check` (REST) and `POST /mcp/quant-math-derivation-sanity-check` (MCP, tool `quant_math_derivation_sanity_check`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment b71b0351b5994d9da5dc7bebffcd3189), RC soak to 2026-11-22. Key scope: `quant_math_derivation_sanity_check`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

### For regulators

This atom is quant/finance-adjacent by keyword and is deployed census-style under a screen-NO U-13 flag-with-controls. Its U-13 regulatory screen in SERVICE.md records, exactly:

Screen classification: **(b) — screen-NO with flag-with-controls (census class).** This atom is quant/finance-adjacent by keyword — its bound skill names portfolio optimization and risk metrics among its topics, and a derivation record could be about a financial quantity — so the screen was applied strictly, and the atom is flagged for the owner's per-unit ruling queue under U-13 on that adjacency. What prevents an advice reading, as named controls: (1) the atom audits a caller-**declared** derivation record for internal consistency only — arithmetic recomputation, unit algebra, step completeness, and declared assumption/method attestations; every output is a pass / fail / missing verdict on the record or a ratio recomputed from the caller's own declared steps; (2) it gives **no financial advice, no valuation, no recommendation, no forecast and no projection** — it never says what a quantity should be, whether a portfolio, price, risk metric or model is good, or what anyone should do; the skill's quant-application steps (mean-variance portfolio optimization, risk-metric computation, Monte Carlo and time series work itself) are excluded from production and named as exclusions above — this atom performs none of them, it only audits a declared record of steps; (3) it sets **no threshold** — no return, risk, significance or accuracy bar against which a caller's derivation could be graded as good or bad (see the declined list); (4) the record's subject is whatever mathematics the caller declares — the atom takes no position on any security, portfolio, credit or investment decision, and no output is addressed to one. Residual risk, stated plainly: a caller could paste the verdict into their own quant or financial work — that is their decision, made on their record; the artifact itself recommends nothing. This is the same class as the pricing-unit-economics-pack precedent (declared-record audit, advice-shaped skill steps excluded as controls); it is not the genuinely-open personal-financial-snapshot class, because no personal financial position is handled and the skill carries no advice-shaped step that this atom performs. Flagging never blocks authoring; no deploy happens on this atom without the owner's explicit per-unit ruling after the screen.

The flag stays open for the Director's review: the atom is flagged for the owner's per-unit ruling queue under U-13 on its quant/finance adjacency, as recorded above.

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** many recorded check names are not the input field names they read. In `derivation_structure`: `derivation_goal_quantity_stated` reads `derivation.goal_quantity_stated`, `derivation_givens_defined_before_use` reads `derivation.givens_defined_before_use`, `derivation_shown_step_by_step` reads `derivation.shown_step_by_step`, and the computed checks `derivation_final_result_value_matches_last_step` and `derivation_final_result_unit_matches_last_step` read `derivation.final_result_value` / `derivation.final_result_unit` against the last `steps` row's `declared_result` / `declared_result_unit`, rather than any single input field of the same name. In `step_arithmetic` the computed checks `derivation_steps_list_declared`, `every_derivation_step_id_unique`, `every_derivation_step_operation_recognised`, `every_derivation_step_arithmetic_recomputes` and `no_derivation_step_divides_by_zero` read the `steps` rows and their `step_id` / `operation` / operand / `declared_result` fields, rather than any single input field of the same name. In `dimensions_and_units`: `derivation_dimensions_checked` reads `dimensions.dimensions_checked`, `derivation_units_checked` reads `dimensions.units_checked`, `derivation_unit_conversions_shown_where_needed` reads `dimensions.unit_conversions_shown_where_needed`, and the computed checks `every_derivation_step_declares_all_units` and `every_derivation_step_result_unit_follows_unit_algebra` read the step rows' unit fields. In `assumptions_and_failure_modes` the recorded checks carry the `derivation_` prefix over their fields: `derivation_assumptions_listed` (input `assumptions.assumptions_listed`), `derivation_normality_checked_where_assumed` (input `assumptions.normality_checked_where_assumed`), `derivation_independence_checked_where_assumed` (input `assumptions.independence_checked_where_assumed`), `derivation_stationarity_checked_where_assumed` (input `assumptions.stationarity_checked_where_assumed`), `derivation_failure_modes_named` (input `assumptions.failure_modes_named`) and `derivation_domain_restrictions_stated` (input `assumptions.domain_restrictions_stated`). In `method_choice_and_verification`: `derivation_method_named` reads `method.method_named`, `derivation_simplest_fitting_method_chosen` reads `method.simplest_method_that_fits_chosen`, `derivation_method_choice_justified_from_problem_structure` reads `method.method_choice_justified_from_problem_structure`, and `derivation_verified_with_small_numerical_example` reads `method.small_numerical_example_verified`. In `red_lines` all five recorded check names differ from their fields: `derivation_free_of_black_box_trust` (input `red_lines.black_box_trust_without_derivation_present`), `derivation_free_of_ignored_assumptions` (input `red_lines.assumptions_ignored_present`), `derivation_free_of_correlation_as_causation` (input `red_lines.correlation_presented_as_causation_present`), `derivation_free_of_p_hacking` (input `red_lines.p_hacking_present`) and `derivation_free_of_overfitting` (input `red_lines.overfitting_present`). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`derivation`, `dimensions`, `assumptions`, `method`, `red_lines`) or for a row object (`steps[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 30 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `derivation_steps_count` and the two match ratios, but does not state a null rule for `duplicate_derivation_step_ids`, `derivation_steps_with_arithmetic_mismatch`, `derivation_steps_with_unit_mismatch` or `derivation_steps_missing_units`. The recorded sparse response returns all of them as `null` when the `steps` list is not declared (as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** the recorded sections do not map one-to-one onto the input objects — `dimensions_and_units` reads both the `dimensions` object and the `steps` rows (their unit fields and unit algebra), and `derivation_structure`'s two final-result checks read both the `derivation` object and the last `steps` row; `step_arithmetic` also reads the `steps` rows, so the same rows are read by two recorded sections. The remaining sections map to their same-named input objects under a longer section name (`assumptions` → `assumptions_and_failure_modes`, `method` → `method_choice_and_verification`), and only `red_lines` maps one-to-one by name. This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json (unscored prose — the recorded responses govern):** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (5 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named two prose labels instead of exact check names — `Step arithmetic recomputes` and `Final result value matches the last step` (R1 ×2); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); and the raw full-pass design declared a result unit of `m/s` where SERVICE.md's unit algebra for `multiply` produces the literal `m/s^2*s` — the step declared a `multiply` of operand units `m/s^2` and `s` with declared result unit `m/s`, but only the dimensionless unit `1` drops out and no physical simplification is defined, so the oracle returned `DERIVATION_NOT_SOUND` on the raw design (validity ×1); the executed input was repaired minimally (`steps[0].declared_result_unit` and `derivation.final_result_unit` both to `m/s^2*s`). These are unscored prose / design divergences: where the corrected-away design prose differed, the recorded responses govern. (The full-pass case's recorded `expect.notes` in evidence.json still carries the prose line “Unit algebra: (m/s^2) * s = m/s.” — that note is likewise unscored prose; the recorded input and response, with result unit `m/s^2*s`, govern.)

## Worked examples

Provenance: recorded 2026-11-16T10:51:11.083014+00:00, gateway v1.1.0, external-verification battery Wave 14, source `verification/work/quant-math-derivation-sanity-check/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T10:51:11.083014+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/quant-math-derivation-sanity-check/evidence.json`.

Input:

```json
{
  "derivation_title": "Simple Velocity Calculation",
  "derivation": {
    "goal_quantity_stated": true,
    "givens_defined_before_use": true,
    "shown_step_by_step": true,
    "final_result_value": 50.0,
    "final_result_unit": "m/s^2*s"
  },
  "steps": [
    {
      "step_id": "s1",
      "operation": "multiply",
      "operand_a": 10.0,
      "operand_b": 5.0,
      "declared_result": 50.0,
      "operand_a_unit": "m/s^2",
      "operand_b_unit": "s",
      "declared_result_unit": "m/s^2*s"
    }
  ],
  "dimensions": {
    "dimensions_checked": true,
    "units_checked": true,
    "unit_conversions_shown_where_needed": true
  },
  "assumptions": {
    "assumptions_listed": true,
    "normality_checked_where_assumed": true,
    "independence_checked_where_assumed": true,
    "stationarity_checked_where_assumed": true,
    "failure_modes_named": true,
    "domain_restrictions_stated": true
  },
  "method": {
    "method_named": true,
    "simplest_method_that_fits_chosen": true,
    "method_choice_justified_from_problem_structure": true,
    "small_numerical_example_verified": true
  },
  "red_lines": {
    "black_box_trust_without_derivation_present": false,
    "assumptions_ignored_present": false,
    "correlation_presented_as_causation_present": false,
    "p_hacking_present": false,
    "overfitting_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "quant-math-derivation-sanity-check",
  "atom_version": "0.1.0",
  "derivation_title": "Simple Velocity Calculation",
  "verdict": "DERIVATION_SOUND",
  "sections": {
    "derivation_structure": "pass",
    "step_arithmetic": "pass",
    "dimensions_and_units": "pass",
    "assumptions_and_failure_modes": "pass",
    "method_choice_and_verification": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "derivation_structure",
      "check": "derivation_goal_quantity_stated",
      "status": "pass",
      "evidence": "derivation: the goal quantity the derivation derives is stated"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_givens_defined_before_use",
      "status": "pass",
      "evidence": "derivation: every given quantity is defined before it is used"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_shown_step_by_step",
      "status": "pass",
      "evidence": "derivation: the derivation is shown step by step, not asserted as a black-box result"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_final_result_value_matches_last_step",
      "status": "pass",
      "evidence": "derivation: the declared final result value equals the last declared step's declared result value"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_final_result_unit_matches_last_step",
      "status": "pass",
      "evidence": "derivation: the declared final result unit equals the last declared step's declared result unit"
    },
    {
      "section": "step_arithmetic",
      "check": "derivation_steps_list_declared",
      "status": "pass",
      "evidence": "the declared record names its derivation steps — the steps list is present and names at least one step; an absent list is missing evidence and an empty list declares no derivation at all"
    },
    {
      "section": "step_arithmetic",
      "check": "every_derivation_step_id_unique",
      "status": "pass",
      "evidence": "derivation steps: no declared step_id is owned by more than one row"
    },
    {
      "section": "step_arithmetic",
      "check": "every_derivation_step_operation_recognised",
      "status": "pass",
      "evidence": "derivation steps: every declared step's operation is one of add, subtract, multiply, divide"
    },
    {
      "section": "step_arithmetic",
      "check": "every_derivation_step_arithmetic_recomputes",
      "status": "pass",
      "evidence": "derivation steps: every declared step's declared result recomputes exactly from its declared operands under its declared operation (6dp serialization)"
    },
    {
      "section": "step_arithmetic",
      "check": "no_derivation_step_divides_by_zero",
      "status": "pass",
      "evidence": "derivation steps: no declared divide step has a zero second operand"
    },
    {
      "section": "dimensions_and_units",
      "check": "derivation_dimensions_checked",
      "status": "pass",
      "evidence": "dimensions: the derivation's dimensions are checked"
    },
    {
      "section": "dimensions_and_units",
      "check": "derivation_units_checked",
      "status": "pass",
      "evidence": "units: the derivation's units are checked"
    },
    {
      "section": "dimensions_and_units",
      "check": "derivation_unit_conversions_shown_where_needed",
      "status": "pass",
      "evidence": "units: every unit conversion the derivation needs is shown where it is used"
    },
    {
      "section": "dimensions_and_units",
      "check": "every_derivation_step_declares_all_units",
      "status": "pass",
      "evidence": "derivation steps: every declared step declares its operand_a_unit, operand_b_unit and declared_result_unit, none empty"
    },
    {
      "section": "dimensions_and_units",
      "check": "every_derivation_step_result_unit_follows_unit_algebra",
      "status": "pass",
      "evidence": "derivation steps: every declared step's result unit is the unit the declared unit algebra produces — add/subtract keep the shared operand unit, multiply gives <a>*<b>, divide gives <a>/<b>, and the dimensionless unit 1 drops out"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_assumptions_listed",
      "status": "pass",
      "evidence": "assumptions: the derivation's assumptions are listed"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_normality_checked_where_assumed",
      "status": "pass",
      "evidence": "assumptions: normality is checked wherever the derivation assumes it"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_independence_checked_where_assumed",
      "status": "pass",
      "evidence": "assumptions: independence is checked wherever the derivation assumes it"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_stationarity_checked_where_assumed",
      "status": "pass",
      "evidence": "assumptions: stationarity is checked wherever the derivation assumes it"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_failure_modes_named",
      "status": "pass",
      "evidence": "assumptions: the method's failure modes are named"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_domain_restrictions_stated",
      "status": "pass",
      "evidence": "assumptions: the derivation's domain restrictions are stated (where its steps are defined)"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_method_named",
      "status": "pass",
      "evidence": "method: the method the derivation uses is named"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_simplest_fitting_method_chosen",
      "status": "pass",
      "evidence": "method: the simplest method that fits is the method chosen"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_method_choice_justified_from_problem_structure",
      "status": "pass",
      "evidence": "method: the method choice is justified from the problem's structure, not from library habit"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_verified_with_small_numerical_example",
      "status": "pass",
      "evidence": "verification: the derivation is verified with a small numerical example"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_black_box_trust",
      "status": "pass",
      "evidence": "red line: no black-box result trusted without a derivation is present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_ignored_assumptions",
      "status": "pass",
      "evidence": "red line: no ignored assumptions are present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_correlation_as_causation",
      "status": "pass",
      "evidence": "red line: no correlation presented as causation is present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_p_hacking",
      "status": "pass",
      "evidence": "red line: no p-hacking is present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_overfitting",
      "status": "pass",
      "evidence": "red line: no overfitting is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "derivation_steps_count": 1,
  "duplicate_derivation_step_ids": [],
  "derivation_steps_with_arithmetic_mismatch": [],
  "derivation_steps_with_unit_mismatch": [],
  "derivation_steps_missing_units": [],
  "arithmetic_match_ratio": "1.000000",
  "unit_match_ratio": "1.000000",
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections.",
  "stamp": "QUANT MATH DERIVATION SANITY CHECK\nderivation_title: Simple Velocity Calculation\nVERDICT: DERIVATION_SOUND\n  derivation_structure                         pass\n  step_arithmetic                              pass\n  dimensions_and_units                         pass\n  assumptions_and_failure_modes                pass\n  method_choice_and_verification               pass\n  red_lines                                    pass\n30 pass, 0 fail, 0 missing of 30 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T10:51:11.083014+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/quant-math-derivation-sanity-check/evidence.json`.

Input:

```json
{
  "derivation_title": "Simple Velocity Calculation",
  "derivation": {
    "goal_quantity_stated": true,
    "givens_defined_before_use": true,
    "shown_step_by_step": true,
    "final_result_value": 50.0,
    "final_result_unit": "m/s^2*s"
  },
  "steps": [
    {
      "step_id": "s1",
      "operation": "multiply",
      "operand_a": 10.0,
      "operand_b": 5.0,
      "declared_result": 999.0,
      "operand_a_unit": "m/s^2",
      "operand_b_unit": "s",
      "declared_result_unit": "m/s^2*s"
    }
  ],
  "dimensions": {
    "dimensions_checked": true,
    "units_checked": true,
    "unit_conversions_shown_where_needed": true
  },
  "assumptions": {
    "assumptions_listed": true,
    "normality_checked_where_assumed": true,
    "independence_checked_where_assumed": true,
    "stationarity_checked_where_assumed": true,
    "failure_modes_named": true,
    "domain_restrictions_stated": true
  },
  "method": {
    "method_named": true,
    "simplest_method_that_fits_chosen": true,
    "method_choice_justified_from_problem_structure": true,
    "small_numerical_example_verified": true
  },
  "red_lines": {
    "black_box_trust_without_derivation_present": false,
    "assumptions_ignored_present": false,
    "correlation_presented_as_causation_present": false,
    "p_hacking_present": false,
    "overfitting_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "quant-math-derivation-sanity-check",
  "atom_version": "0.1.0",
  "derivation_title": "Simple Velocity Calculation",
  "verdict": "DERIVATION_NOT_SOUND",
  "sections": {
    "derivation_structure": "fail",
    "step_arithmetic": "fail",
    "dimensions_and_units": "pass",
    "assumptions_and_failure_modes": "pass",
    "method_choice_and_verification": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "derivation_structure",
      "check": "derivation_goal_quantity_stated",
      "status": "pass",
      "evidence": "derivation: the goal quantity the derivation derives is stated"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_givens_defined_before_use",
      "status": "pass",
      "evidence": "derivation: every given quantity is defined before it is used"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_shown_step_by_step",
      "status": "pass",
      "evidence": "derivation: the derivation is shown step by step, not asserted as a black-box result"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_final_result_value_matches_last_step",
      "status": "fail",
      "evidence": "derivation: the declared final result value equals the last declared step's declared result value"
    },
    {
      "section": "derivation_structure",
      "check": "derivation_final_result_unit_matches_last_step",
      "status": "pass",
      "evidence": "derivation: the declared final result unit equals the last declared step's declared result unit"
    },
    {
      "section": "step_arithmetic",
      "check": "derivation_steps_list_declared",
      "status": "pass",
      "evidence": "the declared record names its derivation steps — the steps list is present and names at least one step; an absent list is missing evidence and an empty list declares no derivation at all"
    },
    {
      "section": "step_arithmetic",
      "check": "every_derivation_step_id_unique",
      "status": "pass",
      "evidence": "derivation steps: no declared step_id is owned by more than one row"
    },
    {
      "section": "step_arithmetic",
      "check": "every_derivation_step_operation_recognised",
      "status": "pass",
      "evidence": "derivation steps: every declared step's operation is one of add, subtract, multiply, divide"
    },
    {
      "section": "step_arithmetic",
      "check": "every_derivation_step_arithmetic_recomputes",
      "status": "fail",
      "evidence": "derivation steps: every declared step's declared result recomputes exactly from its declared operands under its declared operation (6dp serialization)"
    },
    {
      "section": "step_arithmetic",
      "check": "no_derivation_step_divides_by_zero",
      "status": "pass",
      "evidence": "derivation steps: no declared divide step has a zero second operand"
    },
    {
      "section": "dimensions_and_units",
      "check": "derivation_dimensions_checked",
      "status": "pass",
      "evidence": "dimensions: the derivation's dimensions are checked"
    },
    {
      "section": "dimensions_and_units",
      "check": "derivation_units_checked",
      "status": "pass",
      "evidence": "units: the derivation's units are checked"
    },
    {
      "section": "dimensions_and_units",
      "check": "derivation_unit_conversions_shown_where_needed",
      "status": "pass",
      "evidence": "units: every unit conversion the derivation needs is shown where it is used"
    },
    {
      "section": "dimensions_and_units",
      "check": "every_derivation_step_declares_all_units",
      "status": "pass",
      "evidence": "derivation steps: every declared step declares its operand_a_unit, operand_b_unit and declared_result_unit, none empty"
    },
    {
      "section": "dimensions_and_units",
      "check": "every_derivation_step_result_unit_follows_unit_algebra",
      "status": "pass",
      "evidence": "derivation steps: every declared step's result unit is the unit the declared unit algebra produces — add/subtract keep the shared operand unit, multiply gives <a>*<b>, divide gives <a>/<b>, and the dimensionless unit 1 drops out"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_assumptions_listed",
      "status": "pass",
      "evidence": "assumptions: the derivation's assumptions are listed"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_normality_checked_where_assumed",
      "status": "pass",
      "evidence": "assumptions: normality is checked wherever the derivation assumes it"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_independence_checked_where_assumed",
      "status": "pass",
      "evidence": "assumptions: independence is checked wherever the derivation assumes it"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_stationarity_checked_where_assumed",
      "status": "pass",
      "evidence": "assumptions: stationarity is checked wherever the derivation assumes it"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_failure_modes_named",
      "status": "pass",
      "evidence": "assumptions: the method's failure modes are named"
    },
    {
      "section": "assumptions_and_failure_modes",
      "check": "derivation_domain_restrictions_stated",
      "status": "pass",
      "evidence": "assumptions: the derivation's domain restrictions are stated (where its steps are defined)"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_method_named",
      "status": "pass",
      "evidence": "method: the method the derivation uses is named"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_simplest_fitting_method_chosen",
      "status": "pass",
      "evidence": "method: the simplest method that fits is the method chosen"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_method_choice_justified_from_problem_structure",
      "status": "pass",
      "evidence": "method: the method choice is justified from the problem's structure, not from library habit"
    },
    {
      "section": "method_choice_and_verification",
      "check": "derivation_verified_with_small_numerical_example",
      "status": "pass",
      "evidence": "verification: the derivation is verified with a small numerical example"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_black_box_trust",
      "status": "pass",
      "evidence": "red line: no black-box result trusted without a derivation is present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_ignored_assumptions",
      "status": "pass",
      "evidence": "red line: no ignored assumptions are present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_correlation_as_causation",
      "status": "pass",
      "evidence": "red line: no correlation presented as causation is present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_p_hacking",
      "status": "pass",
      "evidence": "red line: no p-hacking is present in the record"
    },
    {
      "section": "red_lines",
      "check": "derivation_free_of_overfitting",
      "status": "pass",
      "evidence": "red line: no overfitting is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "derivation_steps_count": 1,
  "duplicate_derivation_step_ids": [],
  "derivation_steps_with_arithmetic_mismatch": [
    "s1"
  ],
  "derivation_steps_with_unit_mismatch": [],
  "derivation_steps_missing_units": [],
  "arithmetic_match_ratio": "0.000000",
  "unit_match_ratio": "1.000000",
  "summary": "28 pass, 2 fail, 0 missing of 30 checks across six sections.",
  "stamp": "QUANT MATH DERIVATION SANITY CHECK\nderivation_title: Simple Velocity Calculation\nVERDICT: DERIVATION_NOT_SOUND\n  derivation_structure                         fail\n  step_arithmetic                              fail\n  dimensions_and_units                         pass\n  assumptions_and_failure_modes                pass\n  method_choice_and_verification               pass\n  red_lines                                    pass\n28 pass, 2 fail, 0 missing of 30 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T10:51:11.083014+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/quant-math-derivation-sanity-check/evidence.json`.

Input:

```json
{
  "derivation_title": "Simple Velocity Calculation",
  "derivation": {
    "goal_quantity_stated": true,
    "givens_defined_before_use": true,
    "shown_step_by_step": true,
    "final_result_value": 50.0,
    "final_result_unit": "m/s^2*s"
  },
  "steps": "this should be a list",
  "dimensions": {
    "dimensions_checked": true,
    "units_checked": true,
    "unit_conversions_shown_where_needed": true
  },
  "assumptions": {
    "assumptions_listed": true,
    "normality_checked_where_assumed": true,
    "independence_checked_where_assumed": true,
    "stationarity_checked_where_assumed": true,
    "failure_modes_named": true,
    "domain_restrictions_stated": true
  },
  "method": {
    "method_named": true,
    "simplest_method_that_fits_chosen": true,
    "method_choice_justified_from_problem_structure": true,
    "small_numerical_example_verified": true
  },
  "red_lines": {
    "black_box_trust_without_derivation_present": false,
    "assumptions_ignored_present": false,
    "correlation_presented_as_causation_present": false,
    "p_hacking_present": false,
    "overfitting_present": false
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "steps",
  "detail": "steps must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom is quant/finance-adjacent by keyword and deployed census-style under a screen-NO U-13 flag-with-controls; its screen classification and all its named controls are reproduced exactly in For regulators, and the flag stays open for the Director's review |
| Checks named | 30 documented / 30 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`derivation_steps_count`, the three row-name lists, `duplicate_derivation_step_ids` and the two match ratios) |
| Input reference typed | Yes — 39 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/quant-math-derivation-sanity-check/evidence.json` |
