"""밑줄 원자료(ul/raw)를 사이트 글(지문·발문·<보기>·선택지)에 대응시켜 위치를 정한다.
출력: ul/spans.json {field_id: [[start,end],...]}, ul/report.txt"""
import json, re, sys, os, collections
sys.path.insert(0, '/home/claude/chk')
exec(open('/home/claude/ex22/parse.py').read().split("L = json.load")[0])   # CODE, fix()
SITE = '/home/claude/site_v42.html'
s = open(SITE, encoding='utf-8').read()
def C(n): return json.loads(re.search(rf'^const {n} = (.*);$', s, re.M).group(1))
I = C('ITEMS'); P = C('PASSAGES'); CH = C('CHOICES'); I28 = C('ITEMS_2028'); P28 = C('PASSAGES_2028'); C28 = C('CHOICES_2028')
VAR = {'｢':'「','｣':'」','『':'『','∼':'~','～':'~','〜':'~','ㆍ':'·','∙':'·','•':'·','‧':'·','“':'"','”':'"','‘':"'",'’':"'",'＜':'<','＞':'>','〈':'<','〉':'>','《':'<','》':'>','─':'-','―':'-','—':'-','–':'-','…':'...'}
def N(t):
    """비교용: 공백·보이지 않는 글자 빼고 글자 변이 통일. (정규화 문자열, 원래 위치 목록)"""
    out = []; pos = []
    for i, c in enumerate(t):
        if c.isspace() or c in '​‌‍﻿⁠': continue
        r = VAR.get(c, c)
        for k in r: out.append(k); pos.append(i)
    return ''.join(out), pos
def fields(ex):
    F = {}
    if ex == '2028-예시':
        for k, v in P28.items():
            if k.startswith(ex + '||') and v: F[('P', k)] = v
        for it in I28:
            key = f"{it['exam_id']}||{it['영역']}||{it['문항번호']}"
            F[('S', key)] = it['발문']
            if it.get('보기'): F[('B', key)] = it['보기']
            for i, c in enumerate(C28.get(key) or []): F[('C', key, i)] = c
    else:
        for k, v in P.items():
            if k.startswith(ex + '||') and v: F[('P', k)] = v
        for it in I:
            if it['exam_id'] != ex: continue
            key = f"{it['exam_id']}||{it['영역']}||{it['문항번호']}"
            F[('S', key)] = it['발문']
            if it.get('보기'): F[('B', key)] = it['보기']
            for i, c in enumerate(CH.get(key) or []): F[('C', key, i)] = c
    return F
def run(ex):
    R = json.load(open(f'/home/claude/ul/raw/{ex}.json'))
    F = fields(ex); NF = {k: N(v) for k, v in F.items()}
    spans = collections.defaultdict(list); log = []
    for r in R:
        u = N(fix(r['u']))[0]; pre = N(fix(r['pre']))[0]; post = N(fix(r['post']))[0]
        if not u or re.fullmatch(r"[\W_]+", u): continue
        if re.fullmatch(r"\[[^\]]{1,3}\]|[ⓐ-ⓩ㉠-㉻①-⑳ㄱ-ㅎ]+|[A-Za-z]{1,2}", u): continue
        cands = []
        for fk, (nt, pos) in NF.items():
            st = 0
            while True:
                j = nt.find(u, st)
                if j < 0: break
                a = 0
                while a < len(pre) and j - 1 - a >= 0 and nt[j - 1 - a] == pre[-1 - a]: a += 1
                b = 0
                while b < len(post) and j + len(u) + b < len(nt) and nt[j + len(u) + b] == post[b]: b += 1
                cands.append((a + b, a, b, fk, j)); st = j + 1
        if not cands and len(u) >= 10:
            # 가운데 글자가 달라도(한자·기호·줄바꿈 표시 등) 앞뒤 6글자로 찾는다
            h, t = u[:6], u[-6:]
            for fk, (nt, pos) in NF.items():
                st = 0
                while True:
                    j = nt.find(h, st)
                    if j < 0: break
                    e = nt.find(t, j + len(h) - 0)
                    if e >= 0 and e + len(t) - j <= len(u) * 1.5 + 4 and e + len(t) - j >= len(u) * 0.6:
                        a = 0
                        while a < len(pre) and j - 1 - a >= 0 and nt[j - 1 - a] == pre[-1 - a]: a += 1
                        cands.append((a, a, 0, fk, j, e + len(t)))
                    st = j + 1
            if len(cands) == 1 or (len(cands) > 1 and sorted(c[0] for c in cands)[-1] > sorted(c[0] for c in cands)[-2]):
                b = max(cands, key=lambda c: c[0]); nt, pos = NF[b[3]]
                spans[b[3]].append((pos[b[4]], pos[b[5] - 1] + 1, -1, r.get('k', 'u'))); log.append(('FUZZY', ex, r['pg'], r['u'], nt[b[4]:b[5]])); continue
            cands = []
        if not cands:
            log.append(('MISS', ex, r['pg'], r['u'], r['pre'][-8:], r['post'][:8])); continue
        cands.sort(key=lambda c: -c[0])
        best = cands[0]
        tied = [c for c in cands if c[0] == best[0]]
        if len(tied) > 1 and all(c[3][0] == 'S' for c in tied) and re.fullmatch(r'(않은|않는|없는|아닌|틀린|어긋난|않을|못한|않았던|않다)', u):
            # 발문의 부정 표현: 똑같은 발문이 여럿이면 모두 밑줄(평가원 문제지는 발문의 부정 표현에 늘 밑줄)
            for c in tied:
                nt, pos = NF[c[3]]; spans[c[3]].append((pos[c[4]], pos[c[4] + len(u) - 1] + 1, c[0], r.get('k', 'u')))
            continue
        if len(tied) > 1:
            # 같은 점수: 문맥이 충분히 길고 모두 같으면 모두 표시하지 않고 보고만
            log.append(('AMB', ex, r['pg'], r['u'], r['pre'][-8:], r['post'][:8], [str(c[3]) for c in cands[:3]], best[0])); continue
        if best[0] < 2 and len(u) < 3 and len(cands) > 1:
            log.append(('WEAK', ex, r['pg'], r['u'], r['pre'][-8:], r['post'][:8])); continue
        fk, j = best[3], best[4]
        nt, pos = NF[fk]
        spans[fk].append((pos[j], pos[j + len(u) - 1] + 1, best[0], r.get('k', 'u')))
    return spans, log, len(R)
if __name__ == '__main__':
    exs = open('/tmp/claude-0/-home-claude/7b612bc6-ce88-5a44-acc7-f627887d12f2/scratchpad/exs.txt').read().split()
    ALL = {}; LOG = []; tot = 0
    for ex in exs:
        sp, lg, n = run(ex); tot += n
        for k, v in sp.items(): ALL['\t'.join(map(str, k))] = v
        LOG += lg
        print(ex, n, sum(len(v) for v in sp.values()), collections.Counter(l[0] for l in lg))
    json.dump(ALL, open('/home/claude/ul/spans.json', 'w'), ensure_ascii=False)
    with open('/home/claude/ul/report.txt', 'w') as f:
        for l in LOG: f.write('\t'.join(map(str, l)) + '\n')
    print('total runs', tot, 'mapped', sum(len(v) for v in ALL.values()), collections.Counter(l[0] for l in LOG))
