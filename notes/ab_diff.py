# -*- coding: utf-8 -*-
"""2014~2016학년도 국어 A형/B형 같은 시행 회차의 원문을 비교해, 두 유형에
공통으로 들어간(=글자 그대로 동일한) 지문·문항 구간을 찾고, 그 구간이 각각
몇 번 문항에 해당하는지까지 확인한다.

1단계(공통 블록 찾기)만으로는 "이 글자 뭉치가 같다"는 것만 알 수 있고 몇 번
문항인지는 모른다. 그래서 정리된(clean) 텍스트에서 "숫자." 문항 시작 위치를
찾아 각 문항의 텍스트 구간을 정의한 다음, difflib이 찾은 공통 블록이 A/B 각
문항 구간과 얼마나 겹치는지 계산해서 "A 몇 번 = B 몇 번(동일)"을 만든다.
"""
import re
import json
import difflib

NOISE_PATTERNS = [
    r"^--- page \d+ col-[LR] ---$",
    r"^\d+\s*$",
    r"^이 문제지에 관한 저작권은 한국교육과정평가원에 있습니다\.?$",
    r"^\d+월\s*모의평가\s*문제지$",
    r"^대학수학능력시험\s*문제지$",
    r"^제\s*\d+\s*교시$",
    r"^국어\s*영역\s*\(?[AB]형\)?$",
    r"^\d{4}학년도\s*(대학수학능력시험|\d+월\s*모의평가)$",
]
NOISE_RE = [re.compile(p) for p in NOISE_PATTERNS]

# 문항 시작: 줄 맨 앞의 "12." 형태(단, 지문 범위 표시 "[1～3]"이나 보기 번호
# "①"과 혼동되지 않도록 뒤에 공백+한글/기호가 오는 경우만).
ITEM_START_RE = re.compile(r"^(\d{1,2})\.\s?(?=\S)", flags=re.MULTILINE)


def clean(text):
    lines = []
    for line in text.split("\n"):
        s = line.strip()
        if not s:
            continue
        if any(p.match(s) for p in NOISE_RE):
            continue
        lines.append(s)
    return "\n".join(lines)


def item_spans(cleaned_text, n_items=45):
    """정리된 텍스트에서 1~n_items번 문항 각각의 [시작,끝) 문자 위치를 찾는다.
    같은 숫자가 본문 중간(예: 선택지, 연도)에도 나올 수 있으므로, 실제로
    1..n_items가 대체로 오름차순으로 등장하는 위치만 채택한다(순서가 크게
    어긋나면 오탐으로 보고 건너뛴다).
    """
    candidates = {}
    for m in ITEM_START_RE.finditer(cleaned_text):
        n = int(m.group(1))
        if 1 <= n <= n_items:
            candidates.setdefault(n, []).append(m.start())

    chosen = {}
    last_pos = -1
    for n in range(1, n_items + 1):
        if n not in candidates:
            continue
        # 마지막으로 채택된 위치보다 뒤에 있는 후보 중 가장 앞의 것을 채택
        cands = [p for p in candidates[n] if p > last_pos]
        if not cands:
            continue
        pos = min(cands)
        chosen[n] = pos
        last_pos = pos

    spans = {}
    nums = sorted(chosen)
    for i, n in enumerate(nums):
        start = chosen[n]
        end = chosen[nums[i + 1]] if i + 1 < len(nums) else len(cleaned_text)
        spans[n] = (start, end)
    return spans


def overlap_ratio(block_start, block_end, span):
    s, e = span
    ov = max(0, min(block_end, e) - max(block_start, s))
    return ov / max(1, (e - s))


def find_common_items(exam_id, min_len=60, n_items=45):
    ta = open(f"/tmp/ab_raw/{exam_id}-A.txt", encoding="utf-8").read()
    tb = open(f"/tmp/ab_raw/{exam_id}-B.txt", encoding="utf-8").read()
    a = clean(ta)
    b = clean(tb)
    spans_a = item_spans(a, n_items)
    spans_b = item_spans(b, n_items)

    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    blocks = [m for m in sm.get_matching_blocks() if m.size >= min_len]

    # 각 A 문항 번호에 대해, 그 구간의 몇 %가 공통 블록에 덮이는지, 그리고
    # 그 공통 블록이 B의 어느 문항 구간과 겹치는지 누적한다.
    a_coverage = {n: 0.0 for n in spans_a}
    a_to_b_hits = {n: {} for n in spans_a}  # {a번호: {b번호: 겹친 글자수}}

    for m in blocks:
        a_s, a_e = m.a, m.a + m.size
        b_s, b_e = m.b, m.b + m.size
        for n, (s, e) in spans_a.items():
            ov = max(0, min(a_e, e) - max(a_s, s))
            if ov > 0:
                a_coverage[n] += ov
        for n, (s, e) in spans_a.items():
            ov = max(0, min(a_e, e) - max(a_s, s))
            if ov <= 0:
                continue
            for bn, (bs, be) in spans_b.items():
                bov = max(0, min(b_e, be) - max(b_s, bs))
                if bov > 0:
                    a_to_b_hits[n][bn] = a_to_b_hits[n].get(bn, 0) + min(ov, bov)

    results = []
    for n, (s, e) in spans_a.items():
        length = e - s
        cov = a_coverage[n]
        ratio = cov / length if length else 0
        if ratio < 0.5:
            continue
        best_b = max(a_to_b_hits[n].items(), key=lambda kv: kv[1], default=(None, 0))
        results.append({
            "A문항": n, "B문항": best_b[0], "겹침비율": round(ratio, 2),
            "A글자수": length,
        })
    return results, spans_a, spans_b


def main():
    pairs = ["2014-06", "2014-09", "2015-06", "2015-09", "2015-11", "2016-06", "2016-09", "2016-11"]
    all_results = {}
    for exam in pairs:
        try:
            results, spans_a, spans_b = find_common_items(exam)
        except FileNotFoundError:
            print(exam, "SKIP")
            continue
        all_results[exam] = results
        print(f"\n{'='*60}\n{exam}: A형 45문항 중 {len(results)}문항이 B형과 실질적으로 동일(50% 이상 겹침)\n{'='*60}")
        for r in results:
            print(f"  A-{r['A문항']:>2} = B-{r['B문항']}  (겹침 {r['겹침비율']*100:.0f}%, {r['A글자수']}자)")

    json.dump(all_results, open("/home/claude/ab_common_items.json", "w", encoding="utf-8"),
               ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
