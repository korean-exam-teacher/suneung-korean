#!/usr/bin/env python3
"""Version 53: 지문·발문·선택지 속 옛한글(아래아 등)이 자모로 풀어져 보이던 문제를 고친다.

원인: 사이트가 쓰는 구글 웹 글꼴(Noto Serif KR·Noto Sans KR)은 옛한글 첫소리·가운뎃소리·끝소리 자모를
한 글자로 모아 주는 기능(GSUB ljmo/vjmo/tjmo)이 빠진 판이다. 그래서 'ᄉᆞᅀᅵ'가 'ㅅ·ㅿㅣ'처럼 보였다.

고친 방법
1. Noto Serif CJK KR·Noto Sans CJK KR(OFL)에서 사이트 글에 실제로 쓰인 옛한글 자모만 뽑아
   docs/fonts/oh-serif.woff, oh-sans.woff를 만든다(빌드 때마다 데이터에서 쓰인 자모를 다시 센다).
2. @font-face에 unicode-range(옛한글 자모 범위)를 걸어, 옛한글이 화면에 나올 때만 내려받고
   현대 한글은 지금처럼 Noto Serif KR·Noto Sans KR로 보인다. 모든 글꼴 목록 맨 앞에 이 글꼴을 둔다.
3. 현대 음절 뒤에 옛 끝소리 자모가 붙은 경우('드ᇰ', '자ᇇ' 등)는 화면에 낼 때 앞 음절을 자모로 풀어
   한 글꼴 안에서 모이게 한다(escapeHtml).
4. '시험지 파일로 받기'(따로 여는 HTML)에는 옛한글이 있을 때만 글꼴을 data: 주소로 넣는다.

쓰는 법
  python3 merge_v46.py --docs <docs/index.html>   # GitHub용 docs/index.html을 그 자리에서 고치고 docs/fonts/ 생성
  python3 merge_v46.py                            # merge_v45 → site_v45.html → site_v46.html (원래 작업 환경)
"""
import sys, os, re, shutil, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
JAMO = 'ᄀ-ᇿꥠ-꥿ힰ-퟿'
OH_RANGE = 'U+1100-11FF,U+A960-A97F,U+D7B0-D7FF,U+302E-302F,U+3165-318E'
SRC = {
    'serif': '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc',
    'sans': '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
}


def build_fonts(body, out_dir):
    """데이터에 쓰인 옛한글 자모만 담은 부분 글꼴을 만든다. 원본 글꼴이 없으면 저장해 둔 판을 쓴다."""
    os.makedirs(out_dir, exist_ok=True)
    data = body[body.index('<script>'):]
    used = sorted({c for c in data if re.match(f'[{JAMO}〮〯ㅥ-ㆎ]', c)})
    uni = ','.join('U+%04X' % ord(c) for c in used)
    for k, src in SRC.items():
        dst = os.path.join(out_dir, f'oh-{k}.woff')
        keep = os.path.join(HERE, 'fonts', f'oh-{k}.woff')
        if os.path.exists(src):
            subprocess.run(['pyftsubset', src, '--font-number=1', f'--unicodes={uni}',
                            "--layout-features=*", '--flavor=woff', f'--output-file={dst}'], check=True)
            os.makedirs(os.path.dirname(keep), exist_ok=True)
            shutil.copyfile(dst, keep)
        else:
            shutil.copyfile(keep, dst)
        print(f'  {k}: {len(used)}자, {os.path.getsize(dst):,} bytes')


def patch_body(s):
    def rep(old, new, count=1):
        nonlocal s
        n = s.count(old)
        if n != count:
            sys.exit(f'patch miss ({n} != {count}): {old[:80]!r}')
        s = s.replace(old, new)

    # 1) 글꼴 선언 + 모든 글꼴 목록 앞에 옛한글 글꼴
    rep('<title>뿌리 깊은 나무', f'''<style>
@font-face{{font-family:"OldHangulSerif";font-weight:400;font-display:swap;src:url(fonts/oh-serif.woff) format("woff");unicode-range:{OH_RANGE}}}
@font-face{{font-family:"OldHangulSans";font-weight:400;font-display:swap;src:url(fonts/oh-sans.woff) format("woff");unicode-range:{OH_RANGE}}}
</style>
<title>뿌리 깊은 나무''')
    rep('--font-sans:"Noto Sans KR",', '--font-sans:"OldHangulSans","Noto Sans KR",')
    rep('--font-paper:"Noto Serif KR",', '--font-paper:"OldHangulSerif","Noto Serif KR",')
    rep('font-family:"Noto Sans KR","Malgun Gothic",sans-serif', 'font-family:"OldHangulSans","Noto Sans KR","Malgun Gothic",sans-serif', 4)
    rep('font-family:var(--pfam,"Noto Serif KR"),"Noto Serif KR"', 'font-family:"OldHangulSerif",var(--pfam,"Noto Serif KR"),"Noto Serif KR"')

    # 2) 현대 음절 + 옛 끝소리: 앞 음절을 자모로 풀어 한 글꼴 안에서 모이게
    rep('''function escapeHtml(s){
  const h = String(s ?? '').replace(/&/g,'&amp;')''', '''function escapeHtml(s){
  const h = String(s ?? '').replace(/[\\uAC00-\\uD7A3](?=[\\u1160-\\u11FF\\uD7B0-\\uD7FF])/g, c=>c.normalize('NFD')).replace(/&/g,'&amp;')''')

    # 3) 따로 여는 시험지 파일: 옛한글이 있으면 글꼴을 data: 주소로 넣기
    rep('''async function bkStandaloneHtml(){''', f'''async function bkOldHangulCss(root){{
  if(!/[\\u1100-\\u11FF\\uA960-\\uA97F\\uD7B0-\\uD7FF]/.test(root.textContent)) return '';
  let css = '';
  for(const [fam, file] of [['OldHangulSerif','fonts/oh-serif.woff'], ['OldHangulSans','fonts/oh-sans.woff']]){{
    let url;
    try{{ url = await bkDataUrl(file); }}catch(e){{ url = new URL(file, location.href).href; }}
    css += `@font-face{{font-family:"${{fam}}";font-weight:400;src:url(${{url}}) format("woff");unicode-range:{OH_RANGE}}}\\n`;
  }}
  return css;
}}
async function bkStandaloneHtml(){{''')
    rep('''  const title = basket.title.trim() || '담은 문제 모음';
  return `<!doctype html>''', '''  const title = basket.title.trim() || '담은 문제 모음';
  const ohCss = await bkOldHangulCss(clone);
  return `<!doctype html>''')
    rep('<style>${SHEET_CSS}', '<style>${ohCss}${SHEET_CSS}')

    # 4) 이용 안내 문구 고치기
    rep('옛한글을 지원하지 않는 글꼴에서는 자모가 풀어져 보일 수 있습니다.',
        '옛한글은 이 사이트에 들어 있는 옛한글 글꼴(Noto CJK에서 쓰인 글자만 뽑은 것)로 한 글자씩 모아 보여 줍니다.', 2)
    return s


def write_docs(path):
    t = open(path, encoding='utf-8').read()
    a = t.index('<body>\n') + len('<body>\n')
    b = t.rindex('</body>')
    head, body, tail = t[:a], t[a:b], t[b:]
    build_fonts(body, os.path.join(os.path.dirname(os.path.abspath(path)), 'fonts'))
    open(path, 'w', encoding='utf-8').write(head + patch_body(body) + tail)
    print('ok', path)


if __name__ == '__main__':
    if '--docs' in sys.argv:
        write_docs(sys.argv[sys.argv.index('--docs') + 1])
        sys.exit()
    if '--no-base' not in sys.argv:
        subprocess.run([sys.executable, os.path.join(HERE, 'merge_v45.py')], check=True)
    for p in ['/home/claude/repo/docs/index.html', '/mnt/user-data/outputs/repo/docs/index.html']:
        if os.path.exists(p):
            write_docs(p)
