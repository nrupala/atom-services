import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from rag_retrieval_evaluation_tuning import evaluate, stamp  # noqa: E402

SOUND = {
    "system": "example-rag",
    "corpus": {"inventory_declared": True,
               "freshness_requirements_declared": True,
               "dedup_rules_declared": True,
               "per_document_provenance_tracked": True},
    "chunking": {"semantic_units": True,
                 "overlap_discipline_declared": True,
                 "stable_chunk_ids": True},
    "retrieval": {"lexical_used": True, "vector_used": True,
                  "scores_combined_with_declared_weights": True,
                  "embedding_model_version_pinned": True,
                  "reindex_plan_for_model_change": True},
    "reranking": {"applied": True, "reranker_budget_declared": True,
                  "context_top_n_bounded": True,
                  "filters_applied_before_ranking": True,
                  "scope_leakage_tested": True,
                  "context_token_budget": 4000},
    "index": {"incremental_updates_with_tombstones": True,
              "full_rebuild_drill_done": True,
              "size_quota_budgets_monitored": True,
              "embedding_model_and_index_versioned": True},
    "evaluation": {"golden_queries_labeled": True,
                   "thresholds_declared": True,
                   "evals_run_in_regression": True,
                   "real_queries_logged_privacy_scoped": True,
                   "tuning_performed": True,
                   "evals_run_before_tuning": True},
    "serving": {"latency_budgets_per_stage_declared": True,
                "latency_budget_measured": True,
                "hot_queries_cached": True,
                "lexical_only_fallback_exists": True},
    "privacy": {"query_time_access_scopes_enforced": True,
                "sensitive_content_excluded_or_encrypted": True,
                "private_corpus": True,
                "local_embeddings_for_private_corpus": True},
    "queries": [
        {"name": "q1", "k": 2,
         "relevant_doc_ids": ["d1", "d2"],
         "retrieved_doc_ids": ["d1", "d2", "d3"],
         "relevance_grades": {"d1": 2, "d2": 1},
         "forbidden_doc_ids": ["x1"],
         "context_tokens": 1200,
         "min_recall_at_k": 0.9, "min_mrr": 0.9, "min_ndcg_at_k": 0.9},
        {"name": "q2", "k": 2,
         "relevant_doc_ids": ["d4"],
         "retrieved_doc_ids": ["d4", "d5"],
         "forbidden_doc_ids": [],
         "context_tokens": 800,
         "min_recall_at_k": 0.5, "min_mrr": 0.5, "min_ndcg_at_k": 0.5},
    ],
}


def check(v, name):
    return next(c for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "RAG_EVALUATION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 36)
        self.assertEqual(v["metrics"]["queries_total"], 2)
        self.assertEqual(v["metrics"]["queries_meeting_thresholds"], 2)
        self.assertEqual(v["metrics"]["mean_recall_at_k"], "1.0000")
        self.assertEqual(v["metrics"]["mean_mrr"], "1.0000")
        self.assertEqual(v["metrics"]["mean_ndcg_at_k"], "1.0000")
        self.assertEqual(v["metrics"]["leaked_doc_count"], 0)

    def test_metrics_computed_for_partial_retrieval(self):
        m = copy.deepcopy(SOUND)
        # q1: recall@2 = 1/2, RR = 1/2, nDCG@2 below its thresholds.
        m["queries"][0]["retrieved_doc_ids"] = ["d3", "d1", "d2"]
        m["queries"][0]["min_recall_at_k"] = 0.4
        m["queries"][0]["min_mrr"] = 0.4
        m["queries"][0]["min_ndcg_at_k"] = 0.4
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_SOUND")
        self.assertEqual(v["metrics"]["mean_recall_at_k"], "0.7500")
        self.assertEqual(v["metrics"]["mean_mrr"], "0.7500")

    def test_query_below_declared_threshold_fails_evaluation(self):
        m = copy.deepcopy(SOUND)
        m["queries"][0]["retrieved_doc_ids"] = ["d3", "d9"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")
        self.assertEqual(v["sections"]["evaluation"], "fail")
        self.assertEqual(
            check(v, "golden_metrics_meet_declared_thresholds")["status"],
            "fail")
        self.assertEqual(v["metrics"]["queries_meeting_thresholds"], 1)

    def test_threshold_out_of_range_fails(self):
        m = copy.deepcopy(SOUND)
        m["queries"][0]["min_recall_at_k"] = 1.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")

    def test_scope_leakage_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["queries"][0]["retrieved_doc_ids"] = ["d1", "d2", "x1"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")
        self.assertEqual(
            check(v, "no_scope_leakage_in_retrieved_results")["status"],
            "fail")
        self.assertEqual(v["metrics"]["leaked_doc_count"], 1)

    def test_context_over_budget_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["queries"][1]["context_tokens"] = 9000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")
        self.assertEqual(v["sections"]["reranking_and_filters"], "fail")
        self.assertEqual(
            check(v, "context_within_declared_token_budget")["status"],
            "fail")

    def test_tuning_without_evals_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["evaluation"]["evals_run_before_tuning"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")
        self.assertEqual(check(v, "no_tuning_without_evals")["status"],
                         "fail")

    def test_no_tuning_declared_passes_tuning_check(self):
        m = copy.deepcopy(SOUND)
        m["evaluation"]["tuning_performed"] = False
        del m["evaluation"]["evals_run_before_tuning"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_SOUND")

    def test_filters_after_ranking_fails(self):
        m = copy.deepcopy(SOUND)
        m["reranking"]["filters_applied_before_ranking"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")
        self.assertEqual(v["sections"]["reranking_and_filters"], "fail")

    def test_no_fallback_fails_serving(self):
        m = copy.deepcopy(SOUND)
        m["serving"]["lexical_only_fallback_exists"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")
        self.assertEqual(v["sections"]["serving_and_privacy"], "fail")

    def test_private_corpus_without_local_embeddings_fails(self):
        m = copy.deepcopy(SOUND)
        m["privacy"]["local_embeddings_for_private_corpus"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_UNSOUND")

    def test_no_private_corpus_passes_local_embeddings_as_na(self):
        m = copy.deepcopy(SOUND)
        m["privacy"]["private_corpus"] = False
        del m["privacy"]["local_embeddings_for_private_corpus"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_SOUND")

    def test_query_missing_threshold_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["queries"][0]["min_mrr"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check(v, "golden_metrics_meet_declared_thresholds")["status"],
            "missing")
        self.assertIsNone(v["metrics"]["mean_recall_at_k"])

    def test_query_missing_forbidden_list_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["queries"][0]["forbidden_doc_ids"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check(v, "no_scope_leakage_in_retrieved_results")["status"],
            "missing")

    def test_query_missing_context_tokens_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["queries"][0]["context_tokens"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check(v, "context_within_declared_token_budget")["status"],
            "missing")

    def test_no_queries_declared_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["queries"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["metrics"]["queries_total"], 0)
        self.assertIsNone(v["metrics"]["mean_mrr"])

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["index"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["index_hygiene"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["metrics"]["queries_total"], 0)

    def test_binary_grades_used_when_grades_not_declared(self):
        m = copy.deepcopy(SOUND)
        del m["queries"][0]["relevance_grades"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RAG_EVALUATION_SOUND")
        self.assertEqual(v["metrics"]["mean_ndcg_at_k"], "1.0000")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: RAG_EVALUATION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"corpus": "this-should-be-an-object"})
        self.assertIn("corpus", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["corpus"]["inventory_declared"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("corpus.inventory_declared", str(ctx.exception))

    def test_token_budget_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["reranking"]["context_token_budget"] = "4000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("reranking.context_token_budget",
                      str(ctx.exception))

    def test_queries_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["queries"] = "q1"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("queries", str(ctx.exception))

    def test_query_k_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["queries"][0]["k"] = "2"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("queries[0].k", str(ctx.exception))

    def test_doc_id_entry_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["queries"][0]["relevant_doc_ids"] = ["d1", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("queries[0].relevant_doc_ids[1]",
                      str(ctx.exception))

    def test_relevance_grades_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["queries"][0]["relevance_grades"] = "high"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("queries[0].relevance_grades", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["reranking"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("reranking", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
