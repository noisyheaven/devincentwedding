// Bagian "Momen Tamu" di undangan tampil otomatis pada waktu di bawah ini (WIB). Sebelum itu tersembunyi.
// Waktu diambil dari jam server (header Date), bukan jam HP, supaya tidak bisa dimajukan lewat pengaturan HP.
// Kalau server tidak bisa dihubungi, dipakai jam HP.
(function () {
  "use strict";
  var OPEN_AT = Date.parse("2026-10-24T21:10:00+07:00");   // <- ubah di sini bila jadwalnya berganti
  var sec = document.getElementById("momen");
  if (!sec) return;
  var skew = 0, timer = 0;

  function apply() {
    clearTimeout(timer);
    var ms = OPEN_AT - (Date.now() + skew), open = ms <= 0;
    sec.hidden = !open;
    if (!open) timer = setTimeout(apply, Math.min(ms, 60000) + 50);   // cek tiap menit; tepat waktu saat sudah dekat
  }
  function syncServerClock() {
    if (!window.fetch) return;
    var t0 = Date.now();
    fetch(location.pathname, { method: "HEAD", cache: "no-store" }).then(function (r) {
      var d = Date.parse(r.headers.get("Date") || "");
      if (isNaN(d)) return;
      skew = d + (Date.now() - t0) / 2 - Date.now();   // jam server dikoreksi setengah lama perjalanan
      apply();
    }).catch(function () {});
  }

  apply();
  syncServerClock();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { apply(); syncServerClock(); } });
})();
