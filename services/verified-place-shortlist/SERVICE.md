# Verified place shortlist — `verified-place-shortlist`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Find and compare real places — with verified address, hours, and rating signals matched to your constraints.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query. In this atom's deterministic form, the caller submits a **declared place-shortlist record** and receives the shortlist audit verdict as the deliverable: the atom searches for no place, verifies no address, hour or rating against the world, recommends no place and ranks nothing (see Honest scoping). **The "verified" in this atom's name refers to the caller's declared verification discipline — the record's declared evidence that verification was performed — and never to any verification by this atom. This atom fetches nothing live and verifies no real-world fact; any reading of the name as a claim of live verification by the atom is wrong, and this line is the correction.**

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Family outing travel place shortlists**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the verified place shortlist manifest

The caller submits one JSON manifest: a declared place-shortlist
record for one shortlist, made from the shortlist as actually
prepared. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`VERIFIED_PLACE_SHORTLIST_NOT_SOUND`).
All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `shortlist_title` (string; carried into the verdict output, not itself checked) | — |
| `constraints.constraints_declared` (boolean) | constraints_and_criteria |
| `constraints.area_declared` (boolean) | constraints_and_criteria |
| `constraints.visit_timing_declared` (boolean) | constraints_and_criteria |
| `constraints.budget_constraint_declared` (boolean) | constraints_and_criteria |
| `constraints.noise_constraint_declared` (boolean) | constraints_and_criteria |
| `constraints.parking_constraint_declared` (boolean) | constraints_and_criteria |
| `constraints.accessibility_needs_declared` (boolean) | constraints_and_criteria |
| `constraints.candidates_searched_within_declared_constraints` (boolean) | constraints_and_criteria |
| `constraints.only_real_named_results_kept` (boolean) | constraints_and_criteria |
| `criteria` (list of criterion-row objects, each with the entry fields below; computed, see below) | constraints_and_criteria, rating_signals_and_fit |
| `criteria[].criterion_id` (string; must be unique per row) | constraints_and_criteria |
| `criteria[].criterion_name` (non-empty string) | constraints_and_criteria |
| `places` (list of place-row objects, each with the entry fields below; computed, see below) | place_rows_and_verification_evidence, rating_signals_and_fit, ranking_winner_and_backup, freshness_uncertainty_and_alternatives |
| `places[].place_id` (string; must be unique per row) | place_rows_and_verification_evidence |
| `places[].place_name` (non-empty string) | place_rows_and_verification_evidence |
| `places[].address` (non-empty string; must be unique per row, computed) | place_rows_and_verification_evidence |
| `places[].address_verified_from_listing` (boolean; must be `true` per row) | place_rows_and_verification_evidence |
| `places[].existence_confirmed` (boolean; must be `true` per row) | place_rows_and_verification_evidence |
| `places[].hours_status` (string; one of `same_day_verified`, `flagged_unverified`) | place_rows_and_verification_evidence |
| `places[].verification_method` (non-empty string) | place_rows_and_verification_evidence |
| `places[].verification_date` (non-empty string) | place_rows_and_verification_evidence |
| `places[].rating` (number; must be non-negative) | rating_signals_and_fit |
| `places[].review_count` (number; must be positive) | rating_signals_and_fit |
| `places[].recent_complaints_noted` (boolean; must be `true` per row) | rating_signals_and_fit |
| `places[].photo_checked` (boolean; must be `true` per row) | rating_signals_and_fit |
| `places[].criterion_ids_met` (list of strings; computed — must name exactly the declared criteria, see below) | rating_signals_and_fit |
| `places[].special_hours_noted_where_shown` (boolean; must be `true` per row) | freshness_uncertainty_and_alternatives |
| `evaluation.rating_signals_read_critically` (boolean) | rating_signals_and_fit |
| `evaluation.fit_checked_beyond_rating` (boolean) | rating_signals_and_fit |
| `ranking.ranking_recorded` (boolean) | ranking_winner_and_backup |
| `ranking.ranking_based_on_declared_criteria` (boolean) | ranking_winner_and_backup |
| `ranking.winner_place_id` (string; computed — must name a declared place, see below) | ranking_winner_and_backup |
| `ranking.winner_rationale_recorded` (boolean) | ranking_winner_and_backup |
| `ranking.winner_drawback_recorded` (boolean) | ranking_winner_and_backup |
| `ranking.winner_map_ready_address_declared` (boolean) | ranking_winner_and_backup |
| `ranking.winner_hours_recorded` (boolean) | ranking_winner_and_backup |
| `ranking.winner_booking_or_queue_warning_recorded` (boolean) | ranking_winner_and_backup |
| `ranking.timing_matters` (boolean; gates the backup check below) | ranking_winner_and_backup |
| `ranking.backup_place_id` (string; computed where timing matters — must name a declared place other than the winner, see below) | ranking_winner_and_backup |
| `handling.hours_flagged_unverified_when_not_same_day_confirmed` (boolean) | freshness_uncertainty_and_alternatives |
| `handling.listings_checked_for_staleness_duplication_and_closure` (boolean) | freshness_uncertainty_and_alternatives |
| `handling.stale_duplicate_or_closed_listings_flagged` (boolean) | freshness_uncertainty_and_alternatives |
| `handling.no_unconfirmed_place_used_to_fill_gap` (boolean) | freshness_uncertainty_and_alternatives |
| `handling.original_area_has_no_verified_options` (boolean; gates the nearest-area check below) | freshness_uncertainty_and_alternatives |
| `handling.nearest_verified_area_offered` (boolean; required when the gate above is declared `true`; otherwise the check passes as not applicable) | freshness_uncertainty_and_alternatives |
| `red_lines.invented_address_hours_rating_or_photo_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.stale_hours_presented_as_current_fact_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.place_breaking_stated_constraint_recommended_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.ranking_by_rating_alone_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unverified_listing_passed_as_confirmed_open_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Twenty-two checks are computed from the declared rows, using
only the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Criteria declared:** the declared `criteria` list passes
  when it is present and names at least one criterion. An
  absent list is missing evidence; an empty list fails — it
  declares no criteria at all.
- **Criterion ids unique:** no declared `criterion_id` may
  appear on more than one row. A row with `criterion_id`
  absent is missing evidence for this check.
- **Criterion name per criterion:** every declared criterion
  row declares a non-empty `criterion_name`, named in
  `verified_place_criteria_without_name` when empty.
- **Places declared:** the declared `places` list passes when
  it is present and names at least two places. An absent list
  is missing evidence; a list of fewer than two fails — a
  shortlist ranked against its criteria with a backup kept is
  comparative by its own framing, and one row ranks nothing
  and backs nothing up.
- **Place ids unique:** no declared `place_id` may appear on
  more than one row.
- **Place name per place:** every declared place row declares
  a non-empty `place_name`, named in
  `verified_places_without_name` when empty.
- **Address per place:** every declared place row declares a
  non-empty `address`, named in `verified_places_without_address`
  when empty.
- **Addresses unique:** no declared `address` may appear on
  more than one row — a duplicated address is the
  duplicate-listing signal the skill says to flag, not repeat;
  duplicates are named in `duplicate_verified_place_addresses`.
- **Address verified per place:** every declared place row
  declares `address_verified_from_listing` true — its address
  was verified from the listing itself, on the caller's
  declared evidence.
- **Existence confirmed per place:** every declared place row
  declares `existence_confirmed` true.
- **Hours status recognised:** every declared place's
  `hours_status` is one of `same_day_verified`,
  `flagged_unverified` — the two states the skill's hours gate
  works with. Any other value fails and is named in
  `verified_places_with_unrecognised_hours_status`.
- **Verification method per place:** every declared place row
  declares a non-empty `verification_method`, named in
  `verified_places_without_verification_method` when empty.
- **Verification date per place:** every declared place row
  declares a non-empty `verification_date` — the declared
  freshness of its evidence — named in
  `verified_places_without_verification_date` when empty.
- **Rating per place:** every declared place declares a
  non-negative `rating`. A row with the field absent is
  missing evidence; a negative rating fails and is named in
  `verified_places_with_invalid_rating`. No rating scale is
  imposed and no rating is judged good or bad — see the
  declined thresholds.
- **Review count per place:** every declared place declares a
  positive `review_count`. A count of zero declares no review
  volume at all — internal consistency of the declared
  evidence, not an imported volume bar; any positive count
  passes. Offenders are named in
  `verified_places_with_invalid_review_count`.
- **Recent complaints noted per place:** every declared place
  row declares `recent_complaints_noted` true — what its
  recent reviews actually complain about was noted.
- **Photo checked per place:** every declared place row
  declares `photo_checked` true.
- **Criterion mapping per place:** every declared place row
  declares its `criterion_ids_met` list. A row with the field
  absent is missing evidence.
- **Criterion mapping names only declared criteria:** every
  declared place's mapping names no criterion other than a
  declared one; offenders are named in
  `verified_places_with_extra_criterion_ids`.
- **Every place meets every declared criterion:** every
  declared place's mapping covers every declared criterion,
  exactly the skill's gate — the shortlist respects every
  constraint stated, and no shortlisted place breaks one.
  Offenders are named in
  `verified_places_not_meeting_all_declared_criteria`.
- **Winner resolves:** the declared `ranking.winner_place_id`
  names one of the declared places. An absent winner id, or a
  record with the places list absent, is missing evidence; an
  id naming no declared place fails. The atom checks **only**
  that the reference resolves — it never checks that the
  winner is the best, highest-rated or top-ranked place.
- **Special hours noted per place:** every declared place row
  declares `special_hours_noted_where_shown` true — holiday
  or special hours were noted where shown for the day in
  question.

Two further checks are gated on the record's own declared
gate fields, following the skill's own conditional scope —
when a gate is declared `false`, the check passes as not
applicable; when the gate field is absent, the check is
missing evidence; when the gate is `true`, the target is
required:

- **Backup resolves and differs where timing matters:** the
  declared backup is required only where
  `ranking.timing_matters` is declared `true` (the skill:
  keep one backup option in case the winner is closed or full
  on arrival, where timing matters). When the gate is `true`,
  `ranking.backup_place_id` must name a declared place other
  than the winner; an absent backup id is missing evidence
  and an id naming no declared place, or the winner itself,
  fails.
- **Nearest verified area offered where no verified
  options:** the nearest-area offer is required only where
  `handling.original_area_has_no_verified_options` is
  declared `true` (the skill: offer the nearest area that
  does have verified options instead of widening silently).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the twenty-two primary computed checks above cannot be
completed), `verified_places_count` and
`verified_place_criteria_count` (the declared list lengths, or
null when a list is not declared — counts are reported as
integers, exactly), the duplicate lists
`duplicate_verified_place_ids`,
`duplicate_verified_place_criterion_ids` and
`duplicate_verified_place_addresses`, the row-name lists named
in the computed checks above,
`verified_places_total_review_count` (the sum of the declared
review counts), and the ratios
`place_address_verification_ratio` (places declaring their
address verified from the listing ÷ declared places),
`place_hours_same_day_verified_ratio` (places whose hours
status is `same_day_verified` ÷ declared places),
`place_criterion_coverage_ratio` (places meeting every
declared criterion ÷ declared places) and
`place_rating_evidence_ratio` (places declaring both a rating
and a review count ÷ declared places). **Fixed serialization
rule:** computed quantities and ratios are reported as strings
with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals. A ratio is null when its denominator list is
absent or empty (the criterion-coverage ratio is also null
when the criteria list is not declared). That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric threshold at all — its demands
are constraint fit, declared verification discipline and
honest flagging, not bars the atom can set. Quantities are
computed and reported; the only bars on the computed rows are
completeness, exact set coverage and reference resolution over
the caller's own declared rows, exactly as stated above.
Declined thresholds, named: a minimum rating or star bar (a
declared rating is evidence, never judged good or bad); a
minimum review count beyond existence (any positive count
passes — no volume bar such as 50 or 100 reviews is set); a
maximum age for a verification date, or any check that a
declared verification date is recent, today, or the visit day
(dates are caller-declared strings, reported as declared —
the atom has no clock and verifies no date against the
world); a budget or price ceiling (no price is even a field
of this record); a distance, travel-time or area-radius bar;
a place-count maximum, or a criterion-count bar beyond at
least one criterion and at least two places; a conformity bar
against any places provider, listing source or map service
(the record declares its own verification method — no
provider is prescribed); any judgment that the declared
winner is the right, best or highest-rated place (only that
its reference resolves and its declared winner record is
complete).

The verdict is one of `VERIFIED_PLACE_SHORTLIST_SOUND` (all
51 checks pass), `VERIFIED_PLACE_SHORTLIST_NOT_SOUND` (any
check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across six sections:
constraints_and_criteria, place_rows_and_verification_evidence,
rating_signals_and_fit, ranking_winner_and_backup,
freshness_uncertainty_and_alternatives, red_lines.

## Distinct ground

The nearest siblings are `sourced-visual-reference-search` (a
declared visual-reference search record — image results with
their source pages, depiction context and licensing),
`single-living-trip-itinerary` (one trip's living itinerary
record — flights, stays, ground transport and activities in
idea / held / booked states, with declared totals and
conflict flags), and `home-shortlist-carrying-cost-comparison`
(a home-purchase shortlist's carrying-cost comparison). This
atom shares **zero checks** with any of them (verified
mechanically by enumerating `evaluate({})` check names from
every atom oracle in `services/*/src/*.py` and comparing —
zero overlap): every check here is a place-shortlist question
— declared visit constraints (area, timing, budget, noise,
parking, accessibility) and shortlist criteria, per-place
declared verification evidence (address verified from the
listing itself, hours status same-day-verified or
flagged-unverified, verification method and verification
date, rating with review volume and recent complaints, photo
checked), every shortlisted place meeting every declared
criterion, a declared winner that resolves with its honest
drawback, map-ready address and booking / queue warning, a
backup that resolves and differs where timing matters, and
stale / duplicate / closed listing flagging. The boundary is:
one visit place shortlist here; an image reference set, a
whole trip itinerary, and a home-buying cost comparison there.

## Honest scoping

This atom reviews a **declared** place-shortlist record — it
searches for no place, fetches no listing, opens no map,
verifies no address, hour, rating or photo against the world,
and recommends, chooses, ranks and books nothing. A shortlist
is sound *on the caller's declared evidence*: a record that
declares its addresses verified, its hours same-day checked
and its criteria met passes those checks even if the real
shortlist did none of it. It is a completeness and consistency
audit of the shortlist record the skill requires, **not a
place search, a live verification, a recommendation, or a
guarantee that any place exists, is open, or is as described**:
it never judges whether a declared address is real, whether
declared hours are correct, whether a declared rating is
fair, or whether the declared winner should be visited — only
that the record contains what the skill's method and red
lines demand, and that its declared rows are internally
consistent. The scaffold's named doubt, "commodity local
search", is resolved exactly here: the live search is the
commodity, and it is **not** what this atom sells — the atom
sells the audit of the declared record's verification
discipline, and performs no search at all.

Named exclusions and non-reducible parts (excluded by name,
never performed): searching live for places (any places API,
search engine or map lookup); verifying any address, opening
hour, rating, review, photo or business existence against the
world; claiming — in the verdict, the stamp, or anywhere else
— that this atom verified a place (the honesty line in What
it delivers is a red line of this atom, not a disclaimer);
recommending or choosing a place for the caller; ranking
places as the atom's own output (checking a **declared**
winner and backup's references is audit, not advice);
booking, reserving or queuing for any place; judging that the
declared winner is the best, highest-rated or top-ranked
place; and providing navigation or directions — each is
EXCLUDED by name from this atom, which audits only the
declared record. Boundary case, named: a shortlist with
genuinely only one verified place in its area cannot pass
this record format's places-declared check (the format
requires at least two compared places with a backup kept —
such a shortlist is outside this atom's computed reach, not
failed on its merits; its record's honest move under the
skill is the nearest-verified-area declaration, which this
atom does check where declared).

## U-13 regulatory screen

Screen classification: **(a) — screen-No outright.** Keyword
screen: the bound skill and this record name places,
addresses, opening hours and ratings — no regulated subject
(securities / financial advice, health, legal, engineering
practice, psychology) is the atom's output, and no place
category handled by this record is itself a regulated
activity: the record is about cafes, shops, services and
attractions as visit options. Substance screen: this atom's
output could not itself read as regulated professional advice
in any case — it audits a caller-**declared** shortlist record
for completeness and internal consistency only (constraints
and criteria declarations, per-row declared verification
evidence recomputed over the declared rows, criterion
coverage, winner / backup reference resolution, freshness and
uncertainty declarations, and the skill's red lines refused);
every output is a pass / fail / missing verdict on the record
or a quantity recomputed from the caller's own declared rows.
It performs no live search or verification, makes no
recommendation, and states no fact about any real place, so
there is no advice-shaped output for a flag-with-controls
class to attach to; the one real hazard — a caller reading
"verified" as this atom's own live verification — is closed
by the honesty line in What it delivers, which is a red line
of the atom, not a control on a regulated output. This is
therefore class (a), not the census flag-with-controls class
and not the genuinely-open personal-financial-snapshot class
(no personal position of any kind is handled). No deploy
happens on this atom without the owner's explicit per-unit
ruling in any case.

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **AUTHORED + STAGED — not deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
