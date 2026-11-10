/*
 * 국어의 모든 것 — 학생 아이디 · 기록 · 과제 (2026-11-10 v99)
 * 다섯 갈래가 함께 쓰는 파일: /suneung-korean/js/account.js
 *
 * KMA_URL 이 비어 있으면 아무것도 나타나지 않고, 사이트는 지금처럼(기록은 각 브라우저에) 움직입니다.
 * 앱스 스크립트(Site.gs)를 배포한 뒤 나온 웹 앱 주소(…/exec)를 아래에 넣으면 켜집니다.
 *
 * 각 갈래에서 쓰는 법
 *   KMA.record('adv:psat:PS2024a-12', true, 'PSAT')   // 학생이 채점한 순간 한 번 부르면 됨(로그인 안 했으면 무시)
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
    return { n: a.n || 0, f: a.f || 0, wrong: a.wrong || 0, wk: wk, last: d.last || 0, byG: a.byG || {}, byA: a.byA || {}, days: ds.slice(-60), cls: d.cls || "", app: null };
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
        txt: x.txt ? { pas: st(x.txt.pas, 6000), ask: st(x.txt.ask, 600), body: st(x.txt.body, 4000), ch: (x.txt.ch || []).slice(0, 5).map(function (c) { return st(c, 600); }) } : null };
    }).filter(Boolean);
  }
  function score(items, key, ans) { var sc = 0, n = 0; (items || []).forEach(function (it) { if (it.nc && key[it.k]) { n++; if (+ans[it.k] === key[it.k]) sc++; } }); return { sc: sc, n: n }; }
  function applyBatch(batch) {
    var ch = {}, now = Date.now();
    batch.forEach(function (b) {
      var k = String(b.k || ""); if (!/^(hak|seo|sn|non|adv):.{1,85}$/.test(k)) return;
      var g = k.split(":")[0], m = EV[g] || (EV[g] = {}), e = m[k], ok = b.ok ? 1 : 0, t = Math.min(now, +b.t || now);
      if (e) { e[1] = ok; e[2] = (e[2] || 1) + 1; e[3] = t; if (b.a) e[4] = String(b.a).slice(0, 30); }
      else m[k] = [ok, ok, 1, t, String(b.a || "").slice(0, 30)];
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
  function teacherRows() {
    return DB.collection("users").get().then(function (q) {
      var rows = []; q.forEach(function (d) { var x = d.data() || {}; if (x.moved || d.id === uid()) return; rows.push({ uid: d.id, id: x.id || "?", created: x.created || 0, sum: sumOf(x), sub: {}, mysub: x.sub || {} }); });
      return rows;
    });
  }
  var FBA = {
    siteSignup: function (id, pw) {
      if (!IDRE.test(String(id || ""))) return Promise.resolve({ ok: false, msg: "아이디는 2~12자 한글·영문·숫자로 적어 주세요." });
      if (String(pw || "").length < 6) return Promise.resolve({ ok: false, msg: "비밀번호는 6자 이상이에요." });
      return fbInit().then(function () { return AU.createUserWithEmailAndPassword(em(id), pw); }).then(function (c) {
        ME = { id: id, created: Date.now(), days: {}, agg: emptyAgg(), last: 0, sub: {} }; EV = {};
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
        var list = []; q.forEach(function (d) { var a = d.data(); a.id = d.id; if (!a.cls || a.cls === (ME.cls || "")) list.push(a); });
        return Promise.all(list.map(function (a) {
          var s = ME.sub[a.id]; a.done = s ? { at: s.at, sc: s.sc, n: s.n, ans: s.ans || {} } : null;
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
    siteNotices: function () {
      return need().then(function () { return DB.collection("notices").orderBy("created").get(); }).then(function (q) { var l = []; q.forEach(function (d) { var x = d.data(); x.id = d.id; l.push(x); }); return { ok: true, list: l }; });
    },
    teacherPing: function () {
      return fbInit().then(function () {
        if (!uid()) return { ok: false, msg: "먼저 선생님 아이디로 들어가 주세요." };
        var no = { ok: false, msg: "선생님으로 등록되지 않은 아이디예요. 관리자에게 선생님 등록을 부탁해 주세요." };
        return DB.collection("admins").doc(uid()).get().catch(function () { return null; }).then(function (a) {
          if (a && a.exists) { ISADM = true; return { ok: true, admin: true }; }
          return DB.collection("teachers").doc(uid()).get().then(function (d) { return d.exists ? { ok: true, admin: false } : no; }).catch(function () { return no; });
        });
      });
    },
    teacherSite: function () {
      var rows, asg = [];
      return fbInit().then(teacherRows).then(function (r) {
        rows = r; if (!ISADM) return null;
        return DB.collection("teachers").get().then(function (q) { var t = {}; q.forEach(function (d) { t[d.id] = 1; }); rows = rows.filter(function (x) { return !t[x.uid]; }); });
      }).then(function () { return DB.collection("asg").orderBy("created").get(); }).then(function (q) {
        q.forEach(function (d) { var a = d.data(); a.id = d.id; asg.push(a); });
        return Promise.all(asg.map(function (a) {
          return Promise.all([DB.collection("asgKey").doc(a.id).get(), DB.collection("subs").doc(a.id).get()]).then(function (x) {
            a.key = (x[0].data() || {}).key || {}; var subs = x[1].data() || {};
            rows.forEach(function (r) { var s = subs[r.uid]; if (s) { var sc = score(a.items, a.key, s.ans || {}); r.sub[a.id] = { at: s.at, sc: sc.sc, n: sc.n, ans: s.ans || {}, tries: 1 }; } });
          });
        }));
      }).then(function () { return DB.collection("notices").orderBy("created").get(); }).then(function (q) {
        var nt = []; q.forEach(function (d) { var x = d.data(); x.id = d.id; nt.push(x); });
        TROWS = rows; return { ok: true, at: Date.now(), rows: rows, asg: asg, nt: nt, g: G };
      });
    },
    teacherStudent: function (pw, id) {
      var r = (TROWS || []).filter(function (x) { return x.id === id; })[0];
      if (!r) return Promise.resolve({ ok: false, msg: "없는 학생이에요." });
      return uref(r.uid).collection("ev").get().then(function (q) {
        var ev = []; q.forEach(function (d) { var m = (d.data() || {}).m || {}; Object.keys(m).forEach(function (k) { var e = m[k]; ev.push({ k: k, f: e[0], o: e[1], c: e[2], t: e[3], a: e[4] || "" }); }); });
        ev.sort(function (a, b) { return b.t - a.t; });
        return { ok: true, id: id, sum: r.sum, ev: ev.slice(0, 300), sub: r.sub };
      });
    },
    saveSiteAssign: function (pw, a) {
      a = a || {}; var items = cleanItems(a.items);
      if (!items.length) return Promise.resolve({ ok: false, msg: "문제를 한 개 이상 넣어 주세요." });
      var key = {}; items.forEach(function (it) { var v = +((a.key || {})[it.k]); if (it.nc && v >= 1 && v <= it.nc) key[it.k] = v; });
      var id = /^s\d{6,}$/.test(String(a.id || "")) ? a.id : "s" + Date.now(), wb = DB.batch();
      wb.set(DB.collection("asg").doc(id), { title: String(a.title || "").trim().slice(0, 60) || "선생님이 낸 과제", msg: String(a.msg || "").trim().slice(0, 400),
        due: /^\d{4}-\d{2}-\d{2}$/.test(String(a.due || "")) ? a.due : "", cls: String(a.cls || "").trim().slice(0, 20), items: items, created: Date.now() });
      wb.set(DB.collection("asgKey").doc(id), { key: key });
      return wb.commit().then(function () { return { ok: true, id: id }; });
    },
    deleteSiteAssign: function (pw, aid) {
      var wb = DB.batch(); ["asg", "asgKey", "subs"].forEach(function (c) { wb.delete(DB.collection(c).doc(aid)); });
      return wb.commit().then(function () { return FBA.teacherSite(); }).then(function (r) { return { ok: true, list: r.asg }; });
    },
    setClass: function (pw, id, cls) {
      var r = (TROWS || []).filter(function (x) { return x.id === id; })[0]; if (!r) return Promise.resolve({ ok: false, msg: "없는 학생이에요." });
      return uref(r.uid).update({ cls: String(cls || "").trim().slice(0, 20) }).then(function () { return { ok: true }; });
    },
    saveNotice: function (pw, n) {
      n = n || {}; var t = String(n.title || "").trim().slice(0, 60); if (!t) return Promise.resolve({ ok: false, msg: "제목을 적어 주세요." });
      return DB.collection("notices").doc("n" + Date.now()).set({ title: t, body: String(n.body || "").trim().slice(0, 1000), created: Date.now() })
        .then(function () { return FBA.siteNoticesT(); });
    },
    deleteNotice: function (pw, nid) { return DB.collection("notices").doc(nid).delete().then(function () { return FBA.siteNoticesT(); }); },
    siteNoticesT: function () { return DB.collection("notices").orderBy("created").get().then(function (q) { var l = []; q.forEach(function (d) { var x = d.data(); x.id = d.id; l.push(x); }); return { ok: true, list: l }; }); },
    /* 관리자: 선생님 목록·등록·해제 */
    teacherList: function () {
      return DB.collection("teachers").get().then(function (q) { var l = []; q.forEach(function (d) { var x = d.data() || {}; l.push({ uid: d.id, id: x.id || "?", at: x.at || 0 }); }); return { ok: true, list: l }; });
    },
    teacherAdd: function (pw, id) {
      id = String(id || "").trim();
      return DB.collection("users").where("id", "==", id).get().then(function (q) {
        var d = q.docs.filter(function (x) { return !(x.data() || {}).moved; })[0];
        if (!d) return { ok: false, msg: "'" + id + "' 아이디가 없어요. 그 선생님이 사이트에서 아이디를 먼저 만들어야 해요." };
        return DB.collection("teachers").doc(d.id).set({ id: id, at: Date.now() }).then(function () { return FBA.teacherList(); });
      });
    },
    teacherRemove: function (pw, tuid) {
      if (tuid === uid()) return Promise.resolve({ ok: false, msg: "자기 자신은 뺄 수 없어요." });
      return DB.collection("teachers").doc(tuid).delete().then(function () { return FBA.teacherList(); });
    },
    /* 비밀번호를 잊은 학생: 새 아이디를 만들게 한 뒤, 옛 아이디의 기록을 새 아이디로 옮긴다 */
    moveStudent: function (pw, fromId, toId) {
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
  window.KMA = {
    on: !!(FBCFG || KMA_URL), fb: !!FBCFG, url: KMA_URL, call: call, user: function () { return S && S.id; },
    teacher: function () { return ss("kma.tpw") || ""; },
    record: record, assign: assign, open: function () { openPanel(); }, G: G
  };
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
    ".kma-run .in{max-width:860px;margin:0 auto;padding:22px 18px 120px}",
    ".kma-run .top{position:sticky;top:0;background:var(--k-bg);display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--k-line);z-index:2}",
    ".kma-run .q{border-bottom:1px solid var(--k-line);padding:22px 0}.kma-run .qh{font-size:13px;color:var(--k-sub);margin-bottom:10px}.kma-run .qh b{color:var(--k-ink);font-size:15px;margin-right:6px}",
    ".kma-run img{display:block;max-width:100%;height:auto;margin:8px 0;border-radius:6px}",
    ".kma-run .pas{border:1px solid var(--k-line);border-radius:12px;padding:14px 16px;font-size:15px;line-height:1.85;white-space:pre-wrap;word-break:keep-all;margin-bottom:10px}",
    ".kma-run .ask{font-size:16px;font-weight:600;line-height:1.6;margin:8px 0;word-break:keep-all}",
    ".kma-run .chs{display:grid;gap:6px;margin-top:10px}.kma-run .ch{display:flex;gap:10px;text-align:left;border:1px solid var(--k-line);background:none;color:inherit;border-radius:10px;padding:10px 14px;font:inherit;font-size:15px;line-height:1.6;cursor:pointer;word-break:keep-all}",
    ".kma-run .nums{display:flex;gap:8px;margin-top:10px}.kma-run .nums .ch{width:46px;height:46px;justify-content:center;align-items:center;padding:0;font-size:18px;border-radius:50%}",
    ".kma-run .ch.sel{border-color:var(--k-brand);box-shadow:inset 0 0 0 1px var(--k-brand)}.kma-run .ch.ok{border-color:var(--k-ok);background:rgba(31,122,77,.08)}.kma-run .ch.no{border-color:var(--k-no);background:rgba(179,58,43,.07)}",
    ".kma-run .res{font-size:14px;margin-top:8px}.kma-run .res.ok{color:var(--k-ok)}.kma-run .res.no{color:var(--k-no)}",
    ".kma-run .foot{position:fixed;left:0;right:0;bottom:0;background:var(--k-bg);border-top:1px solid var(--k-line);padding:12px 18px;display:flex;justify-content:center;gap:10px;align-items:center}",
    "@media (max-width:560px){.kma .bars div{grid-template-columns:96px 1fr 58px}.kma-box{padding:22px 18px}}",
    "@media print{.kma-pill,.kma-dim{display:none!important}}"
  ].join("\n");
  document.head.appendChild(css);

  var pill = document.createElement("button"); pill.type = "button"; pill.className = "kma kma-pill";
  var dim = document.createElement("div"); dim.className = "kma kma-dim"; dim.hidden = true;
  dim.innerHTML = '<div class="kma-box" role="dialog" aria-modal="true" aria-labelledby="kmaH"></div>';
  var run = document.createElement("div"); run.className = "kma kma-run"; run.hidden = true;
  function mount() { document.body.appendChild(pill); document.body.appendChild(dim); document.body.appendChild(run); paintPill(); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  var box = function () { return dim.firstChild; };
  pill.onclick = function () { openPanel(); };
  dim.addEventListener("click", function (e) { if (e.target === dim) closePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (!run.hidden) return; if (!dim.hidden) closePanel(); } });
  function closePanel() { dim.hidden = true; }
  function todo() { return (ASG || []).filter(function (a) { return !a.done; }).length; }
  function paintPill() {
    if (S) { var n = todo(); pill.classList.remove("kma-off"); pill.innerHTML = esc(S.id) + (n ? ' · 과제 <i>' + n + "</i>" : ""); pill.setAttribute("aria-label", S.id + " — 내 기록과 과제 열기"); }
    else { pill.classList.add("kma-off"); pill.textContent = "로그인"; pill.setAttribute("aria-label", "로그인"); }
  }

  /* ---------- 들어가기 ---------- */
  function loginView(mode) {
    var up = mode === "up";
    box().innerHTML = '<h2 id="kmaH">' + (up ? "처음 왔어요" : "들어가기") + '</h2><p class="s">' +
      (up ? "아이디와 비밀번호를 정하면, 어느 컴퓨터에서 풀어도 기록이 이어지고 선생님이 낸 과제를 받을 수 있어요. 아이디는 이름 대신 번호나 별명으로 정해 주세요." : "아이디로 들어가면 다섯 갈래에서 푼 기록이 모이고, 선생님이 낸 과제를 풀 수 있어요.") + "</p>" +
      '<form id="kmaF"><label class="f" for="kmaI">아이디</label><input type="text" id="kmaI" autocomplete="username" maxlength="12" placeholder="2~12자 한글·영문·숫자">' +
      '<label class="f" for="kmaP">비밀번호</label><input type="password" id="kmaP" autocomplete="' + (up ? "new-password" : "current-password") + '" placeholder="' + (FBCFG ? "6" : "4") + '자 이상">' +
      (up ? '<label class="f" for="kmaP2">비밀번호 한 번 더</label><input type="password" id="kmaP2" autocomplete="new-password">' : "") +
      '<div class="msg" id="kmaM" role="alert"></div><div class="row"><button class="btn pri" type="submit">' + (up ? "만들고 들어가기" : "들어가기") + '</button>' +
      '<button class="lnk" type="button" id="kmaSw">' + (up ? "이미 아이디가 있어요" : "처음 왔어요 · 아이디 만들기") + "</button></div>" +
      '<p class="s" style="margin:14px 0 0">비밀번호를 잊으면 선생님께 말씀드리세요. 로그인하지 않아도 문제는 그대로 풀 수 있어요(기록은 이 컴퓨터에만).</p></form>';
    document.getElementById("kmaSw").onclick = function () { loginView(up ? "in" : "up"); };
    document.getElementById("kmaF").onsubmit = function (e) {
      e.preventDefault();
      var id = document.getElementById("kmaI").value.trim(), pw = document.getElementById("kmaP").value, m = document.getElementById("kmaM");
      if (up && pw !== document.getElementById("kmaP2").value) { m.textContent = "비밀번호가 서로 달라요."; return; }
      var b = e.target.querySelector(".pri"); b.disabled = true; m.textContent = "";
      call(up ? "siteSignup" : "siteLogin", [id, pw]).then(function (r) {
        b.disabled = false;
        if (!r.ok) { m.textContent = r.msg || "들어가지 못했어요."; return; }
        S = { id: id, token: r.token }; ls(SKEY, S); SUM = r.sum || null;
        flush(); refresh(true);
      });
    };
    setTimeout(function () { var i = document.getElementById("kmaI"); i && i.focus(); }, 30);
  }

  /* ---------- 내 기록 · 과제 · 공지 ---------- */
  var tab = "asg", ROLE = null, ROLEID = "";
  function meView() {
    var s = SUM || { n: 0, f: 0, wk: 0, byG: {}, cls: "" };
    if (FBCFG && ROLEID !== S.id) { ROLEID = S.id; ROLE = ""; call("teacherPing", []).then(function (r) { ROLE = r && r.ok ? (r.admin ? "admin" : "teacher") : ""; if (ROLE && S && document.getElementById("kmaB")) meView(); }).catch(function () {}); }
    var role = ROLE === "admin" ? "관리자" : ROLE === "teacher" ? "선생님" : "";
    var h = '<h2 id="kmaH">' + esc(S.id) + (role ? ' <span class="tag done">' + role + "</span>" : "") + (s.cls ? ' <span class="tag">' + esc(s.cls) + "</span>" : "") + "</h2>" +
      (role ? '<p class="s">' + role + ' 아이디예요. 학생 현황·과제·공지' + (ROLE === "admin" ? "·선생님 관리" : "") + '는 선생님 화면에서 해요.</p><div class="row" style="margin:8px 0 4px"><a class="btn pri" href="/suneung-korean/teacher.html">선생님 화면 열기</a></div>' : "") +
      '<div class="stat"><div><b>' + s.n + '</b><small>푼 문제</small></div><div><b>' + pct(s.f, s.n) + '</b><small>첫 시도 정답률</small></div><div><b>' + s.wk + "</b><small>최근 7일</small></div></div>" +
      '<div class="tabs" role="tablist"><button type="button" data-t="asg" class="' + (tab === "asg" ? "on" : "") + '">과제' + (todo() ? " " + todo() : "") + '</button><button type="button" data-t="rec" class="' + (tab === "rec" ? "on" : "") + '">내 기록</button><button type="button" data-t="nt" class="' + (tab === "nt" ? "on" : "") + '">공지' + ((NT || []).length ? " " + NT.length : "") + "</button></div><div id=\"kmaB\"></div>" +
      '<div class="row" style="justify-content:space-between"><button class="lnk" type="button" id="kmaOut">나가기(로그아웃)</button><button class="btn" type="button" id="kmaX">닫기</button></div>';
    box().innerHTML = h;
    box().querySelectorAll("[data-t]").forEach(function (b) { b.onclick = function () { tab = b.dataset.t; meView(); }; });
    document.getElementById("kmaX").onclick = closePanel;
    document.getElementById("kmaOut").onclick = function () { call("siteLogout", [S.id, S.token]); S = null; ls(SKEY, null); SUM = ASG = NT = null; ROLE = null; ROLEID = ""; paintPill(); loginView("in"); };
    var B = document.getElementById("kmaB");
    if (tab === "rec") {
      var rows = GO.filter(function (g) { return s.byG[g]; }).map(function (g) { var v = s.byG[g]; return "<div><span>" + G[g] + '</span><em><i style="width:' + Math.round(v.c / v.t * 100) + '%"></i></em><small>' + pct(v.c, v.t) + " · " + v.t + "</small></div>"; }).join("");
      B.innerHTML = rows ? '<h3>갈래별 첫 시도 정답률</h3><div class="bars">' + rows + "</div>" : '<p class="s" style="margin-top:14px">아직 푼 기록이 없어요. 문제를 풀고 채점하면 여기에 쌓여요.</p>';
      if (s.app) B.innerHTML += '<p class="s" style="margin-top:14px">공무원 기출 연습장에서 푼 문제 ' + s.app.t + "개(정답률 " + pct(s.app.c, s.app.t) + ")도 선생님 화면에 함께 보여요.</p>";
    } else if (tab === "nt") {
      B.innerHTML = (NT || []).length ? '<div style="margin-top:14px">' + NT.slice().reverse().map(function (n) { return '<div class="nt"><b>' + esc(n.title) + "</b>" + esc(n.body || "") + "</div>"; }).join("") + "</div>" : '<p class="s" style="margin-top:14px">공지가 없어요.</p>';
    } else {
      if (!ASG) { B.innerHTML = '<p class="s" style="margin-top:14px">불러오는 중…</p>'; return; }
      B.innerHTML = ASG.length ? '<ul class="al" style="margin-top:12px">' + ASG.slice().reverse().map(function (a) {
        var d = a.done, st = d ? '<span class="tag done">제출 ' + (d.n ? d.sc + "/" + d.n : "") + "</span>" : (a.due ? '<span class="tag">마감 ' + a.due.slice(5).replace("-", ".") + "</span>" : "");
        return '<li><span><b>' + esc(a.title) + "</b><small>" + a.items.length + "문항" + (a.msg ? " · " + esc(a.msg.slice(0, 40)) : "") + '</small></span><button class="btn" type="button" data-a="' + esc(a.id) + '">' + (d ? "다시 보기" : "풀기") + "</button>" + st + "</li>";
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
    Promise.all([call("siteMe", [S.id, S.token]), call("siteAssignments", [S.id, S.token]), call("siteNotices", [S.id, S.token])]).then(function (r) {
      if (r[0].relogin || r[1].relogin) { S = null; ls(SKEY, null); paintPill(); if (!dim.hidden) loginView("in"); return; }
      if (r[0].ok) SUM = r[0].sum; if (r[1].ok) ASG = r[1].list; if (r[2].ok) NT = r[2].list;
      paintPill();
      if (show) dim.hidden = false;
      if (!dim.hidden && S) meView();
    });
  }

  /* ---------- 과제 풀기 ---------- */
  var CUR = null, ANS = {};
  function openRun(aid) {
    CUR = (ASG || []).filter(function (a) { return a.id === aid; })[0]; if (!CUR) return;
    ANS = (CUR.done && CUR.done.ans) ? JSON.parse(JSON.stringify(CUR.done.ans)) : (ls("kma.d." + aid) || {});
    dim.hidden = true; run.hidden = false; document.documentElement.style.overflow = "hidden"; paintRun();
  }
  function closeRun() { run.hidden = true; document.documentElement.style.overflow = ""; CUR = null; openPanel(); }
  function pic(p) { return '<img src="' + esc(p.s) + '" width="' + p.w + '" height="' + p.h + '" loading="lazy" alt="">'; }
  function paintRun() {
    var a = CUR, done = !!a.done, key = a.key || {};
    var h = '<div class="in"><div class="top"><div><b style="font-size:18px">' + esc(a.title) + '</b><div style="font-size:13px;color:var(--k-sub)">' + a.items.length + "문항" + (a.due ? " · 마감 " + esc(a.due) : "") +
      (done ? " · 제출함" + (a.done.n ? " " + a.done.sc + "/" + a.done.n : "") : "") + '</div></div><button class="btn" type="button" id="kmaRX">닫기</button></div>' +
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
          var cls = done && ans ? (c === ans ? " ok" : c === v ? " no" : "") : (c === v ? " sel" : "");
          h += '<button type="button" class="ch' + cls + '" data-k="' + esc(it.k) + '" data-n="' + c + '"' + (done ? " disabled" : "") + ">" + CIR[c - 1] + (txtCh ? " " + esc(it.txt.ch[c - 1]) : "") + "</button>";
        }
        h += "</div>";
        if (done && ans) h += v === ans ? '<div class="res ok">맞았어요</div>' : '<div class="res no">' + (v ? "아쉬워요 · " : "") + "정답 " + CIR[ans - 1] + "</div>";
      } else {
        h += '<textarea data-w="' + esc(it.k) + '" placeholder="답을 적어 주세요"' + (done ? " readonly" : "") + ">" + esc(v || "") + "</textarea>";
      }
      if (it.src) h += '<div style="font-size:12px;color:var(--k-faint);margin-top:8px">' + esc(it.src) + "</div>";
      h += "</div>";
    });
    h += "</div>";
    var left = a.items.filter(function (it) { return it.nc ? !ANS[it.k] : !String(ANS[it.k] || "").trim(); }).length;
    h += '<div class="foot">' + (done ? '<span style="font-size:14px">제출했어요' + (a.done.n ? " · " + a.done.sc + "/" + a.done.n + "점" : "") + '</span><button class="btn" type="button" id="kmaRX2">닫기</button>'
      : '<span style="font-size:14px;color:var(--k-sub)">' + (left ? "안 푼 문제 " + left + "개" : "다 풀었어요") + '</span><button class="btn pri" type="button" id="kmaSub">제출하기</button>') + '<span class="msg" id="kmaRM" role="alert" style="margin:0"></span></div>';
    run.innerHTML = h;
    fillGm();
    document.getElementById("kmaRX").onclick = closeRun;
    var x2 = document.getElementById("kmaRX2"); if (x2) x2.onclick = closeRun;
    run.querySelectorAll(".ch[data-k]").forEach(function (b) { b.onclick = function () { ANS[b.dataset.k] = +b.dataset.n; ls("kma.d." + a.id, ANS); var y = run.scrollTop; paintRun(); run.scrollTop = y; }; });
    run.querySelectorAll("textarea[data-w]").forEach(function (t) { t.oninput = function () { ANS[t.dataset.w] = t.value; ls("kma.d." + a.id, ANS); }; });
    var sb = document.getElementById("kmaSub");
    if (sb) sb.onclick = function () {
      if (left && !confirmLeft(sb, left)) return;
      sb.disabled = true;
      call("siteSubmit", [S.id, S.token, a.id, ANS]).then(function (r) {
        sb.disabled = false;
        if (!r.ok) { document.getElementById("kmaRM").textContent = r.msg || "제출하지 못했어요."; return; }
        a.done = r.done; a.key = r.key; ls("kma.d." + a.id, null); paintRun(); run.scrollTop = 0; refresh(false);
      });
    };
  }
  /* 공무원 문항: /advanced-korean/gm/q/<회차>.json 에서 그림을 가져와 채운다(같은 지문은 처음 한 번만) */
  var GMC = {};
  function fillGm() {
    var shown = {};
    run.querySelectorAll("[data-gm]").forEach(function (el) {
      var p = el.dataset.gm.split("|"), e = p[0], n = +p[1];
      GMC[e] = GMC[e] || fetch("/advanced-korean/gm/q/" + e + ".json?v=101").then(function (r) { return r.json(); }).catch(function () { return null; });
      GMC[e].then(function (d) {
        if (!d) { el.textContent = "문항 그림을 불러오지 못했어요."; return; }
        var q = (d.q || []).filter(function (x) { return x.n === n; })[0], h = "";
        (d.p || []).forEach(function (x, i) { if (x.rng[0] <= n && n <= x.rng[1] && !shown[e + i]) { shown[e + i] = 1; h += '<img src="' + x.img + '" alt="지문">'; } });
        el.innerHTML = h + (q ? '<img src="' + q.img + '" alt="' + n + '번 문항">' : '<a href="/advanced-korean/gongmuwon.html#exam/' + e + '" target="_blank" rel="noopener">시험지에서 ' + n + '번 보기 ↗</a>');
      });
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
  function record(k, ok, a) {
    if (!S || !k) return;
    var q = ls(QKEY) || []; q.push({ k: String(k), ok: !!ok, a: a || "", t: Date.now() }); ls(QKEY, q.slice(-1000));
    clearTimeout(timer); timer = setTimeout(flush, 3000);
  }
  function flush() {
    var q = ls(QKEY) || []; if (!S || !q.length) return;
    var b = q.slice(0, 300);
    call("siteSave", [S.id, S.token, b]).then(function (r) {
      if (r.ok) { var now = ls(QKEY) || []; ls(QKEY, now.slice(b.length)); if (now.length > b.length) flush(); }
      else if (r.relogin) { S = null; ls(SKEY, null); paintPill(); }
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
      box().innerHTML = '<h2 id="kmaH">과제로 내기</h2><p class="s">' + (FBCFG ? "선생님 아이디로 로그인해야 과제를 낼 수 있어요. 오른쪽 아래 단추나 선생님 화면에서 선생님 아이디로 들어와 주세요." : "선생님 화면에서 선생님 비밀번호로 먼저 들어와 주세요. 같은 창(탭)에서 이 화면으로 돌아오면 과제를 낼 수 있어요.") + '</p><div class="row"><a class="btn pri" href="/suneung-korean/teacher.html" target="_blank" rel="noopener">선생님 화면 열기</a><button class="btn" type="button" id="kmaX">닫기</button></div>';
      document.getElementById("kmaX").onclick = closePanel; return;
    }
    var noKey = items.filter(function (x) { return x.nc && !x.ans; }).length;
    box().innerHTML = '<h2 id="kmaH">과제로 내기</h2><p class="s">담은 ' + items.length + "문항을 학생들에게 과제로 냅니다. 객관식은 학생이 제출하면 바로 채점되고, 정답은 제출한 뒤에만 보여요." + (noKey ? " (정답이 없는 " + noKey + "문항은 채점하지 않아요.)" : "") + "</p>" +
      '<label class="f" for="kmaT">제목</label><input type="text" id="kmaT" maxlength="60" value="' + esc(new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) + " 과제") + '">' +
      '<label class="f" for="kmaG">안내 말(선택)</label><textarea id="kmaG" maxlength="400" style="min-height:70px"></textarea>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="f" for="kmaD">마감일(선택)</label><input type="date" id="kmaD"></div><div><label class="f" for="kmaC">반(비우면 모두)</label><input type="text" id="kmaC" maxlength="20" placeholder="예: 공무원반"></div></div>' +
      '<div class="msg" id="kmaM" role="alert"></div><div class="row"><button class="btn pri" type="button" id="kmaGo">과제 내기</button><button class="btn" type="button" id="kmaX">닫기</button></div>';
    document.getElementById("kmaX").onclick = closePanel;
    document.getElementById("kmaGo").onclick = function () {
      var b = this, key = {}; b.disabled = true;
      items.forEach(function (x) { if (x.ans) key[x.k] = x.ans; });
      call("saveSiteAssign", [pw, { title: document.getElementById("kmaT").value, msg: document.getElementById("kmaG").value, due: document.getElementById("kmaD").value, cls: document.getElementById("kmaC").value, items: items, key: key }]).then(function (r) {
        b.disabled = false;
        if (!r.ok) { document.getElementById("kmaM").textContent = r.msg || "내지 못했어요."; return; }
        box().innerHTML = '<h2 id="kmaH">과제를 냈어요</h2><p class="s">학생들이 로그인하면 오른쪽 아래 단추에 과제가 보여요. 제출 현황은 선생님 화면에서 볼 수 있어요.</p><div class="row"><a class="btn pri" href="/suneung-korean/teacher.html#asg">제출 현황 보기</a><button class="btn" type="button" id="kmaX">닫기</button></div>';
        document.getElementById("kmaX").onclick = closePanel;
      });
    };
  }

  /* 처음 열 때: 로그인되어 있으면 요약·과제 수 받아 오기 + 남은 기록 보내기 */
  if (S) { call("siteResume", [S.id, S.token]).then(function (r) { if (!r.ok) { S = null; ls(SKEY, null); paintPill(); return; } SUM = r.sum; flush(); refresh(false); }); }
})();
