# Validated simulation scenario pack — `validated-simulation-scenario-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build simulations and harnesses that teach — models, seeds, validation against reality, scenario sweeps.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. In this atom's deterministic form, the caller submits a **declared simulation scenario pack record** and receives the pack audit verdict as the deliverable: the atom runs no simulation, executes no scenario, validates no model against the world and certifies nothing (see Honest scoping).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Relay simulation and backtest harnesses**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the simulation scenario pack manifest

The caller submits one JSON manifest: a declared simulation
scenario pack record for one simulation model and its
scenario library, made from the pack as actually assembled.
Every field below is read by the named section's checks. A
field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails
(`SIMULATION_SCENARIO_PACK_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `pack_title` (string; carried into the verdict output, not itself checked) | — |
| `purpose.purpose_declared` (boolean) | purpose_and_fidelity |
| `purpose.fidelity_level_declared` (boolean) | purpose_and_fidelity |
| `purpose.modeled_scope_declared` (boolean) | purpose_and_fidelity |
| `purpose.abstractions_declared` (boolean) | purpose_and_fidelity |
| `purpose.limits_stated_upfront` (boolean) | purpose_and_fidelity |
| `core.deterministic_core_declared` (boolean) | model_core_and_units |
| `core.units_explicit_si_declared` (boolean) | model_core_and_units |
| `core.domain_equations_referenced` (boolean) | model_core_and_units |
| `core.no_magic_numbers_declared` (boolean) | model_core_and_units |
| `parameters` (list of parameter-row objects, each with the entry fields below; computed, see below) | model_core_and_units |
| `parameters[].parameter_id` (string; must be unique per row) | model_core_and_units |
| `parameters[].parameter_name` (non-empty string) | model_core_and_units |
| `parameters[].unit` (string; must be a recognised SI unit, see below) | model_core_and_units |
| `parameters[].value` (number) | model_core_and_units |
| `parameters[].basis_note` (non-empty string) | model_core_and_units |
| `randomness.stochastic_elements_present` (boolean; declaration check — present true *or* false passes, the declaration itself is the evidence; gates the two distribution checks below) | randomness_and_reproducibility |
| `randomness.seeds_logged` (boolean) | randomness_and_reproducibility |
| `randomness.reproducibility_from_seed_log_declared` (boolean) | randomness_and_reproducibility |
| `randomness.stochastic_runs_reported_as_distributions` (boolean; required when stochastic elements are declared present; otherwise the check passes as not applicable) | randomness_and_reproducibility |
| `randomness.distribution_bands_and_run_counts_reported` (boolean; gated the same way) | randomness_and_reproducibility |
| `scenarios` (list of scenario-row objects, each with the entry fields below; computed, see below) | randomness_and_reproducibility, scenario_library_and_golden_cases |
| `scenarios[].scenario_id` (string; must be unique per row) | scenario_library_and_golden_cases |
| `scenarios[].scenario_name` (non-empty string) | scenario_library_and_golden_cases |
| `scenarios[].scenario_type` (string; one of `parameter_sweep`, `boundary_case`, `evolving_fault`, `golden`, `nominal_case`) | scenario_library_and_golden_cases |
| `scenarios[].expected_outcome` (non-empty string) | scenario_library_and_golden_cases |
| `scenarios[].seed_value` (number) | randomness_and_reproducibility |
| `scenario_library.golden_scenarios_used_as_regression_tests` (boolean) | scenario_library_and_golden_cases |
| `scenario_library.scenario_expected_outcomes_recorded` (boolean) | scenario_library_and_golden_cases |
| `scenario_library.evolving_faults_applicable` (boolean; gates the evolving-fault presence check below) | scenario_library_and_golden_cases |
| `model_version` (string; must be non-empty — computed, see below) | validation_against_reality |
| `validation.validation_cases_cited` (boolean) | validation_against_reality |
| `validation.errors_reported_honestly` (boolean) | validation_against_reality |
| `validation.model_changes_versioned_without_silent_edits` (boolean) | validation_against_reality |
| `validation_cases` (list of validation-case-row objects, each with the entry fields below; computed, see below) | validation_against_reality |
| `validation_cases[].case_id` (string; must be unique per row) | validation_against_reality |
| `validation_cases[].case_name` (non-empty string) | validation_against_reality |
| `validation_cases[].reference_source` (non-empty string) | validation_against_reality |
| `validation_cases[].expected_value` (number) | validation_against_reality |
| `validation_cases[].simulated_value` (number) | validation_against_reality |
| `validation_cases[].absolute_error_declared` (number; computed — must recompute as the absolute difference of the two values above, see below) | validation_against_reality |
| `interaction.sane_defaults_declared` (boolean) | interaction_logs_and_performance |
| `interaction.step_pause_rewind_controls_declared` (boolean) | interaction_logs_and_performance |
| `interaction.explanatory_overlays_declared` (boolean) | interaction_logs_and_performance |
| `interaction.run_logs_exportable` (boolean) | interaction_logs_and_performance |
| `interaction.live_interactive_ui_present` (boolean; gates the frame-budget check below) | interaction_logs_and_performance |
| `performance.heavy_compute_present` (boolean; gates the worker-chunking check below) | interaction_logs_and_performance |
| `performance.heavy_compute_chunked_behind_workers` (boolean; required when heavy compute is declared present; otherwise the check passes as not applicable) | interaction_logs_and_performance |
| `performance.interactive_frame_budget_declared` (boolean; required when a live interactive UI is declared present; otherwise the check passes as not applicable) | interaction_logs_and_performance |
| `red_lines.sim_output_presented_as_field_truth_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.hidden_model_edits_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.safety_critical_training_without_warning_labels_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.single_stochastic_outcome_presented_as_certain_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |
| `red_lines.unseeded_randomness_present` (boolean; must be `false` to pass — skill anti-pattern) | red_lines |

Twenty-two checks are computed from the declared rows, using
only the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Parameters declared:** the declared `parameters` list
  passes when it is present and names at least one parameter.
  An absent list is missing evidence; an empty list fails —
  it declares no parameterised model at all.
- **Parameter ids unique:** no declared `parameter_id` may
  appear on more than one row. A row with `parameter_id`
  absent is missing evidence for this check.
- **Parameter name per parameter:** every declared parameter
  row declares a non-empty `parameter_name`. A row with the
  field absent is missing evidence; a row declaring an empty
  name fails and is named in
  `simulation_parameters_without_name`.
- **Parameter unit recognised SI:** every declared
  parameter's `unit` is one of the recognised SI units — the
  SI base units (`m`, `kg`, `s`, `A`, `K`, `mol`, `cd`), the
  named SI derived units (`rad`, `Hz`, `N`, `Pa`, `J`, `W`,
  `C`, `V`, `F`, `ohm`, `S`, `Wb`, `T`, `H`, `lm`, `lx`), the
  listed SI compound forms (`m/s`, `m/s^2`, `kg/m^3`, `N*m`),
  or `dimensionless`. Any other value fails and is named in
  `simulation_parameters_with_invalid_unit`. This is the
  record form of the skill's "SI everywhere": the atom
  recognises the SI vocabulary, it does not convert or
  verify any quantity.
- **Parameter value per parameter:** every declared parameter
  row declares a numeric `value`. A row with the field absent
  is missing evidence.
- **Basis note per parameter:** every declared parameter row
  declares a non-empty `basis_note` naming where its value
  comes from. A row with the field absent is missing
  evidence; a row declaring an empty note fails and is named
  in `simulation_parameters_without_basis_note`. The basis
  note is the record form of the skill's "no magic numbers":
  every declared number names its source.
- **Seed per scenario:** every declared scenario row declares
  a numeric `seed_value` — the seed its runs reproduce from.
  A row with the field absent is missing evidence; coverage
  is reported as `scenario_seed_coverage_ratio`.
- **Scenarios declared:** the declared `scenarios` list
  passes when it is present and names at least two scenarios.
  An absent list is missing evidence; a single row fails — a
  pack / library by its own framing holds more than one case;
  one row is a single case, not a library.
- **Scenario ids unique:** no declared `scenario_id` may
  appear on more than one row.
- **Scenario name per scenario:** every declared scenario row
  declares a non-empty `scenario_name`, named in
  `simulation_scenarios_without_name` when empty.
- **Scenario type recognised:** every declared scenario's
  `scenario_type` is one of `parameter_sweep`,
  `boundary_case`, `evolving_fault`, `golden`,
  `nominal_case` — the skill's scenario-library vocabulary
  (parameter sweeps, boundary cases, evolving-fault
  libraries, golden scenarios) plus the nominal case a
  library is built around. Any other value fails and is
  named in `simulation_scenarios_with_invalid_scenario_type`.
- **Expected outcome per scenario:** every declared scenario
  row declares a non-empty `expected_outcome`. A row with the
  field absent is missing evidence; a row declaring an empty
  outcome fails and is named in
  `simulation_scenarios_without_expected_outcome`.
- **Golden scenario present:** at least one declared scenario
  is of type `golden` (reported as
  `simulation_scenario_golden_present`) — the skill holds
  golden scenarios with expected outcomes as regression
  tests, so a library with none declares no regression
  anchor.
- **Parameter-sweep scenario present:** at least one declared
  scenario is of type `parameter_sweep` (reported as
  `simulation_scenario_parameter_sweep_present`).
- **Boundary-case scenario present:** at least one declared
  scenario is of type `boundary_case` (reported as
  `simulation_scenario_boundary_case_present`).
- **Model version declared:** the declared `model_version`
  is a non-empty string. An absent version is missing
  evidence; an empty version fails — the skill versions the
  model, and a pack that names no version cannot be tied to
  the validation it declares.
- **Validation cases declared:** the declared
  `validation_cases` list passes when it is present and names
  at least one case. An absent list is missing evidence; an
  empty list fails — it declares no validation at all.
- **Validation case ids unique:** no declared `case_id` may
  appear on more than one row.
- **Validation case name per case:** every declared case row
  declares a non-empty `case_name`, named in
  `simulation_validation_cases_without_name` when empty.
- **Reference source per validation case:** every declared
  case row cites a non-empty `reference_source` — the
  textbook, field or reference case it reproduces. A row
  declaring an empty source fails and is named in
  `simulation_validation_cases_without_reference_source`.
- **Every validation case's absolute error recomputes:**
  every declared case's `absolute_error_declared` recomputes
  as abs(declared `simulated_value` − declared
  `expected_value`), compared on the fixed 6dp serialization
  below. A case with any of the three fields absent is
  missing evidence; a mismatch fails and is named in
  `simulation_validation_cases_with_error_mismatch`. The atom
  checks **only** the declared arithmetic — it never checks
  that a simulated value is right, close, or good enough.

Five further checks are gated on the record's own declared
gate fields, following the skill's own conditional scope —
when a gate is declared `false`, the check passes as not
applicable; when the gate field is absent, the check is
missing evidence; when the gate is `true`, the target is
required:

- **Stochastic runs as distributions** and **distribution
  bands and run counts:** required only where
  `randomness.stochastic_elements_present` is declared `true`
  (the skill: stochastic runs are reported as distributions —
  n runs, bands — not single outcomes; a purely deterministic
  pack has no distributions to report).
- **Evolving-fault scenario present:** required only where
  `scenario_library.evolving_faults_applicable` is declared
  `true` (evolving-fault libraries belong to fault-domain
  simulations; a pack that declares them not applicable is
  not failed for holding none).
- **Interactive frame budget:** required only where
  `interaction.live_interactive_ui_present` is declared
  `true` (the skill's frame budgets are for live UIs; a
  headless harness has no frame to budget).
- **Heavy compute chunked behind workers:** required only
  where `performance.heavy_compute_present` is declared
  `true`.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the twenty-two primary computed checks above cannot be
completed), `simulation_parameters_count`,
`simulation_scenarios_count` and
`simulation_validation_cases_count` (the declared list
lengths, or null when a list is not declared — counts are
reported as integers, exactly), the duplicate-id lists
`duplicate_simulation_parameter_ids`,
`duplicate_simulation_scenario_ids` and
`duplicate_simulation_validation_case_ids`, the row-name
lists named in the computed checks above, the scenario-type
presence flags `simulation_scenario_golden_present`,
`simulation_scenario_parameter_sweep_present`,
`simulation_scenario_boundary_case_present` and
`simulation_scenario_evolving_fault_present` (true / false
when the scenarios list is declared, null when it is not),
`simulation_validation_max_declared_absolute_error` (the
largest declared absolute error across the declared
validation cases — reported, never judged), and the ratios
`parameter_basis_note_ratio` (parameters with a recorded
basis note ÷ declared parameters),
`scenario_expected_outcome_ratio` (scenarios with a recorded
expected outcome ÷ declared scenarios),
`scenario_seed_coverage_ratio` (scenarios declaring a seed ÷
declared scenarios), `validation_case_reference_ratio`
(validation cases citing a reference source ÷ declared
validation cases) and `validation_error_match_ratio`
(validation cases whose declared absolute error recomputes ÷
declared validation cases). **Fixed serialization rule:**
computed quantities and ratios are reported as strings with
exactly six decimal places, produced in both implementations
by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals. A ratio is null when its denominator list is
absent or empty. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical.

The skill states no numeric threshold at all — its demands
are framing, seeding, library coverage, honest error
reporting and versioning, not bars the atom can set.
Quantities are computed and reported; the only bars on the
computed rows are exact recomputation and completeness over
the caller's own declared rows, exactly as stated above.
Declined thresholds, named: a fidelity score or a minimum
fidelity level for a purpose (fidelity is checked as
declared against the declared purpose, never measured); a
validation error tolerance, an error ceiling, or any bar on
the largest declared error (errors are recomputed exactly
and reported — whether an error is acceptable is an
engineering judgment this atom never makes); a minimum run
count for a distribution, a band width, or a confidence
level; a frame rate or a frame-budget duration (a budget
must be *declared* for a live UI; its value is the caller's);
a worker count, a chunk size, or any performance bar; a
scenario-count maximum, a parameter-count bar beyond at
least one parameter, or a validation-case-count bar beyond
at least one case; a seed value range or seed-quality bar
(any declared numeric seed is a seed — reproducibility is
checked as declared, never re-run); a plausibility range for
any parameter value, expected value or simulated value; a
unit vocabulary beyond the recognised SI set named above;
and any judgment that a model is valid, a simulation is
correct, or a pack is fit for training or for any
engineering use (only that its declared record contains what
the skill requires).

The verdict is one of `SIMULATION_SCENARIO_PACK_SOUND` (all
52 checks pass), `SIMULATION_SCENARIO_PACK_NOT_SOUND` (any
check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections:
purpose_and_fidelity, model_core_and_units,
randomness_and_reproducibility,
scenario_library_and_golden_cases,
validation_against_reality, interaction_logs_and_performance,
red_lines.

## Distinct ground

The nearest siblings are `relay-fault-simulation-walkthrough`
(a domain walkthrough deliverable for relay fault training on
one engine — one protection domain, one training session),
`strategy-backtest-validation` (declared backtest evidence
for a trading strategy — in/out-of-sample splits, cost
modelling, walk-forward and overfit evidence for capital
decisions), `testing-strategy-regression-pack` (a software
testing strategy and regression plan — test levels per risk,
regression per defect, flake control) and
`uat-scenario-sign-off-pack` (business UAT scenarios with
realistic data, sign-off criteria and acceptance by named
humans). This atom shares **zero checks** with any of them
(verified mechanically by grepping all 52 chosen check names
across `services/*/src/*.py` outside this atom's own file —
zero collisions): every check here is a simulation-pack
question — purpose-to-fidelity framing with modeled scope,
abstractions and limits stated up front, a deterministic
core whose parameter rows carry recognised SI units and a
basis note for every value, seeded reproducibility with
stochastic runs reported as distributions with bands and run
counts, a scenario library typed parameter-sweep / boundary /
evolving-fault / golden / nominal with an expected outcome
and a seed on every row and golden scenarios held as
regression tests, and validation-case rows citing textbook /
field / reference sources whose declared absolute errors
recompute exactly under a declared model version. The
boundary is: one simulation scenario pack's declared record
here; a relay-training walkthrough, a strategy backtest, a
software test plan, and a UAT acceptance round there.

## Honest scoping

This atom reviews a **declared** simulation scenario pack
record — it builds no model, runs no simulation, executes no
scenario or sweep, fetches nothing, and validates no model
against the real world. A pack is sound *on the caller's
declared evidence*: a record that declares its limits stated,
its seeds logged, its golden scenarios passing and its errors
honestly reported passes those checks even if the real pack
did none of it. It is a completeness and consistency audit of
the pack record the skill requires, **not a simulation, a
validation of any model, or an engineering determination of
any kind**: it never judges whether a declared simulated
value is correct, whether a declared error is small enough,
whether the model's equations are the right equations,
whether the fidelity suits the purpose, or whether the pack
is safe or fit to train anyone — only that the record
contains what the skill's method, quality gates and red
lines demand, and that its declared rows are internally
consistent.

Named exclusions and non-reducible parts (excluded by name,
never performed): building or running a simulation or a
harness; executing a scenario, a sweep or a golden case;
reproducing a textbook, field or reference case;
validating a model against reality or against any external
data; judging that a simulated value is correct or that a
declared error is acceptable; setting or assessing a
fidelity level for a caller's purpose; choosing parameter
values, seeds, scenarios or scenario types for a caller;
certifying a pack as safe, fit for training, or fit for any
engineering, operational or safety use; and presenting any
output of this atom as field truth — each is EXCLUDED by name
from this atom, which audits only the declared record.
Boundary cases, named: a pack for a genuinely single-scenario
study cannot pass this record format's scenarios-declared
check (the format requires a library of at least two
scenarios — such a pack is outside this atom's computed
reach, not failed on its merits); a purely deterministic pack
passes the distribution checks as not applicable through its
own declared gate; and a parameter whose unit is a legitimate
non-SI unit in its field (for example rpm) fails the
recognised-SI check by design, because the skill's discipline
is SI everywhere and the record format holds that line —
callers declare the SI form.

## U-13 regulatory screen

Screen classification: **(b) — screen-NO, flag-with-controls
(census class), recorded as a HOLD-adjacent flag for the
Director's per-unit ruling.** Keyword screen: the bound skill
and this record name simulations, training simulators
(protection, faults, controls), validation against reality
and safety-critical training — engineering-practice-adjacent
subjects are named throughout, and a simulation pack for a
safety-relevant system sits close to professional engineering
judgment: a naive version of this atom that ran a simulation,
validated a model, or certified a pack as fit for training
could read as an engineering determination. Substance screen:
this atom's output could not itself read as an engineering
determination **while the controls below hold** — it audits a
caller-**declared** pack record for completeness and internal
consistency only (purpose / fidelity declarations, parameter
rows checked for SI vocabulary and basis notes, seed and
distribution declarations, scenario-library coverage over the
declared rows, validation-case rows whose declared absolute
errors are recomputed over the caller's own declared values,
model-version and interaction / performance declarations, and
the red lines refused); every output is a pass / fail /
missing verdict on the record or a quantity recomputed from
the caller's own declared rows. It determines nothing about
any real system, model or person. Named controls: (1) it
**runs no simulation and executes no scenario** — the skill's
building, running, sweeping and reproducing steps are
excluded by name in Honest scoping above; the atom never
produces a simulated value of its own; (2) it **makes no
validation or fitness determination** — checking a declared
absolute error's arithmetic (it equals the declared
difference) is audit, not validation, and that boundary is
stated in the check itself; the atom never states that a
model is valid, a result is correct, an error is acceptable,
or a pack is fit for training or any engineering use, and it
sets no error tolerance or fidelity bar (see the declined
list); (3) the skill's own safety red line is a refused red
line here — a record declaring safety-critical training
without warning labels, sim output presented as field truth,
or hidden model edits **fails**; (4) the word "validated" in
this atom's name and title refers only to the declared-record
audit verdict defined above (`SIMULATION_SCENARIO_PACK_SOUND`
= the record contains what the skill requires, on declared
evidence) — never to a validated model. Because the adjacency
is real and strictest-reading discipline applies to
engineering-adjacent atoms (a simulation pack can describe
training for safety-critical work, and the neighbouring
`strategy-backtest-validation` atom was disabled under U-13
by owner ruling on 2026-11-15), this screen is recorded as
screen-NO **with** the flag-with-controls class, and — as
with every atom — no deploy happens on this atom without the
owner's explicit per-unit ruling in any case; if the Director
reads the pack's name or verdict vocabulary as implying an
engineering determination despite the controls, this unit is
a HOLD CANDIDATE for that ruling and must not deploy on this
screen alone.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **AUTHORED + STAGED — not deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
