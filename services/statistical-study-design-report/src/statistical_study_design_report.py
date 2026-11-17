#!/usr/bin/env python3
"""Statistical study design report — deterministic core.

Built from the bound skill `statistical-consulting`: "Statistics
fails when the analysis starts before the decision is defined"
— frame -> design -> analyze -> validate -> deliver, with an
audit trail. Its quality gates are: decision framed and written
before analysis began; analysis plan exists, deviations logged
with reasons; uncertainty quantified, assumptions tested not
assumed; reproducible pipeline delivered; limitations section
present and honest. Its red lines are: never report significance
without effect size and uncertainty, no p-hacking or selective
reporting, no causal language from observational data without
the design to back it, client data confidential (PII redacted,
no unapproved reuse), and no guarantees of outcomes.

This atom is a REPORT over a declared statistical study design
record: it audits the record a caller declares — the framed
decision and research question, the declared design type and
variables, the sampling plan and declared sample-size / power
inputs, the analysis-plan declarations, the validation and bias
controls, the delivery and reproducibility declarations, and
the red lines refused. It runs no study, analyses no dataset,
tests no hypothesis, and gives no conclusion about any
real-world claim — it checks that the study design record the
skill requires is present and internally consistent on the
declared evidence, and it recomputes the declared sample-size
arithmetic exactly.

Distinct ground: the nearest siblings are
`bias-controlled-quant-study-pack` (a declared market quant
study pack — hypothesis pre-registration, market-data hygiene,
distribution reality, costs and reproducibility for a trading
study), `quant-math-derivation-sanity-check` (a declared
mathematical derivation whose steps recompute), and
`forecast-with-ranges-and-scorecard` (a declared forecast
artifact with ranges, scenarios and an accuracy scorecard).
This atom shares zero checks with any of them: every check
here is a study-design question — a decision framed before
analysis with outcome, unit of analysis, population and
timeframe defined; a recognised design type with estimand,
assignment mechanism and confounders stated; declared variables
with unique ids, recognised roles and at least one outcome;
a sampling plan whose declared group sizes are positive whole
numbers summing exactly to the declared total sample size;
declared alpha / target power in the valid probability range
and a non-zero declared effect size; a pre-registered analysis
plan that reports effect sizes with uncertainty and controls
multiple comparisons; sensitivity, robustness and leakage
controls; a reproducible delivery; and the consulting red
lines. The boundary is: the internal consistency of a declared
statistical study design record here; a market study pack, a
mathematical derivation, and a forecast artifact there.

The caller submits a study design manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- design type: the declared design type must be one of the
  record format's recognised types (`randomized_experiment`,
  `factorial_experiment`, `sequential_experiment`,
  `quasi_experiment`, `observational`) — the skill's design
  step works with experimental (randomization, factorial/DOE,
  sequential testing) versus observational designs;
- variable rows: every declared variable declares a unique
  `variable_id` and a recognised `role` (`outcome`, `exposure`,
  `predictor`, `confounder`, `covariate`, `stratification`),
  and at least one declared variable is an outcome — the
  skill's intake defines the outcome before design begins;
- group rows: every declared group declares a unique
  `group_id` and a positive whole-number `declared_size`;
- total sample size: the declared total sample size must equal
  the sum of the declared group sizes, compared on the fixed
  6-decimal serialization below — pure accounting coherence
  between numbers the record itself declares;
- power inputs: the declared alpha and declared target power
  are probabilities, so each must lie strictly between 0 and
  1; the declared effect size must be non-zero — a zero effect
  is the null the design exists to detect a departure from.
  No adequacy bar is imposed on any of them: the skill states
  no minimum power, no significance level and no effect-size
  magnitude, so none is invented.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; the total
sample-size comparison is made on those 6dp serializations.
That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. Counts are reported as
integers (exact).

The skill states no sample-size adequacy bar, no minimum
power, no significance level to use, no effect-size magnitude
bar, no group-count or allocation-ratio bar, no variable-count
bar and no precision / confidence-interval width bar — so no
such check is invented; those quantities are computed and
reported, with exact recomputation and completeness over the
caller's own declared record as the only bars, exactly as
stated above.

Verdict:
- any fail             -> STUDY_DESIGN_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> STUDY_DESIGN_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "decision_framing",
    "design_and_variables",
    "sampling_and_power",
    "analysis_plan",
    "validation_and_bias_controls",
    "delivery_and_reproducibility",
    "red_lines",
)

DESIGN_TYPES = (
    "randomized_experiment",
    "factorial_experiment",
    "sequential_experiment",
    "quasi_experiment",
    "observational",
)

VARIABLE_ROLES = (
    "outcome",
    "exposure",
    "predictor",
    "confounder",
    "covariate",
    "stratification",
)

MANIFEST_SPEC = {
    "study_title": "string",
    "framing": {
        "decision_stated": "boolean",
        "research_question_stated": "boolean",
        "outcome_defined": "boolean",
        "unit_of_analysis_defined": "boolean",
        "population_defined": "boolean",
        "timeframe_defined": "boolean",
    },
    "design": {
        "design_type": "string",
        "assignment_mechanism_stated": "boolean",
        "estimand_stated": "boolean",
        "confounders_identified": "boolean",
    },
    "variables": [{
        "variable_id": "string",
        "role": "string",
    }],
    "sampling": {
        "sampling_frame_defined": "boolean",
        "sampling_method_stated": "boolean",
        "inclusion_exclusion_criteria_stated": "boolean",
        "power_analysis_done_before_collection": "boolean",
        "declared_total_sample_size": "number",
        "declared_alpha": "number",
        "declared_target_power": "number",
        "declared_effect_size": "number",
    },
    "groups": [{
        "group_id": "string",
        "declared_size": "number",
    }],
    "analysis": {
        "plan_written_before_collection": "boolean",
        "plan_preregistered": "boolean",
        "primary_method_named": "boolean",
        "assumption_checks_planned": "boolean",
        "effect_size_with_uncertainty_planned": "boolean",
        "multiple_comparison_discipline_planned": "boolean",
        "deviations_logging_planned": "boolean",
    },
    "validation": {
        "sensitivity_analyses_planned": "boolean",
        "robustness_checks_planned": "boolean",
        "leakage_audit_planned": "boolean",
        "limitations_section_planned": "boolean",
        "what_would_change_conclusion_stated": "boolean",
    },
    "delivery": {
        "executive_summary_planned": "boolean",
        "methods_memo_planned": "boolean",
        "reproducible_appendix_planned": "boolean",
        "pipeline_sealed_for_rerun": "boolean",
    },
    "red_lines": {
        "significance_without_effect_size_and_uncertainty_present":
            "boolean",
        "p_hacking_or_selective_reporting_present": "boolean",
        "causal_language_from_observational_without_design_present":
            "boolean",
        "unredacted_pii_or_unapproved_reuse_present": "boolean",
        "outcome_guarantee_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _values_match(a, b):
    if not (isinstance(a, (int, float)) and not isinstance(a, bool)):
        return False
    if not (isinstance(b, (int, float)) and not isinstance(b, bool)):
        return False
    if math.isfinite(a) and math.isfinite(b):
        return _fmt6(a) == _fmt6(b)
    return a == b


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_positive_whole(value):
    return _is_number(value) and float(value).is_integer() and value >= 1


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def evaluate(manifest):
    """Return the verdict dict for a study design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    variables, has_variables = _get(manifest, "variables")
    variables_is_list = has_variables and isinstance(variables, list)
    variables_count = len(variables) if variables_is_list else None
    vrows = variables if variables_is_list else []

    groups, has_groups = _get(manifest, "groups")
    groups_is_list = has_groups and isinstance(groups, list)
    groups_count = len(groups) if groups_is_list else None
    grows = groups if groups_is_list else []

    duplicate_variable_ids = (
        _duplicates(vrows, "variable_id") if variables_is_list else None
    )
    duplicate_group_ids = (
        _duplicates(grows, "group_id") if groups_is_list else None
    )
    outcome_variable_count = (
        sum(1 for c in vrows
            if isinstance(c, dict) and c.get("role") == "outcome")
        if variables_is_list else None
    )
    variables_with_unrecognised_role = (
        [_row_name(c, "variable_id") for c in vrows
         if isinstance(c, dict) and isinstance(c.get("role"), str)
         and c.get("role") not in VARIABLE_ROLES]
        if variables_is_list else None
    )
    computed_total_sample_size = (
        sum(c.get("declared_size") for c in grows
            if isinstance(c, dict) and _is_number(c.get("declared_size")))
        if groups_is_list
        and all(isinstance(c, dict) and _is_number(c.get("declared_size"))
                for c in grows) and len(grows) > 0 else None
    )
    declared_total, has_declared_total = _get(
        manifest, "sampling", "declared_total_sample_size")
    declared_total_out = (
        declared_total if has_declared_total
        and _is_number(declared_total) else None
    )
    total_difference = (
        declared_total_out - computed_total_sample_size
        if declared_total_out is not None
        and computed_total_sample_size is not None else None
    )
    largest_group_share = (
        max(c.get("declared_size") for c in grows)
        / computed_total_sample_size
        if computed_total_sample_size is not None
        and computed_total_sample_size != 0 else None
    )
    alpha, has_alpha = _get(manifest, "sampling", "declared_alpha")
    target_power, has_power = _get(
        manifest, "sampling", "declared_target_power")
    effect_size, has_effect = _get(
        manifest, "sampling", "declared_effect_size")
    alpha_out = alpha if has_alpha and _is_number(alpha) else None
    power_out = (
        target_power if has_power and _is_number(target_power) else None
    )
    effect_out = (
        effect_size if has_effect and _is_number(effect_size) else None
    )

    # ---- Section 1: decision_framing (skill method step 1 —
    #      intake, decision first; quality gate: decision framed
    #      and written before analysis began) ----
    _bool_check(results, "decision_framing",
                "study_design_decision_stated_before_design", manifest,
                ("framing", "decision_stated"),
                "intake: the decision that changes with the answer "
                "is stated and written before the design")
    _bool_check(results, "decision_framing",
                "study_design_research_question_stated", manifest,
                ("framing", "research_question_stated"),
                "intake: the research question the study answers "
                "is stated")
    _bool_check(results, "decision_framing",
                "study_design_primary_outcome_defined", manifest,
                ("framing", "outcome_defined"),
                "intake: the outcome is defined before design")
    _bool_check(results, "decision_framing",
                "study_design_unit_of_analysis_defined", manifest,
                ("framing", "unit_of_analysis_defined"),
                "intake: the unit of analysis is defined")
    _bool_check(results, "decision_framing",
                "study_design_target_population_defined", manifest,
                ("framing", "population_defined"),
                "intake: the target population is defined")
    _bool_check(results, "decision_framing",
                "study_design_timeframe_defined", manifest,
                ("framing", "timeframe_defined"),
                "intake: the timeframe is defined")

    # ---- Section 2: design_and_variables (skill method step 2
    #      — design: experimental vs observational, target
    #      estimand, confounders; intake outcome definition) ----
    design_type, has_design_type = _get(manifest, "design", "design_type")
    _check(results, "design_and_variables",
           "study_design_type_recognised", design_type, has_design_type,
           has_design_type and design_type in DESIGN_TYPES,
           "design: the declared design type is one of "
           "randomized_experiment, factorial_experiment, "
           "sequential_experiment, quasi_experiment, observational")
    _bool_check(results, "design_and_variables",
                "study_design_assignment_mechanism_stated", manifest,
                ("design", "assignment_mechanism_stated"),
                "design: the assignment or exposure mechanism is "
                "stated (randomization, factorial allocation, "
                "blocking, sequential rule, or observational "
                "exposure as the design provides)")
    _bool_check(results, "design_and_variables",
                "study_design_estimand_stated", manifest,
                ("design", "estimand_stated"),
                "design: the target estimand is stated")
    _bool_check(results, "design_and_variables",
                "study_design_confounders_identified", manifest,
                ("design", "confounders_identified"),
                "design: confounders are identified, with matching "
                "or weighting declared where the design uses them")
    _check(results, "design_and_variables",
           "study_design_variables_list_declared", variables,
           variables_is_list,
           variables_is_list and variables_count > 0,
           "the declared record names its variables — the "
           "variables list is present and names at least one "
           "variable; an absent list is missing evidence and an "
           "empty list declares no variables at all")
    var_id_present = (
        variables_is_list and all(_has(c, "variable_id") for c in vrows)
    )
    _check(results, "design_and_variables",
           "study_design_every_variable_id_unique", variables,
           var_id_present,
           variables_is_list and duplicate_variable_ids is not None
           and len(duplicate_variable_ids) == 0,
           "variables: no declared variable_id is owned by more "
           "than one row")
    var_role_present = (
        variables_is_list and all(_has(c, "role") for c in vrows)
    )
    _check(results, "design_and_variables",
           "study_design_every_variable_role_recognised", variables,
           var_role_present,
           variables_is_list
           and all(isinstance(c, dict)
                   and c.get("role") in VARIABLE_ROLES for c in vrows),
           "variables: every declared variable's role is one of "
           "outcome, exposure, predictor, confounder, covariate, "
           "stratification")
    _check(results, "design_and_variables",
           "study_design_at_least_one_outcome_variable_declared",
           variables, var_role_present,
           variables_is_list and outcome_variable_count is not None
           and outcome_variable_count >= 1,
           "variables: at least one declared variable has the "
           "outcome role — the intake outcome is among the "
           "declared variables")

    # ---- Section 3: sampling_and_power (skill method step 2 —
    #      power/precision analysis before collection; intake
    #      data audit declarations for the sampling plan) ----
    _bool_check(results, "sampling_and_power",
                "study_design_sampling_frame_defined", manifest,
                ("sampling", "sampling_frame_defined"),
                "sampling: the sampling frame is defined")
    _bool_check(results, "sampling_and_power",
                "study_design_sampling_method_stated", manifest,
                ("sampling", "sampling_method_stated"),
                "sampling: the sampling method is stated")
    _bool_check(results, "sampling_and_power",
                "study_design_inclusion_exclusion_criteria_stated",
                manifest,
                ("sampling", "inclusion_exclusion_criteria_stated"),
                "sampling: inclusion and exclusion criteria are "
                "stated")
    _bool_check(results, "sampling_and_power",
                "study_design_power_analysis_done_before_collection",
                manifest,
                ("sampling", "power_analysis_done_before_collection"),
                "design: power / precision analysis is done before "
                "collection, not after")
    _check(results, "sampling_and_power",
           "study_design_groups_list_declared", groups, groups_is_list,
           groups_is_list and groups_count > 0,
           "the declared record names its groups — the groups "
           "list is present and names at least one group; an "
           "absent list is missing evidence and an empty list "
           "declares no groups at all")
    group_id_present = (
        groups_is_list and all(_has(c, "group_id") for c in grows)
    )
    _check(results, "sampling_and_power",
           "study_design_every_group_id_unique", groups,
           group_id_present,
           groups_is_list and duplicate_group_ids is not None
           and len(duplicate_group_ids) == 0,
           "groups: no declared group_id is owned by more than "
           "one row")
    group_size_present = (
        groups_is_list
        and all(_has(c, "declared_size")
                and _is_number(c.get("declared_size")) for c in grows)
    )
    _check(results, "sampling_and_power",
           "study_design_every_group_size_positive_whole", groups,
           group_size_present,
           groups_is_list
           and all(isinstance(c, dict)
                   and _is_positive_whole(c.get("declared_size"))
                   for c in grows),
           "groups: every declared group size is a positive "
           "whole number (at least one)")
    total_present = (
        groups_is_list and len(grows) > 0 and has_declared_total
        and group_size_present
    )
    _check(results, "sampling_and_power",
           "study_design_total_sample_size_matches_group_sum", groups,
           total_present,
           total_present
           and _values_match(declared_total,
                             computed_total_sample_size),
           "sample size: the declared total sample size equals "
           "the sum of the declared group sizes (6dp "
           "serialization)")
    _check(results, "sampling_and_power",
           "study_design_alpha_in_valid_probability_range", alpha,
           has_alpha,
           has_alpha and _is_number(alpha) and 0 < alpha < 1,
           "power inputs: the declared alpha is a probability — "
           "strictly between 0 and 1")
    _check(results, "sampling_and_power",
           "study_design_target_power_in_valid_probability_range",
           target_power, has_power,
           has_power and _is_number(target_power)
           and 0 < target_power < 1,
           "power inputs: the declared target power is a "
           "probability — strictly between 0 and 1")
    _check(results, "sampling_and_power",
           "study_design_effect_size_nonzero", effect_size, has_effect,
           has_effect and _is_number(effect_size) and effect_size != 0,
           "power inputs: the declared effect size is non-zero — "
           "a zero effect is the null, not an effect to detect")

    # ---- Section 4: analysis_plan (skill method steps 2-3 —
    #      pre-register the analysis plan; EDA, assumption
    #      checks, effect sizes with uncertainty; quality gates:
    #      plan exists, deviations logged) ----
    _bool_check(results, "analysis_plan",
                "study_design_analysis_plan_written_before_collection",
                manifest, ("analysis", "plan_written_before_collection"),
                "analysis plan: the analysis plan is written "
                "before collection")
    _bool_check(results, "analysis_plan",
                "study_design_analysis_plan_preregistered", manifest,
                ("analysis", "plan_preregistered"),
                "analysis plan: the analysis plan is pre-registered")
    _bool_check(results, "analysis_plan",
                "study_design_primary_analysis_method_named", manifest,
                ("analysis", "primary_method_named"),
                "analysis plan: the primary analysis method is "
                "named (the model ladder starts simple)")
    _bool_check(results, "analysis_plan",
                "study_design_assumption_checks_planned", manifest,
                ("analysis", "assumption_checks_planned"),
                "analysis plan: assumption checks are planned — "
                "assumptions tested, not assumed")
    _bool_check(results, "analysis_plan",
                "study_design_effect_size_with_uncertainty_planned",
                manifest,
                ("analysis", "effect_size_with_uncertainty_planned"),
                "analysis plan: effect sizes with uncertainty "
                "(confidence / credible intervals) are planned — "
                "never bare p-values")
    _bool_check(results, "analysis_plan",
                "study_design_multiple_comparison_discipline_planned",
                manifest,
                ("analysis",
                 "multiple_comparison_discipline_planned"),
                "analysis plan: multiple-comparison discipline is "
                "planned")
    _bool_check(results, "analysis_plan",
                "study_design_analysis_plan_deviations_logging_planned",
                manifest, ("analysis", "deviations_logging_planned"),
                "quality gate: deviations from the analysis plan "
                "will be logged with reasons")

    # ---- Section 5: validation_and_bias_controls (skill method
    #      step 4 — validate: sensitivity, robustness, honest
    #      reporting; step 1 data audit: provenance, missingness,
    #      leakage) ----
    _bool_check(results, "validation_and_bias_controls",
                "study_design_sensitivity_analyses_planned", manifest,
                ("validation", "sensitivity_analyses_planned"),
                "validate: sensitivity analyses are planned")
    _bool_check(results, "validation_and_bias_controls",
                "study_design_robustness_checks_planned", manifest,
                ("validation", "robustness_checks_planned"),
                "validate: robustness to outliers and "
                "misspecification is planned")
    _bool_check(results, "validation_and_bias_controls",
                "study_design_leakage_audit_planned", manifest,
                ("validation", "leakage_audit_planned"),
                "intake audit: a leakage audit of the data is "
                "planned (with provenance and missingness)")
    _bool_check(results, "validation_and_bias_controls",
                "study_design_limitations_section_planned", manifest,
                ("validation", "limitations_section_planned"),
                "quality gate: a limitations section is planned "
                "and honest")
    _bool_check(results, "validation_and_bias_controls",
                "study_design_what_would_change_conclusion_stated",
                manifest,
                ("validation", "what_would_change_conclusion_stated"),
                "handoff: what would change the conclusion is "
                "documented")

    # ---- Section 6: delivery_and_reproducibility (skill method
    #      steps 5-6 — deliver and handoff: executive summary,
    #      methods memo, reproducible appendix, sealed pipeline)
    _bool_check(results, "delivery_and_reproducibility",
                "study_design_executive_summary_planned", manifest,
                ("delivery", "executive_summary_planned"),
                "deliver: a one-page executive summary is planned "
                "(findings, decisions, limitations)")
    _bool_check(results, "delivery_and_reproducibility",
                "study_design_methods_memo_planned", manifest,
                ("delivery", "methods_memo_planned"),
                "deliver: a methods memo is planned")
    _bool_check(results, "delivery_and_reproducibility",
                "study_design_reproducible_appendix_planned", manifest,
                ("delivery", "reproducible_appendix_planned"),
                "deliver: a reproducible appendix is planned "
                "(script, data checksums, environment)")
    _bool_check(results, "delivery_and_reproducibility",
                "study_design_pipeline_sealed_for_rerun", manifest,
                ("delivery", "pipeline_sealed_for_rerun"),
                "handoff: the pipeline is sealed so the analysis "
                "can be re-run when data updates")

    # ---- Section 7: red_lines (skill red lines) ----
    _false_check(results, "red_lines",
                 "study_design_free_of_significance_without_uncertainty",
                 manifest,
                 ("red_lines",
                  "significance_without_effect_size_and_uncertainty_present"),
                 "red line: no significance reported without "
                 "effect size and uncertainty is present in the "
                 "record")
    _false_check(results, "red_lines",
                 "study_design_free_of_p_hacking_or_selective_reporting",
                 manifest,
                 ("red_lines", "p_hacking_or_selective_reporting_present"),
                 "red line: no p-hacking or selective reporting is "
                 "present in the record")
    _false_check(results, "red_lines",
                 "study_design_free_of_unsupported_causal_language",
                 manifest,
                 ("red_lines",
                  "causal_language_from_observational_without_design_present"),
                 "red line: no causal language from observational "
                 "data without the design to back it is present in "
                 "the record")
    _false_check(results, "red_lines",
                 "study_design_free_of_unredacted_pii_or_unapproved_reuse",
                 manifest,
                 ("red_lines",
                  "unredacted_pii_or_unapproved_reuse_present"),
                 "red line: no unredacted PII or unapproved reuse "
                 "of client data is present in the record")
    _false_check(results, "red_lines",
                 "study_design_free_of_outcome_guarantees", manifest,
                 ("red_lines", "outcome_guarantee_present"),
                 "red line: no guarantee of outcomes is present in "
                 "the record")

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
        verdict = "STUDY_DESIGN_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "STUDY_DESIGN_READY"

    computed_names = (
        "study_design_type_recognised",
        "study_design_variables_list_declared",
        "study_design_every_variable_id_unique",
        "study_design_every_variable_role_recognised",
        "study_design_at_least_one_outcome_variable_declared",
        "study_design_groups_list_declared",
        "study_design_every_group_id_unique",
        "study_design_every_group_size_positive_whole",
        "study_design_total_sample_size_matches_group_sum",
        "study_design_alpha_in_valid_probability_range",
        "study_design_target_power_in_valid_probability_range",
        "study_design_effect_size_nonzero",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "statistical-study-design-report",
        "atom_version": "0.1.0",
        "study_title": manifest.get("study_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "variables_count": variables_count,
        "outcome_variable_count": outcome_variable_count,
        "duplicate_variable_ids": duplicate_variable_ids,
        "variables_with_unrecognised_role":
            variables_with_unrecognised_role,
        "groups_count": groups_count,
        "duplicate_group_ids": duplicate_group_ids,
        "computed_total_sample_size": computed_total_sample_size,
        "declared_total_sample_size": declared_total_out,
        "total_sample_size_difference": total_difference,
        "largest_group_share": _fmt6(largest_group_share),
        "declared_alpha": alpha_out,
        "declared_target_power": power_out,
        "declared_effect_size": effect_out,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "STATISTICAL STUDY DESIGN REPORT",
        f"study_title: {verdict.get('study_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: statistical_study_design_report.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "STUDY_DESIGN_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
