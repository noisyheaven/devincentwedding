/* ANIMASI TAMBAHAN (anime.js v4, MIT) untuk undangan.
   Semua animasi hanya "bonus": kalau anime.js gagal dimuat, atau pengunjung memilih "kurangi gerakan"
   di HP-nya, file ini berhenti dan halaman tampil seperti biasa.
   Animasi lama (CSS .rv, huruf nama di hero, kelopak, confetti) tidak diubah. */
(function () {
  "use strict";
  var A = window.anime;
  if (!A || !A.animate) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var animate = A.animate, stagger = A.stagger, splitText = A.splitText, createDrawable = A.createDrawable,
      createTimeline = A.createTimeline, spring = A.spring, scrambleText = A.scrambleText, onScroll = A.onScroll, set = A.set;
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };

  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn("[anim] " + name + ":", e); } }
  function inView(el, fn, threshold) {   // jalankan SEKALI saat elemen terlihat
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: threshold || .35 });
    io.observe(el);
  }

  /* 1. JUDUL BAGIAN: huruf naik satu per satu + ornamen garis & hati digambar (SVG draw) */
  function ornament() {
    var NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg");
    s.setAttribute("class", "orn"); s.setAttribute("viewBox", "0 0 180 18"); s.setAttribute("aria-hidden", "true");
    [["", "M6 9H72"], ["hr", "M90 16C73 6 76 -1 84 2C87 3.2 89 6 90 8C91 6 93 3.2 96 2C104 -1 107 6 90 16Z"], ["", "M108 9H174"]].forEach(function (d) {
      var p = document.createElementNS(NS, "path"); p.setAttribute("d", d[1]); if (d[0]) p.setAttribute("class", d[0]); s.appendChild(p);
    });
    return s;
  }
  safe("judul", function () {
    $$("main .title").forEach(function (h) {
      if (h.closest("[hidden]")) return;          // bagian yang masih disembunyikan (cerita, momen) dilewati
      var svg = ornament(); h.parentNode.insertBefore(svg, h.nextSibling);
      var paths = $$("path", svg), heart = svg.querySelector(".hr");
      var lines = createDrawable(paths);           // semua garis mulai "belum tergambar"
      var sp = splitText(h, { words: true, chars: true });
      set(sp.chars, { opacity: 0, y: 18 });
      inView(h, function () {
        animate(sp.chars, { opacity: [0, 1], y: [18, 0], duration: 900, ease: "outExpo", delay: stagger(36) });
        animate(lines, { draw: ["0 0", "0 1"], duration: 1000, ease: "inOutSine", delay: stagger(240, { start: 450 }) });
        animate(heart, { fill: ["rgba(168,51,79,0)", "rgba(168,51,79,.92)"], duration: 600, delay: 1250, ease: "outQuad" });
      }, .4);
    });
  });

  /* 2. RANGKAIAN ACARA: lencana tanggal memantul (spring), kartu menyelinap, garis penghubung tumbuh */
  safe("acara", function () {
    var ol = document.querySelector("#acara .tl"); if (!ol) return;
    var lis = $$("li", ol), dates = $$(".tl-date", ol), cards = $$(".tl-card", ol);
    set(dates, { scale: .3, opacity: 0 }); set(cards, { opacity: 0, x: 38 });
    set(lis.slice(0, -1), { "--ln": 0 });
    var tl = createTimeline({ autoplay: false, defaults: { ease: "outExpo" } });
    lis.forEach(function (li, i) {
      var at = i * 520;
      tl.add(dates[i], { scale: [.3, 1], opacity: [0, 1], rotate: [-16, 0], ease: spring({ bounce: .5 }), duration: 900 }, at)
        .add(cards[i], { opacity: [0, 1], x: [38, 0], duration: 800 }, at + 140);
      if (i < lis.length - 1) tl.add(li, { "--ln": [0, 1], duration: 620, ease: "inOutQuad" }, at + 380);
    });
    inView(ol, function () { tl.play(); }, .3);
  });

  /* 3. MEMPELAI: bingkai foto membuka, nama muncul kata demi kata */
  safe("mempelai", function () {
    $$("#mempelai .person").forEach(function (p) {
      var arch = p.querySelector(".arch"), h = p.querySelector("h3"), txt = p.querySelector("p");
      if (!arch || !h) return;
      var sp = splitText(h, { words: true });
      set(arch, { scale: .9, opacity: 0 }); set(sp.words, { opacity: 0, y: 24 }); if (txt) set(txt, { opacity: 0, y: 14 });
      inView(p, function () {
        animate(arch, { scale: [.9, 1], opacity: [0, 1], duration: 1500, ease: "outExpo" });
        animate(sp.words, { opacity: [0, 1], y: [24, 0], duration: 900, ease: "outExpo", delay: stagger(110, { start: 550 }) });
        if (txt) animate(txt, { opacity: [0, 1], y: [14, 0], duration: 900, ease: "outQuad", delay: 1000 });
      }, .45);
    });
  });

  /* 4. HERO: foto perlahan membesar mengikuti geseran halaman (scroll-linked) */
  safe("hero", function () {
    var img = document.querySelector(".hero-img"), hero = $("beranda"); if (!img || !hero || !onScroll) return;
    animate(img, { scale: [1, 1.16], ease: "linear", autoplay: onScroll({ target: hero, enter: "top top", leave: "top bottom", sync: true })   /* urutan posisi: [container] [target] */ });
  });

  /* 5. TANDA KASIH: nomor rekening "terurai" dari angka acak saat kartu dibuka */
  safe("rekening", function () {
    var panel = $("giftPanel"), num = document.querySelector(".g-num"); if (!panel || !num || !scrambleText) return;
    var done = false;
    new MutationObserver(function () {
      var open = panel.classList.contains("open");
      if (open && !done) { done = true; animate(num, { innerHTML: scrambleText({ chars: "numbers", revealRate: 26, settleDuration: 420 }), delay: 280 }); }
      if (!open) done = false;
    }).observe(panel, { attributes: true, attributeFilter: ["class"] });
  });

  /* 6. PENUTUP: tagar diketik seperti di layar (dengan kursor) */
  safe("tagar", function () {
    var tag = document.querySelector(".foot-tag"); if (!tag || !scrambleText) return;
    var full = tag.textContent;
    tag.style.minHeight = tag.offsetHeight + "px";   // tinggi dikunci supaya tata letak tidak bergeser saat huruf muncul
    inView(tag, function () { animate(tag, { innerHTML: scrambleText({ override: "", cursor: "_", revealRate: 12, settleDuration: 160 }), delay: 500 }).then(function () { tag.textContent = full; }); }, .6);
  });
})();
