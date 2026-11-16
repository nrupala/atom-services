# Designed test case pack — `designed-test-case-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Design test cases that find real bugs — partitioning, boundaries, decision tables, state machines, pairwise.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Test planning for product builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the designed-test-case-pack manifest

The caller submits one JSON manifest: a declared test-case pack
record for one feature or system. Every field below is read by
the named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`TEST_CASE_PACK_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `pack` (string; carried into the verdict output, not itself checked) | — |
| `requirements` (list of requirement-row objects, each `{id}` — see the entry field below; computed, see below) | traceability_and_case_format |
| `requirements[].id` (string; the identifier a case's `requirement_ids` must name for the requirement to count as traced; must be a non-empty string) | traceability_and_case_format |
| `cases` (list of test-case-row objects, each `{id, requirement_ids, level, preconditions_declared, steps_declared, expected_result, expected_result_written_before_execution, covers_boundary, covers_negative}` — see the entry fields below; computed, see below) | traceability_and_case_format, technique_coverage, negative_and_risk_selection |
| `cases[].id` (string; names the row in the computed `cases_without_*` outputs; must be a non-empty string and unique across the pack) | traceability_and_case_format |
| `cases[].requirement_ids` (list of strings; the declared requirements this case traces to — at least one entry must name a declared requirement `id` for the case to pass the computed traceability check; an absent field is missing evidence, an empty list fails) | traceability_and_case_format |
| `cases[].level` (string; must be a non-empty string for the row to pass the computed level check — an absent field is missing evidence, an empty string fails; no level vocabulary is imposed, see the declined thresholds) | traceability_and_case_format |
| `cases[].preconditions_declared` | traceability_and_case_format |
| `cases[].steps_declared` | traceability_and_case_format |
| `cases[].expected_result` (string; must be a non-empty string for the row to pass the computed expected-result check — an absent field is missing evidence, an empty string fails) | traceability_and_case_format |
| `cases[].expected_result_written_before_execution` | traceability_and_case_format |
| `cases[].covers_boundary` | technique_coverage |
| `cases[].covers_negative` | negative_and_risk_selection |
| `technique_application.equivalence_partitioning_applied` | technique_coverage |
| `technique_application.equivalence_representative_and_edges_per_class` | technique_coverage |
| `technique_application.boundary_value_analysis_applied` | technique_coverage |
| `technique_application.boundary_just_below_at_and_above_covered` | technique_coverage |
| `technique_application.decision_tables_applicable` (gates the decision-table check below) | technique_coverage |
| `technique_application.decision_table_rules_covered_including_awkward` (required when decision tables are declared applicable; otherwise the check passes as not applicable) | technique_coverage |
| `technique_application.stateful_behaviour_present` (gates the state-transition check below) | technique_coverage |
| `technique_application.state_transitions_allowed_forbidden_and_interrupts_tested` (required when stateful behaviour is declared present; otherwise the check passes as not applicable) | technique_coverage |
| `technique_application.many_config_axes_present` (gates the pairwise check below) | technique_coverage |
| `technique_application.pairwise_pair_coverage_used` (required when many configuration axes are declared present; otherwise the check passes as not applicable) | technique_coverage |
| `negative_and_error_guessing.negative_cases_designed` | negative_and_risk_selection |
| `negative_and_error_guessing.invalid_inputs_covered` | negative_and_risk_selection |
| `negative_and_error_guessing.wrong_order_retries_and_partial_failure_covered` | negative_and_risk_selection |
| `risk_selection.risk_based_selection_applied` | negative_and_risk_selection |
| `risk_selection.cases_ranked_by_damage_and_likelihood` | negative_and_risk_selection |
| `risk_selection.highest_risk_cases_selected_first` | negative_and_risk_selection |
| `risk_selection.not_tested_stated_explicitly` | negative_and_risk_selection |
| `coverage.coverage_gaps_stated_explicitly` | coverage_gaps_and_suite_hygiene |
| `coverage.duplicate_path_suites_present` (must be `false` to pass — skill red line) | coverage_gaps_and_suite_hygiene |
| `coverage.happy_path_only_suite_present` (must be `false` to pass — skill quality gate) | coverage_gaps_and_suite_hygiene |
| `coverage.cases_written_before_execution` | coverage_gaps_and_suite_hygiene |

Twelve checks are computed from the declared rows, using only
the consistency of the declared record itself — no outside
threshold is imported:

- **Requirements declared:** the declared `requirements` list
  passes only when it is present and non-empty; an absent list
  is missing evidence, an empty list fails.
- **Cases declared:** the declared `cases` list passes only
  when it is present and non-empty.
- **Every requirement traced:** every declared requirement row
  whose `id` is a non-empty string must be named by at least
  one declared case's `requirement_ids`. A requirement row with
  the `id` field absent, or a case row with `requirement_ids`
  absent, is missing evidence.
- **Every case traces:** every declared case row must name at
  least one requirement that is actually declared — an entry in
  `requirement_ids` equal to a declared requirement `id`. A
  case with `requirement_ids` absent is missing evidence and
  does not appear in `cases_without_traceability`; a case whose
  declared references name no declared requirement fails and is
  named there.
- **Unique case ids:** every declared case row must carry a
  non-empty `id` string, and no id may be declared twice; ids
  declared more than once are reported in `duplicate_case_ids`.
  A row with the field absent is missing evidence.
- **Level per case:** every declared case row must declare a
  non-empty `level` string. A row with the field absent is
  missing evidence; a row naming an empty string fails.
- **Preconditions per case:** every declared case row must
  declare `preconditions_declared: true`. A row with the field
  absent is missing evidence.
- **Steps per case:** every declared case row must declare
  `steps_declared: true`. A row with the field absent is
  missing evidence.
- **Expected result per case:** every declared case row must
  name a non-empty `expected_result` string (the skill's red
  line: no case without an expected result). A row with the
  field absent is missing evidence; a row naming an empty
  string fails.
- **Expected result written before execution, per case:** every
  declared case row must declare
  `expected_result_written_before_execution: true`. A row with
  the field absent is missing evidence.
- **At least one boundary case:** at least one declared case
  row must declare `covers_boundary: true`. A row with the
  field absent is missing evidence for the check.
- **At least one negative case:** at least one declared case
  row must declare `covers_negative: true`. A row with the
  field absent is missing evidence for the check.

Three check groups are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **Decision-table rules:** the skill binds decision tables to
  condition combinations ("enumerate condition combinations;
  cover the interesting rules, including the awkward ones").
  `decision_table_rules_covered_including_awkward` is therefore
  required only when `technique_application.decision_tables_applicable`
  is declared `true`; when decision tables are not declared
  applicable, the check passes as not applicable.
- **State transitions:** the skill binds state transition
  testing to a state model ("model the states; test allowed
  transitions, forbidden transitions, and interrupts").
  `state_transitions_allowed_forbidden_and_interrupts_tested`
  is therefore required only when
  `technique_application.stateful_behaviour_present` is declared
  `true`; when no stateful behaviour is declared, the check
  passes as not applicable.
- **Pairwise coverage:** the skill binds pairwise to many
  configuration axes ("for many config axes, cover all pairs
  instead of the full cross-product").
  `pairwise_pair_coverage_used` is therefore required only when
  `technique_application.many_config_axes_present` is declared
  `true`; when not many axes are declared, the check passes as
  not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six primary computed checks above cannot be completed),
`requirements_count` and `cases_count` (the declared list
lengths, or null when the list is not declared — counts are
reported as integers, exactly), the row-name lists
`untraced_requirements`, `cases_without_expected_result` and
`cases_without_traceability` (null when an underlying list is
not declared), `duplicate_case_ids` (null when the cases list
is not declared), and the two coverage ratios
`requirement_trace_coverage` (requirements traced to at least
one case ÷ declared requirements) and
`expected_result_coverage` (cases naming a non-empty expected
result ÷ declared cases).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty (and, for
requirement trace coverage, when the cases list is absent).
That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The skill states no numeric threshold — no case count, no
coverage percentage below its own every-requirement gate, no
boundary count, and no risk-score cut-off — so no numeric
threshold check is invented. Quantities are computed and
reported; the only bar on the computed rows is completeness
over the caller's own declared rows (every declared
requirement, every declared case), exactly as stated above.
Declined thresholds, named: a minimum or maximum case count; a
minimum or maximum requirement count; a coverage percentage
below completeness (the skill's gate is *every* requirement
traced, so 100% traceability over the declared rows is the
skill's own bar, not an invented one); a number of cases per
requirement beyond the skill's at-least-one; a boundary-case
count or a per-boundary case count beyond the skill's
presence gate; a negative-case count beyond presence; a
decision-table rule-coverage percentage; a pairwise strength
beyond the skill's all-pairs definition; a numeric
damage × likelihood risk-score cut-off for selection; a
test-level vocabulary (the skill requires a case's level be
declared, and names no allowed values, so only its presence is
checked); and a duplicate-path repetition count — the red
line's "five times" is an illustration of copy-paste suites,
not a stated limit, so duplicate paths are checked by the
caller's declaration and by computed duplicate case ids, never
by an invented repetition threshold.

The verdict is one of `TEST_CASE_PACK_SOUND` (all 30 checks
pass), `TEST_CASE_PACK_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across four sections: traceability_and_case_format,
technique_coverage, negative_and_risk_selection,
coverage_gaps_and_suite_hygiene.

## Honest scoping

This atom audits a **declared** test-case pack record — it
writes no test cases, executes no case, reads no requirements
document or test suite, and does not verify that a declared
case actually exists as written or would catch any bug. A pack
is sound *on the caller's declared evidence*: a manifest that
declares traced requirements, boundary and negative cases, and
stated coverage gaps passes those checks even if the real suite
does none of it. It is a completeness and consistency audit of
the record the skill requires, **not a test-design service or
a test-quality certification**: it never judges whether the
equivalence classes are the right classes, whether a declared
expected result is the correct oracle for its case, whether
the decision-table rules chosen are truly the interesting or
awkward ones, whether the state model is complete, or whether
the risk ranking (damage × likelihood) is wise — case quality
and oracle wisdom are caller declarations only, checked for
presence and consistency, never for correctness.

Named exclusions: no numeric thresholds (see the declined list
above); no check that partitioning is genuinely correct beyond
the declarations; no execution or pass/fail result of any case
is read or reported — the atom audits the design record, not a
test run; no requirement text is read — traceability is over
declared requirement ids only; duplicate-path detection beyond
duplicate declared case ids and the caller's duplicate-suite
declaration (two differently-id'd cases re-testing the same
path cannot be detected from the declared record); no live
verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
