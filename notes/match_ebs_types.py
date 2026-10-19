# -*- coding: utf-8 -*-
"""EBS 'ebs_types.py' — 우리가 이미 처리한 5개 회차(280문항)의 '유형' 필드를
EBS 2027학년도 수능 기출의 미래(독서/문학/화법과 작문/언어와 매체) 해설의 공식
유형 라벨로 교체한다.

EBS hwpx 4개는 legacy 바이너리 .hwp 포맷(확장자만 .hwpx)이라 cfb.py +
hwpx_extract.py로 직접 파싱한 일반 텍스트를 사용한다. 각 파일 안에서 문항은
"[문제]...[정답/모범답안]...[해설]\n<유형>\n{정답 해설}..." 구조로 반복된다.

매칭 전략
---------
1. 지문범위가 있는 문항(공유 지문): 우리 쪽 '지문_미리보기'(지문 앞부분 문자열)를
   해당 영역의 EBS 텍스트에서 찾아 그 지문의 시작 위치(anchor)를 구하고, anchor
   이후 등장하는 문항 블록들을 순서대로 세어 (문항번호 - 지문범위_시작)번째
   블록을 그 문항으로 간주한다.
2. 지문범위가 없는 독립 문항(주로 언어와 매체 문법 단독 문항): 발문 텍스트 자체를
   (머리번호/배점 표시를 제거한 뒤) EBS 텍스트에서 직접 검색해 위치를 찾는다.
3. 매칭에 실패하면 원래 자동분류 유형을 그대로 두고 '_ebs_매칭' 필드에 실패
   사유를 남겨 수동 확인 대상으로 표시한다.
"""
import json
import re
import glob

from hwpx_extract import extract_text

EBS_FILES = {
    "독서": "/root/.claude/uploads/7b612bc6-ce88-5a44-acc7-f627887d12f2/c035a5f4-26101_EBS_2027_________________385_1.hwpx",
    "문학": "/root/.claude/uploads/7b612bc6-ce88-5a44-acc7-f627887d12f2/ae1f306a-26100_EBS_2027_________________402.hwpx",
    "언어와 매체": "/root/.claude/uploads/7b612bc6-ce88-5a44-acc7-f627887d12f2/f9487b55-26103_EBS_2027_____________________206.hwpx",
    "화법과 작문": "/root/.claude/uploads/7b612bc6-ce88-5a44-acc7-f627887d12f2/78b091e0-26102_EBS_2027_____________________264.hwpx",
}

# 이 두 영역만 EBS 해설에 세부 '문항 유형' 라벨이 실제로 존재한다(예: '세부 정보
# 파악', '외적 준거에 따른 작품 감상'). 화법과 작문 해설은 유형 없이 '정오답
# 체크'만 붙어 있고, 언어와 매체 해설은 유형 대신 문법 개념명('국어의 음운
# 변동')만 붙어 있어 우리 '유형'(문항 형식) 축과 다른 정보이므로 대상에서 뺀다.
TYPE_AVAILABLE_AREAS = {"독서", "문학"}

ITEM_RE = re.compile(
    r"\[문제\](?P<body>.*?)\[정답/모범답안\](?P<answer>.*?)\[해설\]\s*\n?(?P<type>[^\n{]*)",
    re.S,
)


def parse_ebs(text):
    """문서 순서대로 문항 블록 리스트를 만든다."""
    items = []
    for m in ITEM_RE.finditer(text):
        body = m.group("body").strip()
        stem = body.split("\n")[0].strip()
        items.append({
            "pos": m.start(),
            "stem": stem,
            "body": body,
            "answer": m.group("answer").strip(),
            "type": m.group("type").strip(),
        })
    return items


def clean_stem(raw):
    """'37. <학습 활동>을 ... [3점]' -> '<학습 활동>을 ...' (검색용 정규화)"""
    s = re.sub(r"^\s*\d{1,2}\.\s*", "", raw)
    s = re.sub(r"\s*\[\d\s*점\]\s*$", "", s)
    return s.strip()


TILDE_CLASS = "[~∼～]"  # ASCII ~ / ∼ / ～ 를 같은 것으로 취급
DOT_CLASS = "[·․・‧∙]"  # 가운뎃점 이체자(U+00B7 MIDDLE DOT / U+2024 ONE DOT LEADER 등) 통일

_JUNK_RE = re.compile(r"[​-‏﻿-]")


def sanitize(s):
    """PDF 폰트 서브셋에서 흔히 생기는 사용자 정의 영역(PUA) 글자·zero-width
    문자 등 잡음을 제거한다(예: '유자\\ue20c에\\u200b\\u200b' -> '유자에')."""
    return _JUNK_RE.sub("", s)


def build_pattern(s, max_tokens=None):
    s = sanitize(s)
    """PDF·HWP 추출 텍스트 간의 공백(줄바꿈 vs 스페이스)·물결표/가운뎃점 표기 차이를
    흡수하는 검색용 정규식을 만든다. 토큰 단위로 이스케이프한 뒤 \\s* 로 연결한다
    (PDF 추출 과정에서 단어 중간에 있으면 안 될 공백이 끼어드는 경우, 예:
    '중요 하지' 같은 사례를 흡수하려면 \\s+가 아니라 \\s*로 연결해야 한다)."""
    tokens = s.split()
    if max_tokens:
        tokens = tokens[:max_tokens]
    tilde_chars = set("~∼～")
    dot_chars = set("·․・‧∙")
    parts = []
    for tok in tokens:
        # 문자 단위로 치환해야 한다: 문자열 replace()를 여러 클래스에 대해
        # 순차적으로 돌리면, 먼저 치환된 결과(예: "[·․・‧∙]") 안에 있는 문자가
        # 다음 replace() 대상 문자와 다시 겹쳐 중첩 치환되는 버그가 생긴다.
        char_pat = []
        for ch in tok:
            if ch in tilde_chars:
                char_pat.append(TILDE_CLASS)
            elif ch in dot_chars:
                char_pat.append(DOT_CLASS)
            else:
                char_pat.append(re.escape(ch))
        parts.append("".join(char_pat))
    return r"\s*".join(parts)


def find_anchor(text, preview, min_tokens=6):
    """지문 미리보기 문자열로 본문 내 위치를 찾는다. 토큰 수를 줄여가며 재시도."""
    preview = sanitize(preview).strip()
    if not preview:
        return -1
    n_tokens = len(preview.split())
    for max_tok in (n_tokens, 12, 8, min_tokens):
        if max_tok < min_tokens:
            continue
        pattern = build_pattern(preview, max_tok)
        if not pattern:
            continue
        m = re.search(pattern, text)
        if m:
            return m.start()
    return -1


def match_by_stem(text, ebs_items, stem_raw):
    needle = clean_stem(stem_raw)
    if len(needle.split()) < 3:
        return None, "stem_too_short"
    for max_tok in (None, 8, 5):
        pattern = build_pattern(needle, max_tok)
        m = re.search(pattern, text)
        if m:
            idx = m.start()
            before = [it for it in ebs_items if it["pos"] <= idx]
            after = [it for it in ebs_items if it["pos"] > idx]
            if after:
                return after[0], "stem_direct"
            if before:
                return before[-1], "stem_direct_fallback"
    return None, "stem_not_found"


def match_by_passage(text, ebs_items, preview, start_num, target_num):
    anchor = find_anchor(text, preview)
    if anchor == -1:
        return None, "anchor_not_found"
    after = [it for it in ebs_items if it["pos"] > anchor]
    offset = target_num - start_num
    if offset < 0 or offset >= len(after):
        return None, "offset_out_of_range"
    return after[offset], "passage_anchor"


def main():
    ebs_text = {area: sanitize(extract_text(path)) for area, path in EBS_FILES.items()}
    ebs_items = {area: parse_ebs(t) for area, t in ebs_text.items()}
    for area, its in ebs_items.items():
        print(f"{area}: EBS {len(its)}문항 파싱")

    items = json.load(open("/home/claude/items_final.json", encoding="utf-8"))

    # exam별 원본 파싱 결과(지문_미리보기 보유)를 다시 로드해 문항번호로 인덱싱
    exam_map = {}
    for fn in glob.glob("/tmp/items_20*.json"):
        raw = json.load(open(fn, encoding="utf-8"))
        for it in raw:
            exam_map[(it["exam_id"], it["영역"], it["문항번호"])] = it

    stats = {"passage_anchor": 0, "stem_direct": 0, "stem_direct_fallback": 0, "fail": 0, "skipped_area": 0}
    for it in items:
        area = it["영역"]
        if area not in TYPE_AVAILABLE_AREAS:
            it["유형_EBS"] = None
            it["_ebs_매칭"] = "skipped_area"
            stats["skipped_area"] += 1
            continue

        key = (it["exam_id"], it["영역"], it["문항번호"])
        raw = exam_map.get(key)
        text = ebs_text[area]
        eitems = ebs_items[area]

        matched, method = None, None
        rng = it.get("지문범위", "")
        m = re.match(r"^(\d+)", rng) if rng else None
        has_passage = bool(raw and raw.get("지문_미리보기") and m)
        if has_passage:
            start_num = int(m.group(1))
            matched, method = match_by_passage(text, eitems, raw["지문_미리보기"], start_num, it["문항번호"])
            # 지문(anchor) 매칭에 실패했다는 것은 이 지문 자체가 이 EBS 책에
            # 없다는 뜻이다(실제로 2027-06·09 모의평가가 이 경우). 이럴 때
            # 발문만으로 재검색하면 책 안의 전혀 다른 문항(흔한 상투적 발문,
            # 예: "윗글에 대한 이해로 적절하지 않은 것은?")에 잘못 걸릴 위험이
            # 커서, 지문이 있는 문항은 발문 폴백을 시도하지 않는다.
        else:
            matched, method = match_by_stem(text, eitems, it["발문"])

        if matched is not None:
            it["유형_EBS"] = matched["type"]
            it["_ebs_매칭"] = method
            stats[method] = stats.get(method, 0) + 1
        else:
            it["유형_EBS"] = None
            it["_ebs_매칭"] = method
            stats["fail"] = stats.get("fail", 0) + 1

    print(stats)
    json.dump(items, open("/home/claude/items_final.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("items_final.json 업데이트 완료 (유형_EBS, _ebs_매칭 필드 추가)")


if __name__ == "__main__":
    main()
