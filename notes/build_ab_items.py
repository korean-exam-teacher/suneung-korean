# -*- coding: utf-8 -*-
"""2014~2016학년도 국어 A형/B형(및 2014.06.B 단독) 13개 문제지의 문항을
parse_exam.py/extract_choices.py를 재사용해 뽑아낸다.

영역 경계는 13개 문제지 전부의 지문 마커를 실제로 읽고 확인한 결과, 예외 없이
다음 패턴을 따른다(2018~2021학년도의 "16~45 독서/문학 뒤섞임"과 달리 이
시기는 독서 블록 전체 다음에 문학 블록 전체가 온다):
  1~10   화법과 작문 (화법 지문 1~2개 + 작문 지문 2개)
  11~X   언어와 매체(문법) — 독립 문항, X는 A형 15 / B형 16
  X+1~30 독서 (4개 지문)
  31~45  문학 (4~5개 지문)
"""
import json
import re
import sys

sys.path.insert(0, "/home/claude")
from parse_exam import parse_exam
from extract_choices import choices_in_zone
from ab_diff import clean as ab_clean

EXAMS = {
    # 주의: 2014-06-B는 이전 회차에서 시행유형을 "대학수학능력시험"으로 잘못
    # 기록했었다(원본 헤더 텍스트가 모든 회차에서 "20XX학년도 대학수학능력시험"
    # 이라는 동일한 문구를 쓰기 때문에 헤더만으로는 실제 시행월을 구분할 수
    # 없음 — 파일명이 유일한 근거). 시행월 6은 그대로 두고 시행유형/명칭만
    # 다른 06월 회차와 같은 규칙으로 바로잡았다.
    "2014-06-A": {"meta": {"연도": 2014, "시행월": 6, "시행유형": "평가원 모의평가",
                            "명칭": "2014학년도 6월 모의평가", "형": "A"}, "moon_end": 15},
    "2014-06-B": {"meta": {"연도": 2014, "시행월": 6, "시행유형": "평가원 모의평가",
                            "명칭": "2014학년도 6월 모의평가", "형": "B"}, "moon_end": 16},
    "2014-09-A": {"meta": {"연도": 2014, "시행월": 9, "시행유형": "평가원 모의평가",
                            "명칭": "2014학년도 9월 모의평가", "형": "A"}, "moon_end": 15},
    "2014-09-B": {"meta": {"연도": 2014, "시행월": 9, "시행유형": "평가원 모의평가",
                            "명칭": "2014학년도 9월 모의평가", "형": "B"}, "moon_end": 16},
    "2015-06-A": {"meta": {"연도": 2015, "시행월": 6, "시행유형": "평가원 모의평가",
                            "명칭": "2015학년도 6월 모의평가", "형": "A"}, "moon_end": 15},
    "2015-06-B": {"meta": {"연도": 2015, "시행월": 6, "시행유형": "평가원 모의평가",
                            "명칭": "2015학년도 6월 모의평가", "형": "B"}, "moon_end": 16},
    "2015-09-A": {"meta": {"연도": 2015, "시행월": 9, "시행유형": "평가원 모의평가",
                            "명칭": "2015학년도 9월 모의평가", "형": "A"}, "moon_end": 15},
    "2015-09-B": {"meta": {"연도": 2015, "시행월": 9, "시행유형": "평가원 모의평가",
                            "명칭": "2015학년도 9월 모의평가", "형": "B"}, "moon_end": 16},
    "2015-11-A": {"meta": {"연도": 2015, "시행월": 11, "시행유형": "대학수학능력시험",
                            "명칭": "2015학년도 대학수학능력시험", "형": "A"}, "moon_end": 15},
    "2015-11-B": {"meta": {"연도": 2015, "시행월": 11, "시행유형": "대학수학능력시험",
                            "명칭": "2015학년도 대학수학능력시험", "형": "B"}, "moon_end": 16},
    "2016-06-A": {"meta": {"연도": 2016, "시행월": 6, "시행유형": "평가원 모의평가",
                            "명칭": "2016학년도 6월 모의평가", "형": "A"}, "moon_end": 15},
    "2016-06-B": {"meta": {"연도": 2016, "시행월": 6, "시행유형": "평가원 모의평가",
                            "명칭": "2016학년도 6월 모의평가", "형": "B"}, "moon_end": 16},
    "2016-09-A": {"meta": {"연도": 2016, "시행월": 9, "시행유형": "평가원 모의평가",
                            "명칭": "2016학년도 9월 모의평가", "형": "A"}, "moon_end": 15},
    "2016-09-B": {"meta": {"연도": 2016, "시행월": 9, "시행유형": "평가원 모의평가",
                            "명칭": "2016학년도 9월 모의평가", "형": "B"}, "moon_end": 16},
    "2016-11-A": {"meta": {"연도": 2016, "시행월": 11, "시행유형": "대학수학능력시험",
                            "명칭": "2016학년도 대학수학능력시험", "형": "A"}, "moon_end": 15},
    "2016-11-B": {"meta": {"연도": 2016, "시행월": 11, "시행유형": "대학수학능력시험",
                            "명칭": "2016학년도 대학수학능력시험", "형": "B"}, "moon_end": 16},
    # 사용자 확인: 정규 6/9/11월 회차가 아닌 "예비 시행"(2013년에 A/B
    # 수준별 체제 도입을 앞두고 배포된 예시문항). 마커 구조는 A형/B형과
    # 완전히 동일(A: moon_end 15, B: moon_end 16)해서 같은 파이프라인을
    # 그대로 재사용할 수 있었다.
    "2014-예비-A": {"meta": {"연도": 2014, "시행월": None, "시행유형": "예비 시행",
                             "명칭": "2014학년도 수준별 국어 예비 시행", "형": "A"}, "moon_end": 15},
    "2014-예비-B": {"meta": {"연도": 2014, "시행월": None, "시행유형": "예비 시행",
                             "명칭": "2014학년도 수준별 국어 예비 시행", "형": "B"}, "moon_end": 16},
}


def area_for(qn, moon_end):
    if qn <= 10:
        return "화법과 작문"
    if qn <= moon_end:
        return "언어와 매체"
    if qn <= 30:
        return "독서"
    return "문학"


def build(exam_id):
    cfg = EXAMS[exam_id]
    raw = open(f"/tmp/ab_raw/{exam_id}.txt", encoding="utf-8").read()
    text = ab_clean(raw)  # parse_exam은 페이지 마커 등 잡음이 있어도 대체로
    # 견디지만, 이 시기 문제지는 잡음 줄이 유독 많아 정리된 텍스트를 쓴다.
    items = parse_exam(text, exam_id, cfg["meta"], start_num=1, end_num=45)
    choice_map = choices_in_zone(text, 1, 45)
    for it in items:
        qn = it["문항번호"]
        it["영역"] = area_for(qn, cfg["moon_end"])
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

    json.dump(all_items, open("/home/claude/ab_items_raw.json", "w", encoding="utf-8"),
               ensure_ascii=False, indent=1)
    print("저장: ab_items_raw.json")


if __name__ == "__main__":
    main()
