import json, sys, subprocess, os
sys.path.insert(0, "/home/claude/chk")
from streams import fname, SRC
from PIL import Image
OUT = "/tmp/claude-0/-home-claude/7b612bc6-ce88-5a44-acc7-f627887d12f2/scratchpad/uc/"
def crop(ex, needle, tag, dpi=110, h=70):
    R = json.load(open(f"/home/claude/ul/raw/{ex}.json"))
    r = next(r for r in R if needle in r["u"].replace(" ", ""))
    base = f"/tmp/claude-0/U{dpi}_{ex}_{r['pg']}"
    if not os.path.exists(base + ".png"):
        subprocess.run(["pdftoppm", "-r", str(dpi), "-f", str(r["pg"] + 1), "-l", str(r["pg"] + 1), "-png", "-singlefile", SRC + fname(ex), base], stderr=subprocess.DEVNULL)
    im = Image.open(base + ".png"); s = dpi / 72; W = im.width
    x0 = 0 if r["col"] == 0 else W // 2 - 20
    im.crop((x0, max(0, int((r["top"] - 25) * s)), x0 + W // 2 + 20, int((r["top"] + h) * s))).save(OUT + tag + ".png")
    return r
if __name__ == "__main__":
    print(crop(sys.argv[1], sys.argv[2], sys.argv[3]))
