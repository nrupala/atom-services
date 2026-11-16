# C engineering review — `c-engineering-review`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Write production C — memory discipline, no undefined behaviour, warning-clean builds, boundary tests.

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Native and embedded code work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the c-engineering-review manifest

The caller submits one JSON manifest: one declared C-engineering
evidence record — the caller's declared static-analysis, build,
and review records for one piece of C code or one diff, worked
through the bound skill's method. Every field below is read by
the named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`REVIEW_DEFICIENT`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `subject` (string; carried into the verdict output, not itself checked) | — |
| `memory.one_owner_per_allocation` | memory_discipline |
| `memory.freed_on_same_path_as_allocation` | memory_discipline |
| `memory.ownership_documented_in_headers` | memory_discipline |
| `memory.caller_supplied_buffers_preferred` | memory_discipline |
| `memory.ownership_documented_for_outliving_pointers` | memory_discipline |
| `undefined_behavior.integer_overflow_addressed` | undefined_behavior |
| `undefined_behavior.strict_aliasing_respected` | undefined_behavior |
| `undefined_behavior.uninitialized_reads_avoided` | undefined_behavior |
| `undefined_behavior.signed_shifts_checked` | undefined_behavior |
| `undefined_behavior.sequence_point_traps_avoided` | undefined_behavior |
| `undefined_behavior.ub_shortcuts_used` (must be `false` to pass — skill red line) | undefined_behavior |
| `warnings.warnings_treated_as_errors` | warnings_and_build |
| `warnings.warning_count` (number; computed, see below) | warnings_and_build |
| `bounds.sized_apis_used` | bounds_and_strings |
| `bounds.lengths_validated_at_boundaries` | bounds_and_strings |
| `bounds.unbounded_operations_in_diff` (must be `false` to pass — skill quality gate) | bounds_and_strings |
| `bounds.banned_calls` (list of strings; computed, see below) | bounds_and_strings |
| `sanitizers.asan_enabled_in_test_builds` | sanitizers_and_static_analysis |
| `sanitizers.ubsan_enabled_in_test_builds` | sanitizers_and_static_analysis |
| `sanitizers.asan_ubsan_clean_on_suite` | sanitizers_and_static_analysis |
| `sanitizers.valgrind_used_for_leaks` | sanitizers_and_static_analysis |
| `sanitizers.parsers_fuzzed` | sanitizers_and_static_analysis |
| `sanitizers.static_analysis_run` | sanitizers_and_static_analysis |
| `sanitizers.static_analysis_findings_treated_as_bugs` | sanitizers_and_static_analysis |
| `portability.fixed_width_types_used` | portability |
| `portability.compiler_extensions_isolated` | portability |
| `portability.tested_on_target_platforms` | portability |
| `build_and_test.build_system_pinned` | build_and_test |
| `build_and_test.unit_tests_at_function_boundaries` | build_and_test |
| `build_and_test.integration_tests_at_edges` | build_and_test |

Two checks are computed from the declared values, using only
what the skill itself states plus the set logic of the declared
values — no outside threshold is imported:

- **Zero warnings:** the skill's method step 3 is "Warnings are
  errors … zero warnings maintained, not 'later'", and its
  quality gate is "Warning-clean with `-Werror` on target
  compilers". A declared `warnings.warning_count` therefore
  passes only when it equals zero — the one number the skill
  itself states. An absent count is missing evidence. The output
  reports the declared count as `warning_count` (null when no
  count is declared or it is not a number).
- **Banned calls:** the skill's red line is "No `gets`, `strcpy`,
  `sprintf`, unchecked `scanf` — ever." The declared
  `bounds.banned_calls` list therefore passes only when it
  contains none of the four stated entries (`gets`, `strcpy`,
  `sprintf`, `unchecked_scanf`); unknown entries do not count as
  banned. A missing list is missing evidence; an empty list is
  present and passes. The output reports the stated banned
  entries found, in the skill's stated order, as
  `banned_calls_found` (null when no list is declared). Entries
  are validated as strings only, never enum-checked — the
  banned-call finding is a verdict check, not a type error.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when either
of the two computed checks cannot be completed).

The verdict is one of `REVIEW_SOUND` (all 30 checks pass),
`REVIEW_DEFICIENT` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across seven sections:
memory_discipline, undefined_behavior, warnings_and_build,
bounds_and_strings, sanitizers_and_static_analysis, portability,
build_and_test.

## Honest scoping

This atom reviews a **declared** C-engineering evidence manifest
— it does not compile, run, fuzz, or read live code, and it does
not verify that a declared value is true. A review is sound *on
the caller's declared evidence* even if the underlying code is in
fact flawed. It is a completeness and consistency review,
**not a code review**: it never decides whether the code actually
contains a memory, undefined-behaviour, bounds, or portability
trap the manifest did not declare, whether an allocation's owner
is really clear, or whether a sanitizer run really happened —
only that the manifest contains what the skill's method, quality
gates, and red lines demand, and that its two computed checks
agree with the skill's own stated limits.

Named exclusions: no compilation or live code inspection of any
kind; no static-analysis, sanitizer, or fuzzing execution (those
runs are the caller's, declared in the manifest); no numeric
threshold beyond the skill's own stated zero warnings — in
particular, no pass mark is imposed on static-analysis findings
(the skill says findings are bugs until proven otherwise, and
states no count or formula, so only that treatment declaration
is checked), no leak count, and no test-coverage percentage (the
skill requires tests at function boundaries and at the edges but
states no coverage number); no banned-call vocabulary beyond the
four entries the skill's red line itself names; no live
verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
