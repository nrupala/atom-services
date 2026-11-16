# Behavioral finance bias check — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are about to act on an investment decision. This atom reads a
declared bias-check pack for one decision — the bias playbook and
its counters, pre-commitment and written thesis, the 48-hour
cooling-off, the decision journal, watch-and-challenge discipline,
and the temptation red lines — and returns one deterministic
verdict across six sections: **BIAS_CHECK_CLEAR**,
**BIAS_CHECK_FAILED**, or **INSUFFICIENT_EVIDENCE** (nothing
failed, but evidence is missing — the verdict names exactly
which). Three checks are computed: the declared position size
must sit at or below your own declared sizing cap, an entry
decision must show at least 48 elapsed cooling-off hours, and
every bias you declare considered must carry its applied
counter. Same manifest in → same verdict out. The atom audits
the record you declare; it does not give investment advice or
judge whether the decision itself is wise.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "behavioral-finance-bias-check"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/behavioral-finance-bias-check`
  — tool name `behavioral_finance_bias_check`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/behavioral-finance-bias-check`
  — body = the manifest object; same `Authorization` header.

## Input — the bias-check manifest

| Field | Meaning |
|---|---|
| `decision` | decision label (string; carried into the output, not checked) |
| `decision_context.is_entry` | gates the written-thesis and cooling-off checks |
| `decision_context.is_major_move` | gates the advisor-set discussion check |
| `bias_playbook.loss_aversion_precommitted_exits_set` / `loss_aversion_reunderwritten_instead_of_waiting_to_get_even` / `anchoring_own_valuation_written_before_market_price_targets` / `recency_base_rates_and_long_windows_used` / `confirmation_disconfirming_evidence_present` / `sunk_cost_would_buy_today_test_applied` | bias playbook counters |
| `bias_playbook.overconfidence_sizing_cap_percent`, `bias_playbook.overconfidence_position_size_percent` | computed sizing gate: position size must be at or below your declared cap |
| `bias_playbook.biases_considered` | list of `{bias, counter_applied}`; computed: a non-empty list passes only when every entry has `counter_applied: true` (the `bias` label is yours — no vocabulary is imposed) |
| `precommitment.written_rules_present` / `stop_levels_set` | pre-commitment evidence |
| `precommitment.thesis_written` | required when the decision is an entry; otherwise not applicable |
| `cooling_off.hours_elapsed` | computed cooling-off gate: for an entry decision, must be at least 48; otherwise not applicable |
| `cooling_off.periods_honored_for_impulsive_ideas` | cooling-off discipline |
| `journal.decision_recorded` / `expected_outcome_recorded` / `actual_outcome_and_lessons_recorded` / `current_with_outcomes_and_lessons` / `reviewed_monthly` / `hit_rate_tracked_honestly` | decision journal evidence |
| `watch_and_challenge.continuous_price_watching` | must be `false` to pass |
| `watch_and_challenge.scheduled_reviews_used` / `notifications_off` / `devils_advocate_round_assigned` / `slept_on_material_changes` | watch-and-challenge evidence |
| `watch_and_challenge.major_move_discussed_with_advisor_set_documented` | required when the decision is a major move; otherwise not applicable |
| `temptation_and_red_lines.one_click_trading_paths_removed` | temptation architecture |
| `temptation_and_red_lines.decision_driven_by_headlines` / `decision_driven_by_streaks` / `decision_driven_by_moods` / `journal_skipped_for_this_decision` | all must be `false` to pass (red lines) |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check
fails (counts toward BIAS_CHECK_FAILED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/behavioral-finance-bias-check`:

```json
{
  "decision": "Buy AAPL",
  "decision_context": {
    "is_entry": true,
    "is_major_move": false
  },
  "bias_playbook": {
    "loss_aversion_precommitted_exits_set": true,
    "loss_aversion_reunderwritten_instead_of_waiting_to_get_even": true,
    "anchoring_own_valuation_written_before_market_price_targets": true,
    "recency_base_rates_and_long_windows_used": true,
    "overconfidence_sizing_cap_percent": 10.0,
    "overconfidence_position_size_percent": 5.0,
    "confirmation_disconfirming_evidence_present": true,
    "sunk_cost_would_buy_today_test_applied": true,
    "biases_considered": [
      {
        "bias": "Anchoring",
        "counter_applied": true
      }
    ]
  },
  "precommitment": {
    "written_rules_present": true,
    "stop_levels_set": true,
    "thesis_written": true
  },
  "cooling_off": {
    "hours_elapsed": 48.0,
    "periods_honored_for_impulsive_ideas": true
  },
  "journal": {
    "decision_recorded": true,
    "expected_outcome_recorded": true,
    "actual_outcome_and_lessons_recorded": true,
    "current_with_outcomes_and_lessons": true,
    "reviewed_monthly": true,
    "hit_rate_tracked_honestly": true
  },
  "watch_and_challenge": {
    "continuous_price_watching": false,
    "scheduled_reviews_used": true,
    "notifications_off": true,
    "devils_advocate_round_assigned": true,
    "slept_on_material_changes": true
  },
  "temptation_and_red_lines": {
    "one_click_trading_paths_removed": true,
    "decision_driven_by_headlines": false,
    "decision_driven_by_streaks": false,
    "decision_driven_by_moods": false,
    "journal_skipped_for_this_decision": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 30 checks
and a text stamp of the verdict):

```json
{
  "service": "behavioral-finance-bias-check",
  "atom_version": "0.1.0",
  "decision": "Buy AAPL",
  "verdict": "BIAS_CHECK_CLEAR",
  "sections": {
    "bias_playbook": "pass",
    "precommitment_and_thesis": "pass",
    "cooling_off": "pass",
    "decision_journal": "pass",
    "watch_and_challenge": "pass",
    "temptation_and_red_lines": "pass"
  },
  "computed_status": "within_limits_on_declared_evidence",
  "biases_considered_count": 1,
  "position_size_over_cap_percent": "-5.0000",
  "cooling_off_hours_below_48": "0.0000",
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections."
}
```

## Verdicts

- **BIAS_CHECK_CLEAR** — every check passes; the decision is clear on the declared evidence.
- **BIAS_CHECK_FAILED** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_limits_on_declared_evidence` / `outside_limits_on_declared_evidence` / null when either primary computed check — sizing cap, cooling-off — cannot be completed), `biases_considered_count` (the declared list length, or null), `position_size_over_cap_percent` (declared position size minus declared cap, string with exactly four decimals, or null) and, for an entry decision, `cooling_off_hours_below_48` (48 minus declared hours elapsed, or null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
