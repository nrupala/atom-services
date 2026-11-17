import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from token_estimator import evaluate, stamp


def test_empty_text_is_zero():
    r = evaluate({"text": ""})
    assert r["estimated_tokens"] == 0
    assert r["chars"] == 0


def test_single_word():
    # one word at the generic factor 133 hundredths -> ceil = 2
    r = evaluate({"text": "hello"})
    assert r["words"] == 1
    assert r["estimated_tokens"] == 2


def test_sentence_estimate_in_range():
    text = "The quick brown fox jumps over the lazy dog."
    r = evaluate({"text": text})
    # 9 words (9*133) + 8 single spaces (8*10) + final period (100)
    # = 1377 hundredths -> ceil = 14 tokens
    assert r["words"] == 9
    assert r["estimated_tokens"] == 14
    assert r["range_low"] <= r["estimated_tokens"] <= r["range_high"]


def test_family_changes_factor():
    text = " ".join(["word"] * 100)
    gpt = evaluate({"text": text, "model_family": "gpt"})
    claude = evaluate({"text": text, "model_family": "claude"})
    assert gpt["estimated_tokens"] != claude["estimated_tokens"]
    assert gpt["model_family"] == "gpt"


def test_unknown_family_raises():
    try:
        evaluate({"text": "x", "model_family": "bert"})
    except ValueError as e:
        assert "model_family" in str(e)
    else:
        raise AssertionError("expected ValueError")


def test_numbers_grouped_by_three_digits():
    r = evaluate({"text": "1234567"})
    # 7 digits -> 3 started groups -> 300 hundredths -> 3 tokens
    assert r["estimated_tokens"] == 3


def test_cjk_chars_count_one_each():
    r = evaluate({"text": "你好世界"})
    assert r["estimated_tokens"] == 4


def test_messages_add_overhead():
    one = evaluate({"messages": [{"role": "user", "content": "hello"}]})
    # content 133 + generic overhead 400 = 533 -> 6 tokens
    assert one["message_count"] == 1
    assert one["estimated_tokens"] == 6
    two = evaluate({"messages": [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hello"},
    ]})
    assert two["estimated_tokens"] == 11


def test_text_and_messages_conflict():
    try:
        evaluate({"text": "x", "messages": []})
    except ValueError as e:
        assert "not both" in str(e)
    else:
        raise AssertionError("expected ValueError")


def test_neither_text_nor_messages():
    try:
        evaluate({})
    except ValueError as e:
        assert "required" in str(e)
    else:
        raise AssertionError("expected ValueError")


def test_message_without_content_raises():
    try:
        evaluate({"messages": [{"role": "user"}]})
    except ValueError as e:
        assert "content" in str(e)
    else:
        raise AssertionError("expected ValueError")


def test_deterministic():
    payload = {"text": "Determinism check, with punctuation! And 42 numbers."}
    assert evaluate(payload) == evaluate(payload)


def test_method_states_estimate():
    r = evaluate({"text": "anything"})
    assert "not a tokenizer count" in r["method"]


def test_range_brackets_estimate():
    r = evaluate({"text": " ".join(["payload"] * 40)})
    assert r["range_low"] < r["estimated_tokens"] < r["range_high"]


def test_stamp_renders():
    s = stamp(evaluate({"text": "hello world"}))
    assert s.startswith("TOKEN ESTIMATOR")
    assert "estimated_tokens" in s
