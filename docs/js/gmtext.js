/* v147: PSAT 언어논리·LEET도 같은 꼴(tx/psat|leet/<회차>.json) — GMText.load(회차, "psat"|"leet"). 지문 상자(box)·상자 밖 글(free)·그림 지문(img)
   v145: 공무원 문항을 화면에 글자로 — 인쇄(asgprint.js)와 같은 글(gm/t/<회차>.json)·같은 글꼴(KMA Serif)
   GMText.load(회차) → Promise(자료|null) · GMText.get(회차) · GMText.pas(자료, 지문차례) → HTML|"" ·
   GMText.q(자료, 번호) → {ask, fig, body, ch[]}|null (그림으로만 있는 문항은 {img}) · GMText.ind(html) 문단 들여쓰기 */
(function () {
  if (window.GMText) return;
  var B = "/advanced-korean/gm/t/", V = "151", C = {}, P = {}, BASE = { gm: B, psat: "/advanced-korean/tx/psat/", leet: "/advanced-korean/tx/leet/" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* 표시 글자(U+FDD0~7: 밑줄·글자 상자·굵게·고딕) → 태그. account.js mkh 와 같은 규칙(그 파일이 늦게 읽혀도 되도록 여기에 따로 둔다) */
  function em(s) {
    var h = esc(s), out = "", u = 0, d = 0, g = 0, box = 0, i, k, nu, nd, ng;
    if (!/[\uFDD0-\uFDD7]/.test(h)) return h;
    function op() { return (g ? '<span class="gt">' : "") + (d ? '<b class="bd">' : "") + (u ? '<u class="ul">' : ""); }
    function cl() { return (u ? "</u>" : "") + (d ? "</b>" : "") + (g ? "</span>" : ""); }
    for (i = 0; i < h.length; i++) { k = h.charCodeAt(i);
      if (k < 0xFDD0 || k > 0xFDD7) { out += h.charAt(i); continue; }
      if (k === 0xFDD2 || k === 0xFDD3) { if ((k === 0xFDD2) === !!box) continue; out += cl() + (k === 0xFDD2 ? '<span class="bx">' : "</span>") + op(); box = k === 0xFDD2 ? 1 : 0; continue; }
      nu = k === 0xFDD0 ? 1 : k === 0xFDD1 ? 0 : u; nd = k === 0xFDD4 ? 1 : k === 0xFDD5 ? 0 : d; ng = k === 0xFDD6 ? 1 : k === 0xFDD7 ? 0 : g;
      if (nu === u && nd === d && ng === g) continue;
      out += cl(); u = nu; d = nd; g = ng; out += op(); }
    out += cl() + (box ? "</span>" : "");
    for (i = 0; i < 3; i++) out = out.replace(/<span class="gt"><\/span>|<b class="bd"><\/b>|<u class="ul"><\/u>/g, "");
    return out;
  }
  function load(e, kind) {
    var b = BASE[kind || "gm"] || B, ck = (kind && kind !== "gm" ? kind + ":" : "") + e;
    if (C[ck]) return Promise.resolve(C[ck]);
    if (!P[ck]) P[ck] = new Promise(function (res) {
      var k = 0;
      (function go() {
        fetch(b + e + ".json?v=" + V + (k ? "&r=" + k : "")).then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (d) { try { Object.defineProperty(d, "_b", { value: b }); } catch (x) {} C[ck] = d; delete P[ck]; res(d); }, function () { if (++k < 3) setTimeout(go, k * 1500); else { delete P[ck]; res(null); } });
      })();
    });
    return P[ck];
  }
  function isPoem(t) { var L = t.split("\n").filter(function (x) { return x.trim(); }); if (L.length < 6) return false; var s = 0; L.forEach(function (x) { s += x.length; }); return s / L.length < 26; }
  var NOIND = /^([가-힣A-Za-z]{1,6}(?: [가-힣]{1,4}){0,2}\s*[:：]|[ㄱ-ㅎ]\s*[.．]|[○◦•∙·▪■□◇◆※\-–—]|\([가-하A-Z0-9]\)|[가-하]\s*[.．]|\d+\s*[.．)]|[①-⑳㉠-㉭<〈「\[])/;
  var HEAD = /^\((가|나|다|라|마)\)$|^\[[A-Z]\]$|^<[^>]+>$|^\[(앞부분|중략|뒷부분)/;
  function isHead(x) { var p = x.replace(/[\uFDD0-\uFDD7]/g, "").trim(); return HEAD.test(p) || p.length < 8; }
  /* 지문: 인쇄와 같이 문단마다 들여쓰기, 제목 줄은 들여 쓰지 않음, 시는 줄 그대로 */
  function pas(T, i) {
    var tp = T && T.p && T.p[String(i)]; if (!tp) return "";
    if (tp.img && tp.img.length) return figH(T, tp.img, "gmx-pimg");
    if (!tp.pas) return "";
    var t = String(tp.pas), bx = tp.box ? " gmx-box" : "";
    if (isPoem(t)) return '<div class="gmx gmx-poem' + bx + '">' + em(t.replace(/^\n+|\s+$/g, "")) + "</div>";
    return '<div class="gmx' + bx + '">' + t.trim().split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) {
      return '<div class="gmx-pp' + (isHead(x) ? " gmx-ph" : "") + '">' + em(x) + "</div>";
    }).join("") + "</div>";
  }
  function figH(T, f, cls) {   /* 그림: 시험지 글자 크기에 맞춘 너비(em) */
    var w = f[1] * 72 / (T.dpi || 200) / (T.pt || 10);
    return '<img class="gmx-fig' + (cls ? " " + cls : "") + '" src="' + (T._b || B) + "i/" + esc(f[0]) + '" alt="" style="width:' + w.toFixed(2) + 'em" width="' + f[1] + '" height="' + f[2] + '" decoding="async">';
  }
  function q(T, n) {
    var tq = T && T.q && T.q[String(n)]; if (!tq) return null;
    if (!tq.ask) return tq.img ? { img: figH(T, tq.img) } : null;
    var body = (Array.isArray(tq.body) ? tq.body : (tq.body ? [tq.body] : [])).map(function (tb) {
      var raw = String(tb), m = /^<\s*([^<>]{1,24}?)\s*>\s*/.exec(raw.replace(/[\uFDD0-\uFDD7]/g, "")), lab = "", body = raw;
      if (m) { lab = m[1].replace(/\s+/g, " ").trim(); var k = 0, j = 0; while (j < m[0].length && k < raw.length) { if (!/[\uFDD0-\uFDD7]/.test(raw[k])) j++; k++; } body = raw.slice(k); }
      var l2 = lab.replace(/\s/g, "");
      /* v147: 이름표 없는 상자(PSAT 지문 상자 등)는 문단마다 들여 쓴다(목록·대화 줄은 그대로) */
      var bt = lab ? em(body) : String(body).trim().split(/\n+/).map(function (x) { var p = x.replace(/[\uFDD0-\uFDD7]/g, "").trim(); return '<div class="gmx-bp' + (NOIND.test(p) || p.length < 20 ? " ni" : "") + '">' + em(x.trim()) + "</div>"; }).join("");
      return '<div class="gmx-qb' + (lab ? " lab" : " par") + '">' + (lab ? '<div class="gmx-qbl">&lt;' + esc(l2.length <= 2 ? Array.from(l2).join(" ") : lab) + "&gt;</div>" : "") + '<div class="gmx-qbt">' + bt + "</div></div>";
    }).join("");
    /* v147: 상자 밖 글(주석 ※ 등) — 테두리 없이 */
    if (tq.free) body += '<div class="gmx-free">' + String(tq.free).trim().split(/\n+/).map(function (x) { return "<div>" + em(x.trim()) + "</div>"; }).join("") + "</div>";
    var ch = tq.ch || [], tk = ch.length && /\t/.test(ch.join("")) ? ch[0].split("\t").length : 0, tl = tk && ch.some(function (c) { return String(c).split("\t").some(function (x) { return x.replace(/[\uFDD0-\uFDD7]/g, "").length > 10; }); }),
      tr = function (c) { return '<span class="gmx-tr' + (tl ? " tl" : "") + '" style="--k:' + tk + '">' + String(c).split("\t").map(function (x) { return "<span>" + em(x) + "</span>"; }).join("") + "</span>"; };
    /* v145: 표처럼 칸을 나눈 선택지 — 칸마다 같은 너비, 머리 줄(㉠ ㉡ …)은 chh */
    return { ask: em(tq.ask), fig: tq.fig ? figH(T, tq.fig) : "", body: body, ch: tk ? ch.map(tr) : ch.map(function (c) { return em(c).replace(/\n/g, "<br>"); }),
      chh: tk && tq.chh && tq.chh.length === tk ? '<div class="gmx-chh"><span class="c">①</span>' + tr(tq.chh.join("\t")) + "</div>" : "" };
  }
  /* 글자 크기·줄 간격·들여쓰기·상자: 인쇄 양식(asgprint SHEET_CSS)과 같은 비율로 */
  var CSS = ".gmx,.gmx-q{text-justify:inter-word;font-family:\"KMA Serif\",\"Noto Serif KR\",\"Noto Serif CJK KR\",serif;letter-spacing:-.02em;word-break:keep-all;overflow-wrap:anywhere}" +
    ".gmx{line-height:1.8;text-align:justify}.gmx-pp{text-indent:.6em}.gmx-pp.gmx-ph{text-indent:0;font-weight:700}" +
    ".gmx-poem{white-space:pre-wrap;text-align:left;line-height:1.8}" +
    ".gmx-box{border:1px solid currentColor;padding:.55em .8em}.gmx-free{margin:.4em 0 .2em;text-align:justify}.gmx-pimg{margin:0 auto}" +
    ".gmx-q{line-height:1.7}.gmx-ask{text-align:justify;margin:2px 0 6px}" +
    ".gmx-fig{display:block;max-width:100%;height:auto;margin:8px auto}" +
    ".gmx-qb{position:relative;border:1px solid currentColor;padding:.5em .75em .55em;margin:.7em 0 .5em}.gmx-qb.lab{margin-top:1.2em;padding-top:.85em}" +
    ".gmx-qbl{position:absolute;left:50%;top:0;transform:translate(-50%,-55%);background:var(--gmx-bg,#fff);padding:0 .45em;white-space:nowrap;line-height:1.2}" +
    ".gmx-qbt{white-space:pre-wrap;text-align:justify}.gmx-qb.par .gmx-qbt{white-space:normal}.gmx-bp{text-indent:.6em}.gmx-bp.ni{text-indent:0}" +
    ".gmx-tr{flex:1;display:grid;grid-template-columns:repeat(var(--k),minmax(0,1fr));gap:0 1em;text-align:center}.gmx-tr.tl{text-align:left}" +
    ".gmx-chh{display:flex;gap:10px;padding:0 15px;margin:10px 0 -4px;font-family:\"KMA Serif\",\"Noto Serif KR\",serif;font-size:16px;letter-spacing:-.02em}.gmx-chh .c{visibility:hidden}" +
    ".gmx .gt,.gmx-q .gt{font-family:\"KMA Sans\",\"Noto Sans KR\",\"Noto Sans CJK KR\",sans-serif;font-weight:500}" +
    ".gmx u.ul,.gmx-q u.ul{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.22em;text-decoration-skip-ink:none}" +
    ".gmx .bx,.gmx-q .bx{border:1px solid currentColor;padding:0 .15em;margin:0 .05em;-webkit-box-decoration-break:clone;box-decoration-break:clone}";
  function css() {
    if (!document.getElementById("kma-font")) { var l = document.createElement("link"); l.id = "kma-font"; l.rel = "stylesheet"; l.href = "/suneung-korean/fonts/kma/kma.css?v=150"; document.head.appendChild(l); }
    if (!document.getElementById("gmx-css")) { var s = document.createElement("style"); s.id = "gmx-css"; s.textContent = CSS; document.head.appendChild(s); }
  }
  css();
  window.GMText = { load: load, get: function (e, kind) { return C[(kind && kind !== "gm" ? kind + ":" : "") + e] || null; }, pas: pas, q: q, isPoem: isPoem, isHead: isHead, css: css };
})();
