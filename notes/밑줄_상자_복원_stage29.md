# Stage 29 — 밑줄·글자 상자 되살리기 (Version 50·51, 2026-10-22)

문제: 사이트 글에는 원본 문제지의 밑줄(㉠·ⓐ가 가리키는 범위, 발문의 '않은' 등)과 테두리 상자(예: 2027-09 '표준적 입장')가 전혀 없었음.

## 방법 (pipeline_ul/)
- `extract.py`: 문제지 PDF에서 글자 바로 아래 가로선을 찾아 밑줄. 선 양 끝에 세로선이 있으면 글자 상자, 한쪽만이면 [A] 꺾쇠 팔이라 버림.
- `hwp_ul.py`: 글자가 그림인 PDF(2009-09, 2009-11, 2014-11-A/B)는 HWP 문제지의 글자 모양(밑줄 속성)에서 읽음.
- `mapper.py`: 밑줄 글자를 지문·발문·<보기>·선택지에서 앞뒤 문맥으로 찾아 위치를 정함 → `spans.json`. 못 찾음 26, 애매 9 → `report.txt`.
- 결과: 밑줄 약 5,825곳, 상자 약 324곳.

## 사이트 변경
- `merge_v43.py` → site_v43.html: 글 속 표시 글자 U+FDD0…FDD1 밑줄, U+FDD2…FDD3 상자. `escapeHtml`→`markHtml`이 태그로 바꿈, 검색은 `plainText`로 표시 글자 제거. 화면·인쇄 CSS, 이용 안내 항목 추가.
- `merge_v44.py` → site_v44.html: 다른 Claude 대화(2026-10-19 커밋 8f5a42b)가 넣은 '오류 신고' 버튼·'의견 보내기' 링크·이용 안내 항목을 다시 얹음. 밑줄 판을 올리면서 이 변경이 덮여 사라졌기 때문(교훈: 올리기 전에 저장소 최근 커밋 확인).

## 배포
- GitHub용 docs/index.html = gh_head.txt + site_v44.html + gh_tail.txt (head에 `[hidden]{display:none!important}`).
