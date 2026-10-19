"""Extract plain paragraph text (HWPTAG_PARA_TEXT payloads) from a legacy
binary .hwp (v5) file that has been (mis)named with a .hwpx extension.
Relies on cfb.py for the OLE container and does raw-deflate + hwp record
parsing, stdlib only (no network / pypi access available in this sandbox).
"""
import zlib
import struct
from cfb import CFB


def extract_text(path):
    c = CFB(path)
    sections = sorted(
        [n for n in c.streams if n.startswith("BodyText/Section")],
        key=lambda s: int(s.split("Section")[1]),
    )
    parts = []
    for name in sections:
        raw = c.read(c.streams[name])
        dec = zlib.decompressobj(-15)
        data = dec.decompress(raw)
        data += dec.flush()
        i, n = 0, len(data)
        while i + 4 <= n:
            hdr = struct.unpack_from("<I", data, i)[0]
            tag = hdr & 0x3FF
            size = (hdr >> 20) & 0xFFF
            i += 4
            if size == 0xFFF:
                size = struct.unpack_from("<I", data, i)[0]
                i += 4
            payload = data[i:i + size]
            i += size
            if tag == 67:  # HWPTAG_PARA_TEXT
                parts.append(payload.decode("utf-16le", errors="ignore"))
    # 각 PARA_TEXT 레코드 = 한 문단. 문단 경계 자체가 줄바꿈 정보이므로
    # 레코드 사이에 명시적으로 개행을 넣어 준다(안 넣으면 표 셀 등에서
    # 문단들이 그대로 붙어 버려 이후 정규식 파싱이 깨진다).
    return "\n".join(parts)


if __name__ == "__main__":
    import sys
    t = extract_text(sys.argv[1])
    out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/out.txt"
    open(out, "w", encoding="utf-8").write(t)
    print(len(t), "chars ->", out)
