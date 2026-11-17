#!/usr/bin/env python3
"""System design failure mode pack — deterministic core.

Built from the bound skill `systems-builder`: "Designs systems
from the data flow and the failure modes — clear boundaries,
single responsibilities, the simplest thing that holds under
load." Its method is this atom's method: design from the data
flow and the failure modes, not the happy path; clear contracts
between components, single responsibility, loose coupling, each
layer failing independently; know exactly where the source of
truth lives, minimise distributed state, idempotency for
anything that can be retried, and CAP trade-offs stated
explicitly rather than strong consistency assumed for free;
slow or unreliable work behind a queue, designed for
at-least-once delivery with idempotent consumers, backpressure
and dead-letter handling; design for partial failure with
timeouts, retries with jitter, circuit breakers and graceful
degradation, and health endpoints distinguishing readiness
from liveness; structured logs, metrics and traces from day
one; scale the bottleneck, not everything, measure before
scaling, stateless services scaling horizontally, caching
deliberately and invalidating honestly; zero-trust boundaries,
least privilege and real secrets management. Its anti-patterns
to refuse are this atom's red lines: a distributed monolith;
shared mutable state; retries without idempotency or
backpressure; no observability; microservices for a solo
project before the monolith hurts; and (from the state section)
strong consistency assumed without its trade-off stated.

This atom is a DELIVERABLE audit of a declared system-design
failure-mode analysis record: it audits the record a caller
declares — the design description and framing, the declared
component rows, the declared failure-mode rows with their
declared severity / occurrence / detection ratings and their
declared risk priority numbers, the declared mitigation rows
the failure modes reference, the state / reliability / queue
declarations, the observability / scaling / security
declarations, and the red lines refused. It designs no system,
invents no failure mode, performs no failure-mode analysis,
assigns no rating, certifies no safety or reliability, and
makes no engineering determination — it checks that the
analysis record the skill requires is present and internally
consistent on the declared evidence, and it recomputes the
declared risk priority numbers and the declared
cross-references exactly.

Distinct ground: the nearest siblings are
`structured-root-cause-analysis` (a RETROSPECTIVE analysis of
an incident or problem that already happened — problem
framing, timeline, causal chain and corrective actions for a
past event), `architecture-decision-record` (one architecture
decision — its context, options, decision and consequences)
and `service-isolation-hardening-review` (the isolation and
hardening posture of a service that exists). This atom is
PROSPECTIVE: it audits a failure-mode analysis of a design
before it is built, asking what could fail, component by
declared component, and whether each declared failure mode
carries declared ratings, a recomputing risk priority number
and a resolving declared mitigation. The boundary must be
unmistakable: a design's prospective failure modes here; a
past incident's root causes, a single decision's record, and
an existing service's hardening there. This atom shares zero
checks with any of them: every check here is a
design-failure-mode question.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- components: at least one declared row, unique component
  ids, a non-empty responsibility on every row, and a declared
  contract on every row;
- failure modes: at least one declared row, unique failure
  ids, every row's component_id naming a declared component,
  a non-empty failure-mode description and effect on every
  row, declared severity / occurrence / detection ratings on
  every row (positivity only — a rating must be a positive
  number to be a rating at all; no scale, such as 1-10, is
  imposed), every row's declared risk priority number
  recomputing exactly as severity x occurrence x detection,
  and every declared component covered by at least one
  declared failure mode;
- mitigations: at least one declared row, unique mitigation
  ids, a non-empty description on every row, every failure
  mode's mitigation_id naming a declared mitigation, and a
  stated residual risk on every mitigation row;
- gated declarations: queue delivery semantics, backpressure
  and dead-letter handling are required only where queue use
  is declared, and cache invalidation only where caching is
  declared.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no severity,
occurrence or detection scale, no risk-priority-number cutoff,
no component or failure-mode count, no load or latency bar —
so no such check is invented; those quantities are caller
declarations at most, and quantities here are computed and
reported, with exact recomputation and completeness over the
caller's own declared rows as the only bars. Every declined
threshold is named in SERVICE.md.

Verdict:
- any fail             -> FAILURE_MODE_PACK_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> FAILURE_MODE_PACK_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "design_framing_and_boundaries",
    "component_inventory",
    "failure_mode_rows",
    "mitigation_coverage",
    "state_reliability_and_queues",
    "observability_scaling_and_security",
    "red_lines",
)

MANIFEST_SPEC = {
    "design_name": "string",
    "design_context": {
        "requirement_stated": "boolean",
        "data_flow_described": "boolean",
        "analysis_performed_before_build": "boolean",
        "component_boundaries_clear": "boolean",
        "single_responsibility_per_component_declared": "boolean",
        "loose_coupling_declared": "boolean",
        "layer_failure_independence_declared": "boolean",
    },
    "components": [{
        "component_id": "string",
        "responsibility": "string",
        "contract_declared": "boolean",
    }],
    "failure_modes": [{
        "failure_id": "string",
        "component_id": "string",
        "failure_mode": "string",
        "effect": "string",
        "severity": "number",
        "occurrence": "number",
        "detection": "number",
        "rpn_declared": "number",
        "mitigation_id": "string",
    }],
    "mitigations": [{
        "mitigation_id": "string",
        "description": "string",
        "residual_risk_stated": "boolean",
    }],
    "mitigation_work": {
        "mitigations_considered_before_build": "boolean",
        "residual_risk_acceptance_stated": "boolean",
    },
    "state_and_reliability": {
        "source_of_truth_identified": "boolean",
        "distributed_state_minimized_declared": "boolean",
        "idempotency_for_retryable_operations_declared": "boolean",
        "cap_tradeoffs_stated_explicitly": "boolean",
        "timeouts_declared": "boolean",
        "retries_with_jitter_declared": "boolean",
        "circuit_breakers_declared": "boolean",
        "graceful_degradation_declared": "boolean",
        "readiness_vs_liveness_distinguished": "boolean",
        "slow_unreliable_work_behind_queue_declared": "boolean",
    },
    "queues": {
        "queues_used": "boolean",
        "at_least_once_delivery_with_idempotent_consumers_declared": "boolean",
        "queue_backpressure_declared": "boolean",
        "dead_letter_handling_declared": "boolean",
    },
    "observability_scaling_security": {
        "structured_logs_declared": "boolean",
        "metrics_declared": "boolean",
        "traces_declared": "boolean",
        "bottleneck_identified_before_scaling": "boolean",
        "measure_before_scaling_declared": "boolean",
        "stateless_horizontal_scaling_where_scaled_declared": "boolean",
        "zero_trust_boundaries_declared": "boolean",
        "least_privilege_declared": "boolean",
        "secrets_management_declared": "boolean",
        "external_trust_boundary_stated": "boolean",
    },
    "caching": {
        "caching_used": "boolean",
        "cache_invalidation_stated": "boolean",
    },
    "red_lines": {
        "distributed_monolith_present": "boolean",
        "shared_mutable_state_present": "boolean",
        "retries_without_idempotency_or_backpressure_present": "boolean",
        "design_without_observability_present": "boolean",
        "premature_microservices_present": "boolean",
        "strong_consistency_assumed_without_tradeoff_present": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


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


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a failure-mode manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    components, has_components = _get(manifest, "components")
    comp_is_list = has_components and isinstance(components, list)
    comp_count = len(components) if comp_is_list else None
    comp_rows = components if comp_is_list else []
    comp_ids = _ids(comp_rows, "component_id")

    failures, has_failures = _get(manifest, "failure_modes")
    fail_is_list = has_failures and isinstance(failures, list)
    fail_count = len(failures) if fail_is_list else None
    fail_rows = failures if fail_is_list else []
    fail_comp_ids = _ids(fail_rows, "component_id")

    mitigations, has_mitigations = _get(manifest, "mitigations")
    mit_is_list = has_mitigations and isinstance(mitigations, list)
    mit_count = len(mitigations) if mit_is_list else None
    mit_rows = mitigations if mit_is_list else []
    mit_ids = _ids(mit_rows, "mitigation_id")

    duplicate_component_ids = (
        _duplicates(comp_rows, "component_id") if comp_is_list else None)
    duplicate_failure_ids = (
        _duplicates(fail_rows, "failure_id") if fail_is_list else None)
    duplicate_mitigation_ids = (
        _duplicates(mit_rows, "mitigation_id") if mit_is_list else None)

    comps_without_resp = (
        [_row_name(c, "component_id") for c in comp_rows
         if _has(c, "responsibility")
         and not _nonempty_str(c.get("responsibility"))]
        if comp_is_list else None)
    comps_without_contract = (
        [_row_name(c, "component_id") for c in comp_rows
         if _has(c, "contract_declared")
         and c.get("contract_declared") is not True]
        if comp_is_list else None)
    fails_unknown_comp = (
        [_row_name(c, "failure_id") for c in fail_rows
         if _has(c, "component_id")
         and c.get("component_id") not in comp_ids]
        if fail_is_list and comp_is_list else None)
    fails_without_mode = (
        [_row_name(c, "failure_id") for c in fail_rows
         if _has(c, "failure_mode")
         and not _nonempty_str(c.get("failure_mode"))]
        if fail_is_list else None)
    fails_without_effect = (
        [_row_name(c, "failure_id") for c in fail_rows
         if _has(c, "effect") and not _nonempty_str(c.get("effect"))]
        if fail_is_list else None)

    def _ratings_ok(c):
        return all(_is_number(c.get(f)) and c.get(f) > 0
                   for f in ("severity", "occurrence", "detection"))

    def _ratings_present(c):
        return all(_has(c, f)
                   for f in ("severity", "occurrence", "detection"))

    fails_nonpositive = (
        [_row_name(c, "failure_id") for c in fail_rows
         if _ratings_present(c) and not _ratings_ok(c)]
        if fail_is_list else None)

    def _rpn_ok(c):
        return (_is_number(c.get("severity"))
                and _is_number(c.get("occurrence"))
                and _is_number(c.get("detection"))
                and _is_number(c.get("rpn_declared"))
                and c.get("rpn_declared")
                == c.get("severity") * c.get("occurrence") * c.get("detection"))

    def _rpn_present(c):
        return all(_has(c, f) for f in
                   ("severity", "occurrence", "detection", "rpn_declared"))

    fails_rpn_mismatch = (
        [_row_name(c, "failure_id") for c in fail_rows
         if _rpn_present(c) and not _rpn_ok(c)]
        if fail_is_list else None)
    comps_without_failure = (
        [cid for cid in comp_ids if cid not in fail_comp_ids]
        if comp_is_list and fail_is_list else None)
    # de-duplicate preserving order for the coverage list
    if comps_without_failure is not None:
        deduped = []
        for cid in comps_without_failure:
            if cid not in deduped:
                deduped.append(cid)
        comps_without_failure = deduped
    mits_without_desc = (
        [_row_name(c, "mitigation_id") for c in mit_rows
         if _has(c, "description")
         and not _nonempty_str(c.get("description"))]
        if mit_is_list else None)
    mits_without_residual = (
        [_row_name(c, "mitigation_id") for c in mit_rows
         if _has(c, "residual_risk_stated")
         and c.get("residual_risk_stated") is not True]
        if mit_is_list else None)
    fails_unknown_mit = (
        [_row_name(c, "failure_id") for c in fail_rows
         if _has(c, "mitigation_id")
         and c.get("mitigation_id") not in mit_ids]
        if fail_is_list and mit_is_list else None)

    comp_contract_ratio = (
        sum(1 for c in comp_rows
            if c.get("contract_declared") is True) / comp_count
        if comp_is_list and comp_count > 0 else None)
    comp_coverage_ratio = (
        len([s for s in comp_ids if s in fail_comp_ids]) / comp_count
        if comp_is_list and fail_is_list and comp_count > 0 else None)
    rpn_ratio = (
        sum(1 for c in fail_rows if _rpn_ok(c)) / fail_count
        if fail_is_list and fail_count > 0 else None)
    mit_resolution_ratio = (
        sum(1 for c in fail_rows
            if _has(c, "mitigation_id")
            and c.get("mitigation_id") in mit_ids) / fail_count
        if fail_is_list and mit_is_list and fail_count > 0 else None)

    S1 = "design_framing_and_boundaries"
    _bool_check(results, S1, "failure_mode_pack_requirement_stated",
                manifest, ("design_context", "requirement_stated"),
                "framing: the requirement the design must meet is stated — design starts from the requirement, not the happy path")
    _bool_check(results, S1, "failure_mode_pack_data_flow_described",
                manifest, ("design_context", "data_flow_described"),
                "framing: the design's data flow is described — the design is framed from its data flow")
    _bool_check(results, S1, "failure_mode_pack_analysis_performed_before_build",
                manifest, ("design_context", "analysis_performed_before_build"),
                "framing / prospective gate: this failure-mode analysis was performed before the design was built — it is prospective, not a retrospective on an incident")
    _bool_check(results, S1, "failure_mode_pack_component_boundaries_clear",
                manifest, ("design_context", "component_boundaries_clear"),
                "boundaries: clear boundaries between the design's components are declared")
    _bool_check(results, S1, "failure_mode_pack_single_responsibility_per_component_declared",
                manifest, ("design_context", "single_responsibility_per_component_declared"),
                "boundaries: a single responsibility for each component is declared")
    _bool_check(results, S1, "failure_mode_pack_loose_coupling_declared",
                manifest, ("design_context", "loose_coupling_declared"),
                "boundaries: loose coupling between components is declared")
    _bool_check(results, S1, "failure_mode_pack_layer_failure_independence_declared",
                manifest, ("design_context", "layer_failure_independence_declared"),
                "boundaries: each layer or component is declared to fail independently of the others")

    S2 = "component_inventory"
    _check(results, S2, "failure_mode_pack_components_list_declared",
           components, comp_is_list, comp_is_list and comp_count > 0,
           "components: the declared record names its components — the list is present and names at least one component; an absent list is missing evidence and an empty list declares no design at all")
    comp_id_present = comp_is_list and all(
        _has(c, "component_id") for c in comp_rows)
    _check(results, S2, "every_failure_mode_pack_component_id_unique",
           components, comp_id_present,
           comp_is_list and duplicate_component_ids is not None
           and len(duplicate_component_ids) == 0,
           "components: no declared component_id is owned by more than one row")
    resp_present = comp_is_list and all(
        _has(c, "responsibility") for c in comp_rows)
    _check(results, S2, "every_failure_mode_pack_component_responsibility_declared",
           components, resp_present,
           comp_is_list
           and all(_nonempty_str(c.get("responsibility")) for c in comp_rows),
           "components: every declared component declares a non-empty responsibility — single responsibility, named per component")
    contract_present = comp_is_list and all(
        _has(c, "contract_declared") for c in comp_rows)
    _check(results, S2, "every_failure_mode_pack_component_contract_declared",
           components, contract_present,
           comp_is_list
           and all(c.get("contract_declared") is True for c in comp_rows),
           "components: every declared component declares a clear contract with the components it interacts with")

    S3 = "failure_mode_rows"
    _check(results, S3, "failure_mode_pack_failure_modes_list_declared",
           failures, fail_is_list, fail_is_list and fail_count > 0,
           "failure modes: the declared record names its failure-mode rows — the list is present and names at least one failure mode; an absent list is missing evidence and an empty list declares no failure-mode analysis at all")
    fail_id_present = fail_is_list and all(
        _has(c, "failure_id") for c in fail_rows)
    _check(results, S3, "every_failure_mode_pack_failure_id_unique",
           failures, fail_id_present,
           fail_is_list and duplicate_failure_ids is not None
           and len(duplicate_failure_ids) == 0,
           "failure modes: no declared failure_id is owned by more than one row")
    comp_ref_present = (fail_is_list and comp_is_list and all(
        _has(c, "component_id") for c in fail_rows))
    _check(results, S3, "every_failure_mode_pack_failure_component_referenced",
           failures, comp_ref_present,
           fail_is_list and comp_is_list
           and all(_has(c, "component_id")
                   and c.get("component_id") in comp_ids
                   for c in fail_rows),
           "failure modes / gate: every declared failure mode names a component_id that is one of the declared components")
    mode_present = fail_is_list and all(
        _has(c, "failure_mode") for c in fail_rows)
    _check(results, S3, "every_failure_mode_pack_failure_mode_description_declared",
           failures, mode_present,
           fail_is_list
           and all(_nonempty_str(c.get("failure_mode")) for c in fail_rows),
           "failure modes: every declared row declares a non-empty failure-mode description")
    effect_present = fail_is_list and all(
        _has(c, "effect") for c in fail_rows)
    _check(results, S3, "every_failure_mode_pack_failure_effect_declared",
           failures, effect_present,
           fail_is_list
           and all(_nonempty_str(c.get("effect")) for c in fail_rows),
           "failure modes: every declared row declares a non-empty effect of that failure")
    ratings_present = fail_is_list and all(
        _ratings_present(c) for c in fail_rows)
    _check(results, S3, "every_failure_mode_pack_failure_ratings_positive",
           failures, ratings_present,
           fail_is_list and all(_ratings_ok(c) for c in fail_rows),
           "failure modes: every declared row declares severity, occurrence and detection ratings, each a positive number — positivity only; no rating scale is imposed by this atom")
    rpn_present = fail_is_list and all(
        _rpn_present(c) for c in fail_rows)
    _check(results, S3, "every_failure_mode_pack_failure_rpn_recomputes",
           failures, rpn_present,
           fail_is_list and all(_rpn_ok(c) for c in fail_rows),
           "failure modes / gate: every declared row's rpn_declared recomputes exactly as its declared severity x occurrence x detection — declared arithmetic only; no RPN cutoff is imposed")
    coverage_present = (comp_is_list and fail_is_list
                        and all(_has(c, "component_id") for c in comp_rows)
                        and all(_has(c, "component_id") for c in fail_rows))
    _check(results, S3, "every_failure_mode_pack_component_covered_by_failure_mode",
           failures, coverage_present,
           coverage_present and comps_without_failure == [],
           "failure modes: every declared component is covered by at least one declared failure mode — the analysis covers the whole declared design, not part of it")

    S4 = "mitigation_coverage"
    _bool_check(results, S4, "failure_mode_pack_mitigations_considered_before_build",
                manifest, ("mitigation_work", "mitigations_considered_before_build"),
                "mitigations: mitigations for the declared failure modes were considered before the design was built")
    _bool_check(results, S4, "failure_mode_pack_residual_risk_acceptance_stated",
                manifest, ("mitigation_work", "residual_risk_acceptance_stated"),
                "mitigations: how the residual risk remaining after mitigation is accepted or carried is stated")
    _check(results, S4, "failure_mode_pack_mitigations_list_declared",
           mitigations, mit_is_list, mit_is_list and mit_count > 0,
           "mitigations: the declared record names its mitigation rows — the list is present and names at least one mitigation; an absent list is missing evidence and an empty list declares no mitigations at all")
    mit_id_present = mit_is_list and all(
        _has(c, "mitigation_id") for c in mit_rows)
    _check(results, S4, "every_failure_mode_pack_mitigation_id_unique",
           mitigations, mit_id_present,
           mit_is_list and duplicate_mitigation_ids is not None
           and len(duplicate_mitigation_ids) == 0,
           "mitigations: no declared mitigation_id is owned by more than one row")
    desc_present = mit_is_list and all(
        _has(c, "description") for c in mit_rows)
    _check(results, S4, "every_failure_mode_pack_mitigation_description_declared",
           mitigations, desc_present,
           mit_is_list
           and all(_nonempty_str(c.get("description")) for c in mit_rows),
           "mitigations: every declared mitigation declares a non-empty description")
    mit_ref_present = (fail_is_list and mit_is_list and all(
        _has(c, "mitigation_id") for c in fail_rows))
    _check(results, S4, "every_failure_mode_pack_failure_mitigation_referenced",
           failures, mit_ref_present,
           fail_is_list and mit_is_list
           and all(_has(c, "mitigation_id")
                   and c.get("mitigation_id") in mit_ids
                   for c in fail_rows),
           "mitigations / gate: every declared failure mode names a mitigation_id that is one of the declared mitigations")
    residual_present = mit_is_list and all(
        _has(c, "residual_risk_stated") for c in mit_rows)
    _check(results, S4, "every_failure_mode_pack_mitigation_residual_risk_stated",
           mitigations, residual_present,
           mit_is_list
           and all(c.get("residual_risk_stated") is True for c in mit_rows),
           "mitigations: every declared mitigation declares the residual risk remaining after it")

    S5 = "state_reliability_and_queues"
    _bool_check(results, S5, "failure_mode_pack_source_of_truth_identified",
                manifest, ("state_and_reliability", "source_of_truth_identified"),
                "state: exactly where the source of truth lives is identified")
    _bool_check(results, S5, "failure_mode_pack_distributed_state_minimized_declared",
                manifest, ("state_and_reliability", "distributed_state_minimized_declared"),
                "state: distributed state is declared minimised — a single store is preferred over premature distribution")
    _bool_check(results, S5, "failure_mode_pack_idempotency_for_retryable_operations_declared",
                manifest, ("state_and_reliability", "idempotency_for_retryable_operations_declared"),
                "state / reliability: idempotency is declared for anything that can be retried")
    _bool_check(results, S5, "failure_mode_pack_cap_tradeoffs_stated_explicitly",
                manifest, ("state_and_reliability", "cap_tradeoffs_stated_explicitly"),
                "state: CAP trade-offs are stated explicitly rather than strong consistency being assumed for free")
    _bool_check(results, S5, "failure_mode_pack_timeouts_declared",
                manifest, ("state_and_reliability", "timeouts_declared"),
                "reliability: timeouts are declared for partial failure")
    _bool_check(results, S5, "failure_mode_pack_retries_with_jitter_declared",
                manifest, ("state_and_reliability", "retries_with_jitter_declared"),
                "reliability: retries with jitter are declared for partial failure")
    _bool_check(results, S5, "failure_mode_pack_circuit_breakers_declared",
                manifest, ("state_and_reliability", "circuit_breakers_declared"),
                "reliability: circuit breakers are declared for partial failure")
    _bool_check(results, S5, "failure_mode_pack_graceful_degradation_declared",
                manifest, ("state_and_reliability", "graceful_degradation_declared"),
                "reliability: graceful degradation is declared for partial failure")
    _bool_check(results, S5, "failure_mode_pack_readiness_vs_liveness_distinguished",
                manifest, ("state_and_reliability", "readiness_vs_liveness_distinguished"),
                "reliability: health endpoints distinguish readiness from liveness")
    _bool_check(results, S5, "failure_mode_pack_slow_unreliable_work_behind_queue_declared",
                manifest, ("state_and_reliability", "slow_unreliable_work_behind_queue_declared"),
                "queues: slow or unreliable work is declared to sit behind a queue")
    _gated_bool_check(
        results, S5,
        "failure_mode_pack_queue_delivery_semantics_declared_where_queues_used",
        manifest, ("queues", "queues_used"),
        ("queues", "at_least_once_delivery_with_idempotent_consumers_declared"),
        "queues: at-least-once delivery with idempotent consumers is declared for the queues used",
        "no queue use declared")
    _gated_bool_check(
        results, S5,
        "failure_mode_pack_queue_backpressure_declared_where_queues_used",
        manifest, ("queues", "queues_used"),
        ("queues", "queue_backpressure_declared"),
        "queues: backpressure is declared for the queues used",
        "no queue use declared")
    _gated_bool_check(
        results, S5,
        "failure_mode_pack_dead_letter_handling_declared_where_queues_used",
        manifest, ("queues", "queues_used"),
        ("queues", "dead_letter_handling_declared"),
        "queues: dead-letter handling is declared for the queues used",
        "no queue use declared")

    S6 = "observability_scaling_and_security"
    _bool_check(results, S6, "failure_mode_pack_structured_logs_declared",
                manifest, ("observability_scaling_security", "structured_logs_declared"),
                "observability: structured logs are declared from day one")
    _bool_check(results, S6, "failure_mode_pack_metrics_declared",
                manifest, ("observability_scaling_security", "metrics_declared"),
                "observability: metrics are declared from day one")
    _bool_check(results, S6, "failure_mode_pack_traces_declared",
                manifest, ("observability_scaling_security", "traces_declared"),
                "observability: traces are declared from day one")
    _bool_check(results, S6, "failure_mode_pack_bottleneck_identified_before_scaling",
                manifest, ("observability_scaling_security", "bottleneck_identified_before_scaling"),
                "scaling: the bottleneck is identified — scaling targets the bottleneck, not everything")
    _bool_check(results, S6, "failure_mode_pack_measure_before_scaling_declared",
                manifest, ("observability_scaling_security", "measure_before_scaling_declared"),
                "scaling: measurement before scaling is declared")
    _bool_check(results, S6, "failure_mode_pack_stateless_horizontal_scaling_where_scaled_declared",
                manifest, ("observability_scaling_security", "stateless_horizontal_scaling_where_scaled_declared"),
                "scaling: services that scale are declared stateless and scaling horizontally")
    _bool_check(results, S6, "failure_mode_pack_zero_trust_boundaries_declared",
                manifest, ("observability_scaling_security", "zero_trust_boundaries_declared"),
                "security: zero-trust boundaries are declared")
    _bool_check(results, S6, "failure_mode_pack_least_privilege_declared",
                manifest, ("observability_scaling_security", "least_privilege_declared"),
                "security: least privilege is declared")
    _bool_check(results, S6, "failure_mode_pack_secrets_management_declared",
                manifest, ("observability_scaling_security", "secrets_management_declared"),
                "security: real secrets management is declared")
    _bool_check(results, S6, "failure_mode_pack_external_trust_boundary_stated",
                manifest, ("observability_scaling_security", "external_trust_boundary_stated"),
                "security: where the external trust boundary sits is stated — the skill's topology keeps it at the tunnel, not the app")
    _gated_bool_check(
        results, S6,
        "failure_mode_pack_cache_invalidation_stated_where_caching_used",
        manifest, ("caching", "caching_used"),
        ("caching", "cache_invalidation_stated"),
        "scaling: cache invalidation is stated honestly for the caching used — caching is deliberate and its invalidation is named",
        "no caching use declared")

    S7 = "red_lines"
    _false_check(results, S7, "failure_mode_pack_free_of_distributed_monolith",
                 manifest, ("red_lines", "distributed_monolith_present"),
                 "red line: no distributed monolith is present in the record — the anti-pattern the skill refuses")
    _false_check(results, S7, "failure_mode_pack_free_of_shared_mutable_state",
                 manifest, ("red_lines", "shared_mutable_state_present"),
                 "red line: no shared mutable state is present in the record — the anti-pattern the skill refuses")
    _false_check(results, S7, "failure_mode_pack_free_of_retries_without_idempotency_or_backpressure",
                 manifest, ("red_lines", "retries_without_idempotency_or_backpressure_present"),
                 "red line: no retries without idempotency or backpressure are present in the record — the anti-pattern the skill refuses")
    _false_check(results, S7, "failure_mode_pack_free_of_design_without_observability",
                 manifest, ("red_lines", "design_without_observability_present"),
                 "red line: no design without observability is present in the record — the anti-pattern the skill refuses")
    _false_check(results, S7, "failure_mode_pack_free_of_premature_microservices",
                 manifest, ("red_lines", "premature_microservices_present"),
                 "red line: no microservices adopted before the monolith hurts are present in the record — the anti-pattern the skill refuses")
    _false_check(results, S7, "failure_mode_pack_free_of_strong_consistency_assumed_without_tradeoff",
                 manifest, ("red_lines", "strong_consistency_assumed_without_tradeoff_present"),
                 "red line: no strong consistency assumed for free, without its trade-off stated, is present in the record")

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
        verdict = "FAILURE_MODE_PACK_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "FAILURE_MODE_PACK_SOUND"

    computed_names = (
        "failure_mode_pack_components_list_declared",
        "every_failure_mode_pack_component_id_unique",
        "every_failure_mode_pack_component_responsibility_declared",
        "every_failure_mode_pack_component_contract_declared",
        "failure_mode_pack_failure_modes_list_declared",
        "every_failure_mode_pack_failure_id_unique",
        "every_failure_mode_pack_failure_component_referenced",
        "every_failure_mode_pack_failure_mode_description_declared",
        "every_failure_mode_pack_failure_effect_declared",
        "every_failure_mode_pack_failure_ratings_positive",
        "every_failure_mode_pack_failure_rpn_recomputes",
        "every_failure_mode_pack_component_covered_by_failure_mode",
        "failure_mode_pack_mitigations_list_declared",
        "every_failure_mode_pack_mitigation_id_unique",
        "every_failure_mode_pack_mitigation_description_declared",
        "every_failure_mode_pack_failure_mitigation_referenced",
        "every_failure_mode_pack_mitigation_residual_risk_stated",
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
        "service": "system-design-failure-mode-pack",
        "atom_version": "0.1.0",
        "design_name": manifest.get("design_name"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "failure_mode_components_count": comp_count,
        "failure_modes_count": fail_count,
        "failure_mode_mitigations_count": mit_count,
        "duplicate_failure_mode_component_ids": duplicate_component_ids,
        "duplicate_failure_mode_ids": duplicate_failure_ids,
        "duplicate_failure_mode_mitigation_ids": duplicate_mitigation_ids,
        "failure_mode_components_without_responsibility": comps_without_resp,
        "failure_mode_components_without_contract": comps_without_contract,
        "failure_modes_with_unknown_component_reference": fails_unknown_comp,
        "failure_modes_without_description": fails_without_mode,
        "failure_modes_without_effect": fails_without_effect,
        "failure_modes_with_nonpositive_rating": fails_nonpositive,
        "failure_modes_with_rpn_mismatch": fails_rpn_mismatch,
        "failure_mode_components_without_failure_mode": comps_without_failure,
        "failure_mode_mitigations_without_description": mits_without_desc,
        "failure_mode_mitigations_without_residual_risk": mits_without_residual,
        "failure_modes_with_unknown_mitigation_reference": fails_unknown_mit,
        "component_contract_ratio": _fmt6(comp_contract_ratio),
        "component_failure_coverage_ratio": _fmt6(comp_coverage_ratio),
        "rpn_recompute_ratio": _fmt6(rpn_ratio),
        "mitigation_resolution_ratio": _fmt6(mit_resolution_ratio),
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
        "SYSTEM DESIGN FAILURE MODE PACK",
        f"design_name: {verdict.get('design_name')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: system_design_failure_mode_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "FAILURE_MODE_PACK_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
