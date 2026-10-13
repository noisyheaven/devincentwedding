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

  function grow() {                                   // foto membesar (transform = ringan di HP) sampai persis sama dengan foto sampul
    if (!card) return;
    var r = card.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;  // posisi foto saat ini (sudah naik)
    intro.appendChild(card);                          // keluar dari amplop supaya tidak terpotong
    card.classList.add("fly");
    // transform:none WAJIB: kalau tidak, sisa translateY(-62%) dari tahap "rise" membuat foto melompat
    card.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;right:auto;bottom:auto;transform:none;transition:none";
    void card.offsetWidth;                            // paksa browser membaca posisi awal

    var s = Math.max(vw / r.width, vh / r.height),
        dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);

    // samakan bingkai foto di akhir animasi dengan foto sampul (background-size:cover, posisi 48% 50%),
    // supaya saat menyatu ke sampul tidak ada pergeseran kiri-kanan
    var CP = 0.48, a = r.width / r.height, bgx = CP * 100;
    var coverW = Math.max(vw, vh * PHOTO_RATIO);      // lebar foto sampul di layar
    var cardW = Math.max(r.width, r.height * PHOTO_RATIO) * s;  // lebar foto di kartu setelah diperbesar
    if (cardW - vw * 1 > 0.5 && Math.abs(coverW - cardW) < 0.5 * vw + 1) {
      // posisi kiri foto sampul = (vw - coverW) * CP ; posisi kiri foto kartu = vw/2 - s*(r.width/2) + (r.width*s - cardW) * p
      var targetLeft = (vw - coverW) * CP, base = vw / 2 - s * r.width / 2, span = r.width * s - cardW;
      if (Math.abs(span) > 0.5) bgx = Math.max(-200, Math.min(300, ((targetLeft - base) / span) * 100));
    }
    card.style.transition = "transform .95s cubic-bezier(.6,0,.2,1), background-position .95s cubic-bezier(.6,0,.2,1)";
    card.style.transform = "translate3d(" + dx + "px," + dy + "px,0) scale(" + s + ")";
    card.style.backgroundPosition = bgx + "% 50%";
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
