# Smart grid der design pack — `smart-grid-der-design-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Design and analyze smart-grid systems - ADMS/SCADA, DER integration, IEC 61850, AMI, microgrids, cyber.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

Despite the atom's name, what is delivered is a **record audit** — a completeness and consistency review of a caller-declared smart-grid / DER design record — never a design (see the U-13 screen and Honest scoping below). The register's named doubt for this atom ("Broad design advice, no bounded check") is answered by that shape: the skill's design and advice work is excluded by name, and only the bounded declared-record audit is served.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Onsmartgrid content and EE consulting**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the smart-grid DER design manifest

The caller submits one JSON manifest: a declared smart-grid /
DER design record for one project, made from the project's
actual design documentation. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`SMART_GRID_DER_DESIGN_PACK_NOT_READY`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `architecture.single_line_diagram_recorded` (boolean) | layered_architecture_and_standards |
| `architecture.comms_diagram_paired` (boolean) | layered_architecture_and_standards |
| `architecture.five_layers_mapped` (boolean) | layered_architecture_and_standards |
| `architecture.ieee_1547_cited` (boolean) | layered_architecture_and_standards |
| `architecture.iec_61850_cited` (boolean) | layered_architecture_and_standards |
| `architecture.der_dr_protocol_cited` (boolean; IEEE 2030.5 / OpenADR) | layered_architecture_and_standards |
| `architecture.cim_model_cited` (boolean) | layered_architecture_and_standards |
| `architecture.clause_level_citations_where_claims_matter` (boolean) | layered_architecture_and_standards |
| `network_model.gis_power_flow_model_recorded` (boolean) | network_model_and_telemetry_points |
| `network_model.point_list_derived_from_model` (boolean) | network_model_and_telemetry_points |
| `network_model.control_loops_derived_from_point_list` (boolean) | network_model_and_telemetry_points |
| `telemetry_points` (list of telemetry-point-row objects, each with the entry fields below; computed, see below) | network_model_and_telemetry_points |
| `telemetry_points[].point_id` (string; names the row in the computed outputs) | network_model_and_telemetry_points |
| `telemetry_points[].purpose_recorded` (boolean; must be `true` per row) | network_model_and_telemetry_points |
| `telemetry_points[].units_recorded` (boolean; must be `true` per row) | network_model_and_telemetry_points |
| `telemetry_points[].latency_class_recorded` (boolean; must be `true` per row) | network_model_and_telemetry_points |
| `telemetry_points[].owner_recorded` (boolean; must be `true` per row) | network_model_and_telemetry_points |
| `der.hosting_capacity_study_recorded` (boolean) | der_interconnection_and_protection |
| `der.hosting_capacity_kw` (number; the record's own declared hosting capacity — the limit for the computed aggregate check below) | der_interconnection_and_protection |
| `der.protection_coordination_min_max_der` (boolean) | der_interconnection_and_protection |
| `der.inverter_dominance_protection_addressed` (boolean) | der_interconnection_and_protection |
| `der.islanding_addressed` (boolean) | der_interconnection_and_protection |
| `der.black_start_addressed` (boolean) | der_interconnection_and_protection |
| `der.point_of_interconnection_recorded` (boolean) | der_interconnection_and_protection |
| `der_units` (list of DER-unit-row objects, each with the entry fields below; computed, see below) | der_interconnection_and_protection |
| `der_units[].unit_id` (string; names the row in the computed outputs) | der_interconnection_and_protection |
| `der_units[].capacity_kw` (number; summed for the computed aggregate check below) | der_interconnection_and_protection |
| `der_units[].ride_through_declared` (boolean; must be `true` per row) | der_interconnection_and_protection |
| `der_units[].anti_islanding_declared` (boolean; must be `true` per row) | der_interconnection_and_protection |
| `latency.tiers_distinguished` (boolean) | latency_tiers_and_control_loops |
| `control_loops` (list of control-loop-row objects, each with the entry fields below; computed, see below) | latency_tiers_and_control_loops |
| `control_loops[].loop_id` (string; names the row in the computed outputs) | latency_tiers_and_control_loops |
| `control_loops[].latency_tier` (string; one of `protection` / `control` / `analytics` — the skill's own three tiers) | latency_tiers_and_control_loops |
| `control_loops[].latency_budget_declared` (boolean; must be `true` per row) | latency_tiers_and_control_loops |
| `control_loops[].shares_path_with_other_tiers` (boolean; gates the justification check below) | latency_tiers_and_control_loops |
| `control_loops[].tier_mixing_justification_recorded` (boolean; required when the loop shares its path with other tiers; otherwise the check passes as not applicable) | latency_tiers_and_control_loops |
| `cyber.purdue_segmentation_documented` (boolean) | ot_cybersecurity |
| `cyber.unidirectional_gateway_telemetry_egress` (boolean) | ot_cybersecurity |
| `cyber.key_management_documented` (boolean) | ot_cybersecurity |
| `cyber.patching_windows_documented` (boolean) | ot_cybersecurity |
| `cyber.incident_fallback_safe_state_documented` (boolean) | ot_cybersecurity |
| `cyber.posture_against_recognized_framework` (boolean) | ot_cybersecurity |
| `pilot.measurable_outcomes_before_deployment` (boolean) | pilot_economics_and_authority |
| `pilot.exit_criteria_before_deployment` (boolean) | pilot_economics_and_authority |
| `pilot.capabilities_staged` (boolean) | pilot_economics_and_authority |
| `pilot.safe_fallback_specified` (boolean) | pilot_economics_and_authority |
| `pilot.kpis_and_fallback_before_energization` (boolean) | pilot_economics_and_authority |
| `economics.cost_stack_recorded` (boolean) | pilot_economics_and_authority |
| `economics.rate_treatment_and_incentives_recorded` (boolean) | pilot_economics_and_authority |
| `economics.operational_authority_in_writing` (boolean) | pilot_economics_and_authority |
| `review.architecture_reviewed_by_qualified_peng` (boolean; a caller declaration this atom records — it performs and verifies no review) | pilot_economics_and_authority |
| `red_lines.protection_setting_changed_without_coordination_study_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.safety_disabled_for_demo_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.flat_it_ot_network_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.field_change_without_switching_authority_clarity_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.vendor_lockin_without_export_exit_plan_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.customer_data_without_consent_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself and limits the record itself declares —
no outside threshold is imported:

- **Telemetry points declared:** the declared
  `telemetry_points` list passes when it is present. An absent
  list is missing evidence. An empty list passes: it declares
  that the record contains no telemetry points.
- **Purpose, units, latency class and owner per point:** every
  declared telemetry-point row must record all four attributes
  the skill requires of every point ("Every point has a
  purpose, units, latency class, and owner"). A row with a
  field absent is missing evidence; a row declaring one false
  fails. On an empty list the check passes vacuously.
- **No telemetry point id duplicated:** no declared point
  `point_id` may appear on more than one row. A row with
  `point_id` absent is missing evidence for this check.
- **DER units declared:** the declared `der_units` list passes
  when it is present, under the same absent/empty rules.
- **Ride-through and anti-islanding per DER unit:** every
  declared DER-unit row must declare both `ride_through_declared`
  and `anti_islanding_declared` true, under the same
  absent/false/vacuous rules.
- **Declared DER total within declared hosting capacity:** the
  sum of the rows' declared `capacity_kw` must not exceed the
  hosting capacity the record itself declares
  (`der.hosting_capacity_kw` — the caller's declared study
  result; this atom supplies no hosting number). Equality
  passes. The check is missing evidence when the list, any
  row's capacity, or the declared hosting capacity is absent.
- **Control loops declared:** the declared `control_loops`
  list passes when it is present, under the same absent/empty
  rules.
- **Latency budget per control loop:** every declared loop row
  must declare `latency_budget_declared` true (the quality
  gate: "Latency budget stated per control loop"), under the
  same absent/false/vacuous rules.
- **Recognized latency tier per control loop:** every declared
  loop row's `latency_tier` must be one of the skill's own
  three tiers — `protection`, `control`, `analytics`. A row
  with the field absent is missing evidence; any other value
  fails.
- **Tier-mixing justification on shared paths:** every loop
  row that declares `shares_path_with_other_tiers` true must
  record `tier_mixing_justification_recorded` true (the skill:
  never mix tier traffic on one path without justification). A
  sharing row with the justification field absent is missing
  evidence; a loop that does not share its path needs no
  justification and passes as not applicable.
- **No control loop id duplicated:** no declared loop
  `loop_id` may appear on more than one row, under the same
  absent rule as point ids.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the eleven primary computed checks above cannot be completed),
the counts `telemetry_points_count`, `der_units_count` and
`control_loops_count` (declared list lengths, or null when a
list is not declared — counts are reported as integers,
exactly), the row-name lists `telemetry_points_incomplete`
(points with an attribute field present but not true),
`der_units_without_ride_through_or_anti_islanding`,
`control_loops_without_latency_budget`,
`control_loops_with_invalid_latency_tier` and
`control_loops_with_unjustified_shared_path` (rows in each
case are named only when the relevant field is present but
invalid; a row with the field absent is missing evidence and
does not appear), `duplicate_telemetry_point_ids` and
`duplicate_control_loop_ids` (ids declared on more than one
row, in the order their second occurrence appears), the
quantities `der_total_capacity_kw` (the declared aggregate,
null when the list or any row's capacity is absent),
`declared_hosting_capacity_kw` and
`hosting_capacity_margin_kw` (declared hosting capacity minus
the declared aggregate, null when either side cannot be
completed), and the ratio `telemetry_points_complete_share`
(points recording all four attributes ÷ declared points).
**Fixed serialization rule:** computed quantities and ratios
are reported as strings with exactly six decimal places,
produced in both implementations by the same rule — round
half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then
format with exactly six decimals; comparisons use the
unrounded values. A quantity is null when its inputs are
absent; a ratio is null when its denominator list is absent
or empty. That fixed serialization is what makes the Python
and TypeScript outputs byte-identical.

The skill states no numeric threshold for this record, so none
is applied. Declined thresholds, named: a hosting-capacity
value or a DER penetration percentage (the only hosting bar is
the record's own declared study result, above); a per-unit
DER capacity limit; a latency budget number for any tier, in
milliseconds, seconds or minutes (the skill names the tiers
qualitatively — protection (ms) vs control (s) vs analytics
(min+) — and only that a budget is stated per loop is
checked); ride-through voltage/frequency curves, ride-through
durations, or an anti-islanding detection time (IEEE 1547
clause values are not imported — only that ride-through and
anti-islanding are declared per unit is checked); protection
setting values, coordination time margins, or a coordination
study's conclusions (only that coordination across min/max DER
conditions and under inverter dominance is recorded as studied
is checked); a minimum telemetry-point count, control-loop
count, or point-list completeness beyond every declared point
carrying the skill's four attributes; a named cybersecurity
framework or control list (only posture documented against a
recognized framework, as declared, is checked); pilot KPI
target values (only that KPIs, outcomes and exit criteria are
defined before deployment/energization is checked); any cost,
rate or incentive figure (only that the cost stack and rate
treatment are recorded is checked).

The verdict is one of `SMART_GRID_DER_DESIGN_PACK_READY`
(all 50 checks pass), `SMART_GRID_DER_DESIGN_PACK_NOT_READY`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails
but evidence is missing), across seven sections:
layered_architecture_and_standards,
network_model_and_telemetry_points,
der_interconnection_and_protection,
latency_tiers_and_control_loops, ot_cybersecurity,
pilot_economics_and_authority, red_lines.

## Distinct ground

The nearest siblings are
`distribution-equipment-rating-condition-check` (a declared
record of distribution equipment — MCC, switchgear and
transformer ratings held against a fault study, nameplates and
declared temperature limits, plus condition evidence: oil/DGA,
IR scans, corona) and `electrical-machinery-engineering-check`
(a declared record of one rotating machine — duty profile,
worst-case torque and power against the machine's own ratings,
specification, acceptance tests, failure analysis and
trending). This atom shares **zero checks** with either
(verified mechanically: every check name here was compared
against the check names produced by `evaluate({})` for every
atom oracle in the fleet — zero overlap fleet-wide, the two
electrical siblings included): every check here is a
smart-grid / DER question — the five-layer architecture and
its single-line + communications diagram pair, the grid
standards map (IEEE 1547, IEC 61850, IEEE 2030.5 / OpenADR,
CIM, clause-level citation), model-before-points with every
telemetry point carrying purpose, units, latency class and
owner, DER units declaring ride-through and anti-islanding
with the declared aggregate held against the record's own
declared hosting capacity, protection coordination recorded
across min/max DER conditions and under inverter dominance,
islanding and black-start addressed, control loops each
declaring a recognized latency tier and a latency budget with
tier-mixing on a shared path justified, Purdue-style
segmentation with unidirectional telemetry egress, key
management, patching windows and incident fallback to a safe
state, pilot KPIs and fallback before energization, the cost
stack and rate treatment, who-opens-the-breaker in writing,
and the grid red lines. The boundary is: a declared smart-grid
/ DER design record here; physical distribution equipment
ratings and condition there; a single machine's duty, sizing
and acceptance tests there.

## Honest scoping

This atom reviews a **declared** smart-grid / DER design
record — it runs no power flow, hosting-capacity or
coordination study, models no feeder, inspects no substation,
IED, inverter or network, and does not verify that any
declared fact is true. A record is ready *on the caller's
declared evidence*: a record that declares a coordination
study across min/max DER conditions, a P.Eng-reviewed
architecture, and an aggregate capacity within its own
declared hosting capacity passes those checks even if the real
project did none of it. It is a completeness and consistency
audit of the design record the skill requires, **not a design
service, not an interconnection approval, not a protection
study, and not engineering advice**: it never designs a
system, sizes a DER unit, sets or approves a protection
setting, judges whether a declared hosting capacity is
correct, or stamps anything.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): the skill's design-production
and advisory work itself — layering a real architecture,
building the network model, performing hosting-capacity,
protection-coordination, ride-through or black-start studies,
specifying points or loops, and explaining DER integration —
is excluded entirely; this atom only audits the record such
work leaves behind. The quality gate's P.Eng review ("Single-line
+ communications architecture reviewed by a qualified P.Eng")
is checked only as a caller declaration recorded in the
record: this atom performs no review, verifies no credential,
and its verdict is not a P.Eng stamp or seal. No numeric
thresholds at all (the skill states none for this record — see
the declined list above); no live verification of any declared
fact; no judgment of design *quality* — whether the declared
architecture, coordination or cyber posture is adequate for
the real feeder is the caller's declaration, checked only for
declared presence and consistency.

## U-13 regulatory screen

**Classification: (b) — screen-NO, flag-with-controls (the
census class).** This atom is in the engineering class — the
class of the disabled `electrical-machines-expert-advice` —
so it is screened with full care, and it is **not** classified
(a) "No outright": its subject matter is electrical
engineering practice territory (DER interconnection,
protection coordination, switching authority on real feeders),
and a bare "ready" verdict over a real project's design record
could be read as engineering judgment if the controls below
were stripped. It is also **not** classified (c)
genuinely-open: every check reduces to deterministic
completeness and consistency over the declared record plus
declared-vs-declared arithmetic (the declared DER aggregate
against the record's own declared hosting capacity) — no check
requires the atom to exercise engineering judgment, produce a
design output, or render advice, so the pfs-class open flag
does not apply. It sits in the precedent class of the live
electrical Tier A atoms
(`distribution-equipment-rating-condition-check`,
`electrical-machinery-engineering-check`,
`vfd-application-engineering-check`): declared-record audit
only, deployed under flag for the owner's per-unit ruling.

Controls (all carried in this document and in the atom's own
record, and binding on any deployment):

1. **Declared-record audit only.** The atom audits a
   caller-declared design record for completeness and internal
   consistency. It produces NO engineering design, NO sizing,
   NO protection settings, NO interconnection approval, NO
   professional advice, and stamps nothing.
2. **Advice/design-production steps excluded as named red
   lines.** The bound skill's design and advisory steps —
   designing the architecture, performing the studies,
   specifying the system, explaining DER integration as advice
   to a caller — are named exclusions (see Honest scoping),
   never served output.
3. **No imported engineering limits.** The only numeric bar is
   declared-vs-declared: the caller's declared DER aggregate
   against the hosting capacity the caller's own record
   declares. Every outside threshold is declined by name
   (above).
4. **P.Eng review is a declaration, never a service.** The
   skill's P.Eng-review quality gate is recorded as a caller
   declaration; the atom performs no review, verifies no
   credential, and issues no stamp.
5. **Exclusion language.** This atom audits a declared record;
   it is not engineering advice and not a design service. That
   language is carried here, in the oracle's docstring, and in
   the verdict's own scoping, and must be carried on any
   serving surface.
6. **Deploy disposition.** Flagged for the owner's explicit
   per-unit ruling under U-13 before any deployment — this
   atom is built locally only and is NOT deployed (see Status).
   The flag does not block authoring; it decides the deploy
   disposition the coordinator reports to the owner.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
