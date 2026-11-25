/* 국어의 모든 것 — 과제·모의고사 인쇄(미리 보기) v107 (2026-11-11)
 * 쓰는 곳: account.js(학생 과제 화면의 '인쇄'), teacher.html(과제 카드의 '인쇄')
 *   KMAPrint.open(과제, {key:{문항키:정답}})  — key 를 주면(선생님) '정답표'를 붙일 수 있다
 * 배치: A4, 2단. 쪽·단을 직접 계산해 놓는다(미리 보기 = 인쇄).
 *  · 문항(발문+선택지)은 쪼개지 않는다. 남은 칸에 안 들어가면 다음 단으로, 한 단보다 길면 그 단에 들어가게 줄인다.
 *  · 지문(글·그림)은 줄 사이 흰 곳에서 끊어 다음 단·쪽으로 이어 싣는다.
 *  · 수능 문항만 있는 과제는 수능 문제지 양식(suneung.html 시험지와 같은 값), 그 밖은 넓은 2단.
 * v147(2026-11-25): PSAT 언어논리 문항도 글자로 옮긴 자료(/advanced-korean/tx/psat/<회차>.json)가 있으면 글자로 — 수능 문제지 양식·한 글꼴. 지문은 상자 안 글자, 글자로 못 옮긴 것은 원래 번호를 지운 그림.
 * v145(2026-11-25): 글꼴 하나 — 본문은 KMA Serif(본명조), 고딕·머리글은 KMA Sans(본고딕). 사이트에 올린 글꼴 조각만 쓰고, 문제지에 쓰일 글자가 든 조각을 다 받은 뒤 짠다(컴퓨터마다 다른 글꼴로 찍히지 않음).
 * v144(2026-11-24): 공무원 문항을 글자로 옮긴 자료(gm/t)가 있으면 글자로 찍는다 — 수능 문제지 양식, 번호는 1번부터. 글자로 못 옮긴 문항은 원래 번호를 지운 그림 위에 새 번호.
 * v143(2026-11-24): 공무원 지문 그림 — 단·쪽에서 끊긴 조각은 끊긴 쪽에 상자 가로선을 그어 닫고, 그림 맨 위의 원래 머리말(※ 다음 글을 읽고…[문7~문9])은 뗀다(gm/phd.json).
 */
(function () {
  if (window.KMAPrint) return;
  var SHEET_CSS = "\n.sheet{position:relative;box-sizing:border-box;background:#fff;color:#000;overflow:hidden;\n  font-family:\"KMA Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;font-size:var(--pf,10pt);line-height:1.6;\n  letter-spacing:-.04em;word-break:keep-all;overflow-wrap:anywhere;-webkit-print-color-adjust:exact;print-color-adjust:exact}\n.sheet *{box-sizing:border-box}\n.sheet .hf{font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-weight:800;font-synthesis:none;letter-spacing:0;line-height:1}\n.sheet .pnum{font-family:\"KMA Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;font-weight:700;letter-spacing:0;line-height:1}\n.sh-hd{position:absolute;border-bottom:var(--rw) solid #000}\n.sh-hd .hf{position:absolute;left:0;right:0;bottom:var(--hb);text-align:center}\n.sh-hd .pnum{position:absolute;bottom:var(--pb)}\n.sh-hd.odd .pnum{right:0} .sh-hd.even .pnum{left:0}\n.sh-hd1{position:absolute;border-bottom:var(--rw) solid #000}\n.sh-hd1 .t-s{position:absolute;left:0;right:0;text-align:center;font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-weight:500;letter-spacing:-.02em;line-height:1}\n.sh-hd1 .pnum{position:absolute;right:0}\n.sh-hd1 .gyosi{position:absolute;left:0;display:flex;align-items:center;justify-content:center;border:var(--tw) solid #000;border-radius:999px;\n  font-family:\"KMA Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;font-weight:700;letter-spacing:0;line-height:1;white-space:nowrap}\n.sh-hd1 .gyosi b{font-family:\"KMA Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;margin:0 .18em}\n.sh-hd1 .hf{position:absolute;left:0;right:0;text-align:center}\n.sh-cols{position:absolute;display:flex}\n.sh-col{position:relative;flex:none;height:100%;overflow:hidden}\n.sh-rule{flex:none;width:0;border-left:var(--cw) solid #000;margin:0 auto}\n.sh-col > :first-child{margin-top:0!important}\n.sh-ft{position:absolute;border:var(--tw) solid #000;font-family:\"KMA Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;letter-spacing:0;line-height:1;\n  background:linear-gradient(to bottom right,transparent calc(50% - var(--tw)/2),#000 calc(50% - var(--tw)/2),#000 calc(50% + var(--tw)/2),transparent calc(50% + var(--tw)/2))}\n.sh-ft .a{position:absolute;left:.18em;top:.08em}\n.sh-ft .b{position:absolute;right:.18em;bottom:.06em}\n.gh{margin-top:2.2em;text-align:justify;font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-weight:500;letter-spacing:-.02em}\n.gh .rg{margin-right:.25em;letter-spacing:0}\n.src{font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-size:.74em;color:#555;font-weight:400;letter-spacing:0}\n.gh + .pbox, .gh + .pimg{margin-top:.45em}\n.pbox{border:var(--tw) solid #000;padding:.3em .5em .35em}\n.pbox + .pbox{margin-top:0}\n.pbox > :first-child{margin-top:0!important}\n.pbox.ot{border-top:0}\n.pbox.ob{border-bottom:0}\n.pp{text-align:justify;text-indent:.6em}\n.pp.cont{text-indent:0}\n.pp.pbrk{text-align-last:justify}\n.pp.ph{text-indent:0;font-weight:600}\n.poem{white-space:pre-wrap;text-indent:0;text-align:left}\n.pnote{font-size:.84em;line-height:1.5;text-indent:0;margin-top:.12em;padding-left:.8em}\n.pp + .pnote, .poem + .pnote{margin-top:.5em}\n.q{margin-top:2.4em}\n.pbox + .q, .pimg + .q, .pnote + .q{margin-top:1.9em}\n.qs{text-align:justify;padding-left:1.5em;text-indent:-1.5em}\n.qs .qn{font-family:\"KMA Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;font-weight:700;font-size:1.13em;display:inline-block;min-width:1.33em;text-indent:0;letter-spacing:0}\n.qb{position:relative;border:var(--tw) solid #000;padding:.35em .55em .4em;margin:.6em 0 .35em}\n.qb.lab{margin-top:1.1em;padding-top:.75em}\n.qb.cont{border-top-style:dashed;margin-top:0;padding-top:.35em}\n.qb.pbrk{border-bottom-style:dashed;margin-bottom:0}\n.qbl{position:absolute;left:50%;top:0;transform:translate(-50%,-52%);background:#fff;padding:0 .45em;white-space:nowrap;letter-spacing:0;line-height:1.2}\n.qbt{white-space:pre-wrap;text-align:justify}.qb.par .qbt{white-space:normal}.qbt .pp.ni{text-indent:0}.qfree{margin:.35em 0 .1em;text-align:justify}\n.qc{display:grid;gap:0 1.2em;margin-top:.7em;padding-left:.3em}\n.qc > div{padding-left:1.25em;text-indent:-1.25em}\n.qna{margin-top:.35em;font-size:.88em;color:#444}\n.qt{display:grid;gap:0 .8em;margin-top:.7em;padding-left:.3em;text-align:center}\n.qt .qtn{text-align:left}\n.qt.tl{text-align:left}\n.q.part{margin-top:.25em}\n.pimg{position:relative;overflow:hidden;margin:.35em auto 0;break-inside:avoid;container-type:inline-size}\n.pimg .bxl{position:absolute;background:#000}\n.pimg.pbx{width:100%;padding:0 .5em;border-left:var(--tw) solid #000;border-right:var(--tw) solid #000}\n.pimg.pbx.bt{padding-top:.3em;border-top:var(--tw) solid #000}\n.pimg.pbx.bb{padding-bottom:.35em;border-bottom:var(--tw) solid #000}\n.pbx .pbi{position:relative;overflow:hidden}\n.pbx .pbi img{display:block}\n.pimg img{display:block;width:100%;height:auto}\n.pimg + .pimg{margin-top:0}\n.qs + .pimg{margin-top:.45em}\n.chk{position:absolute;left:0;right:0;bottom:0;border:var(--tw) solid #000;padding:.5em .7em;font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-size:.86em;line-height:1.5;letter-spacing:-.02em}\n.chk b{display:block;margin-bottom:.2em}\n.chk p{margin:0;padding-left:.9em;text-indent:-.9em}\n.sh-key{position:absolute;font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-size:9.5pt;line-height:1.35;letter-spacing:0}\n.sh-key h3{margin:0 0 3mm;font-size:13pt;text-align:center}\n.sh-key .kc{display:flex;gap:6mm;align-items:flex-start}\n.sh-key table{flex:1;border-collapse:collapse}\n.sh-key th,.sh-key td{border:.25mm solid #333;padding:1mm 1.5mm;text-align:center}\n.sh-key th{background:#eee;font-weight:700}\n.sh-key td.l{text-align:left;font-size:.88em}\n.sheet u.ul{text-decoration:underline;text-decoration-thickness:.2mm;text-underline-offset:.22em;text-decoration-skip-ink:none}\n.sheet .bx{border:.2mm solid #000;padding:0 .15em;margin:0 .05em;-webkit-box-decoration-break:clone;box-decoration-break:clone}\n";
  var CIR = "①②③④⑤", PXMM = 96 / 25.4;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* v125: 수능 글의 밑줄·글자 상자 — account.js의 KMA.em(없으면 표시 글자만 뺀다) */
  function em(s) { return window.KMA && KMA.em ? KMA.em(s) : esc(String(s == null ? "" : s).replace(/[\uFDD0-\uFDD7]/g, "")); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function mm(v) { return (Math.round(v * 100) / 100) + "mm"; }
  var EXTRA = [
    ".sheet{text-justify:inter-word}",   /* v147: 양쪽 맞춤에서 한자 앞뒤가 벌어지지 않게 */
    ".sheet img.inl{display:inline!important;width:auto!important;max-width:none!important;height:.92em!important;vertical-align:-.1em;margin:0 .06em;border:0!important;box-shadow:none!important;background:none!important}.sheet .gt{font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-weight:500}.sheet b.bd{font-weight:700}.sheet u.ul{text-decoration:underline;text-decoration-thickness:.2mm;text-underline-offset:.22em;text-decoration-skip-ink:none}.sheet .bx{border:.2mm solid #000;padding:0 .15em;margin:0 .05em;-webkit-box-decoration-break:clone;box-decoration-break:clone}",   /* v125: 밑줄·글자 상자 */
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
    ".pl-hd1{position:absolute;border-bottom:var(--rw) solid #000;font-family:'KMA Sans','Noto Sans KR','Noto Sans CJK KR',sans-serif;letter-spacing:-.02em;line-height:1.2}",
    ".pl-hd1 .t{position:absolute;left:0;bottom:2.2mm;font-size:15pt;font-weight:700}.pl-hd1 .s{position:absolute;left:0;top:0;font-size:8.5pt;color:#444}",
    ".pl-hd1 .nm{position:absolute;right:0;bottom:2.4mm;font-size:10pt;display:flex;gap:5mm}.pl-hd1 .nm i{font-style:normal;display:inline-block;border-bottom:.2mm solid #000;margin-left:1.5mm;vertical-align:bottom}",
    ".pl-hd{position:absolute;border-bottom:var(--rw) solid #000;font-family:'KMA Sans','Noto Sans KR','Noto Sans CJK KR',sans-serif;font-size:8.5pt;color:#333;display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:1.2mm;letter-spacing:-.02em;line-height:1}",
    ".pl-ft{position:absolute;left:0;right:0;text-align:center;font-family:'KMA Serif','Noto Serif KR','Noto Serif CJK KR',serif;font-size:9pt;letter-spacing:0;line-height:1}",
    /* 과제 문항 머리(번호 + 출처) */
    ".qh2{font-family:'KMA Sans','Noto Sans KR','Noto Sans CJK KR',sans-serif;font-size:.82em;color:#333;letter-spacing:-.02em;line-height:1.3;margin-bottom:.25em;display:flex;gap:.5em;align-items:baseline}",
    ".qh2 b{font-family:'KMA Serif','Noto Serif KR','Noto Serif CJK KR',serif;font-size:1.5em;color:#000;letter-spacing:0}",
    ".q .pimg{margin-top:.2em}.q.fit{transform-origin:top left}",
    ".gmimg .pimg{margin:0}.advimg .advn{padding:0 .05em 0 .1em;white-space:nowrap}.gmimg .gmn{position:absolute;font-family:'KMA Serif','Noto Serif KR','Noto Serif CJK KR',serif;font-weight:700;font-size:1.13em;line-height:1;background:#fff;letter-spacing:0}",
    ".wr{margin-top:.6em;border:var(--tw) solid #000;height:22mm;position:relative}.wr:before{content:'답';position:absolute;left:1.2mm;top:.6mm;font-size:.8em;color:#555}",
    ".ansg{margin-top:2em;border:var(--tw) solid #000;padding:.5em .6em .6em;font-family:'KMA Sans','Noto Sans KR','Noto Sans CJK KR',sans-serif;font-size:.86em;letter-spacing:0;line-height:1.3}",
    ".ansg b{display:block;margin-bottom:.4em}.ansg .g{display:grid;grid-template-columns:repeat(5,1fr);border-top:.2mm solid #000;border-left:.2mm solid #000}",
    ".ansg .g span{border-right:.2mm solid #000;border-bottom:.2mm solid #000;height:7mm;display:flex;align-items:center;padding-left:1.2mm}.ansg .g i{font-style:normal;font-family:'KMA Serif','Noto Serif KR','Noto Serif CJK KR',serif;font-weight:700;width:1.6em}",
    "@media print{html,body{overflow:visible!important;height:auto!important;min-height:0!important;background:#fff!important;margin:0!important;padding:0!important}",
    "body>*:not(.kp-root){display:none!important}.kp-root{position:static!important;background:#fff!important;overflow:visible!important}.kp-bar,.kp-msg{display:none!important}",
    ".kp-pages{zoom:1!important;padding:0!important}.kp-pages .sheet{margin:0!important;box-shadow:none!important;break-after:page;page-break-after:always}.kp-pages .sheet:last-child{break-after:auto;page-break-after:auto}",
    "@page{size:210mm 297mm;margin:0}}"
  ].join("\n");

  /* ---------- 자료 불러오기 ---------- */
  var IMG = {}, GMQ = {}, CUT = {}, GMT = "/advanced-korean/gm/t/", TXB = "/advanced-korean/tx/";
  /* v147: PSAT 문항 열쇠 adv:psat:PS2025A-07 → {회차, 번호, 묶음(지문 그림 이름의 19-20)} */
  function txOf(it) { var m = /^adv:(psat|leet):((?:PS|LEET)\d{4}[A-Z])-(\d+)$/.exec(it && it.k || ""); if (!m) return null; var p = it.p && it.p.imgs && it.p.imgs[0], s = p && /-p(\d+-\d+)\.webp/.exec(p.s || ""); return { kind: m[1], e: m[2], n: +m[3], set: s ? s[1] : "" }; }
  function loadImg(src) {
    return IMG[src] || (IMG[src] = new Promise(function (res) { var im = new Image(); im.onload = function () { res({ ok: true, src: src, w: im.naturalWidth, h: im.naturalHeight, im: im }); }; im.onerror = function () { res({ ok: false, src: src, w: 760, h: 200 }); }; im.src = src; }));
  }
  /* v121: 받지 못하면 다시 받는다(KMA.gmExam — 3번까지). 실패는 기억하지 않는다 */
  function gmQ(e) { if (window.KMA && KMA.gmExam) return KMA.gmExam(e);
    return GMQ[e] || (GMQ[e] = fetch("/advanced-korean/gm/q/" + e + ".json?v=143").then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { delete GMQ[e]; return null; })); }
  /* v143: 공무원 지문 그림 맨 위의 원래 머리말(※ 다음 글을 읽고…[문7~문9]) 높이 — 시험지에는 새 번호의 머리말을 따로 찍으므로 그림에서는 뗀다 */
  var PHD = null;
  function gmHd() { return PHD || (PHD = fetch("/advanced-korean/gm/phd.json?v=143").then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { PHD = null; return {}; })); }
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
      /* v148: 상자 옆선 같은 긴 세로줄 — 전체의 절반을 넘거나, 한 번에 이어진 길이가 그림 높이의 35%를 넘는 세로줄 */
      var lrun = new Uint32Array(w); for (i = 0; i < w; i++) { var cr = 0, gp = 0; for (j = 0; j < h; j++) { if (dark[j * w + i]) { cr += 1 + gp; gp = 0; } else if (cr && gp < 2) gp++; else { cr = 0; gp = 0; } if (cr > lrun[i]) lrun[i] = cr; } }
      var skip = new Uint8Array(w); for (i = 0; i < w; i++) if (col[i] > h * 0.5 || lrun[i] > h * 0.35) { skip[i] = 1; if (i) skip[i - 1] = 1; if (i + 1 < w) skip[i + 1] = 1; }
      var run = 0;
      for (j = 0; j <= h; j++) {
        var blank = false;
        if (j < h) { var n = 0; for (i = 0; i < w; i++) if (dark[j * w + i] && !skip[i]) n++; blank = n === 0; }
        if (blank) run++; else { if (run >= 2 && j - run > 4 && j < h - 4) out.push(Math.round((j - run / 2) / k)); run = 0; }
      }
      /* v143: 끊는 자리를 상자 옆선이 지나가면(상자 안에서 끊김) 그 자리의 상자 왼쪽·오른쪽 끝과 선 두께를 적어 둔다 → 끊긴 조각마다 위·아래 선을 그어 상자를 닫는다 */
      var bx = {};
      out.forEach(function (Y) {
        var jj = Math.min(h - 1, Math.round(Y * k)), xs = [];
        for (i = 0; i < w; i++) if (skip[i] && (dark[jj * w + i] || (jj > 0 && dark[(jj - 1) * w + i]) || (jj + 1 < h && dark[(jj + 1) * w + i]))) xs.push(i);
        if (xs.length < 2 || xs[xs.length - 1] - xs[0] < w * 0.6) return;
        var f = document.createElement("canvas"); f.width = o.w; f.height = 1; var fx = f.getContext("2d", { willReadFrequently: true });
        fx.fillStyle = "#fff"; fx.fillRect(0, 0, o.w, 1); fx.drawImage(o.im, 0, Y, o.w, 1, 0, 0, o.w, 1);
        var fd = fx.getImageData(0, 0, o.w, 1).data, isD = function (x) { return x >= 0 && x < o.w && fd[x * 4] + fd[x * 4 + 1] + fd[x * 4 + 2] < 560; };
        var side = function (c) { var x0 = Math.round(c / k), a = -1, b = -1, x; for (x = x0 - 4; x <= x0 + 4; x++) if (isD(x)) { if (a < 0) a = x; b = x; } return a < 0 ? null : [a, b]; };
        var L = side(xs[0]), R = side(xs[xs.length - 1]);
        if (L && R) bx[Y] = { l: L[0], r: R[1] + 1, t: Math.max(1, Math.min(4, Math.round(((L[1] - L[0] + 1) + (R[1] - R[0] + 1)) / 2))) };
      });
      out.bx = bx;
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
  /* v148c(선생님 지시: 모든 출력의 양식은 같아야 한다): 지문 그림 안의 바깥 상자(원본 시험지의 선)를 찾는다 →
     그림의 선은 잘라 내고, 글 지문과 같은 테두리(.pbx, --tw 굵기의 검은 선)와 같은 안쪽 여백으로 다시 두른다.
     상자 밖에 글이 있는 그림(표 + 상자 등)은 그대로 둔다. 돌려주는 값: {x0,x1,y0,y1(잘라 보일 안쪽), tx0,tx1,ty0,ty1(글 자리)} */
  var BOXQ = {};
  function boxOf(o, hd) {
    var key = o.src + "|" + hd; if (key in BOXQ) return BOXQ[key];
    var res = null;
    try {
      var W = o.w, H = o.h, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d", { willReadFrequently: true });
      x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.drawImage(o.im, 0, 0);
      var d = x.getImageData(0, 0, W, H).data, dk = function (xx, yy) { var p = (yy * W + xx) * 4; return d[p] + d[p + 1] + d[p + 2] < 560; };
      var need = (H - hd) * 0.5;
      var run = function (xx) { var best = [0, 0, 0], cr = 0, st = 0, gp = 0; for (var yy = hd; yy < H; yy++) { if (dk(xx, yy)) { if (!cr) st = yy; cr += 1 + gp; gp = 0; if (cr > best[0]) best = [cr, st, yy]; } else if (cr && gp < 2) gp++; else { cr = 0; gp = 0; } } return best; };
      var grp = function (from, to, step) { var a = -1, b = -1, r0 = null; for (var xx = from; xx !== to; xx += step) { var r = run(xx); if (r[0] > need) { if (a < 0) { a = xx; r0 = r; } b = xx; } else if (a >= 0) break; } return a < 0 ? null : { a: Math.min(a, b), b: Math.max(a, b), t: r0[1], e: r0[2] }; };
      var L = grp(0, Math.round(W * 0.1), 1), R = grp(W - 1, Math.round(W * 0.9), -1);
      if (!L && !R) {
        /* 상자 없는 지문 그림(PSAT·일부 LEET 원본은 상자가 없음): 글 지문처럼 그림 전체를 같은 테두리로 두른다 */
        var a0 = W, a1 = -1, b0 = -1, b1 = -1, y2, x3;
        for (y2 = hd; y2 < H; y2++) for (x3 = 0; x3 < W; x3++) if (dk(x3, y2)) { if (x3 < a0) a0 = x3; if (x3 > a1) a1 = x3; if (b0 < 0) b0 = y2; b1 = y2; }
        if (a1 > a0 && b1 > b0) res = { ab: 0, T: hd, x0: 0, x1: W, y0: hd, y1: H, tx0: a0, tx1: a1 + 1, ty0: b0, ty1: b1 + 1 };
      }
      else if (L && R && Math.abs(L.t - R.t) < 8 && Math.abs(L.e - R.e) < 8) {
        var rowFull = function (yy) { var best = 0, cr = 0, gp = 0; for (var xx = L.a; xx <= R.b; xx++) { if (dk(xx, yy)) { cr += 1 + gp; gp = 0; if (cr > best) best = cr; } else if (cr && gp < 3) gp++; else { cr = 0; gp = 0; } } return best > (R.b - L.a) * 0.97; };   /* 이름표(<자료 2> 등)가 선 가운데 있는 상자는 그대로 둔다 */
        var T = -1, Tb = -1, B = -1, Bt = -1, yy;
        for (yy = Math.max(hd, Math.min(L.t, R.t) - 3); yy <= Math.min(H - 1, Math.max(L.t, R.t) + 8); yy++) if (rowFull(yy)) { if (T < 0) T = yy; Tb = yy; }
        for (yy = Math.min(H - 1, Math.max(L.e, R.e) + 3); yy >= Math.max(0, Math.min(L.e, R.e) - 8); yy--) if (rowFull(yy)) { if (B < 0) B = yy; Bt = yy; }
        if (T >= 0 && B > T + 20) {
          /* 상자 밖(머리말 아래 ~ 윗선 위, 아랫선 아래, 옆선 바깥)에 글이 있으면 그대로 둔다 */
          var out = 0, xx2;
          /* 윗선 위(머리 글·자료 표 등)는 그대로 그림으로 싣고, 아랫선 아래나 옆선 바깥에 글이 있으면 상자를 바꾸지 않는다 */
          for (yy = T; yy < H && out <= 40; yy++) for (xx2 = 0; xx2 < W; xx2++) { if (!dk(xx2, yy)) continue; if (yy > B || xx2 < L.a || xx2 > R.b) out++; }
          if (out <= 40) {   /* 점 몇 개(티끌)는 무시 */
            var tx0 = W, tx1 = -1, ty0 = -1, ty1 = -1;
            for (yy = Tb + 2; yy < Bt - 1; yy++) for (xx2 = L.b + 2; xx2 < R.a - 1; xx2++) if (dk(xx2, yy)) { if (xx2 < tx0) tx0 = xx2; if (xx2 > tx1) tx1 = xx2; if (ty0 < 0) ty0 = yy; ty1 = yy; }
            var ab = 0; for (yy = hd; yy < T - 2 && !ab; yy++) for (xx2 = 0; xx2 < W; xx2++) if (dk(xx2, yy)) { ab = 1; break; }
            if (tx1 > tx0 && ty1 > ty0) res = { ab: ab, T: T, x0: L.b + 1, x1: R.a, y0: Tb + 1, y1: Bt, tx0: tx0, tx1: tx1 + 1, ty0: ty0, ty1: ty1 + 1 };
          }
        }
      }
    } catch (e) { res = null; }
    return (BOXQ[key] = res);
  }

  /* ---------- 조각(block) 만들기 ---------- */
  function imgBlock(o, cls, mmPerPx, g) {
    var cs = cuts(o), hd = o.hd > 0 && o.hd < o.h - 20 ? o.hd : 0;
    var ys = [hd].concat(cs.filter(function (y) { return y > hd + 4; }), [o.h]), wmm = Math.round(o.w * mmPerPx * 10) / 10;
    var bq = cls === "pfg" && g ? boxOf(o, hd) : null;
    if (bq) {
      /* 글 지문 상자(.pbox)와 같은 안쪽 여백(위 .3em, 옆 .5em, 아래 .35em)은 CSS 로 — 그림은 글 자리만 잘라 싣는다 */
      var X0 = Math.max(0, bq.tx0 - 1), X1 = Math.min(o.w, bq.tx1 + 1), CW = X1 - X0;
      var Y0 = Math.max(hd, bq.ty0 - 1), Y1 = Math.min(o.h, bq.ty1 + 1);
      var TA = bq.ab ? bq.T - 2 : -1;   /* 윗선 위: 머리 글·자료 등은 그림 그대로 */
      return { t: "text", tok: ys.slice(1), make: function (i, j) {
        var a = ys[i], b = ys[j], html = "";
        if (a < TA) { var b0 = Math.min(b, TA); html += '<div class="pimg pfg" style="width:min(100%,' + wmm + "mm);aspect-ratio:" + o.w + "/" + Math.max(1, b0 - a) + '"><img src="' + esc(o.src) + '" alt="" style="margin-top:-' + (a / o.w * 100).toFixed(3) + '%"></div>'; }
        var y0 = Math.max(Y0, a), y1 = Math.min(Y1, b);
        if (y1 > y0 || (b > TA && a < Y1)) {
          var h = Math.max(1, y1 - y0);
          /* v148b: 단·쪽에서 이어지는 상자는 끊긴 쪽을 열어 둔다 — 윗선은 상자가 시작하는 조각에만, 아랫선은 끝나는 조각에만 */
          html += '<div class="pimg pfg pbx' + (a <= Y0 ? " bt" : "") + (b >= Y1 ? " bb" : "") + '"><div class="pbi" style="aspect-ratio:' + CW + "/" + h + '"><img src="' + esc(o.src) + '" alt="" style="width:' + (o.w / CW * 100).toFixed(3) + "%;max-width:none;margin-left:-" + (X0 / CW * 100).toFixed(3) + "%;margin-top:-" + (y0 / CW * 100).toFixed(3) + '%"></div></div>';
        }
        return a < TA && html.indexOf("pbx") > 0 ? '<div class="pimgs">' + html + "</div>" : html;
      } };
    }
    return { t: "text", tok: ys.slice(1), make: function (i, j) {
      var y0 = ys[i], y1 = ys[j];
      /* v148b(선생님 지시): 단·쪽에서 이어지는 지문 상자는 수능 문제지처럼 끊긴 쪽을 열어 둔다(닫는 가로선을 긋지 않음) */
      return '<div class="pimg ' + (cls || "") + '" style="width:min(100%,' + wmm + "mm);aspect-ratio:" + o.w + "/" + Math.max(1, y1 - y0) + '"><img src="' + esc(o.src) + '" alt="" style="margin-top:-' + (y0 / o.w * 100).toFixed(3) + '%"></div>';
    } };
  }
  /* v147: 그림 맨 위 첫 글줄(머리말 '[1~3] 다음 글을…') 아래의 흰 줄 자리 — 떼어 낼 높이 */
  function headCut(r) {
    try {
      var c = document.createElement("canvas"); c.width = r.w; c.height = Math.min(r.h, 200); var x = c.getContext("2d"); x.drawImage(r.im, 0, 0);
      var d = x.getImageData(0, 0, c.width, c.height).data, ink = function (y) { for (var i = 0; i < c.width; i++) { var p = (y * c.width + i) * 4; if (d[p] < 140) return true; } return false; }, y = 0;
      while (y < c.height && !ink(y)) y++; var t0 = y; while (y < c.height && ink(y)) y++;
      if (y - t0 < 8 || y - t0 > 45 || y >= c.height - 4) return 0;
      return y + 3;
    } catch (e) { return 0; }
  }
  /* v147: 원본 문항 그림 맨 위 줄의 문항 번호('3.') 자리 — 첫 글줄에서 첫 낱말(번호) 덩어리의 왼쪽·오른쪽·위·아래 */
  function numBox(r) {
    try {
      var c = document.createElement("canvas"); c.width = r.w; c.height = Math.min(r.h, 160); var x = c.getContext("2d"); x.drawImage(r.im, 0, 0);
      var W = c.width, H = c.height, d = x.getImageData(0, 0, W, H).data, k = function (i, y) { return d[(y * W + i) * 4] < 140; };
      var y = 0, rowInk = function (y) { for (var i = 0; i < W * 0.5; i++) if (k(i, y)) return true; return false; };
      while (y < H && !rowInk(y)) y++; var t0 = y; while (y < H && rowInk(y)) y++; var t1 = y, lh = t1 - t0;
      if (lh < 6 || lh > 60) return null;
      var col = function (i) { for (var yy = t0; yy < t1; yy++) if (k(i, yy)) return true; return false; };
      var i = 0; while (i < W * 0.3 && !col(i)) i++; var x0 = i, x1 = i, gap = 0;
      for (; i < W * 0.3; i++) { if (col(i)) { if (gap >= 0.45 * lh) break; x1 = i; gap = 0; } else gap++; }
      if (x1 - x0 > 3 * lh) return null;
      var xn = i < W * 0.3 ? i : x1 + lh;   /* 번호 다음 낱말이 시작하는 곳 — 그 사이 흰 곳의 반까지 덮는다 */
      return { x0: x0, x1: Math.round(x1 + 1 + (xn - x1 - 1) * 0.5), t0: t0, t1: t1 };
    } catch (e) { return null; }
  }
  function advNum(r, n) {
    var b = numBox(r);
    if (!b) return '<span class="qn gmn advn" style="left:0;top:0">' + n + ".</span>";
    var hm = (b.t1 - b.t0) / r.w;   /* 글줄 높이(그림 너비 비) */
    return '<span class="qn gmn advn" style="right:' + ((1 - b.x1 / r.w) * 100).toFixed(2) + "%;top:calc(100cqw * " + ((b.t0 - 1) / r.w).toFixed(5) + ");min-width:" + ((b.x1 - b.x0 + 2) / r.w * 100).toFixed(2) + "%;font-size:calc(100cqw * " + (hm * 1.25).toFixed(4) + ');text-align:right">' + n + ".</span>";
  }
  function wholeImg(o, mmPerPx) { var wmm = Math.round(o.w * mmPerPx * 10) / 10; return '<div class="pimg qfg" style="width:min(100%,' + wmm + "mm);aspect-ratio:" + o.w + "/" + o.h + '"><img src="' + esc(o.src) + '" alt=""></div>'; }
  function choiceCols(ch, g) { if (ch.some(function (c) { return /\n/.test(c); })) return 1; var cpl = (g.colW - 2) / (g.pt * 0.3528 * 1.02), mx = Math.max.apply(null, ch.map(function (c) { return Array.from(c).length; })); if (mx + 2.2 <= cpl / 5) return 5; if (mx + 2.2 <= cpl / 2) return 2; return 1; }
  function rangeLabel(ns) { ns = ns.slice().sort(function (a, b) { return a - b; }); if (ns.length < 2) return String(ns[0]); return ns[ns.length - 1] - ns[0] === ns.length - 1 ? ns[0] + "~" + ns[ns.length - 1] : ns.join(", "); }
  var NOIND = /^([가-힣A-Za-z]{1,6}(?: [가-힣]{1,4}){0,2}\s*[:：]|[ㄱ-ㅎ]\s*[.．]|[○◦•∙·▪■□◇◆※\-–—]|\([가-하A-Z0-9]\)|[가-하]\s*[.．]|\d+\s*[.．)]|[①-⑳㉠-㉭<〈「\[])/;
  function isPoem(t) { var L = t.split("\n").filter(function (x) { return x.trim(); }); if (L.length < 6) return false; var s = 0; L.forEach(function (x) { s += x.length; }); return s / L.length < 26; }

  function build(A, g) {
    var items = A.items || [], P = [], B = [];
    /* 같은 지문 묶음: 열쇠 = 글 지문(pk 또는 지문 글) · 그림 지문(첫 그림 주소) · 공무원(회차+지문 차례) */
    var need = [];
    items.forEach(function (it, n) {
      var o = { it: it, n: n + 1, key: "", pimgs: [], qimgs: [], gmNote: "" }; P.push(o);
      if (it.txt && it.txt.pk) o.key = "t|" + it.txt.pk;
      /* v147: PSAT 글자 자료 — 문항·지문을 글자로(없는 것은 그 자료의 그림, 그것도 없으면 사이트 원본 그림) */
      var tx = txOf(it), TT = tx && A._txt && A._txt[tx.kind + ":" + tx.e], tq = TT && TT.q && TT.q[String(tx.n)], tp = TT && tx.set && TT.p && TT.p[tx.set], tsc = TT && TT.pt ? g.pt / TT.pt : 1;
      if (tp && (tp.pas || tp.img)) {
        o.key = "x|" + tx.e + "|" + tx.set;
        if (tp.pas) o.gpas = tp.pas;
        else need.push(loadImg(TXB + tx.kind + "/i/" + tp.img[0]).then(function (r) { r.dpi = TT.dpi / tsc; o.pimgs.push(r); }));
      }
      else if (it.p && it.p.imgs && it.p.imgs.length) { o.key = "p|" + it.p.imgs[0].s; it.p.imgs.forEach(function (p) { need.push(loadImg(p.s).then(function (r) { o.pimgs.push(r); })); }); }
      if (tq && tq.ask) { o.gt = tq; if (tq.fig) need.push(loadImg(TXB + tx.kind + "/i/" + tq.fig[0]).then(function (r) { r.mmpp = 25.4 / TT.dpi * tsc; o.qimgs[0] = r; })); }
      else if (tq && tq.img) need.push(loadImg(TXB + tx.kind + "/i/" + tq.img[0]).then(function (r) { r.mmpp = 25.4 / TT.dpi * tsc; r.nx = tq.nx; o.gimg = r; }));
      else (it.q || []).forEach(function (p, i) { need.push(loadImg(p.s).then(function (r) { o.qimgs[i] = r; })); });
      if (it.gm) need.push(gmQ(it.gm.e).then(function (d) {
        if (!d || !d.q) { o.gmNote = "이 문항은 시험지 쪽 그림으로만 있어요. 화면에서 ‘시험지에서 보기’로 확인하세요."; return null; }
        /* v144: 글자로 옮긴 공무원 문항(gm/t) — 글자 크기를 시험지 글자에 맞춘 배율 */
        var T = A._gmt && A._gmt[it.gm.e], tq = T && T.q && T.q[String(it.gm.n)], sc = T && T.pt ? g.pt / T.pt : 1;
        var q = d.q.filter(function (x) { return x.n === it.gm.n; })[0], jobs = [];
        (d.p || []).forEach(function (p, i) { if (p.rng[0] <= it.gm.n && it.gm.n <= p.rng[1]) { o.key = "g|" + it.gm.e + "|" + i;
          var tp = T && T.p && T.p[String(i)];
          if (tp && tp.pas) { o.gpas = tp.pas; return; }
          jobs.push(Promise.all([loadImg(p.img), gmHd()]).then(function (v) { var r = v[0], H = v[1][it.gm.e]; r.dpi = 150 / (T ? sc : 1); if (H && H[i]) r.hd = H[i]; o.pimgs.push(r); })); } });
        if (tq && tq.ask) {
          o.gt = tq;
          if (tq.fig) jobs.push(loadImg(GMT + "i/" + tq.fig[0]).then(function (r) { r.mmpp = 25.4 / T.dpi * sc; o.qimgs[0] = r; }));
          return Promise.all(jobs);
        }
        if (tq && tq.img) { jobs.push(loadImg(GMT + "i/" + tq.img[0]).then(function (r) { r.mmpp = 25.4 / T.dpi * sc; r.nx = tq.nx; o.gimg = r; })); return Promise.all(jobs); }
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
        var it = o.it, t = it.txt || o.gt, pas = t && t.pas ? String(t.pas) : (o.gpas || ""), gk = o.key || (pas ? "x|" + o.n : "");
        var hasPas = (pas || o.pimgs.length) && !(gk && shown[gk]);
        if (hasPas) {
          if (gk) shown[gk] = 1;
          var ns = groups[o.key] || [o.n];
          B.push({ t: "head", html: '<div class="gh"><span class="rg">[' + (ns.length > 1 || o.key ? rangeLabel(ns) : o.n) + "]</span>다음 글을 읽고 물음에 답하시오.</div>" });
          o.pimgs.forEach(function (r) { if (!r.ok) return; if (g.sn && /^adv:(leet|im):/.test(it.k || "") && r.hd == null) r.hd = headCut(r);   /* v147: 원본 지문 그림 맨 위의 머리말 줄은 떼고 시험지 머리말로 */
            B.push(imgBlock(r, "pfg", r.dpi ? 25.4 / r.dpi : 0.127, g)); });
          if (pas) {
            if (isPoem(pas)) { var L = pas.replace(/^\n+|\s+$/g, "").split("\n"); B.push({ t: "text", tok: L, box: gk, make: function (i, j) { return '<div class="poem">' + em(L.slice(i, j).join("\n")) + "</div>"; } }); }
            else pas.trim().split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) {
              var xp = x.replace(/[\uFDD0-\uFDD7]/g, ""), head = /^\((가|나|다|라|마)\)$|^\[[A-Z]\]$|^<[^>]+>$|^\[(앞부분|중략|뒷부분)/.test(xp) || xp.length < 8, tok = x.split(" ");
              B.push({ t: "text", tok: tok, box: gk, make: function (i, j, cont, brk) { return '<div class="pp' + (head ? " ph" : "") + (cont ? " cont" : "") + (brk ? " pbrk" : "") + '">' + em(tok.slice(i, j).join(" ")) + "</div>"; } });
            });
          }
        }
        /* 문항: 통째로 한 단에 */
        var h = "";
        if (t && t.ask) {
          h += '<div class="qs"><span class="qn">' + o.n + ".</span>" + em(t.ask) + "</div>";
          o.qimgs.forEach(function (r) { if (r && r.ok) h += wholeImg(r, r.mmpp || 0.127); });
          (Array.isArray(t.body) ? t.body : (t.body ? [t.body] : [])).forEach(function (tb) {   /* v144: 상자가 여럿이면 차례로 */
            var m = /^<\s*([^<>]{1,24}?)\s*>\s*/.exec(String(tb).replace(/[\uFDD0-\uFDD7]/g, "")), raw = String(tb), lab = m ? m[1].replace(/\s+/g, "") : "", body = raw;
            if (m) { var k = 0, j = 0; while (j < m[0].length && k < raw.length) { if (!/[\uFDD0-\uFDD7]/.test(raw[k])) j++; k++; } body = raw.slice(k); }
            /* v147: 이름표 없는 상자(PSAT 지문 상자 등)는 문단마다 들여 쓴다(목록·대화 줄은 그대로) */
            var bt = lab ? em(body) : String(body).trim().split(/\n+/).map(function (x) { var p = x.replace(/[\uFDD0-\uFDD7]/g, "").trim(); return '<div class="pp' + (NOIND.test(p) || p.length < 20 ? " ni" : "") + '">' + em(x.trim()) + "</div>"; }).join("");
            h += '<div class="qb' + (lab ? " lab" : " par") + '">' + (lab ? '<div class="qbl">&lt;' + esc(lab.length <= 2 ? Array.from(lab).join(" ") : m[1].replace(/\s+/g, " ").trim()) + "&gt;</div>" : "") + '<div class="qbt">' + bt + "</div></div>";
          });
          if (t.free) h += '<div class="qfree">' + String(t.free).trim().split(/\n+/).map(function (x) { return "<div>" + em(x.trim()) + "</div>"; }).join("") + "</div>";   /* v147: 상자 밖 주석 */
          var ch = (t.ch || []).filter(Boolean);
          if (it.nc && ch.length === it.nc && ch.some(function (c) { return /\t/.test(c); })) {   /* v145: 표처럼 칸을 나눈 선택지(머리 줄 ㉠ ㉡ …) */
            var tk = ch[0].split("\t").length;
            var tl = ch.some(function (c) { return c.split("\t").some(function (x) { return x.replace(/[\uFDD0-\uFDD7]/g, "").length > 10; }); });   /* 긴 칸(문장)은 왼쪽 맞춤 */
            h += '<div class="qt' + (tl ? " tl" : "") + '" style="grid-template-columns:1.6em repeat(' + tk + ',minmax(0,1fr))">' + (t.chh && t.chh.length === tk ? "<div></div>" + t.chh.map(function (x) { return '<div class="qth">' + em(x) + "</div>"; }).join("") : "") +
              ch.map(function (c, i) { return "<div class=\"qtn\">" + CIR[i] + "</div>" + c.split("\t").map(function (x) { return "<div>" + em(x) + "</div>"; }).join(""); }).join("") + "</div>";
          }
          else if (it.nc && ch.length === it.nc) h += '<div class="qc" style="grid-template-columns:repeat(' + choiceCols(ch, g) + ',minmax(0,1fr))">' + ch.map(function (c, i) { return "<div>" + CIR[i] + " " + em(c).replace(/\n/g, "<br>") + "</div>"; }).join("") + "</div>";
          else if (!it.nc) h += '<div class="wr"></div>';
        } else if (o.gimg && o.gimg.ok) {
          /* v144: 글자로 옮기지 못한 공무원 문항 — 원래 번호를 지운 그림 위에 시험지 번호를 얹는다 */
          var gi = o.gimg, nx = gi.nx || [0, 0];
          h += '<div class="gmimg" style="position:relative">' + wholeImg(gi, gi.mmpp) + '<span class="qn gmn" style="left:' + (nx[0] / gi.w * 100).toFixed(2) + "%;top:" + (nx[1] / gi.h * 100).toFixed(2) + '%">' + o.n + ".</span></div>";
        } else if (g.sn && /^adv:(leet|im):/.test(it.k || "") && o.qimgs.length && o.qimgs[0] && o.qimgs[0].ok) {
          /* v147: 원본 문항 그림 — 단 너비에 맞추고, 왼쪽 위 원래 번호는 흰 바탕 새 번호로 덮는다 */
          var colH = g.h - g.top - g.bottom - 6, r0 = o.qimgs[0];
          if (o.qimgs.length === 1 && r0.h * g.colW / r0.w > colH) {
            /* 한 단보다 긴 원본 문항(임용 서술형 등): 줄 사이 흰 곳에서 나눠 싣는다(인쇄 배치 원칙의 예외, v133). 첫 조각에 새 번호 */
            var ib = imgBlock(r0, "qfg", g.colW / r0.w), mk = ib.make, nn = o.n;
            ib.make = function (i, j) { var x = mk(i, j); return i === 0 ? '<div class="gmimg advimg" style="position:relative;container-type:inline-size">' + x + advNum(r0, nn) + "</div>" : x; };
            B.push(ib); return;
          }
          o.qimgs.forEach(function (r, i) { if (r && r.ok) h += '<div class="gmimg advimg" style="position:relative;container-type:inline-size">' + '<div class="pimg qfg" style="width:100%;aspect-ratio:' + r.w + "/" + r.h + '"><img src="' + esc(r.src) + '" alt=""></div>' + (i === 0 ? advNum(r, o.n) : "") + "</div>"; });
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
      if (!(f && f.classList.contains("pbox") && f.dataset.g === box)) { var was = [].some.call(area.querySelectorAll(".pbox"), function (x) { return x.dataset.g === box && x.closest(".sh-col") !== cur; }); f = el('<div class="pbox' + (was ? " ot" : "") + '"></div>'); f.dataset.g = box; cur.appendChild(f); }
      f.appendChild(node);
      return function () { f.removeChild(node); if (!f.children.length) f.remove(); };
    }
    function tryPut(node, box) { var undo = put(node, box); if (!over()) return true; undo(); return false; }
    var lineH = g.pt * 1.6 * 96 / 72;
    /* v148b(선생님 지시): 단·쪽에서 이어지는 지문 상자 — 앞 조각은 아래 선 없이 단 끝까지, 이어지는 조각은 위 선 없이(수능 문제지처럼 이어지는 느낌) */
    function openBot(box) { var f = cur.lastElementChild; if (f && f.classList.contains("pimgs")) f = f.lastElementChild; if (!f || !((f.classList.contains("pbox") && f.dataset.g === box) || (f.classList.contains("pbx") && !f.classList.contains("bb")))) return; f.classList.add("ob"); var h = cur.getBoundingClientRect().bottom - f.getBoundingClientRect().top - 1; if (h > f.getBoundingClientRect().height) f.style.minHeight = h.toFixed(1) + "px"; }
    function placeText(b) {
      var i = 0, cont = false, n = b.tok.length, guard = 0;
      while (i < n && guard++ < 400) {
        if (tryPut(el(b.make(i, n, cont, false)), b.box)) return;
        var lo = i + 1, hi = n - 1, best = -1;
        while (lo <= hi) { var mid = (lo + hi) >> 1, undo = put(el(b.make(i, mid, cont, true)), b.box), ok = !over(); undo(); if (ok) { best = mid; lo = mid + 1; } else hi = mid - 1; }
        if (best > i) { put(el(b.make(i, best, cont, true)), b.box); i = best; cont = true; openBot(b.box); nextCol(); }
        else if (!cur.lastElementChild) { put(el(b.make(i, i + 1, cont, true)), b.box); i++; cont = true; forced++; openBot(b.box); nextCol(); }
        else { openBot(b.box); nextCol(); }
      }
    }
    function place(b) {
      if (b.t === "text") return placeText(b);
      if (b.t === "head") {
        /* v133 인쇄 배치 원칙(선생님 지시): 지문은 새 쪽 왼쪽 단 맨 위에서 시작. 다만 오른쪽 단이 절반 이상 남았으면 거기에서
           (앞 문항이 왼쪽 단에서 끝났으면 오른쪽 단 맨 위, 오른쪽 단 위쪽 절반 안에서 끝났으면 그 아래). 가운데를 넘었으면 새 쪽 */
        if (cur === cols[0] && !cur.lastElementChild) { /* 새 쪽 왼쪽 단 맨 위 */ }
        else if (cur === cols[0]) cur = cols[1];
        else if (used() <= cap() * 0.5) { /* 그 아래 */ }
        else newSheet();
        var node = el(b.html); cur.appendChild(node); if (over() || used() + lineH * 4 > cap()) { cur.removeChild(node); if (cur.lastElementChild) nextCol(); cur.appendChild(el(b.html)); } return; }
      if (tryPut(el(b.html))) return;
      if (cur.lastElementChild) { nextCol(); if (tryPut(el(b.html))) return; }
      /* 한 단보다 긴 문항: 쪼개지 않고, 그 단에 꽉 차도록 가장 조금만 줄인다(v133: 선생님 지시) */
      var nd = el(b.html); cur.appendChild(nd);
      var byW = !!nd.querySelector(".pimg"), lo = 0.3, hi = 1, mid, k;
      /* 그림 문항은 너비를 줄이면 높이도 같이 줄고, 글 문항은 통째로 축소한다 */
      var shrink = function (z) { if (byW) { nd.style.width = (z * 100).toFixed(1) + "%"; nd.style.marginLeft = nd.style.marginRight = "auto"; } else nd.style.zoom = z; };
      nd.classList.add("fit");
      for (k = 0; k < 12; k++) { mid = (lo + hi) / 2; shrink(mid); if (over()) hi = mid; else lo = mid; }
      shrink(lo);
      if (over()) forced++;
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
    /* v125: 전에 낸 과제(표시 없는 글)도 밑줄·글자 상자를 끼워서 찍는다 — 자리 파일을 받은 뒤 다시 연다 */
    if (window.KMA && KMA.snApply && (A.items || []).some(function (it) { return /^sn:/.test(it.k || "") && it.txt; })) {
      if (!window.ASG_SN_MARK && !A._snw) { A._snw = 1; KMA.snm().then(function () { open(A, opt); }, function () { open(A, opt); }); return; }
      (A.items || []).forEach(KMA.snApply);
    }
    /* v144: 공무원 문항이 있으면 글자 자료(gm/t/<회차>.json)를 먼저 받는다 */
    var gms = [], seenE = {};
    (A.items || []).forEach(function (it) { if (it.gm && !seenE[it.gm.e]) { seenE[it.gm.e] = 1; gms.push(it.gm.e); } });
    /* v147: PSAT 문항이 있으면 글자 자료(tx/psat/<회차>.json)를 먼저 받는다 */
    var txs = [], seenT = {};
    (A.items || []).forEach(function (it) { var t = txOf(it); if (t && !seenT[t.kind + ":" + t.e]) { seenT[t.kind + ":" + t.e] = 1; txs.push(t); } });
    if (txs.length && !A._txt && !A._gmOff) {
      A._txt = {};
      Promise.all(txs.map(function (t) { return fetch(TXB + t.kind + "/" + t.e + ".json?v=148").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { A._txt[t.kind + ":" + t.e] = d; }, function () {}); })).then(function () { open(A, opt); });
      return;
    }
    if (gms.length && !A._gmt && !A._gmOff) {
      A._gmt = {};
      Promise.all(gms.map(function (e) { return fetch(GMT + e + ".json?v=147").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { A._gmt[e] = d; }, function () {}); })).then(function () { open(A, opt); });
      return;
    }
    opt = opt || {}; close();
    if (!document.getElementById("kp-css")) { var st = document.createElement("style"); st.id = "kp-css"; st.textContent = SHEET_CSS + "\n" + EXTRA; document.head.appendChild(st); }
    /* v145: 글꼴은 하나 — KMA Serif(본명조)·KMA Sans(본고딕), 사이트에 올린 글꼴 파일. 컴퓨터마다 다른 글꼴로 찍히지 않게 */
    if (!document.getElementById("kma-font")) { var lk = document.createElement("link"); lk.id = "kma-font"; lk.rel = "stylesheet"; lk.href = "/suneung-korean/fonts/kma/kma.css?v=147"; document.head.appendChild(lk); }
    var items = A.items || [], sn = items.length > 0 && items.every(function (it) { var advImg = /^adv:(leet|im):/.test(it.k || "") && (it.q || []).length; if (advImg && !txOf(it)) return true;   /* v147: 글자 자료가 없는 LEET·임용 문항도 수능 양식에 그림으로(번호는 새로) */
      var tx = txOf(it); if (tx) { var TT = A._txt && A._txt[tx.kind + ":" + tx.e], tq = TT && TT.q && TT.q[String(tx.n)]; return !!(tq && (tq.ask || tq.img)) || !!advImg; } if (it.gm) { var T = A._gmt && A._gmt[it.gm.e], q = T && T.q && T.q[String(it.gm.n)]; return !!(q && (q.ask || q.img)); } return /^sn:/.test(it.k) && it.txt && it.txt.ask; }), g = geom(sn), key = opt.key || null;
    var info = items.length + "문항" + (A.mode === "exam" && A.min ? " · 모의고사 " + A.min + "분" : "") + (A.due ? " · 마감 " + A.due : "");
    root = document.createElement("div"); root.className = "kma kp-root"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "인쇄 미리 보기");
    root.innerHTML = '<div class="kp-bar"><span><b>' + esc(A.title) + "</b> <small id=\"kpInfo\">" + esc(info) + '</small></span>' +
      (key ? '<label><input type="checkbox" id="kpKey"> 정답표 붙이기</label>' : "") +
      (gms.length || txs.length ? '<label title="글자로 옮긴 문항 대신 원본 시험지 그림으로 찍습니다"><input type="checkbox" id="kpGmImg"' + (A._gmOff ? " checked" : "") + "> " + (gms.length && !txs.length ? "공무원 " : "") + "문항 원본 그림으로</label>" : "") +
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
    /* v145: 문제지에 쓰일 글자가 든 글꼴 조각(KMA Serif·KMA Sans)을 모두 받은 뒤에 짠다 — 받는 중에 다른 글꼴로 재고 찍는 일이 없게 */
    function needFonts(B) {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      var t = [A.title || "", info, "국어 영역 제 교시 홀수형 짝수형 1234567890 ①②③④⑤ 답 적는 곳 정답 다음 글을 읽고 물음에 답하시오. 보기"].concat((B || []).map(function (b) { return b.html || (b.tok ? b.tok.join(" ") : ""); })).join(" ").replace(/<[^>]*>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      var u = Array.from(new Set(Array.from(t))).join("");
      var fs = ['400 16px "KMA Serif"', '700 16px "KMA Serif"', '500 16px "KMA Sans"', '700 16px "KMA Sans"'];
      return Promise.race([Promise.all(fs.map(function (f) { return document.fonts.load(f, u).catch(function () {}); })), new Promise(function (r) { setTimeout(r, 20000); })]);
    }
    build(A, g).then(function (B) { BL = B; return needFonts(B); }).then(function () {
      if (!root) return; render();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (root && R) { var y = root.scrollTop; render(); root.scrollTop = y; } });
    }).catch(function () { var m = root && root.querySelector("#kpMsg"); if (m) m.textContent = "문제지를 만들지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요."; });
    var kk = root.querySelector("#kpKey"); if (kk) kk.onchange = function () { if (BL) render(); };
    var gi = root.querySelector("#kpGmImg"); if (gi) gi.onchange = function () { A._gmOff = gi.checked; A._gmt = gi.checked ? {} : null; A._txt = gi.checked ? {} : null; open(A, opt); };   /* v144 */
    root.querySelector("#kpGo").onclick = function () {
      var imgs = Array.prototype.slice.call(area.querySelectorAll("img"));
      var all = Promise.all(imgs.map(function (i) { return i.complete && i.naturalWidth ? null : new Promise(function (res) { i.addEventListener("load", res, { once: true }); i.addEventListener("error", res, { once: true }); }); }));
      Promise.race([all, new Promise(function (r) { setTimeout(r, 8000); })]).then(function () { try { window.print(); } catch (e) {} });
    };
    window.addEventListener("resize", fit);
  }
  window.KMAPrint = { open: open, close: close };
})();
