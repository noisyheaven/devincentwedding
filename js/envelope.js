/* Intro amplop: otomatis jalan saat halaman dibuka. Foto sampul keluar dari amplop,
   membesar memenuhi layar, lalu menyatu dengan halaman "Buka Undangan". */
(function () {
  var intro = document.getElementById("intro");
  if (!intro) return;
  var card = document.getElementById("evCard");
  var to = new URLSearchParams(location.search).get("to");
  var evTo = document.getElementById("evTo");
  if (to && evTo) { evTo.textContent = "Untuk:"; var b = document.createElement("b"); b.textContent = to; evTo.appendChild(b); }

  var done = false, timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function finish() {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    intro.classList.add("leave");
    var a = document.getElementById("bgm");           // mulai siapkan musik sekarang, bukan saat tombol ditekan
    if (a && a.preload !== "auto") { a.preload = "auto"; try { a.load(); } catch (x) {} }
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1000);
  }
  var PHOTO_RATIO = 1578 / 996;                       // rasio foto cover (lebar/tinggi); dikoreksi otomatis setelah gambar dimuat
  var probe = new Image();
  probe.onload = function () { if (probe.naturalWidth && probe.naturalHeight) PHOTO_RATIO = probe.naturalWidth / probe.naturalHeight; };
  probe.src = "images/cover.jpg";

  function pct(v, d) { v = String(v || ""); return v.indexOf("%") > 0 ? parseFloat(v) / 100 : d; }

  function grow() {                                   // foto membesar (transform = ringan di HP) sampai PERSIS sama dengan foto sampul
    if (!card) return;
    var r = card.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;  // posisi foto saat ini (sudah naik)
    var rw = r.width, rh = r.height;
    intro.appendChild(card);                          // keluar dari amplop supaya tidak terpotong

    // --- bingkai awal: foto di kartu (background-size:cover, posisi 48% 50%) ditulis eksplisit dalam px ---
    var W0 = PHOTO_RATIO > rw / rh ? rh * PHOTO_RATIO : rw, H0 = W0 / PHOTO_RATIO,
        x0 = (rw - W0) * 0.48, y0 = (rh - H0) * 0.5;
    card.classList.add("fly");
    // transform:none WAJIB: kalau tidak, sisa translateY(-62%) dari tahap "rise" membuat foto melompat
    card.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + rw + "px;height:" + rh + "px;right:auto;bottom:auto;" +
      "transform:none;transition:none;background-repeat:no-repeat;background-size:" + W0 + "px " + H0 + "px;background-position:" + x0 + "px " + y0 + "px";
    void card.offsetWidth;                            // paksa browser membaca posisi awal

    // --- bingkai akhir: ukuran & posisi foto sampul yang ada di bawah intro (termasuk zoom Ken Burns bila sedang jalan) ---
    var s = Math.max(vw / rw, vh / rh);
    var cb = document.querySelector("#cover .bg"), cw = vw, ch = vh, px = 0.48, py = 0.5, k = 1, ox = vw / 2, oy = vh / 2, cl = 0;
    if (cb) {
      var cs = getComputedStyle(cb), pp = (cs.backgroundPosition || "").split(" ");
      cw = cb.offsetWidth || vw; ch = cb.offsetHeight || vh;
      px = pct(pp[0], 0.48); py = pct(pp[1], 0.5);
      var tr = cs.transform, m = tr && tr !== "none" && /matrix\(([^)]+)\)/.exec(tr);
      if (m) k = parseFloat(m[1].split(",")[0]) || 1;
      var to = (cs.transformOrigin || "").split(" ");
      ox = parseFloat(to[0]) || cw / 2; oy = parseFloat(to[1]) || ch / 2;
      var cr = cb.getBoundingClientRect(); cl = cr.left - (ox - k * ox);   // tepi kiri layout (tanpa efek zoom)
    }
    var Wc = PHOTO_RATIO > cw / ch ? ch * PHOTO_RATIO : cw, Hc = Wc / PHOTO_RATIO;
    var lx = cl + (cw - Wc) * px, ly = (ch - Hc) * py;                       // tepi kiri-atas foto sampul (tanpa zoom)
    var vx = cl + ox + k * (lx - (cl + ox)), vy = oy + k * (ly - oy);        // setelah zoom Ken Burns
    var bl = vw / 2 - s * rw / 2, bt = vh / 2 - s * rh / 2;                  // tepi kiri-atas kartu setelah diperbesar
    var W1 = Wc * k / s, H1 = Hc * k / s, x1 = (vx - bl) / s, y1 = (vy - bt) / s;
    var dx = vw / 2 - (r.left + rw / 2), dy = vh / 2 - (r.top + rh / 2);

    var ease = " .95s cubic-bezier(.6,0,.2,1)";
    card.style.transition = "transform" + ease + ",background-size" + ease + ",background-position" + ease;
    card.style.transform = "translate3d(" + dx + "px," + dy + "px,0) scale(" + s + ")";
    card.style.backgroundSize = W1 + "px " + H1 + "px";
    card.style.backgroundPosition = x1 + "px " + y1 + "px";
    intro.classList.add("grow");
  }
  document.getElementById("evSkip").addEventListener("click", finish);

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }

  at(1100, function () { intro.classList.add("open"); });     // tutup amplop terbuka
  at(1550, function () { intro.classList.add("back"); });     // tutup di belakang foto
  at(1800, function () { intro.classList.add("rise"); });     // foto cover naik keluar
  at(3200, grow);                                             // foto membesar memenuhi layar
  at(4300, finish);                                           // menyatu ke halaman Buka Undangan
})();
