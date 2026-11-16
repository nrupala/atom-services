# Base-rate card — `base-rate-card`

**Base-rate card** · slug `base-rate-card` · deliverable type DELIVERABLE · atom version 0.1.0 · status live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is from that recording.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "base-rate-card"}`. Send the key as `Authorization: Bearer <key>` on every call.
2. **Assemble the manifest.** The manifest is one JSON object: a declared record for one claim. In the recorded run the claim is `The project will launch on time.` — one judgment card for a single claim, worked through the bound skill's method with the base-rate step at its centre — a reference class of 100 cases with 50 successes and a stated base rate of 0.5 (exactly the rate the counts imply), a steelman, a seven-entry fallacy spot-check, and a stated confidence of 0.8. Build yours field by field from the Input reference below; leave a field out only if you want it reported as missing evidence.
3. **Call the atom.** `POST https://atoms.pipavia.com/v1/base-rate-card` with the manifest as the body and the `Authorization` header set (see How-to guides for the MCP form of the same call).
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `CARD_COMPLETE`: 23 pass, 0 fail, 0 missing of 23 checks across six sections. Every section status is `pass` and every check status is `pass`.
5. **Use the detail.** The `checks` array names each of the 23 checks with its section and the evidence it read; `summary` counts pass / fail / missing; `stamp` is the same verdict as a plain-text stamp you can paste into a record. If any check had failed or been missing, the verdict, the section statuses and the check statuses would name exactly which — that is the subject of the third how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "base-rate-card"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call: `POST https://atoms.pipavia.com/v1/base-rate-card` — body = the manifest object (see Input reference). The response is the verdict object (see Output format).

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/base-rate-card` with the same `Authorization: Bearer <key>` header, and call the tool `base_rate_card`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same verdict object the REST face returns (external verification confirmed MCP/REST parity on the full-pass case; see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

A verdict other than `CARD_COMPLETE` is not an error — it is the deliverable doing its job. Read it in this order:

1. **Verdict.** `CARD_NOT_COMPLETE` — At least one check fails; the failing checks name the breached section and the evidence against it. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing.
2. **Sections.** The `sections` object gives one status per section: `pass`, `fail`, or `insufficient_evidence`. Start with the sections that are not `pass`.
3. **Checks.** In the `checks` array, find entries with status `fail` (a field was present but did not meet the requirement — for a must-be-`false` field, it was declared `true`; for a computed check, the declared values did not satisfy the computed rule) and entries with status `missing` (the supporting field was absent from the manifest). Each check's `evidence` string states what the check requires.
4. **Fix the manifest, not the verdict.** For a `fail`, correct the declared value in the underlying record, then redeclare it truthfully. For a `missing`, supply the absent field. Then resubmit the whole manifest — the atom is stateless and deterministic, so the same manifest always returns the same verdict.
Worked example 2 below is a real failing run of this atom: verdict `CARD_NOT_COMPLETE`, 17 pass, 6 fail, 0 missing of 23 checks across six sections. The failing checks are: `base_rate_consistent_with_reference_counts`, `no_strawmanning`, `all_stated_fallacies_checked`, `confidence_within_probability_bounds`, `conclusion_not_from_vibes_or_authority_alone`, `certainty_does_not_outrun_evidence`.

### Handle a 422 invalid_input

A type error is rejected before any check runs — you get HTTP 422, never a verdict. The recorded malformed run for this atom (Worked example 3) returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "evidence",
  "detail": "evidence must be an object"
}
```

`field` names the offending field (`evidence`) and `detail` states the expected type ("evidence must be an object"). Fix that field's type in the manifest — consult the Input reference for each field's type — and resubmit. Do not drop the field to silence the 422 unless you intend it to be reported as missing evidence instead.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/base-rate-card` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/base-rate-card` — tool name `base_rate_card`; `tools/call` arguments = the manifest object.
- **Keys:** sign up via `POST /v1/signup`, then `POST /v1/keys` with `{"atom": "base-rate-card"}`. Key scope: this atom only — a key's scope for one atom never verifies for another (per `contract.yaml`, keys are per user, per atom; the key itself is regenerated on demand after authentication and never stored).

### Input reference

The manifest is one JSON object with 26 fields. All fields are booleans unless a different type is stated in the Type column. A field **absent** = evidence missing (counts toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them).

#### Top level

| Field | Type | Notes |
|---|---|---|
| `claim` | string | string; carried into the verdict output, not itself checked |

#### `claim_and_evidence`

| Field | Type | Notes |
|---|---|---|
| `evidence.claim_restated_precisely` | boolean | — |
| `evidence.supporting_evidence_sought` | boolean | — |
| `evidence.refuting_evidence_sought` | boolean | — |
| `evidence.hierarchy_applied` | boolean | — |
| `evidence.conflicts_noted_with_reasons` | boolean | — |

#### `base_rates`

| Field | Type | Notes |
|---|---|---|
| `base_rate.reference_class_defined` | boolean | — |
| `base_rate.considered_first` | boolean | — |
| `base_rate.reference_class_size` | number | number; computed, see below |
| `base_rate.reference_class_successes` | number | number; computed, see below |
| `base_rate.stated` | number | number; computed, see below |

#### `steelman`

| Field | Type | Notes |
|---|---|---|
| `steelman.strongest_counterargument_built` | boolean | — |
| `steelman.counterargument_engaged` | boolean | — |
| `steelman.opposing_view_strawmanned` | boolean | must be `false` to pass — skill red line |

#### `fallacy_spot_check`

| Field | Type | Notes |
|---|---|---|
| `fallacies.spot_check_performed` | boolean | — |
| `fallacies.checked` | array of string | list of strings; computed, see below |

#### `calibration`

| Field | Type | Notes |
|---|---|---|
| `calibration.confidence_stated` | boolean | — |
| `calibration.confidence_value` | number | number; computed, see below |
| `calibration.outcomes_reviewed` | boolean | — |
| `calibration.hit_rate_tracked_by_confidence_band` | boolean | — |

#### `second_order_and_judgment`

| Field | Type | Notes |
|---|---|---|
| `judgment.second_order_effects_considered` | boolean | — |
| `judgment.written` | boolean | — |
| `judgment.includes_confidence` | boolean | — |
| `judgment.includes_key_uncertainties` | boolean | — |
| `judgment.conclusion_from_vibes_or_authority_alone` | boolean | must be `false` to pass — skill red line |
| `judgment.certainty_outruns_evidence` | boolean | must be `false` to pass — skill red line |

### Checks

The recorded full-pass response carries 23 checks across 6 sections (`claim_and_evidence`, `base_rates`, `steelman`, `fallacy_spot_check`, `calibration`, `second_order_and_judgment`). Every check is listed below with the requirement stated in its recorded `evidence` string. General semantics: a check's status is `pass` when its requirement is met on the declared values, `fail` when the supporting field is present but the requirement is not met, and `missing` when the supporting field is absent. A section's status is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when no check fails but at least one is missing.

No check group is conditional in this atom. Three checks are computed (see above); every other check is a plain declared-evidence check.

| Section | Check | What passing requires (recorded evidence) | Pass / fail / missing semantics |
|---|---|---|---|
| `claim_and_evidence` | `claim_restated_precisely` | method step 1: the claim is restated precisely | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `claim_and_evidence` | `supporting_evidence_sought` | quality gate: supporting evidence is sought — what evidence would support the claim, and is any actually present | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `claim_and_evidence` | `refuting_evidence_sought` | quality gate: refuting evidence is sought — what evidence would refute the claim, and is any actually present | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `claim_and_evidence` | `evidence_hierarchy_applied` | method step 2: the evidence hierarchy is applied — measurements/data over documents/logs over expert synthesis over hearsay | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `claim_and_evidence` | `evidence_conflicts_noted_with_reasons` | method step 2: conflicts between evidence are noted with why they exist (incentives) | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `base_rates` | `reference_class_defined` | method step 3: a reference class is defined — what usually happens in cases like this | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `base_rates` | `base_rate_considered_first` | method step 3: base rates come first — the reference class is consulted before the compelling story | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `base_rates` | `base_rate_consistent_with_reference_counts` | method step 3: the stated base rate equals the rate the declared reference-class counts imply (successes / size), with coherent counts and a stated rate that is a probability | Computed: stated rate equals successes / size, counts coherent, stated rate a probability → `pass`; otherwise → `fail`; any of the three numbers absent → `missing` |
| `steelman` | `strongest_counterargument_built` | method step 4: the strongest version of the opposing view is built | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `steelman` | `steelman_engaged` | quality gate: the strongest counterargument is engaged (steelman, not strawman) | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `steelman` | `no_strawmanning` | red line: no straw-manning in your own favor | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `fallacy_spot_check` | `fallacy_spot_check_performed` | method step 5: a fallacy spot-check is performed | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `fallacy_spot_check` | `all_stated_fallacies_checked` | method step 5: the spot-check covers every fallacy the skill names — ad hominem, straw man, false dilemma, appeal to authority/antiquity, survivorship stories, motivated reasoning, cherry-picked windows | Computed: declared list contains all seven stated fallacies → `pass`; present but incomplete (including empty) → `fail`; absent → `missing` |
| `calibration` | `confidence_stated` | method step 6: confidence is stated (e.g. '80% sure') | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `calibration` | `confidence_within_probability_bounds` | method step 6: the stated confidence is a probability — between zero and one inclusive | Computed: declared confidence between zero and one inclusive → `pass`; outside → `fail`; absent → `missing` |
| `calibration` | `outcomes_reviewed_for_calibration` | quality gate: outcomes are reviewed for calibration | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `calibration` | `hit_rate_tracked_by_confidence_band` | method step 6: hit rate is tracked by confidence band | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `second_order_and_judgment` | `second_order_effects_considered` | method step 7: second-order effects are considered — incentives, timing, competition, future options | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `second_order_and_judgment` | `judgment_written` | method step 8: the judgment is written — short and checkable later | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `second_order_and_judgment` | `judgment_includes_confidence` | method step 8: the written judgment includes its confidence | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `second_order_and_judgment` | `judgment_includes_key_uncertainties` | method step 8: the written judgment includes its key uncertainties | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `second_order_and_judgment` | `conclusion_not_from_vibes_or_authority_alone` | red line: no conclusions from vibes or authority alone | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `second_order_and_judgment` | `certainty_does_not_outrun_evidence` | red line: certainty does not outrun evidence | `false` → `pass`; `true` → `fail`; absent → `missing` |

### Output format

A successful call (HTTP 200) returns one JSON object:

| Field | Meaning |
|---|---|
| `service` | Always `"base-rate-card"` |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"`) |
| `claim` | The declared claim, carried through from the manifest (not itself checked) |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`) |
| `checks` | Array of 23 objects, each `{section, check, status, evidence}` — `status` is `pass` / `fail` / `missing`; `evidence` states what the check requires |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three computed checks cannot be completed |
| `reference_rate` | The rate implied by the declared reference-class counts (successes / size), string with exactly six decimals; null when it cannot be computed |
| `base_rate_difference` | Stated rate minus implied rate, string with exactly six decimals; null likewise |
| `fallacies_not_checked` | Stated fallacy entries omitted from the declared list; null when no list is declared |
| `summary` | Plain-language count, e.g. the recorded full-pass summary: "23 pass, 0 fail, 0 missing of 23 checks across six sections." |
| `stamp` | The same verdict rendered as a plain-text stamp for pasting into a record |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `CARD_COMPLETE` — Every check passes; the card is complete on the declared evidence.
- `CARD_NOT_COMPLETE` — At least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — Nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values in the `sections` object): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (the `status` field of each `checks` entry): `pass` — the requirement is met on the declared values (for a conditional check whose gate is off, `pass` is recorded with not-applicable semantics — see Checks); `fail` — the supporting field is present but the requirement is not met; `missing` — the supporting field is absent, so there is no evidence to judge.

**Computed status** (the `computed_status` field, where present): see Output format — it summarises the computed checks as within / outside the stated limits on the declared evidence, or null when a primary computed check cannot be completed.

### Errors

Only the error shapes evidenced in the gateway documentation (USER-GUIDE.md) and the recorded trial runs are documented here; no other payload shapes are claimed.

- **401 — unauthenticated:** missing or invalid key. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **403 — scope:** the key lacks this atom's scope. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **422 — `invalid_input`:** a manifest field has the wrong type. Recorded body shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance is `evidence` / "evidence must be an object" (Worked example 3, verbatim). No verdict is returned.
- **429 — rate limit:** the per-key rate limit (below) is exceeded. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)

### Rate limits and pricing

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. The contract notes this is the SPEC default capacity guard for open public usage, tuned per atom at build-out from measured production cost.
- **Pricing:** Free during trial — rate pending. `contract.yaml` sets pricing unit `deliverable` with `rate: null` (`rate_status: pending`); SERVICE.md states no price is set and prices are set only from measured production cost per unit.

## Explanation

What this atom does, in depth: you submit a declared record — the manifest — and the atom audits that record, deterministically, against the method, quality gates and red lines of its bound skill. It runs 23 checks grouped into 6 sections (claim_and_evidence, base_rates, steelman, fallacy_spot_check, calibration, second_order_and_judgment), computes the computed checks described below from the declared values alone, and returns a single verdict with per-section and per-check evidence. Same manifest in → same verdict out: external verification confirmed byte-identical repeat REST responses and MCP/REST parity (see TEST-REPORT.md). One unit of sale is one delivered verdict — the atom sells the deliverable it produces, never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic; there is no model judgment in the loop. Each check reads declared field(s): an **absent** field is missing evidence (check status `missing`), while a field **present but false / invalid** is a failure (check status `fail`) — that distinction is the atom's central semantics, and it drives the verdict: any `fail` produces the failing verdict; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only when every check passes does the atom return its pass verdict. Section statuses aggregate the same way (`pass` / `fail` / `insufficient_evidence`).

**Computed checks.** Three checks are computed from the declared values, using only what the bound skill itself states plus the arithmetic of the declared numbers. **Base-rate consistency:** when the card declares a reference-class size, a success count, and a stated base rate, the stated rate passes only when it equals the rate the counts imply (successes / size), the counts are coherent (size positive, successes between zero and size inclusive), and the stated rate is a probability (between zero and one inclusive); if any of the three numbers is absent, the check is missing evidence; the output reports `reference_rate` (the implied rate, null when it cannot be computed) and `base_rate_difference` (stated minus implied, null likewise). **Fallacy coverage:** `fallacies.checked` passes only when it contains all seven stated entries (`ad_hominem`, `straw_man`, `false_dilemma`, `appeal_to_authority_or_antiquity`, `survivorship`, `motivated_reasoning`, `cherry_picked_windows`); unknown entries do not count toward coverage; a missing list is missing evidence, an empty list is present and fails; omitted entries are reported as `fallacies_not_checked` (null when no list is declared); entries are validated as strings only, never enum-checked. **Confidence bounds:** `calibration.confidence_value` passes only between zero and one inclusive; an absent value is missing evidence. Computed rates are reported as strings with exactly six decimal places (round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; comparisons use the unrounded values except the consistency check, which compares the fixed-6dp difference to zero) — that fixed serialization is what makes the Python and TypeScript outputs byte-identical. The output also reports `computed_status` (null when any of the three computed checks cannot be completed).

**What it does NOT do.** This atom audits a **declared** judgment card — it does not source
reference-class data, restate the claim, build the steelman, or
verify that a declared value is true. The register's named doubt
for this atom — reference-class data sourcing per domain — stays
the caller's: the card declares its own reference class, counts,
and stated rate, and this core checks only their internal
consistency and the completeness of the skill's method on the
declared evidence. A card is complete *on the caller's declared
evidence* even if its conclusion is wrong. It is a completeness
and consistency audit, **not a judgment review**: it never decides
whether the claim is true, whether the reference class is the
right one, whether the steelman is actually strong, or whether
the stated confidence is warranted — only that the card contains
what the skill's method, quality gates, and red lines demand, and
that its declared base-rate arithmetic agrees with itself.

Named exclusions: no sourcing or verification of any reference
class or base rate (per-domain sourcing is unresolved in the
register and is not invented here); no grading of evidence quality
beyond the declared hierarchy step (the skill names the hierarchy
tiers but states no scoring, so none is imposed); no fallacy
vocabulary beyond the seven entries the skill itself names; no
calibration score (the skill requires tracking hit rate by
confidence band but states no formula or pass mark, so only the
tracking declaration and the probability bounds of the stated
confidence are checked); no live verification of any declared
fact.

**Buyer and use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. Self-use (passed): see SERVICE.md — the house itself calls this atom in its own workflow, as an internal caller at zero price metered to the internal cost ledger. The recorded trial runs below are the external-verification battery for the release candidate now in its one-week RC soak.

## Role views

### For integrators

You need the verdict inside another system or agent loop. Use the REST endpoint `POST https://atoms.pipavia.com/v1/base-rate-card` (or the MCP tool `base_rate_card`) with a per-atom scoped key, treat HTTP 200 verdicts — including failing verdicts — as successful deliveries, and branch on `verdict`, `sections` and the per-check `status` values rather than on HTTP status. Reserve error handling for 401 / 403 / 422 / 429 (see Errors). The call is stateless and deterministic: cache or replay a manifest freely; an identical manifest returns an identical verdict. Respect the per-key limits (60/min, 10,000/day) and note pricing is free during trial with the rate pending.

### For developers

Manifest authoring: declare every field in the Input reference truthfully — omitting a field is a positive statement that the evidence does not exist (`missing`), not a neutral default, and declaring `false` where the record is actually silent converts a fixable `INSUFFICIENT_EVIDENCE` into a failing verdict. Mind the must-be-`false` fields, the computed checks (their rules are stated in full under Explanation), and the conditional gates where this atom has them. Determinism: the verdict core is a deterministic function of the manifest alone. Implementation pointers: core in `src/base_rate_card.py`, tests in `tests/test_base_rate_card.py` (see TEST-REPORT.md for the external battery: full-pass, violations, sparse, malformed, determinism, and MCP/REST parity).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/base-rate-card` and MCP `POST https://atoms.pipavia.com/mcp/base-rate-card` on gateway v1.1.0 at https://atoms.pipavia.com. Keys are per user, per atom; a 403 spike means callers are presenting keys without this atom's scope, a 401 spike means missing/invalid keys, 422s mean malformed manifests naming the field in the body, and 429s mean the per-key limit (60/min, 10,000/day) is being hit — monitor those four codes separately from verdict mix, since failing verdicts are HTTP 200 by design. Status: live — release candidate (one-week RC soak to 2026-11-22); atom version 0.1.0. Pricing is free during trial (rate pending), so trial traffic is metered, not billed, per `contract.yaml`.

## Worked examples

Provenance: recorded 2026-11-16T00:43:46.452334+00:00 against gateway v1.1.0, external verification lane, source `verification/work/base-rate-card/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, pretty-printed with two-space indent; the JSON values are verbatim.

### Example 1 — full-pass

Request — `POST /v1/base-rate-card`:

```json
{
  "claim": "The project will launch on time.",
  "evidence": {
    "claim_restated_precisely": true,
    "supporting_evidence_sought": true,
    "refuting_evidence_sought": true,
    "hierarchy_applied": true,
    "conflicts_noted_with_reasons": true
  },
  "base_rate": {
    "reference_class_defined": true,
    "considered_first": true,
    "reference_class_size": 100,
    "reference_class_successes": 50,
    "stated": 0.5
  },
  "steelman": {
    "strongest_counterargument_built": true,
    "counterargument_engaged": true,
    "opposing_view_strawmanned": false
  },
  "fallacies": {
    "spot_check_performed": true,
    "checked": [
      "ad_hominem",
      "straw_man",
      "false_dilemma",
      "appeal_to_authority_or_antiquity",
      "survivorship",
      "motivated_reasoning",
      "cherry_picked_windows"
    ]
  },
  "calibration": {
    "confidence_stated": true,
    "confidence_value": 0.8,
    "outcomes_reviewed": true,
    "hit_rate_tracked_by_confidence_band": true
  },
  "judgment": {
    "second_order_effects_considered": true,
    "written": true,
    "includes_confidence": true,
    "includes_key_uncertainties": true,
    "conclusion_from_vibes_or_authority_alone": false,
    "certainty_outruns_evidence": false
  }
}
```

Response — HTTP 200:

```json
{
  "service": "base-rate-card",
  "atom_version": "0.1.0",
  "claim": "The project will launch on time.",
  "verdict": "CARD_COMPLETE",
  "sections": {
    "claim_and_evidence": "pass",
    "base_rates": "pass",
    "steelman": "pass",
    "fallacy_spot_check": "pass",
    "calibration": "pass",
    "second_order_and_judgment": "pass"
  },
  "checks": [
    {
      "section": "claim_and_evidence",
      "check": "claim_restated_precisely",
      "status": "pass",
      "evidence": "method step 1: the claim is restated precisely"
    },
    {
      "section": "claim_and_evidence",
      "check": "supporting_evidence_sought",
      "status": "pass",
      "evidence": "quality gate: supporting evidence is sought \u2014 what evidence would support the claim, and is any actually present"
    },
    {
      "section": "claim_and_evidence",
      "check": "refuting_evidence_sought",
      "status": "pass",
      "evidence": "quality gate: refuting evidence is sought \u2014 what evidence would refute the claim, and is any actually present"
    },
    {
      "section": "claim_and_evidence",
      "check": "evidence_hierarchy_applied",
      "status": "pass",
      "evidence": "method step 2: the evidence hierarchy is applied \u2014 measurements/data over documents/logs over expert synthesis over hearsay"
    },
    {
      "section": "claim_and_evidence",
      "check": "evidence_conflicts_noted_with_reasons",
      "status": "pass",
      "evidence": "method step 2: conflicts between evidence are noted with why they exist (incentives)"
    },
    {
      "section": "base_rates",
      "check": "reference_class_defined",
      "status": "pass",
      "evidence": "method step 3: a reference class is defined \u2014 what usually happens in cases like this"
    },
    {
      "section": "base_rates",
      "check": "base_rate_considered_first",
      "status": "pass",
      "evidence": "method step 3: base rates come first \u2014 the reference class is consulted before the compelling story"
    },
    {
      "section": "base_rates",
      "check": "base_rate_consistent_with_reference_counts",
      "status": "pass",
      "evidence": "method step 3: the stated base rate equals the rate the declared reference-class counts imply (successes / size), with coherent counts and a stated rate that is a probability"
    },
    {
      "section": "steelman",
      "check": "strongest_counterargument_built",
      "status": "pass",
      "evidence": "method step 4: the strongest version of the opposing view is built"
    },
    {
      "section": "steelman",
      "check": "steelman_engaged",
      "status": "pass",
      "evidence": "quality gate: the strongest counterargument is engaged (steelman, not strawman)"
    },
    {
      "section": "steelman",
      "check": "no_strawmanning",
      "status": "pass",
      "evidence": "red line: no straw-manning in your own favor"
    },
    {
      "section": "fallacy_spot_check",
      "check": "fallacy_spot_check_performed",
      "status": "pass",
      "evidence": "method step 5: a fallacy spot-check is performed"
    },
    {
      "section": "fallacy_spot_check",
      "check": "all_stated_fallacies_checked",
      "status": "pass",
      "evidence": "method step 5: the spot-check covers every fallacy the skill names \u2014 ad hominem, straw man, false dilemma, appeal to authority/antiquity, survivorship stories, motivated reasoning, cherry-picked windows"
    },
    {
      "section": "calibration",
      "check": "confidence_stated",
      "status": "pass",
      "evidence": "method step 6: confidence is stated (e.g. '80% sure')"
    },
    {
      "section": "calibration",
      "check": "confidence_within_probability_bounds",
      "status": "pass",
      "evidence": "method step 6: the stated confidence is a probability \u2014 between zero and one inclusive"
    },
    {
      "section": "calibration",
      "check": "outcomes_reviewed_for_calibration",
      "status": "pass",
      "evidence": "quality gate: outcomes are reviewed for calibration"
    },
    {
      "section": "calibration",
      "check": "hit_rate_tracked_by_confidence_band",
      "status": "pass",
      "evidence": "method step 6: hit rate is tracked by confidence band"
    },
    {
      "section": "second_order_and_judgment",
      "check": "second_order_effects_considered",
      "status": "pass",
      "evidence": "method step 7: second-order effects are considered \u2014 incentives, timing, competition, future options"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_written",
      "status": "pass",
      "evidence": "method step 8: the judgment is written \u2014 short and checkable later"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_includes_confidence",
      "status": "pass",
      "evidence": "method step 8: the written judgment includes its confidence"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_includes_key_uncertainties",
      "status": "pass",
      "evidence": "method step 8: the written judgment includes its key uncertainties"
    },
    {
      "section": "second_order_and_judgment",
      "check": "conclusion_not_from_vibes_or_authority_alone",
      "status": "pass",
      "evidence": "red line: no conclusions from vibes or authority alone"
    },
    {
      "section": "second_order_and_judgment",
      "check": "certainty_does_not_outrun_evidence",
      "status": "pass",
      "evidence": "red line: certainty does not outrun evidence"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "reference_rate": "0.500000",
  "base_rate_difference": "0.000000",
  "fallacies_not_checked": [],
  "summary": "23 pass, 0 fail, 0 missing of 23 checks across six sections.",
  "stamp": "BASE-RATE CARD\nclaim: The project will launch on time.\nVERDICT: CARD_COMPLETE\n  claim_and_evidence           pass\n  base_rates                   pass\n  steelman                     pass\n  fallacy_spot_check           pass\n  calibration                  pass\n  second_order_and_judgment    pass\n23 pass, 0 fail, 0 missing of 23 checks across six sections."
}
```

### Example 2 — violations

Request — `POST /v1/base-rate-card`:

```json
{
  "claim": "The project will launch on time.",
  "evidence": {
    "claim_restated_precisely": true,
    "supporting_evidence_sought": true,
    "refuting_evidence_sought": true,
    "hierarchy_applied": true,
    "conflicts_noted_with_reasons": true
  },
  "base_rate": {
    "reference_class_defined": true,
    "considered_first": true,
    "reference_class_size": 100,
    "reference_class_successes": 50,
    "stated": 0.9
  },
  "steelman": {
    "strongest_counterargument_built": true,
    "counterargument_engaged": true,
    "opposing_view_strawmanned": true
  },
  "fallacies": {
    "spot_check_performed": true,
    "checked": [
      "ad_hominem"
    ]
  },
  "calibration": {
    "confidence_stated": true,
    "confidence_value": 1.5,
    "outcomes_reviewed": true,
    "hit_rate_tracked_by_confidence_band": true
  },
  "judgment": {
    "second_order_effects_considered": true,
    "written": true,
    "includes_confidence": true,
    "includes_key_uncertainties": true,
    "conclusion_from_vibes_or_authority_alone": true,
    "certainty_outruns_evidence": true
  }
}
```

Response — HTTP 200:

```json
{
  "service": "base-rate-card",
  "atom_version": "0.1.0",
  "claim": "The project will launch on time.",
  "verdict": "CARD_NOT_COMPLETE",
  "sections": {
    "claim_and_evidence": "pass",
    "base_rates": "fail",
    "steelman": "fail",
    "fallacy_spot_check": "fail",
    "calibration": "fail",
    "second_order_and_judgment": "fail"
  },
  "checks": [
    {
      "section": "claim_and_evidence",
      "check": "claim_restated_precisely",
      "status": "pass",
      "evidence": "method step 1: the claim is restated precisely"
    },
    {
      "section": "claim_and_evidence",
      "check": "supporting_evidence_sought",
      "status": "pass",
      "evidence": "quality gate: supporting evidence is sought \u2014 what evidence would support the claim, and is any actually present"
    },
    {
      "section": "claim_and_evidence",
      "check": "refuting_evidence_sought",
      "status": "pass",
      "evidence": "quality gate: refuting evidence is sought \u2014 what evidence would refute the claim, and is any actually present"
    },
    {
      "section": "claim_and_evidence",
      "check": "evidence_hierarchy_applied",
      "status": "pass",
      "evidence": "method step 2: the evidence hierarchy is applied \u2014 measurements/data over documents/logs over expert synthesis over hearsay"
    },
    {
      "section": "claim_and_evidence",
      "check": "evidence_conflicts_noted_with_reasons",
      "status": "pass",
      "evidence": "method step 2: conflicts between evidence are noted with why they exist (incentives)"
    },
    {
      "section": "base_rates",
      "check": "reference_class_defined",
      "status": "pass",
      "evidence": "method step 3: a reference class is defined \u2014 what usually happens in cases like this"
    },
    {
      "section": "base_rates",
      "check": "base_rate_considered_first",
      "status": "pass",
      "evidence": "method step 3: base rates come first \u2014 the reference class is consulted before the compelling story"
    },
    {
      "section": "base_rates",
      "check": "base_rate_consistent_with_reference_counts",
      "status": "fail",
      "evidence": "method step 3: the stated base rate equals the rate the declared reference-class counts imply (successes / size), with coherent counts and a stated rate that is a probability"
    },
    {
      "section": "steelman",
      "check": "strongest_counterargument_built",
      "status": "pass",
      "evidence": "method step 4: the strongest version of the opposing view is built"
    },
    {
      "section": "steelman",
      "check": "steelman_engaged",
      "status": "pass",
      "evidence": "quality gate: the strongest counterargument is engaged (steelman, not strawman)"
    },
    {
      "section": "steelman",
      "check": "no_strawmanning",
      "status": "fail",
      "evidence": "red line: no straw-manning in your own favor"
    },
    {
      "section": "fallacy_spot_check",
      "check": "fallacy_spot_check_performed",
      "status": "pass",
      "evidence": "method step 5: a fallacy spot-check is performed"
    },
    {
      "section": "fallacy_spot_check",
      "check": "all_stated_fallacies_checked",
      "status": "fail",
      "evidence": "method step 5: the spot-check covers every fallacy the skill names \u2014 ad hominem, straw man, false dilemma, appeal to authority/antiquity, survivorship stories, motivated reasoning, cherry-picked windows"
    },
    {
      "section": "calibration",
      "check": "confidence_stated",
      "status": "pass",
      "evidence": "method step 6: confidence is stated (e.g. '80% sure')"
    },
    {
      "section": "calibration",
      "check": "confidence_within_probability_bounds",
      "status": "fail",
      "evidence": "method step 6: the stated confidence is a probability \u2014 between zero and one inclusive"
    },
    {
      "section": "calibration",
      "check": "outcomes_reviewed_for_calibration",
      "status": "pass",
      "evidence": "quality gate: outcomes are reviewed for calibration"
    },
    {
      "section": "calibration",
      "check": "hit_rate_tracked_by_confidence_band",
      "status": "pass",
      "evidence": "method step 6: hit rate is tracked by confidence band"
    },
    {
      "section": "second_order_and_judgment",
      "check": "second_order_effects_considered",
      "status": "pass",
      "evidence": "method step 7: second-order effects are considered \u2014 incentives, timing, competition, future options"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_written",
      "status": "pass",
      "evidence": "method step 8: the judgment is written \u2014 short and checkable later"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_includes_confidence",
      "status": "pass",
      "evidence": "method step 8: the written judgment includes its confidence"
    },
    {
      "section": "second_order_and_judgment",
      "check": "judgment_includes_key_uncertainties",
      "status": "pass",
      "evidence": "method step 8: the written judgment includes its key uncertainties"
    },
    {
      "section": "second_order_and_judgment",
      "check": "conclusion_not_from_vibes_or_authority_alone",
      "status": "fail",
      "evidence": "red line: no conclusions from vibes or authority alone"
    },
    {
      "section": "second_order_and_judgment",
      "check": "certainty_does_not_outrun_evidence",
      "status": "fail",
      "evidence": "red line: certainty does not outrun evidence"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "reference_rate": "0.500000",
  "base_rate_difference": "0.400000",
  "fallacies_not_checked": [
    "straw_man",
    "false_dilemma",
    "appeal_to_authority_or_antiquity",
    "survivorship",
    "motivated_reasoning",
    "cherry_picked_windows"
  ],
  "summary": "17 pass, 6 fail, 0 missing of 23 checks across six sections.",
  "stamp": "BASE-RATE CARD\nclaim: The project will launch on time.\nVERDICT: CARD_NOT_COMPLETE\n  claim_and_evidence           pass\n  base_rates                   fail\n  steelman                     fail\n  fallacy_spot_check           fail\n  calibration                  fail\n  second_order_and_judgment    fail\n17 pass, 6 fail, 0 missing of 23 checks across six sections."
}
```

### Example 3 — malformed

Request — `POST /v1/base-rate-card`:

```json
{
  "claim": "Malformed input test.",
  "evidence": "should_be_an_object"
}
```

Response — HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "evidence",
  "detail": "evidence must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference and Explanation sections above; output is CommonMark markdown |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; developers Yes; ops Yes; regulators N/A — Not compliance-facing: the verdict is a completeness and consistency audit of a declared judgment card (a thinking method check); it is not compliance or audit evidence and the domain is not regulated. |
| Checks named (documented / recorded) | 23 / 23 — every check in the recorded full-pass response is listed under Reference → Checks |
| Verdict vocabulary complete | Yes — 3 verdict values, plus section statuses and per-check statuses |
| Input reference typed | Yes — 26 fields, each with its type, grouped as in SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses compared as JSON values against `verification/work/base-rate-card/evidence.json` after writing |

