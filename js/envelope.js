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
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1000);
  }
  function grow() {                                   // foto membesar dari posisi kartu sampai layar penuh
    if (!card) return;
    var r = card.getBoundingClientRect();
    intro.appendChild(card);                          // keluar dari amplop supaya tidak terpotong
    card.classList.add("fly");
    card.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height +
      "px;border-width:5px;border-radius:6px;transition:none";
    void card.offsetWidth;                            // paksa browser membaca posisi awal
    card.style.transition = "left .95s cubic-bezier(.6,0,.2,1),top .95s cubic-bezier(.6,0,.2,1),width .95s cubic-bezier(.6,0,.2,1),height .95s cubic-bezier(.6,0,.2,1),border-width .95s,border-radius .95s";
    card.style.left = "0px"; card.style.top = "0px";
    card.style.width = window.innerWidth + "px"; card.style.height = window.innerHeight + "px";
    card.style.borderWidth = "0px"; card.style.borderRadius = "0px";
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
