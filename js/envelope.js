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

  // Bingkai foto di dalam kartu dihitung SEKARANG (bukan saat animasi) supaya foto tidak bergeser kiri-kanan ketika membesar:
  // posisi foto di kartu sudah sama dengan posisi foto sampul (background-size:cover, posisi 48% 50%) setelah diperbesar.
  function frameCard(w, h) {
    if (!card || !w || !h) return;
    var vw = intro.clientWidth, vh = intro.clientHeight, bgx, CP = 0.5;
    var cb = document.querySelector("#cover .bg"), m = cb && /([\d.]+)%/.exec(getComputedStyle(cb).backgroundPosition);
    if (m) CP = parseFloat(m[1]) / 100;                           // posisi foto sampul diambil dari CSS
    bgx = CP * 100;
    var s = Math.max(vw / w, vh / h);
    var coverW = Math.max(vw, vh * PHOTO_RATIO);                  // lebar foto sampul di layar
    var cardW = Math.max(w, h * PHOTO_RATIO) * s;                 // lebar foto di kartu setelah diperbesar
    var span = w * s - cardW;                                     // (<0 : foto lebih lebar dari kartu)
    if (Math.abs(span) > 0.5) {
      var targetLeft = (vw - coverW) * CP, base = vw / 2 - s * w / 2;
      bgx = Math.max(-200, Math.min(300, ((targetLeft - base) / span) * 100));
    }
    card.style.backgroundPosition = bgx + "% 50%";
  }
  function frameNow() { if (card && !card.classList.contains("fly")) frameCard(card.offsetWidth, card.offsetHeight); }
  probe.addEventListener("load", function () { PHOTO_RATIO = probe.naturalWidth / probe.naturalHeight; frameNow(); });
  window.addEventListener("resize", frameNow);
  frameNow();

  function grow() {                                   // foto membesar (transform = ringan di HP) sampai persis sama dengan foto sampul
    if (!card) return;
    var r = card.getBoundingClientRect(), vw = intro.clientWidth, vh = intro.clientHeight;  // posisi foto saat ini (sudah naik)
    intro.appendChild(card);                          // keluar dari amplop supaya tidak terpotong
    card.classList.add("fly");
    // transform:none WAJIB: kalau tidak, sisa translateY(-62%) dari tahap "rise" membuat foto melompat
    card.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;right:auto;bottom:auto;transform:none;transition:none";
    frameCard(r.width, r.height);                     // cssText menghapus posisi foto, pasang lagi (nilainya sama dengan sebelumnya)
    void card.offsetWidth;                            // paksa browser membaca posisi awal
    var s = Math.max(vw / r.width, vh / r.height),
        dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);
    card.style.transition = "transform .95s cubic-bezier(.6,0,.2,1)";
    card.style.transform = "translate3d(" + dx + "px," + dy + "px,0) scale(" + s + ")";
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
