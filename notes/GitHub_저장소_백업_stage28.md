# Stage 28 — GitHub 저장소 묶음·공개 (2026-10-19)

배경: 학교 공용 Claude 계정이 2027년 2월에 사라질 예정. 사이트·코드·작업 기록을 사용자 GitHub에 옮기고 GitHub Pages로 계정 없이 쓰는 고정 주소를 만들기로 함. 아티팩트 링크(claude.ai/artifact/VfDB4RHTaB618sTsPEhE43)는 시크릿 창에서 로그인 없이 열리는 것 확인(사용자).

## 공개 완료
- 저장소: https://github.com/korean-exam-teacher/suneung-korean (Public)
- 사이트: **https://korean-exam-teacher.github.io/suneung-korean/** (Pages: main 브랜치 /docs)
- 확인(내장 브라우저): 문항 3,258개, 그림 367개 모두 200 응답, explain.json 로드, 검색·2028 탭·문항 펼치기 정상.
- 올린 방법: 크롬 확장은 이 세션에 연결되지 않았고, 내장 브라우저에는 파일 업로드 기능이 없으며 컴퓨터 제어로 Claude 앱을 조작할 수 없음(크롬은 보기만 가능). 그래서 Claude가 저장소 생성·Pages 설정·docs/.nojekyll 커밋을 하고, USB `F:\평가원 기출 문제 모음\문제은행_GitHub에_올리기\1~5`(각 100개 미만)를 사용자가 웹 올리기 화면에 끌어다 놓음.

## 일반 웹사이트용 수정 (중요)
- 아티팩트 게시 때는 껍데기가 `[hidden]{display:none}`을 넣어 주지만 일반 사이트에는 없음 → hidden 요소(2028 안내 배너 등)가 보였음.
- docs/index.html `<head>`에 `<style>[hidden]{display:none!important}</style>` 추가해 해결. 앞으로 GitHub용 index.html을 만들 때 반드시 넣을 것(pipeline_ul/gh_head.txt).
- Claude 밖에서는 "인쇄용 파일 받기"가 Blob 내려받기로 동작(window.claude 없을 때).

## 묶음 구성
- `docs/` — index.html, explain.json, fig/ 그림 367개, .nojekyll
- `pipeline.zip` — merge_v35~v42.py와 중간 자료 전체
- `notes/` — 프로젝트 문서 사본. match_ebs_types.py의 `_JUNK_RE`는 `\ue000-\uf8ff`로 고쳐 적음(원본과 바이트 비교 안 함).

## 이후
- 2026-10-19 다른 Claude 대화가 '오류 신고' 버튼·'의견 보내기' 링크를 저장소에 직접 커밋(8f5a42b) → 10-22 밑줄 판 업로드로 덮였다가 Version 51(merge_v44.py)에서 복구.
