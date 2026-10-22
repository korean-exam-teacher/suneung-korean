#!/usr/bin/env python3
"""Version 52: 사이트 이름을 '불휘 기픈 남ᄀᆞᆫ'(뿌리 깊은 나무, 용비어천가 제2장)으로 바꾼다.
앞으로 LEET·공무원 국어·학력평가·국어 연구 자료까지 담을 수 있도록 '수능'·'기출'을 큰 이름에서 뺐다.
- 상단 로고: 중세 국어 원문(명조) + 현대어 '뿌리 깊은 나무'
- 브라우저 탭 제목·설명: 현대어(옛한글이 시스템 글꼴에서 깨질 수 있어서)
- 바닥글: 제2장 원문 한 줄, 이용 안내에 '이름에 대하여' 항목

쓰는 법
  python3 merge_v45.py                 # merge_v44 → site_v44.html → site_v45.html, docs/index.html 쓰기 (원래 작업 환경)
  python3 merge_v45.py --docs <index.html>   # 이미 만든 GitHub용 docs/index.html을 그 자리에서 고치기
"""
import sys, subprocess, base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
def _font(w):
    # Noto Serif CJK KR(OFL)에서 이름·원문에 쓰는 글자만 뽑은 글꼴. 구글 웹 글꼴 Noto Serif KR은 옛한글 자모를 한 글자로 모아 주지 못한다.
    return base64.b64encode(open(os.path.join(HERE, f'oldhangul-{w}.woff'), 'rb').read()).decode()

TAB_TITLE = '뿌리 깊은 나무 · 국어 기출과 연구 자료'
META_DESC = ('불휘 기픈 남ᄀᆞᆫ(뿌리 깊은 나무) — 평가원 모의평가·수능 국어 기출을 소재·유형·작품으로 찾아 풀어 보고, '
             '앞으로 여러 국어 시험 기출과 국어 연구 자료를 함께 모아 가는 비영리 학습용 국어 자료실')
OLD_META_DESC = '2009~2027학년도 평가원 모의평가·수능 국어 기출을 소재·유형·작품으로 찾아 풀어 보는 비영리 학습용 문제은행'
VERSE = 'ᄇᆞᄅᆞ매 아니 뮐ᄊᆡ 곶 됴코 여름 하ᄂᆞ니'


def patch_body(s):
    def rep(old, new, count=1):
        nonlocal s
        n = s.count(old)
        if n != count:
            sys.exit(f'patch miss ({n} != {count}): {old[:80]!r}')
        s = s.replace(old, new)

    rep('<title>국어 기출 문제은행</title>', f'''<title>{TAB_TITLE}</title>
<style>
@font-face{{font-family:"OldHangulTitle";font-weight:400;font-display:swap;src:url(data:font/woff;base64,{_font('Regular')}) format("woff")}}
@font-face{{font-family:"OldHangulTitle";font-weight:600 800;font-display:swap;src:url(data:font/woff;base64,{_font('SemiBold')}) format("woff")}}
</style>''')

    # 로고
    rep('''    <a class="logo" href="#page-top" aria-label="수능국어 기출문제은행 처음으로">
      <span class="logo-mark">국</span>
      <span class="logo-text">수능국어 <em>기출문제은행</em></span>
    </a>''', '''    <a class="logo" href="#page-top" aria-label="불휘 기픈 남ᄀᆞᆫ(뿌리 깊은 나무) 처음으로">
      <span class="logo-mark">국</span>
      <span class="logo-text"><span class="logo-old" lang="okm">불휘 기픈 남ᄀᆞᆫ</span><span class="logo-gloss">뿌리 깊은 나무</span></span>
    </a>''')
    rep('''.logo-text em{font-style:normal;color:var(--brand)}
''', '''.logo-text em{font-style:normal;color:var(--brand)}
.logo-text{display:flex;align-items:baseline;gap:10px}
.okm,.logo-old,.foot-verse,.guide .verse{font-family:"OldHangulTitle",var(--font-paper)!important}
.logo-old{font-weight:600;font-size:20px;letter-spacing:-.01em;color:var(--text)}
.logo-gloss{font-size:12.5px;font-weight:500;letter-spacing:.02em;color:var(--text-sub)}
.foot-verse{display:block;margin-top:6px;font-size:13.5px;color:var(--foot-strong)}
.foot-verse small{font-family:var(--font-sans)!important;font-size:12px;opacity:.75;margin-left:6px}
.guide .verse{font-size:15px;line-height:1.9;margin:6px 0}
''')

    # 바닥글 이름 + 원문 한 줄
    rep('''      <span class="foot-name">수능국어 기출문제은행</span>''',
        f'''      <span class="foot-name"><span class="okm" lang="okm">불휘 기픈 남ᄀᆞᆫ</span> · 뿌리 깊은 나무
        <span class="foot-verse" lang="okm">불휘 기픈 남ᄀᆞᆫ {VERSE}<small>「용비어천가」 제2장</small></span></span>''')

    # 이용 안내: 이름에 대하여 (맨 앞)
    rep('''      <h2>이용 안내</h2>
''', f'''      <h2>이용 안내</h2>
      <details>
        <summary><span>이름에 대하여 · <span class="okm" lang="okm">불휘 기픈 남ᄀᆞᆫ</span></span></summary>
        <p class="verse" lang="okm">불휘 기픈 남ᄀᆞᆫ {VERSE}<br>ᄉᆡ미 기픈 므른 ᄀᆞᄆᆞ래 아니 그츨ᄊᆡ 내히 이러 바ᄅᆞ래 가ᄂᆞ니</p>
        <p>뿌리 깊은 나무는 바람에 흔들리지 않으므로 꽃이 좋고 열매가 많으며, 샘이 깊은 물은 가뭄에도 그치지 않으므로 내를 이루어 바다로 갑니다. 1447년에 간행된 「용비어천가」 제2장입니다. 국어 공부도 뿌리가 깊어야 어떤 시험에도 흔들리지 않는다는 뜻으로 이름을 지었습니다.</p>
        <p>'<span class="okm" lang="okm">남ᄀᆞᆫ</span>'은 '나무는'입니다. 중세 국어에서 '나무'는 홀로 쓰일 때 '나모'였다가, 모음으로 시작하는 조사 앞에서는 '남ㄱ'으로 바뀌어 '<span class="okm" lang="okm">남ᄀᆞᆫ, 남ᄀᆞᆯ, 남기</span>'처럼 쓰였습니다. 이 노래는 2015학년도 수능 화법과 작문(만 원권 속 문화유산), 2016학년도 수능 A형 문학, 2025학년도 수능 언어와 매체 문항에도 나옵니다. 검색창에 '용비어천가'를 넣어 찾아보세요.</p>
      </details>
''')
    return s


def write_docs(path):
    t = open(path, encoding='utf-8').read()
    a = t.index('<body>\n') + len('<body>\n')
    b = t.rindex('</body>')
    head, body, tail = t[:a], t[a:b], t[b:]
    if OLD_META_DESC in head:
        head = head.replace(OLD_META_DESC, META_DESC)
    open(path, 'w', encoding='utf-8').write(head + patch_body(body) + tail)
    print('ok', path)


if __name__ == '__main__':
    if '--docs' in sys.argv:
        write_docs(sys.argv[sys.argv.index('--docs') + 1])
        sys.exit()
    if '--no-base' not in sys.argv:
        subprocess.run([sys.executable, '/home/claude/merge_v44.py', '--no-base'], check=True)
    s = patch_body(open('/home/claude/site_v44.html', encoding='utf-8').read())
    open('/home/claude/site_v45.html', 'w', encoding='utf-8').write(s)
    head = open('/home/claude/ul/gh_head.txt', encoding='utf-8').read().replace(OLD_META_DESC, META_DESC)
    tail = open('/home/claude/ul/gh_tail.txt', encoding='utf-8').read()
    for p in ['/home/claude/repo/docs/index.html', '/mnt/user-data/outputs/repo/docs/index.html']:
        open(p, 'w', encoding='utf-8').write(head + s + tail)
    print('ok', len(s))
