# Test report — database-design-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 05ec9d2252ec4e26a46fc028eede90ab
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/database-design-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — 1 table (`users`, PK `id`, constraints declared), 1 query pattern (`get_user` on `users`) matched by 1 declared index (`idx_users_id` on `users`, columns `[id]`), all boolean evidence in its passing state, gated checks not applicable (`denormalized` false, `distributed_store_used` false) | HTTP 200, verdict `DATABASE_DESIGN_SOUND`, `tables_count` 1, `query_patterns_count` 1, `indexes_count` 1, `primary_key_coverage` `1.0000`, `query_pattern_index_coverage` `1.0000`, all row-name lists `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DATABASE_DESIGN_SOUND`, 42 pass / 0 fail / 0 missing, exactly those computed values, all four sections `pass` | PASS |
| 2 | violations — full manifest with exactly 8 planted violations: table `users` with empty-string `primary_key` and `constraints_declared` false, `offset_pagination_at_scale_present` true, `money_stored_as_float` true, `string_concatenated_sql_present` true, `shared_superuser_present` true, `past_migrations_edited` true, `untested_backup_trusted` true | HTTP 200, verdict `DATABASE_DESIGN_NOT_SOUND`, the 8 named checks fail | HTTP 200, `DATABASE_DESIGN_NOT_SOUND`, 34 pass / 8 fail / 0 missing; failing checks exactly `every_table_has_primary_key_named`, `every_table_declares_constraints`, `no_offset_pagination_at_scale`, `money_not_stored_as_float`, `no_string_concatenated_sql`, `no_shared_superuser`, `no_past_migrations_edited`, `untested_backup_not_trusted`; `primary_key_coverage` `0.0000`, `query_pattern_index_coverage` `1.0000`, `tables_without_primary_key` `["users"]`, `tables_without_constraints_declared` `["users"]`, `uncovered_query_patterns` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `design` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 42 missing, all computed fields null, all four sections `insufficient_evidence` | PASS |
| 4 | malformed — `normalization.normalized_to_3nf: "should_be_boolean"` (string where a boolean is required; exactly one type violation) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"normalization.normalized_to_3nf","detail":"normalization.normalized_to_3nf must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `database_design_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 42 checks and a text stamp):

```json
{"service": "database-design-review", "atom_version": "0.1.0", "design": "User profile system", "verdict": "DATABASE_DESIGN_SOUND", "sections": {"schema_and_normalization": "pass", "indexing_and_performance": "pass", "integrity_transactions_and_security": "pass", "migrations_and_backups": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "tables_count": 1, "tables_without_primary_key": [], "tables_without_constraints_declared": [], "primary_key_coverage": "1.0000", "query_patterns_count": 1, "indexes_count": 1, "uncovered_query_patterns": [], "query_pattern_index_coverage": "1.0000", "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections."}
```

Violations response (REST, HTTP 200; computed core):

```json
{"service": "database-design-review", "atom_version": "0.1.0", "design": "User profile system", "verdict": "DATABASE_DESIGN_NOT_SOUND", "sections": {"schema_and_normalization": "fail", "indexing_and_performance": "fail", "integrity_transactions_and_security": "fail", "migrations_and_backups": "fail"}, "computed_status": "outside_stated_limits_on_declared_evidence", "tables_count": 1, "tables_without_primary_key": ["users"], "tables_without_constraints_declared": ["users"], "primary_key_coverage": "0.0000", "query_patterns_count": 1, "indexes_count": 1, "uncovered_query_patterns": [], "query_pattern_index_coverage": "1.0000", "summary": "34 pass, 8 fail, 0 missing of 42 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"normalization.normalized_to_3nf","detail":"normalization.normalized_to_3nf must be a boolean"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage):

1. Full-pass was mis-nested: the designer placed transaction and security fields (`transactions_kept_short`, `writes_idempotent_where_retries_possible`, `distributed_store_used`, `parametrized_queries_only`, `string_concatenated_sql_present`, `least_privilege_users_per_service`, `shared_superuser_present`, `encryption_at_rest`) inside `integrity`, left `transactions` holding only `isolation_level_and_anomalies_known`, and omitted the `security` section entirely — those checks would have read as `missing`, not passing. Corrected before execution: rebuilt with the documented nesting — `integrity` holds only `constraints_enforce_invariants`, `appropriate_types_used`, `money_stored_as_float`; `transactions` and `security` are their own sections with all their fields.
2. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`tables_count` 1, `query_patterns_count` 1, `indexes_count` 1, `primary_key_coverage` `1.0000`, `query_pattern_index_coverage` `1.0000`, `tables_without_primary_key` `[]`, `tables_without_constraints_declared` `[]`, `uncovered_query_patterns` `[]`, `computed_status`).
3. Violations designed `failing_checks` listed descriptive phrases (`Primary key per table`, `Constraints per table`) and field paths (`performance.offset_pagination_at_scale_present`, `integrity.money_stored_as_float`, `security.string_concatenated_sql_present`, `security.shared_superuser_present`, `migrations.past_migrations_edited`, `backups.untested_backup_trusted`) instead of exact check names. Corrected before execution to the 8 exact check names above.
4. Violations input was sparse — only fragments of `tables`, `performance`, `integrity`, `security`, `migrations` and `backups` were present, so most checks would have been `missing`, not failing. Corrected before execution: rebuilt as a full manifest carrying exactly the eight planted violations the designer intended (empty-string primary key, constraints not declared, OFFSET pagination at scale, money as float, string-concatenated SQL, shared superuser, past migrations edited, untested backup trusted), with a structured `computed_spot_checks` block added at the same time.
5. Malformed carried two type violations (`tables: "not_a_list"` and `normalization.normalized_to_3nf: "should_be_boolean"`) instead of exactly one. Corrected before execution: removed the `tables` violation, leaving exactly one — `normalization.normalized_to_3nf` as a string where a boolean is required.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the six primary computed checks, the three declared-list counts, the three row-name lists, and both coverage ratios with the SERVICE.md round-half-up 4dp rule, plus `computed_status`, verdicts, section statuses and summary counts) and verified the artifact's numbers and verdicts. Raw output: `verification/work/database-design-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `tables_count` / `query_patterns_count` / `indexes_count` | 1 / 1 / 1 | 1 / 1 / 1 | ✓ |
| full-pass `primary_key_coverage` (1 ÷ 1) | 1.0000 | 1.0000 | ✓ |
| full-pass `query_pattern_index_coverage` (1 ÷ 1, `idx_users_id` on `users` matches `get_user`) | 1.0000 | 1.0000 | ✓ |
| full-pass row-name lists | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` | within_stated_limits_on_declared_evidence | same | ✓ |
| violations `primary_key_coverage` (0 ÷ 1, empty-string PK) | 0.0000 | 0.0000 | ✓ |
| violations `query_pattern_index_coverage` | 1.0000 | 1.0000 | ✓ |
| violations `tables_without_primary_key` / `tables_without_constraints_declared` | ["users"] / ["users"] | same | ✓ |
| violations `computed_status` | outside_stated_limits_on_declared_evidence | same | ✓ |
| verdicts / summaries | DATABASE_DESIGN_SOUND (42/0/0) / DATABASE_DESIGN_NOT_SOUND (34/8/0, exactly the 8 planted checks) | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 8-check failure set on the violations case. The coordinating tester's own headline recompute also matches: 1 of 1 tables naming a primary key → `primary_key_coverage` `1.0000` on full-pass, 0 of 1 → `0.0000` on violations, identical to the artifacts.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `normalization.normalized_to_3nf`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
