#!/usr/bin/env python3
"""Validated simulation scenario pack — deterministic core.

Built from the bound skill `simulation-engineering`: "Build
simulations and harnesses that teach — models, seeds,
validation against reality, scenario sweeps." Its method in
brief is this atom's record structure: purpose sets the
fidelity bar, with what is modeled and what is abstracted —
and the limits — stated up front; a deterministic core where
possible, units explicit (SI everywhere), domain equations
referenced, and no magic numbers; randomness seeded and
logged, with stochastic runs reported as distributions (n
runs, bands) not single outcomes, reproducible from the seed
log; a scenario library of parameter sweeps, boundary cases
and evolving-fault libraries, with golden scenarios carrying
expected outcomes as regression tests; validation that
reproduces textbook / field / reference cases, reports errors
honestly, and versions the model (no silent changes — new
version, new validation); interaction with sane defaults,
step / pause / rewind controls and overlays that explain the
physics, with exportable run logs; and performance that
chunks heavy compute behind workers with interactive frame
budgets for live UIs. Its red lines are this atom's red
lines: never present sim output as field truth; no hidden
model edits; safety-critical training tools carry warning
labels.

This atom is a DELIVERABLE audit of a declared simulation
scenario pack record: it audits the record a caller declares
— the purpose and fidelity declarations, the declared
parameter rows with their declared SI units and basis notes,
the randomness and seed declarations, the declared scenario
rows with their declared types, expected outcomes and seeds,
the declared validation-case rows with their declared
expected values, simulated values and declared absolute
errors, the declared model version, the interaction / log /
performance declarations, and the red lines refused. It runs
NO simulation, executes NO scenario, reproduces NO case and
makes NO engineering determination: every skill step that
builds a model, runs a simulation, sweeps a scenario, judges
fidelity, or determines that a model is valid against reality
is EXCLUDED from this atom by name — building or running a
simulation, executing a scenario or a sweep, validating a
model against the real world, judging that simulated values
are correct, setting a fidelity level for a caller's purpose,
and certifying a pack as safe or fit for training or for any
engineering use are each excluded; the atom checks only that
the pack record the skill requires is present and internally
consistent on the declared evidence, and it recomputes the
record's own declared arithmetic exactly (each validation
case's declared absolute error against its declared expected
and simulated values). Checking a DECLARED error's arithmetic
is audit, not validation: the atom never checks that a
simulated value is right, only that the declared error is
the declared difference.

Distinct ground: the nearest siblings are
`relay-fault-simulation-walkthrough` (a domain walkthrough
deliverable for relay fault training on one engine),
`strategy-backtest-validation` (declared backtest evidence
for a trading strategy — in/out-of-sample, costs,
walk-forward, overfit), `testing-strategy-regression-pack`
(a software testing strategy and regression plan — test
levels, regression per defect, flake control) and
`uat-scenario-sign-off-pack` (business UAT scenarios and
acceptance sign-off). This atom shares zero checks with any
of them: every check here is a simulation-pack question —
purpose-to-fidelity framing with limits up front, a
deterministic core with SI-unit parameter rows whose every
value carries a basis note, seeded reproducibility with
stochastic runs reported as distributions, a scenario
library whose rows are typed parameter-sweep / boundary /
evolving-fault / golden / nominal with expected outcomes and
seeds, golden scenarios present and used as regression
tests, and validation-case rows whose declared absolute
errors recompute exactly from their declared expected and
simulated values under a declared, versioned model. The
boundary is: one simulation scenario pack's declared record
here; a relay-training walkthrough, a strategy backtest, a
software test plan, and a UAT acceptance round there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- parameters: at least one declared row, unique parameter
  ids, a non-empty parameter name, a recognised SI unit, a
  declared numeric value and a non-empty basis note on every
  row (the basis note is the record form of "no magic
  numbers": every declared number names where it came from);
- scenarios: at least two declared rows (a pack / library by
  the record's own framing; one row is a single case, not a
  library), unique scenario ids, a non-empty scenario name,
  a scenario type recognised from the skill's own library
  vocabulary (`parameter_sweep`, `boundary_case`,
  `evolving_fault`, `golden`, `nominal_case`), a non-empty
  expected outcome and a declared seed on every row, at
  least one golden, one parameter-sweep and one
  boundary-case scenario present, and — gated on the
  record's own declaration that evolving faults are
  applicable — at least one evolving-fault scenario;
- validation cases: at least one declared row, unique case
  ids, a non-empty case name and a non-empty reference
  source on every row, a non-empty declared model version,
  and every case's declared absolute error recomputing
  exactly as abs(declared simulated value − declared
  expected value), compared on the fixed 6dp serialization
  below;
- gated declarations: stochastic runs reported as
  distributions, and distribution bands / run counts
  reported, only where stochastic elements are declared
  present; an interactive frame budget only where a live
  interactive UI is declared present; heavy compute chunked
  behind workers only where heavy compute is declared
  present; an evolving-fault scenario only where evolving
  faults are declared applicable.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no fidelity
score, no error tolerance, no run count, no frame rate, no
scenario count beyond the library framing above — so no such
check is invented; those quantities are caller declarations
at most, and quantities here are computed and reported, with
exact recomputation and completeness over the caller's own
declared rows as the only bars.

Verdict:
- any fail             -> SIMULATION_SCENARIO_PACK_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SIMULATION_SCENARIO_PACK_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "purpose_and_fidelity",
    "model_core_and_units",
    "randomness_and_reproducibility",
    "scenario_library_and_golden_cases",
    "validation_against_reality",
    "interaction_logs_and_performance",
    "red_lines",
)

SCENARIO_TYPES = (
    "parameter_sweep",
    "boundary_case",
    "evolving_fault",
    "golden",
    "nominal_case",
)

SI_UNITS = (
    "m", "kg", "s", "A", "K", "mol", "cd", "rad",
    "Hz", "N", "Pa", "J", "W", "C", "V", "F", "ohm", "S",
    "Wb", "T", "H", "lm", "lx",
    "dimensionless", "m/s", "m/s^2", "kg/m^3", "N*m",
)

MANIFEST_SPEC = {
    "pack_title": "string",
    "purpose": {
        "purpose_declared": "boolean",
        "fidelity_level_declared": "boolean",
        "modeled_scope_declared": "boolean",
        "abstractions_declared": "boolean",
        "limits_stated_upfront": "boolean",
    },
    "core": {
        "deterministic_core_declared": "boolean",
        "units_explicit_si_declared": "boolean",
        "domain_equations_referenced": "boolean",
        "no_magic_numbers_declared": "boolean",
    },
    "parameters": [{
        "parameter_id": "string",
        "parameter_name": "string",
        "unit": "string",
        "value": "number",
        "basis_note": "string",
    }],
    "randomness": {
        "stochastic_elements_present": "boolean",
        "seeds_logged": "boolean",
        "reproducibility_from_seed_log_declared": "boolean",
        "stochastic_runs_reported_as_distributions": "boolean",
        "distribution_bands_and_run_counts_reported": "boolean",
    },
    "scenarios": [{
        "scenario_id": "string",
        "scenario_name": "string",
        "scenario_type": "string",
        "expected_outcome": "string",
        "seed_value": "number",
    }],
    "scenario_library": {
        "golden_scenarios_used_as_regression_tests": "boolean",
        "scenario_expected_outcomes_recorded": "boolean",
        "evolving_faults_applicable": "boolean",
    },
    "model_version": "string",
    "validation": {
        "validation_cases_cited": "boolean",
        "errors_reported_honestly": "boolean",
        "model_changes_versioned_without_silent_edits": "boolean",
    },
    "validation_cases": [{
        "case_id": "string",
        "case_name": "string",
        "reference_source": "string",
        "expected_value": "number",
        "simulated_value": "number",
        "absolute_error_declared": "number",
    }],
    "interaction": {
        "sane_defaults_declared": "boolean",
        "step_pause_rewind_controls_declared": "boolean",
        "explanatory_overlays_declared": "boolean",
        "run_logs_exportable": "boolean",
        "live_interactive_ui_present": "boolean",
    },
    "performance": {
        "heavy_compute_present": "boolean",
        "heavy_compute_chunked_behind_workers": "boolean",
        "interactive_frame_budget_declared": "boolean",
    },
    "red_lines": {
        "sim_output_presented_as_field_truth_present": "boolean",
        "hidden_model_edits_present": "boolean",
        "safety_critical_training_without_warning_labels_present": "boolean",
        "single_stochastic_outcome_presented_as_certain_present": "boolean",
        "unseeded_randomness_present": "boolean",
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _is_number(value):
    return (isinstance(value, (int, float))
            and not isinstance(value, bool))


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


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
    """Return the verdict dict for a simulation scenario pack."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    parameters, has_parameters = _get(manifest, "parameters")
    param_is_list = has_parameters and isinstance(parameters, list)
    param_count = len(parameters) if param_is_list else None
    param_rows = parameters if param_is_list else []

    scenarios, has_scenarios = _get(manifest, "scenarios")
    scen_is_list = has_scenarios and isinstance(scenarios, list)
    scen_count = len(scenarios) if scen_is_list else None
    scen_rows = scenarios if scen_is_list else []

    val_cases, has_val_cases = _get(manifest, "validation_cases")
    val_is_list = has_val_cases and isinstance(val_cases, list)
    val_count = len(val_cases) if val_is_list else None
    val_rows = val_cases if val_is_list else []

    model_version, has_model_version = _get(manifest, "model_version")

    duplicate_parameter_ids = (
        _duplicates(param_rows, "parameter_id") if param_is_list else None)
    duplicate_scenario_ids = (
        _duplicates(scen_rows, "scenario_id") if scen_is_list else None)
    duplicate_validation_case_ids = (
        _duplicates(val_rows, "case_id") if val_is_list else None)

    parameters_without_name = (
        [_row_name(c, "parameter_id") for c in param_rows
         if _has(c, "parameter_name")
         and not _nonempty_str(c.get("parameter_name"))]
        if param_is_list else None)
    parameters_with_invalid_unit = (
        [_row_name(c, "parameter_id") for c in param_rows
         if _has(c, "unit") and c.get("unit") not in SI_UNITS]
        if param_is_list else None)
    parameters_without_basis_note = (
        [_row_name(c, "parameter_id") for c in param_rows
         if _has(c, "basis_note")
         and not _nonempty_str(c.get("basis_note"))]
        if param_is_list else None)
    scenarios_without_name = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "scenario_name")
         and not _nonempty_str(c.get("scenario_name"))]
        if scen_is_list else None)
    scenarios_with_invalid_type = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "scenario_type")
         and c.get("scenario_type") not in SCENARIO_TYPES]
        if scen_is_list else None)
    scenarios_without_expected_outcome = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "expected_outcome")
         and not _nonempty_str(c.get("expected_outcome"))]
        if scen_is_list else None)
    validation_cases_without_name = (
        [_row_name(c, "case_id") for c in val_rows
         if _has(c, "case_name")
         and not _nonempty_str(c.get("case_name"))]
        if val_is_list else None)
    validation_cases_without_reference = (
        [_row_name(c, "case_id") for c in val_rows
         if _has(c, "reference_source")
         and not _nonempty_str(c.get("reference_source"))]
        if val_is_list else None)

    def _error_matches(c):
        if not (_has(c, "expected_value") and _has(c, "simulated_value")
                and _has(c, "absolute_error_declared")):
            return False
        expected = c.get("expected_value")
        simulated = c.get("simulated_value")
        declared = c.get("absolute_error_declared")
        if not (_is_number(expected) and _is_number(simulated)
                and _is_number(declared)):
            return False
        return _fmt6(abs(simulated - expected)) == _fmt6(declared)

    validation_cases_with_error_mismatch = (
        [_row_name(c, "case_id") for c in val_rows
         if _has(c, "expected_value") and _has(c, "simulated_value")
         and _has(c, "absolute_error_declared") and not _error_matches(c)]
        if val_is_list else None)

    scenario_golden_present = (
        any(c.get("scenario_type") == "golden" for c in scen_rows
            if isinstance(c, dict))
        if scen_is_list else None)
    scenario_sweep_present = (
        any(c.get("scenario_type") == "parameter_sweep" for c in scen_rows
            if isinstance(c, dict))
        if scen_is_list else None)
    scenario_boundary_present = (
        any(c.get("scenario_type") == "boundary_case" for c in scen_rows
            if isinstance(c, dict))
        if scen_is_list else None)
    scenario_evolving_present = (
        any(c.get("scenario_type") == "evolving_fault" for c in scen_rows
            if isinstance(c, dict))
        if scen_is_list else None)

    declared_errors = [
        c["absolute_error_declared"] for c in val_rows
        if isinstance(c, dict) and _is_number(c.get("absolute_error_declared"))]
    max_declared_error = (
        max(declared_errors)
        if val_is_list and len(declared_errors) > 0 else None)

    parameter_basis_ratio = (
        sum(1 for c in param_rows
            if _nonempty_str(c.get("basis_note"))) / param_count
        if param_is_list and param_count > 0 else None)
    scenario_expected_outcome_ratio = (
        sum(1 for c in scen_rows
            if _nonempty_str(c.get("expected_outcome"))) / scen_count
        if scen_is_list and scen_count > 0 else None)
    scenario_seed_coverage_ratio = (
        sum(1 for c in scen_rows if _has(c, "seed_value")) / scen_count
        if scen_is_list and scen_count > 0 else None)
    validation_case_reference_ratio = (
        sum(1 for c in val_rows
            if _nonempty_str(c.get("reference_source"))) / val_count
        if val_is_list and val_count > 0 else None)
    validation_error_match_ratio = (
        sum(1 for c in val_rows if _error_matches(c)) / val_count
        if val_is_list and val_count > 0 else None)

    # ---- Section 1: purpose_and_fidelity ----
    _bool_check(results, "purpose_and_fidelity",
                "sim_scenario_pack_purpose_declared", manifest,
                ("purpose", "purpose_declared"),
                "purpose and fidelity: the pack declares its purpose — teaching, predicting or testing — which sets the fidelity bar")
    _bool_check(results, "purpose_and_fidelity",
                "sim_scenario_pack_fidelity_level_declared", manifest,
                ("purpose", "fidelity_level_declared"),
                "purpose and fidelity: the fidelity level the declared purpose demands is declared")
    _bool_check(results, "purpose_and_fidelity",
                "sim_scenario_pack_modeled_scope_declared", manifest,
                ("purpose", "modeled_scope_declared"),
                "purpose and fidelity: what the model models is documented")
    _bool_check(results, "purpose_and_fidelity",
                "sim_scenario_pack_abstractions_declared", manifest,
                ("purpose", "abstractions_declared"),
                "purpose and fidelity: what the model abstracts away is documented")
    _bool_check(results, "purpose_and_fidelity",
                "sim_scenario_pack_limits_stated_upfront", manifest,
                ("purpose", "limits_stated_upfront"),
                "purpose and fidelity: the model's limits are stated up front")

    # ---- Section 2: model_core_and_units ----
    _bool_check(results, "model_core_and_units",
                "sim_scenario_pack_deterministic_core_declared", manifest,
                ("core", "deterministic_core_declared"),
                "core discipline: the model's core is declared deterministic where possible")
    _bool_check(results, "model_core_and_units",
                "sim_scenario_pack_units_explicit_si_declared", manifest,
                ("core", "units_explicit_si_declared"),
                "core discipline: units are declared explicit, SI everywhere")
    _bool_check(results, "model_core_and_units",
                "sim_scenario_pack_domain_equations_referenced", manifest,
                ("core", "domain_equations_referenced"),
                "core discipline: the domain equations, curves, constants and standards the model uses are referenced")
    _bool_check(results, "model_core_and_units",
                "sim_scenario_pack_no_magic_numbers_declared", manifest,
                ("core", "no_magic_numbers_declared"),
                "core discipline: the pack declares no magic numbers — every constant is named and sourced")
    _check(results, "model_core_and_units",
           "sim_scenario_pack_parameters_list_declared", parameters,
           param_is_list, param_is_list and param_count >= 1,
           "parameters: the declared record names its model parameters — the list is present and names at least one parameter; an absent list is missing evidence and an empty list declares no parameterised model at all")
    param_id_present = param_is_list and all(
        _has(c, "parameter_id") for c in param_rows)
    _check(results, "model_core_and_units",
           "every_sim_scenario_pack_parameter_id_unique", parameters,
           param_id_present,
           param_is_list and duplicate_parameter_ids is not None
           and len(duplicate_parameter_ids) == 0,
           "parameters: no declared parameter_id is owned by more than one row")
    param_name_present = param_is_list and all(
        _has(c, "parameter_name") for c in param_rows)
    _check(results, "model_core_and_units",
           "every_sim_scenario_pack_parameter_name_declared", parameters,
           param_name_present,
           param_is_list
           and all(_nonempty_str(c.get("parameter_name")) for c in param_rows),
           "parameters: every declared parameter declares a non-empty parameter name")
    unit_present = param_is_list and all(
        _has(c, "unit") for c in param_rows)
    _check(results, "model_core_and_units",
           "every_sim_scenario_pack_parameter_unit_recognised_si", parameters,
           unit_present,
           param_is_list
           and all(c.get("unit") in SI_UNITS for c in param_rows),
           "parameters: every declared parameter's unit is a recognised SI unit — an SI base or derived unit, a listed SI compound form, or dimensionless")
    value_present = param_is_list and all(
        _has(c, "value") for c in param_rows)
    _check(results, "model_core_and_units",
           "every_sim_scenario_pack_parameter_value_declared", parameters,
           value_present,
           param_is_list
           and all(_is_number(c.get("value")) for c in param_rows),
           "parameters: every declared parameter declares a numeric value")
    basis_present = param_is_list and all(
        _has(c, "basis_note") for c in param_rows)
    _check(results, "model_core_and_units",
           "every_sim_scenario_pack_parameter_basis_note_declared", parameters,
           basis_present,
           param_is_list
           and all(_nonempty_str(c.get("basis_note")) for c in param_rows),
           "parameters: every declared parameter declares a non-empty basis note naming where its value comes from — the record form of no magic numbers")

    # ---- Section 3: randomness_and_reproducibility ----
    stochastic_value, stochastic_present = _get(
        manifest, "randomness", "stochastic_elements_present")
    _check(results, "randomness_and_reproducibility",
           "sim_scenario_pack_stochastic_elements_identified",
           stochastic_value, stochastic_present, True,
           "randomness: whether the model has stochastic elements is declared — the declaration itself is the evidence, true or false; the gated distribution checks below read it")
    _bool_check(results, "randomness_and_reproducibility",
                "sim_scenario_pack_seeds_logged", manifest,
                ("randomness", "seeds_logged"),
                "randomness: the randomness is seeded and the seeds are logged")
    _bool_check(results, "randomness_and_reproducibility",
                "sim_scenario_pack_reproducibility_from_seed_log_declared",
                manifest,
                ("randomness", "reproducibility_from_seed_log_declared"),
                "randomness: runs are declared reproducible from the seed log")
    _gated_bool_check(
        results, "randomness_and_reproducibility",
        "sim_scenario_pack_stochastic_runs_reported_as_distributions_where_stochastic",
        manifest,
        ("randomness", "stochastic_elements_present"),
        ("randomness", "stochastic_runs_reported_as_distributions"),
        "randomness: stochastic runs are reported as distributions, not single outcomes",
        "no stochastic elements declared present")
    _gated_bool_check(
        results, "randomness_and_reproducibility",
        "sim_scenario_pack_distribution_bands_and_run_counts_reported_where_stochastic",
        manifest,
        ("randomness", "stochastic_elements_present"),
        ("randomness", "distribution_bands_and_run_counts_reported"),
        "randomness: stochastic results are reported with run counts and distribution bands",
        "no stochastic elements declared present")
    seed_present = scen_is_list and all(
        _has(c, "seed_value") for c in scen_rows)
    _check(results, "randomness_and_reproducibility",
           "every_sim_scenario_pack_scenario_seed_declared", scenarios,
           seed_present,
           scen_is_list
           and all(_is_number(c.get("seed_value")) for c in scen_rows),
           "randomness: every declared scenario declares the seed its runs reproduce from")

    # ---- Section 4: scenario_library_and_golden_cases ----
    _bool_check(results, "scenario_library_and_golden_cases",
                "sim_scenario_pack_golden_scenarios_used_as_regression_tests",
                manifest,
                ("scenario_library", "golden_scenarios_used_as_regression_tests"),
                "scenario library: golden scenarios are used as regression tests")
    _bool_check(results, "scenario_library_and_golden_cases",
                "sim_scenario_pack_scenario_expected_outcomes_recorded",
                manifest,
                ("scenario_library", "scenario_expected_outcomes_recorded"),
                "scenario library: expected outcomes are recorded for the scenarios")
    _check(results, "scenario_library_and_golden_cases",
           "sim_scenario_pack_scenarios_list_declared", scenarios,
           scen_is_list, scen_is_list and scen_count >= 2,
           "scenarios: the declared record names its scenario library — the list is present and names at least two scenarios; an absent list is missing evidence and a single row is one case, not a library")
    scen_id_present = scen_is_list and all(
        _has(c, "scenario_id") for c in scen_rows)
    _check(results, "scenario_library_and_golden_cases",
           "every_sim_scenario_pack_scenario_id_unique", scenarios,
           scen_id_present,
           scen_is_list and duplicate_scenario_ids is not None
           and len(duplicate_scenario_ids) == 0,
           "scenarios: no declared scenario_id is owned by more than one row")
    scen_name_present = scen_is_list and all(
        _has(c, "scenario_name") for c in scen_rows)
    _check(results, "scenario_library_and_golden_cases",
           "every_sim_scenario_pack_scenario_name_declared", scenarios,
           scen_name_present,
           scen_is_list
           and all(_nonempty_str(c.get("scenario_name")) for c in scen_rows),
           "scenarios: every declared scenario declares a non-empty scenario name")
    type_present = scen_is_list and all(
        _has(c, "scenario_type") for c in scen_rows)
    _check(results, "scenario_library_and_golden_cases",
           "every_sim_scenario_pack_scenario_type_recognised", scenarios,
           type_present,
           scen_is_list
           and all(c.get("scenario_type") in SCENARIO_TYPES
                   for c in scen_rows),
           "scenarios: every declared scenario's type is one of parameter_sweep, boundary_case, evolving_fault, golden, nominal_case — the skill's scenario-library vocabulary")
    outcome_present = scen_is_list and all(
        _has(c, "expected_outcome") for c in scen_rows)
    _check(results, "scenario_library_and_golden_cases",
           "every_sim_scenario_pack_scenario_expected_outcome_declared",
           scenarios, outcome_present,
           scen_is_list
           and all(_nonempty_str(c.get("expected_outcome"))
                   for c in scen_rows),
           "scenarios: every declared scenario declares a non-empty expected outcome")
    _check(results, "scenario_library_and_golden_cases",
           "sim_scenario_pack_golden_scenario_present", scenarios,
           scen_is_list,
           scen_is_list and scenario_golden_present is True,
           "scenarios: at least one declared scenario is a golden scenario with an expected outcome, held as a regression test")
    _check(results, "scenario_library_and_golden_cases",
           "sim_scenario_pack_parameter_sweep_scenario_present", scenarios,
           scen_is_list,
           scen_is_list and scenario_sweep_present is True,
           "scenarios: at least one declared scenario is a parameter sweep")
    _check(results, "scenario_library_and_golden_cases",
           "sim_scenario_pack_boundary_case_scenario_present", scenarios,
           scen_is_list,
           scen_is_list and scenario_boundary_present is True,
           "scenarios: at least one declared scenario is a boundary case")
    evolving_gate, has_evolving_gate = _get(
        manifest, "scenario_library", "evolving_faults_applicable")
    if has_evolving_gate and evolving_gate:
        _check(results, "scenario_library_and_golden_cases",
               "sim_scenario_pack_evolving_fault_scenario_present_where_applicable",
               scenarios, scen_is_list,
               scen_is_list and scenario_evolving_present is True,
               "scenarios: evolving faults are declared applicable, and at least one declared scenario is an evolving-fault scenario")
    else:
        _check(results, "scenario_library_and_golden_cases",
               "sim_scenario_pack_evolving_fault_scenario_present_where_applicable",
               evolving_gate, has_evolving_gate, True,
               "evolving faults not declared applicable")

    # ---- Section 5: validation_against_reality ----
    _bool_check(results, "validation_against_reality",
                "sim_scenario_pack_validation_cases_cited", manifest,
                ("validation", "validation_cases_cited"),
                "validation: the validation cases the model was checked against are cited")
    _bool_check(results, "validation_against_reality",
                "sim_scenario_pack_validation_errors_reported_honestly",
                manifest,
                ("validation", "errors_reported_honestly"),
                "validation: validation errors are reported honestly, not hidden or rounded away")
    _bool_check(results, "validation_against_reality",
                "sim_scenario_pack_model_changes_versioned_without_silent_edits",
                manifest,
                ("validation", "model_changes_versioned_without_silent_edits"),
                "validation: the model is versioned — no silent changes; a new version carries new validation")
    _check(results, "validation_against_reality",
           "sim_scenario_pack_model_version_declared", model_version,
           has_model_version,
           has_model_version and _nonempty_str(model_version),
           "validation: the declared record names the model version this pack validates — an absent version is missing evidence and an empty version fails")
    _check(results, "validation_against_reality",
           "sim_scenario_pack_validation_cases_list_declared", val_cases,
           val_is_list, val_is_list and val_count >= 1,
           "validation cases: the declared record names its validation cases — the list is present and names at least one case; an absent list is missing evidence and an empty list declares no validation at all")
    val_id_present = val_is_list and all(
        _has(c, "case_id") for c in val_rows)
    _check(results, "validation_against_reality",
           "every_sim_scenario_pack_validation_case_id_unique", val_cases,
           val_id_present,
           val_is_list and duplicate_validation_case_ids is not None
           and len(duplicate_validation_case_ids) == 0,
           "validation cases: no declared case_id is owned by more than one row")
    val_name_present = val_is_list and all(
        _has(c, "case_name") for c in val_rows)
    _check(results, "validation_against_reality",
           "every_sim_scenario_pack_validation_case_name_declared", val_cases,
           val_name_present,
           val_is_list
           and all(_nonempty_str(c.get("case_name")) for c in val_rows),
           "validation cases: every declared validation case declares a non-empty case name")
    ref_present = val_is_list and all(
        _has(c, "reference_source") for c in val_rows)
    _check(results, "validation_against_reality",
           "every_sim_scenario_pack_validation_case_reference_source_declared",
           val_cases, ref_present,
           val_is_list
           and all(_nonempty_str(c.get("reference_source"))
                   for c in val_rows),
           "validation cases: every declared validation case cites a non-empty reference source — the textbook, field or reference case it reproduces")
    error_present = val_is_list and all(
        _has(c, "expected_value") and _has(c, "simulated_value")
        and _has(c, "absolute_error_declared") for c in val_rows)
    _check(results, "validation_against_reality",
           "every_sim_scenario_pack_validation_case_absolute_error_recomputes",
           val_cases, error_present,
           val_is_list and all(_error_matches(c) for c in val_rows),
           "validation cases: every declared case's declared absolute error recomputes exactly as the absolute difference between its declared simulated and expected values — the atom checks the declared arithmetic only; it never checks that a simulated value is right")

    # ---- Section 6: interaction_logs_and_performance ----
    _bool_check(results, "interaction_logs_and_performance",
                "sim_scenario_pack_sane_defaults_declared", manifest,
                ("interaction", "sane_defaults_declared"),
                "interaction: the harness declares sane defaults")
    _bool_check(results, "interaction_logs_and_performance",
                "sim_scenario_pack_step_pause_rewind_controls_declared",
                manifest,
                ("interaction", "step_pause_rewind_controls_declared"),
                "interaction: step, pause and rewind controls are declared")
    _bool_check(results, "interaction_logs_and_performance",
                "sim_scenario_pack_explanatory_overlays_declared", manifest,
                ("interaction", "explanatory_overlays_declared"),
                "interaction: overlays that explain the physics are declared")
    _bool_check(results, "interaction_logs_and_performance",
                "sim_scenario_pack_run_logs_exportable", manifest,
                ("interaction", "run_logs_exportable"),
                "interaction: run logs are exportable")
    _gated_bool_check(
        results, "interaction_logs_and_performance",
        "sim_scenario_pack_interactive_frame_budget_declared_where_live_ui",
        manifest,
        ("interaction", "live_interactive_ui_present"),
        ("performance", "interactive_frame_budget_declared"),
        "performance: an interactive frame budget is declared for the live UI",
        "no live interactive UI declared present")
    _gated_bool_check(
        results, "interaction_logs_and_performance",
        "sim_scenario_pack_heavy_compute_chunked_behind_workers_where_heavy",
        manifest,
        ("performance", "heavy_compute_present"),
        ("performance", "heavy_compute_chunked_behind_workers"),
        "performance: heavy compute is chunked behind workers",
        "no heavy compute declared present")

    # ---- Section 7: red_lines ----
    _false_check(results, "red_lines",
                 "sim_scenario_pack_free_of_sim_output_presented_as_field_truth",
                 manifest,
                 ("red_lines", "sim_output_presented_as_field_truth_present"),
                 "red line: no sim output presented as field truth is present in the record")
    _false_check(results, "red_lines",
                 "sim_scenario_pack_free_of_hidden_model_edits",
                 manifest,
                 ("red_lines", "hidden_model_edits_present"),
                 "red line: no hidden model edits are present in the record")
    _false_check(results, "red_lines",
                 "sim_scenario_pack_free_of_safety_critical_training_without_warning_labels",
                 manifest,
                 ("red_lines",
                  "safety_critical_training_without_warning_labels_present"),
                 "red line: no safety-critical training use without warning labels is present in the record")
    _false_check(results, "red_lines",
                 "sim_scenario_pack_free_of_single_stochastic_outcome_presented_as_certain",
                 manifest,
                 ("red_lines",
                  "single_stochastic_outcome_presented_as_certain_present"),
                 "red line: no single stochastic outcome presented as certain is present in the record")
    _false_check(results, "red_lines",
                 "sim_scenario_pack_free_of_unseeded_randomness",
                 manifest,
                 ("red_lines", "unseeded_randomness_present"),
                 "red line: no unseeded randomness is present in the record")

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
        verdict = "SIMULATION_SCENARIO_PACK_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SIMULATION_SCENARIO_PACK_SOUND"

    computed_names = (
        "sim_scenario_pack_parameters_list_declared",
        "every_sim_scenario_pack_parameter_id_unique",
        "every_sim_scenario_pack_parameter_name_declared",
        "every_sim_scenario_pack_parameter_unit_recognised_si",
        "every_sim_scenario_pack_parameter_value_declared",
        "every_sim_scenario_pack_parameter_basis_note_declared",
        "every_sim_scenario_pack_scenario_seed_declared",
        "sim_scenario_pack_scenarios_list_declared",
        "every_sim_scenario_pack_scenario_id_unique",
        "every_sim_scenario_pack_scenario_name_declared",
        "every_sim_scenario_pack_scenario_type_recognised",
        "every_sim_scenario_pack_scenario_expected_outcome_declared",
        "sim_scenario_pack_golden_scenario_present",
        "sim_scenario_pack_parameter_sweep_scenario_present",
        "sim_scenario_pack_boundary_case_scenario_present",
        "sim_scenario_pack_evolving_fault_scenario_present_where_applicable",
        "sim_scenario_pack_model_version_declared",
        "sim_scenario_pack_validation_cases_list_declared",
        "every_sim_scenario_pack_validation_case_id_unique",
        "every_sim_scenario_pack_validation_case_name_declared",
        "every_sim_scenario_pack_validation_case_reference_source_declared",
        "every_sim_scenario_pack_validation_case_absolute_error_recomputes",
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
        "service": "validated-simulation-scenario-pack",
        "atom_version": "0.1.0",
        "pack_title": manifest.get("pack_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "simulation_parameters_count": param_count,
        "simulation_scenarios_count": scen_count,
        "simulation_validation_cases_count": val_count,
        "duplicate_simulation_parameter_ids": duplicate_parameter_ids,
        "duplicate_simulation_scenario_ids": duplicate_scenario_ids,
        "duplicate_simulation_validation_case_ids": duplicate_validation_case_ids,
        "simulation_parameters_without_name": parameters_without_name,
        "simulation_parameters_with_invalid_unit": parameters_with_invalid_unit,
        "simulation_parameters_without_basis_note": parameters_without_basis_note,
        "simulation_scenarios_without_name": scenarios_without_name,
        "simulation_scenarios_with_invalid_scenario_type": scenarios_with_invalid_type,
        "simulation_scenarios_without_expected_outcome": scenarios_without_expected_outcome,
        "simulation_validation_cases_without_name": validation_cases_without_name,
        "simulation_validation_cases_without_reference_source": validation_cases_without_reference,
        "simulation_validation_cases_with_error_mismatch": validation_cases_with_error_mismatch,
        "simulation_scenario_golden_present": scenario_golden_present,
        "simulation_scenario_parameter_sweep_present": scenario_sweep_present,
        "simulation_scenario_boundary_case_present": scenario_boundary_present,
        "simulation_scenario_evolving_fault_present": scenario_evolving_present,
        "simulation_validation_max_declared_absolute_error": _fmt6(max_declared_error),
        "parameter_basis_note_ratio": _fmt6(parameter_basis_ratio),
        "scenario_expected_outcome_ratio": _fmt6(scenario_expected_outcome_ratio),
        "scenario_seed_coverage_ratio": _fmt6(scenario_seed_coverage_ratio),
        "validation_case_reference_ratio": _fmt6(validation_case_reference_ratio),
        "validation_error_match_ratio": _fmt6(validation_error_match_ratio),
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
        "VALIDATED SIMULATION SCENARIO PACK",
        f"pack_title: {verdict.get('pack_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: validated_simulation_scenario_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SIMULATION_SCENARIO_PACK_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
