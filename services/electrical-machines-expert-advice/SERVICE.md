# Electrical machines expert advice — `electrical-machines-expert-advice`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): a peer-level expert in motors, drives, and power systems — rigorous, assumptions shown, protection and safety never hand-waved.

A caller submits a declared expert-advice record — the record of one piece of SME advice / assessment — and receives one audit of that record back. **This atom gives no engineering advice itself.** It audits the declared advice record against the deterministic rules the bound skill (`electrical-machines-sme`) itself states: whether the record shows its assumptions, addresses the machine-family topics the skill names for the declared family, addresses drives / protection / standards / calculation topics where the record declares them in scope, defers final protection settings to a documented study, and never publishes settings as fact. One unit of sale = tokens.

**Distinct ground vs the live sibling `electrical-machinery-engineering-check`:** the sibling audits a *machinery engineering manifest* for one machine — duty, sizing against ratings, specification completeness, acceptance tests, failure analysis, trending, and nameplate records, under the `electrical-machinery-engineering` skill. This atom audits an *SME advice / assessment record* under the different `electrical-machines-sme` skill: engagement posture (assumptions shown, protection never hand-waved), family-gated machine analysis across induction / synchronous / transformer / DC machines, VFD control and power-quality topics, protection philosophy (ANSI device vocabulary, settings deferred to a study, never published as fact), hazardous-area classification, the skill's honesty list of calculations, and industrial document workflows (SoW / SDRL / SQRL). The two check sets do not overlap: no duty / sizing / spec / acceptance-test / trending / nameplate check from the sibling is repeated here, and none of this atom's advice-record checks appears in the sibling.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE peer consultation work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the expert-advice record manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_SOUND`). **All fields are booleans unless a type is
explicitly noted in the table**; every non-boolean field carries an
explicit type note. Section fields themselves (`engagement`,
`machine`, `drives`, `protection`, `standards`, `calculations`,
`documents`) are objects holding the fields listed under them.

| Field | Read by |
|---|---|
| `advice_id` (string; carried into the verdict output, not itself checked) | — |
| `engagement.question_or_problem_stated` | engagement |
| `engagement.operating_context_stated` | engagement |
| `engagement.assumptions_stated_explicitly` | engagement |
| `engagement.protection_and_safety_not_handwaved` | engagement |
| `machine.machine_family` (string; one of `induction` / `synchronous` / `transformer` / `dc`; gates the family-specific checks below) | machine_analysis |
| `machine.full_load_current_a` (number; computed with `machine.starting_current_a` — the declared starting-current multiple of FLA is recorded to six decimals, never graded) | machine_analysis |
| `machine.starting_current_a` (number; computed with `machine.full_load_current_a` — see above) | machine_analysis |
| `machine.induction_slip_or_equivalent_circuit_addressed` (required when the family is induction; otherwise the check passes as not applicable) | machine_analysis |
| `machine.induction_torque_speed_addressed` (required when the family is induction; otherwise not applicable) | machine_analysis |
| `machine.induction_losses_or_efficiency_addressed` (required when the family is induction; otherwise not applicable) | machine_analysis |
| `machine.synchronous_excitation_or_avr_addressed` (required when the family is synchronous; otherwise not applicable) | machine_analysis |
| `machine.synchronous_capability_or_power_angle_addressed` (required when the family is synchronous; otherwise not applicable) | machine_analysis |
| `machine.synchronous_synchronization_addressed` (required when the family is synchronous; otherwise not applicable) | machine_analysis |
| `machine.transformer_vector_group_or_impedance_addressed` (required when the family is transformer; otherwise not applicable) | machine_analysis |
| `machine.transformer_inrush_tap_cooling_addressed` (required when the family is transformer; otherwise not applicable) | machine_analysis |
| `machine.transformer_thermal_aging_addressed` (required when the family is transformer; otherwise not applicable) | machine_analysis |
| `machine.dc_excitation_type` (string; one of `separately_excited` / `series` / `shunt`; required when the family is dc, otherwise not applicable) | machine_analysis |
| `machine.dc_retrofit_or_legacy_context_addressed` (required when the family is dc; otherwise not applicable) | machine_analysis |
| `drives.vfd_involved` (gates the five drive checks below) | drives |
| `drives.control_mode` (string; one of `vf` / `sensorless_vector` / `closed_loop_vector`; required when a VFD is involved, otherwise not applicable) | drives |
| `drives.harmonics_addressed` (required when a VFD is involved; otherwise not applicable) | drives |
| `drives.reflected_wave_dvdt_addressed` (required when a VFD is involved; otherwise not applicable) | drives |
| `drives.bearing_currents_addressed` (required when a VFD is involved; otherwise not applicable) | drives |
| `drives.cable_charging_addressed` (required when a VFD is involved; otherwise not applicable) | drives |
| `protection.protection_in_scope` (gates the five in-scope protection checks below; the two standing-rule checks bind regardless) | protection |
| `protection.selectivity_coordination_addressed` (required when protection is in scope; otherwise not applicable) | protection |
| `protection.primary_and_backup_addressed` (required when protection is in scope; otherwise not applicable) | protection |
| `protection.ansi_device_numbers` (list of strings; every entry must be in the skill's own list — `50`, `51`, `87`, `27`, `59`, `81`, `49`, `46`, `32`, `25`, `86` — and the list must be non-empty; required when protection is in scope, otherwise not applicable) | protection |
| `protection.ct_pt_selection_saturation_burden_addressed` (required when protection is in scope; otherwise not applicable) | protection |
| `protection.idmt_curves_and_grading_addressed` (required when protection is in scope; otherwise not applicable) | protection |
| `protection.final_settings_deferred_to_study` | protection |
| `protection.settings_published_as_fact` (must be `false` to pass) | protection |
| `standards.applicable_standards_named` | standards_and_hazloc |
| `standards.standards_applicability_reasons_stated` | standards_and_hazloc |
| `standards.hazardous_area_involved` (gates the three hazloc checks below) | standards_and_hazloc |
| `standards.hazloc_zone_or_division_stated` (required when a hazardous area is involved; otherwise not applicable) | standards_and_hazloc |
| `standards.hazloc_gas_group_and_temp_class_stated` (required when a hazardous area is involved; otherwise not applicable) | standards_and_hazloc |
| `standards.hazloc_ex_method_and_certification_stated` (required when a hazardous area is involved; otherwise not applicable) | standards_and_hazloc |
| `calculations.calculations_relied_upon` (gates the five calculation checks below) | calculations |
| `calculations.short_circuit_addressed` (required when calculations are relied upon; otherwise not applicable) | calculations |
| `calculations.motor_starting_voltage_dip_addressed` (required when calculations are relied upon; otherwise not applicable) | calculations |
| `calculations.grounding_addressed` (required when calculations are relied upon; otherwise not applicable) | calculations |
| `calculations.load_flow_addressed` (required when calculations are relied upon; otherwise not applicable) | calculations |
| `calculations.arc_flash_addressed` (required when calculations are relied upon; otherwise not applicable) | calculations |
| `documents.document_review_in_scope` (gates the four document-workflow checks below) | documents_and_disclosure |
| `documents.sow_addressed` (required when a document review is in scope; otherwise not applicable) | documents_and_disclosure |
| `documents.sdrl_addressed` (required when a document review is in scope; otherwise not applicable) | documents_and_disclosure |
| `documents.sqrl_addressed` (required when a document review is in scope; otherwise not applicable) | documents_and_disclosure |
| `documents.supplier_qualification_addressed` (required when a document review is in scope; otherwise not applicable) | documents_and_disclosure |
| `documents.going_public` (gates the sanitization check below) | documents_and_disclosure |
| `documents.public_sanitization_applied` (required when the content is going public; otherwise not applicable) | documents_and_disclosure |

The verdict is one of `SOUND` (all 44 checks pass), `NOT_SOUND`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections: engagement,
machine_analysis, drives, protection, standards_and_hazloc,
calculations, documents_and_disclosure.

## Declined thresholds — named, not invented

The skill states exactly one numeric reference and no numeric
acceptance thresholds, so none beyond it are applied:

- **Induction starting current ~6x FLA** — the skill states this
  as an approximation ("~6x") with no tolerance band. The
  declared multiple (`starting_current_a` / `full_load_current_a`)
  is therefore *recorded* in the check evidence to six decimals,
  never graded pass/fail against 6.
- **Motor-starting voltage dip** — no permissible dip percentage
  is stated; declined. The calculation is checked as addressed.
- **Short-circuit, grounding, load flow, arc-flash** — no fault
  level, resistance, loading, or incident-energy limit is stated;
  all declined. Each is checked as addressed.
- **Harmonics** — no THD or distortion limit is stated; declined.
- **Reflected wave / dV/dt and cable charging** — no dV/dt limit
  and no "long cable" length threshold is stated; both declined.
- **Protection grading** — no IDMT grading margin, CT saturation
  or burden limit, or dependability/security ratio is stated;
  all declined. Relay setting values themselves are never graded:
  the skill defers final settings to a documented coordination /
  arc-flash study.
- **Machine quantities** — no slip, efficiency, loss, capability,
  impedance, inrush, or thermal-aging limit is stated for any
  family; all declined. Family topics are checked as addressed.

## Non-reducible parts — stated plainly

This atom does not judge the advice. Whether the advice is
technically correct, whether the stated assumptions are the right
ones, whether a protection scheme actually coordinates, whether a
calculation was performed correctly, and whether the engagement
was genuinely peer-level and rigorous are judgment — carried only
as caller declarations in the record (for example
`engagement.protection_and_safety_not_handwaved`), never judged
by the atom. The atom audits the record's declared completeness
and vocabulary against the skill; it is not a substitute for the
SME, a coordination study, or an arc-flash study.

## Pricing

Pricing unit: **tokens**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed; do not submit** — deterministic core, Python oracle, TypeScript port, golden fixtures and differential sweep complete (see the build record in the delivery report). No endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Expert persona, no bounded deliverable — answered by construction: the deliverable is the audit of a declared advice record, bounded to the 44 checks above; the persona itself is not sold.
