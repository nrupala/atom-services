# Quant math derivation sanity check — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a mathematical derivation — a goal quantity, its givens, its steps, its assumptions, its method — and you have a declared record of that derivation, made from the derivation as actually written. This atom reads one declared manifest and returns one deterministic verdict across six sections (derivation_structure, step_arithmetic, dimensions_and_units, assumptions_and_failure_modes, method_choice_and_verification, red_lines): **DERIVATION_SOUND**, **DERIVATION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 30 checks. It audits the declared derivation record's completeness and internal consistency only — it derives nothing itself, solves no problem, runs no model, test or statistical procedure, inspects no data, code or paper, and does not verify that any declared check (of dimensions, units, assumptions or a numerical example) was ever actually carried out. A derivation is sound *on your declared evidence*: it is not a proof checker, a mathematics review, or a guarantee that the derivation is correct — it never judges whether a declared step is a valid mathematical inference (only that its declared arithmetic recomputes and its declared units follow the algebra), whether the declared assumptions actually hold, whether the named method is appropriate, or whether the final result answers the stated goal. It gives no financial advice, no valuation, no recommendation, no forecast and no projection, and it never says what a quantity should be. The computed checks: the declared `steps` list must be present and name at least one step (an empty list fails — it declares no derivation at all); no declared `step_id` may appear on more than one row; every step's `operation` must be one of `add`, `subtract`, `multiply` or `divide`; every step's `declared_result` must recompute exactly from its declared operands under its declared operation, compared on the fixed 6-decimal serialization; no `divide` step may have a zero `operand_b`; every step must declare `operand_a_unit`, `operand_b_unit` and `declared_result_unit`, none empty; every step's `declared_result_unit` must follow the unit algebra (for `add` / `subtract` the operands must share one unit and the result keeps it; for `multiply` the result unit is `<a_unit>*<b_unit>`; for `divide` it is `<a_unit>/<b_unit>`; the dimensionless unit `1` drops out of a product, a quotient by `1` keeps the numerator unit, and a quotient of a unit by itself is `1`); the declared `derivation.final_result_value` must equal the last declared step's `declared_result`; and the declared `derivation.final_result_unit` must equal the last declared step's `declared_result_unit`. No numeric threshold is imposed — no arithmetic tolerance or epsilon beyond the fixed 6dp serialization (a declared step that differs at the 6dp serialization fails rather than passing approximately); no p-value or significance level (no hypothesis test is run or graded); no confidence level or interval width; no correlation, covariance or variance magnitude bar; no minimum or maximum number of derivation steps beyond at least one; no convergence epsilon, iteration count or gradient norm for optimization derivations; no probability-mass or distribution fit bar (normality and the other assumptions are checked as declared where-assumed attestations, never re-tested from data — the atom receives no data); no numerical-example size or closeness bar beyond the declaration that a small example was verified; and no judgment that the chosen method is the mathematically right one for the problem (only that a method is named, is declared the simplest that fits, and is declared justified from the problem's structure is checked). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "quant-math-derivation-sanity-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/quant-math-derivation-sanity-check` — tool name `quant_math_derivation_sanity_check`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/quant-math-derivation-sanity-check` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `derivation_title` | Derivation title (string; carried into the verdict output, not itself checked) |
| `derivation.goal_quantity_stated` | derivation structure evidence: the goal quantity the derivation derives is stated |
| `derivation.givens_defined_before_use` | derivation structure evidence: every given quantity is defined before it is used |
| `derivation.shown_step_by_step` | derivation structure evidence: the derivation is shown step by step |
| `derivation.final_result_value` (number) | computed: must equal the last step's declared result |
| `derivation.final_result_unit` (string) | computed: must equal the last step's declared result unit |
| `steps` (list of step-row objects) | computed: must be present and name at least one step; reported as `derivation_steps_count` |
| `steps[].step_id` (string) | names the row in the computed outputs; computed: must be unique per row |
| `steps[].operation` (string) | computed: must be one of `add`, `subtract`, `multiply` or `divide` |
| `steps[].operand_a` (number) | the step's first declared operand |
| `steps[].operand_b` (number) | the step's second declared operand; computed: must be non-zero on a `divide` step |
| `steps[].declared_result` (number) | computed: must recompute from the operands under the declared operation |
| `steps[].operand_a_unit` (non-empty string) | computed: every step must declare all three units, none empty |
| `steps[].operand_b_unit` (non-empty string) | computed: every step must declare all three units, none empty |
| `steps[].declared_result_unit` (non-empty string) | computed: must follow the unit algebra from the operand units |
| `dimensions.dimensions_checked` | dimensions evidence: the derivation's dimensions are checked |
| `dimensions.units_checked` | dimensions evidence: the derivation's units are checked |
| `dimensions.unit_conversions_shown_where_needed` | dimensions evidence: unit conversions are shown where needed |
| `assumptions.assumptions_listed` | assumptions evidence: the derivation's assumptions are listed |
| `assumptions.normality_checked_where_assumed` | assumptions evidence: normality is checked wherever it is assumed |
| `assumptions.independence_checked_where_assumed` | assumptions evidence: independence is checked wherever it is assumed |
| `assumptions.stationarity_checked_where_assumed` | assumptions evidence: stationarity is checked wherever it is assumed |
| `assumptions.failure_modes_named` | assumptions evidence: the method's failure modes are named |
| `assumptions.domain_restrictions_stated` | assumptions evidence: the derivation's domain restrictions are stated |
| `method.method_named` | method evidence: the method the derivation uses is named |
| `method.simplest_method_that_fits_chosen` | method evidence: the simplest method that fits is chosen |
| `method.method_choice_justified_from_problem_structure` | method evidence: the method choice is justified from the problem structure |
| `method.small_numerical_example_verified` | method evidence: the derivation is verified with a small numerical example |
| `red_lines.black_box_trust_without_derivation_present` | must be `false` to pass (red line: no black-box trust without derivation) |
| `red_lines.assumptions_ignored_present` | must be `false` to pass (red line: no ignored assumptions) |
| `red_lines.correlation_presented_as_causation_present` | must be `false` to pass (red line: no correlation presented as causation) |
| `red_lines.p_hacking_present` | must be `false` to pass (red line: no p-hacking) |
| `red_lines.overfitting_present` | must be `false` to pass (red line: no overfitting) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DERIVATION_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/quant-math-derivation-sanity-check`:

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

Response — HTTP 200 (trimmed; the full response carries all 30 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "derivation_steps_count": 1,
  "duplicate_derivation_step_ids": [],
  "derivation_steps_with_arithmetic_mismatch": [],
  "derivation_steps_with_unit_mismatch": [],
  "derivation_steps_missing_units": [],
  "arithmetic_match_ratio": "1.000000",
  "unit_match_ratio": "1.000000",
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections."
}
```

## Verdicts

- **DERIVATION_SOUND** — every check passes; the declared derivation record is complete and internally consistent with the skill's practice and red lines.
- **DERIVATION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `derivation_steps_count` (the declared steps list length as an integer, or null when the list is not declared), `duplicate_derivation_step_ids` (ids declared on more than one row, in the order their second occurrence appears; null when the list is not declared), the row-name lists `derivation_steps_with_arithmetic_mismatch` and `derivation_steps_with_unit_mismatch` (steps complete enough to verify whose declared values do not verify; a step with a field absent is missing evidence and does not appear; null when the `steps` list is not declared), `derivation_steps_missing_units` (steps with any unit field absent or empty; null when the list is not declared), the ratios `arithmetic_match_ratio` (steps whose arithmetic recomputes ÷ declared steps) and `unit_match_ratio` (steps whose result unit follows the unit algebra ÷ declared steps) — each a string with exactly six decimal places, or null when its denominator list is absent or empty — and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the nine computed checks cannot be completed). Arithmetic and final-result comparisons are made on the same fixed 6dp serialization: round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
