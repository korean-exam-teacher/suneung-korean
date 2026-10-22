"""HWP(5.0) 문제지에서 밑줄 글자 모양을 읽어 밑줄 친 글자 묶음과 앞뒤 문맥을 뽑는다 → ul/raw/<exam>.json"""
import sys, zlib, struct, json
sys.path.insert(0, "/home/claude/hwp")
from cfb import CFB
from hwp5 import records, INLINE8
U = "/mnt/user-data/uploads/평가원 기출 문제 모음/"
SRC = {"2009-09": "/home/claude/hwp/2009-09.hwp", "2009-11": U + "2009학년도_대학수학능력시험_문제정리_홀수형.hwp",
       "2014-11-A": U + "2014학년도_대학수학능력시험_국어A형_문제정리_홀수형.hwpx", "2014-11-B": U + "2014학년도_대학수학능력시험_국어B형_문제정리_홀수형.hwpx"}
def chars(b):
    n = len(b) // 2; u = struct.unpack(f"<{n}H", b[:n * 2]); out = []; i = 0
    while i < n:
        c = u[i]
        if c < 32:
            if c == 9: out.append((" ", i)); i += 8; continue
            if c in INLINE8: i += 8; continue
            if c == 10: out.append(("\n", i))
            i += 1; continue
        if 0xD800 <= c < 0xDC00 and i + 1 < n:
            out.append(((chr(c) + chr(u[i + 1])).encode("utf-16le", "surrogatepass").decode("utf-16le", "replace"), i)); i += 2; continue
        out.append((chr(c), i)); i += 1
    return out
def run(ex):
    f = CFB(SRC[ex]); hdr = f.read(f.streams["FileHeader"]); comp = hdr[36] & 1
    di = f.read(f.streams["DocInfo"]); di = zlib.decompress(di, -15) if comp else di
    ULS = []
    for tag, lvl, body in records(di):
        if tag == 21:
            attr = struct.unpack_from("<I", body, 46)[0]; ULS.append(((attr >> 2) & 3) == 1)
    secs = sorted([k for k in f.streams if k.startswith("BodyText/Section")], key=lambda k: int(k[16:]))
    seq = []  # (글자, 밑줄?)
    for k in secs:
        data = f.read(f.streams[k]); data = zlib.decompress(data, -15) if comp else data
        cur = None
        for tag, lvl, body in records(data):
            if tag == 66: cur = None
            elif tag == 67: cur = chars(body)
            elif tag == 68:
                pairs = [struct.unpack_from("<II", body, o) for o in range(0, len(body) - 7, 8)]
                if cur:
                    for ch, pos in cur:
                        sid = 0
                        for p, s in pairs:
                            if p <= pos: sid = s
                            else: break
                        seq.append((ch, ch.strip() != "" and sid < len(ULS) and ULS[sid]))
                seq.append(("\n", False)); cur = None
    res = []; k = 0
    while k < len(seq):
        if seq[k][1]:
            j = k
            while j < len(seq) and (seq[j][1] or (seq[j][0] == " " and j + 1 < len(seq) and seq[j + 1][1])): j += 1
            u = "".join(c for c, _ in seq[k:j])
            pre = "".join(c for c, _ in seq[max(0, k - 30):k]).replace("\n", "")[-20:]
            post = "".join(c for c, _ in seq[j:j + 30]).replace("\n", "")[:20]
            res.append({"pg": -1, "col": 0, "u": u, "pre": pre, "post": post}); k = j
        else: k += 1
    json.dump(res, open(f"/home/claude/ul/raw/{ex}.json", "w"), ensure_ascii=False)
    return ex, len(ULS), sum(ULS), len(res)
if __name__ == "__main__":
    for ex in SRC: print(*run(ex))
