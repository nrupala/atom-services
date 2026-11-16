# Database design review — `database-design-review`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Designs data models and picks the right database for how the data is actually used — because schema mistakes are the most expensive to undo.

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product schema design work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the database-design manifest

The caller submits one JSON manifest: a declared database design
record for one system. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`DATABASE_DESIGN_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `design` (string; carried into the verdict output, not itself checked) | — |
| `store_selection.access_patterns_mapped` | schema_and_normalization |
| `store_selection.store_chosen_from_access_patterns` | schema_and_normalization |
| `store_selection.relational_default_or_fit_justified` | schema_and_normalization |
| `tables` (list of table-row objects, each `{name, primary_key, constraints_declared}` — see the three entry fields below; computed, see below) | schema_and_normalization |
| `tables[].name` (string; names the row in the computed `tables_without_*` outputs) | schema_and_normalization |
| `tables[].primary_key` (string; must be a non-empty string for the row to pass the computed primary-key check — an absent field is missing evidence, an empty string fails) | schema_and_normalization |
| `tables[].constraints_declared` | schema_and_normalization |
| `normalization.normalized_to_3nf` | schema_and_normalization |
| `normalization.denormalized` (gates the denormalization-reason check below) | schema_and_normalization |
| `normalization.denormalization_reasons_documented` (required when denormalization is declared; otherwise the check passes as not applicable) | schema_and_normalization |
| `query_patterns` (list of query-pattern objects, each `{name, table, supporting_index}` — see the three entry fields below; computed, see below) | indexing_and_performance |
| `query_patterns[].name` (string; names the pattern in the computed `uncovered_query_patterns` output) | indexing_and_performance |
| `query_patterns[].table` (string; a supporting index matches only on the same declared table) | indexing_and_performance |
| `query_patterns[].supporting_index` (string; must name a declared index on the same table for the pattern to pass the computed matching check — an absent field is missing evidence) | indexing_and_performance |
| `indexes` (list of index objects, each `{name, table, columns}` — see the three entry fields below; computed, see below) | indexing_and_performance |
| `indexes[].name` (string; the name a query pattern's `supporting_index` must equal to match) | indexing_and_performance |
| `indexes[].table` (string; must equal the query pattern's declared table to match) | indexing_and_performance |
| `indexes[].columns` (list of strings; must be present and non-empty for the index row to pass the computed columns check) | indexing_and_performance |
| `indexing.composite_column_order_equality_then_range` | indexing_and_performance |
| `indexing.covering_indexes_for_hot_queries` | indexing_and_performance |
| `indexing.write_cost_considered` | indexing_and_performance |
| `indexing.explain_analyze_before_and_after` | indexing_and_performance |
| `performance.measured_first` | indexing_and_performance |
| `performance.n_plus_one_queries_addressed` | indexing_and_performance |
| `performance.keyset_pagination_for_large_sets` | indexing_and_performance |
| `performance.offset_pagination_at_scale_present` (must be `false` to pass — skill anti-pattern) | indexing_and_performance |
| `performance.connection_pooling_declared` | indexing_and_performance |
| `performance.bounded_result_sets` | indexing_and_performance |
| `performance.cache_deliberate_with_honest_invalidation` | indexing_and_performance |
| `integrity.constraints_enforce_invariants` | integrity_transactions_and_security |
| `integrity.appropriate_types_used` | integrity_transactions_and_security |
| `integrity.money_stored_as_float` (must be `false` to pass — skill anti-pattern) | integrity_transactions_and_security |
| `transactions.isolation_level_and_anomalies_known` | integrity_transactions_and_security |
| `transactions.transactions_kept_short` | integrity_transactions_and_security |
| `transactions.writes_idempotent_where_retries_possible` | integrity_transactions_and_security |
| `transactions.distributed_store_used` (gates the trade-off check below) | integrity_transactions_and_security |
| `transactions.consistency_availability_tradeoff_explicit` (required when a distributed store is declared in use; otherwise the check passes as not applicable) | integrity_transactions_and_security |
| `security.parametrized_queries_only` | integrity_transactions_and_security |
| `security.string_concatenated_sql_present` (must be `false` to pass — skill anti-pattern) | integrity_transactions_and_security |
| `security.least_privilege_users_per_service` | integrity_transactions_and_security |
| `security.shared_superuser_present` (must be `false` to pass) | integrity_transactions_and_security |
| `security.encryption_at_rest` | integrity_transactions_and_security |
| `migrations.forward_only` | migrations_and_backups |
| `migrations.past_migrations_edited` (must be `false` to pass — skill anti-pattern) | migrations_and_backups |
| `migrations.expand_contract_pattern_used` | migrations_and_backups |
| `migrations.big_bang_schema_swap_present` (must be `false` to pass) | migrations_and_backups |
| `backups.backups_scheduled` | migrations_and_backups |
| `backups.restores_tested_on_schedule` | migrations_and_backups |
| `backups.untested_backup_trusted` (must be `false` to pass — skill anti-pattern) | migrations_and_backups |

Six checks are computed from the declared rows, using only the
consistency of the declared record itself — no outside threshold
is imported:

- **Tables declared:** the declared `tables` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Primary key per table:** every declared table row must name
  a primary key (a non-empty `primary_key` string). A row with
  the field absent is missing evidence; a row naming an empty
  string fails.
- **Constraints per table:** every declared table row must
  declare `constraints_declared: true`. A row with the field
  absent is missing evidence.
- **Query patterns and indexes declared:** the declared
  `query_patterns` and `indexes` lists each pass only when
  present and non-empty.
- **Columns per index:** every declared index row must declare
  a present, non-empty `columns` list of strings. A row with
  the field absent is missing evidence.
- **Matching index per query pattern:** every declared query
  pattern must name a supporting index that is actually
  declared — an index matches only when its `name` equals the
  pattern's `supporting_index` **and** its declared `table`
  equals the pattern's declared `table`. A pattern with
  `supporting_index` or `table` absent is missing evidence.

Two check groups are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **Denormalization reasons:** the skill binds its documentation
  rule to deliberate denormalization ("denormalize deliberately
  for hot read paths, and document why").
  `denormalization_reasons_documented` is therefore required only
  when `normalization.denormalized` is declared `true`; when no
  denormalization is declared, the check passes as not applicable.
- **Consistency/availability trade-off:** the skill binds its
  explicitness rule to distributed stores ("Be explicit about
  the consistency vs availability trade-off for distributed
  stores"). `consistency_availability_tradeoff_explicit` is
  therefore required only when
  `transactions.distributed_store_used` is declared `true`; when
  no distributed store is declared, the check passes as not
  applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six primary computed checks above cannot be completed),
`tables_count`, `query_patterns_count` and `indexes_count` (the
declared list lengths, or null when the list is not declared —
counts are reported as integers, exactly), the row-name lists
`tables_without_primary_key`,
`tables_without_constraints_declared` and
`uncovered_query_patterns` (null when the underlying list — or,
for uncovered patterns, either list — is not declared; a query
pattern whose `supporting_index` field is absent is missing
evidence and does not appear in `uncovered_query_patterns`), and
the two coverage ratios `primary_key_coverage` (tables naming a
primary key ÷ declared tables) and
`query_pattern_index_coverage` (patterns with a matching
declared index ÷ declared patterns).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty (and, for query
pattern coverage, when the indexes list is absent). That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric threshold — no table count, index
count, or coverage percentage, no transaction duration for
"short", no backup frequency or restore cadence, and no set size
for "large sets" — so no numeric threshold check is invented.
Quantities are computed and reported; the only bar on the
computed rows is completeness over the caller's own declared
rows (every declared table, every declared query pattern),
exactly as stated above. Declined thresholds, named: a minimum
or maximum table/index count; a coverage percentage below
completeness; a numeric transaction-length limit; a numeric
backup/restore schedule; a numeric large-set pagination size;
an isolation-level vocabulary (the skill requires the level and
its anomalies be *known*, and names no allowed values, so only
that attestation is checked).

The verdict is one of `DATABASE_DESIGN_SOUND` (all 42 checks
pass), `DATABASE_DESIGN_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across four sections: schema_and_normalization,
indexing_and_performance, integrity_transactions_and_security,
migrations_and_backups.

## Honest scoping

This atom audits a **declared** database design record — it
designs no schema, chooses no store, runs no database, reads no
migration files or query plans, and does not verify that a
declared control actually works. A design is sound *on the
caller's declared evidence*: a manifest that declares 3NF,
matching indexes, and tested restores passes those checks even
if the real schema does none of it. It is a completeness and
consistency audit of the record the skill requires, **not a
database design service or a performance certification**: it
never judges whether the chosen store is actually right for the
workload, whether the normalization is truly 3NF, whether an
index will actually be used by the planner, or whether the
declared types are correct in the real DDL — only that the
record contains what the skill's sections and anti-patterns
demand, and that its declared rows are internally consistent.

Named exclusions: no numeric thresholds (see the declined list
above); no check that normalization is genuinely 3NF beyond the
declaration; no EXPLAIN/ANALYZE plan inspection — only that
running it before and after is declared; no store-type
vocabulary is imposed (the skill requires the choice follow the
access patterns, and names relational/document/KV/graph/embedded
only as fits, so only the fit attestation is checked); the
skill's two product-shaped rules are not reduced to checks —
embedded (SQLite) for local-first / sovereign apps and
client-side encryption for zero-knowledge products bind only
when the product has that shape, and the record declares no
local-first or zero-knowledge flag to gate them on, so they are
excluded rather than force-fit (general encryption at rest *is*
checked); cache design beyond the deliberate/invalidation-honest
attestation; no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
