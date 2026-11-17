# Production python engineering pack — `production-python-engineering-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Write production Python — typing, packaging, pytest discipline, stdlib-first, honest error handling.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product services and automation builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the production Python engineering manifest

The caller submits one JSON manifest: a declared production
Python engineering record for one Python project — a service,
script, automation, data tool or API hardened for production.
Every field below is read by the named section's checks. A
field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY`).
All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `environment.virtualenv_per_project_used` (boolean) | environment_and_dependencies |
| `environment.dependencies_declared_in_pyproject` (boolean) | environment_and_dependencies |
| `environment.dependency_lockfile_present` (boolean) | environment_and_dependencies |
| `environment.no_installs_into_system_python` (boolean) | environment_and_dependencies |
| `dependencies` (list of dependency-row objects, each with the entry fields below; computed, see below) | environment_and_dependencies |
| `dependencies[].name` (string; names the row in the computed outputs) | environment_and_dependencies |
| `dependencies[].version_pinned` (boolean; must be `true` per row for the pin check to pass) | environment_and_dependencies |
| `typing.public_functions_annotated` (boolean) | typing_and_style |
| `typing.type_checker_run_in_loop` (boolean) | typing_and_style |
| `typing.typed_models_at_boundaries_for_validation` (boolean) | typing_and_style |
| `style.ruff_linter_configured` (boolean) | typing_and_style |
| `style.formatter_ruff_format_or_black_configured` (boolean) | typing_and_style |
| `style.no_mutable_default_arguments` (boolean) | typing_and_style |
| `style.f_strings_used_for_formatting` (boolean) | typing_and_style |
| `style.pathlib_used_over_string_paths` (boolean) | typing_and_style |
| `errors.specific_exceptions_caught` (boolean) | errors_resources_and_async |
| `errors.errors_fail_loudly_with_context` (boolean) | errors_resources_and_async |
| `errors.logging_used_not_print_in_libraries` (boolean) | errors_resources_and_async |
| `resources.context_managers_used_for_files_sockets_locks` (boolean) | errors_resources_and_async |
| `resources.orphaned_handles_avoided` (boolean) | errors_resources_and_async |
| `async_practices.no_blocking_calls_in_event_loops` (boolean) | errors_resources_and_async |
| `async_practices.timeouts_on_every_network_call` (boolean) | errors_resources_and_async |
| `async_practices.structured_concurrency_used_where_possible` (boolean) | errors_resources_and_async |
| `testing.pytest_suite_present` (boolean) | testing_discipline |
| `testing.pytest_fixtures_used` (boolean) | testing_discipline |
| `testing.pytest_parametrize_used` (boolean) | testing_discipline |
| `testing.error_paths_tested_under_pytest` (boolean) | testing_discipline |
| `testing.time_and_randomness_frozen_in_tests` (boolean) | testing_discipline |
| `testing.unit_tests_fast_declared` (boolean) | testing_discipline |
| `testing.pytest_green_including_error_paths` (boolean) | testing_discipline |
| `packaging.pyproject_metadata_present` (boolean) | packaging_and_reproducibility |
| `packaging.console_entry_points_declared` (boolean) | packaging_and_reproducibility |
| `packaging.reproducible_builds_declared` (boolean) | packaging_and_reproducibility |
| `packaging.production_dependencies_pinned` (boolean) | packaging_and_reproducibility |
| `packaging.ruff_and_type_checker_clean_on_diff` (boolean) | packaging_and_reproducibility |
| `packaging.virtualenv_reproducible_declared` (boolean) | packaging_and_reproducibility |
| `red_lines.secrets_in_code_or_notebooks_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unpinned_pip_install_in_production_paths_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.bare_except_present` (boolean; must be `false` to pass — skill method and quality gate) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Dependencies declared:** the declared `dependencies` list
  passes when it is present. An absent list is missing
  evidence. An empty list passes: it declares that the project
  has no third-party dependencies, consistent with the skill's
  stdlib-first posture, and the skill requires no dependency.
- **Every dependency version pinned:** every declared
  dependency row must declare `version_pinned` true (the
  skill: "dependencies pinned in `pyproject.toml` (+ lock)",
  "pin for prod", and the red line "no unpinned `pip install`
  in production paths"). A row with the field absent is
  missing evidence; a row declaring it false fails. On an
  empty list the check passes vacuously — there is no
  unpinned dependency.
- **No dependency name duplicated:** no declared dependency
  `name` may appear on more than one dependency row. A row
  with `name` absent is missing evidence for this check.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the three primary computed checks above cannot be completed),
`dependencies_count` (the declared list length, or null when
the list is not declared — counts are reported as integers,
exactly), the row-name list `dependencies_without_pin`
(dependencies whose pin field is present but not true; a
dependency with the field absent is missing evidence and does
not appear), `duplicate_dependency_names` (dependency names
declared on more than one row, in the order their second
occurrence appears), and the coverage ratio `pin_coverage`
(dependencies declaring a pinned version ÷ declared
dependencies).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric threshold at all — its demands are
qualitative declarations the record makes, not bars the atom
can set. Quantities are computed and reported; the only bar on
the computed rows is completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a test-coverage percentage (the skill requires error
paths tested and pytest green, never a coverage figure); a
unit-test duration or suite runtime limit for "fast" (only
that unit tests are kept fast, as declared, is checked); a
type-annotation percentage for public or all functions (only
that public functions are annotated is checked); a number of
dependencies a project may declare, or a dependency age,
licence or vulnerability bar; a specific Python, mypy, pyright,
ruff, black or pytest version (only that the tools are
configured and run is checked); a network-call timeout value
in seconds (only that every network call carries a timeout is
checked); a lockfile format or hash standard beyond a lock
being present; a build-reproducibility standard beyond builds
being reproducible as declared; a formatter line length or any
other style metric; a count of entry points, modules or
functions.

The verdict is one of `PRODUCTION_PYTHON_ENGINEERING_PACK_READY`
(all 39 checks pass),
`PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across six sections:
environment_and_dependencies, typing_and_style,
errors_resources_and_async, testing_discipline,
packaging_and_reproducibility, red_lines.

## Distinct ground

The nearest siblings are `backend-engineering-advice` (a
backend service record — contract-first APIs defined before
code, boundary validation, idempotency keys on mutating
operations, a structured error taxonomy, jobs and queues, data
safety and observability), `data-ml-pipeline-engineering` (a
data/ML pipeline record — ingestion contracts and source rows,
idempotent orchestration, lineage and reproducibility, ML
hygiene and splits, drift monitoring) and
`javascript-review-and-build` (a JavaScript record — ESM and
strict mode, promise handling, DOM safety, environment and
bundle discipline). This atom shares **zero checks** with any
of them (verified by comparing every check name here against
every other atom's source — the comparison also covers the
parallel `production-python-engineering-pack-expert`, whose
checks are all expert-suffixed, and the rest of the gateway):
every check here is a production-Python question — one
virtualenv per project and nothing installed into system
Python, dependencies declared in pyproject.toml with a
lockfile and every declared dependency row pinned, public
functions annotated with mypy/pyright in the loop, dataclasses
or Pydantic models validating at the boundaries, ruff plus
ruff format or black, no mutable default arguments, f-strings,
pathlib over string paths, specific exceptions with loud
contextual failure, logging never print in libraries, context
managers for files/sockets/locks with no orphaned handles, no
blocking calls in event loops with timeouts on every network
call and structured concurrency, pytest with fixtures and
parametrize, error paths tested with time and randomness
frozen and pytest green, pyproject metadata with console entry
points and reproducible builds, and the Python red lines (no
secrets in code or notebooks, no unpinned pip install in
production paths, no bare excepts). The boundary is: a Python
project's production-engineering discipline here; backend
service architecture, data/ML pipeline engineering and
JavaScript review there — and, against the expert pack,
advanced Python practice (profiling, acceleration, idioms at
depth, API/CLI surface craft) there, the base production
discipline here.

## Honest scoping

This atom reviews a **declared** production Python engineering
record — it writes no Python itself, runs no interpreter,
linter, type checker or test suite, inspects no repository,
virtualenv, lockfile or notebook, and does not verify that a
declared practice was ever carried out. A project is ready
*on the caller's declared evidence*: a record that declares
annotated public functions, pinned dependencies and no secrets
passes those checks even if the real code did none of it. It
is a completeness and consistency audit of the engineering
record the skill requires, **not a code-review service, a
linting or type-checking service, a security audit of actual
code, or a prediction that the project will run correctly**:
it never judges whether the annotations are accurate, whether
the pinned versions are safe or current, whether the tests
are meaningful, or whether the code is good — only that the
record contains what the skill's method, quality gates and
red lines demand, and that its declared dependency rows are
internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds (see
the declined list above); no live verification of any declared
fact; no judgment of code *quality* — whether the typing,
error handling, async design or tests are adequate for the
real project is the caller's declaration, checked only for
declared presence and consistency; the skill's stdlib-first
posture is honoured only in that an empty dependency list is a
valid declaration — this atom never judges whether a declared
dependency should have been stdlib instead; secrets substance
(whether a real secret leaked) is a caller declaration — only
its declared absence is checked.

## U-13 regulatory screen

No: this atom's output could not read as regulated
professional advice — it audits a declared software-engineering
record for completeness and consistency against a Python
production-practice skill; it offers no engineering-practice
advice in the APEGA-regulated sense (no design, stamping or
safety-critical-system judgment), no securities or financial
advice, and no psychology-adjacent coaching. It is a
software-engineering title of the kind the Batch census left
live pending the owner's review — flagged factually here, not
self-parked on the keyword "engineering" alone: the word
denotes software practice discipline, not professional
engineering practice.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
