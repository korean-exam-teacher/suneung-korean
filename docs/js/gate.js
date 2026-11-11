/* 국어의 모든 것 — 문지기 + 누르는 느낌 (v104, 2026-11-11)
 * 모든 화면의 <head>에서 맨 먼저 불러온다:  <script src="/suneung-korean/js/gate.js?v=104"></script>
 *  1) 로그인하지 않았으면(localStorage 'kma.s' 없음) 화면 내용을 감춘다(html.kma-locked).
 *     로그인 창은 account.js가 그린다. account.js가 없는 옛 화면은 첫 화면의 로그인으로 보낸다(?next=돌아올 주소).
 *  2) 단추를 누를 때 살짝 눌리는 느낌(모든 화면 공통).
 * 주의: 이 사이트는 공개 저장소의 정적 파일이라, 이 문지기는 '화면을 가리는' 장치다. 주소를 직접 아는 사람이 파일 자체를 받는 것까지 막지는 못한다.
 */
(function () {
  var d = document, h = d.documentElement, s = null;
  try { s = JSON.parse(localStorage.getItem("kma.s") || "null"); } catch (e) {}
  var HUB = "/suneung-korean/";
  var css = d.createElement("style"); css.id = "kma-gate-css";
  css.textContent =
    /* 문지기 */
    "html.kma-locked,html.kma-locked body{background:#FEFEFD!important}" +
    "html.kma-locked body>*:not(.kma){display:none!important}" +
    "html.kma-locked .kma-pill{display:none!important}" +
    "@media (prefers-color-scheme:dark){html.kma-locked:not([data-theme=light]),html.kma-locked:not([data-theme=light]) body{background:#1b1a19!important}}" +
    /* 누르는 느낌 — 이미 있는 전환(transition)은 건드리지 않게 :where 로 약하게 */
    ":where(button,[role=button],a.btn,.btn,.chip,.gm-chip,.gm-btn,.bk-btn,summary,select){transition:scale .09s ease,background-color .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease,opacity .15s ease;-webkit-tap-highlight-color:transparent;touch-action:manipulation}" +
    ":where(button,[role=button],a.btn,.btn,.chip):not(:disabled){cursor:pointer}" +
    "@media (hover:hover){:where(button:not(.lnk):not(.ink-c),a.btn,.btn,.chip,.gm-chip,.gm-btn,.bk-btn):not(:disabled):hover{background-image:linear-gradient(rgba(127,127,127,.09),rgba(127,127,127,.09))}" +
    ":where(nav a,.gnb-link):hover{opacity:.72}}" +
    "button:not(:disabled):not(.lnk):not(.ink-c):active,a.btn:active,a.gm-btn:active,[role=button]:active,summary:active{scale:.955;background-image:linear-gradient(rgba(127,127,127,.2),rgba(127,127,127,.2))}" +
    "button.lnk:active,nav a:active,a.gnb-link:active{opacity:.5}" +
    ":where(a.stage,a.bn,a.gm-card,.gm-row,.mk-r,.kma ul.al li){transition:scale .12s ease,border-color .15s ease,box-shadow .15s ease,background-color .15s ease}" +
    "a.stage:active,a.bn:active,a.gm-card:active{scale:.98}" +
    ".gm-row:active,.mk-r:active{background-color:rgba(127,127,127,.1)}" +
    ":where(button,a,[role=button],summary,select,input,textarea):focus-visible{outline:2px solid #2F4F7F;outline-offset:2px}" +
    "@media (prefers-reduced-motion:reduce){:where(button,[role=button],a,summary){transition:none!important}}";
  (d.head || h).appendChild(css);
  /* iOS 사파리: 터치할 때도 :active 가 먹게 */
  d.addEventListener("touchstart", function () {}, { passive: true });

  if (s && s.id) return;
  h.classList.add("kma-locked");
  function fallback() {
    if (window.KMA && window.KMA.gate) return;                       /* account.js 가 로그인 창을 띄웠다 */
    var here = location.pathname + location.search + location.hash;
    if (location.pathname.replace(/index\.html$/, "") !== HUB) { location.replace(HUB + "?next=" + encodeURIComponent(here)); return; }
    var m = d.createElement("div"); m.className = "kma";
    m.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font:16px/1.7 'Pretendard Variable',Pretendard,'Noto Sans KR',sans-serif;color:#62625E";
    m.innerHTML = "<div><b style=\"display:block;font-size:20px;color:#262625;margin-bottom:6px\">국어의 모든 것</b>로그인 창을 불러오지 못했어요.<br>인터넷 연결을 확인하고 새로고침해 주세요.</div>";
    d.body.appendChild(m);
  }
  if (d.readyState === "complete") setTimeout(fallback, 1200);
  else window.addEventListener("load", function () { setTimeout(fallback, 1200); });
})();
