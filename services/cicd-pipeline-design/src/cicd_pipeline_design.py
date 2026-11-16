#!/usr/bin/env python3
"""CI/CD pipeline design — deterministic core.

Built from the bound skill `ci-cd-pipeline` (v1): "Build CI/CD
that earns its keep — fail-fast stages, caching, gated releases,
artifact provenance, minutes budget aware."

This atom does NOT design a pipeline and exercises no DevOps
judgment. The caller submits a cicd-pipeline-design manifest: one
DECLARED pipeline artifact — its declared stage list with
per-stage minutes and a declared total, its determinism and
pinning record, its caching and secrets record, its minutes
budget record, its provenance record, and its deploy and gate
record. The atom validates that artifact deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- stage sequence (method step 1: "lint -> typecheck -> test ->
  build -> package/sign -> publish. Cheapest first; fail
  fast"): the declared stage names must equal that stated
  sequence, in that order;
- stage minutes (method step 1, arithmetic only): the declared
  total pipeline minutes must equal the sum of the declared
  per-stage minutes;
- monthly minutes (method step 5, "Budget awareness"): the
  declared monthly minutes must equal the declared estimated
  minutes per run multiplied by the declared runs per month,
  and the re-derived monthly minutes must not exceed the
  monthly minutes budget the CALLER itself declares. The skill
  states no budget number, so no budget is imposed — only the
  caller's own declared budget is compared;
- caching and secrets (method steps 3-4, quality gate "No
  secret ever appears in logs or artifacts"): the red-line
  style declarations (secrets or fixtures cached, secrets in
  artifacts, a secret appearing in logs or artifacts) are
  checked as must-be-false, exactly as declared.

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The stated stages the
artifact does not declare are reported as
`stated_stages_not_declared` (null when no stage list is
declared, or when a stage entry carries no usable name). The
computed outcome over the five computed checks is reported as
`computed_status`.

Verdict:
- any fail             -> CICD_PIPELINE_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CICD_PIPELINE_READY

This is a completeness and consistency audit over declared
evidence, not a pipeline review: an artifact that declares
every step passes even if its underlying pipeline is slow or
fragile, and nothing here verifies that a declared value is
true, that the pipeline actually runs, or that its gates catch
real problems.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "stages_and_fail_fast",
    "determinism_and_pinning",
    "caching_and_secrets",
    "budget_awareness",
    "provenance_and_signing",
    "deploys_and_gates",
)

STATED_STAGES = [
    "lint",
    "typecheck",
    "test",
    "build",
    "package_sign",
    "publish",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the stage-name list entries) are validated
# as strings only, never enum-checked: sequence coverage is a
# verdict check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "pipeline": {
        "stages": [{
            "name": "string",
            "minutes": "number",
        }],
        "declared_total_minutes": "number",
        "fails_fast": "boolean",
        "reports_first_real_cause": "boolean",
        "is_primary_green_gate": "boolean",
    },
    "determinism": {
        "lockfile_enforced_installs": "boolean",
        "tool_versions_pinned": "boolean",
        "byte_exact_checkouts_where_hashes_matter": "boolean",
        "same_commit_same_artifact_verified": "boolean",
        "third_party_actions_pinned": "boolean",
        "unpinned_third_party_actions_present": "boolean",
    },
    "caching": {
        "dependency_cache_keyed_on_lockfile": "boolean",
        "build_cache_keyed_on_lockfile": "boolean",
        "secrets_cached": "boolean",
        "test_fixtures_cached": "boolean",
    },
    "secrets": {
        "from_secret_store_only": "boolean",
        "masked_in_logs": "boolean",
        "in_artifacts": "boolean",
        "error_output_scrubbed": "boolean",
        "appeared_in_logs_or_artifacts": "boolean",
    },
    "budget": {
        "estimated_minutes_per_run": "number",
        "runs_per_month": "number",
        "declared_monthly_minutes": "number",
        "monthly_minutes_budget": "number",
        "workflows_minimal_where_constrained": "boolean",
        "heavy_builds_on_owned_hardware": "boolean",
        "duplicates_primary_gate": "boolean",
    },
    "provenance": {
        "checksums_published": "boolean",
        "releases_signed": "boolean",
        "build_outputs_retained": "boolean",
        "manifest_hashes_retained": "boolean",
        "release_artifacts_carry_hash_and_signature": "boolean",
    },
    "deploys": {
        "hitl_approval_required": "boolean",
        "rollback_path_present": "boolean",
        "direct_to_prod_from_laptop": "boolean",
    },
    "gates": {
        "disabled_to_unblock_merge": "boolean",
        "overrides_logged_with_reason": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _stage_checks(results, manifest):
    """Computed stage checks. Returns (stages_evaluated,
    computed_total_minutes, total_minutes_difference,
    stated_stages_not_declared)."""
    stages, has_stages = _get(manifest, "pipeline", "stages")
    declared_total, has_total = _get(
        manifest, "pipeline", "declared_total_minutes")
    if not has_stages or not isinstance(stages, list) or not stages:
        for name, evidence in (
            ("stage_entries_complete",
             "no pipeline stages declared"),
            ("stage_order_matches_stated_sequence",
             "no pipeline stages declared"),
            ("total_minutes_matches_sum_of_stage_minutes",
             "no pipeline stages declared"),
        ):
            _check(results, "stages_and_fail_fast", name,
                   stages, False, False, evidence)
        return 0, None, None, None
    name_incomplete = False
    minutes_incomplete = False
    evaluated = 0
    names = []
    total = 0
    for entry in stages:
        if not isinstance(entry, dict):
            name_incomplete = True
            minutes_incomplete = True
            continue
        name, has_name = _get(entry, "name")
        minutes, has_minutes = _get(entry, "minutes")
        if not (has_name and _is_nonempty_str(name)):
            name_incomplete = True
        else:
            names.append(name)
        if not (has_minutes and _is_number(minutes)):
            minutes_incomplete = True
        else:
            total += minutes
        if (has_name and has_minutes and _is_nonempty_str(name)
                and _is_number(minutes)):
            evaluated += 1
    incomplete = name_incomplete or minutes_incomplete
    if incomplete:
        _check(results, "stages_and_fail_fast",
               "stage_entries_complete",
               stages, False, False,
               "a stage entry is missing its name or minutes")
    else:
        _check(results, "stages_and_fail_fast",
               "stage_entries_complete",
               stages, True, True,
               "every stage entry carries a non-empty name and "
               "numeric minutes")
    if name_incomplete:
        _check(results, "stages_and_fail_fast",
               "stage_order_matches_stated_sequence",
               stages, False, False,
               "a stage entry carries no usable name, so the "
               "declared sequence cannot be compared with the "
               "stated sequence")
        not_declared = None
    else:
        not_declared = [s for s in STATED_STAGES if s not in names]
        _check(results, "stages_and_fail_fast",
               "stage_order_matches_stated_sequence",
               stages, True, names == STATED_STAGES,
               "method step 1: the declared stage names equal the "
               "stated sequence in order — lint, typecheck, test, "
               "build, package/sign, publish (cheapest first)")
    computed_total = None
    difference = None
    if minutes_incomplete or not has_total or not _is_number(declared_total):
        _check(results, "stages_and_fail_fast",
               "total_minutes_matches_sum_of_stage_minutes",
               stages, False, False,
               "the declared total minutes or a stage's minutes "
               "are missing, so the total cannot be re-derived")
    else:
        computed_total = total
        difference = declared_total - total
        _check(results, "stages_and_fail_fast",
               "total_minutes_matches_sum_of_stage_minutes",
               stages, True, _fmt6(difference) == "0.000000",
               "the declared total pipeline minutes equal the sum "
               "of the declared per-stage minutes")
    return evaluated, computed_total, difference, not_declared


def evaluate(manifest):
    """Return the verdict dict for a cicd-pipeline-design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: stages_and_fail_fast (skill method step 1:
    #      "Stages: lint -> typecheck -> test -> build ->
    #      package/sign -> publish. Cheapest first; fail fast";
    #      quality gate: "Pipeline fails fast and reports the
    #      first real cause"; framing: "Pipelines are the primary
    #      green gate") ----
    stages_evaluated, computed_total, total_difference, \
        stages_not_declared = _stage_checks(results, manifest)
    _bool_check(results, "stages_and_fail_fast", "pipeline_fails_fast",
                manifest, ("pipeline", "fails_fast"),
                "quality gate: the pipeline fails fast — the "
                "cheapest stages run first and stop the run on "
                "the first failure")
    _bool_check(results, "stages_and_fail_fast",
                "first_real_cause_reported",
                manifest, ("pipeline", "reports_first_real_cause"),
                "quality gate: the pipeline reports the first "
                "real cause of a failure")
    _bool_check(results, "stages_and_fail_fast",
                "pipeline_is_primary_green_gate",
                manifest, ("pipeline", "is_primary_green_gate"),
                "the pipeline is the primary green gate — humans "
                "approve deploys, the pipeline gates the merge")

    # ---- Section 2: determinism_and_pinning (skill method step
    #      2: "Determinism: lockfile-enforced installs
    #      (frozen-lockfile), pinned tool versions, byte-exact
    #      checkouts where hashes matter"; quality gate: "Same
    #      commit => same artifact (deterministic)"; red line:
    #      "No unpinned third-party actions; pin versions") ----
    _bool_check(results, "determinism_and_pinning",
                "lockfile_enforced_installs",
                manifest, ("determinism", "lockfile_enforced_installs"),
                "method step 2: installs are lockfile-enforced "
                "(frozen-lockfile)")
    _bool_check(results, "determinism_and_pinning",
                "tool_versions_pinned",
                manifest, ("determinism", "tool_versions_pinned"),
                "method step 2: tool versions are pinned")
    _bool_check(results, "determinism_and_pinning",
                "byte_exact_checkouts_where_hashes_matter",
                manifest,
                ("determinism",
                 "byte_exact_checkouts_where_hashes_matter"),
                "method step 2: checkouts are byte-exact where "
                "hashes matter")
    _bool_check(results, "determinism_and_pinning",
                "same_commit_produces_same_artifact",
                manifest,
                ("determinism", "same_commit_same_artifact_verified"),
                "quality gate: the same commit produces the same "
                "artifact — determinism is verified, not assumed")
    _bool_check(results, "determinism_and_pinning",
                "third_party_actions_pinned",
                manifest, ("determinism", "third_party_actions_pinned"),
                "red line: third-party actions are pinned to "
                "versions")
    _false_check(results, "determinism_and_pinning",
                 "no_unpinned_third_party_actions",
                 manifest,
                 ("determinism", "unpinned_third_party_actions_present"),
                 "red line: no unpinned third-party actions are "
                 "present in the pipeline")

    # ---- Section 3: caching_and_secrets (skill method step 3:
    #      "Caching: dependency and build caches keyed on
    #      lockfiles; never cache secrets or test fixtures";
    #      method step 4: "Secrets in CI: from the secret store
    #      only; masked in logs; never in artifacts; scrub error
    #      output"; quality gate: "No secret ever appears in
    #      logs or artifacts") ----
    _bool_check(results, "caching_and_secrets",
                "dependency_cache_keyed_on_lockfile",
                manifest,
                ("caching", "dependency_cache_keyed_on_lockfile"),
                "method step 3: the dependency cache is keyed on "
                "the lockfile")
    _bool_check(results, "caching_and_secrets",
                "build_cache_keyed_on_lockfile",
                manifest, ("caching", "build_cache_keyed_on_lockfile"),
                "method step 3: the build cache is keyed on the "
                "lockfile")
    _false_check(results, "caching_and_secrets", "secrets_not_cached",
                 manifest, ("caching", "secrets_cached"),
                 "method step 3: secrets are never cached")
    _false_check(results, "caching_and_secrets",
                 "test_fixtures_not_cached",
                 manifest, ("caching", "test_fixtures_cached"),
                 "method step 3: test fixtures are never cached")
    _bool_check(results, "caching_and_secrets",
                "secrets_from_secret_store_only",
                manifest, ("secrets", "from_secret_store_only"),
                "method step 4: secrets come from the secret "
                "store only")
    _bool_check(results, "caching_and_secrets", "secrets_masked_in_logs",
                manifest, ("secrets", "masked_in_logs"),
                "method step 4: secrets are masked in logs")
    _false_check(results, "caching_and_secrets",
                 "secrets_never_in_artifacts",
                 manifest, ("secrets", "in_artifacts"),
                 "method step 4: secrets never appear in artifacts")
    _bool_check(results, "caching_and_secrets",
                "error_output_scrubbed",
                manifest, ("secrets", "error_output_scrubbed"),
                "method step 4: error output is scrubbed of secrets")
    _false_check(results, "caching_and_secrets",
                 "no_secret_appeared_in_logs_or_artifacts",
                 manifest, ("secrets", "appeared_in_logs_or_artifacts"),
                 "quality gate: no secret ever appears in logs "
                 "or artifacts")

    # ---- Section 4: budget_awareness (skill method step 5:
    #      "Budget awareness: keep workflows minimal where
    #      minutes are constrained; heavy builds run on owned
    #      hardware; don't add pipelines that duplicate the
    #      primary gate") ----
    per_run, has_per_run = _get(manifest, "budget",
                                "estimated_minutes_per_run")
    runs, has_runs = _get(manifest, "budget", "runs_per_month")
    declared_monthly, has_declared_monthly = _get(
        manifest, "budget", "declared_monthly_minutes")
    budget_cap, has_budget_cap = _get(
        manifest, "budget", "monthly_minutes_budget")
    monthly_all_numbers = (
        has_per_run and has_runs and has_declared_monthly
        and _is_number(per_run) and _is_number(runs)
        and _is_number(declared_monthly)
    )
    computed_monthly = (
        per_run * runs
        if has_per_run and has_runs and _is_number(per_run)
        and _is_number(runs)
        else None
    )
    monthly_difference = (
        declared_monthly - computed_monthly
        if computed_monthly is not None and has_declared_monthly
        and _is_number(declared_monthly)
        else None
    )
    monthly_consistent = (
        monthly_all_numbers
        and _fmt6(declared_monthly - per_run * runs) == "0.000000"
    )
    _check(results, "budget_awareness",
           "monthly_minutes_matches_per_run_times_runs",
           declared_monthly, monthly_all_numbers, monthly_consistent,
           "method step 5: the declared monthly minutes equal "
           "the declared estimated minutes per run multiplied "
           "by the declared runs per month")
    budget_present = (
        computed_monthly is not None and has_budget_cap
        and _is_number(budget_cap)
    )
    headroom = (
        budget_cap - computed_monthly
        if budget_present else None
    )
    _check(results, "budget_awareness",
           "monthly_minutes_within_declared_budget",
           budget_cap, budget_present,
           budget_present and computed_monthly <= budget_cap,
           "method step 5: the re-derived monthly minutes do "
           "not exceed the monthly minutes budget the caller "
           "itself declares (the skill states no budget number, "
           "so none is imposed here)")
    _bool_check(results, "budget_awareness",
                "workflows_minimal_where_minutes_constrained",
                manifest,
                ("budget", "workflows_minimal_where_constrained"),
                "method step 5: workflows are kept minimal where "
                "minutes are constrained")
    _bool_check(results, "budget_awareness",
                "heavy_builds_on_owned_hardware",
                manifest, ("budget", "heavy_builds_on_owned_hardware"),
                "method step 5: heavy builds run on owned hardware")
    _false_check(results, "budget_awareness",
                 "pipeline_does_not_duplicate_primary_gate",
                 manifest, ("budget", "duplicates_primary_gate"),
                 "method step 5: the pipeline does not duplicate "
                 "the primary gate")

    # ---- Section 5: provenance_and_signing (skill method step
    #      6: "Provenance: publish artifacts with checksums; sign
    #      releases (secure-build-pattern); keep build outputs
    #      plus manifest hashes"; quality gate: "Release
    #      artifacts carry hash + signature") ----
    _bool_check(results, "provenance_and_signing",
                "artifact_checksums_published",
                manifest, ("provenance", "checksums_published"),
                "method step 6: artifacts are published with "
                "checksums")
    _bool_check(results, "provenance_and_signing", "releases_signed",
                manifest, ("provenance", "releases_signed"),
                "method step 6: releases are signed")
    _bool_check(results, "provenance_and_signing",
                "build_outputs_retained",
                manifest, ("provenance", "build_outputs_retained"),
                "method step 6: build outputs are kept")
    _bool_check(results, "provenance_and_signing",
                "manifest_hashes_retained",
                manifest, ("provenance", "manifest_hashes_retained"),
                "method step 6: manifest hashes are kept alongside "
                "the build outputs")
    _bool_check(results, "provenance_and_signing",
                "release_artifacts_carry_hash_and_signature",
                manifest,
                ("provenance",
                 "release_artifacts_carry_hash_and_signature"),
                "quality gate: release artifacts carry hash + "
                "signature")

    # ---- Section 6: deploys_and_gates (skill method step 7:
    #      "Deploys: HITL approval; always a rollback path; never
    #      direct-to-prod from a laptop"; framing: "humans
    #      approve deploys"; red line: "No disabling gates to
    #      unblock a merge (fix it, or consciously override and
    #      log why)") ----
    _bool_check(results, "deploys_and_gates",
                "hitl_approval_for_deploys",
                manifest, ("deploys", "hitl_approval_required"),
                "method step 7: deploys require HITL approval — "
                "humans approve deploys")
    _bool_check(results, "deploys_and_gates", "rollback_path_present",
                manifest, ("deploys", "rollback_path_present"),
                "method step 7: a rollback path always exists")
    _false_check(results, "deploys_and_gates",
                 "never_direct_to_prod_from_laptop",
                 manifest, ("deploys", "direct_to_prod_from_laptop"),
                 "method step 7: never direct-to-prod from a laptop")
    _false_check(results, "deploys_and_gates",
                 "gates_not_disabled_to_unblock_merge",
                 manifest, ("gates", "disabled_to_unblock_merge"),
                 "red line: gates are not disabled to unblock a "
                 "merge")
    _bool_check(results, "deploys_and_gates",
                "gate_overrides_logged_with_reason",
                manifest, ("gates", "overrides_logged_with_reason"),
                "red line: a conscious gate override is logged "
                "with its reason")

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
        verdict = "CICD_PIPELINE_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CICD_PIPELINE_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "stage_entries_complete",
            "stage_order_matches_stated_sequence",
            "total_minutes_matches_sum_of_stage_minutes",
            "monthly_minutes_matches_per_run_times_runs",
            "monthly_minutes_within_declared_budget")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "cicd-pipeline-design",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "stages_evaluated": stages_evaluated,
        "computed_total_minutes": _fmt6(computed_total),
        "total_minutes_difference": _fmt6(total_difference),
        "stated_stages_not_declared": stages_not_declared,
        "computed_monthly_minutes": _fmt6(computed_monthly),
        "monthly_minutes_difference": _fmt6(monthly_difference),
        "budget_headroom_minutes": _fmt6(headroom),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "CI/CD PIPELINE DESIGN",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: cicd_pipeline_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CICD_PIPELINE_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
