# Poc design kill criteria verdict — documentation

**Poc design kill criteria verdict** · slug `poc-design-kill-criteria-verdict` · deliverable type VERDICT · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/poc-design-kill-criteria-verdict/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment c64bdc48fce84cd4817fe3a293be6ae5). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `poc` "Test POC"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "poc-design-kill-criteria-verdict"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the POC design manifest.** You declare a record of a proof-of-concept design, made before the run — the atom audits the declared record, it does not design or run the POC (see Explanation). The recorded full-pass manifest declares the POC `Test POC`: the uncertainty to reduce named, the answer declared to change the plan, the purpose declared to be reducing uncertainty, and the design record completed before the run; it declares that the POC evaluates a vendor or tool; two criterion rows — `C1` (`success`, condition stated, declared before the run, assessing house-stack fit) and `C2` (`kill`, condition stated, declared before the run, not assessing house-stack fit); a timebox window set before the run, from `2023-01-01` to `2023-01-10`; one scope item, `S1`, on the critical path; and all three red-line flags `false` (no POC code planned for direct production use, no open-ended design, no POC success planned as production readiness).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/poc-design-kill-criteria-verdict` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `POC_DESIGN_SOUND`: "22 pass, 0 fail, 0 missing of 22 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `criteria_count` is 2 (`success_criteria_count` 1, `kill_criteria_count` 1), `timebox_duration_days` is 9, `scope_items_count` is 1, and `condition_stated_coverage`, `declared_before_run_coverage` and `critical_path_coverage` are each `"1.000000"`, with all five row-name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `POC_DESIGN_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "poc-design-kill-criteria-verdict"}`.
3. Call: `POST https://atoms.pipavia.com/v1/poc-design-kill-criteria-verdict` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/poc-design-kill-criteria-verdict` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `poc_design_kill_criteria_verdict`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `POC_DESIGN_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row or the declared window breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 7 checks fail: `at_least_one_kill_criterion_declared`, `every_criterion_condition_stated`, `every_criterion_kind_is_success_or_kill`, `every_scope_item_on_critical_path`, `no_criterion_name_duplicated`, `no_poc_code_planned_for_direct_production_use`, `timebox_end_after_start`, and the summary reads "15 pass, 7 fail, 0 missing of 22 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value, the offending row, or the window in your manifest — the computed outputs name the offending rows (in the recorded violations run, `criteria_without_condition` names `C1` — the first row declares `condition_stated: false` — and `condition_stated_coverage` is `"0.500000"`; `criteria_with_invalid_kind` names `C1` and `duplicate_criterion_names` names `C1` — the second row declares `kind: "other"` and is also named `C1`, so `kill_criteria_count` is 0; `timebox_end_date` equals `timebox_start_date` (`2023-01-01`), so `timebox_duration_days` is 0 and the end does not fall after the start; `scope_items_off_critical_path` names `S1` — that row declares `on_critical_path: false` — and `critical_path_coverage` is `"0.000000"`; and `red_lines.poc_code_planned_for_direct_production_use_present` is declared `true`, failing `no_poc_code_planned_for_direct_production_use`; sections `criteria_row_consistency`, `timebox_window`, `scope_row_consistency` and `production_boundary_by_design` report `fail`, `design_premise` reports `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "design",
  "detail": "design must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/poc-design-kill-criteria-verdict` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/poc-design-kill-criteria-verdict` — tool name `poc_design_kill_criteria_verdict`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `poc_design_kill_criteria_verdict` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `poc`, `criteria[].name`, `criteria[].kind`, `timebox.start_date`, `timebox.end_date` and `scope_items[].name` are noted as strings there and `criteria` and `scope_items` as lists there. Where SERVICE.md states no type — the section container objects (`design`, `timebox`, `red_lines`) and the `criteria[]` / `scope_items[]` row objects — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types `design`, `timebox` and `red_lines` as `object` and `criteria` and `scope_items` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `POC_DESIGN_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `poc` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: design_premise

| Field | Type | Notes |
|---|---|---|
| `design` | object | The design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `design.uncertainty_to_reduce_named` | boolean | — |
| `design.answer_changes_plan_declared` | boolean | — |
| `design.uncertainty_reduction_purpose_declared` | boolean | — |
| `design.design_record_completed_before_run` | boolean | — |

#### Read by: criteria_row_consistency

| Field | Type | Notes |
|---|---|---|
| `design.evaluates_vendor_or_tool` | boolean | The applicability gate for the house-stack-fit check (type stated in SERVICE.md, which reads this field by this section) |
| `criteria` | list | list of criterion-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `criteria[]` | object | One declared criterion row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `criteria[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `criteria[].kind` | string | Must be one of `success`, `kill` — the two kinds the skill names (type and set stated in SERVICE.md) |
| `criteria[].condition_stated` | boolean | — |
| `criteria[].declared_before_run` | boolean | — |
| `criteria[].assesses_house_stack_fit` | boolean | Gated — read only when `design.evaluates_vendor_or_tool` is `true` |

#### Read by: timebox_window

| Field | Type | Notes |
|---|---|---|
| `timebox` | object | The timebox section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `timebox.window_set_before_run` | boolean | — |
| `timebox.start_date` | string | Strict ISO `YYYY-MM-DD`, must be a real calendar date; computed, see below (type stated in SERVICE.md) |
| `timebox.end_date` | string | Strict ISO `YYYY-MM-DD`, must be a real calendar date; computed, see below (type stated in SERVICE.md) |

#### Read by: scope_row_consistency

| Field | Type | Notes |
|---|---|---|
| `scope_items` | list | list of scope-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `scope_items[]` | object | One declared scope row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `scope_items[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `scope_items[].on_critical_path` | boolean | — |

#### Read by: production_boundary_by_design

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.poc_code_planned_for_direct_production_use_present` | boolean | must be `false` to pass — skill red line, by design |
| `red_lines.open_ended_design_present` | boolean | must be `false` to pass — skill red line, by design |
| `red_lines.poc_success_planned_as_production_readiness_present` | boolean | must be `false` to pass — skill red line, by design |

### Checks

All 22 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: design_premise

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uncertainty_to_reduce_named` | design premise: the uncertainty the POC exists to reduce is named in the design | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `answer_changes_plan_declared` | design premise: the design declares that the answer changes the plan — the question is worth asking before building | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uncertainty_reduction_purpose_declared` | design premise: the stated purpose is reducing uncertainty, not shipping | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `design_record_completed_before_run` | design premise: this design record is completed before the run — the question, criteria and timebox are defined before writing code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: criteria_row_consistency

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_applicability_declared` | criteria rows: whether the POC evaluates a vendor or tool is declared — the house-stack-fit check applies only when it does | Pass: `design.evaluates_vendor_or_tool` is present, either value. Missing: the field is absent. |
| `criteria_declared` | the declared design names its criteria — the criteria list is present and non-empty | Computed over the declared record. Pass: the `criteria` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_criterion_kind_is_success_or_kill` | criteria rows: every declared criterion row is one of the two kinds the skill names — success or kill | Computed over the declared record. Pass: every declared criterion row declares `kind` as `success` or `kill`. Fail: a row declares `kind` present but neither (offending rows are named in `criteria_with_invalid_kind`). Missing: the list is absent, or a row has `kind` absent (such a row is missing evidence and does not appear in `criteria_with_invalid_kind`). |
| `at_least_one_success_criterion_declared` | criteria rows: at least one declared row is a success criterion — success AND kill criteria | Computed over the declared record. Pass: at least one declared row is a success criterion. Fail: the declared rows contain no success criterion. Missing: the list is absent. |
| `at_least_one_kill_criterion_declared` | criteria rows: at least one declared row is a kill criterion — success AND kill criteria | Computed over the declared record. Pass: at least one declared row is a kill criterion. Fail: the declared rows contain no kill criterion. Missing: the list is absent. |
| `every_criterion_condition_stated` | criteria rows: every declared criterion row states the condition that satisfies it — the success bar or kill trigger is written, not implied | Computed over the declared record. Pass: every declared criterion row declares `condition_stated: true`. Fail: a row declares `condition_stated` present but not `true` (offending rows are named in `criteria_without_condition`). Missing: the list is absent, or a row has `condition_stated` absent (such a row is missing evidence and does not appear in `criteria_without_condition`). |
| `every_criterion_declared_before_run` | criteria rows: every declared criterion row is itself declared before the run — no criterion is added after the fact | Computed over the declared record. Pass: every declared criterion row declares `declared_before_run: true`. Fail: a row declares `declared_before_run` present but not `true` (offending rows are named in `criteria_not_declared_before_run`). Missing: the list is absent, or a row has `declared_before_run` absent (such a row is missing evidence and does not appear in `criteria_not_declared_before_run`). |
| `no_criterion_name_duplicated` | criteria rows: no declared criterion name is owned by more than one criterion row | Computed over the declared record. Pass: no declared `name` string appears on more than one criterion row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_criterion_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |
| `house_stack_fit_criterion_when_evaluating_vendor` | criteria rows: when the POC evaluates a vendor or tool, at least one criterion row assesses fit against the house stack | Gated computed check. Missing: the gate (`design.evaluates_vendor_or_tool`) or the `criteria` list is absent. Pass as not applicable: the gate is declared `false`, whatever the rows declare. Pass (gate `true`): at least one criterion row declares `assesses_house_stack_fit: true`. Fail: the gate is declared `true` and no criterion row declares `assesses_house_stack_fit: true`. |

#### Section: timebox_window

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `timebox_window_set_before_run` | timebox window: the window is set before the run — the timebox is defined upfront, not discovered during the run | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `timebox_window_dates_valid` | timebox window: the declared start and end dates are real calendar dates in strict ISO form | Computed over the declared record. Pass: both declared dates are real calendar dates in strict ISO `YYYY-MM-DD` form. Fail: a declared date is not a real calendar date or not in strict ISO form (an impossible date such as `2027-02-30` fails). Missing: either date is absent. |
| `timebox_end_after_start` | timebox window: the declared end date falls after the declared start date — the window has a positive length; its length itself is not judged | Computed over the declared record. Pass: the declared end date falls after the declared start date. Fail: the declared end date does not fall after the declared start date. Missing: a date the check reads is absent. |

#### Section: scope_row_consistency

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `scope_items_declared` | the declared design names its scope — the scope items list is present and non-empty | Computed over the declared record. Pass: the `scope_items` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_scope_item_on_critical_path` | scope rows: every declared scope item is on the critical path — scope is the critical path, nothing more | Computed over the declared record. Pass: every declared scope row declares `on_critical_path: true`. Fail: a row declares `on_critical_path` present but not `true` (offending rows are named in `scope_items_off_critical_path`). Missing: the list is absent, or a row has `on_critical_path` absent (such a row is missing evidence and does not appear in `scope_items_off_critical_path`). |
| `no_scope_item_name_duplicated` | scope rows: no declared scope name is owned by more than one scope item | Computed over the declared record. Pass: no declared `name` string appears on more than one scope row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_scope_item_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: production_boundary_by_design

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_poc_code_planned_for_direct_production_use` | red line by design: the design does not plan for POC code to be used directly in production — no POC-to-production gradient is designed in | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_open_ended_design` | red line by design: the design is not open-ended — no unbounded POC is designed in | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_poc_success_planned_as_production_readiness` | red line by design: the design does not plan to treat POC success as production readiness — 'it worked in the POC' is never production evidence | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"poc-design-kill-criteria-verdict"`), `atom_version` (`"0.1.0"`), and `poc` (the manifest's declared poc value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `criteria_count` (the declared list length as an integer, or null when the list is not declared), `success_criteria_count` and `kill_criteria_count` (per-kind row counts as integers, or null when the list is not declared); the row-name lists `criteria_without_condition` (criteria whose `condition_stated` field is present but not `true`; a criterion with the field absent is missing evidence and does not appear), `criteria_not_declared_before_run` (criteria whose `declared_before_run` field is present but not `true`), `criteria_with_invalid_kind` (criteria whose `kind` is present but neither `success` nor `kill`) and `duplicate_criterion_names` (criterion names declared on more than one row, in the order their second occurrence appears) — all four lists are null when the `criteria` list is not declared, as recorded in the sparse case; the declared window as `timebox_start_date` / `timebox_end_date` (the declared strings, or null when absent) and `timebox_duration_days` (end minus start in whole days — negative when the window is inverted — or null when either date is absent or not a real date); `scope_items_count` (the declared list length as an integer, or null when the list is not declared, as recorded in the sparse case), `scope_items_off_critical_path` (scope items whose `on_critical_path` field is present but not `true`) and `duplicate_scope_item_names` (scope names declared on more than one row) — both scope lists are null when the `scope_items` list is not declared, as recorded in the sparse case; and the ratios `condition_stated_coverage` (criteria stating a condition ÷ declared criteria), `declared_before_run_coverage` (criteria declared before the run ÷ declared criteria) and `critical_path_coverage` (scope items on the critical path ÷ declared scope items) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "22 pass, 0 fail, 0 missing of 22 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared poc value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `POC_DESIGN_SOUND` — all 22 checks pass: the declared POC design record is complete and consistent with the bound skill's checklist and red lines.
- `POC_DESIGN_NOT_SOUND` — at least one check fails: a declared value, row, or window contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the thirteen primary computed checks cannot be completed because the rows, gate, or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `computed_status`, `criteria_count`, `success_criteria_count`, `kill_criteria_count`, `criteria_without_condition`, `condition_stated_coverage`, `criteria_not_declared_before_run`, `declared_before_run_coverage`, `criteria_with_invalid_kind`, `duplicate_criterion_names`, `timebox_start_date`, `timebox_end_date`, `timebox_duration_days`, `scope_items_count`, `scope_items_off_critical_path`, `critical_path_coverage` and `duplicate_scope_item_names` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"design","detail":"design must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type VERDICT — this atom sells the verdict it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Validate ideas with proof-of-concept work — hypothesis, success/kill criteria, timebox, evidence, decision (the bound capability, from the skill). You submit one declared record — the POC design manifest, made before the run — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`design_premise`, `criteria_row_consistency`, `timebox_window`, `scope_row_consistency`, `production_boundary_by_design`). The atom sells that verdict — a bounded judgment artifact — never the underlying knowledge itself. It sits one stage earlier than its nearest sibling `buyer-test-card`, which audits a completed POC record: this atom checks design intent and row / window consistency declared before the run, and shares zero checks with that sibling.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows and window themselves — the declared `criteria` list must be present and non-empty, every criterion row's `kind` must be one of the two kinds the skill names (`success`, `kill`), at least one row of each kind must be present, every row must state its condition and declare itself declared before the run, and no criterion name may be duplicated; the declared timebox `start_date` and `end_date` must both be real calendar dates in strict ISO `YYYY-MM-DD` form and the end must fall after the start; the declared `scope_items` list must be present and non-empty, every scope item must be declared on the critical path, and no scope name may be duplicated — using only the declared record, with no outside threshold imported. One computed check is *gated*: `house_stack_fit_criterion_when_evaluating_vendor` applies only when `design.evaluates_vendor_or_tool` is declared `true`, passes as not applicable when the gate is declared `false`, and is `missing` when the gate or the criteria list is absent. Aggregation is strict: any `fail` anywhere produces `POC_DESIGN_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `POC_DESIGN_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a maximum timebox length in days or a rule that the window must be "days, not weeks" enforced as a day count (the skill says the timebox is a hard limit in days, not weeks — it states no number, so the declared duration is reported, never capped); a budget or cost bar for the POC; a number of success or kill criteria a design must contain beyond at least one of each kind and the declared lists being non-empty; a minimum number of scope items; a coverage percentage below completeness; any required wording, length, or numeric form for a criterion's stated condition (only that a condition is declared stated is checked — its content is the caller's). Quantities are computed and reported; the only bars on the computed rows are completeness over the caller's own declared rows, both criterion kinds being present, and the window's internal ordering.

**What it does NOT do.** The atom audits a **declared** POC design record: a verdict of `POC_DESIGN_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its criteria rows complete, its window ordered, and no production gradient planned passes those checks even if the real POC was never run that way. It is a completeness and consistency audit of the design record the skill requires, **not POC execution, an idea review, or regulated professional advice of any kind (engineering, financial, medical, or legal)**. Specifically: it designs no POC itself, runs no POC, writes no code, collects no evidence, and does not verify that a declared criterion, window, or scope item was ever honoured. It never judges whether the idea is worth pursuing, whether the hypothesis is true, whether the named success bars or kill triggers are the right ones, or whether the POC will work — only that the design record contains what the skill's method, quality gates, and red lines demand at design time, and that its declared rows and window are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no judgment of design *quality* — whether the uncertainty is the right one, the criteria are well chosen, or the window is realistic is the caller's declaration, checked only for declared presence and consistency; the skill's post-run steps (evidence actually gathered, the findings memo, the adopt / adapt / abandon decision and its logging, routing an adoption through the full team process) are the completed record's ground — `buyer-test-card`'s — and are deliberately not re-checked here; whether a criterion's stated condition is measurable in practice is a caller declaration — only its declared statedness is checked.

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this verdict on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Spike-then-commit product architecture decisions (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared POC design record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not POC execution, an idea review, or regulated professional advice of any kind (engineering, financial, medical, or legal), and that it designs and runs no POC and verifies no declared fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `poc_design_kill_criteria_verdict` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/poc_design_kill_criteria_verdict.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_poc_design_kill_criteria_verdict.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/poc-design-kill-criteria-verdict` (REST) and `POST /mcp/poc-design-kill-criteria-verdict` (MCP, tool `poc_design_kill_criteria_verdict`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment c64bdc48fce84cd4817fe3a293be6ae5). Key scope: `poc_design_kill_criteria_verdict`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and several others, and the computed checks read rows or a window rather than any single field. Recorded check names used verbatim in the Checks section include `no_poc_code_planned_for_direct_production_use` (input `red_lines.poc_code_planned_for_direct_production_use_present`), `no_open_ended_design` (input `red_lines.open_ended_design_present`), `no_poc_success_planned_as_production_readiness` (input `red_lines.poc_success_planned_as_production_readiness_present`), `vendor_evaluation_applicability_declared` (input `design.evaluates_vendor_or_tool`), `timebox_window_set_before_run` (input `timebox.window_set_before_run`) and `timebox_window_dates_valid` (computed from inputs `timebox.start_date` and `timebox.end_date`), plus the computed checks `criteria_declared`, `every_criterion_kind_is_success_or_kill`, `at_least_one_success_criterion_declared`, `at_least_one_kill_criterion_declared`, `every_criterion_condition_stated`, `every_criterion_declared_before_run`, `no_criterion_name_duplicated`, `house_stack_fit_criterion_when_evaluating_vendor`, `timebox_end_after_start`, `scope_items_declared`, `every_scope_item_on_critical_path` and `no_scope_item_name_duplicated`, which read the `criteria` rows, the declared window, or the `scope_items` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 22 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Types unstated in SERVICE.md:** SERVICE.md states no type for the container objects (`design`, `timebox`, `red_lines`) or for a `criteria[]` / `scope_items[]` row object. The Input reference grounds those types in the recorded evidence inputs and, for the top-level containers, in the recorded MCP `inputSchema`, and says so in each row's Notes.
5. **Section grouping vs input objects:** the recorded section `criteria_row_consistency` reads both the `criteria` rows and a field inside a different input object — `design.evaluates_vendor_or_tool`, the gate for the house-stack-fit check — while the other four fields of the `design` object are read by `design_premise`. This document groups the Input reference and the Checks by the recorded section names, so the `design` object is split across two section groupings.
6. **Null lists and scope count on undeclared lists:** SERVICE.md's output paragraph states the null rules for `computed_status`, the criteria counts (`criteria_count`, `success_criteria_count`, `kill_criteria_count`), `timebox_start_date` / `timebox_end_date`, `timebox_duration_days` and the coverage ratios, but does not state a null rule for the row-name lists (`criteria_without_condition`, `criteria_not_declared_before_run`, `criteria_with_invalid_kind`, `duplicate_criterion_names`, `scope_items_off_critical_path`, `duplicate_scope_item_names`) or for `scope_items_count`. The recorded sparse response returns all of those as `null` when their list is not declared (as USER-GUIDE.md also states for the criteria lists); this document follows the recording.
7. **The thirteen primary computed checks are not enumerated as one list in SERVICE.md:** SERVICE.md gives the count (thirteen) for the `computed_status` null rule, but the checks themselves are described across two prose blocks — the gated house-stack-fit check in its own paragraph above the computed-checks list, and "both kinds present" as one bullet that is two recorded checks (`at_least_one_success_criterion_declared` and `at_least_one_kill_criterion_declared`). This document's count of thirteen follows the recording combined with that prose — the thirteen are `criteria_declared`, `every_criterion_kind_is_success_or_kill`, `at_least_one_success_criterion_declared`, `at_least_one_kill_criterion_declared`, `every_criterion_condition_stated`, `every_criterion_declared_before_run`, `no_criterion_name_duplicated`, `house_stack_fit_criterion_when_evaluating_vendor`, `timebox_window_dates_valid`, `timebox_end_after_start`, `scope_items_declared`, `every_scope_item_on_critical_path` and `no_scope_item_name_duplicated`.

## Worked examples

Provenance: recorded 2026-11-16T08:32:23.307720+00:00 against gateway v1.1.0, external verification lane, source `verification/work/poc-design-kill-criteria-verdict/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T08:32:23.307720+00:00 · gateway v1.1.0 · source `verification/work/poc-design-kill-criteria-verdict/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "design_premise",
      "check": "uncertainty_to_reduce_named",
      "status": "pass",
      "evidence": "design premise: the uncertainty the POC exists to reduce is named in the design"
    },
    {
      "section": "design_premise",
      "check": "answer_changes_plan_declared",
      "status": "pass",
      "evidence": "design premise: the design declares that the answer changes the plan \u2014 the question is worth asking before building"
    },
    {
      "section": "design_premise",
      "check": "uncertainty_reduction_purpose_declared",
      "status": "pass",
      "evidence": "design premise: the stated purpose is reducing uncertainty, not shipping"
    },
    {
      "section": "design_premise",
      "check": "design_record_completed_before_run",
      "status": "pass",
      "evidence": "design premise: this design record is completed before the run \u2014 the question, criteria and timebox are defined before writing code"
    },
    {
      "section": "criteria_row_consistency",
      "check": "vendor_evaluation_applicability_declared",
      "status": "pass",
      "evidence": "criteria rows: whether the POC evaluates a vendor or tool is declared \u2014 the house-stack-fit check applies only when it does"
    },
    {
      "section": "criteria_row_consistency",
      "check": "criteria_declared",
      "status": "pass",
      "evidence": "the declared design names its criteria \u2014 the criteria list is present and non-empty"
    },
    {
      "section": "criteria_row_consistency",
      "check": "every_criterion_kind_is_success_or_kill",
      "status": "pass",
      "evidence": "criteria rows: every declared criterion row is one of the two kinds the skill names \u2014 success or kill"
    },
    {
      "section": "criteria_row_consistency",
      "check": "at_least_one_success_criterion_declared",
      "status": "pass",
      "evidence": "criteria rows: at least one declared row is a success criterion \u2014 success AND kill criteria"
    },
    {
      "section": "criteria_row_consistency",
      "check": "at_least_one_kill_criterion_declared",
      "status": "pass",
      "evidence": "criteria rows: at least one declared row is a kill criterion \u2014 success AND kill criteria"
    },
    {
      "section": "criteria_row_consistency",
      "check": "every_criterion_condition_stated",
      "status": "pass",
      "evidence": "criteria rows: every declared criterion row states the condition that satisfies it \u2014 the success bar or kill trigger is written, not implied"
    },
    {
      "section": "criteria_row_consistency",
      "check": "every_criterion_declared_before_run",
      "status": "pass",
      "evidence": "criteria rows: every declared criterion row is itself declared before the run \u2014 no criterion is added after the fact"
    },
    {
      "section": "criteria_row_consistency",
      "check": "no_criterion_name_duplicated",
      "status": "pass",
      "evidence": "criteria rows: no declared criterion name is owned by more than one criterion row"
    },
    {
      "section": "criteria_row_consistency",
      "check": "house_stack_fit_criterion_when_evaluating_vendor",
      "status": "pass",
      "evidence": "criteria rows: when the POC evaluates a vendor or tool, at least one criterion row assesses fit against the house stack"
    },
    {
      "section": "timebox_window",
      "check": "timebox_window_set_before_run",
      "status": "pass",
      "evidence": "timebox window: the window is set before the run \u2014 the timebox is defined upfront, not discovered during the run"
    },
    {
      "section": "timebox_window",
      "check": "timebox_window_dates_valid",
      "status": "pass",
      "evidence": "timebox window: the declared start and end dates are real calendar dates in strict ISO form"
    },
    {
      "section": "timebox_window",
      "check": "timebox_end_after_start",
      "status": "pass",
      "evidence": "timebox window: the declared end date falls after the declared start date \u2014 the window has a positive length; its length itself is not judged"
    },
    {
      "section": "scope_row_consistency",
      "check": "scope_items_declared",
      "status": "pass",
      "evidence": "the declared design names its scope \u2014 the scope items list is present and non-empty"
    },
    {
      "section": "scope_row_consistency",
      "check": "every_scope_item_on_critical_path",
      "status": "pass",
      "evidence": "scope rows: every declared scope item is on the critical path \u2014 scope is the critical path, nothing more"
    },
    {
      "section": "scope_row_consistency",
      "check": "no_scope_item_name_duplicated",
      "status": "pass",
      "evidence": "scope rows: no declared scope name is owned by more than one scope item"
    },
    {
      "section": "production_boundary_by_design",
      "check": "no_poc_code_planned_for_direct_production_use",
      "status": "pass",
      "evidence": "red line by design: the design does not plan for POC code to be used directly in production \u2014 no POC-to-production gradient is designed in"
    },
    {
      "section": "production_boundary_by_design",
      "check": "no_open_ended_design",
      "status": "pass",
      "evidence": "red line by design: the design is not open-ended \u2014 no unbounded POC is designed in"
    },
    {
      "section": "production_boundary_by_design",
      "check": "no_poc_success_planned_as_production_readiness",
      "status": "pass",
      "evidence": "red line by design: the design does not plan to treat POC success as production readiness \u2014 'it worked in the POC' is never production evidence"
    }
  ],
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
  "summary": "22 pass, 0 fail, 0 missing of 22 checks across five sections.",
  "stamp": "POC DESIGN KILL CRITERIA VERDICT\npoc: Test POC\nVERDICT: POC_DESIGN_SOUND\n  design_premise                   pass\n  criteria_row_consistency         pass\n  timebox_window                   pass\n  scope_row_consistency            pass\n  production_boundary_by_design    pass\n22 pass, 0 fail, 0 missing of 22 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T08:32:23.307720+00:00 · gateway v1.1.0 · source `verification/work/poc-design-kill-criteria-verdict/evidence.json`.

Input:

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
      "condition_stated": false,
      "declared_before_run": true,
      "assesses_house_stack_fit": true
    },
    {
      "name": "C1",
      "kind": "other",
      "condition_stated": true,
      "declared_before_run": true,
      "assesses_house_stack_fit": false
    }
  ],
  "timebox": {
    "window_set_before_run": true,
    "start_date": "2023-01-01",
    "end_date": "2023-01-01"
  },
  "scope_items": [
    {
      "name": "S1",
      "on_critical_path": false
    }
  ],
  "red_lines": {
    "poc_code_planned_for_direct_production_use_present": true,
    "open_ended_design_present": false,
    "poc_success_planned_as_production_readiness_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "poc-design-kill-criteria-verdict",
  "atom_version": "0.1.0",
  "poc": "Test POC",
  "verdict": "POC_DESIGN_NOT_SOUND",
  "sections": {
    "design_premise": "pass",
    "criteria_row_consistency": "fail",
    "timebox_window": "fail",
    "scope_row_consistency": "fail",
    "production_boundary_by_design": "fail"
  },
  "checks": [
    {
      "section": "design_premise",
      "check": "uncertainty_to_reduce_named",
      "status": "pass",
      "evidence": "design premise: the uncertainty the POC exists to reduce is named in the design"
    },
    {
      "section": "design_premise",
      "check": "answer_changes_plan_declared",
      "status": "pass",
      "evidence": "design premise: the design declares that the answer changes the plan \u2014 the question is worth asking before building"
    },
    {
      "section": "design_premise",
      "check": "uncertainty_reduction_purpose_declared",
      "status": "pass",
      "evidence": "design premise: the stated purpose is reducing uncertainty, not shipping"
    },
    {
      "section": "design_premise",
      "check": "design_record_completed_before_run",
      "status": "pass",
      "evidence": "design premise: this design record is completed before the run \u2014 the question, criteria and timebox are defined before writing code"
    },
    {
      "section": "criteria_row_consistency",
      "check": "vendor_evaluation_applicability_declared",
      "status": "pass",
      "evidence": "criteria rows: whether the POC evaluates a vendor or tool is declared \u2014 the house-stack-fit check applies only when it does"
    },
    {
      "section": "criteria_row_consistency",
      "check": "criteria_declared",
      "status": "pass",
      "evidence": "the declared design names its criteria \u2014 the criteria list is present and non-empty"
    },
    {
      "section": "criteria_row_consistency",
      "check": "every_criterion_kind_is_success_or_kill",
      "status": "fail",
      "evidence": "criteria rows: every declared criterion row is one of the two kinds the skill names \u2014 success or kill"
    },
    {
      "section": "criteria_row_consistency",
      "check": "at_least_one_success_criterion_declared",
      "status": "pass",
      "evidence": "criteria rows: at least one declared row is a success criterion \u2014 success AND kill criteria"
    },
    {
      "section": "criteria_row_consistency",
      "check": "at_least_one_kill_criterion_declared",
      "status": "fail",
      "evidence": "criteria rows: at least one declared row is a kill criterion \u2014 success AND kill criteria"
    },
    {
      "section": "criteria_row_consistency",
      "check": "every_criterion_condition_stated",
      "status": "fail",
      "evidence": "criteria rows: every declared criterion row states the condition that satisfies it \u2014 the success bar or kill trigger is written, not implied"
    },
    {
      "section": "criteria_row_consistency",
      "check": "every_criterion_declared_before_run",
      "status": "pass",
      "evidence": "criteria rows: every declared criterion row is itself declared before the run \u2014 no criterion is added after the fact"
    },
    {
      "section": "criteria_row_consistency",
      "check": "no_criterion_name_duplicated",
      "status": "fail",
      "evidence": "criteria rows: no declared criterion name is owned by more than one criterion row"
    },
    {
      "section": "criteria_row_consistency",
      "check": "house_stack_fit_criterion_when_evaluating_vendor",
      "status": "pass",
      "evidence": "criteria rows: when the POC evaluates a vendor or tool, at least one criterion row assesses fit against the house stack"
    },
    {
      "section": "timebox_window",
      "check": "timebox_window_set_before_run",
      "status": "pass",
      "evidence": "timebox window: the window is set before the run \u2014 the timebox is defined upfront, not discovered during the run"
    },
    {
      "section": "timebox_window",
      "check": "timebox_window_dates_valid",
      "status": "pass",
      "evidence": "timebox window: the declared start and end dates are real calendar dates in strict ISO form"
    },
    {
      "section": "timebox_window",
      "check": "timebox_end_after_start",
      "status": "fail",
      "evidence": "timebox window: the declared end date falls after the declared start date \u2014 the window has a positive length; its length itself is not judged"
    },
    {
      "section": "scope_row_consistency",
      "check": "scope_items_declared",
      "status": "pass",
      "evidence": "the declared design names its scope \u2014 the scope items list is present and non-empty"
    },
    {
      "section": "scope_row_consistency",
      "check": "every_scope_item_on_critical_path",
      "status": "fail",
      "evidence": "scope rows: every declared scope item is on the critical path \u2014 scope is the critical path, nothing more"
    },
    {
      "section": "scope_row_consistency",
      "check": "no_scope_item_name_duplicated",
      "status": "pass",
      "evidence": "scope rows: no declared scope name is owned by more than one scope item"
    },
    {
      "section": "production_boundary_by_design",
      "check": "no_poc_code_planned_for_direct_production_use",
      "status": "fail",
      "evidence": "red line by design: the design does not plan for POC code to be used directly in production \u2014 no POC-to-production gradient is designed in"
    },
    {
      "section": "production_boundary_by_design",
      "check": "no_open_ended_design",
      "status": "pass",
      "evidence": "red line by design: the design is not open-ended \u2014 no unbounded POC is designed in"
    },
    {
      "section": "production_boundary_by_design",
      "check": "no_poc_success_planned_as_production_readiness",
      "status": "pass",
      "evidence": "red line by design: the design does not plan to treat POC success as production readiness \u2014 'it worked in the POC' is never production evidence"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "criteria_count": 2,
  "success_criteria_count": 1,
  "kill_criteria_count": 0,
  "criteria_without_condition": [
    "C1"
  ],
  "condition_stated_coverage": "0.500000",
  "criteria_not_declared_before_run": [],
  "declared_before_run_coverage": "1.000000",
  "criteria_with_invalid_kind": [
    "C1"
  ],
  "duplicate_criterion_names": [
    "C1"
  ],
  "timebox_start_date": "2023-01-01",
  "timebox_end_date": "2023-01-01",
  "timebox_duration_days": 0,
  "scope_items_count": 1,
  "scope_items_off_critical_path": [
    "S1"
  ],
  "critical_path_coverage": "0.000000",
  "duplicate_scope_item_names": [],
  "summary": "15 pass, 7 fail, 0 missing of 22 checks across five sections.",
  "stamp": "POC DESIGN KILL CRITERIA VERDICT\npoc: Test POC\nVERDICT: POC_DESIGN_NOT_SOUND\n  design_premise                   pass\n  criteria_row_consistency         fail\n  timebox_window                   fail\n  scope_row_consistency            fail\n  production_boundary_by_design    fail\n15 pass, 7 fail, 0 missing of 22 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T08:32:23.307720+00:00 · gateway v1.1.0 · source `verification/work/poc-design-kill-criteria-verdict/evidence.json`.

Input:

```json
{
  "poc": "Malformed POC",
  "design": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "design",
  "detail": "design must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared POC design record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not POC execution, an idea review or regulated professional advice of any kind, and it verifies no live fact. |
| Checks named | 22 documented / 22 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`criteria_count`, `success_criteria_count`, `kill_criteria_count`, the four criteria row-name lists, the three timebox fields, `scope_items_count`, the two scope row-name lists and the three coverage ratios) |
| Input reference typed | Yes — 26 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/poc-design-kill-criteria-verdict/evidence.json` |
