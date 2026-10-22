# 수능국어 기출문제은행

2009~2027학년도 평가원 6월·9월 모의평가와 대학수학능력시험 국어(언어) 영역 기출문제를 모은 문제은행입니다. 2014학년도 예비 시행, 2022학년도 예시문항, 2028학년도 개편 예시문항도 들어 있습니다. 모두 68개 회차, 3,258문항입니다.

지문 소재, 문항 유형, 작품, 작가로 문항을 찾아 바로 풀고 채점할 수 있습니다. 비영리 학습용으로 만들었습니다. 수록 문항·지문·선택지의 저작권은 한국교육과정평가원에 있습니다.

## 폴더 구성

| 폴더 | 내용 |
|---|---|
| `docs/` | **완성된 사이트.** `fonts/`는 옛한글을 한 글자로 모아 보이게 하는 부분 글꼴(Noto CJK, OFL)입니다. GitHub Pages가 이 폴더를 그대로 보여 줍니다. `index.html`(모든 문항·지문 데이터 포함), `explain.json`(해설, 처음 누를 때 내려받음), `fig/`(원본 문제지에서 잘라 낸 그림 367개) |
| `pipeline.zip` | 사이트를 만들고 고칠 때 쓴 프로그램(Python)과 중간 자료. 파일이 많아 zip 하나로 묶었습니다. 압축을 풀면 `pipeline/` 폴더가 나옵니다. |
| `notes/` | 단계별 작업 기록(Claude 프로젝트 문서 사본) |
| `pipeline_ul/` | 밑줄·글자 상자 되살리기(Version 50)와 오류 신고 버튼 재적용(Version 51) 단계의 프로그램과 결과. `gh_head.txt`·`gh_tail.txt`는 GitHub용 index.html 앞뒤에 붙이는 껍데기입니다. |

## 사이트 열기 (GitHub Pages)

1. 이 저장소를 GitHub에 올립니다.
2. 저장소의 **Settings → Pages**로 갑니다.
3. "Build and deployment"에서 Source는 **Deploy from a branch**를 고릅니다.
4. Branch는 **main**, 폴더는 **/docs**를 고르고 Save를 누릅니다.
5. 1~2분 뒤 `https://<아이디>.github.io/<저장소 이름>/` 주소로 열립니다.

학생들은 로그인이나 계정 없이 이 주소로 바로 쓸 수 있습니다. 풀이 기록(오답 노트)과 담은 문제는 학생 각자의 브라우저에만 저장됩니다.

## Claude 아티팩트로 다시 올릴 때

다른 Claude 계정에서 이 저장소를 받은 뒤 이렇게 부탁하면 됩니다.

> `docs/index.html`을 아티팩트로 게시해 줘. `explain.json`과 `fig/` 폴더의 그림들도 같은 경로로 함께 올려 줘.

- `index.html` 맨 위의 `<!doctype html>…<body>`와 맨 끝의 `</body></html>`은 GitHub Pages용으로 덧붙인 것입니다. 아티팩트로 올릴 때는 빼도 됩니다.
- GitHub용으로 만들 때는 `<head>`에 `<style>[hidden]{display:none!important}</style>`가 꼭 있어야 합니다(아티팩트는 자동으로 넣어 주지만 일반 웹사이트에는 없어서, 숨겨야 할 안내문이 보입니다). `pipeline_ul/gh_head.txt`에 들어 있습니다.
- **주의:** 저장소에 바뀐 파일을 올리기 전에, 저장소의 최근 커밋에 다른 곳(다른 Claude 대화 등)에서 고친 내용이 없는지 먼저 확인하세요. 예전 사본으로 올리면 그 사이의 변경이 덮여 사라집니다.
- 파일이 255개를 넘으므로 두세 번에 나눠 올려야 합니다.

## 고치는 방법 (Claude에게 맡길 때 알려 줄 것)

### 사이트 구조

- `index.html` 한 파일 안에 데이터가 한 줄씩 들어 있습니다. 데이터는 `const ITEMS = [...]`, `const PASSAGES = {...}`, `const CHOICES = {...}`, `const PASSAGE_NOTES = {...}`, `const FIGS = {...}`, `const ITEMS_2028 = [...]` 등입니다.
- 문항 키는 `exam_id||영역||문항번호`, 지문 키는 `exam_id||영역||지문범위`입니다.
- 화면 코드도 같은 파일 아래쪽 `<script>` 안에 있습니다. 검색, 회차 보기, 채점, 오답 노트, 문제 담기, 16쪽 시험지 인쇄가 여기에 들어 있습니다.

### 다시 만드는 순서

스크립트 안의 경로는 원래 작업 환경 기준이라, 쓰기 전에 경로를 바꿔야 합니다. 원래 경로는 `/home/claude/...`, 원본 PDF는 `/mnt/user-data/uploads/평가원 기출 문제 모음/`입니다.

```
pipeline_ul/merge_v46.py   # 마지막 단계: 옛한글 글꼴(docs/fonts/oh-*.woff) → site_v46.html (= docs/index.html 본문)
  └ pipeline_ul/merge_v45.py  # 사이트 이름 '불휘 기픈 남ᄀᆞᆫ(뿌리 깊은 나무)', 제목용 옛한글 글꼴
pipeline_ul/merge_v44.py   # 오류 신고 버튼·의견 보내기 → site_v44.html
  └ pipeline_ul/merge_v43.py  # 밑줄·글자 상자 (pipeline_ul/spans.json)
      └ pipeline/merge_v42.py  # 2022 예시문항 합류 → site_v42.html
          └ merge_v41.py       # 원본 그림(fig) 합류
              └ merge_v40.py   # 문제 담기·모아 풀기·16쪽 인쇄 (v40/basket.js, basket.css)
                  └ base/site_v39.html
pipeline/merge_v35.py ~ merge_v39.py   # base/site_v34.html에서 site_v39.html까지(해설·□ 복원·줄 나눔 등)
```

- `chk/streams2/<회차>.json`은 원본 PDF에서 뽑은 줄 단위 글자와 위치 기록입니다. 그림 자르기, 띄어쓰기 복원, 옛한글 자리 찾기에 씁니다.
- `chk/pua_map.py`, `chk/직접확인_목록_원본.xlsx`는 깨진 옛한글 글꼴 코드를 판독한 표입니다.
- `fig/tools/`는 원본 PDF에서 그림을 잘라 내는 도구이고, `fig/fig_index.json`은 그림 목록입니다.
- `ex22/`는 2022학년도 예시문항을 PDF에서 문항으로 만든 과정입니다. `key.pdf`는 평가원 정답표입니다.
- `old_data/`는 2009~2017학년도 문항을 처음 정리할 때 만든 중간 자료(문항·선택지·지문·정답표 묶음)입니다.
- `test/`는 Playwright로 화면을 확인하는 스크립트입니다.

### 원본 자료

원본 문제지·해설 PDF는 저장소에 넣지 않았습니다(용량·저작권). 원본은 만든 사람의 USB `평가원 기출 문제 모음`, `국어의 모든 것` 폴더에 있습니다.

## 출처와 한계

- **문항·지문·선택지·정답:** 한국교육과정평가원 문제지와 정답표입니다.
- **해설:** 해당 회차 「정답 및 해설」입니다.
- **사용 허락을 받은 자료:**
  - 2014학년도 예비 시행 정답·해설: 이투스청솔 교육평가연구소
  - 선택지 6개: EBS 「기출의 미래」
- **유형 표시:** 해설 자료 대조 결과와 자동 분류를 섞어 붙였습니다. 사이트의 "이용 안내"에 자세히 적혀 있습니다.
- **그림:** 원본 문제지에서 그대로 잘라 낸 것입니다. 글자를 새로 짓지 않았습니다.
