#!/usr/bin/env python3
"""Version 51: 다른 세션(2026-10-19 커밋 8f5a42b)이 GitHub에 직접 넣은 '오류 신고' 버튼·'의견 보내기' 링크를 밑줄 판(site_v43)에 다시 얹는다.
(10-22 밑줄 판을 올리면서 이 변경이 덮여 사라졌음 → 같은 내용을 그대로 다시 넣음)
merge_v43.py → site_v43.html → (이 단계) → site_v44.html"""
import sys, subprocess
if '--no-base' not in sys.argv:
    subprocess.run([sys.executable, '/home/claude/merge_v43.py', '--no-base'], check=True)
s = open('/home/claude/site_v43.html', encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: sys.exit(f'patch miss ({n} != {count}): {old[:80]!r}')
    s = s.replace(old, new)
FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdCkEn1SwTAvnc03M6mEtuhApm3kOqn1BMdI0A_H7iGOQREGg/viewform'
rep(""".d-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px}
""", """.d-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px}
.d-actions a.do-report{text-decoration:none;display:inline-flex;align-items:center}
""")
rep("""      <a class="gnb-link sub" href="#guide">이용 안내</a>
""", f"""      <a class="gnb-link sub" href="#guide">이용 안내</a>
      <a class="gnb-link sub" href="{FORM}" target="_blank" rel="noopener">의견 보내기</a>
""")
rep("""      </details>
    </div>
    <div class="foot-copy">""", f"""      </details>
      <details>
        <summary>오류 신고 · 의견 보내기</summary>
        <p>문항을 펼치면 아래쪽에 "오류 신고" 버튼이 있습니다. 누르면 새 창에서 신고 양식(구글 설문지)이 열리고, 어느 회차 몇 번 문항인지가 자동으로 채워집니다. 지문·선택지 오탈자, 정답·해설 오류, 그림이 빠지거나 잘린 곳, 유형 분류가 이상한 곳을 알려 주세요. 사이트 전체에 대한 건의는 맨 위 메뉴의 "의견 보내기"로 보낼 수 있습니다. 로그인 없이 익명으로 보낼 수 있으며, 이름이나 학교는 적지 않아도 됩니다.</p>
        <p><a href="{FORM}" target="_blank" rel="noopener">신고·의견 양식 열기</a></p>
      </details>
    </div>
    <div class="foot-copy">""")
rep("""function itemKey(it){ return `${it.exam_id}||${it.영역}||${it.문항번호}`; }
""", f"""function itemKey(it){{ return `${{it.exam_id}}||${{it.영역}}||${{it.문항번호}}`; }}

/* ---------- 오류 신고 · 의견 보내기 (구글 설문지, 문항 위치 칸을 미리 채움) ---------- */
const FEEDBACK_FORM = '{FORM}';
const FEEDBACK_ENTRY_ITEM = 'entry.1414482263';
function reportUrl(it){{
  const where = `${{it.명칭}} ${{it.영역}} ${{it.문항번호}}번 [${{itemKey(it)}}]`;
  return `${{FEEDBACK_FORM}}?usp=pp_url&${{FEEDBACK_ENTRY_ITEM}}=${{encodeURIComponent(where)}}`;
}}
""")
rep("""title="같은 문항 유형${(it.갈래||[]).length?'과 같은 지문 갈래':''}의 다른 회차 문항을 모아 봅니다.">같은 유형 문항 보기</button>
""", """title="같은 문항 유형${(it.갈래||[]).length?'과 같은 지문 갈래':''}의 다른 회차 문항을 모아 봅니다.">같은 유형 문항 보기</button>
      <a class="btn-plain do-report" href="${reportUrl(it)}" target="_blank" rel="noopener" title="이 문항의 오탈자, 정답·해설 오류, 그림 문제 등을 알려 주세요. 새 창에서 신고 양식이 열리고 문항 위치가 자동으로 채워집니다.">오류 신고</a>
""")
open('/home/claude/site_v44.html', 'w', encoding='utf-8').write(s)
head = open('/home/claude/ul/gh_head.txt', encoding='utf-8').read(); tail = open('/home/claude/ul/gh_tail.txt', encoding='utf-8').read()
for p in ['/home/claude/repo/docs/index.html', '/mnt/user-data/outputs/repo/docs/index.html']:
    open(p, 'w', encoding='utf-8').write(head + s + tail)
print('ok', len(s))
