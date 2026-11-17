# Uat scenario sign off pack — `uat-scenario-sign-off-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Run UAT that means something — business scenarios, realistic data, sign-off criteria, clean feedback loops.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. In this atom's deterministic form, the caller submits a **declared UAT scenario and sign-off record** and receives the UAT-record audit verdict as the deliverable: the atom runs no UAT, executes no scenario and accepts nothing on anyone's behalf (see Honest scoping).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Acceptance rounds before product releases**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the UAT sign-off manifest

The caller submits one JSON manifest: a declared UAT
scenario and sign-off record for one acceptance round, made
from the round as actually carried out. Every field below is
read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present
but false / invalid = the check fails
(`UAT_SIGN_OFF_NOT_SOUND`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `uat_round_title` (string; carried into the verdict output, not itself checked) | — |
| `scope.criteria_source_recorded` (boolean) | scope_and_criteria_mapping |
| `scope.scope_defined_before_execution` (boolean) | scope_and_criteria_mapping |
| `scope.no_silent_scope_edits_during_uat` (boolean) | scope_and_criteria_mapping |
| `acceptance_criteria` (list of criterion-row objects, each with the entry fields below; computed, see below) | scope_and_criteria_mapping |
| `acceptance_criteria[].criterion_id` (string; must be unique per row) | scope_and_criteria_mapping |
| `acceptance_criteria[].description` (non-empty string) | scope_and_criteria_mapping |
| `scenarios` (list of scenario-row objects, each with the entry fields below; computed, see below) | scope_and_criteria_mapping, environment_people_and_scripts, execution_and_results |
| `scenarios[].scenario_id` (string; must be unique per row) | scope_and_criteria_mapping |
| `scenarios[].criterion_ids` (list of strings; computed — must name declared criteria, and together must cover every declared criterion, see below) | scope_and_criteria_mapping |
| `scenarios[].steps_recorded` (boolean) | environment_people_and_scripts |
| `scenarios[].expected_outcome` (non-empty string) | environment_people_and_scripts |
| `scenarios[].timeboxed` (boolean) | environment_people_and_scripts |
| `scenarios[].result` (string; one of `passed`, `failed`, `blocked`, `not_run`) | execution_and_results |
| `environment.staging_mirrors_production` (boolean) | environment_people_and_scripts |
| `environment.test_data_realistic` (boolean) | environment_people_and_scripts |
| `environment.production_data_used` (boolean; gates the anonymization check below) | environment_people_and_scripts |
| `environment.test_data_anonymized` (boolean; required when production data use is declared; otherwise the check passes as not applicable) | environment_people_and_scripts |
| `people.business_owner_owns_uat` (boolean) | environment_people_and_scripts |
| `people.business_owner_executes_uat` (boolean) | environment_people_and_scripts |
| `people.supporting_team_assigned` (boolean) | environment_people_and_scripts |
| `people.scribe_assigned` (boolean) | environment_people_and_scripts |
| `execution.execution_window_completed` (boolean) | execution_and_results |
| `execution.deviations_logged_as_defects` (boolean) | execution_and_results |
| `defects` (list of defect-row objects, each with the entry fields below; computed, see below; may be declared empty — a round may find no defects) | defects_and_triage, execution_and_results, sign_off_record, retest_and_regression_after_fixes |
| `defects[].defect_id` (string; must be unique per row) | defects_and_triage |
| `defects[].scenario_id` (string; computed — must name a declared scenario, see below) | defects_and_triage |
| `defects[].severity` (non-empty string; the exact value `blocker` drives the blocker checks, see below) | defects_and_triage, sign_off_record |
| `defects[].disposition` (string; one of `fix_now`, `accept_with_note`, `defer_with_date`) | defects_and_triage, retest_and_regression_after_fixes |
| `defects[].disposition_note` (string; must be non-empty on `accept_with_note` rows) | defects_and_triage |
| `defects[].defer_until` (string; must be non-empty on `defer_with_date` rows) | defects_and_triage |
| `defects[].resolved` (boolean) | sign_off_record, retest_and_regression_after_fixes |
| `triage.triage_held_daily` (boolean) | defects_and_triage |
| `required_sign_off_roles` (list of strings; must name at least one role, no duplicates; computed, see below) | sign_off_record |
| `sign_offs` (list of sign-off-row objects, each with the entry fields below; computed, see below) | sign_off_record |
| `sign_offs[].role` (string; computed — must name a declared required role) | sign_off_record |
| `sign_offs[].signer_name` (non-empty string) | sign_off_record |
| `sign_offs[].signed` (boolean) | sign_off_record |
| `sign_off.outcome` (string; one of `pass`, `conditional_pass`) | sign_off_record |
| `sign_off.conditional_open_items_listed` (boolean; required when a conditional pass is declared; otherwise the check passes as not applicable) | sign_off_record |
| `sign_off.conditional_owner_named` (boolean; gated as above) | sign_off_record |
| `retest.uat_fixes_made` (boolean; gates the three re-test checks below) | retest_and_regression_after_fixes |
| `retest.changed_scenarios_retested` (boolean; required when UAT fixes are declared made; otherwise the check passes as not applicable) | retest_and_regression_after_fixes |
| `retest.touched_flows_regression_completed` (boolean; gated as above) | retest_and_regression_after_fixes |
| `retest.retest_results_recorded` (boolean; gated as above) | retest_and_regression_after_fixes |
| `declared_totals.acceptance_criteria_count` (number; computed — must recompute against the declared rows, see below) | scope_and_criteria_mapping |
| `declared_totals.scenarios_count` (number; computed as above) | scope_and_criteria_mapping |
| `declared_totals.executed_scenarios_count` (number; computed — scenarios whose result is not `not_run`) | execution_and_results |
| `declared_totals.defects_count` (number; computed as above) | defects_and_triage |
| `declared_totals.sign_off_roles_count` (number; computed — length of `required_sign_off_roles`) | sign_off_record |
| `red_lines.production_data_used_without_anonymization_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.passed_while_blocker_defects_open_present` (boolean; must be `false` to pass — skill red line) | red_lines |

## Check register by section

Fifty-six checks across seven sections:
**scope_and_criteria_mapping** (13) — criteria source
recorded, scope defined before execution, no silent scope
edits, plus the computed criteria / scenario / coverage /
declared-count checks below; **environment_people_and_scripts**
(10) — staging mirrors production, realistic data, the gated
anonymization check, business owner owns and executes,
supporting team and scribe assigned, plus the computed
per-scenario script checks below; **execution_and_results**
(6) — execution window completed, deviations logged as
defects, plus the computed result checks below;
**defects_and_triage** (9) — daily triage, plus the computed
defect checks below; **sign_off_record** (12) — the computed
sign-off checks and the two conditional-pass gated checks
below; **retest_and_regression_after_fixes** (4) — the three
fix-gated re-test / regression checks plus the computed
`fix_now` resolution check below; **red_lines** (2) — no UAT
on production data without anonymization present, no passed
outcome while blockers are open present.

Thirty-six checks are computed from the declared rows, using
only the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Criteria declared:** the declared `acceptance_criteria`
  list passes when it is present and names at least one
  criterion. An absent list is missing evidence; an empty list
  fails — it declares no criteria at all.
- **Criterion ids unique; description per criterion:** no
  declared `criterion_id` may appear on more than one row, and
  every row declares a non-empty `description`. A row with the
  field absent is missing evidence; a row declaring it empty
  fails and is named in `uat_criteria_without_description`.
- **Scenarios declared; scenario ids unique:** as for
  criteria — at least one declared scenario row, no duplicate
  `scenario_id`.
- **Every scenario covers at least one criterion; every
  scenario criterion reference is declared:** every scenario's
  `criterion_ids` is a non-empty list, and every id it names is
  one of the declared criteria. Offenders are named in
  `uat_scenarios_without_criterion_reference` and
  `uat_scenarios_with_unknown_criterion_reference`.
- **Every criterion covered by a scenario:** every declared
  criterion id appears in at least one scenario's
  `criterion_ids` (the skill's first quality gate: all
  acceptance criteria mapped to scenarios). Uncovered criteria
  are named in `uat_criteria_not_covered_by_any_scenario`.
- **Script completeness per scenario:** every scenario row
  declares `steps_recorded: true`, a non-empty
  `expected_outcome`, and `timeboxed: true`. Offenders are
  named in the matching `uat_scenarios_*` lists.
- **Result recognised and executed per scenario:** every
  scenario's `result` is one of `passed`, `failed`, `blocked`,
  `not_run` (the record's vocabulary for the skill's pass/fail
  scripts), and every scenario is declared executed — its
  result is not `not_run`. Offenders are named in
  `uat_scenarios_with_invalid_result` and
  `uat_scenarios_not_executed`.
- **Failed or blocked scenarios have a defect record:** every
  scenario whose result is `failed` or `blocked` is named by
  at least one declared defect row (deviations logged as
  defects). Offenders are named in
  `uat_failed_or_blocked_scenarios_without_defect`.
- **Defects declared:** the declared `defects` list passes
  when it is present — **an empty list passes**, because a
  round may genuinely find no defects; an absent list is
  missing evidence. Per-row defect checks below pass vacuously
  over an empty list.
- **Defect ids unique; defect scenario reference declared;
  severity declared; disposition recognised:** no duplicate
  `defect_id`; every defect's `scenario_id` names a declared
  scenario; every defect declares a non-empty `severity`
  (defects classified); every `disposition` is one of
  `fix_now`, `accept_with_note`, `defer_with_date` — the three
  triage dispositions the skill names. Offenders are named in
  the matching `uat_defects_*` lists.
- **Accepted defects carry a note; deferred defects carry a
  date:** every `accept_with_note` row declares a non-empty
  `disposition_note`, and every `defer_with_date` row declares
  a non-empty `defer_until` (the skill: accept *with note*,
  defer *with a date*).
- **Sign-off outcome recognised:** the declared
  `sign_off.outcome` is one of `pass`, `conditional_pass` —
  the two explicit outcomes the skill names.
- **Required roles declared and unique; sign-offs declared:**
  `required_sign_off_roles` names at least one role with no
  duplicates, and `sign_offs` names at least one row.
- **Sign-off completeness:** every sign-off row names a role
  among the required roles, a non-empty `signer_name`, and
  `signed: true`; and every required role has a signed
  sign-off row. Gaps are named in
  `uat_sign_offs_with_unknown_role`,
  `uat_sign_offs_without_signer_name`,
  `uat_sign_offs_not_signed` and
  `uat_required_roles_without_signed_sign_off`.
- **No pass while a blocker is open (recomputed):** a declared
  `pass` outcome fails while any defect declaring severity
  exactly `blocker` is not declared `resolved: true`. Open
  blockers are named in `uat_open_blocker_defect_ids`. A
  `conditional_pass` does not fail this check — the skill
  allows a conditional pass listing open items, checked by the
  gated checks below.
- **`fix_now` defects resolved:** every defect dispositioned
  `fix_now` is declared `resolved: true`; unresolved ones are
  named in `uat_fix_now_defects_unresolved`.
- **Declared totals recompute:** each of the five
  `declared_totals` counts must equal the count recomputed
  from the declared rows (criteria, scenarios, executed
  scenarios — results other than `not_run` — defects, and
  required sign-off roles). A totals field absent, or its row
  list absent, is missing evidence; a mismatching count fails.

Six further checks are gated on the record's own declared
gate fields, following the skill's own conditional scope —
when the gate is declared `false` (or, for the conditional
checks, the outcome is not a conditional pass), the check
passes as not applicable; when the gate field / outcome is
absent, the check is missing evidence; when the gate applies,
the target declaration is required:

- **Anonymization:** required only where
  `environment.production_data_used` is declared `true` (the
  skill red line: no UAT on production data without
  anonymization).
- **Conditional-pass open items and owner:** each required
  only where `sign_off.outcome` is declared `conditional_pass`
  (the skill: conditional pass listing open items, with a
  named owner).
- **Re-test, regression and re-test-result recording:** each
  required only where `retest.uat_fixes_made` is declared
  `true` (the skill's quality gate: re-test + regression
  completed after any UAT fix).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the thirty-six primary computed checks above cannot be
completed), the counts `uat_acceptance_criteria_count`,
`uat_scenarios_count`, `uat_executed_scenarios_count`,
`uat_defects_count`, `uat_sign_offs_count` and
`uat_required_sign_off_roles_count` (the declared list
lengths, or null when a list is not declared — counts are
reported as integers, exactly), the duplicate lists
`duplicate_uat_criterion_ids`, `duplicate_uat_scenario_ids`,
`duplicate_uat_defect_ids`,
`duplicate_uat_required_sign_off_roles` and
`duplicate_uat_sign_off_roles`, the row-name lists named in
the computed checks above, and the ratios
`uat_criterion_coverage_ratio` (declared criteria covered by
at least one scenario ÷ declared criteria),
`uat_scenario_execution_ratio` (executed scenarios ÷ declared
scenarios), `uat_scenario_pass_ratio` (scenarios declared
`passed` ÷ declared scenarios), `uat_defect_disposition_ratio`
(defects with a recognised disposition ÷ declared defects)
and `uat_sign_off_completion_ratio` (required roles with a
signed sign-off ÷ declared required roles). **Fixed
serialization rule:** computed ratios are reported as strings
with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals. A ratio is null when its denominator list is
absent or empty (the coverage and sign-off ratios are also
null when the covering / sign-off list is not declared). That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states no numeric threshold at all — its demands
are criteria mapping, a production-mirroring environment with
anonymized realistic data, business ownership, scripted
scenarios, classified and dispositioned defects, explicit
sign-off, and re-test after fixes, not bars the atom can set.
Quantities are computed and reported; the only bars on the
computed rows are exact coverage and completeness over the
caller's own declared rows, exactly as stated above. Declined
thresholds, named: a minimum or maximum number of criteria,
scenarios, defects or sign-off roles beyond at least one each
where stated (and none at all for defects — zero is a
legitimate declared outcome); a scenario pass-rate bar (the
ratio is reported, never judged — a round with failed
scenarios and a sound record is a sound record of a failed
round); a defect-count, severity-mix or blocker-count bar
beyond the skill's own recomputed no-pass-with-open-blocker
rule; a severity scale beyond the caller's own declared
severity strings (only the exact declared value `blocker`
carries the skill's red-line meaning); a timebox length in
minutes; a triage cadence bar beyond the declared daily
triage; a re-test or regression duration or coverage bar
beyond completion as declared; a date-format or futurity bar
on `defer_until` (checked as a non-empty declared date string
only — the atom reads no clock); any judgment that the
product under UAT is good, acceptable or ready to ship (only
that its declared UAT record contains what the skill
requires — acceptance itself is the business's, never this
atom's).

The verdict is one of `UAT_SIGN_OFF_SOUND` (all 56 checks
pass), `UAT_SIGN_OFF_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across seven sections: scope_and_criteria_mapping,
environment_people_and_scripts, execution_and_results,
defects_and_triage, sign_off_record,
retest_and_regression_after_fixes, red_lines.

## Distinct ground

The nearest siblings are `designed-test-case-pack` (designed
**engineering** test cases — equivalence classes, boundaries,
decision tables and state transitions for a test suite),
`testing-strategy-regression-pack` (authored in this same
batch — an **engineering** testing strategy and its regression
scope: what the builders test and re-test) and
`buyer-test-card` (a buyer's own bounded test of a product
they are considering buying). This atom shares **zero checks**
with any of them (verified mechanically by enumerating
`evaluate({})` check names from every atom oracle in
`services/*/src/*.py` and comparing, with a grep of check
strings over the same files as the fallback for oracles whose
`evaluate({})` raises or returns a different shape — zero
overlap by both methods): every check here is a
business-acceptance question — business-user scenarios mapped
from acceptance criteria so every criterion is covered, a
business owner owning and executing the round with a scribe,
staging mirroring production with realistic anonymized data,
execution results and deviations logged as classified
defects, defects triaged daily into fix-now / accept-with-note
/ defer-with-a-date, an explicit sign-off record complete over
the declared required roles, and re-test plus regression after
UAT fixes. The boundary is unmistakable: the acceptance layer
and its sign-off record here; engineering test-case design,
engineering testing strategy and regression scope, and a
buyer's own product test there.

## Honest scoping

This atom reviews a **declared** UAT scenario and sign-off
record — it runs no UAT, executes no scenario, operates no
staging environment, inspects no data, interviews no business
user, and **accepts nothing on anyone's behalf**: a sign-off
is checked as a declared record (a named role, a signer name,
a signed flag, an outcome), never granted, witnessed or
validated by the atom. A round is sound *on the caller's
declared evidence*: a record that declares its criteria
covered, its blockers resolved and its roles signed passes
those checks even if the real round did none of it. It is a
completeness and consistency audit of the UAT record the skill
requires, **not a testing service, an acceptance decision, or
a guarantee that the product works or was actually accepted**:
it never judges whether a declared scenario is a good
end-to-end business flow, whether the declared data really was
anonymized, whether a declared signer actually signed, or
whether the business should have accepted — only that the
record contains what the skill's method, quality gates and
red lines demand, and that its declared rows are internally
consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never performed or judged): running the
UAT round itself; executing any scenario or product flow;
preparing, anonymizing or inspecting test data; the business
judgment behind any sign-off, acceptance, severity
classification or disposition; verifying any signature or
identity behind a declared sign-off row; and any release
decision that follows from a sign-off — each is EXCLUDED by
name from this atom, which audits only the declared record of
those steps. Boundary cases, named: a round that genuinely
found no defects passes with an empty declared `defects` list
(see above); a business refusal to sign off cannot pass this
record format's outcome check (the format recognises only the
skill's two sign-off outcomes — such a round is recorded as
not sound *as a sign-off record*, which is the gate working,
not a judgment on the refusal's merits); a conditional pass
with open blockers is not failed by the recomputed blocker
check — it stands or falls on its listed open items and named
owner, exactly as the skill allows.

## U-13 regulatory screen

Screen classification: **(a) — No outright.** Keyword screen:
the bound skill and this record name user acceptance testing,
business scenarios, acceptance criteria, defects, triage and
sign-off — no engineering-practice, securities/financial-advice
or psychology-adjacent subject, and no regulated profession's
vocabulary. Substance screen: this atom's output could not
read as regulated professional advice — it audits a
caller-**declared** UAT scenario and sign-off record for
completeness and internal consistency only (criteria-to-scenario
coverage, environment / people / script declarations,
execution results, defect classification and disposition,
sign-off completeness over the declared required roles,
re-test declarations, declared totals recomputed, and the red
lines refused); every output is a pass / fail / missing verdict
on the record or a ratio recomputed from the caller's own
declared rows. Named controls: (1) it produces **no test
execution, no acceptance and no advice of any kind** — it runs
no UAT and grants no sign-off; acceptance remains the named
business role-holders' act, recorded by the caller; (2) it
sets **no threshold** on any subject matter (see the declined
list); (3) the product under UAT is whatever the caller
declares — the atom receives no product, no code and no data,
takes no position on the product's subject, and no output is
addressed to any regulated decision; (4) the sign-off checks
judge declared presence and completeness only, never the
legal or organisational sufficiency of a sign-off. This is not
the census class (no regulated adjacency to flag) and not the
genuinely-open personal-financial-snapshot class (no personal
position of any kind is handled). No deploy happens on this
atom without the owner's explicit per-unit ruling in any case.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **AUTHORED + STAGED — not deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
