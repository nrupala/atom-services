# Electrical machines expert advice — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a piece of electrical-machines expert advice — an SME assessment of a motor, drive, transformer or DC machine question — and a record of what that advice addressed. This atom reads one declared expert-advice record and returns one deterministic audit verdict across seven sections: **SOUND**, **NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It gives no engineering advice itself: it audits the declared record's completeness and vocabulary against the bound skill (`electrical-machines-sme`) — whether the record shows its assumptions, addresses the machine-family topics the skill names for the declared family, addresses drives / protection / standards / calculation topics where the record declares them in scope, defers final protection settings to a documented study, and never publishes settings as fact. It does not judge whether the advice is technically correct, whether the stated assumptions are the right ones, whether a protection scheme actually coordinates, or whether a calculation was performed correctly — those stay caller declarations, never judged by the atom. The one computed check records the declared starting-current multiple of full-load current (`starting_current_a` ÷ `full_load_current_a`, to six decimals) for induction machines; it is recorded, never graded. No numeric threshold is imposed — the skill states the induction starting current of ~6× FLA only as an approximation with no tolerance band, and states no voltage-dip, THD, dV/dt, cable-length, grading-margin or incident-energy limit, so none is invented: those topics are checked as addressed, never re-graded. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "electrical-machines-expert-advice"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/electrical-machines-expert-advice` — tool name `electrical_machines_expert_advice`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/electrical-machines-expert-advice` — body = the manifest object; same `Authorization` header.

## Input — the electrical-machines-expert-advice manifest

| Field | Meaning |
|---|---|
| `advice_id` (string) | advice record identifier; carried into the output, not itself checked |
| `engagement.question_or_problem_stated` | engagement evidence: the question or problem the advice answers is stated |
| `engagement.operating_context_stated` | engagement evidence: the operating context the advice applies to is stated |
| `engagement.assumptions_stated_explicitly` | engagement evidence: assumptions are stated explicitly — shown, never buried |
| `engagement.protection_and_safety_not_handwaved` | engagement evidence: protection and safety are addressed, never hand-waved (caller declaration) |
| `machine.machine_family` (string: `induction` / `synchronous` / `transformer` / `dc`) | computed: must name one of the skill's machine families; gates the family-specific checks below |
| `machine.full_load_current_a` (number) | computed with `machine.starting_current_a`: the declared starting-current multiple of FLA is recorded to six decimals, never graded |
| `machine.starting_current_a` (number) | computed with `machine.full_load_current_a` — see above |
| `machine.induction_slip_or_equivalent_circuit_addressed` | required `true` only when the family is `induction`; otherwise passes as not applicable |
| `machine.induction_torque_speed_addressed` | required `true` only when the family is `induction`; otherwise not applicable |
| `machine.induction_losses_or_efficiency_addressed` | required `true` only when the family is `induction`; otherwise not applicable |
| `machine.synchronous_excitation_or_avr_addressed` | required `true` only when the family is `synchronous`; otherwise not applicable |
| `machine.synchronous_capability_or_power_angle_addressed` | required `true` only when the family is `synchronous`; otherwise not applicable |
| `machine.synchronous_synchronization_addressed` | required `true` only when the family is `synchronous`; otherwise not applicable |
| `machine.transformer_vector_group_or_impedance_addressed` | required `true` only when the family is `transformer`; otherwise not applicable |
| `machine.transformer_inrush_tap_cooling_addressed` | required `true` only when the family is `transformer`; otherwise not applicable |
| `machine.transformer_thermal_aging_addressed` | required `true` only when the family is `transformer`; otherwise not applicable |
| `machine.dc_excitation_type` (string: `separately_excited` / `series` / `shunt`) | required, and must name one of the skill's excitation types, only when the family is `dc`; otherwise not applicable |
| `machine.dc_retrofit_or_legacy_context_addressed` | required `true` only when the family is `dc`; otherwise not applicable |
| `drives.vfd_involved` | gate: declares whether a VFD is involved |
| `drives.control_mode` (string: `vf` / `sensorless_vector` / `closed_loop_vector`) | required, and must name one of the skill's control modes, only when a VFD is involved; otherwise not applicable |
| `drives.harmonics_addressed` | required `true` only when a VFD is involved; otherwise not applicable |
| `drives.reflected_wave_dvdt_addressed` | required `true` only when a VFD is involved; otherwise not applicable |
| `drives.bearing_currents_addressed` | required `true` only when a VFD is involved; otherwise not applicable |
| `drives.cable_charging_addressed` | required `true` only when a VFD is involved; otherwise not applicable |
| `protection.protection_in_scope` | gate: declares whether protection is in scope (the two standing-rule checks below bind regardless) |
| `protection.selectivity_coordination_addressed` | required `true` only when protection is in scope; otherwise not applicable |
| `protection.primary_and_backup_addressed` | required `true` only when protection is in scope; otherwise not applicable |
| `protection.ansi_device_numbers` (list of strings) | computed: required when protection is in scope — the list must be non-empty and every entry must be in the skill's own list (`50`, `51`, `87`, `27`, `59`, `81`, `49`, `46`, `32`, `25`, `86`); otherwise not applicable |
| `protection.ct_pt_selection_saturation_burden_addressed` | required `true` only when protection is in scope; otherwise not applicable |
| `protection.idmt_curves_and_grading_addressed` | required `true` only when protection is in scope; otherwise not applicable |
| `protection.final_settings_deferred_to_study` | standing rule: final settings are deferred to a documented coordination / arc-flash study (binds whether or not protection is in scope) |
| `protection.settings_published_as_fact` | standing rule: must be `false` to pass — settings are never published as fact (binds regardless of scope) |
| `standards.applicable_standards_named` | standards evidence: applicable standards are named |
| `standards.standards_applicability_reasons_stated` | standards evidence: which standards do / do not apply to the scope, and why, is stated |
| `standards.hazardous_area_involved` | gate: declares whether a hazardous area is involved |
| `standards.hazloc_zone_or_division_stated` | required `true` only when a hazardous area is involved; otherwise not applicable |
| `standards.hazloc_gas_group_and_temp_class_stated` | required `true` only when a hazardous area is involved; otherwise not applicable |
| `standards.hazloc_ex_method_and_certification_stated` | required `true` only when a hazardous area is involved; otherwise not applicable |
| `calculations.calculations_relied_upon` | gate: declares whether calculations are relied upon |
| `calculations.short_circuit_addressed` | required `true` only when calculations are relied upon; otherwise not applicable |
| `calculations.motor_starting_voltage_dip_addressed` | required `true` only when calculations are relied upon; otherwise not applicable |
| `calculations.grounding_addressed` | required `true` only when calculations are relied upon; otherwise not applicable |
| `calculations.load_flow_addressed` | required `true` only when calculations are relied upon; otherwise not applicable |
| `calculations.arc_flash_addressed` | required `true` only when calculations are relied upon; otherwise not applicable |
| `documents.document_review_in_scope` | gate: declares whether a document review is in scope |
| `documents.sow_addressed` | required `true` only when a document review is in scope; otherwise not applicable |
| `documents.sdrl_addressed` | required `true` only when a document review is in scope; otherwise not applicable |
| `documents.sqrl_addressed` | required `true` only when a document review is in scope; otherwise not applicable |
| `documents.supplier_qualification_addressed` | required `true` only when a document review is in scope; otherwise not applicable |
| `documents.going_public` | gate: declares whether the content is going public |
| `documents.public_sanitization_applied` | required `true` only when the content is going public; otherwise not applicable |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward NOT_SOUND). All fields are booleans unless noted. Section fields themselves (`engagement`, `machine`, `drives`, `protection`, `standards`, `calculations`, `documents`) are objects holding the fields listed under them.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/electrical-machines-expert-advice`:

```json
{
  "advice_id": "test-001",
  "engagement": {
    "question_or_problem_stated": true,
    "operating_context_stated": true,
    "assumptions_stated_explicitly": true,
    "protection_and_safety_not_handwaved": true
  },
  "machine": {
    "machine_family": "induction",
    "full_load_current_a": 100.0,
    "starting_current_a": 600.0,
    "induction_slip_or_equivalent_circuit_addressed": true,
    "induction_torque_speed_addressed": true,
    "induction_losses_or_efficiency_addressed": true
  },
  "drives": {
    "vfd_involved": false
  },
  "protection": {
    "protection_in_scope": false,
    "final_settings_deferred_to_study": true,
    "settings_published_as_fact": false
  },
  "standards": {
    "applicable_standards_named": true,
    "standards_applicability_reasons_stated": true,
    "hazardous_area_involved": false
  },
  "calculations": {
    "calculations_relied_upon": false
  },
  "documents": {
    "document_review_in_scope": false,
    "going_public": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 44 checks and a text stamp of the verdict):

```json
{
  "service": "electrical-machines-expert-advice",
  "atom_version": "0.1.0",
  "advice_id": "test-001",
  "verdict": "SOUND",
  "sections": {
    "engagement": "pass",
    "machine_analysis": "pass",
    "drives": "pass",
    "protection": "pass",
    "standards_and_hazloc": "pass",
    "calculations": "pass",
    "documents_and_disclosure": "pass"
  },
  "summary": "44 pass, 0 fail, 0 missing of 44 checks across seven sections."
}
```

## Verdicts

- **SOUND** — every check passes; the declared expert-advice record is complete and consistent with the skill's checklist and tenets.
- **NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `advice_id` (the declared string, or null when the manifest does not declare one), the per-section results in `sections` (each `pass`, `fail` or `insufficient_evidence`), the full `checks` array (44 checks, each with `section`, `check`, `status` and `evidence`), a `summary` count line, and a text `stamp` of the verdict. The only computed quantity is the declared starting-current multiple of FLA for induction machines (`starting_current_a` ÷ `full_load_current_a`, formatted to six decimals), reported inside the `evidence` of the `induction_starting_current_multiple_recorded` check — recorded, never graded; when the declared family is not induction that check passes as not applicable, and when the family is induction but either current is absent the check is `missing`. There are no other computed fields and no null-valued computed fields in the response.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
