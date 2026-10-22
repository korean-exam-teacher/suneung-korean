"""원본 문제지 PDF에서 밑줄(글자 바로 아래 가로선)을 찾아, 밑줄 친 글자 묶음과 앞뒤 문맥을 뽑는다.
출력: /home/claude/ul/raw/<exam>.json [{pg,col,u,pre,post,x0,top}]"""
import pdfplumber, json, sys, os, re
from concurrent.futures import ProcessPoolExecutor
sys.path.insert(0, "/home/claude/chk")
from streams import fname, SRC
OUT = "/home/claude/ul/raw/"
FIXED = {}

def hlines(pg):
    segs = []
    for l in pg.lines:
        if abs(l["top"] - l["bottom"]) < 1.5 and l["x1"] - l["x0"] > 3: segs.append((l["x0"], l["x1"], (l["top"] + l["bottom"]) / 2))
    for r in pg.rects:
        if r["height"] < 1.3 and r["width"] > 3: segs.append((r["x0"], r["x1"], (r["top"] + r["bottom"]) / 2))
    out = []
    for s in sorted(set((round(a, 1), round(b, 1), round(y, 1)) for a, b, y in segs)):
        if out and abs(out[-1][2] - s[2]) < 0.3 and s[0] <= out[-1][1] + 0.5: out[-1] = (out[-1][0], max(out[-1][1], s[1]), out[-1][2])
        else: out.append(s)
    return out

def run(ex):
    f = FIXED.get(ex, SRC + fname(ex))
    res = []; stat = {"segs": 0, "ul": 0}
    with pdfplumber.open(f) as pdf:
        for pi, pg in enumerate(pdf.pages):
            W = pg.width
            ch = [c for c in pg.dedupe_chars().chars if c["text"].strip()]
            if not ch: continue
            cov = [0] * int(W + 1)
            for c in ch:
                for x in range(int(c["x0"]), min(int(c["x1"]) + 1, len(cov))): cov[x] += 1
            lo, hi = int(W * 0.35), int(W * 0.65)
            g = min(range(lo, hi), key=lambda x: (cov[x], abs(x - W / 2)))
            segs = hlines(pg); stat["segs"] += len(segs)
            vert = [(l["x0"], l["top"], l["bottom"]) for l in pg.lines if abs(l["x0"] - l["x1"]) < 1.5 and l["bottom"] - l["top"] > 4]
            vert += [(r["x0"], r["top"], r["bottom"]) for r in pg.rects if r["width"] < 1.5 and r["height"] > 4]
            vert += [(r["x1"], r["top"], r["bottom"]) for r in pg.rects if r["width"] < 1.5 and r["height"] > 4]
            def kind(x0, x1, y):
                # 끝점에 세로선: 양쪽이면 글자 상자(테두리)의 아래 변, 한쪽이면 [A] 꺾쇠의 팔 → 버림
                L = any(abs(vx - x0) < 2.5 and vt < y - 4 and vb > y - 1.5 for vx, vt, vb in vert)
                R = any(abs(vx - x1) < 2.5 and vt < y - 4 and vb > y - 1.5 for vx, vt, vb in vert)
                return "b" if (L and R) else ("x" if (L or R) else "u")
            segs = [sg + (kind(*sg),) for sg in segs]
            segs = [sg for sg in segs if sg[3] != "x"]
            ul = {}
            for (x0, x1, y, kd) in segs:
                above = [i for i, c in enumerate(ch) if x0 - 1 <= (c["x0"] + c["x1"]) / 2 <= x1 + 1 and -1.2 <= y - c["bottom"] <= 1.8]
                if not above: continue
                # 선 길이 대비 글자가 덮는 비율(표 테두리·상자 선 거르기)
                xs = sorted((ch[i]["x0"], ch[i]["x1"]) for i in above)
                covd = 0; cur = None
                for a, b in xs:
                    a, b = max(a, x0), min(b, x1)
                    if b <= a: continue
                    if cur and a <= cur[1] + ch[above[0]]["size"] * 0.6: cur = (cur[0], max(cur[1], b))
                    else:
                        if cur: covd += cur[1] - cur[0]
                        cur = (a, b)
                if cur: covd += cur[1] - cur[0]
                if covd < (x1 - x0) * 0.7: continue
                for i in above: ul[i] = kd
            stat["ul"] += len(ul)
            for col in (0, 1):
                idx = [i for i, c in enumerate(ch) if ((c["x0"] + c["x1"]) / 2 < g) == (col == 0)]
                # 줄 단위 정렬
                rows = []
                for i in sorted(idx, key=lambda i: ch[i]["top"]):
                    if rows and abs(rows[-1][0] - ch[i]["top"]) <= 2.5: rows[-1][1].append(i)
                    else: rows.append([ch[i]["top"], [i]])
                seq = []
                for top, r in rows:
                    for i in sorted(r, key=lambda i: ch[i]["x0"]): seq.append(i)
                    seq.append(None)  # 줄바꿈
                k = 0
                while k < len(seq):
                    if seq[k] is not None and seq[k] in ul:
                        j = k; parts = []
                        kd = ul[seq[k]]
                        while j < len(seq) and (seq[j] is None or ul.get(seq[j]) == kd):
                            if seq[j] is None and (j + 1 >= len(seq) or seq[j + 1] is None or ul.get(seq[j + 1]) != kd or kd == "b"): break
                            if seq[j] is not None: parts.append(seq[j])
                            j += 1
                        u = "".join(ch[i]["text"] for i in parts)
                        pre = "".join(ch[i]["text"] for i in seq[max(0, k - 40):k] if i is not None)[-20:]
                        post = "".join(ch[i]["text"] for i in seq[j:j + 40] if i is not None)[:20]
                        res.append({"pg": pi, "col": col, "k": kd, "u": u, "pre": pre, "post": post, "x0": round(ch[parts[0]]["x0"], 1), "top": round(ch[parts[0]]["top"], 1)})
                        k = j
                    else: k += 1
    os.makedirs(OUT, exist_ok=True)
    json.dump(res, open(OUT + ex + ".json", "w"), ensure_ascii=False)
    return ex, len(res), stat

if __name__ == "__main__":
    exs = sys.argv[1:]
    with ProcessPoolExecutor(8) as P:
        for r in P.map(run, exs): print(*r, flush=True)
