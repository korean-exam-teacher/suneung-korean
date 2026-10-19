"""2028학년도 수능 개편 대응 태그 매핑.

기존 4갈래 영역(독서/문학/화법과 작문/언어와 매체)을 2028학년도 신설 3과목
(화법과 언어/독서와 작문/문학) + 매체-경과 로 규칙 기반 재분류한다.
자세한 배경은 프로젝트 문서 '2028 개편 예시문항 분석.md' 참고.
"""
import json

def map_reform(it):
    area = it["영역"]
    ty = it.get("유형", "")
    passage = it.get("지문범위", "")

    if area == "독서":
        return "독서와 작문"
    if area == "문학":
        return "문학"

    if area == "언어와 매체":
        if passage in ("35~36", "(독립 문항)"):
            return "화법과 언어"          # 문법(언어) 파트
        if passage in ("40~43", "44~45"):
            return "매체-경과"            # 매체 단독 문항, 개편 후 비중 축소 예상
        if "문법" in ty:
            return "화법과 언어"
        if "매체" in ty:
            return "매체-경과"
        return "매체-경과(확인 필요)"

    if area == "화법과 작문":
        if passage == "35~37":
            return "화법과 언어"          # 화법 단독 지문
        if passage == "43~45":
            return "독서와 작문"          # 작문 단독 지문
        if passage == "38~42":            # 화법+작문 결합 지문 -> 문항 유형으로 판정
            if ty.startswith("화법") or ty.startswith("화법·매체"):
                return "화법과 언어"
            if ty.startswith("작문"):
                return "독서와 작문"
            return "화법과 언어/독서와 작문(확인 필요)"
        return "확인 필요"

    return "확인 필요"


if __name__ == "__main__":
    items = json.load(open("/home/claude/items_final.json", encoding="utf-8"))
    for it in items:
        it["개편매핑_과목"] = map_reform(it)

    from collections import Counter
    c = Counter(it["개편매핑_과목"] for it in items)
    for k, v in sorted(c.items(), key=lambda x: -x[1]):
        print(f"{k}: {v}")

    json.dump(items, open("/home/claude/items_final.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\nitems_final.json 업데이트 완료 (개편매핑_과목 필드 추가)")
