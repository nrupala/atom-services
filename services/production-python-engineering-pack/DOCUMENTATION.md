# Production python engineering pack — documentation

**Production python engineering pack** · slug `production-python-engineering-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/production-python-engineering-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 9595ea665b634289aad158b7fff277ac). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "test-project"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "production-python-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the production Python engineering manifest.** You declare a record of a Python project — a service, script, automation, data tool or API hardened for production — the atom audits the declared record, it does not write Python or inspect a repository (see Explanation). The recorded full-pass manifest declares the project `test-project`: one virtualenv per project, dependencies declared in pyproject.toml with a lockfile present, and nothing installed into system Python; one dependency row, `requests` with `version_pinned` true; public functions annotated, a type checker run in the loop, and typed models at the boundaries for validation; ruff configured as linter, ruff format or black configured as formatter, no mutable default arguments, f-strings used for formatting, and pathlib used over string paths; specific exceptions caught, errors failing loudly with context, and logging used — not print — in libraries; context managers used for files, sockets and locks, and orphaned handles avoided; no blocking calls in event loops, timeouts on every network call, and structured concurrency used where possible; a pytest suite present with fixtures and parametrize used, error paths tested under pytest, time and randomness frozen in tests, unit tests declared fast, and pytest green including error paths; pyproject metadata present, console entry points declared, reproducible builds declared, production dependencies pinned, ruff and the type checker clean on the diff, and the virtualenv declared reproducible; and all three red-line flags `false` (no secrets in code or notebooks, no unpinned pip install in production paths, no bare excepts).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/production-python-engineering-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PRODUCTION_PYTHON_ENGINEERING_PACK_READY`: "39 pass, 0 fail, 0 missing of 39 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `dependencies_count` is 1, and `pin_coverage` is `"1.000000"`, with both name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-python-engineering-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/production-python-engineering-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/production-python-engineering-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `production_python_engineering_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `every_dependency_version_pinned`, `no_dependency_name_duplicated`, `no_secrets_in_code_or_notebooks`, and the summary reads "36 pass, 3 fail, 0 missing of 39 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `dependencies_without_pin` names `requests` — the first row declares `version_pinned: false` — `pin_coverage` is `"0.500000"`, a second dependency row duplicates the name `requests`, failing `no_dependency_name_duplicated` and named in `duplicate_dependency_names` as `["requests"]`, and `red_lines.secrets_in_code_or_notebooks_present` is declared `true`, failing `no_secrets_in_code_or_notebooks`; sections `environment_and_dependencies` and `red_lines` report `fail`, the other four `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "environment",
  "detail": "environment must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/production-python-engineering-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/production-python-engineering-pack` — tool name `production_python_engineering_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `production_python_engineering_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the `dependencies[]` string field are noted as strings and `dependencies` as a list there. Where SERVICE.md states no type — the section container objects (`environment`, `typing`, `style`, `errors`, `resources`, `async_practices`, `testing`, `packaging`, `red_lines`) and a `dependencies[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and `dependencies`, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `dependencies` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: environment_and_dependencies

| Field | Type | Notes |
|---|---|---|
| `environment` | object | The environment section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `environment.virtualenv_per_project_used` | boolean | — |
| `environment.dependencies_declared_in_pyproject` | boolean | — |
| `environment.dependency_lockfile_present` | boolean | — |
| `environment.no_installs_into_system_python` | boolean | — |
| `dependencies` | list | list of dependency-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `dependencies[]` | object | One declared dependency row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `dependencies[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `dependencies[].version_pinned` | boolean | must be `true` per row for the pin check to pass |

#### Read by: typing_and_style

| Field | Type | Notes |
|---|---|---|
| `typing` | object | The typing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `typing.public_functions_annotated` | boolean | — |
| `typing.type_checker_run_in_loop` | boolean | — |
| `typing.typed_models_at_boundaries_for_validation` | boolean | — |
| `style` | object | The style section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `style.ruff_linter_configured` | boolean | — |
| `style.formatter_ruff_format_or_black_configured` | boolean | — |
| `style.no_mutable_default_arguments` | boolean | — |
| `style.f_strings_used_for_formatting` | boolean | — |
| `style.pathlib_used_over_string_paths` | boolean | — |

#### Read by: errors_resources_and_async

| Field | Type | Notes |
|---|---|---|
| `errors` | object | The errors section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `errors.specific_exceptions_caught` | boolean | — |
| `errors.errors_fail_loudly_with_context` | boolean | — |
| `errors.logging_used_not_print_in_libraries` | boolean | — |
| `resources` | object | The resources section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `resources.context_managers_used_for_files_sockets_locks` | boolean | — |
| `resources.orphaned_handles_avoided` | boolean | — |
| `async_practices` | object | The async-practices section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `async_practices.no_blocking_calls_in_event_loops` | boolean | — |
| `async_practices.timeouts_on_every_network_call` | boolean | — |
| `async_practices.structured_concurrency_used_where_possible` | boolean | — |

#### Read by: testing_discipline

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `testing.pytest_suite_present` | boolean | — |
| `testing.pytest_fixtures_used` | boolean | — |
| `testing.pytest_parametrize_used` | boolean | — |
| `testing.error_paths_tested_under_pytest` | boolean | — |
| `testing.time_and_randomness_frozen_in_tests` | boolean | — |
| `testing.unit_tests_fast_declared` | boolean | — |
| `testing.pytest_green_including_error_paths` | boolean | — |

#### Read by: packaging_and_reproducibility

| Field | Type | Notes |
|---|---|---|
| `packaging` | object | The packaging section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `packaging.pyproject_metadata_present` | boolean | — |
| `packaging.console_entry_points_declared` | boolean | — |
| `packaging.reproducible_builds_declared` | boolean | — |
| `packaging.production_dependencies_pinned` | boolean | — |
| `packaging.ruff_and_type_checker_clean_on_diff` | boolean | — |
| `packaging.virtualenv_reproducible_declared` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.secrets_in_code_or_notebooks_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unpinned_pip_install_in_production_paths_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.bare_except_present` | boolean | must be `false` to pass — skill method and quality gate |

### Checks

All 39 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: environment_and_dependencies

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `virtualenv_per_project_used` | environment: one virtualenv is used per project | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dependencies_declared_in_pyproject` | environment: dependencies are declared in pyproject.toml | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dependency_lockfile_present` | environment: dependencies are pinned in pyproject.toml plus a lock — a lockfile is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_installs_into_system_python` | environment: nothing is installed into system Python | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dependencies_declared` | the declared record names its dependencies — the dependencies list is present; an empty list declares that the project has no third-party dependencies | Computed over the declared record. Pass: the `dependencies` list is present — an empty list passes, because it declares that the project has no third-party dependencies, consistent with the skill's stdlib-first posture. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_dependency_version_pinned` | dependencies: every declared dependency row declares its version pinned — dependencies are pinned and no unpinned install reaches production paths | Computed over the declared record. Pass: every declared dependency row declares `version_pinned` true — on an empty list the check passes vacuously. Fail: a row declares `version_pinned` present but not true (offending rows are named in `dependencies_without_pin`). Missing: the list is absent, or a row has `version_pinned` absent (such a row is missing evidence and does not appear in `dependencies_without_pin`). |
| `no_dependency_name_duplicated` | dependencies: no declared dependency name is owned by more than one dependency row | Computed over the declared record. Pass: no declared `name` string appears on more than one dependency row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_dependency_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: typing_and_style

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `public_functions_annotated` | typing: public functions are annotated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `type_checker_run_in_loop` | typing: mypy or pyright runs in the development loop | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `typed_models_at_boundaries_for_validation` | typing: dataclasses or Pydantic models validate at the boundaries | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ruff_linter_configured` | style: ruff is configured as the linter | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `formatter_ruff_format_or_black_configured` | style: a formatter — ruff format or black — is configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_mutable_default_arguments` | style: no mutable default arguments are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `f_strings_used_for_formatting` | style: f-strings are used for string formatting | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pathlib_used_over_string_paths` | style: pathlib is used over string paths | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: errors_resources_and_async

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `specific_exceptions_caught` | errors: specific exceptions are caught, not blanket handlers | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `errors_fail_loudly_with_context` | errors: failures are loud and carry context | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `logging_used_not_print_in_libraries` | errors: libraries log with the logging module — never print in libraries | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `context_managers_used_for_files_sockets_locks` | resources: context managers are used for files, sockets and locks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `orphaned_handles_avoided` | resources: no orphaned handles are left behind | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_blocking_calls_in_event_loops` | async discipline: no blocking calls run in event loops | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `timeouts_on_every_network_call` | async discipline: every network call carries a timeout | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_concurrency_used_where_possible` | async discipline: structured concurrency is used where possible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: testing_discipline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pytest_suite_present` | tests: the test suite runs under pytest | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pytest_fixtures_used` | tests: pytest fixtures are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pytest_parametrize_used` | tests: pytest parametrize is used for case tables | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_paths_tested_under_pytest` | tests: error paths are tested, not only happy paths | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `time_and_randomness_frozen_in_tests` | tests: time and randomness are frozen where the tests depend on them | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unit_tests_fast_declared` | tests: unit tests are kept fast, as declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pytest_green_including_error_paths` | tests: pytest is green, including the error-path tests | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: packaging_and_reproducibility

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pyproject_metadata_present` | packaging: pyproject carries the package metadata | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `console_entry_points_declared` | packaging: console entry points are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `reproducible_builds_declared` | packaging: builds are reproducible, as declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `production_dependencies_pinned` | packaging: dependencies are pinned for production | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ruff_and_type_checker_clean_on_diff` | quality gate: ruff and the type checker are clean on the diff | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `virtualenv_reproducible_declared` | quality gate: the virtualenv is reproducible, as declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_secrets_in_code_or_notebooks` | red line: no secrets in code or notebooks are present — secrets live in env or a keystore | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unpinned_pip_install_in_production_paths` | red line: no unpinned pip install is present in production paths | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_bare_except_clauses` | red line: no bare except clauses are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"production-python-engineering-pack"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `dependencies_count` (the declared list length as an integer, or null when the list is not declared); the row-name list `dependencies_without_pin` (dependencies whose pin field is present but not true; a dependency with the field absent is missing evidence and does not appear) and the name list `duplicate_dependency_names` (dependency names declared on more than one row, in the order their second occurrence appears) — both lists are null when the `dependencies` list is not declared, as recorded in the sparse case; and the ratio `pin_coverage` (dependencies declaring a pinned version ÷ declared dependencies) — a string with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "39 pass, 0 fail, 0 missing of 39 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PRODUCTION_PYTHON_ENGINEERING_PACK_READY` — all 39 checks pass: the declared production Python engineering record is complete and consistent with the bound skill's checklist and red lines.
- `PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the three primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `dependencies_count`, `dependencies_without_pin`, `pin_coverage`, `duplicate_dependency_names` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"environment","detail":"environment must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Write production Python — typing, packaging, pytest discipline, stdlib-first, honest error handling (the bound capability, from the skill). You submit one declared record — the production Python engineering manifest, for one Python project: a service, script, automation, data tool or API hardened for production — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 6 sections (`environment_and_dependencies`, `typing_and_style`, `errors_resources_and_async`, `testing_discipline`, `packaging_and_reproducibility`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `dependencies` list must be present (an empty list passes: it declares that the project has no third-party dependencies, consistent with the skill's stdlib-first posture, and the skill requires no dependency), every dependency row must declare `version_pinned` true, and no declared `name` may appear on more than one dependency row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PRODUCTION_PYTHON_ENGINEERING_PACK_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations the record makes, not bars the atom can set — and none is invented. Declined, named: a test-coverage percentage (the skill requires error paths tested and pytest green, never a coverage figure); a unit-test duration or suite runtime limit for "fast" (only that unit tests are kept fast, as declared, is checked); a type-annotation percentage for public or all functions (only that public functions are annotated is checked); a number of dependencies a project may declare, or a dependency age, licence or vulnerability bar; a specific Python, mypy, pyright, ruff, black or pytest version (only that the tools are configured and run is checked); a network-call timeout value in seconds (only that every network call carries a timeout is checked); a lockfile format or hash standard beyond a lock being present; a build-reproducibility standard beyond builds being reproducible as declared; a formatter line length or any other style metric; a count of entry points, modules or functions. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** production Python engineering record: a verdict of `PRODUCTION_PYTHON_ENGINEERING_PACK_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares annotated public functions, pinned dependencies and no secrets passes those checks even if the real code did none of it. It is a completeness and consistency audit of the engineering record the skill requires, **not a code-review service, a linting or type-checking service, a security audit of actual code, or a prediction that the project will run correctly**. Specifically: it writes no Python itself, runs no interpreter, linter, type checker or test suite, inspects no repository, virtualenv, lockfile or notebook, and does not verify that a declared practice was ever carried out. It never judges whether the annotations are accurate, whether the pinned versions are safe or current, whether the tests are meaningful, or whether the code is good — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared dependency rows are internally consistent. Named exclusions: no numeric thresholds (see the declined list above); no live verification of any declared fact; no judgment of code *quality* — whether the typing, error handling, async design or tests are adequate for the real project is the caller's declaration, checked only for declared presence and consistency; the skill's stdlib-first posture is honoured only in that an empty dependency list is a valid declaration — this atom never judges whether a declared dependency should have been stdlib instead; secrets substance (whether a real secret leaked) is a caller declaration — only its declared absence is checked.

**Distinct ground.** Against the expert sibling `production-python-engineering-pack-expert`, SERVICE.md states the boundary as: advanced Python practice (profiling, acceleration, idioms at depth, API/CLI surface craft) there, the base production discipline here. This atom's ground is the base production discipline only — one virtualenv per project and nothing installed into system Python, dependencies declared in pyproject.toml with a lockfile and every declared dependency row pinned, public functions annotated with a type checker in the loop and typed models validating at the boundaries, ruff plus ruff format or black, no mutable default arguments, f-strings, pathlib over string paths, specific exceptions with loud contextual failure, logging never print in libraries, context managers for files/sockets/locks with no orphaned handles, no blocking calls in event loops with timeouts on every network call and structured concurrency, pytest with fixtures and parametrize, error paths tested with time and randomness frozen and pytest green, pyproject metadata with console entry points and reproducible builds, and the Python red lines (no secrets in code or notebooks, no unpinned pip install in production paths, no bare excepts).

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Product services and automation builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared production Python engineering record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly (U-13 regulatory screen) that its output could not read as regulated professional advice, that it offers no engineering-practice advice in the APEGA-regulated sense (no design, stamping or safety-critical-system judgment), no securities or financial advice, and no psychology-adjacent coaching. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `production_python_engineering_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/production_python_engineering_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_production_python_engineering_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/production-python-engineering-pack` (REST) and `POST /mcp/production-python-engineering-pack` (MCP, tool `production_python_engineering_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 9595ea665b634289aad158b7fff277ac). Key scope: `production_python_engineering_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_secrets_in_code_or_notebooks` (input `red_lines.secrets_in_code_or_notebooks_present`), `no_unpinned_pip_install_in_production_paths` (input `red_lines.unpinned_pip_install_in_production_paths_present`) and `no_bare_except_clauses` (input `red_lines.bare_except_present`), plus the computed checks `dependencies_declared`, `every_dependency_version_pinned` and `no_dependency_name_duplicated`, which read the `dependencies` rows rather than any single input field. The remaining recorded check names match the leaf name of the input field they read (for example `virtualenv_per_project_used` reads `environment.virtualenv_per_project_used`).
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`environment`, `typing`, `style`, `errors`, `resources`, `async_practices`, `testing`, `packaging`, `red_lines`) or for a `dependencies[]` row object. The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and `dependencies`, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 39 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `environment` and `dependencies` inputs are read by the single recorded section `environment_and_dependencies`, `typing` and `style` inputs are read by the single recorded section `typing_and_style`, and `errors`, `resources` and `async_practices` inputs are read by the single recorded section `errors_resources_and_async`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on an undeclared `dependencies` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `dependencies_count` and the coverage ratio, but does not state a null rule for the two row-name / name lists. The recorded sparse response returns both lists as `null` when `dependencies` is not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Case-design prose in cases.json / corrections.json:** the executed `cases.json` inputs and expects were compared with the recorded executions in evidence.json and match them, but `corrections.json` records that the raw case design diverged from the recorded executions in six places, all corrected at design time before execution (also listed as tester errors in TEST-REPORT.md): the violations `failing_checks` first named the input field path `red_lines.secrets_in_code_or_notebooks_present` and the name `dependencies_pinned`, neither of which is in the atom's 39-check register, instead of the exact check names `no_secrets_in_code_or_notebooks` and `every_dependency_version_pinned`; the full-pass and violations expects first carried their computed quantities only in prose notes, with no structured `computed_spot_checks`; the malformed input first carried 2 type violations (`project` as a number as well as `environment` as a string) instead of exactly one; and the sparse case first carried `project` plus `environment.virtualenv_per_project_used` = true instead of an identity-only manifest. The corrected, executed battery is what this document follows; where any prose had differed, the responses govern.

## Worked examples

Provenance: recorded 2026-11-16T09:46:37.234913+00:00 against gateway v1.1.0, external verification lane, source `verification/work/production-python-engineering-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T09:46:37.234913+00:00 · gateway v1.1.0 · source `verification/work/production-python-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "test-project",
  "environment": {
    "virtualenv_per_project_used": true,
    "dependencies_declared_in_pyproject": true,
    "dependency_lockfile_present": true,
    "no_installs_into_system_python": true
  },
  "dependencies": [
    {
      "name": "requests",
      "version_pinned": true
    }
  ],
  "typing": {
    "public_functions_annotated": true,
    "type_checker_run_in_loop": true,
    "typed_models_at_boundaries_for_validation": true
  },
  "style": {
    "ruff_linter_configured": true,
    "formatter_ruff_format_or_black_configured": true,
    "no_mutable_default_arguments": true,
    "f_strings_used_for_formatting": true,
    "pathlib_used_over_string_paths": true
  },
  "errors": {
    "specific_exceptions_caught": true,
    "errors_fail_loudly_with_context": true,
    "logging_used_not_print_in_libraries": true
  },
  "resources": {
    "context_managers_used_for_files_sockets_locks": true,
    "orphaned_handles_avoided": true
  },
  "async_practices": {
    "no_blocking_calls_in_event_loops": true,
    "timeouts_on_every_network_call": true,
    "structured_concurrency_used_where_possible": true
  },
  "testing": {
    "pytest_suite_present": true,
    "pytest_fixtures_used": true,
    "pytest_parametrize_used": true,
    "error_paths_tested_under_pytest": true,
    "time_and_randomness_frozen_in_tests": true,
    "unit_tests_fast_declared": true,
    "pytest_green_including_error_paths": true
  },
  "packaging": {
    "pyproject_metadata_present": true,
    "console_entry_points_declared": true,
    "reproducible_builds_declared": true,
    "production_dependencies_pinned": true,
    "ruff_and_type_checker_clean_on_diff": true,
    "virtualenv_reproducible_declared": true
  },
  "red_lines": {
    "secrets_in_code_or_notebooks_present": false,
    "unpinned_pip_install_in_production_paths_present": false,
    "bare_except_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "production-python-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "PRODUCTION_PYTHON_ENGINEERING_PACK_READY",
  "sections": {
    "environment_and_dependencies": "pass",
    "typing_and_style": "pass",
    "errors_resources_and_async": "pass",
    "testing_discipline": "pass",
    "packaging_and_reproducibility": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "environment_and_dependencies",
      "check": "virtualenv_per_project_used",
      "status": "pass",
      "evidence": "environment: one virtualenv is used per project"
    },
    {
      "section": "environment_and_dependencies",
      "check": "dependencies_declared_in_pyproject",
      "status": "pass",
      "evidence": "environment: dependencies are declared in pyproject.toml"
    },
    {
      "section": "environment_and_dependencies",
      "check": "dependency_lockfile_present",
      "status": "pass",
      "evidence": "environment: dependencies are pinned in pyproject.toml plus a lock — a lockfile is present"
    },
    {
      "section": "environment_and_dependencies",
      "check": "no_installs_into_system_python",
      "status": "pass",
      "evidence": "environment: nothing is installed into system Python"
    },
    {
      "section": "environment_and_dependencies",
      "check": "dependencies_declared",
      "status": "pass",
      "evidence": "the declared record names its dependencies — the dependencies list is present; an empty list declares that the project has no third-party dependencies"
    },
    {
      "section": "environment_and_dependencies",
      "check": "every_dependency_version_pinned",
      "status": "pass",
      "evidence": "dependencies: every declared dependency row declares its version pinned — dependencies are pinned and no unpinned install reaches production paths"
    },
    {
      "section": "environment_and_dependencies",
      "check": "no_dependency_name_duplicated",
      "status": "pass",
      "evidence": "dependencies: no declared dependency name is owned by more than one dependency row"
    },
    {
      "section": "typing_and_style",
      "check": "public_functions_annotated",
      "status": "pass",
      "evidence": "typing: public functions are annotated"
    },
    {
      "section": "typing_and_style",
      "check": "type_checker_run_in_loop",
      "status": "pass",
      "evidence": "typing: mypy or pyright runs in the development loop"
    },
    {
      "section": "typing_and_style",
      "check": "typed_models_at_boundaries_for_validation",
      "status": "pass",
      "evidence": "typing: dataclasses or Pydantic models validate at the boundaries"
    },
    {
      "section": "typing_and_style",
      "check": "ruff_linter_configured",
      "status": "pass",
      "evidence": "style: ruff is configured as the linter"
    },
    {
      "section": "typing_and_style",
      "check": "formatter_ruff_format_or_black_configured",
      "status": "pass",
      "evidence": "style: a formatter — ruff format or black — is configured"
    },
    {
      "section": "typing_and_style",
      "check": "no_mutable_default_arguments",
      "status": "pass",
      "evidence": "style: no mutable default arguments are used"
    },
    {
      "section": "typing_and_style",
      "check": "f_strings_used_for_formatting",
      "status": "pass",
      "evidence": "style: f-strings are used for string formatting"
    },
    {
      "section": "typing_and_style",
      "check": "pathlib_used_over_string_paths",
      "status": "pass",
      "evidence": "style: pathlib is used over string paths"
    },
    {
      "section": "errors_resources_and_async",
      "check": "specific_exceptions_caught",
      "status": "pass",
      "evidence": "errors: specific exceptions are caught, not blanket handlers"
    },
    {
      "section": "errors_resources_and_async",
      "check": "errors_fail_loudly_with_context",
      "status": "pass",
      "evidence": "errors: failures are loud and carry context"
    },
    {
      "section": "errors_resources_and_async",
      "check": "logging_used_not_print_in_libraries",
      "status": "pass",
      "evidence": "errors: libraries log with the logging module — never print in libraries"
    },
    {
      "section": "errors_resources_and_async",
      "check": "context_managers_used_for_files_sockets_locks",
      "status": "pass",
      "evidence": "resources: context managers are used for files, sockets and locks"
    },
    {
      "section": "errors_resources_and_async",
      "check": "orphaned_handles_avoided",
      "status": "pass",
      "evidence": "resources: no orphaned handles are left behind"
    },
    {
      "section": "errors_resources_and_async",
      "check": "no_blocking_calls_in_event_loops",
      "status": "pass",
      "evidence": "async discipline: no blocking calls run in event loops"
    },
    {
      "section": "errors_resources_and_async",
      "check": "timeouts_on_every_network_call",
      "status": "pass",
      "evidence": "async discipline: every network call carries a timeout"
    },
    {
      "section": "errors_resources_and_async",
      "check": "structured_concurrency_used_where_possible",
      "status": "pass",
      "evidence": "async discipline: structured concurrency is used where possible"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_suite_present",
      "status": "pass",
      "evidence": "tests: the test suite runs under pytest"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_fixtures_used",
      "status": "pass",
      "evidence": "tests: pytest fixtures are used"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_parametrize_used",
      "status": "pass",
      "evidence": "tests: pytest parametrize is used for case tables"
    },
    {
      "section": "testing_discipline",
      "check": "error_paths_tested_under_pytest",
      "status": "pass",
      "evidence": "tests: error paths are tested, not only happy paths"
    },
    {
      "section": "testing_discipline",
      "check": "time_and_randomness_frozen_in_tests",
      "status": "pass",
      "evidence": "tests: time and randomness are frozen where the tests depend on them"
    },
    {
      "section": "testing_discipline",
      "check": "unit_tests_fast_declared",
      "status": "pass",
      "evidence": "tests: unit tests are kept fast, as declared"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_green_including_error_paths",
      "status": "pass",
      "evidence": "tests: pytest is green, including the error-path tests"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "pyproject_metadata_present",
      "status": "pass",
      "evidence": "packaging: pyproject carries the package metadata"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "console_entry_points_declared",
      "status": "pass",
      "evidence": "packaging: console entry points are declared"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "reproducible_builds_declared",
      "status": "pass",
      "evidence": "packaging: builds are reproducible, as declared"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "production_dependencies_pinned",
      "status": "pass",
      "evidence": "packaging: dependencies are pinned for production"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "ruff_and_type_checker_clean_on_diff",
      "status": "pass",
      "evidence": "quality gate: ruff and the type checker are clean on the diff"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "virtualenv_reproducible_declared",
      "status": "pass",
      "evidence": "quality gate: the virtualenv is reproducible, as declared"
    },
    {
      "section": "red_lines",
      "check": "no_secrets_in_code_or_notebooks",
      "status": "pass",
      "evidence": "red line: no secrets in code or notebooks are present — secrets live in env or a keystore"
    },
    {
      "section": "red_lines",
      "check": "no_unpinned_pip_install_in_production_paths",
      "status": "pass",
      "evidence": "red line: no unpinned pip install is present in production paths"
    },
    {
      "section": "red_lines",
      "check": "no_bare_except_clauses",
      "status": "pass",
      "evidence": "red line: no bare except clauses are present"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "dependencies_count": 1,
  "dependencies_without_pin": [],
  "pin_coverage": "1.000000",
  "duplicate_dependency_names": [],
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across six sections.",
  "stamp": "PRODUCTION PYTHON ENGINEERING PACK\nproject: test-project\nVERDICT: PRODUCTION_PYTHON_ENGINEERING_PACK_READY\n  environment_and_dependencies                 pass\n  typing_and_style                             pass\n  errors_resources_and_async                   pass\n  testing_discipline                           pass\n  packaging_and_reproducibility                pass\n  red_lines                                    pass\n39 pass, 0 fail, 0 missing of 39 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T09:46:37.234913+00:00 · gateway v1.1.0 · source `verification/work/production-python-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "test-project",
  "environment": {
    "virtualenv_per_project_used": true,
    "dependencies_declared_in_pyproject": true,
    "dependency_lockfile_present": true,
    "no_installs_into_system_python": true
  },
  "dependencies": [
    {
      "name": "requests",
      "version_pinned": false
    },
    {
      "name": "requests",
      "version_pinned": true
    }
  ],
  "typing": {
    "public_functions_annotated": true,
    "type_checker_run_in_loop": true,
    "typed_models_at_boundaries_for_validation": true
  },
  "style": {
    "ruff_linter_configured": true,
    "formatter_ruff_format_or_black_configured": true,
    "no_mutable_default_arguments": true,
    "f_strings_used_for_formatting": true,
    "pathlib_used_over_string_paths": true
  },
  "errors": {
    "specific_exceptions_caught": true,
    "errors_fail_loudly_with_context": true,
    "logging_used_not_print_in_libraries": true
  },
  "resources": {
    "context_managers_used_for_files_sockets_locks": true,
    "orphaned_handles_avoided": true
  },
  "async_practices": {
    "no_blocking_calls_in_event_loops": true,
    "timeouts_on_every_network_call": true,
    "structured_concurrency_used_where_possible": true
  },
  "testing": {
    "pytest_suite_present": true,
    "pytest_fixtures_used": true,
    "pytest_parametrize_used": true,
    "error_paths_tested_under_pytest": true,
    "time_and_randomness_frozen_in_tests": true,
    "unit_tests_fast_declared": true,
    "pytest_green_including_error_paths": true
  },
  "packaging": {
    "pyproject_metadata_present": true,
    "console_entry_points_declared": true,
    "reproducible_builds_declared": true,
    "production_dependencies_pinned": true,
    "ruff_and_type_checker_clean_on_diff": true,
    "virtualenv_reproducible_declared": true
  },
  "red_lines": {
    "secrets_in_code_or_notebooks_present": true,
    "unpinned_pip_install_in_production_paths_present": false,
    "bare_except_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "production-python-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY",
  "sections": {
    "environment_and_dependencies": "fail",
    "typing_and_style": "pass",
    "errors_resources_and_async": "pass",
    "testing_discipline": "pass",
    "packaging_and_reproducibility": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "environment_and_dependencies",
      "check": "virtualenv_per_project_used",
      "status": "pass",
      "evidence": "environment: one virtualenv is used per project"
    },
    {
      "section": "environment_and_dependencies",
      "check": "dependencies_declared_in_pyproject",
      "status": "pass",
      "evidence": "environment: dependencies are declared in pyproject.toml"
    },
    {
      "section": "environment_and_dependencies",
      "check": "dependency_lockfile_present",
      "status": "pass",
      "evidence": "environment: dependencies are pinned in pyproject.toml plus a lock — a lockfile is present"
    },
    {
      "section": "environment_and_dependencies",
      "check": "no_installs_into_system_python",
      "status": "pass",
      "evidence": "environment: nothing is installed into system Python"
    },
    {
      "section": "environment_and_dependencies",
      "check": "dependencies_declared",
      "status": "pass",
      "evidence": "the declared record names its dependencies — the dependencies list is present; an empty list declares that the project has no third-party dependencies"
    },
    {
      "section": "environment_and_dependencies",
      "check": "every_dependency_version_pinned",
      "status": "fail",
      "evidence": "dependencies: every declared dependency row declares its version pinned — dependencies are pinned and no unpinned install reaches production paths"
    },
    {
      "section": "environment_and_dependencies",
      "check": "no_dependency_name_duplicated",
      "status": "fail",
      "evidence": "dependencies: no declared dependency name is owned by more than one dependency row"
    },
    {
      "section": "typing_and_style",
      "check": "public_functions_annotated",
      "status": "pass",
      "evidence": "typing: public functions are annotated"
    },
    {
      "section": "typing_and_style",
      "check": "type_checker_run_in_loop",
      "status": "pass",
      "evidence": "typing: mypy or pyright runs in the development loop"
    },
    {
      "section": "typing_and_style",
      "check": "typed_models_at_boundaries_for_validation",
      "status": "pass",
      "evidence": "typing: dataclasses or Pydantic models validate at the boundaries"
    },
    {
      "section": "typing_and_style",
      "check": "ruff_linter_configured",
      "status": "pass",
      "evidence": "style: ruff is configured as the linter"
    },
    {
      "section": "typing_and_style",
      "check": "formatter_ruff_format_or_black_configured",
      "status": "pass",
      "evidence": "style: a formatter — ruff format or black — is configured"
    },
    {
      "section": "typing_and_style",
      "check": "no_mutable_default_arguments",
      "status": "pass",
      "evidence": "style: no mutable default arguments are used"
    },
    {
      "section": "typing_and_style",
      "check": "f_strings_used_for_formatting",
      "status": "pass",
      "evidence": "style: f-strings are used for string formatting"
    },
    {
      "section": "typing_and_style",
      "check": "pathlib_used_over_string_paths",
      "status": "pass",
      "evidence": "style: pathlib is used over string paths"
    },
    {
      "section": "errors_resources_and_async",
      "check": "specific_exceptions_caught",
      "status": "pass",
      "evidence": "errors: specific exceptions are caught, not blanket handlers"
    },
    {
      "section": "errors_resources_and_async",
      "check": "errors_fail_loudly_with_context",
      "status": "pass",
      "evidence": "errors: failures are loud and carry context"
    },
    {
      "section": "errors_resources_and_async",
      "check": "logging_used_not_print_in_libraries",
      "status": "pass",
      "evidence": "errors: libraries log with the logging module — never print in libraries"
    },
    {
      "section": "errors_resources_and_async",
      "check": "context_managers_used_for_files_sockets_locks",
      "status": "pass",
      "evidence": "resources: context managers are used for files, sockets and locks"
    },
    {
      "section": "errors_resources_and_async",
      "check": "orphaned_handles_avoided",
      "status": "pass",
      "evidence": "resources: no orphaned handles are left behind"
    },
    {
      "section": "errors_resources_and_async",
      "check": "no_blocking_calls_in_event_loops",
      "status": "pass",
      "evidence": "async discipline: no blocking calls run in event loops"
    },
    {
      "section": "errors_resources_and_async",
      "check": "timeouts_on_every_network_call",
      "status": "pass",
      "evidence": "async discipline: every network call carries a timeout"
    },
    {
      "section": "errors_resources_and_async",
      "check": "structured_concurrency_used_where_possible",
      "status": "pass",
      "evidence": "async discipline: structured concurrency is used where possible"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_suite_present",
      "status": "pass",
      "evidence": "tests: the test suite runs under pytest"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_fixtures_used",
      "status": "pass",
      "evidence": "tests: pytest fixtures are used"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_parametrize_used",
      "status": "pass",
      "evidence": "tests: pytest parametrize is used for case tables"
    },
    {
      "section": "testing_discipline",
      "check": "error_paths_tested_under_pytest",
      "status": "pass",
      "evidence": "tests: error paths are tested, not only happy paths"
    },
    {
      "section": "testing_discipline",
      "check": "time_and_randomness_frozen_in_tests",
      "status": "pass",
      "evidence": "tests: time and randomness are frozen where the tests depend on them"
    },
    {
      "section": "testing_discipline",
      "check": "unit_tests_fast_declared",
      "status": "pass",
      "evidence": "tests: unit tests are kept fast, as declared"
    },
    {
      "section": "testing_discipline",
      "check": "pytest_green_including_error_paths",
      "status": "pass",
      "evidence": "tests: pytest is green, including the error-path tests"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "pyproject_metadata_present",
      "status": "pass",
      "evidence": "packaging: pyproject carries the package metadata"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "console_entry_points_declared",
      "status": "pass",
      "evidence": "packaging: console entry points are declared"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "reproducible_builds_declared",
      "status": "pass",
      "evidence": "packaging: builds are reproducible, as declared"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "production_dependencies_pinned",
      "status": "pass",
      "evidence": "packaging: dependencies are pinned for production"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "ruff_and_type_checker_clean_on_diff",
      "status": "pass",
      "evidence": "quality gate: ruff and the type checker are clean on the diff"
    },
    {
      "section": "packaging_and_reproducibility",
      "check": "virtualenv_reproducible_declared",
      "status": "pass",
      "evidence": "quality gate: the virtualenv is reproducible, as declared"
    },
    {
      "section": "red_lines",
      "check": "no_secrets_in_code_or_notebooks",
      "status": "fail",
      "evidence": "red line: no secrets in code or notebooks are present — secrets live in env or a keystore"
    },
    {
      "section": "red_lines",
      "check": "no_unpinned_pip_install_in_production_paths",
      "status": "pass",
      "evidence": "red line: no unpinned pip install is present in production paths"
    },
    {
      "section": "red_lines",
      "check": "no_bare_except_clauses",
      "status": "pass",
      "evidence": "red line: no bare except clauses are present"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "dependencies_count": 2,
  "dependencies_without_pin": [
    "requests"
  ],
  "pin_coverage": "0.500000",
  "duplicate_dependency_names": [
    "requests"
  ],
  "summary": "36 pass, 3 fail, 0 missing of 39 checks across six sections.",
  "stamp": "PRODUCTION PYTHON ENGINEERING PACK\nproject: test-project\nVERDICT: PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY\n  environment_and_dependencies                 fail\n  typing_and_style                             pass\n  errors_resources_and_async                   pass\n  testing_discipline                           pass\n  packaging_and_reproducibility                pass\n  red_lines                                    fail\n36 pass, 3 fail, 0 missing of 39 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T09:46:37.234913+00:00 · gateway v1.1.0 · source `verification/work/production-python-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "Malformed Project",
  "environment": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "environment",
  "detail": "environment must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared production Python engineering record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a code-review service, a linting or type-checking service, a security audit of actual code or a prediction that the project will run correctly, and it verifies no live fact. |
| Checks named | 39 documented / 39 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`dependencies_count`, the two row-name / name lists and the coverage ratio) |
| Input reference typed | Yes — 50 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/production-python-engineering-pack/evidence.json` |
