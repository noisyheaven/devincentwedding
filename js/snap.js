/* Membagi bagian "Ucapan & Doa" menjadi 2 halaman snap:
   halaman 1 = judul + jumlah ucapan + formulir, halaman 2 = daftar ucapan para tamu.
   Dijalankan SETELAH wishes.js (wishes.js menaruh #wishHead dan #wishBox ke dalam section ini). */
(function () {
  "use strict";
  var s = document.getElementById("ucapan"), box = document.getElementById("wishBox"), old = document.getElementById("wishList");
  if (!s || !box || s.querySelector(".uc-1")) return;
  var one = document.createElement("div"), two = document.createElement("div");
  one.className = "uc-1"; two.className = "uc-2";
  Array.prototype.slice.call(s.children).forEach(function (n) { (n === box || n === old ? two : one).appendChild(n); });
  s.appendChild(one); s.appendChild(two);
})();
