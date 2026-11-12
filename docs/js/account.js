/*
 * 국어의 모든 것 — 학생 아이디 · 기록 · 과제 (2026-11-10 v99)
 * 다섯 갈래가 함께 쓰는 파일: /suneung-korean/js/account.js
 *
 * KMA_URL 이 비어 있으면 아무것도 나타나지 않고, 사이트는 지금처럼(기록은 각 브라우저에) 움직입니다.
 * 앱스 스크립트(Site.gs)를 배포한 뒤 나온 웹 앱 주소(…/exec)를 아래에 넣으면 켜집니다.
 *
 * 각 갈래에서 쓰는 법
 *   KMA.record('adv:psat:PS2024a-12', true, 'PSAT', 3)   // 학생이 채점한 순간 한 번 부르면 됨(로그인 안 했으면 무시). 끝의 3은 고른 번호(없으면 생략)
 * v117(2026-11-12): 관리자가 학급의 담임을 바꾼다 — classOwner(학급 id, 선생님 uid). teacherSite 가 관리자에게 선생님 목록(tch)을 함께 준다
 * v110(2026-11-11): 혼자 푼 문제도 고른 번호를 남긴다 — KMA.record(열쇠, 맞았나, 영역, 고른 번호). ev 기록 [첫, 마지막, 횟수, 시각, 영역, 첫 번호, 마지막 번호]
 * v108(2026-11-11): 학생 한 명이 여러 학급에 — users/{uid}.cls 에 학급 이름을 줄바꿈(\n)으로 이어 적는다(하나뿐이면 전과 같음)
 * v107(2026-11-11): 과제 인쇄(js/asgprint.js), 학생 화면 위쪽 '과제' 탭, 새 공지 알림 창, 학급(선생님이 만들고 학생을 넣음 — asgKey/_cls)
 * v106(2026-11-11): 모의고사(제한 시간·자동 제출), 선택지별 응답 수(선생님만), 지운 과제의 응답 보관(asgKey/_stat)
 *   KMA.assign([{k, title, topic, src, nc, q:[{s,w,h}], p:{lab, imgs:[…]}, txt:{pas, ask, body, ch}, ans}])  // 선생님: 과제로 내기
 */
(function () {
  /* Firebase 프로젝트 korean-exam-teacher 의 웹 앱 설정(공개해도 되는 값). 비우면(null) 아래 앱스 스크립트 주소를 씀 */
  var FBCFG = { apiKey: "AIzaSyA4jWTXoOIetaV6Nf4cGVFnoXyBtICYh50", authDomain: "korean-exam-teacher.firebaseapp.com", projectId: "korean-exam-teacher",
    storageBucket: "korean-exam-teacher.firebasestorage.app", messagingSenderId: "281878664512", appId: "1:281878664512:web:ccfe7ef3f651fd6eff56a5" };
  var KMA_URL = "";   // (예비) 앱스 스크립트 웹 앱 주소
  try { var o = localStorage.getItem("kma.url"); if (o) { KMA_URL = o; FBCFG = null; } if (localStorage.getItem("kma.off")) { FBCFG = null; KMA_URL = ""; } } catch (e) {}
  var NOUI = !!(document.currentScript && document.currentScript.hasAttribute("data-noui"));   // 선생님 화면: 단추 없이 주소만 씀
  var SKEY = "kma.s", QKEY = "kma.q", CIR = "①②③④⑤";
  var G = { hak: "개념 학습", seo: "서·논술형", sn: "수능", non: "대학 논술", adv: "PSAT·LEET·임용·공무원" }, GO = ["hak", "seo", "sn", "non", "adv"];
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pct(c, t) { return t ? Math.round(c / t * 100) + "%" : "–"; }
  function call(fn, args) {
    if (FBCFG) return fbCall(fn, args);
    return fetch(KMA_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ fn: fn, args: args || [] }) })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, msg: "서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요." }; });
  }
  /* ===================== Firebase 연결 (v100) =====================
   * 아이디 → 'u'+base32(아이디)+'@students.kme' 형식의 이메일로 바꿔 Firebase 로그인에 씀(실제 메일 아님).
   * users/{uid}: {id, created, cls, days:{날짜:푼 수}, agg:{n,f,wrong,byG,byA}, last, sub:{과제:{at,sc,n,ans}}, moved}
   * users/{uid}/ev/{갈래}: {m:{문항키:[첫 결과, 마지막 결과, 횟수, 시각, 영역]}}
   * asg/{과제}, asgKey/{과제}:{key}, subs/{과제}:{uid:{at,ans,id}}, notices/{id}, teachers/{uid}(콘솔에서만)
   */
  var ISADM = false, FB_VER = "10.12.5", FBP = null, AU = null, DB = null, ME = null, EV = null, TROWS = null;
  var IDRE = /^[0-9A-Za-z가-힣_.-]{2,12}$/;
  function loadJs(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("load")); }; document.head.appendChild(s); }); }
  function fbInit() {
    if (FBP) return FBP;
    var base = "https://www.gstatic.com/firebasejs/" + FB_VER + "/";
    FBP = (window.firebase && firebase.auth && firebase.firestore ? Promise.resolve() :
      (window.firebase ? Promise.resolve() : loadJs(base + "firebase-app-compat.js")).then(function () {
        return Promise.all([firebase.auth ? 0 : loadJs(base + "firebase-auth-compat.js"), firebase.firestore ? 0 : loadJs(base + "firebase-firestore-compat.js")]);
      })).then(function () {
        var app = firebase.apps.filter(function (a) { return a.name === "kma"; })[0] || firebase.initializeApp(FBCFG, "kma");
        AU = app.auth(); DB = app.firestore();
        return new Promise(function (res) { var un = AU.onAuthStateChanged(function (u) { un(); res(u); }); });
      });
    return FBP;
  }
  var B32 = "abcdefghijklmnopqrstuvwxyz234567";
  function b32(s) { var b = new TextEncoder().encode(s), o = "", bits = 0, v = 0; for (var i = 0; i < b.length; i++) { v = (v << 8) | b[i]; bits += 8; while (bits >= 5) { o += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) o += B32[(v << (5 - bits)) & 31]; return o; }
  function unb32(s) { var out = [], bits = 0, v = 0; for (var i = 0; i < s.length; i++) { v = (v << 5) | B32.indexOf(s[i]); bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } } return new TextDecoder().decode(new Uint8Array(out)); }
  function em(id) { return "u" + b32(id) + "@students.kme"; }
  function idOf(email) { var m = /^u([a-z2-7]+)@students\.kme$/.exec(String(email || "")); return m ? unb32(m[1]) : ""; }
  function day(t) { return new Date((t || Date.now()) + 9 * 3600000).toISOString().slice(0, 10); }
  function emptyAgg() { return { n: 0, f: 0, wrong: 0, byG: {}, byA: {} }; }
  function aggOf(ev) {
    var a = emptyAgg();
    Object.keys(ev || {}).forEach(function (g) {
      var m = ev[g] || {};
      Object.keys(m).forEach(function (k) {
        var e = m[k]; a.n++; if (e[0]) a.f++; if (!e[1]) a.wrong++;
        var G = a.byG[g] || (a.byG[g] = { t: 0, c: 0 }); G.t++; if (e[0]) G.c++;
        if (e[4]) { var A = a.byA[g + "|" + e[4]] || (a.byA[g + "|" + e[4]] = { t: 0, c: 0 }); A.t++; if (e[0]) A.c++; }
      });
    });
    return a;
  }
  function sumOf(d) {
    d = d || {}; var a = d.agg || emptyAgg(), days = d.days || {}, ds = Object.keys(days).filter(function (x) { return days[x] > 0; }).sort();
    var wk = 0, lim = day(Date.now() - 6 * 86400000); ds.forEach(function (x) { if (x >= lim) wk += days[x]; });
    return { n: a.n || 0, f: a.f || 0, wrong: a.wrong || 0, wk: wk, last: d.last || 0, byG: a.byG || {}, byA: a.byA || {}, days: ds.slice(-60), cls: d.cls || "", name: d.name || "", app: null };
  }
  function errMsg(e) {
    var c = (e && e.code) || "";
    if (/email-already-in-use/.test(c)) return "이미 있는 아이디예요. 다른 아이디를 쓰거나 '들어가기'를 눌러 주세요.";
    if (/weak-password/.test(c)) return "비밀번호는 6자 이상이에요.";
    if (/invalid-credential|wrong-password|user-not-found|invalid-login|invalid-email/.test(c)) return "아이디나 비밀번호가 맞지 않아요.";
    if (/too-many-requests/.test(c)) return "여러 번 틀려서 잠시 잠겼어요. 조금 뒤에 다시 해 보세요.";
    if (/network/.test(c)) return "서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.";
    if (/permission-denied/.test(c)) return "권한이 없어요.";
    return "잠시 문제가 생겼어요. 다시 해 보세요." + (c ? " (" + c + ")" : "");
  }
  function uid() { return AU && AU.currentUser && AU.currentUser.uid; }
  function uref(u) { return DB.collection("users").doc(u || uid()); }
  function loadMe() {
    return uref().get().then(function (s) {
      if (s.exists) { ME = s.data(); ME.days = ME.days || {}; ME.sub = ME.sub || {}; return; }
      var id = idOf(AU.currentUser.email) || "";
      ME = { id: id, created: Date.now(), days: {}, agg: emptyAgg(), last: 0, sub: {} };
      return uref().set(ME);
    });
  }
  function loadEv() {
    if (EV) return Promise.resolve(EV);
    return uref().collection("ev").get().then(function (q) { EV = {}; q.forEach(function (d) { EV[d.id] = (d.data() || {}).m || {}; }); return EV; });
  }
  function need() { return fbInit().then(function () { if (!uid()) throw { code: "relogin" }; return ME ? null : loadMe(); }); }
  function cleanItems(items) {
    function pic(p) { p = p || {}; var s = String(p.s || ""); if (!/^\/(suneung|middle|nonsul|advanced|seonsul)-korean\//.test(s) || s.indexOf("..") >= 0) return null; return { s: s, w: +p.w || 800, h: +p.h || 600 }; }
    function st(s, n) { return String(s == null ? "" : s).trim().slice(0, n); }
    return (items || []).slice(0, 60).map(function (x) {
      if (!/^(hak|seo|sn|non|adv):/.test(String(x.k || ""))) return null;
      return { k: String(x.k).slice(0, 90), a: st(x.a, 30), title: st(x.title, 120), topic: st(x.topic, 160), src: st(x.src, 200), nc: Math.max(0, Math.min(5, +x.nc || 0)),
        q: (x.q || []).slice(0, 6).map(pic).filter(Boolean), p: x.p && x.p.imgs ? { lab: st(x.p.lab, 60), imgs: x.p.imgs.slice(0, 6).map(pic).filter(Boolean) } : null,
        gm: x.gm && /^[a-z]\w?\d?-20\d\d[a-z]?$/.test(String(x.gm.e || "")) ? { e: String(x.gm.e), n: +x.gm.n || 0 } : null,
        txt: x.txt ? { pk: st(x.txt.pk, 80), pas: st(x.txt.pas, 6000), ask: st(x.txt.ask, 600), body: st(x.txt.body, 4000), ch: (x.txt.ch || []).slice(0, 5).map(function (c) { return st(c, 600); }) } : null };
    }).filter(Boolean);
  }
  function score(items, key, ans) { var sc = 0, n = 0; (items || []).forEach(function (it) { if (it.nc && key[it.k]) { n++; if (+ans[it.k] === key[it.k]) sc++; } }); return { sc: sc, n: n }; }
  function applyBatch(batch) {
    var ch = {}, now = Date.now();
    batch.forEach(function (b) {
      var k = String(b.k || ""); if (!/^(hak|seo|sn|non|adv):.{1,85}$/.test(k)) return;
      var g = k.split(":")[0], m = EV[g] || (EV[g] = {}), e = m[k], ok = b.ok ? 1 : 0, t = Math.min(now, +b.t || now), c = +b.c; c = c >= 1 && c <= 5 ? c : 0;
      if (e) { e[1] = ok; e[2] = (e[2] || 1) + 1; e[3] = t; if (b.a) e[4] = String(b.a).slice(0, 30); if (c) { if (e[4] == null) e[4] = ""; if (e[5] == null) e[5] = 0; e[6] = c; } }
      else m[k] = c ? [ok, ok, 1, t, String(b.a || "").slice(0, 30), c, c] : [ok, ok, 1, t, String(b.a || "").slice(0, 30)];
      (ch[g] = ch[g] || {})[k] = m[k];
      var d = day(t); ME.days[d] = (ME.days[d] || 0) + 1; if (t > (ME.last || 0)) ME.last = t;
    });
    var keep = Object.keys(ME.days).sort().slice(-150), nd = {}; keep.forEach(function (d) { nd[d] = ME.days[d]; }); ME.days = nd;
    ME.agg = aggOf(EV);
    return ch;
  }
  function writeBatch(ch, extra) {
    var wb = DB.batch(), u = uid();
    Object.keys(ch).forEach(function (g) { wb.set(uref(u).collection("ev").doc(g), { m: ch[g] }, { merge: true }); });
    var up = { agg: ME.agg, days: ME.days, last: ME.last || 0 }; if (extra) Object.keys(extra).forEach(function (k) { up[k] = extra[k]; });
    wb.update(uref(u), up);
    return wb.commit();
  }
  /* v106: 선택지별 응답 수 — {문항키: [무응답, ①, ②, ③, ④, ⑤]} */
  function respOf(items, subs) {
    var m = {};
    (items || []).forEach(function (it) { if (it.nc) m[it.k] = [0, 0, 0, 0, 0, 0]; });
    Object.keys(subs || {}).forEach(function (u) { var an = (subs[u] || {}).ans || {}; Object.keys(m).forEach(function (k) { var v = +an[k]; m[k][v >= 1 && v <= 5 ? v : 0]++; }); });
    return m;
  }
  function statDoc() { return DB.collection("asgKey").doc("_stat"); }
  /* v107: 학급 — asgKey/_cls { c: { 학급id: {name, own(담임 uid), ownId, ownName, at} } }. 선생님만 읽고 쓴다. 학생의 반은 users/{uid}.cls(학급 이름) */
  /* v108: 학급 여러 개 — cls 글자열을 줄바꿈으로 나눠 본다 */
  function clsOf(v) { return String(v || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean); }
  function inCls(v, name) { return clsOf(v).indexOf(name) >= 0; }
  function clsDoc() { return DB.collection("asgKey").doc("_cls"); }
  function clsGet() { return clsDoc().get().then(function (d) { return (d.data() || {}).c || {}; }).catch(function () { return {}; }); }
  function myId() { return idOf(AU.currentUser && AU.currentUser.email) || ""; }
  /* v113: 선생님 기능 켜고 끄기 — asgKey/_perm { p: { 선생님 uid: { asg, nt, cls, rs, live, mv: 0|1 } } }. 적혀 있지 않으면 쓸 수 있다. 관리자는 늘 모두 */
  var MYPERM = {};
  function permDoc() { return DB.collection("asgKey").doc("_perm"); }
  function permGet() { return permDoc().get().then(function (d) { return (d.data() || {}).p || {}; }).catch(function () { return {}; }); }
  function off(f) { return !ISADM && MYPERM && MYPERM[f] === 0; }
  var NOPERM = { ok: false, msg: "관리자가 이 기능을 꺼 두었어요." };
  function teacherRows() {
    return DB.collection("users").get().then(function (q) {
      var rows = []; q.forEach(function (d) { var x = d.data() || {}; if (x.moved || d.id === uid()) return; rows.push({ uid: d.id, id: x.id || "?", name: x.name || "", created: x.created || 0, sum: sumOf(x), sub: {}, mysub: x.sub || {}, ex: x.ex || {}, tch: x.tch ? 1 : 0 }); });
      return rows;
    });
  }
  var FBA = {
    siteSignup: function (id, pw, name) {
      name = String(name || "").replace(/\s+/g, " ").trim().slice(0, 20);
      if (!name) return Promise.resolve({ ok: false, msg: "이름을 적어 주세요." });
      if (!IDRE.test(String(id || ""))) return Promise.resolve({ ok: false, msg: "아이디는 2~12자 한글·영문·숫자로 적어 주세요." });
      if (String(pw || "").length < 6) return Promise.resolve({ ok: false, msg: "비밀번호는 6자 이상이에요." });
      return fbInit().then(function () { return AU.createUserWithEmailAndPassword(em(id), pw); }).then(function (c) {
        ME = { id: id, name: name, created: Date.now(), days: {}, agg: emptyAgg(), last: 0, sub: {} }; EV = {};
        return uref(c.user.uid).set(ME);
      }).then(function () { return { ok: true, id: id, token: "fb", sum: sumOf(ME) }; });
    },
    siteLogin: function (id, pw) {
      return fbInit().then(function () { return AU.signInWithEmailAndPassword(em(id), pw); }).then(function () { ME = EV = null; return loadMe(); })
        .then(function () { return { ok: true, id: ME.id, token: "fb", sum: sumOf(ME) }; });
    },
    siteResume: function () { return fbInit().then(function () { if (!uid()) return { ok: false }; return loadMe().then(function () { return { ok: true, id: ME.id, sum: sumOf(ME) }; }); }); },
    siteLogout: function () { return fbInit().then(function () { ME = EV = null; return AU.signOut(); }).then(function () { return { ok: true }; }); },
    siteSave: function (id, t, batch) {
      return need().then(loadEv).then(function () { var ch = applyBatch(batch || []); return writeBatch(ch).then(function () { return { ok: true, took: (batch || []).length }; }); });
    },
    siteMe: function () {
      return need().then(loadEv).then(function () {
        var w = []; Object.keys(EV).forEach(function (g) { Object.keys(EV[g]).forEach(function (k) { if (!EV[g][k][1]) w.push([k, EV[g][k][3]]); }); });
        w.sort(function (a, b) { return b[1] - a[1]; });
        return { ok: true, sum: sumOf(ME), wrong: w.slice(0, 200).map(function (x) { return x[0]; }) };
      });
    },
    siteAssignments: function () {
      return need().then(function () { return DB.collection("asg").orderBy("created").get(); }).then(function (q) {
        var list = []; q.forEach(function (d) { var a = d.data(); a.id = d.id; if (!a.cls || inCls(ME.cls, a.cls)) list.push(a); });
        return Promise.all(list.map(function (a) {
          var s = ME.sub[a.id]; a.done = s ? { at: s.at, sc: s.sc, n: s.n, ans: s.ans || {} } : null; a.st = (ME.ex || {})[a.id] || 0;
          if (!s) return a;
          return DB.collection("asgKey").doc(a.id).get().then(function (k) { a.key = (k.data() || {}).key || {}; return a; }).catch(function () { return a; });
        }));
      }).then(function (list) { return { ok: true, list: list }; });
    },
    siteSubmit: function (id, t, aid, ans) {
      var clean = {}, A = null;
      Object.keys(ans || {}).forEach(function (k) { var v = ans[k]; clean[k] = typeof v === "number" ? v : String(v || "").slice(0, 1500); });
      return need().then(function () { return DB.collection("asg").doc(aid).get(); }).then(function (d) {
        if (!d.exists) throw { code: "gone" }; A = d.data();
        var o = {}; o[uid()] = { at: Date.now(), ans: clean, id: ME.id };
        return DB.collection("subs").doc(aid).set(o, { merge: true });
      }).then(function () { return DB.collection("asgKey").doc(aid).get(); }).then(function (k) {
        var key = (k.data() || {}).key || {}, s = score(A.items, key, clean), now = Date.now();
        var batch = A.items.filter(function (it) { return it.nc && key[it.k]; }).map(function (it) { return { k: it.k, ok: +clean[it.k] === key[it.k], t: now, a: it.a || "" }; });
        return loadEv().then(function () {
          var ch = applyBatch(batch), done = { at: now, sc: s.sc, n: s.n, ans: clean };
          ME.sub[aid] = done; var ex = {}; ex["sub." + aid] = done;
          return writeBatch(ch, ex).then(function () { return { ok: true, sc: s.sc, n: s.n, key: key, done: done }; });
        });
      }).catch(function (e) {
        if (e && e.code === "gone") return { ok: false, msg: "없어진 과제예요." };
        if (e && /permission-denied/.test(e.code || "")) return { ok: false, msg: "이미 제출한 과제예요." };
        throw e;
      });
    },
    /* v106: 모의고사 시작 — 시작 시각을 내 문서에 적는다(다른 기기에서 이어 풀어도 같은 시각). 이미 시작했으면 그 시각을 돌려준다 */
    siteExamStart: function (id, t, aid) {
      aid = String(aid || ""); if (!/^s\d{6,}$/.test(aid)) return Promise.resolve({ ok: false, msg: "없는 모의고사예요." });
      return need().then(function () { return uref().get(); }).then(function (d) {
        var ex = (d.data() || {}).ex || {}; ME.ex = ex;
        if (ex[aid]) return { ok: true, st: ex[aid] };
        var now = Date.now(), up = {}; up["ex." + aid] = now; ex[aid] = now;
        return uref().update(up).then(function () { return { ok: true, st: now }; });
      });
    },
    siteNotices: function () {
      return need().then(function () { return DB.collection("notices").orderBy("created").get(); }).then(function (q) { var l = [], mine = ME.cls || ""; q.forEach(function (d) { var x = d.data(); x.id = d.id; if (!x.cls || inCls(mine, x.cls)) l.push(x); }); return { ok: true, list: l }; });
    },
    teacherPing: function () {
      return fbInit().then(function () {
        if (!uid()) return { ok: false, msg: "먼저 선생님 아이디로 들어가 주세요." };
        var no = { ok: false, msg: "선생님으로 등록되지 않은 아이디예요. 관리자에게 선생님 등록을 부탁해 주세요." };
        return DB.collection("admins").doc(uid()).get().catch(function () { return null; }).then(function (a) {
          if (a && a.exists) { ISADM = true; return { ok: true, admin: true }; }
          return DB.collection("teachers").doc(uid()).get().then(function (d) { if (!d.exists) return no; return permGet().then(function (p) { MYPERM = p[uid()] || {}; return { ok: true, admin: false, perm: MYPERM }; }); }).catch(function () { return no; });
        });
      });
    },
    teacherSite: function () {
      var rows, asg = [], CL = {}, PM = {}, TL = [];
      return fbInit().then(teacherRows).then(function (r) {
        rows = r; if (!ISADM) return null;
        return DB.collection("teachers").get().then(function (q) { var t = {}; q.forEach(function (d) { t[d.id] = 1; });
          rows.forEach(function (x) { if (t[x.uid] && !x.tch) uref(x.uid).update({ tch: 1 }).catch(function () {}); });
          TL = rows.filter(function (x) { return t[x.uid]; }).map(function (x) { return { uid: x.uid, id: x.id, name: x.name }; });
          rows = rows.filter(function (x) { return !t[x.uid]; }); });
      }).then(permGet).then(function (p) { PM = p; MYPERM = ISADM ? {} : (p[uid()] || {}); }).then(clsGet).then(function (c) {
        CL = c;
        if (!ISADM) return null;
        uref().update({ tch: 1 }).catch(function () {});
        /* 관리자: 학급 목록에 없는 옛 반 이름은 관리자 학급으로 넣어 둔다 */
        var have = {}, add = false; Object.keys(CL).forEach(function (k) { have[CL[k].name] = 1; });
        rows.forEach(function (r) { clsOf(r.sum.cls).forEach(function (n) { if (!have[n]) { have[n] = 1; add = true; CL["c" + Date.now() + Object.keys(CL).length] = { name: n, own: uid(), ownId: myId(), ownName: "", at: Date.now() }; } }); });
        return add ? clsDoc().set({ c: CL }).catch(function () { return null; }) : null;
      }).then(function () { return DB.collection("asg").orderBy("created").get(); }).then(function (q) {
        q.forEach(function (d) { var a = d.data(); a.id = d.id; asg.push(a); });
        return Promise.all(asg.map(function (a) {
          return Promise.all([DB.collection("asgKey").doc(a.id).get(), DB.collection("subs").doc(a.id).get()]).then(function (x) {
            a.key = (x[0].data() || {}).key || {}; var subs = x[1].data() || {};
            a.resp = respOf(a.items, subs); a.nsub = Object.keys(subs).length;
            rows.forEach(function (r) { var s = subs[r.uid]; if (s) { var sc = score(a.items, a.key, s.ans || {}); r.sub[a.id] = { at: s.at, sc: sc.sc, n: sc.n, ans: s.ans || {}, tries: 1, dur: r.ex[a.id] && s.at > r.ex[a.id] ? s.at - r.ex[a.id] : 0 }; } });
          });
        }));
      }).then(function () { return DB.collection("notices").orderBy("created").get(); }).then(function (q) {
        var nt = []; q.forEach(function (d) { var x = d.data(); x.id = d.id; nt.push(x); });
        return statDoc().get().then(function (d) { return (d.data() || {}).it || {}; }).catch(function () { return {}; }).then(function (stat) {
          TROWS = rows; return { ok: true, at: Date.now(), rows: rows, asg: asg, nt: nt, g: G, stat: stat, cls: CL, perm: PM, tch: TL, me: { uid: uid(), id: myId(), name: (ME && ME.name) || "", admin: ISADM, perm: MYPERM } };
        });
      });
    },
    teacherStudent: function (pw, id) {
      var r = (TROWS || []).filter(function (x) { return x.id === id; })[0];
      if (!r) return Promise.resolve({ ok: false, msg: "없는 학생이에요." });
      return uref(r.uid).collection("ev").get().then(function (q) {
        var ev = []; q.forEach(function (d) { var m = (d.data() || {}).m || {}; Object.keys(m).forEach(function (k) { var e = m[k]; ev.push({ k: k, f: e[0], o: e[1], c: e[2], t: e[3], a: e[4] || "", p1: e[5] || 0, p: e[6] || e[5] || 0 }); }); });
        ev.sort(function (a, b) { return b.t - a.t; });
        return { ok: true, id: id, sum: r.sum, ev: ev.slice(0, 300), sub: r.sub };
      });
    },
    /* v110: 혼자 푼 문제의 첫 응답 — 학생들(ids)의 기록에서 문항·선택지별로 센다. {문항키: {c:[0,①..⑤], ok(첫 풀이에 맞힌 수), ans(맞힌 학생이 고른 번호), a(영역)}} */
    teacherChoices: function (pw, ids) {
      var want = {}; (ids || []).forEach(function (x) { want[x] = 1; });
      var rows = (TROWS || []).filter(function (r) { return !ids || want[r.id]; }).slice(0, 400), m = {};
      return Promise.all(rows.map(function (r) {
        return uref(r.uid).collection("ev").get().then(function (q) {
          q.forEach(function (d) { var mm = (d.data() || {}).m || {}; Object.keys(mm).forEach(function (k) {
            var e = mm[k], c = +e[5]; if (!(c >= 1 && c <= 5)) return;
            var o = m[k] || (m[k] = { c: [0, 0, 0, 0, 0, 0], ok: 0, ans: 0, a: e[4] || "" });
            o.c[c]++; if (e[0]) { o.ok++; o.ans = c; }
          }); });
        }).catch(function () { return null; });
      })).then(function () { return { ok: true, m: m, n: rows.length }; });
    },
    saveSiteAssign: function (pw, a) {
      if (off("asg")) return Promise.resolve(NOPERM);
      a = a || {}; var items = cleanItems(a.items);
      if (!items.length) return Promise.resolve({ ok: false, msg: "문제를 한 개 이상 넣어 주세요." });
      var key = {}; items.forEach(function (it) { var v = +((a.key || {})[it.k]); if (it.nc && v >= 1 && v <= it.nc) key[it.k] = v; });
      var id = /^s\d{6,}$/.test(String(a.id || "")) ? a.id : "s" + Date.now(), wb = DB.batch();
      var doc = { title: String(a.title || "").trim().slice(0, 60) || "선생님이 낸 과제", msg: String(a.msg || "").trim().slice(0, 400),
        due: /^\d{4}-\d{2}-\d{2}$/.test(String(a.due || "")) ? a.due : "", cls: String(a.cls || "").trim().slice(0, 20), items: items, created: Date.now(), by: uid(), byId: myId() };
      var mn = Math.round(+a.min || 0);
      if (a.mode === "exam") { if (!(mn >= 1)) return Promise.resolve({ ok: false, msg: "모의고사는 제한 시간(분)을 넣어 주세요." }); doc.mode = "exam"; doc.min = Math.min(300, mn); }
      wb.set(DB.collection("asg").doc(id), doc);
      wb.set(DB.collection("asgKey").doc(id), { key: key });
      return wb.commit().then(function () { return { ok: true, id: id }; });
    },
    deleteSiteAssign: function (pw, aid) {
      aid = String(aid || ""); if (!/^s\d{6,}$/.test(aid)) return Promise.resolve({ ok: false, msg: "없는 과제예요." });
      /* v106: 지우기 전에 선택지별 응답 수와 '낸 적 있는 문항'을 보관함(asgKey/_stat, 선생님만 읽음)에 더해 둔다 */
      var keep = Promise.all([DB.collection("asg").doc(aid).get(), DB.collection("asgKey").doc(aid).get(), DB.collection("subs").doc(aid).get(), statDoc().get()]).then(function (x) {
        var a = x[0].data() || {}, key = (x[1].data() || {}).key || {}, old = (x[3].data() || {}).it || {}, resp = respOf(a.items, x[2].data() || {}), it = {};
        (a.items || []).forEach(function (q) {
          var o = old[q.k] || {}, c = (o.c || [0, 0, 0, 0, 0, 0]).slice(0, 6), r = resp[q.k];
          if (r) for (var i = 0; i < 6; i++) c[i] = (+c[i] || 0) + r[i];
          it[q.k] = { t: String(q.title || "").slice(0, 80), a: String(q.a || "").slice(0, 30), nc: q.nc || 0, ans: key[q.k] || o.ans || 0, c: c, u: (o.u || 0) + 1, at: a.created || Date.now() };
        });
        return Object.keys(it).length ? statDoc().set({ it: it }, { merge: true }) : null;
      }).catch(function () { return null; });
      return keep.then(function () {
        var wb = DB.batch(); ["asg", "asgKey", "subs"].forEach(function (c) { wb.delete(DB.collection(c).doc(aid)); });
        return wb.commit();
      }).then(function () { return FBA.teacherSite(); }).then(function (r) { return { ok: true, list: r.asg, stat: r.stat }; });
    },
    /* v104: 이름 — 학생이 스스로(siteSetName), 선생님이 학생 것을(setName) */
    siteSetName: function (name) {
      name = String(name || "").replace(/\s+/g, " ").trim().slice(0, 20); if (!name) return Promise.resolve({ ok: false, msg: "이름을 적어 주세요." });
      return need().then(function () { return uref(uid()).update({ name: name }); }).then(function () { ME.name = name; return { ok: true, sum: sumOf(ME) }; });
    },
    setName: function (pw, id, name) {
      var r = (TROWS || []).filter(function (x) { return x.id === id; })[0]; if (!r) return Promise.resolve({ ok: false, msg: "없는 학생이에요." });
      name = String(name || "").replace(/\s+/g, " ").trim().slice(0, 20);
      return uref(r.uid).update({ name: name }).then(function () { r.name = name; return { ok: true }; });
    },
    setClass: function (pw, id, cls) {
      var r = (TROWS || []).filter(function (x) { return x.id === id; })[0]; if (!r) return Promise.resolve({ ok: false, msg: "없는 학생이에요." });
      /* 학급 이름 하나 또는 여러 개(배열·줄바꿈). 같은 이름은 한 번만, 여덟 개까지 */
      var seen = {}, list = (Array.isArray(cls) ? cls : clsOf(cls)).map(function (x) { return String(x || "").replace(/\s+/g, " ").trim().slice(0, 20); }).filter(function (x) { if (!x || seen[x]) return false; seen[x] = 1; return true; }).slice(0, 8), v = list.join("\n");
      return uref(r.uid).update({ cls: v }).then(function () { r.sum.cls = v; return { ok: true, cls: v }; });
    },
    /* v107: 학급 만들기·지우기, 내 학급 목록 */
    classSave: function (pw, name) {
      if (off("cls")) return Promise.resolve(NOPERM);
      name = String(name || "").replace(/\s+/g, " ").trim().slice(0, 20); if (!name) return Promise.resolve({ ok: false, msg: "학급 이름을 적어 주세요." });
      return need().then(clsGet).then(function (c) {
        if (Object.keys(c).some(function (k) { return c[k].name === name; })) return { ok: false, msg: "이미 있는 학급 이름이에요." };
        c["c" + Date.now()] = { name: name, own: uid(), ownId: myId(), ownName: (ME && ME.name) || "", at: Date.now() };
        return clsDoc().set({ c: c }).then(function () { return { ok: true, cls: c }; });
      });
    },
    /* v117: 관리자가 학급의 담임을 바꾼다 — 담임은 관리자 자신이거나 선생님으로 등록된 아이디 */
    classOwner: function (pw, cid, tuid) {
      if (!ISADM) return Promise.resolve({ ok: false, msg: "관리자만 담임을 바꿀 수 있어요." });
      tuid = String(tuid || "");
      var who = tuid === uid() ? Promise.resolve({ id: myId(), name: (ME && ME.name) || "" })
        : DB.collection("teachers").doc(tuid).get().then(function (t) {
          if (!t.exists) return null;
          return uref(tuid).get().then(function (u) { var x = u.data() || {}; return { id: x.id || (t.data() || {}).id || "?", name: x.name || "" }; });
        });
      return who.then(function (w) {
        if (!w) return { ok: false, msg: "선생님으로 등록된 아이디가 아니에요." };
        return clsDoc().get().then(function (d) {
          var c = (d.data() || {}).c || {};
          if (!c[cid]) return { ok: false, msg: "없는 학급이에요." };
          c[cid].own = tuid; c[cid].ownId = w.id; c[cid].ownName = w.name;
          return clsDoc().set({ c: c }).then(function () { return { ok: true, cls: c }; });
        });
      });
    },
    classDelete: function (pw, cid) {
      return clsGet().then(function (c) {
        var x = c[cid]; if (!x) return { ok: false, msg: "없는 학급이에요." };
        if (x.own !== uid() && !ISADM) return { ok: false, msg: "담임 선생님이나 관리자만 지울 수 있어요." };
        delete c[cid];
        var wb = DB.batch(); (TROWS || []).filter(function (r) { return inCls(r.sum.cls, x.name); }).slice(0, 400).forEach(function (r) { var v = clsOf(r.sum.cls).filter(function (n) { return n !== x.name; }).join("\n"); r.sum.cls = v; wb.update(uref(r.uid), { cls: v }); });
        wb.set(clsDoc(), { c: c });
        return wb.commit().then(function () { return { ok: true, cls: c }; });
      });
    },
    teacherClasses: function () {
      return fbInit().then(function () { return DB.collection("admins").doc(uid()).get().catch(function () { return null; }); }).then(function (a) {
        var adm = !!(a && a.exists);
        return clsGet().then(function (c) { return { ok: true, admin: adm, list: Object.keys(c).map(function (k) { return c[k]; }).filter(function (x) { return adm || x.own === uid(); }).map(function (x) { return x.name; }).sort() }; });
      });
    },
    saveNotice: function (pw, n) {
      if (off("nt")) return Promise.resolve(NOPERM);
      n = n || {}; var t = String(n.title || "").trim().slice(0, 60); if (!t) return Promise.resolve({ ok: false, msg: "제목을 적어 주세요." });
      return DB.collection("notices").doc("n" + Date.now()).set({ title: t, body: String(n.body || "").trim().slice(0, 1000), created: Date.now(), cls: String(n.cls || "").trim().slice(0, 20), by: uid(), byId: myId() })
        .then(function () { return FBA.siteNoticesT(); });
    },
    deleteNotice: function (pw, nid) { return DB.collection("notices").doc(nid).delete().then(function () { return FBA.siteNoticesT(); }); },
    siteNoticesT: function () { return DB.collection("notices").orderBy("created").get().then(function (q) { var l = []; q.forEach(function (d) { var x = d.data(); x.id = d.id; l.push(x); }); return { ok: true, list: l }; }); },
    /* 관리자: 선생님 목록·등록·해제 */
    setPerm: function (pw, tuid, perm) {
      if (!ISADM) return Promise.resolve({ ok: false, msg: "관리자만 바꿀 수 있어요." });
      var v = {}; ["asg", "nt", "cls", "rs", "live", "mv"].forEach(function (f) { v[f] = perm && perm[f] === 0 ? 0 : 1; });
      var part = {}; part[String(tuid)] = v;
      return permDoc().set({ p: part }, { merge: true }).then(function () { return { ok: true, perm: v }; });
    },
    /* v113: 선생님이 볼 과제(관리자: 모두, 선생님: 내가 냈거나 내 학급 것) + 정답 */
    teacherAssignments: function () {
      return FBA.teacherPing().then(function (pg) { if (!pg.ok) throw { code: "noteacher" }; return need(); }).then(function () { return Promise.all([DB.collection("asg").orderBy("created").get(), clsGet()]); }).then(function (r) {
        var mine = {}, me = uid(), list = []; Object.keys(r[1]).forEach(function (k) { if (r[1][k].own === me) mine[r[1][k].name] = 1; });
        r[0].forEach(function (d) { var a = d.data(); a.id = d.id; if (ISADM || a.by === me || (a.cls && mine[a.cls]) || (!a.by && !a.cls)) list.push(a); });
        return Promise.all(list.map(function (a) { a.t = 1; a.done = null; return DB.collection("asgKey").doc(a.id).get().then(function (k) { a.key = (k.data() || {}).key || {}; return a; }).catch(function () { a.key = {}; return a; }); }));
      }).then(function (list) { return { ok: true, list: list }; }).catch(function (e) { if (e && e.code === "noteacher") return { ok: true, list: [] }; throw e; });
    },
    teacherList: function () {
      return DB.collection("teachers").get().then(function (q) { var l = []; q.forEach(function (d) { var x = d.data() || {}; l.push({ uid: d.id, id: x.id || "?", at: x.at || 0 }); }); return { ok: true, list: l }; });
    },
    teacherAdd: function (pw, id) {
      id = String(id || "").trim();
      return DB.collection("users").where("id", "==", id).get().then(function (q) {
        var d = q.docs.filter(function (x) { return !(x.data() || {}).moved; })[0];
        if (!d) return { ok: false, msg: "'" + id + "' 아이디가 없어요. 그 선생님이 사이트에서 아이디를 먼저 만들어야 해요." };
        return DB.collection("teachers").doc(d.id).set({ id: id, at: Date.now() }).then(function () { return uref(d.id).update({ tch: 1 }).catch(function () { return null; }); }).then(function () { return FBA.teacherList(); });
      });
    },
    teacherRemove: function (pw, tuid) {
      if (tuid === uid()) return Promise.resolve({ ok: false, msg: "자기 자신은 뺄 수 없어요." });
      return DB.collection("teachers").doc(tuid).delete().then(function () { return uref(tuid).update({ tch: 0 }).catch(function () { return null; }); }).then(function () { return FBA.teacherList(); });
    },
    /* 비밀번호를 잊은 학생: 새 아이디를 만들게 한 뒤, 옛 아이디의 기록을 새 아이디로 옮긴다 */
    moveStudent: function (pw, fromId, toId) {
      if (off("mv")) return Promise.resolve(NOPERM);
      var a = (TROWS || []).filter(function (x) { return x.id === fromId; })[0], b = (TROWS || []).filter(function (x) { return x.id === toId; })[0];
      if (!a || !b || a === b) return Promise.resolve({ ok: false, msg: "두 아이디를 확인해 주세요(새 아이디로 먼저 들어와 있어야 해요)." });
      var ua, ub, ea = {}, eb = {};
      return Promise.all([uref(a.uid).get(), uref(b.uid).get(), uref(a.uid).collection("ev").get(), uref(b.uid).collection("ev").get()]).then(function (x) {
        ua = x[0].data() || {}; ub = x[1].data() || {};
        x[2].forEach(function (d) { ea[d.id] = (d.data() || {}).m || {}; }); x[3].forEach(function (d) { eb[d.id] = (d.data() || {}).m || {}; });
        Object.keys(ea).forEach(function (g) { var m = eb[g] || (eb[g] = {}); Object.keys(ea[g]).forEach(function (k) { if (!m[k] || m[k][3] < ea[g][k][3]) m[k] = ea[g][k]; }); });
        var days = Object.assign({}, ub.days || {}); Object.keys(ua.days || {}).forEach(function (d) { days[d] = (days[d] || 0) + ua.days[d]; });
        var sub = Object.assign({}, ua.sub || {}, ub.sub || {});
        var wb = DB.batch();
        Object.keys(eb).forEach(function (g) { wb.set(uref(b.uid).collection("ev").doc(g), { m: eb[g] }); });
        wb.update(uref(b.uid), { agg: aggOf(eb), days: days, sub: sub, last: Math.max(ua.last || 0, ub.last || 0), cls: ua.cls || ub.cls || "" });
        wb.update(uref(a.uid), { moved: toId });
        return wb.commit();
      }).then(function () {
        return DB.collection("asg").get().then(function (q) {
          var ids = []; q.forEach(function (d) { ids.push(d.id); });
          return Promise.all(ids.map(function (aid) {
            return DB.collection("subs").doc(aid).get().then(function (s) { var x = s.data() || {}; if (x[a.uid] && !x[b.uid]) { var o = {}; o[b.uid] = x[a.uid]; return DB.collection("subs").doc(aid).set(o, { merge: true }); } });
          }));
        });
      }).then(function () { return { ok: true }; });
    }
  };
  function fbCall(fn, args) {
    var f = FBA[fn]; if (!f) return Promise.resolve({ ok: false, msg: "없는 기능이에요." });
    var p; try { p = f.apply(null, args || []); } catch (e) { p = Promise.reject(e); }
    return Promise.resolve(p).catch(function (e) { if (e && e.code === "relogin") return { ok: false, relogin: true }; return { ok: false, msg: errMsg(e) }; });
  }
  var S = ls(SKEY), SUM = null, ASG = null, NT = null;
  /* v102: 선생님·관리자 구분 — 들어올 때 한 번 확인해 두고(kma.role), 화면마다 같은 모양으로 보인다 */
  var RL = ls("kma.role"), ROLE = RL && S && RL.id === S.id ? RL.r : null, PERM = (RL && RL.p) || {};
  function can(f) { return ROLE === "admin" || (!!ROLE && !(PERM && PERM[f] === 0)); }
  function setRole(r, perm) {
    ROLE = r || ""; PERM = (ROLE === "teacher" && perm) || {}; ls("kma.role", S ? { id: S.id, r: ROLE, p: PERM } : null);
    if (ROLE) ss("kma.tpw", "fb"); else { try { sessionStorage.removeItem("kma.tpw"); } catch (e) {} }
    try { document.dispatchEvent(new CustomEvent("kma:role", { detail: ROLE })); } catch (e) {}
    if (typeof paintPill === "function" && pill) { paintPill(); paintTnav(); paintTab(); }
  }
  function checkRole() {
    if (!FBCFG || !S) return Promise.resolve(ROLE);
    return call("teacherPing", []).then(function (r) { setRole(r && r.ok ? (r.admin ? "admin" : "teacher") : "", r && r.perm); return ROLE; }).catch(function () { return ROLE; });
  }
  if (ROLE) ss("kma.tpw", "fb");
  /* v104: 문지기 — gate.js 가 html.kma-locked 를 붙여 두면 로그인 창만 보인다 */
  var HUB = "/suneung-korean/", LOCKED = document.documentElement.classList.contains("kma-locked");
  function nextUrl() { try { var n = new URLSearchParams(location.search).get("next") || ""; return /^\/(suneung|middle|nonsul|advanced|seonsul)-korean\//.test(n) ? n : ""; } catch (e) { return ""; } }
  function enter() { var n = nextUrl(); if (n) location.replace(n); else location.reload(); }      /* 로그인한 뒤: 화면 다시 열기 */
  function lockOut() { S = null; ls(SKEY, null); ls("kma.role", null); try { sessionStorage.removeItem("kma.tpw"); } catch (e) {} if (location.pathname.replace(/index\.html$/, "") === HUB) location.reload(); else location.href = HUB; }
  window.KMA = {
    on: !!(FBCFG || KMA_URL), fb: !!FBCFG, url: KMA_URL, call: call, user: function () { return S && S.id; },
    teacher: function () { return ss("kma.tpw") || ""; },
    role: function () { return ROLE || ""; },
    can: can,
    fbApp: FBCFG ? function () { return fbInit().then(function () { return firebase.apps.filter(function (a) { return a.name === "kma"; })[0] || null; }); } : null,
    liveAsg: function (aid, ratio) { liveAsg(aid, ratio); },
    name: function () { return (SUM && SUM.name) || ""; },
    record: record, assign: assign, open: function () { openPanel(); }, G: G, gate: false, logout: function () { logout(); }
  };
  if (NOUI) window.KMA.logout = function () { var go = function () { lockOut(); }; call("siteLogout", []).then(go, go); };
  if (!(FBCFG || KMA_URL) || NOUI) return;

  /* ---------- 모양 ---------- */
  var css = document.createElement("style");
  css.textContent = [
    ".kma{--k-ink:#232323;--k-sub:#6b6b6b;--k-faint:#9a9a9a;--k-line:#e6e3dd;--k-bg:#fdfcfa;--k-soft:#f4f2ee;--k-brand:#2c4a6b;--k-ok:#1f7a4d;--k-no:#b33a2b;font-family:inherit;color:var(--k-ink)}",
    "@media (prefers-color-scheme:dark){.kma{--k-ink:#ece9e4;--k-sub:#b5b0a8;--k-faint:#8a857e;--k-line:#3a3733;--k-bg:#1d1c1a;--k-soft:#2a2825;--k-brand:#9cc0e4;--k-ok:#5fd09a;--k-no:#f08a7a}}",
    ".kma-pill{position:fixed;right:18px;bottom:18px;z-index:80;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--k-line);background:var(--k-bg);color:var(--k-ink);border-radius:999px;padding:9px 16px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.08)}",
    ".kma-pill i{font-style:normal;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--k-brand);color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center}",
    ".kma-pill.kma-off{color:var(--k-sub);font-weight:500}",
    "body:has(.bk-bar.show) .kma-pill{bottom:86px}",
    ".kma-dim{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;padding:16px}",
    ".kma-dim[hidden]{display:none}",
    ".kma-box{width:min(560px,100%);max-height:88vh;overflow:auto;background:var(--k-bg);border-radius:20px;padding:26px 26px 22px;box-shadow:0 20px 60px rgba(0,0,0,.18)}",
    ".kma h2{font-size:21px;font-weight:700;margin:0 0 4px;letter-spacing:-.02em}.kma h3{font-size:15px;font-weight:700;margin:22px 0 8px}",
    ".kma p.s{color:var(--k-sub);font-size:13.5px;margin:0 0 16px;line-height:1.6}",
    ".kma label.f{display:block;font-size:13px;font-weight:600;color:var(--k-sub);margin:12px 0 6px}",
    ".kma input[type=text],.kma input[type=password],.kma input[type=date],.kma textarea{width:100%;box-sizing:border-box;border:1px solid var(--k-line);border-radius:10px;background:transparent;padding:11px 13px;font:inherit;font-size:15px;color:inherit}",
    ".kma textarea{min-height:120px;line-height:1.7;resize:vertical}",
    ".kma .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:16px}",
    ".kma .btn{border:1px solid var(--k-line);background:transparent;color:inherit;border-radius:999px;padding:10px 18px;font:inherit;font-size:14px;font-weight:600;cursor:pointer}",
    ".kma .btn.pri{background:var(--k-brand);border-color:var(--k-brand);color:#fff}.kma .btn:disabled{opacity:.4;cursor:default}",
    ".kma .lnk{border:0;background:none;padding:0;color:var(--k-brand);font:inherit;font-size:13.5px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}",
    ".kma .msg{min-height:20px;font-size:13.5px;color:var(--k-no);margin-top:10px}",
    ".kma .tabs{display:flex;gap:4px;border-bottom:1px solid var(--k-line);margin:6px 0 4px}.kma .tabs button{border:0;background:none;font:inherit;font-size:14.5px;padding:10px 12px;color:var(--k-sub);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}.kma .tabs button.on{color:var(--k-ink);font-weight:700;border-color:var(--k-ink)}",
    ".kma .stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 4px}.kma .stat div{background:var(--k-soft);border-radius:12px;padding:12px}.kma .stat b{display:block;font-size:20px}.kma .stat small{color:var(--k-sub);font-size:12px}",
    ".kma .bars{display:grid;gap:7px;margin-top:6px}.kma .bars div{display:grid;grid-template-columns:130px 1fr 70px;gap:10px;align-items:center;font-size:13px}.kma .bars em{display:block;height:6px;border-radius:3px;background:var(--k-soft);overflow:hidden}.kma .bars em i{display:block;height:100%;background:var(--k-brand);opacity:.75}.kma .bars small{color:var(--k-sub);text-align:right}",
    ".kma ul.al{list-style:none;margin:0;padding:0;border-top:1px solid var(--k-line)}.kma ul.al li{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:12px 2px;border-bottom:1px solid var(--k-line);font-size:14.5px}",
    ".kma ul.al small{display:block;color:var(--k-faint);font-size:12.5px;margin-top:2px}.kma .tag{font-size:12.5px;border-radius:999px;padding:3px 10px;background:var(--k-soft);color:var(--k-sub);white-space:nowrap}.kma .tag.done{color:var(--k-ok)}",
    ".kma .nt{background:var(--k-soft);border-radius:12px;padding:12px 14px;margin-bottom:8px;font-size:14px;line-height:1.65}.kma .nt b{display:block;margin-bottom:2px}",
    /* 과제 풀기 */
    ".kma-run{position:fixed;inset:0;z-index:95;background:var(--k-bg);overflow:auto}.kma-run[hidden]{display:none}",
    "body.kma-running .live-panel{z-index:99;bottom:78px}body.kma-running .live-menu{z-index:100}body.kma-running .kt-toast{z-index:101;bottom:96px}",
    ".kma-run .in{max-width:860px;margin:0 auto;padding:14px 14px 120px}",
    ".kma-run .top{position:sticky;top:0;background:var(--k-bg);display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--k-line);z-index:2}",
    ".kma-run .q{border-bottom:1px solid var(--k-line);padding:22px 0}.kma-run .qh{font-size:13px;color:var(--k-sub);margin-bottom:10px}.kma-run .qh b{color:var(--k-ink);font-size:15px;margin-right:6px}",
    ".kma-run img{display:block;max-width:100%;height:auto;margin:8px 0;border-radius:6px}",
    ".kma-run .pas{border:1px solid var(--k-line);border-radius:12px;padding:14px 16px;font-size:15px;line-height:1.85;white-space:pre-wrap;word-break:keep-all;margin-bottom:10px}",
    ".kma-run .ask{font-size:16px;font-weight:600;line-height:1.6;margin:8px 0;word-break:keep-all}",
    ".kma-run .chs{display:grid;gap:6px;margin-top:10px}.kma-run .ch{display:flex;gap:10px;text-align:left;border:1px solid var(--k-line);background:none;color:inherit;border-radius:10px;padding:10px 14px;font:inherit;font-size:15px;line-height:1.6;cursor:pointer;word-break:keep-all}",
    ".kma-run .nums{display:flex;gap:8px;margin-top:10px}.kma-run .nums .ch{width:46px;height:46px;justify-content:center;align-items:center;padding:0;font-size:18px;border-radius:50%}",
    ".kma-run .ch.sel{border-color:var(--k-brand);box-shadow:inset 0 0 0 1px var(--k-brand)}.kma-run .ch.ok{border-color:var(--k-ok);background:rgba(31,122,77,.08)}.kma-run .ch.no{border-color:var(--k-no);background:rgba(179,58,43,.07)}",
    ".kma-run .res{font-size:14px;margin-top:8px}.kma-run .res.ok{color:var(--k-ok)}.kma-run .res.no{color:var(--k-no)}",
    ".kma-run .tm{font-variant-numeric:tabular-nums;font-weight:700;font-size:16px;border:1px solid var(--k-line);border-radius:999px;padding:7px 14px;white-space:nowrap}.kma-run .tm.low{color:var(--k-no);border-color:var(--k-no)}",
    ".kma-run .xs{max-width:520px;margin:9vh auto 0;text-align:center}.kma-run .xs h2{font-size:26px;margin:0 0 6px}.kma-run .xs .big{font-size:17px;margin:0 0 18px}.kma-run .xs ul{text-align:left;margin:0 auto 22px;padding:16px 18px 16px 34px;background:var(--k-soft);border-radius:14px;font-size:14.5px;line-height:1.8;color:var(--k-sub)}",
    ".kma select{width:100%;box-sizing:border-box;border:1px solid var(--k-line);border-radius:10px;padding:11px 12px;font:inherit;font-size:15px;background:var(--k-bg);color:inherit}.kma input:disabled{opacity:.45}",
    ".kma-tab{display:inline-flex;align-items:center;gap:6px;font-weight:700;cursor:pointer;white-space:nowrap}.kma-tab i{font-style:normal;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#2c4a6b;color:#fff;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}",
    ".kma-tab.kma-float{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:79;border:1px solid var(--k-line);background:var(--k-bg);color:var(--k-ink);border-radius:999px;padding:8px 16px;font:inherit;font-size:14.5px;box-shadow:0 4px 14px rgba(0,0,0,.1)}",
    ".kma .ntp{max-height:52vh;overflow:auto;margin:10px 0 0}.kma .ntp .nt small{display:block;color:var(--k-faint);font-size:12.5px;margin-top:4px}",
    "@media print{.kma-tab.kma-float{display:none!important}}",
    ".kma-run .foot{position:fixed;left:0;right:0;bottom:0;background:var(--k-bg);border-top:1px solid var(--k-line);padding:12px 18px;display:flex;justify-content:center;gap:10px;align-items:center}",
    "@media (max-width:560px){.kma .bars div{grid-template-columns:96px 1fr 58px}.kma-box{padding:22px 18px}}",
    ".kma-pill em{font-style:normal;font-size:12px;font-weight:700;color:var(--k-sub);border-right:1px solid var(--k-line);padding-right:8px}",
    ".kma-pill.kma-t{border-color:var(--k-brand);color:var(--k-brand)}.kma-pill.kma-t em{color:#fff;background:var(--k-brand);border:0;border-radius:999px;padding:2px 8px;margin-left:-6px}",
    ".kma .who{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--k-line);border-radius:12px;overflow:hidden;margin:0 0 16px}",
    ".kma .who button{border:0;background:none;font:inherit;font-size:15px;padding:12px 8px;color:var(--k-sub);cursor:pointer;line-height:1.3}.kma .who button small{display:block;font-size:12px;color:var(--k-faint);font-weight:500;margin-top:2px}",
    ".kma .who button.on{background:var(--k-ink);color:var(--k-bg);font-weight:700}.kma .who button.on small{color:inherit;opacity:.75}",
    ".kma .who button+button{border-left:1px solid var(--k-line)}",
    ".kma .tbox{border:1px solid var(--k-line);border-radius:14px;padding:16px;margin:4px 0 12px}.kma .tbox ul{margin:8px 0 0;padding-left:18px;font-size:13.5px;color:var(--k-sub);line-height:1.8}",
    ".kma-dim.kma-gate{background:var(--k-bg);align-items:flex-start;overflow:auto;padding:6vh 16px 40px}.kma-gate .kma-box{box-shadow:none;border:1px solid var(--k-line);max-height:none;width:min(440px,100%)}",
    ".kma .brand{text-align:center;margin:0 0 22px}.kma .brand b{display:block;font-family:\"YongbiTitle\",\"Noto Serif KR\",serif;font-weight:400;font-size:34px;letter-spacing:-.02em;color:var(--k-ink)}.kma .brand small{display:block;color:var(--k-faint);font-size:13.5px;margin-top:4px}",
    ".kma .tl{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:0 0 4px}.kma .tl a{display:block;text-align:center;text-decoration:none;border:1px solid var(--k-line);border-radius:12px;padding:14px 8px;font-size:15px;font-weight:700;color:var(--k-ink)}.kma .tl a:hover{border-color:var(--k-brand);color:var(--k-brand)}",
    ".kma .nm{display:flex;gap:8px;align-items:center;background:var(--k-soft);border-radius:12px;padding:10px 12px;margin:0 0 12px;font-size:13.5px}.kma .nm input{flex:1;min-width:0;padding:8px 10px!important;font-size:14px!important;background:var(--k-bg)!important}",
    "[data-kma-tnav]{display:contents}[data-kma-tnav] a{font-weight:700}",
    "@media print{.kma-pill,.kma-dim{display:none!important}}"
  ].join("\n");
  document.head.appendChild(css);

  var pill = document.createElement("button"); pill.type = "button"; pill.className = "kma kma-pill";
  var dim = document.createElement("div"); dim.className = "kma kma-dim"; dim.hidden = true;
  dim.innerHTML = '<div class="kma-box" role="dialog" aria-modal="true" aria-labelledby="kmaH"></div>';
  var run = document.createElement("div"); run.className = "kma kma-run"; run.hidden = true;
  var rsT = null;
  run.addEventListener("scroll", function () { if (!(ROLE && window.Live && Live.asgScroll)) return; clearTimeout(rsT); rsT = setTimeout(function () { var h = run.scrollHeight - run.clientHeight; Live.asgScroll(h > 0 ? Math.round(run.scrollTop / h * 1000) / 1000 : 0); }, 250); }, { passive: true });
  function mount() {
    document.body.appendChild(pill); document.body.appendChild(dim); document.body.appendChild(run); paintPill(); paintTnav(); paintTab();
    window.KMA.gate = true;
    if (LOCKED) { dim.classList.add("kma-gate"); dim.hidden = false; setTimeout(function () { loginView("in"); }, 0); }
    else if (S && nextUrl()) location.replace(nextUrl());
  }
  /* 선생님: 첫 화면 위 메뉴에 학생 현황·과제·공지 */
  function paintTnav() {
    var el = document.querySelector("[data-kma-tnav]"); if (!el) return;
    var T = "/suneung-korean/teacher.html";
    el.innerHTML = S && ROLE ? '<a href="' + T + '#st">학생 현황</a><a href="' + T + '#asg">과제</a><a href="' + T + '#nt">공지</a>' + (ROLE === "admin" ? '<a href="' + T + '#adm">선생님 관리</a>' : "") : "";
  }
  /* v107: 학생 화면 위쪽 '과제' 탭 — 화면 머리의 메뉴에 넣고, 메뉴가 없거나 안 보이면 위쪽 가운데에 띄운다 */
  var topTab = null, tabT = null, tabFloat = false, tabFront = false;
  function navOf() { return document.querySelector("[data-kma-tnav]") || document.querySelector("header.gnb .gnb-nav, header.top nav, header.topbar .nav, header.topbar .gnb-nav"); }
  function paintTab(retry) {
    if (!(S && !ROLE && !LOCKED)) { if (topTab) { topTab.remove(); topTab = null; } return; }
    var nav = navOf(), n = todo(), inNav = false;
    if (!topTab) {
      topTab = document.createElement("a"); topTab.href = "#"; topTab.setAttribute("role", "button");
      topTab.onclick = function (e) { e.preventDefault(); tab = "asg"; openPanel(); };
    }
    if (retry) tabFloat = tabFront = false;
    if (nav && !tabFloat) {
      var sib = nav.querySelector("a:not(.kma-tab), button:not(.kma-tab)") || (nav.closest("nav") || nav).querySelector("a:not(.kma-tab), button:not(.kma-tab)");
      var host = tabFront ? (nav.closest("nav") || nav) : nav;
      if (topTab.parentNode !== host) { if (tabFront) host.insertBefore(topTab, host.firstChild); else host.appendChild(topTab); }
      topTab.className = "kma-tab" + (sib && sib.className ? " " + String(sib.className).replace(/\b(active|on|home)\b/g, "").trim() : "");
      inNav = topTab.getClientRects().length > 0;
      if (!inNav) tabFloat = true;
      else if (!tabFront) { var rc = topTab.getBoundingClientRect();      /* 좁은 화면: 메뉴 끝이라 화면 밖이면 맨 앞으로 */
        if (rc.right > window.innerWidth - 2 || rc.left < 0) { tabFront = true; host = nav.closest("nav") || nav; host.insertBefore(topTab, host.firstChild); } }
    }
    if (!inNav) { if (topTab.parentNode !== document.body) document.body.appendChild(topTab); topTab.className = "kma kma-tab kma-float"; }
    var html = "과제" + (n ? " <i>" + n + "</i>" : "");
    if (topTab.innerHTML !== html) topTab.innerHTML = html;
    topTab.setAttribute("aria-label", "과제" + (n ? " " + n + "개" : ""));
  }
  function watchTab() {
    if (!window.MutationObserver) return;
    new MutationObserver(function () { clearTimeout(tabT); tabT = setTimeout(function () {
      if (!topTab || !document.body.contains(topTab) || (!tabFloat && topTab.parentNode === document.body && navOf())) paintTab();
    }, 250); }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", function () { clearTimeout(tabT); tabT = setTimeout(function () { paintTab(true); }, 300); });
  }
  if (document.body) { mount(); watchTab(); } else document.addEventListener("DOMContentLoaded", function () { mount(); watchTab(); });
  var box = function () { return dim.firstChild; };
  pill.onclick = function () { openPanel(); };
  dim.addEventListener("click", function (e) { if (e.target === dim) closePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (document.querySelector(".kp-root")) { window.KMAPrint && window.KMAPrint.close(); return; } if (!run.hidden) return; if (!dim.hidden) closePanel(); } });
  function closePanel() { if (LOCKED) return; dim.hidden = true; ntOpen = false; }
  function todo() { return (ASG || []).filter(function (a) { return !a.done; }).length; }
  function paintPill() {
    pill.classList.toggle("kma-t", !!(S && ROLE));
    if (S && ROLE) { pill.classList.remove("kma-off"); pill.innerHTML = '<em>' + (ROLE === "admin" ? "관리자" : "선생님") + "</em>" + esc((SUM && SUM.name) || S.id); pill.setAttribute("aria-label", "선생님 " + S.id + " — 선생님 메뉴 열기"); }
    else if (S) { var n = todo(); pill.classList.remove("kma-off"); pill.innerHTML = '<em>학생</em>' + esc((SUM && SUM.name) || S.id) + (n ? ' · 과제 <i>' + n + "</i>" : ""); pill.setAttribute("aria-label", "학생 " + S.id + " — 내 기록과 과제 열기"); }
    else { pill.classList.add("kma-off"); pill.textContent = "로그인"; pill.setAttribute("aria-label", "로그인 — 학생·선생님"); }
  }

  /* ---------- 들어가기 ---------- */
  var WHO = "s";   /* 로그인 창: s 학생, t 선생님 */
  function loginView(mode, who) {
    if (who) WHO = who;
    if (WHO === "t" && mode === "up") mode = "in";      /* v105: 선생님 아이디는 로그인 창에서 만들 수 없다(관리자가 등록) */
    var up = mode === "up", T = WHO === "t";
    var brand = LOCKED ? '<div class="brand"><b>국어의 모든 것</b><small>로그인하면 들어갈 수 있어요</small></div>' : "";
    var head = '<div class="who" role="tablist" aria-label="누구로 들어갈까요"><button type="button" role="tab" data-who="s" class="' + (T ? "" : "on") + '" aria-selected="' + !T + '">학생<small>문제 풀고 과제 제출</small></button><button type="button" role="tab" data-who="t" class="' + (T ? "on" : "") + '" aria-selected="' + T + '">선생님<small>과제 내고 학생 보기</small></button></div>';
    var txt = T ? "관리자가 선생님으로 등록한 아이디로 로그인하면 첫 화면 위쪽에 학생 현황·과제·공지가 나타나요."
      : (up ? "이름과 아이디, 비밀번호를 정해 주세요. 이름은 선생님만 볼 수 있어요." : "아이디로 들어가면 푼 기록이 모이고, 선생님이 낸 과제를 풀 수 있어요.");
    box().innerHTML = brand + head + '<h2 id="kmaH">' + (T ? "선생님 로그인" : (up ? "아이디 만들기" : "학생 로그인")) + '</h2><p class="s">' + txt + "</p>" +
      '<form id="kmaF">' + (up ? '<label class="f" for="kmaN">이름</label><input type="text" id="kmaN" autocomplete="name" maxlength="20" placeholder="예: 홍길동">' : "") +
      '<label class="f" for="kmaI">' + (T ? "선생님 아이디" : "아이디") + '</label><input type="text" id="kmaI" autocomplete="username" maxlength="12" placeholder="2~12자 한글·영문·숫자">' +
      '<label class="f" for="kmaP">비밀번호</label><input type="password" id="kmaP" autocomplete="' + (up ? "new-password" : "current-password") + '" placeholder="' + (FBCFG ? "6" : "4") + '자 이상">' +
      (up ? '<label class="f" for="kmaP2">비밀번호 한 번 더</label><input type="password" id="kmaP2" autocomplete="new-password">' : "") +
      '<div class="msg" id="kmaM" role="alert"></div><div class="row"><button class="btn pri" type="submit">' + (up ? "만들고 로그인" : "로그인") + '</button>' +
      (T ? "" : '<button class="lnk" type="button" id="kmaSw">' + (up ? "이미 아이디가 있어요" : "처음 왔어요 · 아이디 만들기") + "</button>") + "</div>" +
      (T ? '<p class="s" style="margin:14px 0 0">선생님 아이디는 여기서 만들 수 없어요. 관리자에게 선생님 등록을 부탁해 주세요.</p>' : '<p class="s" style="margin:14px 0 0">비밀번호를 잊으면 선생님께 말씀드리세요.</p>') + "</form>";
    box().querySelectorAll("[data-who]").forEach(function (b) { b.onclick = function () { loginView(mode, b.dataset.who); }; });
    var sw = document.getElementById("kmaSw"); if (sw) sw.onclick = function () { loginView(up ? "in" : "up"); };
    document.getElementById("kmaF").onsubmit = function (e) {
      e.preventDefault();
      var id = document.getElementById("kmaI").value.trim(), pw = document.getElementById("kmaP").value, m = document.getElementById("kmaM");
      var nm = up ? document.getElementById("kmaN").value.replace(/\s+/g, " ").trim() : "";
      if (up && !nm) { m.textContent = "이름을 적어 주세요."; document.getElementById("kmaN").focus(); return; }
      if (up && pw !== document.getElementById("kmaP2").value) { m.textContent = "비밀번호가 서로 달라요."; return; }
      var b = e.target.querySelector(".pri"); b.disabled = true; m.textContent = "";
      call(up ? "siteSignup" : "siteLogin", up ? [id, pw, nm] : [id, pw]).then(function (r) {
        if (!r.ok) { b.disabled = false; m.textContent = r.msg || "로그인하지 못했어요."; return; }
        S = { id: id, token: r.token }; ls(SKEY, S); SUM = r.sum || null; ROLE = null;
        checkRole().then(function (role) {
          if (T && !role) { b.disabled = false; teacherWait(id, up); return; }
          m.style.color = "var(--k-sub)"; m.textContent = "로그인했어요. 화면을 여는 중…";
          enter();
        });
      });
    };
    setTimeout(function () { var i = document.getElementById(up ? "kmaN" : "kmaI"); i && i.focus(); }, 30);
  }
  /* 선생님 쪽으로 들어왔는데 아직 등록 전 */
  function teacherWait(id, made) {
    box().innerHTML = (LOCKED ? '<div class="brand"><b>국어의 모든 것</b></div>' : "") + '<h2 id="kmaH">' + "아직 선생님으로 등록되지 않았어요" + '</h2><p class="s">이 아이디는 선생님으로 등록되어 있지 않아요. 선생님이라면 관리자에게 아이디 <b>' + esc(id) + "</b>를 '선생님 관리'에서 등록해 달라고 하세요. 등록되면 첫 화면 위쪽에 학생 현황·과제·공지가 나타나요. 등록 전에도 사이트는 둘러볼 수 있어요.</p>" +
      '<div class="row"><button class="btn pri" type="button" id="kmaRe">등록됐는지 다시 확인</button><button class="btn" type="button" id="kmaGoIn">사이트 둘러보기</button><button class="lnk" type="button" id="kmaOut2">로그아웃</button></div><div class="msg" id="kmaM"></div>';
    document.getElementById("kmaRe").onclick = function () { checkRole().then(function (r) { if (r) enter(); else document.getElementById("kmaM").textContent = "아직 등록 전이에요."; }); };
    document.getElementById("kmaGoIn").onclick = enter;
    document.getElementById("kmaOut2").onclick = logout;
  }
  /* 로그아웃: 로그인 창(첫 화면)으로 돌아간다 */
  function logout() { var go = function () { lockOut(); }; SUM = ASG = NT = null; if (S) call("siteLogout", [S.id, S.token]).then(go, go); else go(); }

  /* ---------- 내 기록 · 과제 · 공지 ---------- */
  var tab = "asg";
  function teacherView() {
    var adm = ROLE === "admin", T = "/suneung-korean/teacher.html";
    box().innerHTML = '<h2 id="kmaH">' + esc((SUM && SUM.name) || S.id) + ' <span class="tag done">' + (adm ? "관리자" : "선생님") + "</span></h2>" +
      '<p class="s">첫 화면 위쪽 메뉴에서도 열 수 있어요. 문제 화면에서는 담은 문제 옆 \'과제로 내기\' 단추로 바로 낼 수 있어요.</p>' +
      '<div class="tl"><a href="' + T + '#st">학생 현황</a><a href="' + T + '#asg">과제</a><a href="' + T + '#rs">응답률</a><a href="' + T + '#nt">공지</a>' + (adm ? '<a href="' + T + '#adm">선생님 관리</a>' : "") + "</div>" +
      '<h3 style="margin:16px 0 0;font-size:15px">과제 함께 풀기</h3><p class="s" style="margin:2px 0 0">학생이 보는 과제 화면을 그대로 열어요. 수업을 열어 두면 학생 화면에도 같이 떠요.</p>' +
      (!ASG ? '<p class="s" style="margin-top:8px">불러오는 중…</p>' : ASG.length ? '<ul class="al" style="margin-top:8px;max-height:38vh;overflow:auto">' + ASG.slice().reverse().map(function (a) {
        return '<li><span><b>' + esc(a.title) + "</b><small>" + a.items.length + "문항 · " + esc(a.cls || "모든 학생") + (isExam(a) ? " · 모의고사 " + a.min + "분" : "") + '</small></span><button class="btn" type="button" data-a="' + esc(a.id) + '">함께 풀기</button></li>'; }).join("") + "</ul>" : '<p class="s" style="margin-top:8px">아직 낸 과제가 없어요.</p>') +
      '<div class="row" style="justify-content:space-between"><button class="lnk" type="button" id="kmaOut">로그아웃</button><button class="btn" type="button" id="kmaX">닫기</button></div>';
    document.getElementById("kmaX").onclick = closePanel;
    document.getElementById("kmaOut").onclick = logout;
    box().querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { openRun(b.dataset.a); }; });
  }
  function meView() {
    if (ROLE) return teacherView();
    var s = SUM || { n: 0, f: 0, wk: 0, byG: {}, cls: "" };
    var h = '<h2 id="kmaH">' + esc(s.name || S.id) + (s.name ? ' <small style="font-size:14px;font-weight:500;color:var(--k-sub)">' + esc(S.id) + "</small>" : "") + clsOf(s.cls).map(function (c) { return ' <span class="tag">' + esc(c) + "</span>"; }).join("") + "</h2>" +
      (SUM && !s.name ? '<form class="nm" id="kmaNF"><span>이름을 적어 주세요</span><input type="text" id="kmaNM" maxlength="20" placeholder="예: 홍길동" aria-label="이름"><button class="btn pri" type="submit" style="padding:8px 14px">저장</button></form>' : "") +
      '<div class="stat"><div><b>' + s.n + '</b><small>푼 문제</small></div><div><b>' + pct(s.f, s.n) + '</b><small>첫 시도 정답률</small></div><div><b>' + s.wk + "</b><small>최근 7일</small></div></div>" +
      '<div class="tabs" role="tablist"><button type="button" data-t="asg" class="' + (tab === "asg" ? "on" : "") + '">과제' + (todo() ? " " + todo() : "") + '</button><button type="button" data-t="rec" class="' + (tab === "rec" ? "on" : "") + '">내 기록</button><button type="button" data-t="nt" class="' + (tab === "nt" ? "on" : "") + '">공지' + ((NT || []).length ? " " + NT.length : "") + "</button></div><div id=\"kmaB\"></div>" +
      '<div class="row" style="justify-content:space-between"><button class="lnk" type="button" id="kmaOut">로그아웃</button><button class="btn" type="button" id="kmaX">닫기</button></div>';
    box().innerHTML = h;
    var nf = document.getElementById("kmaNF"); if (nf) nf.onsubmit = function (e) { e.preventDefault(); var v = document.getElementById("kmaNM").value.trim(); if (!v) return; call("siteSetName", [v]).then(function (r) { if (r.ok) { SUM = r.sum; meView(); } }); };
    box().querySelectorAll("[data-t]").forEach(function (b) { b.onclick = function () { tab = b.dataset.t; meView(); }; });
    document.getElementById("kmaX").onclick = closePanel;
    document.getElementById("kmaOut").onclick = logout;
    var B = document.getElementById("kmaB");
    if (tab === "rec") {
      var rows = GO.filter(function (g) { return s.byG[g]; }).map(function (g) { var v = s.byG[g]; return "<div><span>" + G[g] + '</span><em><i style="width:' + Math.round(v.c / v.t * 100) + '%"></i></em><small>' + pct(v.c, v.t) + " · " + v.t + "</small></div>"; }).join("");
      B.innerHTML = rows ? '<h3>갈래별 첫 시도 정답률</h3><div class="bars">' + rows + "</div>" : '<p class="s" style="margin-top:14px">아직 푼 기록이 없어요. 문제를 풀고 채점하면 여기에 쌓여요.</p>';
      if (s.app) B.innerHTML += '<p class="s" style="margin-top:14px">공무원 기출 연습장에서 푼 문제 ' + s.app.t + "개(정답률 " + pct(s.app.c, s.app.t) + ")도 선생님에게 함께 보여요.</p>";
    } else if (tab === "nt") {
      B.innerHTML = (NT || []).length ? '<div style="margin-top:14px">' + NT.slice().reverse().map(function (n) { return '<div class="nt"><b>' + esc(n.title) + "</b>" + esc(n.body || "") + "</div>"; }).join("") + "</div>" : '<p class="s" style="margin-top:14px">공지가 없어요.</p>';
    } else {
      if (!ASG) { B.innerHTML = '<p class="s" style="margin-top:14px">불러오는 중…</p>'; return; }
      B.innerHTML = ASG.length ? '<ul class="al" style="margin-top:12px">' + ASG.slice().reverse().map(function (a) {
        var d = a.done, x = isExam(a), st = d ? '<span class="tag done">제출 ' + (d.n ? d.sc + "/" + d.n : "") + "</span>" : (a.due ? '<span class="tag">마감 ' + a.due.slice(5).replace("-", ".") + "</span>" : "");
        return '<li><span><b>' + esc(a.title) + "</b><small>" + a.items.length + "문항" + (x ? " · 모의고사 " + a.min + "분" : "") + (a.msg ? " · " + esc(a.msg.slice(0, 40)) : "") + '</small></span><button class="btn" type="button" data-a="' + esc(a.id) + '">' + (d ? "다시 보기" : x ? (examSt(a) ? "이어 풀기" : "시작") : "풀기") + "</button>" + st + "</li>";
      }).join("") + "</ul>" : '<p class="s" style="margin-top:14px">선생님이 낸 과제가 없어요.</p>';
      B.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { openRun(b.dataset.a); }; });
    }
  }
  function openPanel() {
    dim.hidden = false;
    if (!S) return loginView("in");
    meView(); refresh(false);
  }
  function refresh(show) {
    if (!S) return;
    Promise.all([call("siteMe", [S.id, S.token]), ROLE && FBCFG ? call("teacherAssignments", []) : call("siteAssignments", [S.id, S.token]), call("siteNotices", [S.id, S.token])]).then(function (r) {
      if (r[0].relogin || r[1].relogin) { lockOut(); return; }
      if (r[0].ok) SUM = r[0].sum; if (r[1].ok) ASG = r[1].list; if (r[2].ok) NT = r[2].list;
      if (CUR && ASG) { var cur = ASG.filter(function (a) { return a.id === CUR.id; })[0]; if (cur) { if (CUR.st && !cur.st) cur.st = CUR.st; if (CUR.done && !cur.done) { cur.done = CUR.done; cur.key = CUR.key; } cur._auto = CUR._auto; cur._busy = CUR._busy; CUR = cur; } }
      (ASG || []).forEach(function (a) { if (!a.t && isExam(a) && !a.done && examSt(a) && examLeft(a) <= 0 && a !== CUR) lateSubmit(a); });
      paintPill(); paintTab();
      /* v113: 주소 끝의 #asg=<과제> — 선생님 화면의 '함께 풀기'에서 넘어온 것. 수업을 따라온 학생에게는 선생님이 연 과제를 띄운다 */
      var hm = /^#asg=([\w.-]+)$/.exec(location.hash || "");
      if (hm && ASG && run.hidden) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} dim.hidden = true; openRun(hm[1]); }
      if (LIVEWANT) { var lw = LIVEWANT; LIVEWANT = null; liveAsg(lw[0], lw[1], true); }
      if (show) dim.hidden = false;
      if (!dim.hidden && S && !ntOpen) meView();
      noticePop();
    });
  }

  /* v107: 새 공지 — 로그인한 뒤(화면을 열 때) 아직 못 본 공지가 있으면 창으로 한 번 띄운다 */
  var ntShown = false, ntOpen = false;
  function noticePop() {
    if (ntShown || !S || ROLE || LOCKED || !NT || !NT.length || !dim.hidden || !run.hidden) return;
    var key = "kma.ns." + S.id, seen = +ls(key) || 0, list = NT.filter(function (n) { return (n.created || 0) > seen; });
    if (!list.length) return;
    ntShown = true; ntOpen = true; dim.hidden = false;
    var newest = Math.max.apply(null, NT.map(function (n) { return n.created || 0; }));
    box().innerHTML = '<h2 id="kmaH">새 공지 ' + list.length + '개</h2><p class="s" style="margin:0">선생님이 올린 공지예요.</p><div class="ntp">' + list.slice().reverse().slice(0, 5).map(function (n) {
      return '<div class="nt"><b>' + esc(n.title) + "</b>" + esc(n.body || "").replace(/\n/g, "<br>") + "<small>" + (n.cls ? esc(n.cls) + " · " : "") + new Date(n.created || 0).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) + "</small></div>"; }).join("") + "</div>" +
      '<div class="row"><button class="btn pri" type="button" id="kmaNtOk">확인했어요</button>' + (todo() ? '<button class="btn" type="button" id="kmaNtAsg">과제 보기</button>' : "") + "</div>";
    document.getElementById("kmaNtOk").onclick = function () { ls(key, newest); closePanel(); };
    var ga = document.getElementById("kmaNtAsg"); if (ga) ga.onclick = function () { ls(key, newest); ntOpen = false; tab = "asg"; meView(); };
  }

  /* ---------- 과제 풀기 ---------- */
  var CUR = null, ANS = {}, TICK = null;
  /* v106: 모의고사 — 시작한 때부터 제한 시간이 흐르고, 끝나면 그때까지 고른 답을 제출한다 */
  function isExam(a) { return !!(a && a.mode === "exam" && a.min > 0); }
  function examSt(a) { return a.st || +ls("kma.x." + a.id) || 0; }
  function examLeft(a) { return examSt(a) + a.min * 60000 - Date.now(); }
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); s = s % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  function stopTick() { if (TICK) { clearInterval(TICK); TICK = null; } }
  function startTick() {
    stopTick();
    TICK = setInterval(function () {
      var a = CUR; if (!a || a.done || !isExam(a) || run.hidden) { stopTick(); return; }
      var left = examLeft(a), el = document.getElementById("kmaTm");
      if (el) { el.textContent = "남은 시간 " + mmss(left); el.classList.toggle("low", left <= 60000); }
      if (left <= 0) { stopTick(); paintRun(); doSubmit(true); }
    }, 500);
  }
  function lateSubmit(a) {
    if (a._busy) return; a._busy = true;
    call("siteSubmit", [S.id, S.token, a.id, ls("kma.d." + a.id) || {}]).then(function (r) {
      a._busy = false; if (!r.ok) return;
      a.done = r.done; a.key = r.key; a._auto = true; ls("kma.d." + a.id, null); ls("kma.x." + a.id, null); paintPill(); paintTab(); if (!dim.hidden && S && !LOCKED) meView();
    });
  }
  var TSHOW = false, LIVEOPEN = "", LIVEWANT = null, LIVER = -1;
  function liveTell() { try { if (window.Live && Live.asg) Live.asg(run.hidden ? "" : ((CUR && CUR.id) || "")); } catch (e) {} }
  function openRun(aid, byLive) {
    CUR = (ASG || []).filter(function (a) { return a.id === aid; })[0]; if (!CUR) return false;
    ANS = CUR.t ? {} : (CUR.done && CUR.done.ans) ? JSON.parse(JSON.stringify(CUR.done.ans)) : (ls("kma.d." + aid) || {});
    TSHOW = false; LIVEOPEN = byLive ? aid : "";
    dim.hidden = true; run.hidden = false; document.documentElement.style.overflow = "hidden"; document.body.classList.add("kma-running");
    run.setAttribute("data-ink-host", "asg:" + aid); run.setAttribute("data-ink-bottom", "78"); run.setAttribute("data-ink-ref", ".in");   /* 과제 화면 위에도 필기(js/ink.js) — 좌표는 가운데 문제 칸 기준 */
    if (!CUR.t && isExam(CUR) && !CUR.done && !examSt(CUR)) { paintStart(); liveTell(); return true; }
    paintRun(); keepY(0);
    if (!CUR.t && isExam(CUR) && !CUR.done) { if (examLeft(CUR) <= 0) doSubmit(true); else startTick(); }
    liveTell(); return true;
  }
  /* v113: 수업(화면 같이 보기) — 선생님이 과제 화면을 열면 따라온 학생 화면에도 그 과제가 뜨고, 선생님이 내린 만큼 함께 내려간다 */
  function liveAsg(aid, ratio, again) {
    if (ROLE || !S || LOCKED) return;
    if (!aid) { if (LIVEOPEN && !run.hidden) closeRun(true); LIVEOPEN = ""; LIVER = -1; return; }
    if (run.hidden || !CUR || CUR.id !== aid) {
      if (!run.hidden && CUR && CUR.id !== aid && !LIVEOPEN) return;          /* 학생이 스스로 다른 과제를 푸는 중이면 건드리지 않는다 */
      if (!ASG || !ASG.some(function (a) { return a.id === aid; })) { if (!again) { LIVEWANT = [aid, ratio]; refresh(false); } return; }
      if (!openRun(aid, true)) return; LIVER = -1;
    }
    if (ratio != null && ratio !== LIVER) { LIVER = ratio; setTimeout(function () { KEEPT = 0; var h = run.scrollHeight - run.clientHeight; if (h > 0) run.scrollTo({ top: Math.round(ratio * h), behavior: "smooth" }); }, 250); }
  }
  /* v107: 인쇄(미리 보기) — /suneung-korean/js/asgprint.js 를 그때 불러온다 */
  var printP = null;
  function printRun() {
    var a = CUR; if (!a) return;
    printP = printP || (window.KMAPrint ? Promise.resolve() : loadJs("/suneung-korean/js/asgprint.js?v=107"));
    printP.then(function () { window.KMAPrint.open(a, {}); }).catch(function () { printP = null; var m = document.getElementById("kmaRM"); if (m) m.textContent = "인쇄 화면을 불러오지 못했어요."; });
  }
  function closeRun(quiet) { stopTick(); run.hidden = true; document.documentElement.style.overflow = ""; document.body.classList.remove("kma-running"); CUR = null; LIVEOPEN = ""; liveTell(); if (quiet !== true) openPanel(); }
  function paintStart() {
    var a = CUR;
    run.innerHTML = '<div class="in"><div class="top"><div><b style="font-size:18px">' + esc(a.title) + '</b></div><button class="btn" type="button" id="kmaRX">닫기</button></div>' +
      '<div class="xs"><h2>모의고사</h2><p class="big">' + a.items.length + "문항 · 제한 시간 <b>" + a.min + "분</b></p>" +
      (a.msg ? '<p class="s" style="white-space:pre-wrap">' + esc(a.msg) + "</p>" : "") +
      "<ul><li>‘시작하기’를 누르면 그때부터 시간이 흘러요.</li><li>중간에 닫거나 다른 화면으로 가도 시간은 멈추지 않아요.</li><li>시간이 끝나면 그때까지 고른 답이 자동으로 제출돼요.</li><li>다 풀었으면 시간이 남아도 ‘제출하기’를 눌러 끝낼 수 있어요.</li></ul>" +
      '<button class="btn pri" type="button" id="kmaXS" style="font-size:16px;padding:13px 30px">시작하기</button><div class="msg" id="kmaRM" role="alert"></div></div></div>';
    document.getElementById("kmaRX").onclick = closeRun;
    document.getElementById("kmaXS").onclick = function () {
      var b = this; b.disabled = true;
      call("siteExamStart", [S.id, S.token, a.id]).then(function (r) {
        if (!r.ok || !r.st) { b.disabled = false; document.getElementById("kmaRM").textContent = r.msg || "시작하지 못했어요. 인터넷 연결을 확인해 주세요."; return; }
        a.st = r.st; ls("kma.x." + a.id, r.st);
        if (!CUR || CUR.id !== a.id) return;
        CUR.st = r.st; paintRun(); keepY(0);
        if (examLeft(CUR) <= 0) doSubmit(true); else startTick();
      });
    };
  }
  function doSubmit(auto) {
    var a = CUR; if (!a || a.t || a.done || a._busy) return; a._busy = true;
    var sb = document.getElementById("kmaSub"); if (sb) sb.disabled = true;
    call("siteSubmit", [S.id, S.token, a.id, ANS]).then(function (r) {
      a._busy = false; var same = CUR && CUR.id === a.id; if (same) CUR._busy = false;
      var sb2 = document.getElementById("kmaSub"); if (sb2) sb2.disabled = false;
      if (!r.ok) { var m = document.getElementById("kmaRM"); if (m && same) m.textContent = (auto ? "시간이 끝났어요. " : "") + (r.msg || "제출하지 못했어요.") + (auto ? " ‘제출하기’를 다시 눌러 주세요." : ""); return; }
      a.done = r.done; a.key = r.key; a._auto = !!auto; ls("kma.d." + a.id, null); ls("kma.x." + a.id, null); stopTick();
      if (same) { CUR.done = r.done; CUR.key = r.key; CUR._auto = !!auto; paintRun(); keepY(0); }
      refresh(false);
    });
  }
  function pic(p) { return '<img src="' + esc(p.s) + '" width="' + p.w + '" height="' + p.h + '" loading="lazy" alt="">'; }
  function paintRun() {
    var a = CUR, tv = !!a.t, done = !!a.done, key = a.key || {}, exam = isExam(a), over = !tv && exam && !done && examLeft(a) <= 0, show = done || (tv && TSHOW);
    var lc = tv && window.Live && Live.code ? Live.code() : "";
    var h = '<div class="in"><div class="top"><div><b style="font-size:18px">' + esc(a.title) + '</b><div style="font-size:13px;color:var(--k-sub)">' + a.items.length + "문항" + (exam ? " · 모의고사 " + a.min + "분" : "") + (a.due ? " · 마감 " + esc(a.due) : "") +
      (tv ? " · " + esc(a.cls || "모든 학생") + " · 선생님 보기(제출되지 않아요)" : done ? " · 제출함" + (a.done.n ? " " + a.done.sc + "/" + a.done.n : "") + (a._auto ? " · 시간이 끝나 자동으로 제출했어요" : "") : (exam ? " · 닫아도 시간은 계속 흘러요" : "")) + '</div></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' + (tv ? '<button class="btn" type="button" id="kmaTK">' + (TSHOW ? "정답 숨기기" : "정답 보기") + "</button>" : "") + (!tv && exam && !done ? '<span class="tm' + (examLeft(a) <= 60000 ? " low" : "") + '" id="kmaTm" role="timer">남은 시간 ' + mmss(examLeft(a)) + "</span>" : "") + '<button class="btn" type="button" id="kmaPr" title="종이에 풀 수 있게 인쇄(미리 보기)">인쇄</button><button class="btn" type="button" id="kmaRX">닫기</button></div></div>' +
      (a.msg ? '<p class="s" style="margin:14px 0 0;white-space:pre-wrap">' + esc(a.msg) + "</p>" : "");
    var lastP = "";
    a.items.forEach(function (it, n) {
      var v = ANS[it.k], ans = key[it.k];
      h += '<div class="q"><div class="qh"><b>' + (n + 1) + ".</b>" + esc(it.title || "") + "</div>";
      if (it.p && it.p.imgs && it.p.imgs.length) { var pk = JSON.stringify(it.p.imgs[0]); if (pk !== lastP) h += it.p.imgs.map(pic).join(""); lastP = pk; }
      if (it.txt) {
        if (it.txt.pas) h += '<div class="pas">' + esc(it.txt.pas) + "</div>";
        h += '<div class="ask">' + esc(it.txt.ask) + "</div>" + (it.txt.body ? '<div class="pas">' + esc(it.txt.body) + "</div>" : "");
      }
      h += (it.q || []).map(pic).join("");
      if (it.gm) h += '<div data-gm="' + esc(it.gm.e) + '|' + it.gm.n + '"><span style="font-size:13px;color:var(--k-faint)">문항 그림을 불러오는 중…</span></div>';
      if (it.nc) {
        var txtCh = it.txt && it.txt.ch && it.txt.ch.length === it.nc && it.txt.ch.every(Boolean);
        h += '<div class="' + (txtCh ? "chs" : "nums") + '" role="group" aria-label="' + (n + 1) + '번 답">';
        for (var c = 1; c <= it.nc; c++) {
          var cls = show && ans ? (c === ans ? " ok" : c === v ? " no" : "") : (c === v ? " sel" : "");
          h += '<button type="button" class="ch' + cls + '" data-k="' + esc(it.k) + '" data-n="' + c + '"' + (done || over ? " disabled" : "") + ">" + CIR[c - 1] + (txtCh ? " " + esc(it.txt.ch[c - 1]) : "") + "</button>";
        }
        h += "</div>";
        if (show && ans) h += v === ans ? '<div class="res ok">맞았어요</div>' : '<div class="res no">' + (v ? "아쉬워요 · " : "") + "정답 " + CIR[ans - 1] + "</div>";
      } else {
        h += '<textarea data-w="' + esc(it.k) + '" placeholder="답을 적어 주세요"' + (done || over ? " readonly" : "") + ">" + esc(v || "") + "</textarea>";
      }
      if (it.src) h += '<div style="font-size:12px;color:var(--k-faint);margin-top:8px">' + esc(it.src) + "</div>";
      h += "</div>";
    });
    h += "</div>";
    var left = a.items.filter(function (it) { return it.nc ? !ANS[it.k] : !String(ANS[it.k] || "").trim(); }).length;
    h += '<div class="foot">' + (tv ? '<span style="font-size:14px;color:var(--k-sub)">' + (lc ? "수업 <b style=\"letter-spacing:2px;color:var(--k-ink)\">" + esc(lc) + "</b> · 학생 화면에도 이 과제가 떠 있어요" : "학생과 함께 보려면") + "</span>" + (lc ? "" : (can("live") && window.Live && Live.open ? '<button class="btn pri" type="button" id="kmaLv">학생 화면에 띄우기(수업 열기)</button>' : "")) + '<button class="btn" type="button" id="kmaRX2">닫기</button>' : done ? '<span style="font-size:14px">제출했어요' + (a.done.n ? " · " + a.done.sc + "/" + a.done.n + "점" : "") + '</span><button class="btn" type="button" id="kmaRX2">닫기</button>'
      : '<span style="font-size:14px;color:var(--k-sub)">' + (left ? "안 푼 문제 " + left + "개" : "다 풀었어요") + '</span><button class="btn pri" type="button" id="kmaSub">제출하기</button>') + '<span class="msg" id="kmaRM" role="alert" style="margin:0"></span></div>';
    run.innerHTML = h;
    fillGm();
    document.getElementById("kmaRX").onclick = closeRun;
    document.getElementById("kmaPr").onclick = printRun;
    var x2 = document.getElementById("kmaRX2"); if (x2) x2.onclick = closeRun;
    var tk = document.getElementById("kmaTK"); if (tk) tk.onclick = function () { TSHOW = !TSHOW; var y = run.scrollTop; paintRun(); keepY(y); };
    var lv = document.getElementById("kmaLv"); if (lv) lv.onclick = function () { lv.disabled = true; Live.open(); var n = 0, iv = setInterval(function () { if ((Live.code && Live.code()) || ++n > 20) { clearInterval(iv); if (!run.hidden && CUR && CUR.t) { var y = run.scrollTop; paintRun(); keepY(y); liveTell(); } } }, 400); };
    run.querySelectorAll(".ch[data-k]").forEach(function (b) { b.onclick = function () { ANS[b.dataset.k] = +b.dataset.n; if (!tv) ls("kma.d." + a.id, ANS); var y = run.scrollTop; paintRun(); keepY(y); }; });
    run.querySelectorAll("textarea[data-w]").forEach(function (t) { t.oninput = function () { ANS[t.dataset.w] = t.value; if (!tv) ls("kma.d." + a.id, ANS); }; });
    var sb = document.getElementById("kmaSub");
    if (sb) sb.onclick = function () {
      if (left && !over && !confirmLeft(sb, left)) return;
      doSubmit(false);
    };
  }
  /* 공무원 문항: /advanced-korean/gm/q/<회차>.json 에서 그림을 가져와 채운다(같은 지문은 처음 한 번만) */
  var GMC = {}, GMD = {}, KEEPY = 0, KEEPT = 0;
  /* 다시 그린 뒤 보던 자리 지키기: 그림이 늦게 들어와 높이가 바뀌어도 1.5초 동안은 그 자리로 되돌린다(손으로 움직이면 그만둔다) */
  function keepY(y) { KEEPY = y; KEEPT = Date.now(); run.scrollTop = y; }
  function reKeep() { if (Date.now() - KEEPT < 1500 && Math.abs(run.scrollTop - KEEPY) > 1) run.scrollTop = KEEPY; }
  run.addEventListener("load", function (e) { if (e.target && e.target.tagName === "IMG") reKeep(); }, true);
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) { run.addEventListener(t, function () { KEEPT = 0; }, { passive: true }); });
  function fillGm() {
    var shown = {};
    run.querySelectorAll("[data-gm]").forEach(function (el) {
      var p = el.dataset.gm.split("|"), e = p[0], n = +p[1];
      var put = function (d) {
        if (!d) { el.textContent = "문항 그림을 불러오지 못했어요."; return; }
        var q = (d.q || []).filter(function (x) { return x.n === n; })[0], h = "";
        (d.p || []).forEach(function (x, i) { if (x.rng[0] <= n && n <= x.rng[1] && !shown[e + i]) { shown[e + i] = 1; h += '<img src="' + x.img + '" alt="지문">'; } });
        el.innerHTML = h + (q ? '<img src="' + q.img + '" alt="' + n + '번 문항">' : '<a href="/advanced-korean/gongmuwon.html#exam/' + e + '" target="_blank" rel="noopener">시험지에서 ' + n + '번 보기 ↗</a>');
      };
      if (GMD[e]) return put(GMD[e]);   /* 이미 받은 회차는 바로 채운다 */
      GMC[e] = GMC[e] || fetch("/advanced-korean/gm/q/" + e + ".json?v=106").then(function (r) { return r.json(); }).catch(function () { return null; });
      GMC[e].then(function (d) { if (d) GMD[e] = d; put(d); reKeep(); });
    });
  }
  /* 안 푼 문제가 있으면 한 번 더 누르게 한다(창 띄우지 않음) */
  function confirmLeft(b, left) {
    if (b.dataset.sure) return true;
    b.dataset.sure = "1"; b.textContent = "그래도 제출하기"; document.getElementById("kmaRM").textContent = "안 푼 문제가 " + left + "개 있어요.";
    return false;
  }

  /* ---------- 푼 기록 보내기 ---------- */
  var timer = null;
  function record(k, ok, a, c) {
    if (!S || !k) return;
    var q = ls(QKEY) || []; q.push({ k: String(k), ok: !!ok, a: a || "", t: Date.now(), c: +c || 0 }); ls(QKEY, q.slice(-1000));
    clearTimeout(timer); timer = setTimeout(flush, 3000);
  }
  function flush() {
    var q = ls(QKEY) || []; if (!S || !q.length) return;
    var b = q.slice(0, 300);
    call("siteSave", [S.id, S.token, b]).then(function (r) {
      if (r.ok) { var now = ls(QKEY) || []; ls(QKEY, now.slice(b.length)); if (now.length > b.length) flush(); }
      else if (r.relogin) { lockOut(); }
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "hidden" || !S) return;
    if (FBCFG) { flush(); return; }
    var q = ls(QKEY) || []; if (!q.length || !navigator.sendBeacon) return;
    try { if (navigator.sendBeacon(KMA_URL, new Blob([JSON.stringify({ fn: "siteSave", args: [S.id, S.token, q.slice(0, 300)] })], { type: "text/plain;charset=utf-8" }))) ls(QKEY, q.slice(300)); } catch (e) {}
  });

  /* ---------- 선생님: 과제로 내기 ---------- */
  function assign(items) {
    if (ROLE && !can("asg")) { dim.hidden = false; box().innerHTML = '<h2 id="kmaH">과제로 내기</h2><p class="s">관리자가 이 기능을 꺼 두었어요.</p><div class="row"><button class="btn" type="button" id="kmaX">닫기</button></div>'; document.getElementById("kmaX").onclick = closePanel; return; }
    if (FBCFG && !ss("kma.tpw")) {
      dim.hidden = false; box().innerHTML = '<h2 id="kmaH">과제로 내기</h2><p class="s">선생님인지 확인하는 중…</p>';
      call("teacherPing", []).then(function (r) { if (r.ok) ss("kma.tpw", "fb"); assign2(items); });
      return;
    }
    assign2(items);
  }
  function assign2(items) {
    var pw = ss("kma.tpw");
    dim.hidden = false;
    if (!pw) {
      box().innerHTML = '<h2 id="kmaH">과제로 내기</h2><p class="s">' + (FBCFG ? "선생님 아이디로 로그인해야 과제를 낼 수 있어요. 로그아웃한 뒤 로그인 창에서 '선생님'을 골라 들어와 주세요." : "선생님 화면에서 선생님 비밀번호로 먼저 들어와 주세요. 같은 창(탭)에서 이 화면으로 돌아오면 과제를 낼 수 있어요.") + '</p><div class="row"><button class="btn" type="button" id="kmaX">닫기</button></div>';
      document.getElementById("kmaX").onclick = closePanel; return;
    }
    var noKey = items.filter(function (x) { return x.nc && !x.ans; }).length;
    box().innerHTML = '<h2 id="kmaH">과제로 내기</h2><p class="s">담은 ' + items.length + "문항을 학생들에게 과제로 냅니다. 객관식은 학생이 제출하면 바로 채점되고, 정답은 제출한 뒤에만 보여요." + (noKey ? " (정답이 없는 " + noKey + "문항은 채점하지 않아요.)" : "") + "</p>" +
      '<label class="f" for="kmaT">제목</label><input type="text" id="kmaT" maxlength="60" value="' + esc(new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) + " 과제") + '">' +
      '<label class="f" for="kmaG">안내 말(선택)</label><textarea id="kmaG" maxlength="400" style="min-height:70px"></textarea>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="f" for="kmaD">마감일(선택)</label><input type="date" id="kmaD"></div><div><label class="f" for="kmaC">학급</label><select id="kmaC"><option value="">불러오는 중…</option></select></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="f" for="kmaK">종류</label><select id="kmaK"><option value="">과제 · 시간 제한 없음</option><option value="exam">모의고사 · 시간 제한</option></select></div><div><label class="f" for="kmaMin">제한 시간(분)</label><input type="text" inputmode="numeric" id="kmaMin" maxlength="3" value="' + Math.max(5, Math.round(items.length * 1.5)) + '" disabled></div></div>' +
      '<div class="msg" id="kmaM" role="alert"></div><div class="row"><button class="btn pri" type="button" id="kmaGo">과제 내기</button><button class="btn" type="button" id="kmaX">닫기</button></div>';
    document.getElementById("kmaX").onclick = closePanel;
    call("teacherClasses", []).then(function (r) {
      var sel = document.getElementById("kmaC"); if (!sel) return;
      var list = (r && r.ok && r.list) || [], adm = !!(r && r.admin);
      sel.innerHTML = (adm || !list.length ? '<option value="">' + (adm ? "모든 학생" : "학급이 없어요 — 먼저 학급을 만들어 주세요") + "</option>" : "") + list.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("");
      if (!adm && !list.length) { document.getElementById("kmaGo").disabled = true; document.getElementById("kmaM").innerHTML = '첫 화면 위쪽 ‘학생 현황’에서 학급을 만든 뒤 과제를 낼 수 있어요.'; }
    });
    document.getElementById("kmaK").onchange = function () {
      var x = this.value === "exam", t = document.getElementById("kmaT"); document.getElementById("kmaMin").disabled = !x; document.getElementById("kmaGo").textContent = x ? "모의고사 내기" : "과제 내기";
      t.value = x ? t.value.replace(/과제$/, "모의고사") : t.value.replace(/모의고사$/, "과제");
    };
    document.getElementById("kmaGo").onclick = function () {
      var b = this, key = {}; b.disabled = true;
      items.forEach(function (x) { if (x.ans) key[x.k] = x.ans; });
      call("saveSiteAssign", [pw, { title: document.getElementById("kmaT").value, msg: document.getElementById("kmaG").value, due: document.getElementById("kmaD").value, cls: document.getElementById("kmaC").value, items: items, key: key, mode: document.getElementById("kmaK").value, min: document.getElementById("kmaMin").value }]).then(function (r) {
        b.disabled = false;
        if (!r.ok) { document.getElementById("kmaM").textContent = r.msg || "내지 못했어요."; return; }
        box().innerHTML = '<h2 id="kmaH">냈어요</h2><p class="s">학생들이 로그인하면 오른쪽 아래 단추에 과제가 보여요. 제출 현황은 첫 화면 위쪽 ‘과제’에서 볼 수 있어요.</p><div class="row"><a class="btn pri" href="/suneung-korean/teacher.html#asg">제출 현황 보기</a><button class="btn" type="button" id="kmaX">닫기</button></div>';
        document.getElementById("kmaX").onclick = closePanel;
      });
    };
  }

  /* 처음 열 때: 로그인되어 있으면 요약·과제 수 받아 오기 + 남은 기록 보내기 */
  /* 서버가 '로그인 안 됨'이라고 답하면(msg 없음) 잠그고, 연결이 안 된 것뿐이면(msg 있음) 그대로 둔다 */
  if (S) { call("siteResume", [S.id, S.token]).then(function (r) { if (!r.ok) { if (!r.msg) lockOut(); return; } SUM = r.sum; flush(); checkRole().then(function () { refresh(false); }); }); }
  window.addEventListener("hashchange", function () { if (S && !NOUI && /^#asg=/.test(location.hash || "")) refresh(false); });
})();
