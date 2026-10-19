# -*- coding: utf-8 -*-
"""2017학년도 6월/9월/11월(수능) — A/B 통합 첫 해. 지문 마커를 전부 직접
읽어 확인한 결과, 이 해는 2014~2016학년도(독서 16~30 고정·문학 31~45 고정)
와 다르고, 오히려 2018~2021학년도처럼 독서·문학이 뒤섞인다(2017-09/11).
2017-06만 예외적으로 독서(16~33)·문학(34~45) 순서가 안 섞여 있었다.

화법과작문 1~10, 언어와매체 11~15(마커 있는 지문형 문항 1쌍 포함)는 세
회차 모두 동일. 16~45 구간만 아래 BLOCKS로 직접 판정했다(마커 앞 150자
미리보기를 전부 읽고 "이론/설명문이면 독서, 실제 문학 작품 원문이 인용되면
문학"으로 판정 — 이론+작품 결합 지문(예: 2017-09 [40~45] 전기소설 이론+
「김현감호」 원문, 2017-11 [21~26] 병자호란 이론+「박씨전」 원문)은 실제
작품 원문이 주된 감상 대상이므로 문학으로 분류했다. 순수 설명문(과학·경제·
철학 등, 문학사를 다루더라도 작품 원문 인용이 없는 경우)은 독서로 분류).
"""
import json
import sys

sys.path.insert(0, "/home/claude")
from parse_exam import parse_exam
from extract_choices import choices_in_zone
from ab_diff import clean as ab_clean

EXAMS = {
    "2017-06": {
        "meta": {"연도": 2017, "시행월": 6, "시행유형": "평가원 모의평가",
                  "명칭": "2017학년도 6월 모의평가"},
        "blocks": [
            (16, 19, "독서"), (20, 24, "독서"), (25, 27, "독서"), (28, 33, "독서"),
            (34, 38, "문학"), (39, 42, "문학"), (43, 45, "문학"),
        ],
    },
    "2017-09": {
        "meta": {"연도": 2017, "시행월": 9, "시행유형": "평가원 모의평가",
                  "명칭": "2017학년도 9월 모의평가"},
        "blocks": [
            (16, 18, "문학"), (19, 20, "문학"), (21, 24, "문학"),
            (25, 30, "독서"), (31, 34, "독서"), (35, 39, "독서"),
            (40, 45, "문학"),  # 전기소설 이론 + 「김현감호」 원문
        ],
    },
    "2017-11": {
        "meta": {"연도": 2017, "시행월": 11, "시행유형": "대학수학능력시험",
                  "명칭": "2017학년도 대학수학능력시험"},
        "blocks": [
            (16, 20, "독서"),
            (21, 26, "문학"),  # 병자호란 이론 + 「박씨전」 원문
            (27, 32, "문학"), (33, 36, "독서"), (37, 42, "독서"), (43, 45, "문학"),
        ],
    },
}


def area_for(qn, cfg):
    if qn <= 10:
        return "화법과 작문"
    if qn <= 15:
        return "언어와 매체"
    for s, e, area in cfg["blocks"]:
        if s <= qn <= e:
            return area
    raise ValueError(f"no block for qn={qn}")


def build(exam_id):
    cfg = EXAMS[exam_id]
    raw = open(f"/tmp/old_raw/{exam_id.replace('-', '.')}.txt", encoding="utf-8").read()
    text = ab_clean(raw)
    items = parse_exam(text, exam_id, cfg["meta"], start_num=1, end_num=45)
    choice_map = choices_in_zone(text, 1, 45)
    for it in items:
        qn = it["문항번호"]
        it["영역"] = area_for(qn, cfg)
        it["선택지"] = choice_map.get(qn, [])
    return items


def main():
    all_items = {}
    for exam_id in EXAMS:
        items = build(exam_id)
        all_items[exam_id] = items
        n_choice_ok = sum(1 for it in items if len(it["선택지"]) == 5)
        n_bogi = sum(1 for it in items if it["보기"])
        from collections import Counter
        area_c = Counter(it["영역"] for it in items)
        print(f"{exam_id}: {len(items)}문항, 선택지 5개 확보 {n_choice_ok}, 보기 {n_bogi}, 영역분포 {dict(area_c)}")

    json.dump(all_items, open("/home/claude/items_2017_raw.json", "w", encoding="utf-8"),
               ensure_ascii=False, indent=1)
    print("저장: items_2017_raw.json")


if __name__ == "__main__":
    main()
