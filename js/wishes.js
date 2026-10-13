// WISHES v3: attendance choice, name from the link, total counter, pages, festive modern cards, confetti.
// Loads after main.js and takes over the "Ucapan & Doa" area. WISHES_URL is still set in main.js.
var PER_PAGE = 5;            // <-- wishes per page. Change this number if you like.

(function () {
  var old = document.getElementById("wishForm"); if (!old) return;
  var form = old.cloneNode(true); old.parentNode.replaceChild(form, old);      // drops the old submit handler
  if (window.io) io.observe(form); else form.classList.add("in");              // keep the fade-in on scroll
  window.renderWishes = function () {};                                        // main.js's old list is not used any more
  var $ = function (id) { return document.getElementById(id); };
  var nm = $("wName"), msg = $("wMsg"), btn = $("wBtn"), st = $("wStatus"), oldList = $("wishList");
  var URL_ = window.WISHES_URL || "";
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  oldList.hidden = true;
  var headBox = document.createElement("div"); headBox.id = "wishHead"; form.parentNode.insertBefore(headBox, form);      // counter box ABOVE the form
  var box = document.createElement("div"); box.id = "wishBox"; form.parentNode.insertBefore(box, oldList);               // wish list BELOW the form

  var css = document.createElement("style");
  css.textContent =
    /* form */
    '.wish{background:#fff;border:1px solid #ecd9dd;border-radius:20px;padding:22px 20px;box-shadow:0 10px 30px rgba(128,0,32,.09)}' +
    '.wish .att{display:grid;grid-template-columns:1fr 1fr;gap:10px;border:0;padding:0;margin:0;min-width:0}' +
    '.wish .att legend{font-size:.85rem;color:#8a7378;margin-bottom:6px;padding:0}' +
    '.wish .att label{position:relative;display:block}' +
    '.wish .att input{position:absolute;opacity:0;width:1px;height:1px;padding:0;border:0}' +
    '.wish .att span{display:block;text-align:center;border:1px solid var(--wine);border-radius:12px;padding:11px 8px;cursor:pointer;color:var(--wine);background:#fff;transition:transform .15s,background .2s,color .2s}' +
    '.wish .att span:active{transform:scale(.97)}' +
    '.wish .att input:checked+span{background:linear-gradient(135deg,#b5586b,var(--wine));color:#fff;box-shadow:0 4px 14px rgba(128,0,32,.3)}' +
    '.wish .att input:focus-visible+span{outline:2px solid var(--wine);outline-offset:2px}' +
    '.wish input[readonly]{background:#f7eef0;color:#6b5a5f}' +
    /* showcase */
    '#wishHead{margin:26px 0 24px}#wishBox{margin-top:30px;text-align:left;scroll-margin-top:14px}' +
    '.wb-head{position:relative;overflow:hidden;color:#fff;text-align:center;border-radius:22px;padding:26px 18px 22px;background:linear-gradient(150deg,#c4475f 0%,var(--wine) 55%,var(--wine-d) 100%);box-shadow:0 12px 32px rgba(128,0,32,.28)}' +
    '.wb-head:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 15%,rgba(255,255,255,.22),transparent 45%),radial-gradient(circle at 85% 90%,rgba(255,214,150,.25),transparent 40%)}' +
    '.wb-head>*{position:relative}' +
    '.wb-ico{font-size:1.6rem;line-height:1;animation:wbBeat 1.8s ease-in-out infinite}' +
    '.wb-num{font:600 3.6rem/1.05 "Playfair Display",serif;margin-top:4px;text-shadow:0 2px 14px rgba(0,0,0,.25)}' +
    '.wb-lbl{font-size:.78rem;letter-spacing:.24em;text-transform:uppercase;opacity:.92;margin-top:4px}' +
    '.wb-stats{display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap}' +
    '.wb-stats span{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);border-radius:99px;padding:5px 14px;font-size:.8rem}' +
    '.wb-spark{position:absolute!important;color:rgba(255,226,170,.9);animation:wbTw 2.6s ease-in-out infinite;pointer-events:none}' +
    '.wb-list{display:grid;gap:14px;margin-top:20px}' +
    '.wb-card{display:flex;gap:11px;align-items:flex-start;animation:wbIn .55s cubic-bezier(.2,.8,.2,1) both}' +
    '.wb-av{flex:none;width:44px;height:44px;border-radius:50%;color:#fff;display:grid;place-items:center;font:600 1.15rem "Playfair Display",serif;box-shadow:0 4px 12px rgba(128,0,32,.25);border:2px solid #fff}' +
    '.wb-bub{position:relative;min-width:0;flex:1;background:#fff;border:1px solid #f0dde1;border-radius:4px 18px 18px 18px;padding:12px 15px 11px;box-shadow:0 6px 18px rgba(128,0,32,.08)}' +
    '.wb-bub:before{content:"\\201C";position:absolute;right:12px;top:-6px;font:700 3.2rem/1 "Playfair Display",serif;color:rgba(128,0,32,.1)}' +
    '.wb-name{font-weight:500;color:var(--wine);overflow-wrap:anywhere}' +
    '.wb-tag{display:inline-block;font-size:.68rem;border-radius:99px;padding:2px 10px;margin-left:8px;vertical-align:middle;font-weight:500}' +
    '.wb-tag.y{background:#e1f4e8;color:#17653a}.wb-tag.n{background:#f6e4e7;color:#8a3d4c}' +
    '.wb-msg{margin:5px 0 7px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.95rem;line-height:1.6;color:#3a2a2e}' +
    '.wb-time{font-size:.72rem;color:#9a8489}' +
    '.wb-pg{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:22px;flex-wrap:wrap}' +
    '.wb-pg button{min-width:38px;height:38px;border-radius:99px;border:1px solid #e3c7ce;background:#fff;color:var(--wine);font:400 .9rem Poppins,sans-serif;cursor:pointer;padding:0 10px;transition:transform .15s,background .2s}' +
    '.wb-pg button:hover:not(:disabled){transform:translateY(-1px);background:#faf0f2}' +
    '.wb-pg button[aria-current=page]{background:linear-gradient(135deg,#b5586b,var(--wine));border-color:var(--wine);color:#fff;box-shadow:0 4px 12px rgba(128,0,32,.3)}' +
    '.wb-pg button:disabled{opacity:.35;cursor:default}' +
    '.wb-pg .dots{color:#8a7378;padding:0 2px}' +
    '.wb-info{text-align:center;font-size:.76rem;color:#8a7378;margin-top:10px}' +
    '.wb-empty{text-align:center;color:#8a7378;padding:30px 12px;background:#fff;border:1px dashed #e3c7ce;border-radius:16px;margin-top:18px}' +
    '#wbConfetti{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90}' +
    '@keyframes wbIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}' +
    '@keyframes wbBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}' +
    '@keyframes wbTw{0%,100%{opacity:.25;transform:scale(.7) rotate(0)}50%{opacity:1;transform:scale(1.1) rotate(25deg)}}' +
    '@media(prefers-reduced-motion:reduce){.wb-card,.wb-ico,.wb-spark{animation:none}}';
  document.head.appendChild(css);

  // attendance choice (between name and message)
  var fs = document.createElement("fieldset"); fs.className = "att";
  fs.innerHTML = '<legend>Konfirmasi kehadiran</legend>' +
    '<label><input type="radio" name="att" value="Hadir" required><span>Hadir</span></label>' +
    '<label><input type="radio" name="att" value="Tidak hadir" required><span>Tidak hadir</span></label>';
  msg.parentNode.insertBefore(fs, msg);

  // name from the link
  var to = (new URLSearchParams(location.search).get("to") || "").trim().slice(0, 60);
  if (to) { nm.value = to; nm.readOnly = true; nm.title = "Nama sesuai undangan"; }

  // ---- data + rendering ----
  var S = { items: [], total: 0, hadir: 0, tidak: 0, page: 1, first: true };
  var PAL = [["#d4566f", "#9c1f3d"], ["#e08a5b", "#b04a3a"], ["#a86bb5", "#6e2f7e"], ["#d9a441", "#a8702a"], ["#5b9e8a", "#2f6b5a"], ["#6b86c4", "#3a4f94"]];
  function ago(t) {
    var s = (Date.now() - t) / 1000;
    if (!isFinite(s)) return "";
    if (s < 60) return "baru saja"; if (s < 3600) return Math.floor(s / 60) + " menit lalu";
    if (s < 86400) return Math.floor(s / 3600) + " jam lalu"; return Math.floor(s / 86400) + " hari lalu";
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function card(w, i) {
    var c = el("div", "wb-card"); c.style.animationDelay = (i * 70) + "ms";
    var name = String(w.n || "").trim(), h = 0; for (var k = 0; k < name.length; k++) h += name.charCodeAt(k);
    var pal = PAL[h % PAL.length];
    var av = el("div", "wb-av", (Array.from(name)[0] || "?").toUpperCase());
    av.style.background = "linear-gradient(135deg," + pal[0] + "," + pal[1] + ")";
    var bub = el("div", "wb-bub"), top = el("div"); top.appendChild(el("span", "wb-name", name));
    if (w.a === "Hadir" || w.a === "Tidak hadir") top.appendChild(el("span", "wb-tag " + (w.a === "Hadir" ? "y" : "n"), w.a === "Hadir" ? "✓ Hadir" : "Tidak hadir"));
    bub.appendChild(top); bub.appendChild(el("p", "wb-msg", w.m)); bub.appendChild(el("div", "wb-time", ago(w.t)));
    c.appendChild(av); c.appendChild(bub); return c;
  }
  function pageList(cur, n) {
    if (n <= 7) { var all = []; for (var i = 1; i <= n; i++) all.push(i); return all; }
    var set = {}; [1, n, cur - 1, cur, cur + 1].forEach(function (p) { if (p >= 1 && p <= n) set[p] = 1; });
    var ps = Object.keys(set).map(Number).sort(function (a, b) { return a - b; }), out = [];
    ps.forEach(function (p, i) { if (i && p - ps[i - 1] > 1) out.push("…"); out.push(p); });
    return out;
  }
  function render(scroll) {
    box.innerHTML = ""; headBox.innerHTML = "";
    var head = el("div", "wb-head");
    [["12%", "14%", "1rem", "0s"], ["88%", "22%", ".8rem", ".7s"], ["8%", "76%", ".75rem", "1.3s"], ["92%", "70%", "1.1rem", "1.9s"]].forEach(function (s) {
      var sp = el("span", "wb-spark", "✦"); sp.style.cssText = "left:" + s[0] + ";top:" + s[1] + ";font-size:" + s[2] + ";animation-delay:" + s[3]; sp.setAttribute("aria-hidden", "true"); head.appendChild(sp);
    });
    head.appendChild(el("div", "wb-ico", "💌"));
    var num = el("div", "wb-num", "0"); head.appendChild(num);
    head.appendChild(el("div", "wb-lbl", S.total === 1 ? "Ucapan & Doa" : "Ucapan & Doa"));
    var stats = el("div", "wb-stats");
    stats.appendChild(el("span", "", "✓ " + S.hadir + " Hadir")); stats.appendChild(el("span", "", S.tidak + " Tidak hadir"));
    head.appendChild(stats); headBox.appendChild(head);
    if (S.first && !calm && S.total > 0) {                                      // count-up the first time
      var t0 = performance.now();
      (function step(t) { var p = Math.min(1, (t - t0) / 900); num.textContent = Math.round(S.total * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
    } else num.textContent = S.total;
    S.first = false;

    if (!S.items.length) { box.appendChild(el("div", "wb-empty", "Jadilah yang pertama mengirim ucapan 💌")); return; }
    var pages = Math.ceil(S.items.length / PER_PAGE); S.page = Math.min(Math.max(1, S.page), pages);
    var from = (S.page - 1) * PER_PAGE, list = el("div", "wb-list");
    S.items.slice(from, from + PER_PAGE).forEach(function (w, i) { list.appendChild(card(w, i)); });
    box.appendChild(list);
    if (pages > 1) {
      var nav = el("nav", "wb-pg"); nav.setAttribute("aria-label", "Halaman ucapan");
      var go = function (p) { S.page = p; render(true); };
      var mk = function (label, p, dis, aria, cur) {
        var b = el("button", "", label); b.type = "button"; b.disabled = dis; if (aria) b.setAttribute("aria-label", aria);
        if (cur) b.setAttribute("aria-current", "page"); if (!dis) b.addEventListener("click", function () { go(p); }); return b;
      };
      nav.appendChild(mk("‹", S.page - 1, S.page === 1, "Halaman sebelumnya"));
      pageList(S.page, pages).forEach(function (p) {
        if (p === "…") nav.appendChild(el("span", "dots", "…")); else nav.appendChild(mk(String(p), p, false, "Halaman " + p, p === S.page));
      });
      nav.appendChild(mk("›", S.page + 1, S.page === pages, "Halaman berikutnya"));
      box.appendChild(nav);
      box.appendChild(el("div", "wb-info", "Halaman " + S.page + " dari " + pages));
    }
    if (scroll) box.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  }
  function setData(r) {                                                         // accepts the new {items,...} or the old [...] format
    var items = Array.isArray(r) ? r : (r.items || []);
    S.items = items; S.total = (r && r.total != null) ? r.total : items.length;
    S.hadir = (r && r.hadir != null) ? r.hadir : items.filter(function (w) { return w.a === "Hadir"; }).length;
    S.tidak = (r && r.tidak != null) ? r.tidak : items.filter(function (w) { return w.a === "Tidak hadir"; }).length;
    S.page = 1; render(false);
  }
  function localGet() { try { return JSON.parse(localStorage.getItem("wishes") || "[]"); } catch (e) { return []; } }
  function load() {
    if (!URL_) { setData(localGet()); st.textContent = "Mode uji coba: ucapan hanya tersimpan di browser ini."; return; }
    fetch(URL_).then(function (r) { return r.json(); }).then(setData)
      .catch(function () { box.innerHTML = ""; box.appendChild(el("div", "wb-empty", "Ucapan belum dapat dimuat.")); });
  }
  load();

  // ---- confetti ----
  function confetti() {
    if (calm) return;
    var cv = el("canvas"); cv.id = "wbConfetti"; document.body.appendChild(cv);
    var dpr = Math.min(devicePixelRatio || 1, 2), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, ctx = cv.getContext("2d");
    var cols = ["#800020", "#c4475f", "#e8a0ad", "#f2c14e", "#ffffff", "#d9a441"], ps = [], n = 110;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = (6 + Math.random() * 9) * dpr;
      ps.push({ x: W / 2, y: H * .62, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 7 * dpr, w: (5 + Math.random() * 6) * dpr, h: (3 + Math.random() * 5) * dpr,
        r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length] });
    }
    var t0 = performance.now();
    (function frame(t) {
      var life = (t - t0) / 2200; ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += .32 * dpr; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - life * life); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (life < 1) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("wHp").value) return;                                                 // spam trap
    var c = form.querySelector("input[name=att]:checked");
    var w = { n: nm.value.trim(), m: msg.value.trim(), a: c ? c.value : "", t: Date.now() };
    if (!w.n || !w.m || !w.a) { st.textContent = "Mohon pilih konfirmasi kehadiran."; return; }
    btn.disabled = true; st.textContent = "Mengirim...";
    function done() {
      S.items.unshift(w); S.total++; if (w.a === "Hadir") S.hadir++; else S.tidak++; S.page = 1; render(false);
      msg.value = ""; st.textContent = "Terima kasih atas ucapan dan doanya 💛"; btn.disabled = false;
      confetti(); box.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    }
    function fail() { st.textContent = "Gagal mengirim, silakan coba lagi."; btn.disabled = false; }
    if (!URL_) { try { var l = localGet(); l.unshift(w); localStorage.setItem("wishes", JSON.stringify(l.slice(0, 200))); } catch (x) {} done(); return; }
    fetch(URL_, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ n: w.n, m: w.m, a: w.a, h: "" }) })
      .then(function (r) { return r.json(); }).then(function (r) { r.ok ? done() : fail(); }).catch(fail);
  });
})();
