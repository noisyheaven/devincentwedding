// TAMBAHAN: menu bawah, kelopak bunga, salin rekening, bagikan, file .ics
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function toast(t) {
    var e = $("toast"); e.textContent = t; e.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove("on"); }, 2200);
  }

  // saat undangan dibuka
  $("open").addEventListener("click", function () {
    $("nav").hidden = false;
    if (!calm) setTimeout(petals, 1600);   // setelah sampul selesai bergeser, supaya animasi buka tidak patah-patah
  });

  // menu "Hadiah" hanya muncul kalau bagian Tanda Kasih sudah diaktifkan (tidak lagi hidden)
  if (!$("hadiah").hidden) $("navGift").hidden = false;

  // menu bawah: geser halus + tandai bagian yang sedang dilihat
  var links = [].slice.call(document.querySelectorAll("#nav a")), map = {};
  links.forEach(function (l) {
    var s = $(l.getAttribute("href").slice(1)); if (s) map[s.id] = l;
    l.addEventListener("click", function (e) {
      e.preventDefault(); if (s) s.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
    });
  });
  var so = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { links.forEach(function (l) { l.classList.remove("on"); }); map[e.target.id].classList.add("on"); }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(map).forEach(function (k) { so.observe($(k)); });

  // confetti: meletus dari tombol "Salin Norek" lalu jatuh ke bawah (~2 detik)
  function burst(el) {
    if (calm) return;
    var r = el.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    var cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90";
    document.body.appendChild(cv);
    var d = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight, x = cv.getContext("2d");
    cv.width = W * d; cv.height = H * d; x.scale(d, d);
    var col = ["#800020", "#d4506a", "#f3dc9a", "#d9b45c", "#2a8bdb", "#ffffff", "#f0869a"], P = [], N = 90, t0 = performance.now(), dur = 2300;
    for (var i = 0; i < N; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * 2.3, v = 6 + Math.random() * 9;
      P.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4,
               r: Math.random() * 6.28, vr: (Math.random() - .5) * .35, c: col[i % col.length], round: Math.random() < .25, sw: Math.random() * 6.28 });
    }
    (function f(t) {
      var age = t - t0; x.clearRect(0, 0, W, H);
      if (age > dur) { cv.remove(); return; }
      x.globalAlpha = age < dur - 600 ? 1 : Math.max(0, (dur - age) / 600);
      P.forEach(function (p) {
        p.vx *= .985; p.vy = p.vy * .985 + .34; p.x += p.vx + Math.sin(p.sw += .12) * .6; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c;
        if (p.round) { x.beginPath(); x.arc(0, 0, p.h * .8, 0, 6.283); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      });
      requestAnimationFrame(f);
    })(t0);
  }

  // salin nomor rekening
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.dataset.copy;
      function ok() {
        toast("Nomor rekening disalin"); burst(b);
        var o = b.dataset.label || (b.dataset.label = b.textContent);
        b.textContent = "Tersalin \u2713"; clearTimeout(b.t); b.t = setTimeout(function () { b.textContent = o; }, 2000);
      }
      function fb() {
        var a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(a); a.select();
        try { document.execCommand("copy"); ok(); } catch (e) { toast("Salin manual: " + t); }
        a.remove();
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    });
  });

  // bagikan (tanpa nama tamu di link)
  $("shareBtn").addEventListener("click", function () {
    var u = location.origin + location.pathname, t = "Undangan Pernikahan Vincensius & Devi";
    if (navigator.share) navigator.share({ title: t, text: t, url: u }).catch(function () {});
    else window.open("https://wa.me/?text=" + encodeURIComponent(t + "\n" + u), "_blank");
  });

  // file kalender .ics (dua acara, pengingat 1 hari sebelumnya)
  var EV = [
    { n: "Pemberkatan Pernikahan Vincensius & Devi", s: "2026-12-26T11:00:00+07:00", e: "2026-12-26T13:00:00+07:00", l: "Gereja Katolik Santo Hieronimus, Tanjung Hulu, Pontianak" },
    { n: "Resepsi Pernikahan Vincensius & Devi", s: "2026-12-26T17:00:00+07:00", e: "2026-12-26T20:00:00+07:00", l: "G-Hotel, Jl. Jendral Urip No. 73, Pontianak" }
  ];
  function z(d) { return new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, ""); }
  function esc(s) { return s.replace(/[,;]/g, "\\$&"); }
  // (tombol #ics sudah dihapus dari index.html; dijaga supaya tidak error dan merusak galeri di bawah)
  if ($("ics")) $("ics").addEventListener("click", function (e) {
    e.preventDefault();
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Devincent Wedding//ID", "CALSCALE:GREGORIAN"];
    EV.forEach(function (v, i) {
      L.push("BEGIN:VEVENT", "UID:devincent-" + i + "@devincentwedding", "DTSTAMP:" + z(Date.now()),
        "DTSTART:" + z(v.s), "DTEND:" + z(v.e), "SUMMARY:" + esc(v.n), "LOCATION:" + esc(v.l),
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Besok: " + esc(v.n), "END:VALARM", "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([L.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
    a.download = "undangan-vincensius-devi.ics"; document.body.appendChild(a); a.click(); a.remove();
  });

  // kelopak bunga: satu momen ~16 detik saat undangan dibuka, lalu berhenti
  function petals() {
    var c = $("petals"), x = c.getContext("2d"), W, H, P = [], r = Math.min(window.devicePixelRatio || 1, 1.5),
        n = matchMedia("(max-width:700px)").matches ? 12 : 24, t0 = performance.now(), dur = 16000,
        col = ["#b5586b", "#d98a9a", "#f0c4cc"];
    function size() { W = c.width = innerWidth * r; H = c.height = innerHeight * r; }
    size(); addEventListener("resize", size);
    function mk(i) {
      return { x: Math.random() * W, y: -Math.random() * H, s: (6 + Math.random() * 8) * r, v: (.6 + Math.random() * .9) * r,
               d: Math.random() * 6.28, w: .5 + Math.random(), a: Math.random() * 6.28, k: .02 + Math.random() * .03, c: col[i % 3] };
    }
    for (var i = 0; i < n; i++) P.push(mk(i));
    (function f(t) {
      var age = t - t0, fade = age < dur - 3000 ? 1 : Math.max(0, (dur - age) / 3000);
      x.clearRect(0, 0, W, H);
      if (age > dur) return;
      x.globalAlpha = .75 * fade;
      P.forEach(function (p) {
        p.y += p.v; p.d += .02; p.x += Math.sin(p.d) * p.w * r; p.a += p.k;
        if (p.y > H + 20 && fade > .5) { p.y = -20; p.x = Math.random() * W; }
        x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c;
        x.beginPath(); x.ellipse(0, 0, p.s, p.s * .55, 0, 0, 6.283); x.fill(); x.restore();
      });
      requestAnimationFrame(f);
    })(t0);
  }
})();

// GALERI SLIDER: autoplay + geser kiri/kanan (sentuh = geser biasa, mouse = tarik)
(function () {
  var g = document.getElementById("gal"); if (!g) return;
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DELAY = 3200;                       // jeda antar foto (milidetik); ubah kalau mau lebih cepat/lambat
  var timer = null, visible = false, held = false, uiUpdate = null;

  function items() { return [].slice.call(g.children); }
  function center(el) { return el.offsetLeft + el.offsetWidth / 2 - g.clientWidth / 2; }
  function current() {
    var L = items(), best = 0, d = 1e9;
    L.forEach(function (el, i) { var x = Math.abs(center(el) - g.scrollLeft); if (x < d) { d = x; best = i; } });
    return best;
  }
  function mark() {
    var c = current();
    items().forEach(function (el, i) { el.classList.toggle("act", i === c); });
    if (uiUpdate) uiUpdate(c);
  }
  var ticking = false;
  g.addEventListener("scroll", function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; mark(); });
  }, { passive: true });

  function next() {
    var L = items(); if (L.length < 2) return;
    var i = current() + 1; if (i >= L.length) i = 0;
    g.scrollTo({ left: center(L[i]), behavior: "smooth" });
  }
  function stop() { clearInterval(timer); timer = null; }
  function play() {
    stop(); if (calm || !visible || held || document.hidden) return;
    timer = setInterval(next, DELAY);
  }
  var resume;
  function hold() { held = true; stop(); clearTimeout(resume); }
  function release() { clearTimeout(resume); resume = setTimeout(function () { held = false; play(); }, 2500); }

  // ---- kontrol galeri: titik, penghitung "3 / 8", panah (desktop) dan petunjuk geser ----
  var wrap = document.getElementById("galWrap") || g.parentNode;
  var ui = document.createElement("div"); ui.className = "gal-ui";
  var dotBox = document.createElement("div"); dotBox.className = "gal-dots";
  var cnt = document.createElement("div"); cnt.className = "gal-count";
  var hint = document.createElement("p"); hint.className = "gal-hint";
  hint.textContent = matchMedia("(hover: hover)").matches ? "Tarik foto atau klik panah untuk melihat lainnya" : "Geser untuk melihat foto lainnya";
  ui.appendChild(dotBox); ui.appendChild(cnt); ui.appendChild(hint);
  wrap.parentNode.insertBefore(ui, wrap.nextSibling);

  function go(i) {
    var L = items(); if (!L.length) return;
    i = (i + L.length) % L.length;
    hold(); g.scrollTo({ left: center(L[i]), behavior: calm ? "auto" : "smooth" }); release();
  }
  function arrow(cls, label, d, step) {
    var b = document.createElement("button"); b.type = "button"; b.className = "gal-arrow " + cls; b.setAttribute("aria-label", label);
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
    b.addEventListener("click", function () { hideHint(); go(current() + step); });
    wrap.appendChild(b);
  }
  arrow("prev", "Foto sebelumnya", "M15 5l-7 7 7 7", -1);
  arrow("next", "Foto berikutnya", "M9 5l7 7-7 7", 1);

  var dots = [];
  function buildDots() {
    dotBox.innerHTML = ""; dots = [];
    items().forEach(function (el, i) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Foto " + (i + 1));
      b.addEventListener("click", function () { hideHint(); go(i); });
      dotBox.appendChild(b); dots.push(b);
    });
  }
  buildDots();
  uiUpdate = function (c) {
    if (dots.length !== items().length) buildDots();
    dots.forEach(function (b, i) { b.classList.toggle("on", i === c); });
    cnt.textContent = (c + 1) + " / " + dots.length;
  };

  var hintDone = false, hintTimer = null;
  function showHint() {
    if (hintDone || calm) return;
    hint.classList.add("on");
    clearTimeout(hintTimer); hintTimer = setTimeout(hideHint, 7000);
  }
  function hideHint() { hintDone = true; clearTimeout(hintTimer); hint.classList.remove("on"); }
  g.addEventListener("pointerdown", hideHint);
  g.addEventListener("touchstart", hideHint, { passive: true });
  g.addEventListener("wheel", hideHint, { passive: true });

  // jalan hanya saat galeri terlihat di layar
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? (play(), showHint()) : stop(); }, { threshold: .35 }).observe(g);
  document.addEventListener("visibilitychange", play);
  g.addEventListener("touchstart", hold, { passive: true });
  g.addEventListener("touchend", release, { passive: true });
  g.addEventListener("mouseenter", hold);
  g.addEventListener("mouseleave", release);

  // tarik dengan mouse (desktop); sentuhan di HP sudah bisa digeser bawaan browser
  var down = false, moved = false, sx = 0, sl = 0;
  g.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse") return;
    down = true; moved = false; sx = e.clientX; sl = g.scrollLeft;
  });
  addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 5) { moved = true; g.classList.add("dragging"); }
    if (moved) g.scrollLeft = sl - dx;
  });
  addEventListener("pointerup", function () {
    if (!down) return; down = false; g.classList.remove("dragging");
  });
  // setelah menarik, jangan dianggap klik (supaya foto tidak terbuka)
  document.addEventListener("click", function (e) {
    if (moved && g.contains(e.target)) { e.stopPropagation(); e.preventDefault(); }
    moved = false;
  }, true);

  // foto digambar oleh main.js, jadi tunggu sebentar lalu mulai di foto pertama
  function init() { var L = items(); if (L.length) { g.scrollLeft = center(L[0]); mark(); } }
  setTimeout(init, 300); addEventListener("load", init);
  addEventListener("resize", mark);
})();

// NAMA HURUF DEMI HURUF + REVEAL BERTAHAP
(function () {
  try {
    // nama muncul huruf demi huruf (sampul langsung, bagian lain saat terlihat di layar)
    [].slice.call(document.querySelectorAll(".cover-in h1, .names")).forEach(function (el) {
      var t = el.textContent.trim(), n = 0;
      el.setAttribute("aria-label", t); el.textContent = "";
      t.split(/\s+/).forEach(function (w) {
        var wd = document.createElement("span"); wd.className = "wd"; wd.setAttribute("aria-hidden", "true");
        w.split("").forEach(function (c) {
          var ch = document.createElement("span"); ch.className = "ch"; ch.textContent = c;
          ch.style.setProperty("--i", n++); wd.appendChild(ch);
        });
        el.appendChild(wd); el.appendChild(document.createTextNode(" ")); n++;
      });
    });
    // elemen dalam satu bagian muncul satu per satu (jeda kecil), bukan serentak
    [].slice.call(document.querySelectorAll("section, .hero-txt, footer")).forEach(function (sec) {
      var k = 0;
      [].slice.call(sec.children).forEach(function (el) {
        if (!el.classList.contains("rv") && !el.classList.contains("zi")) return;
        if (!el.style.transitionDelay) el.style.transitionDelay = Math.min(k, 5) * 110 + "ms";
        k++;
      });
    });
  } catch (e) { /* hiasan saja: jangan sampai merusak bagian lain */ }
})();


// TANDA KASIH: klik "Kirim Hadiah" baru muncul nomor rekening
(function () {
  var b = document.getElementById("giftBtn"), p = document.getElementById("giftPanel");
  if (!b || !p) return;
  b.addEventListener("click", function () {
    var open = !p.classList.contains("open");
    p.classList.toggle("open", open); b.classList.toggle("on", open);
    b.setAttribute("aria-expanded", open); p.setAttribute("aria-hidden", !open);
    b.querySelector("span").textContent = open ? "Tutup" : "Kirim Hadiah";
    if (open) setTimeout(function () { p.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); }, 380);
  });
})();
