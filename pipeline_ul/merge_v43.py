#!/usr/bin/env python3
"""Version 50: 원본 문제지의 밑줄(㉠ 등이 가리키는 부분, 발문의 '않은' 등)과 글자 상자(테두리 친 말)를 되살린다.
merge_v42.py → site_v42.html → (이 단계) → site_v43.html.
자료: ul/spans.json (ul/extract.py: PDF 가로선, ul/hwp_ul.py: HWP 글자 모양 → ul/mapper.py)
글 속 표시: U+FDD0…U+FDD1 = 밑줄, U+FDD2…U+FDD3 = 상자. 화면에서는 escapeHtml이 <u class="ul">, <span class="bx">로 바꾼다.
밑줄은 띄어쓰기마다 끊었다가 다시 열어(공백은 앞 묶음 안에 둔다) 지문을 문장·낱말 단위로 잘라 보여 줘도 짝이 맞는다."""
import json, re, sys, subprocess
if '--no-base' not in sys.argv:
    subprocess.run([sys.executable, '/home/claude/merge_v42.py'], check=True)
s = open('/home/claude/site_v42.html', encoding='utf-8').read()
SP = json.load(open('/home/claude/ul/spans.json', encoding='utf-8'))
UO, UC, BO, BC = '﷐', '﷑', '﷒', '﷓'
assert not any(c in s for c in (UO, UC, BO, BC))

def getc(name):
    m = re.search(rf'^const {name} = (.*);$', s, re.M); return m, json.loads(m.group(1))
def putc(name, v):
    global s
    m = re.search(rf'^const {name} = (.*);$', s, re.M)
    s = s[:m.start(1)] + json.dumps(v, ensure_ascii=False) + s[m.end(1):]

def wrap_u(seg):
    out = UO + re.sub(r'(\s+)', lambda m: m.group(1) + UC + UO, seg) + UC
    return out.replace(UO + UC, '')
def wrap_b(seg):
    if len(seg) <= 30 and '\n' not in seg: return BO + re.sub(r' ', ' ', seg) + BC
    out = BO + re.sub(r'(\s+)', lambda m: m.group(1) + BC + BO, seg) + BC
    return out.replace(BO + BC, '')
def apply(t, spans, protect=()):
    sp = sorted({(a, b, k) for a, b, _, k in spans})
    keep = []; end = -1
    for a, b, k in sp:
        if a < end: continue           # 겹치면 앞의 것만
        if any(a < pe and b > ps for ps, pe in protect): continue
        keep.append((a, b, k)); end = b
    out = []; p = 0
    for a, b, k in keep:
        out.append(t[p:a]); out.append((wrap_u if k == 'u' else wrap_b)(t[a:b])); p = b
    out.append(t[p:]); return ''.join(out), len(keep)

stat = {'P': 0, 'S': 0, 'B': 0, 'C': 0}
_, P = getc('PASSAGES'); _, P28 = getc('PASSAGES_2028'); _, NOTES = getc('PASSAGE_NOTES')
_, I = getc('ITEMS'); _, I28 = getc('ITEMS_2028'); _, CH = getc('CHOICES'); _, C28 = getc('CHOICES_2028')
by = {}
for k, v in SP.items():
    f = k.split('\t'); by[tuple(f)] = v
for (kind, key, *rest), v in by.items():
    ex = key.split('||')[0]; is28 = ex == '2028-예시'
    if kind == 'P':
        src = P28 if is28 else P
        prot = []
        for n in NOTES.get(key, []):
            j = src[key].find(n[2])
            if j >= 0: prot.append((j, j + len(n[2])))
        src[key], n_ = apply(src[key], v, prot); stat['P'] += n_
    elif kind in ('S', 'B'):
        for it in (I28 if is28 else I):
            if f"{it['exam_id']}||{it['영역']}||{it['문항번호']}" == key:
                fld = '발문' if kind == 'S' else '보기'
                it[fld], n_ = apply(it[fld], v); stat[kind] += n_
    elif kind == 'C':
        src = C28 if is28 else CH; i = int(rest[0])
        src[key][i], n_ = apply(src[key][i], v); stat['C'] += n_
# 낱말 풀이(지문에서 떼어 내는 글)가 그대로 남았는지 확인
for key, ns in NOTES.items():
    t = (P28 if key.startswith('2028-예시') else P).get(key) or ''
    for n in ns:
        if n[2] in re.sub('[\ufdd0-\ufdd3]', '', t).replace('\u00a0', ' '): assert n[2] in t, (key, n[2][:30])
putc('PASSAGES', P); putc('PASSAGES_2028', P28); putc('ITEMS', I); putc('ITEMS_2028', I28); putc('CHOICES', CH); putc('CHOICES_2028', C28)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: sys.exit(f'patch miss ({n} != {count}): {old[:80]!r}')
    s = s.replace(old, new)
# 화면 표시: 표시 글자 → 태그
rep("""function escapeHtml(s){
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}""", """function escapeHtml(s){
  const h = String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return /[\\uFDD0-\\uFDD3]/.test(h) ? markHtml(h) : h;
}
/* 원본 문제지의 밑줄(U+FDD0…FDD1)·글자 상자(U+FDD2…FDD3)를 태그로. 잘린 조각이어도 짝을 맞춘다 */
function markHtml(h){
  let out = '', u = false, b = false;
  for(const c of h){
    if(c === '\\uFDD0'){ if(!u){ out += '<u class="ul">'; u = true; } }
    else if(c === '\\uFDD1'){ if(u){ out += '</u>'; u = false; } }
    else if(c === '\\uFDD2'){ if(!b){ out += '<span class="bx">'; b = true; } }
    else if(c === '\\uFDD3'){ if(b){ if(u){ out += '</u>'; u = false; } out += '</span>'; b = false; } }
    else out += c;
  }
  if(u) out += '</u>';
  if(b) out += '</span>';
  return out;
}
/* 검색·비교용: 표시 글자를 뺀 맨글 */
function plainText(s){ return String(s ?? '').replace(/[\\uFDD0-\\uFDD3]/g,'').replace(/\\u00A0/g,' '); }""")
rep("""function metaHay(it){ return (it.소재+' '+(it.분야||'')+' '+(it.작품||[]).join(' ')+' '+it.발문+' '+(it.보기||'')).toLowerCase(); }""",
    """function metaHay(it){ return plainText(it.소재+' '+(it.분야||'')+' '+(it.작품||[]).join(' ')+' '+it.발문+' '+(it.보기||'')).toLowerCase(); }""")
rep("""    const passage = (getPassage(it.exam_id, it.영역, it.지문범위) || '').toLowerCase();""",
    """    const passage = plainText(getPassage(it.exam_id, it.영역, it.지문범위) || '').toLowerCase();""")
rep("""function hl(text){
  const safe = escapeHtml(text);""", """function hl(text){
  const safe = escapeHtml(plainText(text));""")
CSS = """
/* 원본 문제지의 밑줄·글자 상자 */
u.ul{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.24em;text-decoration-skip-ink:none}
.bx{border:1px solid currentColor;padding:0 .18em;margin:0 .06em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
"""
rep('@media (prefers-reduced-motion: reduce)', CSS + '@media (prefers-reduced-motion: reduce)')
rep(""".sh-key td.l{text-align:left;font-size:.88em}
`;""", """.sh-key td.l{text-align:left;font-size:.88em}
.sheet u.ul{text-decoration:underline;text-decoration-thickness:.2mm;text-underline-offset:.22em;text-decoration-skip-ink:none}
.sheet .bx{border:.2mm solid #111;padding:0 .15em;margin:0 .05em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
`;""")
# 이용 안내
GUIDE = """      <details>
        <summary>밑줄과 글자 상자</summary>
        <p>원본 문제지에서 밑줄을 그은 부분(㉠·ⓐ 등이 가리키는 말, 발문의 '않은'·'없는' 등)과 테두리 상자로 묶은 말을 문제지 PDF의 선 위치로 찾아 지문·발문·&lt;보기&gt;·선택지에 그대로 표시했습니다(밑줄 약 5,800곳, 상자 약 320곳). 2009학년도 9월·수능, 2014학년도 수능 A·B형은 한글(HWP) 문제지의 글자 모양으로 찾았습니다. 표 안의 선이나 [A] 같은 꺾쇠의 선은 밑줄로 보지 않았습니다. 문제지의 글자와 이 사이트의 글자가 달라(옛한글·수식 등) 자리를 찾지 못한 밑줄이 30곳쯤 있습니다.</p>
      </details>
"""
rep("""      <details>
        <summary>원본 그림(제시 자료·지문 속 그림·매체 화면)</summary>""", GUIDE + """      <details>
        <summary>원본 그림(제시 자료·지문 속 그림·매체 화면)</summary>""")
open('/home/claude/site_v43.html', 'w', encoding='utf-8').write(s)
print('ok', len(s), stat)
