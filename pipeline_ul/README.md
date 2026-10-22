# 밑줄·글자 상자 되살리기 (Version 50)

원본 문제지의 밑줄(㉠·ⓐ가 가리키는 말, 발문의 '않은' 등)과 테두리 상자로 묶은 말을 사이트 글에 표시하는 단계입니다.

1. `extract.py <회차…>` — 문제지 PDF에서 글자 바로 아래 가로선을 찾아 밑줄 친 글자와 앞뒤 문맥을 뽑습니다. 선 양 끝에 세로선이 있으면 글자 상자, 한쪽만 있으면 [A] 꺾쇠로 보고 버립니다. → `ul/raw/<회차>.json`
2. `hwp_ul.py` — 글자가 그림으로 된 PDF 대신 HWP 문제지(2009학년도 9월·수능, 2014학년도 수능 A·B형)의 글자 모양에서 밑줄을 읽습니다.
3. `mapper.py` — 뽑은 밑줄을 지문·발문·<보기>·선택지에서 앞뒤 문맥으로 찾아 위치를 정합니다. → `spans.json`, 찾지 못한 것은 `report.txt`
4. `merge_v43.py` — site_v42.html에 표시 글자를 넣고 화면 코드를 고쳐 site_v43.html을 만듭니다.

글 속 표시: U+FDD0…U+FDD1 = 밑줄, U+FDD2…U+FDD3 = 상자. 화면에서 `escapeHtml`이 `<u class="ul">`, `<span class="bx">`로 바꿉니다. 검색할 때는 `plainText`로 표시 글자를 뺍니다.
5. `merge_v44.py` — 다른 대화에서 넣었던 '오류 신고' 버튼·'의견 보내기' 링크를 다시 얹어 site_v44.html을 만들고, `gh_head.txt`+본문+`gh_tail.txt`로 docs/index.html을 씁니다.
