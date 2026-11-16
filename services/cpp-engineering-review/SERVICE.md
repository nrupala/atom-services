# Cpp engineering review — `cpp-engineering-review`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Write modern C++ — RAII, value semantics, STL-first design, sanitizers and static analysis in the loop.

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **C++ tooling and service builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the cpp-engineering-review manifest

The caller submits one JSON manifest: one declared C++-engineering
evidence record — the caller's declared ownership, tooling, and
review records for one piece of C++ code or one diff, worked
through the bound skill's method. Every field below is read by
the named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`REVIEW_DEFICIENT`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `subject` (string; carried into the verdict output, not itself checked) | — |
| `raii.resources_owned_by_objects` | raii_and_ownership |
| `raii.destructors_clean_up_resources` | raii_and_ownership |
| `raii.manual_new_delete_in_new_code` (must be `false` to pass — skill quality gate) | raii_and_ownership |
| `raii.raw_owning_pointers_in_new_code` (must be `false` to pass — skill quality gate) | raii_and_ownership |
| `raii.forbidden_constructs` (list of strings; computed, see below) | raii_and_ownership |
| `value_semantics.values_const_references_preferred` | value_semantics |
| `value_semantics.move_semantics_used_where_copies_expensive` | value_semantics |
| `value_semantics.rule_of_zero_honored` | value_semantics |
| `value_semantics.special_members_justified_when_present` | value_semantics |
| `smart_pointers.unique_ptr_is_default` | smart_pointers |
| `smart_pointers.shared_ptr_only_for_real_shared_ownership` | smart_pointers |
| `smart_pointers.weak_ptr_used_to_break_cycles` | smart_pointers |
| `stl.algorithms_preferred_over_hand_loops` | stl_and_templates |
| `stl.containers_matched_to_access_patterns` | stl_and_templates |
| `stl.ranges_used_where_available` | stl_and_templates |
| `stl.templates_used_only_for_real_genericity` | stl_and_templates |
| `stl.template_error_messages_readable` | stl_and_templates |
| `exceptions_and_abi.exceptions_policy_chosen` | exceptions_and_abi |
| `exceptions_and_abi.exceptions_policy_documented` | exceptions_and_abi |
| `exceptions_and_abi.exceptions_policy_applied_consistently` | exceptions_and_abi |
| `exceptions_and_abi.stable_library_interfaces` | exceptions_and_abi |
| `exceptions_and_abi.pimpl_used_where_needed` | exceptions_and_abi |
| `exceptions_and_abi.symbols_versioned` | exceptions_and_abi |
| `tooling.clang_tidy_run` | tooling_and_warnings |
| `tooling.clang_tidy_clean_on_diff` | tooling_and_warnings |
| `tooling.clang_format_applied` | tooling_and_warnings |
| `tooling.warnings_treated_as_errors` | tooling_and_warnings |
| `tooling.warning_count` (number; computed, see below) | tooling_and_warnings |
| `sanitizers.asan_enabled_in_test_builds` | sanitizers |
| `sanitizers.ubsan_enabled_in_test_builds` | sanitizers |
| `sanitizers.tsan_enabled_in_test_builds` | sanitizers |
| `sanitizers.sanitizer_clean_test_run` | sanitizers |
| `safety.dangling_references_across_async_boundaries` (must be `false` to pass — skill red line) | safety_red_lines |
| `safety.macros_used_where_language_features_exist` (must be `false` to pass — skill red line) | safety_red_lines |

Two checks are computed from the declared values, using only
what the skill itself states plus the set logic of the declared
values — no outside threshold is imported:

- **Zero warnings:** the skill's method step 6 is "warnings as
  errors", and its quality gate is "warnings-as-errors build
  green". A declared `tooling.warning_count` therefore passes
  only when it equals zero — the one number the skill itself
  states. An absent count is missing evidence. The output
  reports the declared count as `warning_count` (null when no
  count is declared or it is not a number).
- **Forbidden constructs:** the skill's quality gate is "No raw
  owning pointers or manual `new`/`delete` in new code." The
  declared `raii.forbidden_constructs` list therefore passes
  only when it contains none of the three stated entries
  (`raw_owning_pointer`, `manual_new`, `manual_delete`); unknown
  entries do not count as forbidden. A missing list is missing
  evidence; an empty list is present and passes. The output
  reports the stated forbidden entries found, in the skill's
  stated order, as `forbidden_constructs_found` (null when no
  list is declared). Entries are validated as strings only,
  never enum-checked — the forbidden-construct finding is a
  verdict check, not a type error.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when either
of the two computed checks cannot be completed).

**Serialization rule (fixed, identical in both
implementations):** no floating-point arithmetic is performed
anywhere in this atom. `warning_count` is reported as a JSON
number exactly as declared (or null); `forbidden_constructs_found`
is a list of strings in the fixed skill-stated order above (or
null). There is no derived floating-point field, so no
fixed-decimal string conversion arises; any future derived
number will be serialized as a fixed-decimal string by the same
rule in both implementations.

The verdict is one of `REVIEW_SOUND` (all 34 checks pass),
`REVIEW_DEFICIENT` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across eight sections:
raii_and_ownership, value_semantics, smart_pointers,
stl_and_templates, exceptions_and_abi, tooling_and_warnings,
sanitizers, safety_red_lines.

## Honest scoping

This atom reviews a **declared** C++-engineering evidence
manifest — it does not compile, run, sanitize, or read live
code, and it does not verify that a declared value is true. A
review is sound *on the caller's declared evidence* even if the
underlying code is in fact flawed. It is a completeness and
consistency review, **not a code review**: it never decides
whether the code actually manages a resource by RAII, whether
shared ownership is really real, whether a template is really
vanity or its error messages really readable, whether pimpl was
really needed, or whether a sanitizer run really happened —
only that the manifest contains what the skill's method,
quality gates, and red lines demand, and that its two computed
checks agree with the skill's own stated limits. The skill's
qualitative judgments (real genericity vs vanity, readable
errors, genuine shared ownership, where pimpl is needed) do not
reduce to deterministic checks and are carried only as caller
declarations, never decided by this atom.

Named exclusions: no compilation or live code inspection of any
kind; no static-analysis, sanitizer, or formatting execution
(those runs are the caller's, declared in the manifest); no
numeric threshold beyond the skill's own stated zero warnings —
in particular, no pass mark is imposed on clang-tidy findings
(the skill requires clang-tidy clean on the diff, and states no
count or formula, so only that cleanliness declaration is
checked), no special-member count (the Rule of Zero states no
number — special members are checked only as honored/justified
declarations), no sanitizer finding or leak count, and no
test-coverage percentage (the skill states none); no
forbidden-construct vocabulary beyond the three entries the
skill's quality gate itself names; no live verification of any
declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
