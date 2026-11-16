# Pump conveyor motor suitability check — `pump-conveyor-motor-suitability-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Driven equipment support — pumps (curves, affinity) and conveyors (torque dynamics) viewed from the electrical side.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE driven-equipment sizing reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the driven-equipment suitability manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_SUITABLE`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `asset` (string; carried into the verdict output, not itself checked) | — |
| `equipment_kind` (`"pump"` / `"conveyor"` / `"mixed"`; gates the pump and conveyor sections — the other kind's checks pass as not applicable; absent or outside this vocabulary = those checks are missing) | pump_checks, conveyor_checks |
| `duty.curve_or_profile_read` | load_and_operating_point |
| `duty.operating_point_documented` | load_and_operating_point |
| `duty.operating_point_within_limits` | load_and_operating_point |
| `duty.operating_modes_defined` | load_and_operating_point |
| `drives[]` (list of drive entries, see below) | motor_sizing, pump_checks, conveyor_checks |
| `sizing.verified_against_curve_or_profile` | motor_sizing |
| `sizing.suitable_because_it_runs_only` (must be `false` to pass — skill red line) | motor_sizing |
| `pump.minimum_flow_protection_set` (binds for pump / mixed only) | pump_checks |
| `pump.impeller_wear_trend_checked` (binds for pump / mixed only) | pump_checks |
| `pump.vfd_soft_start_reviewed` (binds for pump / mixed only) | pump_checks |
| `conveyor.starting_study_considered` (binds for conveyor / mixed only) | conveyor_checks |
| `conveyor.loaded_starts_holdback_considered` (binds for conveyor / mixed only) | conveyor_checks |
| `conveyor.backstops_brake_interlocks_verified` (binds for conveyor / mixed only) | conveyor_checks |
| `conveyor.sequence_interlock_review_done` (binds for conveyor / mixed only) | conveyor_checks |
| `conveyor.belt_slip_jam_reviewed` (binds for conveyor / mixed only) | conveyor_checks |
| `baselines.recorded_per_operating_mode` | baselines |
| `baselines.flow_head_current_pressure_recorded` | baselines |
| `baselines.compared_at_same_conditions` | baselines |
| `interface.mechanical_data_in_asset_record` | interface_and_protection |
| `interface.data_shared_single_source` | interface_and_protection |
| `interface.changes_made` (gates the revalidation check below) | interface_and_protection |
| `interface.changes_revalidated` (required when a change is declared; otherwise the check passes as not applicable) | interface_and_protection |
| `protection.protection_changed_without_engineering_review` (must be `false` to pass — skill red line) | interface_and_protection |

Each `drives[]` entry is `{id, kind, required_power_kw,
motor_rated_power_kw, required_running_torque_nm,
motor_rated_torque_nm}` (numbers; `kind` is `"pump"` or
`"conveyor"`). Pump entries additionally carry `npsh_available_m`,
`npsh_required_m`, `operating_flow_m3h` and `minimum_flow_m3h`;
conveyor entries additionally carry `required_starting_torque_nm`
and `motor_starting_torque_nm`. Five checks are computed from the
declared values, using only the comparisons the skill itself states:
motor rated power must cover required power and motor rated torque
must cover required running torque for every drive; for pump drives,
NPSH available must cover NPSH required and operating flow must be
at or above the declared minimum flow; for conveyor drives, motor
starting torque must cover required starting torque. No outside
standard, margin or threshold is imported — the skill states no
numeric margin (for NPSH, starting torque or anything else), so
none is invented: equality passes.

The output also reports the computed `suitability_status`
(`suitable_on_declared_values` / `not_suitable_on_declared_values` /
null when an applicable computed comparison cannot be completed) and
the minimum (worst) margins across the applicable drives:
`min_power_margin_kw`, `min_running_torque_margin_nm`,
`min_npsh_margin_m` and `min_starting_torque_margin_nm` (null when
not applicable or not completable). **Fixed serialization rule:**
computed margins are reported as strings with exactly four decimal
places, produced in both implementations by the same rule — round
half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, then format with
exactly four decimals; comparisons use the unrounded values. That
fixed serialization is what makes the Python and TypeScript outputs
byte-identical.

The verdict is one of `SUITABLE` (all 26 checks pass), `NOT_SUITABLE`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across six sections:
load_and_operating_point, motor_sizing, pump_checks, conveyor_checks,
baselines, interface_and_protection.

## Honest scoping

This atom checks **declared** values against **declared** ratings and
records — it does not measure anything, read a real pump curve or
conveyor profile, or verify that a declared value is true. Suitability
is suitability *on the caller's declared values*: a motor that covers
the declared duty passes even if the declared duty itself is wrong.
Named exclusions: no affinity-law or pump-curve computation (the skill
states "power from flow × head" qualitatively and gives no density,
gravity or efficiency inputs to compute with, so no shaft-power figure
is derived); no NPSH, starting-torque or overload margin thresholds
(the skill requires the margin / study to be noted and considered,
never a number); no drive control tuning, protection setting values,
or mechanical design checks (coupling, sheave and belt sizing are
checked only as *recorded and shared* interface data, per the skill's
interface discipline).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.
