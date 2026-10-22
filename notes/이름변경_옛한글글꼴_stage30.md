# Stage 30 — 사이트 이름 '불휘 기픈 남ᄀᆞᆫ', 옛한글 글꼴 (Version 52·53, 2026-10-22)

## 이름 (Version 52, merge_v45.py)
- 사용자 결정: 앞으로 LEET·공무원 국어·학력평가·국어 연구 논문까지 담을 것이라 '수능'·'기출'을 큰 이름에서 뺌. 「용비어천가」 제2장 '불휘 기픈 남ᄀᆞᆫ'(뿌리 깊은 나무) — 기본에 충실하자는 뜻.
- 상단 로고: 명조 '불휘 기픈 남ᄀᆞᆫ' + 작은 글씨 '뿌리 깊은 나무'. 탭 제목·설명(meta)은 현대어 '뿌리 깊은 나무 · 국어 기출과 연구 자료'(옛한글은 시스템 글꼴에서 깨질 수 있음).
- 바닥글에 제2장 앞 구절, 이용 안내 맨 앞에 '이름에 대하여'(제2장 전문·풀이, 나모/남ㄱ 교체, 이 노래가 나온 기출: 2015 수능 A·B 화작 1~2, 2016 수능 A 문학 40~42, 2025 수능 언매 35~36).
- 작은 줄에 LEET 등은 아직 넣지 않음(실제로 실을 때 늘릴 것).
- 제목 글자는 pipeline_ul/oldhangul-SemiBold.woff·Regular.woff(제목·구절 글자만 뽑은 Noto Serif CJK KR)를 data: 주소로 넣음.

## 옛한글 글꼴 (Version 53, merge_v46.py)
- 문제: 구글 웹 글꼴 Noto Serif KR·Noto Sans KR은 옛한글 자모를 한 글자로 모으는 기능이 없음 → 지문·<보기>·선택지의 옛한글 3,768곳(77종 자모)이 'ㅅㆍㅿㅣ'처럼 풀어져 보였음(내장 브라우저에서 확인).
- 고침: Noto Serif/Sans CJK KR(OFL)에서 쓰인 자모만 뽑아 docs/fonts/oh-serif.woff(약 235KB), oh-sans.woff(약 109KB). @font-face에 unicode-range(옛한글 자모)를 걸어 옛한글이 화면에 나올 때만 내려받음. 모든 글꼴 목록 맨 앞에 둠(--font-sans, --font-paper, 인쇄 --pfam 포함).
- 현대 음절 + 옛 끝소리(드ᇰ·스ᇰ·자ᇇ 4곳)는 escapeHtml에서 앞 음절을 NFD로 풀어 한 글꼴 안에서 모음.
- '시험지 파일로 받기'는 옛한글이 있을 때만 글꼴을 data: 주소로 넣음(bkOldHangulCss).
- merge_v46.py는 빌드할 때마다 데이터에서 쓰인 자모를 다시 세어 글꼴을 만든다(작업 환경에 /usr/share/fonts/opentype/noto/Noto*CJK-Regular.ttc 필요, 없으면 pipeline_ul/fonts/의 저장본을 씀). 새 자료(LEET·공무원 등)에 다른 옛한글이 들어오면 다시 돌릴 것.
- 확인: 사용자 PC(Windows) 내장 브라우저에서 2021 수능 언매 15번 'ᄉᆞᅀᅵ라', '젼ᄎᆡ라' 정상, 휴대폰 너비·어두운 화면 정상.

## 배포
- GitHub main: 3ef3cdd(이름) → 532f52b(옛한글). docs/index.html = gh_head + site_v46 + gh_tail(head의 meta description도 merge_v45가 바꿈).
- 이 작업은 개인 계정 Claude 대화에서 함. USB '문제은행_저장소'에도 같은 파일을 복사해 둠.
