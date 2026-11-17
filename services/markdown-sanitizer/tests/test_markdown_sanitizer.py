import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from markdown_sanitizer import evaluate, stamp


def test_clean_markdown_unchanged():
    r = evaluate({"text": "# Title\n\nSome *markdown* text.\n"})
    assert r["changed"] is False
    assert r["sanitized_text"] == "# Title\n\nSome *markdown* text.\n"
    assert r["counts"]["html_tags_removed"] == 0


def test_script_block_removed_whole():
    r = evaluate({"text": "before\n<script>alert(1)</script>\nafter"})
    assert "alert" not in r["sanitized_text"]
    assert "before" in r["sanitized_text"] and "after" in r["sanitized_text"]
    assert r["counts"]["active_blocks_removed"] == 1


def test_unclosed_script_removed_to_end():
    r = evaluate({"text": "keep\n<script src=x>evil forever"})
    assert r["sanitized_text"] == "keep\n"
    assert r["counts"]["active_blocks_removed"] == 1


def test_style_and_iframe_blocks_removed():
    r = evaluate({"text": "<style>a{}</style>x<iframe src=y></iframe>z"})
    assert r["sanitized_text"] == "xz"
    assert r["counts"]["active_blocks_removed"] == 2


def test_html_tags_stripped_inner_text_kept():
    r = evaluate({"text": "a <b>bold</b> and <span class=x>span</span>"})
    assert r["sanitized_text"] == "a bold and span"
    assert r["counts"]["html_tags_removed"] == 4


def test_event_handler_attribute_goes_with_tag():
    r = evaluate({"text": '<img src="x.png" onerror="steal()">'})
    assert "onerror" not in r["sanitized_text"]
    assert "steal" not in r["sanitized_text"]


def test_html_comment_removed():
    r = evaluate({"text": "a<!-- hidden instruction -->b"})
    assert r["sanitized_text"] == "ab"
    assert r["counts"]["html_comments_removed"] == 1


def test_javascript_link_neutralized():
    r = evaluate({"text": "[click](javascript:alert(1)) and [ok](https://example.com)"})
    assert "[click](#)" in r["sanitized_text"]
    assert "[ok](https://example.com)" in r["sanitized_text"]
    assert r["counts"]["links_neutralized"] == 1


def test_link_target_with_parentheses_fully_neutralized():
    r = evaluate({"text": "[Download](javascript:run_me())"})
    assert r["sanitized_text"] == "[Download](#)"
    assert r["counts"]["links_neutralized"] == 1


def test_data_and_vbscript_targets_neutralized():
    r = evaluate({"text": "[a](data:text/html;base64,xx) [b](vbscript:msgbox)"})
    assert r["counts"]["links_neutralized"] == 2
    assert "data:text" not in r["sanitized_text"]


def test_images_kept_by_default_removed_on_option():
    text = "![alt](https://example.com/x.png) caption"
    r1 = evaluate({"text": text})
    assert r1["counts"]["images_removed"] == 0
    assert "![alt]" in r1["sanitized_text"]
    r2 = evaluate({"text": text, "options": {"strip_images": True}})
    assert r2["counts"]["images_removed"] == 1
    assert "![alt]" not in r2["sanitized_text"]


def test_fenced_code_protected():
    text = "Example:\n\n```html\n<script>alert(1)</script>\n```\n\ndone"
    r = evaluate({"text": text})
    assert "<script>alert(1)</script>" in r["sanitized_text"]
    assert r["counts"]["active_blocks_removed"] == 0


def test_inline_code_protected():
    r = evaluate({"text": "Use `<b>` for bold."})
    assert "`<b>`" in r["sanitized_text"]
    assert r["counts"]["html_tags_removed"] == 0


def test_strip_html_off_keeps_tags_but_neutralizes_href():
    r = evaluate(
        {"text": '<a href="javascript:evil()">x</a>',
         "options": {"strip_html": False}}
    )
    assert '<a href="#">x</a>' in r["sanitized_text"]
    assert r["counts"]["links_neutralized"] == 1
    assert r["counts"]["html_tags_removed"] == 0


def test_blank_lines_collapsed_and_trailing_trimmed():
    r = evaluate({"text": "a  \n\n\n\n\nb"})
    assert r["sanitized_text"] == "a\n\nb"
    assert r["counts"]["blank_line_runs_collapsed"] == 1
    assert r["counts"]["lines_trimmed"] == 1


def test_deterministic():
    payload = {"text": "<script>x</script>hi [a](javascript:y) <b>z</b>"}
    assert evaluate(payload) == evaluate(payload)


def test_missing_text_raises():
    try:
        evaluate({"options": {}})
    except ValueError as e:
        assert "text is required" in str(e)
    else:
        raise AssertionError("expected ValueError")


def test_wrong_type_raises():
    try:
        evaluate({"text": 42})
    except ValueError as e:
        assert "must be a string" in str(e)
    else:
        raise AssertionError("expected ValueError")


def test_stamp_renders():
    s = stamp(evaluate({"text": "<script>x</script>hi"}))
    assert s.startswith("MARKDOWN SANITIZER")
    assert "active_blocks_removed" in s
