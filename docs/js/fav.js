/* 국어의 모든 것 — 즐겨찾기 틀 (v130, 2026-11-18)
 * 모든 단계가 함께 쓴다. 각 화면에서 그 화면의 글보다 먼저 불러온다:  <script src="/suneung-korean/js/fav.js?v=130"></script>
 *
 * 갈래(ns)마다 { 열쇠: 넣은 시각(양수) / 뺀 시각(음수 — 다른 기기에도 뺀 것이 전해지도록 90일 남긴다) }
 *   sn  수능·모의평가 지문 (3단계 수능 화면이 v129부터 쓰는 자리와 같다. 1단계의 평가원 기출 지문도 여기)
 *   hak 학력평가·기초학력 지문 (1단계)      non 대학 논술 문항 (4단계)
 *   adv PSAT·LEET·임용 지문 묶음·문항 (5단계)   gm  공무원 국어 지문·문항 (5단계)
 * 저장: 이 기기에는 아이디마다 따로(localStorage), 로그인해 있으면 아이디에도(account.js KMA.favOf → users/{uid}.fav.<ns>) 적어 다른 기기에서도 같게 보인다.
 *
 * 별 단추 = KFAV.btn(ns, 열쇠, 글자) 가 만들어 주는 <button class="kfav" data-kfav="ns|열쇠">. 그리기와 누름은 이 틀이 맡는다.
 * 개수   = <span class="kfav-n" data-ns="hak sn"></span> 를 두면 이 틀이 채운다.
 * 목록 화면은 각 단계가 제 모양대로 그리고, 바뀔 때마다 document 의 'kfav:change'(detail.ns)를 듣는다.
 */
(function () {
  if (window.KFAV) return;
  var LK = { sn: "suneung.fav.v1:" };                 /* 수능 화면(v129)과 같은 자리 */
  var ST = {}, user = "", OK = {}, pushT = {}, DAY = 864e5;
  function sess() { try { var s = JSON.parse(localStorage.getItem("kma.s") || "null"); return (s && s.id) || ""; } catch (e) { return ""; } }
  function uid() { try { if (window.KMA && KMA.user) return KMA.user() || ""; } catch (e) { } return sess(); }
  user = sess();
  function lkey(ns, u) { return (LK[ns] || "kme.fav." + ns + ":") + (u || "_"); }
  function rd(k) { try { var v = JSON.parse(localStorage.getItem(k) || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch (e) { return {}; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function st(ns) { return ST[ns] || (ST[ns] = { m: rd(lkey(ns, user)), ok: false }); }
  function same(a, b) { var ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(function (k) { return a[k] === b[k]; }); }
  function merge(a, b) {
    var o = {}, k; for (k in a) o[k] = a[k];
    Object.keys(b || {}).forEach(function (k) { var v = Number(b[k]) || 0; if (v && (!(k in o) || Math.abs(v) > Math.abs(o[k]))) o[k] = v; });
    var cut = Date.now() - 90 * DAY; Object.keys(o).forEach(function (k) { if (o[k] < 0 && -o[k] < cut) delete o[k]; });
    return o;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function has(ns, key) { return st(ns).m[key] > 0; }
  function valid(ns, key) { var f = OK[ns]; if (!f) return true; try { return !!f(key); } catch (e) { return true; } }
  function keys(ns) { var m = st(ns).m; return Object.keys(m).filter(function (k) { return m[k] > 0 && valid(ns, k); }); }
  function count(list) { return String(list || "").split(/\s+/).filter(Boolean).reduce(function (n, ns) { return n + keys(ns).length; }, 0); }
  var TIP_ON = "즐겨찾기에서 뺍니다", TIP_OFF = "즐겨찾기에 넣어 두면 ‘즐겨찾기’에서 바로 엽니다";
  function btn(ns, key, label, cls) {
    if (!key) return "";
    var on = has(ns, key);
    return '<button type="button" class="kfav' + (cls ? " " + cls : "") + (on ? " on" : "") + '" data-kfav="' + esc(ns + "|" + key) + '" data-label="' + esc(label || "") + '" aria-pressed="' + on + '" title="' + (on ? TIP_ON : TIP_OFF) + '">' + (on ? "★" : "☆") + (label ? " " + esc(label) : "") + "</button>";
  }
  function paint() {
    var l = document.querySelectorAll(".kfav[data-kfav]"), i, b, v, p, on, lab, tx;
    for (i = 0; i < l.length; i++) {
      b = l[i]; v = b.getAttribute("data-kfav"); p = v.indexOf("|"); on = has(v.slice(0, p), v.slice(p + 1)); lab = b.getAttribute("data-label") || "";
      tx = (on ? "★" : "☆") + (lab ? " " + lab : "");
      if (b.textContent !== tx) b.textContent = tx;
      if (b.classList.contains("on") !== on) b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on)); b.title = on ? TIP_ON : TIP_OFF;
    }
    l = document.querySelectorAll(".kfav-n[data-ns]");
    for (i = 0; i < l.length; i++) { v = count(l[i].getAttribute("data-ns")); tx = v ? String(v) : ""; if (l[i].textContent !== tx) l[i].textContent = tx; }
  }
  function tell(ns) { paint(); try { document.dispatchEvent(new CustomEvent("kfav:change", { detail: { ns: ns } })); } catch (e) { } }
  function api(ns) { try { return window.KMA && KMA.favOf ? KMA.favOf(ns) : null; } catch (e) { return null; } }
  /* 아이디에 적힌 것과 합친다(account.js 가 새로 읽어 합쳐 적고, 합친 것을 돌려준다) */
  function sv(ns) {
    var s = st(ns), a = api(ns), u = user; if (!a || !u || uid() !== u || s.busy) return;
    s.busy = true;
    a.merge(s.m).then(function (m) {
      s.busy = false; if (u !== user || ST[ns] !== s) return;
      if (!m) { if (s.ok) { s.ok = false; tell(ns); } return; }
      var all = merge(s.m, m), was = s.ok, diff = !same(all, s.m);     /* 기다리는 사이에 누른 것도 살린다 */
      s.ok = same(all, m); s.at = Date.now();
      if (diff) { s.m = all; wr(lkey(ns, u), all); }
      if (diff || was !== s.ok) tell(ns);                              /* 달라진 것이 없으면 화면을 다시 그리게 하지 않는다 */
      if (!s.ok) { clearTimeout(pushT[ns]); pushT[ns] = setTimeout(function () { sv(ns); }, 700); }
    }, function () { s.busy = false; });
  }
  function toggle(ns, key) {
    if (!key) return;
    var s = st(ns); s.m = merge(s.m, rd(lkey(ns, user)));          /* 다른 화면에서 넣은 것을 덮어쓰지 않게 */
    s.m[key] = s.m[key] > 0 ? -Date.now() : Date.now(); s.ok = false;
    wr(lkey(ns, user), s.m); tell(ns);
    clearTimeout(pushT[ns]); pushT[ns] = setTimeout(function () { sv(ns); }, 700);
  }
  /* 아이디가 정해지면(또는 바뀌면) 그 아이디의 즐겨찾기를 읽고, 아이디에 적힌 것과 합친다 */
  function sync() {
    var u = uid();
    if (u !== user) { user = u; Object.keys(ST).forEach(function (ns) { ST[ns] = { m: rd(lkey(ns, u)), ok: false }; }); tell(""); }
    if (!u) return;
    Object.keys(ST).forEach(function (ns) { if (!ST[ns].ok) sv(ns); });
  }
  function use() { for (var i = 0; i < arguments.length; i++) st(arguments[i]); sync(); return window.KFAV; }
  function note(nsList) {
    var l = String(nsList || "").split(/\s+/).filter(Boolean);
    if (!user) return "로그인하면 즐겨찾기가 아이디에 저장되어 다른 기기에서도 보입니다.";
    return l.every(function (ns) { return st(ns).ok; }) ? "즐겨찾기는 아이디에 저장되어 다른 기기에서도 같게 보입니다." : "지금은 이 기기에만 저장되어 있습니다. 인터넷에 이어지면 아이디에도 저장합니다.";
  }
  /* 누름: 줄·접이(summary) 안에 있어도 그 줄이 대신 열리거나 닫히지 않게 먼저 받는다 */
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(".kfav[data-kfav]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var v = b.getAttribute("data-kfav"), p = v.indexOf("|"); toggle(v.slice(0, p), v.slice(p + 1));
  }, true);
  document.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target && e.target.classList && e.target.classList.contains("kfav")) e.stopPropagation(); }, true);
  window.addEventListener("load", function () { sync(); var n = 0, iv = setInterval(function () { sync(); if (++n > 60) clearInterval(iv); }, 2000); });
  /* 돌아왔을 때: 이 기기의 다른 화면에서 바뀐 것은 바로, 아이디에 적힌 것은 1분에 한 번만 다시 읽는다 */
  window.addEventListener("focus", function () {
    Object.keys(ST).forEach(function (ns) {
      var s = ST[ns], m = merge(s.m, rd(lkey(ns, user)));
      if (!same(m, s.m)) { s.m = m; tell(ns); }
      if (!s.at || Date.now() - s.at > 60000) s.ok = false;
    });
    sync();
  });
  /* 다른 탭(다른 단계 화면)에서 바꾼 것 */
  window.addEventListener("storage", function (e) {
    if (!e.key) return;
    Object.keys(ST).forEach(function (ns) { if (e.key === lkey(ns, user)) { var m = merge(ST[ns].m, rd(e.key)); if (!same(m, ST[ns].m)) { ST[ns].m = m; tell(ns); } } });
  });
  var css = document.createElement("style"); css.id = "kfav-css";
  css.textContent =
    ".kfav{font:inherit;font-size:13px;line-height:1.2;padding:5px 11px;border:1px solid rgba(127,127,127,.38);border-radius:999px;background:transparent;color:inherit;white-space:nowrap;cursor:pointer;flex:none;opacity:.86}" +
    ".kfav:hover{opacity:1}" +
    ".kfav.on{opacity:1;color:var(--brand,#2F4F7F);border-color:var(--brand,#2F4F7F);background:var(--brand-soft,rgba(47,79,127,.08));font-weight:700}" +
    ".kfav.ico{padding:4px 9px;font-size:15px;border-color:transparent;background:transparent}" +
    ".kfav.ico.on{border-color:transparent;background:transparent}" +
    ".kfav-n:empty{display:none}" +
    ".kfav-note{margin:14px 2px 0;font-size:12.5px;opacity:.62}" +
    "@media print{.kfav{display:none!important}}";
  (document.head || document.documentElement).appendChild(css);
  window.KFAV = { use: use, has: has, keys: keys, count: count, at: function (ns, key) { return st(ns).m[key] || 0; }, toggle: toggle, btn: btn, paint: paint, sync: sync, note: note, valid: function (ns, f) { OK[ns] = f; paint(); }, user: function () { return user; } };
})();
