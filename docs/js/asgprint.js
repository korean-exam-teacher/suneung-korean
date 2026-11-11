/* 국어의 모든 것 — 과제·모의고사 인쇄(미리 보기) v107 (2026-11-11)
 * 쓰는 곳: account.js(학생 과제 화면의 '인쇄'), teacher.html(과제 카드의 '인쇄')
 *   KMAPrint.open(과제, {key:{문항키:정답}})  — key 를 주면(선생님) '정답표'를 붙일 수 있다
 * 배치: A4, 2단. 쪽·단을 직접 계산해 놓는다(미리 보기 = 인쇄).
 *  · 문항(발문+선택지)은 쪼개지 않는다. 남은 칸에 안 들어가면 다음 단으로, 한 단보다 길면 그 단에 들어가게 줄인다.
 *  · 지문(글·그림)은 줄 사이 흰 곳에서 끊어 다음 단·쪽으로 이어 싣는다.
 *  · 수능 문항만 있는 과제는 수능 문제지 양식(suneung.html 시험지와 같은 값), 그 밖은 넓은 2단.
 */
(function () {
  if (window.KMAPrint) return;
  var SHEET_CSS = "\n.sheet{position:relative;box-sizing:border-box;background:#fff;color:#000;overflow:hidden;\n  font-family:\"OldHangulSerif\",var(--pfam,\"Noto Serif KR\"),\"Noto Serif KR\",\"Noto Serif CJK KR\",\"Batang\",\"AppleMyungjo\",serif;font-size:var(--pf,10pt);line-height:1.6;\n  letter-spacing:-.04em;word-break:keep-all;overflow-wrap:anywhere;-webkit-print-color-adjust:exact;print-color-adjust:exact}\n.sheet *{box-sizing:border-box}\n.sheet .hf{font-family:\"HY헤드라인M\",\"HYHeadLine-Medium\",\"OldHangulSans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",\"Malgun Gothic\",sans-serif;font-weight:800;font-synthesis:none;letter-spacing:0;line-height:1}\n.sheet .pnum{font-family:\"Times New Roman\",Times,\"Noto Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;font-weight:700;letter-spacing:0;line-height:1}\n.sh-hd{position:absolute;border-bottom:var(--rw) solid #000}\n.sh-hd .hf{position:absolute;left:0;right:0;bottom:var(--hb);text-align:center}\n.sh-hd .pnum{position:absolute;bottom:var(--pb)}\n.sh-hd.odd .pnum{right:0} .sh-hd.even .pnum{left:0}\n.sh-hd1{position:absolute;border-bottom:var(--rw) solid #000}\n.sh-hd1 .t-s{position:absolute;left:0;right:0;text-align:center;font-family:\"OldHangulSans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",\"Malgun Gothic\",sans-serif;font-weight:500;letter-spacing:-.02em;line-height:1}\n.sh-hd1 .pnum{position:absolute;right:0}\n.sh-hd1 .gyosi{position:absolute;left:0;display:flex;align-items:center;justify-content:center;border:var(--tw) solid #000;border-radius:999px;\n  font-family:\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;font-weight:700;letter-spacing:0;line-height:1;white-space:nowrap}\n.sh-hd1 .gyosi b{font-family:\"Times New Roman\",Times,serif;margin:0 .18em}\n.sh-hd1 .hf{position:absolute;left:0;right:0;text-align:center}\n.sh-cols{position:absolute;display:flex}\n.sh-col{position:relative;flex:none;height:100%;overflow:hidden}\n.sh-rule{flex:none;width:0;border-left:var(--cw) solid #000;margin:0 auto}\n.sh-col > :first-child{margin-top:0!important}\n.sh-ft{position:absolute;border:var(--tw) solid #000;font-family:\"Times New Roman\",Times,serif;letter-spacing:0;line-height:1;\n  background:linear-gradient(to bottom right,transparent calc(50% - var(--tw)/2),#000 calc(50% - var(--tw)/2),#000 calc(50% + var(--tw)/2),transparent calc(50% + var(--tw)/2))}\n.sh-ft .a{position:absolute;left:.18em;top:.08em}\n.sh-ft .b{position:absolute;right:.18em;bottom:.06em}\n.gh{margin-top:2.2em;text-align:justify}\n.gh .rg{margin-right:.25em;letter-spacing:0}\n.src{font-family:\"OldHangulSans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",\"Malgun Gothic\",sans-serif;font-size:.74em;color:#555;font-weight:400;letter-spacing:0}\n.gh + .pbox, .gh + .pimg{margin-top:.45em}\n.pbox{border:var(--tw) solid #000;padding:.3em .5em .35em}\n.pbox + .pbox{margin-top:0}\n.pbox > :first-child{margin-top:0!important}\n.pp{text-align:justify;text-indent:.6em}\n.pp.cont{text-indent:0}\n.pp.brk{text-align-last:justify}\n.pp.ph{text-indent:0;font-weight:600}\n.poem{white-space:pre-wrap;text-indent:0;text-align:left}\n.pnote{font-size:.84em;line-height:1.5;text-indent:0;margin-top:.12em;padding-left:.8em}\n.pp + .pnote, .poem + .pnote{margin-top:.5em}\n.q{margin-top:2.4em}\n.pbox + .q, .pimg + .q, .pnote + .q{margin-top:1.9em}\n.qs{text-align:justify;padding-left:1.5em;text-indent:-1.5em}\n.qs .qn{font-family:\"Times New Roman\",Times,\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;font-weight:700;font-size:1.13em;display:inline-block;min-width:1.33em;text-indent:0;letter-spacing:0}\n.qb{position:relative;border:var(--tw) solid #000;padding:.35em .55em .4em;margin:.6em 0 .35em}\n.qb.lab{margin-top:1.1em;padding-top:.75em}\n.qb.cont{border-top-style:dashed;margin-top:0;padding-top:.35em}\n.qb.brk{border-bottom-style:dashed;margin-bottom:0}\n.qbl{position:absolute;left:50%;top:0;transform:translate(-50%,-52%);background:#fff;padding:0 .45em;white-space:nowrap;letter-spacing:0;line-height:1.2}\n.qbt{white-space:pre-wrap;text-align:justify}\n.qc{display:grid;gap:0 1.2em;margin-top:.7em;padding-left:.3em}\n.qc > div{padding-left:1.25em;text-indent:-1.25em}\n.qna{margin-top:.35em;font-size:.88em;color:#444}\n.q.part{margin-top:.25em}\n.pimg{overflow:hidden;margin:.35em auto 0;break-inside:avoid}\n.pimg img{display:block;width:100%;height:auto}\n.pimg + .pimg{margin-top:0}\n.qs + .pimg{margin-top:.45em}\n.chk{position:absolute;left:0;right:0;bottom:0;border:var(--tw) solid #000;padding:.5em .7em;font-family:\"OldHangulSans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",\"Malgun Gothic\",sans-serif;font-size:.86em;line-height:1.5;letter-spacing:-.02em}\n.chk b{display:block;margin-bottom:.2em}\n.chk p{margin:0;padding-left:.9em;text-indent:-.9em}\n.sh-key{position:absolute;font-family:\"OldHangulSans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",\"Malgun Gothic\",sans-serif;font-size:9.5pt;line-height:1.35;letter-spacing:0}\n.sh-key h3{margin:0 0 3mm;font-size:13pt;text-align:center}\n.sh-key .kc{display:flex;gap:6mm;align-items:flex-start}\n.sh-key table{flex:1;border-collapse:collapse}\n.sh-key th,.sh-key td{border:.25mm solid #333;padding:1mm 1.5mm;text-align:center}\n.sh-key th{background:#eee;font-weight:700}\n.sh-key td.l{text-align:left;font-size:.88em}\n.sheet u.ul{text-decoration:underline;text-decoration-thickness:.2mm;text-underline-offset:.22em;text-decoration-skip-ink:none}\n.sheet .bx{border:.2mm solid #000;padding:0 .15em;margin:0 .05em;-webkit-box-decoration-break:clone;box-decoration-break:clone}\n";
  var CIR = "①②③④⑤", PXMM = 96 / 25.4;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function mm(v) { return (Math.round(v * 100) / 100) + "mm"; }
  var EXTRA = [
    '@font-face{font-family:"OldHangulSerif";font-weight:400;font-display:swap;src:url(/suneung-korean/fonts/oh-nanum.woff) format("woff");unicode-range:U+1100-11FF,U+A960-A97F,U+D7B0-D7FF,U+302E-302F,U+3165-318E}',
    '@font-face{font-family:"OldHangulSans";font-weight:400;font-display:swap;src:url(/suneung-korean/fonts/oh-sans.woff) format("woff");unicode-range:U+1100-11FF,U+A960-A97F,U+D7B0-D7FF,U+302E-302F,U+3165-318E}',
    ".kp-root{position:fixed;inset:0;z-index:200;background:#8a8f98;overflow:auto;-webkit-overflow-scrolling:touch}",
    ".kp-bar{position:sticky;top:0;z-index:2;display:flex;gap:10px 14px;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 14px;background:#1f2530;color:#fff;font:14px/1.4 'Pretendard Variable',Pretendard,'Noto Sans KR',sans-serif}",
    ".kp-bar b{font-weight:700}.kp-bar small{opacity:.75;font-size:12.5px}",
    ".kp-bar button{font:inherit;font-weight:700;padding:8px 18px;border:0;border-radius:999px;background:#fff;color:#13171E;cursor:pointer}.kp-bar button.sub{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}.kp-bar button:disabled{opacity:.5;cursor:default}",
    ".kp-bar label{display:inline-flex;gap:6px;align-items:center;cursor:pointer}.kp-bar input{width:17px;height:17px;margin:0}",
    ".kp-pages{padding:14px 0 40px}.kp-pages .sheet{margin:0 auto 14px;box-shadow:0 2px 10px rgba(0,0,0,.35)}",
    ".kp-msg{color:#fff;text-align:center;padding:60px 20px;font:15px 'Pretendard Variable',Pretendard,'Noto Sans KR',sans-serif}",
    /* 넓은 2단(공무원·PSAT·LEET·임용·논술, 섞인 과제) */
    ".pl-hd1{position:absolute;border-bottom:var(--rw) solid #000;font-family:'OldHangulSans','Noto Sans KR','Noto Sans CJK KR','Malgun Gothic',sans-serif;letter-spacing:-.02em;line-height:1.2}",
    ".pl-hd1 .t{position:absolute;left:0;bottom:2.2mm;font-size:15pt;font-weight:700}.pl-hd1 .s{position:absolute;left:0;top:0;font-size:8.5pt;color:#444}",
    ".pl-hd1 .nm{position:absolute;right:0;bottom:2.4mm;font-size:10pt;display:flex;gap:5mm}.pl-hd1 .nm i{font-style:normal;display:inline-block;border-bottom:.2mm solid #000;margin-left:1.5mm;vertical-align:bottom}",
    ".pl-hd{position:absolute;border-bottom:var(--rw) solid #000;font-family:'OldHangulSans','Noto Sans KR','Noto Sans CJK KR','Malgun Gothic',sans-serif;font-size:8.5pt;color:#333;display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:1.2mm;letter-spacing:-.02em;line-height:1}",
    ".pl-ft{position:absolute;left:0;right:0;text-align:center;font-family:'Times New Roman',Times,serif;font-size:9pt;letter-spacing:0;line-height:1}",
    /* 과제 문항 머리(번호 + 출처) */
    ".qh2{font-family:'OldHangulSans','Noto Sans KR','Noto Sans CJK KR','Malgun Gothic',sans-serif;font-size:.82em;color:#333;letter-spacing:-.02em;line-height:1.3;margin-bottom:.25em;display:flex;gap:.5em;align-items:baseline}",
    ".qh2 b{font-family:'Times New Roman',Times,serif;font-size:1.5em;color:#000;letter-spacing:0}",
    ".q .pimg{margin-top:.2em}.q.fit{transform-origin:top left}",
    ".wr{margin-top:.6em;border:var(--tw) solid #000;height:22mm;position:relative}.wr:before{content:'답';position:absolute;left:1.2mm;top:.6mm;font-size:.8em;color:#555}",
    ".ansg{margin-top:2em;border:var(--tw) solid #000;padding:.5em .6em .6em;font-family:'OldHangulSans','Noto Sans KR','Noto Sans CJK KR','Malgun Gothic',sans-serif;font-size:.86em;letter-spacing:0;line-height:1.3}",
    ".ansg b{display:block;margin-bottom:.4em}.ansg .g{display:grid;grid-template-columns:repeat(5,1fr);border-top:.2mm solid #000;border-left:.2mm solid #000}",
    ".ansg .g span{border-right:.2mm solid #000;border-bottom:.2mm solid #000;height:7mm;display:flex;align-items:center;padding-left:1.2mm}.ansg .g i{font-style:normal;font-family:'Times New Roman',Times,serif;font-weight:700;width:1.6em}",
    "@media print{html,body{overflow:visible!important;height:auto!important;min-height:0!important;background:#fff!important;margin:0!important;padding:0!important}",
    "body>*:not(.kp-root){display:none!important}.kp-root{position:static!important;background:#fff!important;overflow:visible!important}.kp-bar,.kp-msg{display:none!important}",
    ".kp-pages{zoom:1!important;padding:0!important}.kp-pages .sheet{margin:0!important;box-shadow:none!important;break-after:page;page-break-after:always}.kp-pages .sheet:last-child{break-after:auto;page-break-after:auto}",
    "@page{size:210mm 297mm;margin:0}}"
  ].join("\n");

  /* ---------- 자료 불러오기 ---------- */
  var IMG = {}, GMQ = {}, CUT = {};
  function loadImg(src) {
    return IMG[src] || (IMG[src] = new Promise(function (res) { var im = new Image(); im.onload = function () { res({ ok: true, src: src, w: im.naturalWidth, h: im.naturalHeight, im: im }); }; im.onerror = function () { res({ ok: false, src: src, w: 760, h: 200 }); }; im.src = src; }));
  }
  function gmQ(e) { return GMQ[e] || (GMQ[e] = fetch("/advanced-korean/gm/q/" + e + ".json?v=106").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  /* 그림을 끊어도 되는 자리(흰 줄 한가운데)의 y — 상자 옆선 같은 세로줄은 빼고 본다 */
  function cuts(o) {
    if (CUT[o.src]) return CUT[o.src];
    var out = [];
    try {
      var k = Math.min(1, 380 / o.w), w = Math.max(1, Math.round(o.w * k)), h = Math.max(1, Math.round(o.h * k));
      var c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d", { willReadFrequently: true });
      x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(o.im, 0, 0, w, h);
      var d = x.getImageData(0, 0, w, h).data, col = new Uint32Array(w), dark = new Uint8Array(w * h), i, j;
      for (j = 0; j < h; j++) for (i = 0; i < w; i++) { var p = (j * w + i) * 4; if (d[p] + d[p + 1] + d[p + 2] < 560) { dark[j * w + i] = 1; col[i]++; } }
      var skip = new Uint8Array(w); for (i = 0; i < w; i++) if (col[i] > h * 0.5) { skip[i] = 1; if (i) skip[i - 1] = 1; if (i + 1 < w) skip[i + 1] = 1; }
      var run = 0;
      for (j = 0; j <= h; j++) {
        var blank = false;
        if (j < h) { var n = 0; for (i = 0; i < w; i++) if (dark[j * w + i] && !skip[i]) n++; blank = n === 0; }
        if (blank) run++; else { if (run >= 2 && j - run > 4 && j < h - 4) out.push(Math.round((j - run / 2) / k)); run = 0; }
      }
    } catch (e) { out = []; }
    return (CUT[o.src] = out);
  }

  /* ---------- 양식 ---------- */
  function geom(sn) {
    return sn ? { sn: true, w: 210, h: 297, mx: 21.9, colW: 79.2, rule1: 54.3, rule: 36.7, top1: 57.1, top: 39.5, bottom: 30.8, ftY: 269.4, ftW: 12.6, ftH: 5.6, rw: 0.3, cw: 0.21, tw: 0.145, pt: 8.1 }
      : { sn: false, w: 210, h: 297, mx: 11, colW: 91, rule1: 27, rule: 17, top1: 30, top: 20, bottom: 15, rw: 0.3, cw: 0.2, tw: 0.15, pt: 9 };
  }
  function sheetHtml(idx, g, A, info) {
    var first = idx === 0, pt = function (v) { return (Math.round(v * 10) / 10) + "pt"; }, head, foot;
    var vars = "--rw:" + mm(g.rw) + ";--cw:" + mm(g.cw) + ";--tw:" + mm(g.tw) + ";";
    if (g.sn) {
      head = first
        ? '<div class="sh-hd1" style="left:' + mm(g.mx) + ";right:" + mm(g.mx) + ";top:0;height:" + mm(g.rule1) + '"><div class="t-s" style="top:25.2mm;font-size:' + pt(14.9) + '">' + esc(A.title) + '</div><div class="pnum" style="top:24.6mm;font-size:' + pt(23.3) + '">1</div>' +
          '<div class="gyosi" style="top:39.4mm;width:22.7mm;height:7.8mm;font-size:' + pt(13.5) + '">제<b>1</b>교시</div><div class="hf" style="top:39.2mm;font-size:' + pt(29.6) + '">국어 영역</div></div>'
        : '<div class="sh-hd ' + (idx % 2 ? "even" : "odd") + '" style="left:' + mm(g.mx) + ";right:" + mm(g.mx) + ";top:0;height:" + mm(g.rule) + ';--hb:1.6mm;--pb:1.2mm"><span class="pnum" style="font-size:' + pt(23.3) + '">' + (idx + 1) + '</span><span class="hf" style="font-size:' + pt(19.8) + '">국어 영역</span></div>';
      foot = '<div class="sh-ft" style="left:' + mm(g.w / 2 - g.ftW / 2) + ";top:" + mm(g.ftY) + ";width:" + mm(g.ftW) + ";height:" + mm(g.ftH) + ';font-size:8.5pt"><span class="a">' + (idx + 1) + '</span><span class="b"></span></div>';
    } else {
      head = first
        ? '<div class="pl-hd1" style="left:' + mm(g.mx) + ";right:" + mm(g.mx) + ";top:10mm;height:" + mm(g.rule1 - 10) + '"><span class="s">국어의 모든 것 · ' + esc(info) + '</span><span class="t">' + esc(A.title) + '</span><span class="nm"><span>반<i style="width:22mm"></i></span><span>이름<i style="width:30mm"></i></span></span></div>'
        : '<div class="pl-hd" style="left:' + mm(g.mx) + ";right:" + mm(g.mx) + ";top:9mm;height:" + mm(g.rule - 9) + '"><span>' + esc(A.title) + "</span><span>국어의 모든 것</span></div>";
      foot = '<div class="pl-ft" style="top:' + mm(g.h - 10) + '"><span class="a">' + (idx + 1) + '</span> / <span class="b"></span></div>';
    }
    var top = first ? g.top1 : g.top, ruleTop = first ? g.rule1 : g.rule;
    return '<div class="sheet" style="width:' + mm(g.w) + ";height:" + mm(g.h) + ";" + vars + '">' + head +
      '<div class="sh-cols" style="left:' + mm(g.mx) + ";right:" + mm(g.mx) + ";top:" + mm(top) + ";bottom:" + mm(g.bottom) + '"><div class="sh-col" style="width:' + mm(g.colW) + '"></div><div class="sh-rule" style="margin-top:-' + mm(top - ruleTop) + '"></div><div class="sh-col" style="width:' + mm(g.colW) + '"></div></div>' + foot + "</div>";
  }

  /* ---------- 조각(block) 만들기 ---------- */
  function imgBlock(o, cls, mmPerPx) {
    var ys = [0].concat(cuts(o), [o.h]), wmm = Math.round(o.w * mmPerPx * 10) / 10;
    return { t: "text", tok: ys.slice(1), make: function (i, j) {
      var y0 = ys[i], y1 = ys[j];
      return '<div class="pimg ' + (cls || "") + '" style="width:min(100%,' + wmm + "mm);aspect-ratio:" + o.w + "/" + Math.max(1, y1 - y0) + '"><img src="' + esc(o.src) + '" alt="" style="margin-top:-' + (y0 / o.w * 100).toFixed(3) + '%"></div>';
    } };
  }
  function wholeImg(o, mmPerPx) { var wmm = Math.round(o.w * mmPerPx * 10) / 10; return '<div class="pimg qfg" style="width:min(100%,' + wmm + "mm);aspect-ratio:" + o.w + "/" + o.h + '"><img src="' + esc(o.src) + '" alt=""></div>'; }
  function choiceCols(ch, g) { var cpl = (g.colW - 2) / (g.pt * 0.3528 * 1.02), mx = Math.max.apply(null, ch.map(function (c) { return Array.from(c).length; })); if (mx + 2.2 <= cpl / 5) return 5; if (mx + 2.2 <= cpl / 2) return 2; return 1; }
  function rangeLabel(ns) { ns = ns.slice().sort(function (a, b) { return a - b; }); if (ns.length < 2) return String(ns[0]); return ns[ns.length - 1] - ns[0] === ns.length - 1 ? ns[0] + "~" + ns[ns.length - 1] : ns.join(", "); }
  function isPoem(t) { var L = t.split("\n").filter(function (x) { return x.trim(); }); if (L.length < 6) return false; var s = 0; L.forEach(function (x) { s += x.length; }); return s / L.length < 26; }

  function build(A, g) {
    var items = A.items || [], P = [], B = [];
    /* 같은 지문 묶음: 열쇠 = 글 지문(pk 또는 지문 글) · 그림 지문(첫 그림 주소) · 공무원(회차+지문 차례) */
    var need = [];
    items.forEach(function (it, n) {
      var o = { it: it, n: n + 1, key: "", pimgs: [], qimgs: [], gmNote: "" }; P.push(o);
      if (it.txt && it.txt.pk) o.key = "t|" + it.txt.pk;
      if (it.p && it.p.imgs && it.p.imgs.length) { o.key = "p|" + it.p.imgs[0].s; it.p.imgs.forEach(function (p) { need.push(loadImg(p.s).then(function (r) { o.pimgs.push(r); })); }); }
      (it.q || []).forEach(function (p, i) { need.push(loadImg(p.s).then(function (r) { o.qimgs[i] = r; })); });
      if (it.gm) need.push(gmQ(it.gm.e).then(function (d) {
        if (!d || !d.q) { o.gmNote = "이 문항은 시험지 쪽 그림으로만 있어요. 화면에서 ‘시험지에서 보기’로 확인하세요."; return null; }
        var q = d.q.filter(function (x) { return x.n === it.gm.n; })[0], jobs = [];
        (d.p || []).forEach(function (p, i) { if (p.rng[0] <= it.gm.n && it.gm.n <= p.rng[1]) { o.key = "g|" + it.gm.e + "|" + i; jobs.push(loadImg(p.img).then(function (r) { r.dpi = 150; o.pimgs.push(r); })); } });
        if (q) jobs.push(loadImg(q.img).then(function (r) { r.dpi = 150; o.qimgs[0] = r; })); else o.gmNote = "문항 그림을 찾지 못했어요.";
        return Promise.all(jobs);
      }));
    });
    return Promise.all(need).then(function () {
      var groups = {}, shown = {}, hk = "", hx = "";
      /* 옛 과제(지문 묶음 열쇠가 없는 수능 문항): 지문이 붙은 문항 뒤에 같은 시험·영역(독서·문학)의 문항이 이어지면 같은 묶음으로 본다 */
      P.forEach(function (o) {
        var it = o.it, m = /^sn:([^|]+)\|\|([^|]+)\|\|/.exec(it.k || "");
        if (o.key) { hk = ""; return; }
        if (it.txt && it.txt.pas) { hk = "h|" + o.n; hx = m ? m[1] + "|" + m[2] : ""; o.key = hk; return; }
        if (hk && m && m[1] + "|" + m[2] === hx && /독서|문학|공통/.test(m[2])) o.key = hk; else hk = "";
      });
      P.forEach(function (o) { if (o.key) (groups[o.key] = groups[o.key] || []).push(o.n); });
      P.forEach(function (o) {
        var it = o.it, t = it.txt, pas = t && t.pas ? String(t.pas) : "", gk = o.key || (pas ? "x|" + o.n : "");
        var hasPas = (pas || o.pimgs.length) && !(gk && shown[gk]);
        if (hasPas) {
          if (gk) shown[gk] = 1;
          var ns = groups[o.key] || [o.n];
          B.push({ t: "head", html: '<div class="gh"><span class="rg">[' + (ns.length > 1 || o.key ? rangeLabel(ns) : o.n) + "]</span>다음 글을 읽고 물음에 답하시오.</div>" });
          o.pimgs.forEach(function (r) { if (r.ok) B.push(imgBlock(r, "pfg", r.dpi ? 25.4 / r.dpi : 0.127)); });
          if (pas) {
            if (isPoem(pas)) { var L = pas.replace(/^\n+|\s+$/g, "").split("\n"); B.push({ t: "text", tok: L, box: gk, make: function (i, j) { return '<div class="poem">' + esc(L.slice(i, j).join("\n")) + "</div>"; } }); }
            else pas.trim().split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) {
              var head = /^\((가|나|다|라|마)\)$|^\[[A-Z]\]$|^<[^>]+>$|^\[(앞부분|중략|뒷부분)/.test(x) || x.length < 8, tok = x.split(" ");
              B.push({ t: "text", tok: tok, box: gk, make: function (i, j, cont, brk) { return '<div class="pp' + (head ? " ph" : "") + (cont ? " cont" : "") + (brk ? " brk" : "") + '">' + esc(tok.slice(i, j).join(" ")) + "</div>"; } });
            });
          }
        }
        /* 문항: 통째로 한 단에 */
        var h = "";
        if (t && t.ask) {
          h += '<div class="qs"><span class="qn">' + o.n + ".</span>" + esc(t.ask) + "</div>";
          o.qimgs.forEach(function (r) { if (r && r.ok) h += wholeImg(r, 0.127); });
          if (t.body) {
            var m = /^<\s*([^<>]{1,12}?)\s*>\s*/.exec(t.body), lab = m ? m[1].replace(/\s+/g, "") : "", body = m ? t.body.slice(m[0].length) : t.body;
            h += '<div class="qb' + (lab ? " lab" : "") + '">' + (lab ? '<div class="qbl">&lt;' + esc(lab.length <= 2 ? Array.from(lab).join(" ") : lab) + "&gt;</div>" : "") + '<div class="qbt">' + esc(body) + "</div></div>";
          }
          var ch = (t.ch || []).filter(Boolean);
          if (it.nc && ch.length === it.nc) h += '<div class="qc" style="grid-template-columns:repeat(' + choiceCols(ch, g) + ',minmax(0,1fr))">' + ch.map(function (c, i) { return "<div>" + CIR[i] + " " + esc(c) + "</div>"; }).join("") + "</div>";
          else if (!it.nc) h += '<div class="wr"></div>';
        } else {
          h += '<div class="qh2"><b>' + o.n + ".</b><span>" + esc(it.title || "") + "</span></div>";
          o.qimgs.forEach(function (r) { if (r && r.ok) h += wholeImg(r, r.dpi ? 25.4 / r.dpi : 0.127); });
          if (o.gmNote) h += '<div class="qna">※ ' + esc(o.gmNote) + "</div>";
          if (!o.qimgs.length && !o.gmNote) h += '<div class="qna">※ 이 문항은 인쇄할 그림이 없어요. 화면에서 확인하세요.</div>';
        }
        B.push({ t: "unit", html: '<div class="q">' + h + "</div>" });
      });
      var obj = P.filter(function (o) { return o.it.nc; });
      if (obj.length) B.push({ t: "unit", html: '<div class="ansg"><b>답 적는 곳 — 사이트에 답을 넣을 때 보고 옮기세요</b><div class="g">' + obj.map(function (o) { return "<span><i>" + o.n + "</i></span>"; }).join("") + "</div></div>" });
      return B;
    });
  }

  /* ---------- 쪽·단에 놓기 ---------- */
  function layout(area, A, g, B, info) {
    area.innerHTML = ""; area.style.setProperty("--pf", g.pt + "pt");
    var sheets = [], cols, cur, forced = 0;
    function newSheet() { var sh = el(sheetHtml(sheets.length, g, A, info)); area.appendChild(sh); sheets.push(sh); cols = sh.querySelectorAll(".sh-col"); cur = cols[0]; }
    function nextCol() { if (cur === cols[0]) cur = cols[1]; else newSheet(); }
    function used() { var l = cur.lastElementChild; return l ? l.getBoundingClientRect().bottom - cur.getBoundingClientRect().top : 0; }
    function cap() { return cur.getBoundingClientRect().height - 1; }
    function over() { return used() > cap(); }
    function put(node, box) {
      if (!box) { cur.appendChild(node); return function () { cur.removeChild(node); }; }
      var f = cur.lastElementChild;
      if (!(f && f.classList.contains("pbox") && f.dataset.g === box)) { f = el('<div class="pbox"></div>'); f.dataset.g = box; cur.appendChild(f); }
      f.appendChild(node);
      return function () { f.removeChild(node); if (!f.children.length) f.remove(); };
    }
    function tryPut(node, box) { var undo = put(node, box); if (!over()) return true; undo(); return false; }
    var lineH = g.pt * 1.6 * 96 / 72;
    function placeText(b) {
      var i = 0, cont = false, n = b.tok.length, guard = 0;
      while (i < n && guard++ < 400) {
        if (tryPut(el(b.make(i, n, cont, false)), b.box)) return;
        var lo = i + 1, hi = n - 1, best = -1;
        while (lo <= hi) { var mid = (lo + hi) >> 1, undo = put(el(b.make(i, mid, cont, true)), b.box), ok = !over(); undo(); if (ok) { best = mid; lo = mid + 1; } else hi = mid - 1; }
        if (best > i) { put(el(b.make(i, best, cont, true)), b.box); i = best; cont = true; nextCol(); }
        else if (!cur.lastElementChild) { put(el(b.make(i, i + 1, cont, true)), b.box); i++; cont = true; forced++; nextCol(); }
        else nextCol();
      }
    }
    function place(b) {
      if (b.t === "text") return placeText(b);
      if (b.t === "head") { var node = el(b.html); cur.appendChild(node); if (over() || used() + lineH * 4 > cap()) { cur.removeChild(node); if (cur.lastElementChild) nextCol(); cur.appendChild(el(b.html)); } return; }
      if (tryPut(el(b.html))) return;
      if (cur.lastElementChild) { nextCol(); if (tryPut(el(b.html))) return; }
      /* 한 단보다 긴 문항: 쪼개지 않고 그 단에 들어가게 줄인다 */
      var nd = el(b.html); cur.appendChild(nd);
      var byW = !!nd.querySelector(".pimg"), z = Math.max(0.4, (cap() - 2) / nd.getBoundingClientRect().height * 0.985);
      /* 그림 문항은 너비를 줄이면 높이도 같이 줄고, 글 문항은 통째로 축소한다 */
      var shrink = function () { if (byW) { nd.style.width = (z * 100).toFixed(1) + "%"; nd.style.marginLeft = nd.style.marginRight = "auto"; } else nd.style.zoom = z; };
      nd.classList.add("fit"); shrink();
      for (var k = 0; k < 14 && over() && z > 0.4; k++) { z *= 0.97; shrink(); }
      if (over()) forced++;
      nextCol();
    }
    newSheet(); B.forEach(place);
    while (sheets.length > 1 && !sheets[sheets.length - 1].querySelector(".sh-col > *")) sheets.pop().remove();
    return { pages: sheets.length, forced: forced, sheets: sheets };
  }
  function keySheet(A, g, key) {
    var rows = (A.items || []).map(function (it, i) { return "<tr><td>" + (i + 1) + "</td><td>" + (it.nc ? (key[it.k] ? CIR[key[it.k] - 1] : "–") : "서술형") + '</td><td class="l">' + esc(it.title || "") + "</td></tr>"; });
    var half = Math.ceil(rows.length / 2), tbl = function (r) { return "<table><thead><tr><th>번호</th><th>정답</th><th>출처</th></tr></thead><tbody>" + r.join("") + "</tbody></table>"; };
    return '<div class="sheet kp-key" style="width:' + mm(g.w) + ";height:" + mm(g.h) + '"><div class="sh-key" style="left:14mm;right:14mm;top:16mm"><h3>정답표 · ' + esc(A.title) + '</h3><div class="kc">' + tbl(rows.slice(0, half)) + (rows.length > half ? tbl(rows.slice(half)) : "") + "</div></div></div>";
  }

  /* ---------- 미리 보기 창 ---------- */
  var root = null, prevOverflow = "";
  function close() { if (!root) return; root.remove(); root = null; document.documentElement.style.overflow = prevOverflow; window.removeEventListener("resize", fit); }
  function fit() { if (!root) return; var pg = root.querySelector(".kp-pages"); if (pg) pg.style.zoom = Math.min(1, (root.clientWidth - 20) / (210 * PXMM)); }
  function open(A, opt) {
    opt = opt || {}; close();
    if (!document.getElementById("kp-css")) { var st = document.createElement("style"); st.id = "kp-css"; st.textContent = SHEET_CSS + "\n" + EXTRA; document.head.appendChild(st); }
    if (!document.getElementById("kp-font") && !/Noto\+Serif\+KR/.test(document.head.innerHTML)) { var lk = document.createElement("link"); lk.id = "kp-font"; lk.rel = "stylesheet"; lk.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&family=Noto+Serif+KR:wght@400;600;700&display=swap"; document.head.appendChild(lk); }
    var items = A.items || [], sn = items.length > 0 && items.every(function (it) { return /^sn:/.test(it.k) && it.txt && it.txt.ask; }), g = geom(sn), key = opt.key || null;
    var info = items.length + "문항" + (A.mode === "exam" && A.min ? " · 모의고사 " + A.min + "분" : "") + (A.due ? " · 마감 " + A.due : "");
    root = document.createElement("div"); root.className = "kma kp-root"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "인쇄 미리 보기");
    root.innerHTML = '<div class="kp-bar"><span><b>' + esc(A.title) + "</b> <small id=\"kpInfo\">" + esc(info) + '</small></span>' +
      (key ? '<label><input type="checkbox" id="kpKey"> 정답표 붙이기</label>' : "") +
      '<button type="button" id="kpGo" disabled>인쇄하기</button><button type="button" class="sub" id="kpX">닫기</button><small style="flex-basis:100%;text-align:center">인쇄 창에서 용지 A4 · 배율 100%(기본값) · 머리글/바닥글 끄기로 맞춰 주세요.</small></div>' +
      '<div class="kp-msg" id="kpMsg">문제지를 만드는 중…</div><div class="kp-pages" id="kpPages" hidden></div>';
    document.body.appendChild(root); prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    root.querySelector("#kpX").onclick = close;
    var area = root.querySelector("#kpPages"), R = null, BL = null;
    function render() {
      area.hidden = false; area.style.zoom = 1;
      R = layout(area, A, g, BL, info);
      R.sheets.forEach(function (sh) { var b = sh.querySelector(".b"); if (b) b.textContent = R.pages; });
      var kk = root.querySelector("#kpKey"); if (key && kk && kk.checked) area.appendChild(el(keySheet(A, g, key)));
      root.querySelector("#kpInfo").textContent = info + " · " + R.pages + "쪽" + (sn ? " · 수능 문제지 양식" : "");
      root.querySelector("#kpMsg").hidden = true; root.querySelector("#kpGo").disabled = false; fit();
    }
    var fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
    build(A, g).then(function (B) { BL = B; return fonts; }).then(function () {
      if (!root) return; render();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (root && R) { var y = root.scrollTop; render(); root.scrollTop = y; } });
    }).catch(function () { var m = root && root.querySelector("#kpMsg"); if (m) m.textContent = "문제지를 만들지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요."; });
    var kk = root.querySelector("#kpKey"); if (kk) kk.onchange = function () { if (BL) render(); };
    root.querySelector("#kpGo").onclick = function () {
      var imgs = Array.prototype.slice.call(area.querySelectorAll("img"));
      var all = Promise.all(imgs.map(function (i) { return i.complete && i.naturalWidth ? null : new Promise(function (res) { i.addEventListener("load", res, { once: true }); i.addEventListener("error", res, { once: true }); }); }));
      Promise.race([all, new Promise(function (r) { setTimeout(r, 8000); })]).then(function () { try { window.print(); } catch (e) {} });
    };
    window.addEventListener("resize", fit);
  }
  window.KMAPrint = { open: open, close: close };
})();
