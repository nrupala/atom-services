# Negotiation preparation pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are preparing for one negotiation — BATNA, reservation price and ZOPA, interests behind positions, fallback plans, anchoring, tactics and a debrief — and you have a record of that preparation, made before the table. This atom reads one declared manifest and returns one deterministic verdict across five sections (batna_reservation_price_and_zopa, interests_and_value_creation, improvisation_and_adaptation, openings_moments_closing_and_tactics, debrief_and_anti_pattern_red_lines): **NEGOTIATION_PREPARATION_SOUND**, **NEGOTIATION_PREPARATION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 44 checks. It audits the declared record's completeness and consistency only — it prepares no negotiation itself, negotiates nothing, coaches no live improvisation, reads no counterpart, and does not verify that a declared preparation was ever carried out. A preparation is sound *on your declared evidence*: it never judges whether the declared BATNA is genuinely strong, whether the reservation price is the right number, whether a ZOPA truly exists, or whether the plan is good. The five computed checks: the declared `issues` list must be present and non-empty; every issue row must name a non-empty own underlying interest; every row must name a non-empty counterpart underlying interest; every row must have its trade potential assessed; and no issue `name` may appear on more than one row. The anchoring check is gated: `anchor_first_planned_when_informed` is missing when the gate or the field itself is absent, passes as not applicable when `anchoring.informed_enough_to_anchor_first` is `false`, and when the gate is `true` passes only when `anchor_first_planned` is `true`. No numeric threshold is imposed — no reservation-price figure or minimum distance between the reservation price and any offer, no ZOPA width or minimum overlap between the two sides' ranges, no BATNA strength, quality or attractiveness score, no number of issues a preparation must contain beyond the one declared issues list being non-empty, no number of fallback plans beyond the skill's own stated Plan B (and C), no anchoring amount, percentage or first-offer figure, no coverage percentage below completeness, and no debrief quality or learning-outcome score. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "negotiation-preparation-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/negotiation-preparation-pack` — tool name `negotiation_preparation_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/negotiation-preparation-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `negotiation` | negotiation name (string; carried into the output, not checked) |
| `batna_and_reservation.batna_identified` | BATNA evidence: the Best Alternative To a Negotiated Agreement is identified |
| `batna_and_reservation.batna_strengthened` | BATNA evidence: the BATNA is strengthened, not only known |
| `batna_and_reservation.reservation_price_set` | reservation-price evidence: the walk-away number is set before the table |
| `batna_and_reservation.counterpart_reservation_estimated` | reservation-price evidence: the counterpart's walk-away range is estimated |
| `batna_and_reservation.zopa_assessed` | ZOPA evidence: the Zone of Possible Agreement — where the two reservation ranges overlap — is assessed |
| `batna_and_reservation.walk_away_commitment_declared` | reservation-price evidence: walking away beyond the reservation number is committed to in advance |
| `batna_and_reservation.fundamentals_prepared_before_negotiation` | fundamentals evidence: the fundamentals are prepared before the table |
| `interests.own_interests_identified` | interests evidence: your own underlying interests are identified, not only the stated demand |
| `interests.counterpart_interests_identified` | interests evidence: the counterpart's underlying interests are identified, not only their stated demand |
| `interests.counterpart_why_to_be_asked_planned` | interests evidence: asking why the counterpart wants what they ask for is planned |
| `interests.interests_not_positions_framing_adopted` | interests evidence: the negotiation is framed on underlying interests, not positions |
| `value_creation.value_created_before_claiming_planned` | value-creation evidence: expanding the pie is planned before claiming a share of it |
| `value_creation.non_zero_sum_opportunities_sought` | value-creation evidence: the deal is not treated as zero-sum — opportunities to create value are sought |
| `value_creation.trade_across_differently_valued_issues_planned` | value-creation evidence: trading across issues the two sides value differently is planned |
| `issues` (list of issue-row objects) | computed: must be present and non-empty; reported as `issues_count` |
| `issues[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row (reported in `duplicate_issue_names`) |
| `issues[].own_underlying_interest` (string) | computed: every row must name a non-empty own underlying interest; rows with the field present but empty are reported in `issues_without_own_interest` |
| `issues[].counterpart_underlying_interest` (string) | computed: every row must name a non-empty counterpart underlying interest; rows with the field present but empty are reported in `issues_without_counterpart_interest` |
| `issues[].trade_potential_assessed` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `issues_without_trade_potential_assessed` |
| `direction.sense_of_direction_stated` | direction evidence: a sense of direction is stated — a map that orients even when the terrain differs |
| `direction.plan_not_script_approach_adopted` | direction evidence: the plan is carried as orientation, not as a rigid script |
| `direction.plan_b_prepared` | direction evidence: a Plan B is carried |
| `direction.plan_c_prepared` | direction evidence: a Plan C is carried, beyond Plan B |
| `presence_and_awareness.own_emotional_state_management_planned` | presence evidence: managing your own emotional state during the negotiation is planned |
| `presence_and_awareness.composure_commitment_declared` | presence evidence: staying composed is committed to in advance |
| `presence_and_awareness.situational_awareness_planned` | presence evidence: reading shifting interests, constraints and emotions in real time is planned |
| `sequence.opening_planned` | sequence evidence: the opening is planned |
| `sequence.critical_moments_recognition_planned` | sequence evidence: recognizing the critical moments — the pivot points — is planned |
| `sequence.closing_cleanly_planned` | sequence evidence: closing cleanly is planned |
| `anchoring.informed_enough_to_anchor_first` | anchoring gate: whether you are informed enough to anchor first (the applicability gate for the gated anchoring check) |
| `anchoring.anchor_first_planned` | gated anchoring evidence: anchoring first is planned — applies only when `informed_enough_to_anchor_first` is `true` |
| `tactics.counterpart_yes_made_easy_planned` | tactics evidence: making the counterpart's yes easy is planned |
| `tactics.people_separated_from_problem_declared` | tactics evidence: the people are separated from the problem |
| `tactics.hard_on_problem_soft_on_person_declared` | tactics evidence: hard on the problem, soft on the person is declared |
| `tactics.fair_enough_agreement_aim_declared` | tactics evidence: the aim is a fair-enough agreement that holds, not a maximal extraction |
| `learning.debrief_planned_after_negotiation` | debrief evidence: a debrief after the negotiation is planned |
| `learning.deliberate_debrief_review_committed` | debrief evidence: the debrief is a deliberate review, committed to in advance |
| `learning.misleading_feedback_caution_acknowledged` | debrief evidence: negotiation is a wicked learning environment where feedback misleads — that caution is acknowledged |
| `red_lines.no_batna_present` | must be `false` to pass (red line: no BATNA is present in the preparation) |
| `red_lines.arguing_positions_present` | must be `false` to pass (red line: arguing positions is not present in the preparation) |
| `red_lines.treating_everything_as_zero_sum_present` | must be `false` to pass (red line: treating everything as zero-sum is not present in the preparation) |
| `red_lines.rigid_script_reliance_present` | must be `false` to pass (red line: reliance on a rigid script is not present in the preparation) |
| `red_lines.losing_composure_present` | must be `false` to pass (red line: losing composure is not present in the preparation) |
| `red_lines.never_debriefing_present` | must be `false` to pass (red line: never debriefing is not present in the preparation) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward NEGOTIATION_PREPARATION_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/negotiation-preparation-pack`:

```json
{
  "negotiation": "Vendor Service Level Agreement",
  "batna_and_reservation": {
    "batna_identified": true,
    "batna_strengthened": true,
    "reservation_price_set": true,
    "counterpart_reservation_estimated": true,
    "zopa_assessed": true,
    "walk_away_commitment_declared": true,
    "fundamentals_prepared_before_negotiation": true
  },
  "interests": {
    "own_interests_identified": true,
    "counterpart_interests_identified": true,
    "counterpart_why_to_be_asked_planned": true,
    "interests_not_positions_framing_adopted": true
  },
  "value_creation": {
    "value_created_before_claiming_planned": true,
    "non_zero_sum_opportunities_sought": true,
    "trade_across_differently_valued_issues_planned": true
  },
  "issues": [
    {
      "name": "Price",
      "own_underlying_interest": "Maintain budget",
      "counterpart_underlying_interest": "Maximize margin",
      "trade_potential_assessed": true
    }
  ],
  "direction": {
    "sense_of_direction_stated": true,
    "plan_not_script_approach_adopted": true,
    "plan_b_prepared": true,
    "plan_c_prepared": true
  },
  "presence_and_awareness": {
    "own_emotional_state_management_planned": true,
    "composure_commitment_declared": true,
    "situational_awareness_planned": true
  },
  "sequence": {
    "opening_planned": true,
    "critical_moments_recognition_planned": true,
    "closing_cleanly_planned": true
  },
  "anchoring": {
    "informed_enough_to_anchor_first": true,
    "anchor_first_planned": true
  },
  "tactics": {
    "counterpart_yes_made_easy_planned": true,
    "people_separated_from_problem_declared": true,
    "hard_on_problem_soft_on_person_declared": true,
    "fair_enough_agreement_aim_declared": true
  },
  "learning": {
    "debrief_planned_after_negotiation": true,
    "deliberate_debrief_review_committed": true,
    "misleading_feedback_caution_acknowledged": true
  },
  "red_lines": {
    "no_batna_present": false,
    "arguing_positions_present": false,
    "treating_everything_as_zero_sum_present": false,
    "rigid_script_reliance_present": false,
    "losing_composure_present": false,
    "never_debriefing_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 44 checks and a text stamp of the verdict):

```json
{
  "service": "negotiation-preparation-pack",
  "atom_version": "0.1.0",
  "negotiation": "Vendor Service Level Agreement",
  "verdict": "NEGOTIATION_PREPARATION_SOUND",
  "sections": {
    "batna_reservation_price_and_zopa": "pass",
    "interests_and_value_creation": "pass",
    "improvisation_and_adaptation": "pass",
    "openings_moments_closing_and_tactics": "pass",
    "debrief_and_anti_pattern_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "issues_count": 1,
  "issues_without_own_interest": [],
  "own_interest_coverage": "1.000000",
  "issues_without_counterpart_interest": [],
  "counterpart_interest_coverage": "1.000000",
  "issues_without_trade_potential_assessed": [],
  "trade_potential_assessed_coverage": "1.000000",
  "duplicate_issue_names": [],
  "summary": "44 pass, 0 fail, 0 missing of 44 checks across five sections."
}
```

## Verdicts

- **NEGOTIATION_PREPARATION_SOUND** — every check passes; the declared negotiation-preparation record is complete and consistent with the skill's checklist and red lines.
- **NEGOTIATION_PREPARATION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `issues_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `issues_without_own_interest`, `issues_without_counterpart_interest` and `issues_without_trade_potential_assessed` and the name list `duplicate_issue_names` (null when the `issues` list is not declared; an issue with the relevant field absent is missing evidence and does not appear in the first three lists), the coverage values `own_interest_coverage`, `counterpart_interest_coverage` and `trade_potential_assessed_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
