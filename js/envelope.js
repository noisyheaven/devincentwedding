/* Intro amplop: otomatis jalan saat halaman dibuka, lalu menampilkan sampul "Buka Undangan". */
(function () {
  var intro = document.getElementById("intro");
  if (!intro) return;
  var to = new URLSearchParams(location.search).get("to");
  var evTo = document.getElementById("evTo");
  if (to && evTo) { evTo.textContent = "Untuk:"; var b = document.createElement("b"); b.textContent = to; evTo.appendChild(b); }

  var done = false, timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function finish() {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    intro.classList.add("leave");
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1000);
  }
  document.getElementById("evSkip").addEventListener("click", finish);

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }

  at(1100, function () { intro.classList.add("open"); });          // tutup amplop terbuka
  at(1550, function () { intro.classList.add("back"); });          // tutup belakang kartu
  at(1800, function () { intro.classList.add("rise"); });          // kartu V & D naik
  at(3900, function () { intro.classList.add("zoom"); });          // kartu membesar & hilang
  at(4300, finish);                                                // lanjut ke halaman Buka Undangan
})();
