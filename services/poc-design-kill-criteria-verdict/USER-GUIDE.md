# Poc design kill criteria verdict — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a proof of concept before you run it — the question it exists to answer, the success and kill criteria, the timebox and the scope, all defined upfront — and you have a record of that design. This atom reads one declared manifest and returns one deterministic verdict across five sections (design_premise, criteria_row_consistency, timebox_window, scope_row_consistency, production_boundary_by_design): **POC_DESIGN_SOUND**, **POC_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 22 checks. It audits the declared design record's completeness and consistency only — it designs no POC itself, runs no POC, writes no code, collects no evidence, and does not verify that a declared criterion, window, or scope item was ever honoured. A design is sound *on your declared evidence*: it never judges whether the idea is worth pursuing, whether the hypothesis is true, whether the named success bars or kill triggers are the right ones, or whether the POC will work. The computed checks: the declared `criteria` list must be present and non-empty; every criterion row's `kind` must be one of the two kinds the skill names (`success` or `kill`); at least one row of each kind must be present; every row must state its condition and declare itself declared before the run; no criterion name may be duplicated; when the design declares it evaluates a vendor or tool, at least one criterion row must assess house-stack fit; the declared timebox `start_date` and `end_date` must both be real calendar dates in strict ISO `YYYY-MM-DD` form and the end must fall after the start; the declared `scope_items` list must be present and non-empty; every scope item must be declared on the critical path; and no scope name may be duplicated. No numeric threshold is imposed — no maximum timebox length in days or a rule that the window must be "days, not weeks" enforced as a day count (the declared duration is reported, never capped), no budget or cost bar for the POC, no number of success or kill criteria a design must contain beyond at least one of each kind and the declared lists being non-empty, no minimum number of scope items, no coverage percentage below completeness, and no required wording, length, or numeric form for a criterion's stated condition (only that a condition is declared stated is checked). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "poc-design-kill-criteria-verdict"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/poc-design-kill-criteria-verdict` — tool name `poc_design_kill_criteria_verdict`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/poc-design-kill-criteria-verdict` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `poc` | POC name (string; carried into the output, not checked) |
| `design.uncertainty_to_reduce_named` | design premise evidence: the uncertainty the POC exists to reduce is named in the design |
| `design.answer_changes_plan_declared` | design premise evidence: the design declares that the answer changes the plan |
| `design.uncertainty_reduction_purpose_declared` | design premise evidence: the stated purpose is reducing uncertainty, not shipping |
| `design.design_record_completed_before_run` | design premise evidence: this design record is completed before the run |
| `design.evaluates_vendor_or_tool` | the applicability gate for the house-stack-fit check: whether the POC evaluates a vendor or tool is declared (either value passes this check; the gated check below applies only when it is `true`) |
| `criteria` (list of criterion-row objects) | computed: must be present and non-empty; reported as `criteria_count` |
| `criteria[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `criteria[].kind` (string) | computed: must be one of `success` or `kill` per row; at least one row of each kind must be present |
| `criteria[].condition_stated` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `criteria_without_condition` |
| `criteria[].declared_before_run` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `criteria_not_declared_before_run` |
| `criteria[].assesses_house_stack_fit` | gated computed: read only when `design.evaluates_vendor_or_tool` is `true`; then at least one row must declare `true` |
| `timebox.window_set_before_run` | timebox evidence: the window is set before the run |
| `timebox.start_date` (string) | computed: strict ISO `YYYY-MM-DD`, must be a real calendar date; reported as `timebox_start_date` |
| `timebox.end_date` (string) | computed: strict ISO `YYYY-MM-DD`, must be a real calendar date and fall after the start date; reported as `timebox_end_date` |
| `scope_items` (list of scope-row objects) | computed: must be present and non-empty; reported as `scope_items_count` |
| `scope_items[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `scope_items[].on_critical_path` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `scope_items_off_critical_path` |
| `red_lines.poc_code_planned_for_direct_production_use_present` | must be `false` to pass (red line by design: no POC code planned for direct production use) |
| `red_lines.open_ended_design_present` | must be `false` to pass (red line by design: no open-ended design) |
| `red_lines.poc_success_planned_as_production_readiness_present` | must be `false` to pass (red line by design: POC success is not planned as production readiness) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward POC_DESIGN_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/poc-design-kill-criteria-verdict`:

```json
{
  "poc": "Test POC",
  "design": {
    "uncertainty_to_reduce_named": true,
    "answer_changes_plan_declared": true,
    "uncertainty_reduction_purpose_declared": true,
    "design_record_completed_before_run": true,
    "evaluates_vendor_or_tool": true
  },
  "criteria": [
    {
      "name": "C1",
      "kind": "success",
      "condition_stated": true,
      "declared_before_run": true,
      "assesses_house_stack_fit": true
    },
    {
      "name": "C2",
      "kind": "kill",
      "condition_stated": true,
      "declared_before_run": true,
      "assesses_house_stack_fit": false
    }
  ],
  "timebox": {
    "window_set_before_run": true,
    "start_date": "2023-01-01",
    "end_date": "2023-01-10"
  },
  "scope_items": [
    {
      "name": "S1",
      "on_critical_path": true
    }
  ],
  "red_lines": {
    "poc_code_planned_for_direct_production_use_present": false,
    "open_ended_design_present": false,
    "poc_success_planned_as_production_readiness_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 22 checks and a text stamp of the verdict):

```json
{
  "service": "poc-design-kill-criteria-verdict",
  "atom_version": "0.1.0",
  "poc": "Test POC",
  "verdict": "POC_DESIGN_SOUND",
  "sections": {
    "design_premise": "pass",
    "criteria_row_consistency": "pass",
    "timebox_window": "pass",
    "scope_row_consistency": "pass",
    "production_boundary_by_design": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "criteria_count": 2,
  "success_criteria_count": 1,
  "kill_criteria_count": 1,
  "criteria_without_condition": [],
  "condition_stated_coverage": "1.000000",
  "criteria_not_declared_before_run": [],
  "declared_before_run_coverage": "1.000000",
  "criteria_with_invalid_kind": [],
  "duplicate_criterion_names": [],
  "timebox_start_date": "2023-01-01",
  "timebox_end_date": "2023-01-10",
  "timebox_duration_days": 9,
  "scope_items_count": 1,
  "scope_items_off_critical_path": [],
  "critical_path_coverage": "1.000000",
  "duplicate_scope_item_names": [],
  "summary": "22 pass, 0 fail, 0 missing of 22 checks across five sections."
}
```

## Verdicts

- **POC_DESIGN_SOUND** — every check passes; the declared POC design record is complete and consistent with the skill's checklist and red lines.
- **POC_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `criteria_count`, `success_criteria_count` and `kill_criteria_count` (the declared list length and per-kind row counts as integers, or null when the list is not declared), the row-name lists `criteria_without_condition`, `criteria_not_declared_before_run` and `criteria_with_invalid_kind` and the name list `duplicate_criterion_names` (null when the `criteria` list is not declared; a criterion with the relevant field absent is missing evidence and does not appear in the first three lists), the declared window as `timebox_start_date` / `timebox_end_date` (the declared strings, or null when absent) and `timebox_duration_days` (end minus start in whole days — negative when the window is inverted — or null when either date is absent or not a real date), `scope_items_count`, `scope_items_off_critical_path` and `duplicate_scope_item_names`, the coverage values `condition_stated_coverage`, `declared_before_run_coverage` and `critical_path_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the thirteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
