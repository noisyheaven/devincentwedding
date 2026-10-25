/* Pemindai QR kode acara: lewat kamera langsung ATAU lewat gambar QR yang sudah diunduh/di-screenshot.
   Dipakai oleh momen.html dan kamera.html.
   QRScan.open({ title, onCode: function (kode) {} })  -> onCode dipanggil sekali bila QR kamera acara terbaca. */
(function () {
  "use strict";
  var JSQR_URL = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
  var CODE_RE = /^[A-Za-z0-9_-]{1,40}$/;
  var css = [
    "#qrs{position:fixed;inset:0;z-index:1000;background:rgba(20,5,10,.9);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;font-family:Poppins,system-ui,sans-serif}",
    "#qrs[hidden]{display:none!important}",
    "#qrs .p{width:min(100%,460px);max-height:calc(100dvh - 32px);overflow:auto;background:#fff9fa;color:#3a2a2e;border-radius:20px;padding:18px;box-shadow:0 20px 70px #0006}",
    "#qrs .h{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}",
    "#qrs h2{font:400 1.7rem/1.1 Italiana,Georgia,serif;color:#800020;margin:0}",
    "#qrs .x{width:42px;height:42px;border-radius:50%;border:0;background:#f2e1e5;color:#800020;font-size:1.3rem;cursor:pointer}",
    "#qrs .t{font-size:.86rem;margin:0 0 12px;line-height:1.45}",
    "#qrs .v{position:relative;width:100%;aspect-ratio:4/3;background:#24151a;border-radius:12px;overflow:hidden}",
    "#qrs video{display:block;width:100%;height:100%;object-fit:cover}",
    "#qrs .f{position:absolute;inset:18% 18%;border:3px solid rgba(255,255,255,.85);border-radius:16px;box-shadow:0 0 0 999px rgba(0,0,0,.28);pointer-events:none}",
    "#qrs .a{display:grid;gap:9px;margin-top:12px}",
    "#qrs .a button{min-height:46px;border-radius:99px;padding:10px 16px;border:1px solid #800020;font:500 .95rem Poppins,system-ui,sans-serif;cursor:pointer;background:#800020;color:#fff}",
    "#qrs .a button.g{background:#fff;color:#800020}",
    "#qrs .a button:disabled{opacity:.55}",
    "#qrs .s{text-align:center;font-size:.83rem;min-height:2.7em;margin:12px 0 0;color:#765d63}",
    "#qrs .s.e{color:#a11f3d}",
    "#qrs .v .ck{position:absolute;inset:0;display:grid;place-items:center;font-size:4.6rem;color:#fff;opacity:0;pointer-events:none;text-shadow:0 4px 24px rgba(0,0,0,.45)}",
    "#qrs .v.bad .f{border-color:#ff4d6a;box-shadow:0 0 0 999px rgba(130,0,25,.5)}",
    "#qrs .v.shake{animation:qrsShake .55s cubic-bezier(.36,.07,.19,.97)}",
    "#qrs .v.good .f{border-color:#4cd964;box-shadow:0 0 0 999px rgba(0,70,25,.45);animation:qrsPulse .5s ease-out}",
    "#qrs .v.good .ck{animation:qrsPop .6s cubic-bezier(.2,.9,.3,1.3) forwards}",
    "#qrs.out{animation:qrsFade .42s ease-in forwards}",
    "#qrs.out .p{animation:qrsZoom .42s ease-in forwards}",
    "@keyframes qrsShake{0%,100%{transform:translateX(0)}12%{transform:translateX(-14px) rotate(-1.2deg)}28%{transform:translateX(12px) rotate(1deg)}44%{transform:translateX(-9px)}60%{transform:translateX(7px)}76%{transform:translateX(-4px)}90%{transform:translateX(2px)}}",
    "@keyframes qrsPulse{0%{transform:scale(1)}50%{transform:scale(1.07)}100%{transform:scale(1)}}",
    "@keyframes qrsPop{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}",
    "@keyframes qrsFade{to{opacity:0}}",
    "@keyframes qrsZoom{to{transform:scale(1.12)}}",
    "@media (prefers-reduced-motion:reduce){#qrs .v.shake,#qrs .v.good .f,#qrs.out,#qrs.out .p{animation:none}}",
    "body.qrs-open{overflow:hidden}"
  ].join("\n");

  var el, video, canvas, ctx, status, btnCam, btnSw, btnFile, fileIn;
  var stream = null, scanning = false, raf = 0, facing = "environment", last = 0, opts = null, loading = null, badLock = false, finishing = false, box;

  function parse(raw) {   // isi QR -> kode acara ("" bila bukan QR kamera acara)
    raw = String(raw || "").trim();
    var c = "";
    try { c = (new URL(raw, location.href).searchParams.get("k") || "").trim(); } catch (e) {}
    if (!c && CODE_RE.test(raw)) c = raw;   // QR berisi kode saja
    return CODE_RE.test(c) ? c : "";
  }
  function loadLib() {
    if (window.jsQR) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (ok, no) {
      var s = document.createElement("script");
      s.src = JSQR_URL; s.async = true;
      s.onload = function () { window.jsQR ? ok() : no(); };
      s.onerror = function () { loading = null; no(); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function say(t, err) { status.textContent = t; status.className = "s" + (err ? " e" : ""); }

  function build() {
    if (el) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    el = document.createElement("div"); el.id = "qrs"; el.hidden = true;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<section class="p"><div class="h"><h2 id="qrsT"></h2><button class="x" type="button" aria-label="Tutup">✕</button></div>' +
      '<p class="t">Arahkan kamera ke QR kamera acara, atau pilih gambar QR yang sudah kamu unduh / screenshot dari galeri HP.</p>' +
      '<div class="v"><video playsinline muted></video><i class="f"></i><b class="ck" aria-hidden="true">✓</b></div><canvas hidden></canvas>' +
      '<div class="a"><button type="button" class="cam">📷 Buka kamera &amp; pindai</button>' +
      '<button type="button" class="g file">🖼️ Pilih gambar QR dari galeri</button>' +
      '<button type="button" class="g sw" hidden>🔄 Kamera depan / belakang</button></div>' +
      '<input type="file" accept="image/*" hidden>' +
      '<p class="s" role="status" aria-live="polite"></p></section>';
    document.body.appendChild(el);
    video = el.querySelector("video"); canvas = el.querySelector("canvas");
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    box = el.querySelector(".v");
    status = el.querySelector(".s"); btnCam = el.querySelector(".cam"); btnSw = el.querySelector(".sw");
    btnFile = el.querySelector(".file"); fileIn = el.querySelector("input[type=file]");
    el.querySelector(".x").addEventListener("click", close);
    el.addEventListener("click", function (e) { if (e.target === el) close(); });
    btnCam.addEventListener("click", startCamera);
    btnSw.addEventListener("click", function () { facing = facing === "environment" ? "user" : "environment"; startCamera(); });
    btnFile.addEventListener("click", function () { fileIn.value = ""; fileIn.click(); });
    fileIn.addEventListener("change", function () { if (fileIn.files && fileIn.files[0]) scanFile(fileIn.files[0]); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el.hidden) close(); });
    window.addEventListener("pagehide", stopCamera);
  }

  function stopCamera() {
    scanning = false;
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null;
    if (video) video.srcObject = null;
    if (btnCam) { btnCam.disabled = false; btnCam.innerHTML = "📷 Buka kamera &amp; pindai"; }
  }
  function close() {
    stopCamera();
    finishing = false; badLock = false;
    if (box) box.className = "v";
    if (el) { el.hidden = true; el.classList.remove("out"); }
    document.body.classList.remove("qrs-open");
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function wrong(msg) {   // QR salah: kamera bergetar + merah + getar HP
    say(msg || "QR terbaca, tetapi bukan QR kamera acara. Pindai QR kamera yang benar.", true);
    if (badLock) return;
    badLock = true;
    buzz([70, 40, 70]);
    box.className = "v"; void box.offsetWidth;   // mulai ulang animasi
    box.className = "v bad shake";
    setTimeout(function () { if (!finishing) box.className = "v"; }, 700);
    setTimeout(function () { badLock = false; }, 1100);   // QR yang sama tidak mengulang getaran terus-menerus
  }
  var rejected = {};   // kode yang baru ditolak server: jangan diperiksa ulang tiap frame
  var BAD_CODE = "Kode di QR itu salah. Pindai QR resmi di lokasi acara, atau tanyakan kepada panitia.";
  function resume() { if (stream && !finishing) { scanning = true; raf = requestAnimationFrame(tick); } }
  function verify(code) {   // true/false; lempar error bila tidak bisa menghubungi server
    var u = opts && opts.verifyUrl;
    if (!u) return Promise.resolve(true);
    return fetch(u + "?tk=probe" + Date.now().toString(36) + "&k=" + encodeURIComponent(code))
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.err === "denied") return false; if (j && j.ok) return true; throw new Error("bad"); });
  }
  function found(raw) {   // true bila QR kamera acara
    var code = parse(raw);
    if (!code) { wrong(); return false; }
    if (finishing) return true;
    if (rejected[code] && Date.now() - rejected[code] < 4000) { wrong(BAD_CODE); return false; }
    finishing = true; scanning = false;
    if (opts && opts.verifyUrl) {   // periksa kode ke server DULU, baru animasi sukses
      box.className = "v";
      say("Memeriksa kode…");
      verify(code).then(function (okc) {
        if (!finishing || el.hidden) return;
        if (okc) { success(code); return; }
        rejected[code] = Date.now(); finishing = false;
        wrong(BAD_CODE); resume();
      }).catch(function () {
        if (!finishing || el.hidden) return;
        finishing = false;
        say("Gagal memeriksa kode. Periksa sinyal, lalu arahkan QR lagi.", true);
        setTimeout(resume, 1200);
      });
      return true;
    }
    success(code);
    return true;
  }
  function success(code) {
    finishing = true; scanning = false;
    var cb = opts && opts.onCode;
    buzz(45);
    box.className = "v good";
    say("Kode terbaca ✓ Membuka kamera…");
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(function () { close(); if (cb) cb(code); }, 400);
    }, 600);
  }

  function tick(t) {
    if (!scanning) return;
    raf = requestAnimationFrame(tick);
    if (t - last < 130) return;   // ±7x per detik cukup, hemat baterai
    last = t;
    if (video.readyState < 2 || !video.videoWidth) return;
    var k = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * k); canvas.height = Math.round(video.videoHeight * k);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var px = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var r = window.jsQR(px.data, px.width, px.height, { inversionAttempts: "attemptBoth" });
    if (r && r.data) found(r.data);
  }
  function startCamera() {
    stopCamera();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say("Kamera tidak tersedia di browser ini. Pilih gambar QR dari galeri.", true); return; }
    btnCam.disabled = true; btnCam.textContent = "Meminta izin kamera…";
    loadLib().then(function () {
      return navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    }).then(function (s) {
      if (el.hidden) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; video.srcObject = s;
      return video.play().then(function () {
        scanning = true; btnCam.textContent = "Memindai… arahkan ke QR"; btnSw.hidden = false;
        say("Arahkan kamera ke QR kamera acara. Kode terbaca otomatis.");
        raf = requestAnimationFrame(tick);
      });
    }).catch(function (e) {
      stopCamera();
      if (!window.jsQR) say("Pemindai belum termuat. Periksa sinyal, lalu coba lagi, atau pilih gambar QR dari galeri.", true);
      else if (e && (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")) say("Izin kamera ditolak. Izinkan kamera untuk situs ini, atau pilih gambar QR dari galeri.", true);
      else say("Kamera tidak bisa dibuka. Tutup aplikasi lain yang memakai kamera, atau pilih gambar QR dari galeri.", true);
    });
  }

  /* ---- baca QR dari file gambar ---- */
  function bitmapOf(f) {
    if (window.createImageBitmap) {
      return createImageBitmap(f, { imageOrientation: "from-image" }).catch(function () { return createImageBitmap(f); });
    }
    return new Promise(function (ok, no) {
      var im = new Image(), u = URL.createObjectURL(f);
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); no(); };
      im.src = u;
    });
  }
  function decodeImage(src) {   // coba beberapa ukuran: QR kecil di screenshot besar kadang baru terbaca setelah diperkecil
    var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height, tried = {};
    var sizes = [1600, 1000, 640, 420];
    for (var i = 0; i < sizes.length; i++) {
      var k = Math.min(1, sizes[i] / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
      if (tried[cw]) continue; tried[cw] = 1;
      canvas.width = cw; canvas.height = ch;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);   // PNG transparan -> latar putih
      ctx.drawImage(src, 0, 0, cw, ch);
      var px = ctx.getImageData(0, 0, cw, ch);
      var r = window.jsQR(px.data, cw, ch, { inversionAttempts: "attemptBoth" });
      if (r && r.data) return r.data;
    }
    return "";
  }
  function scanFile(f) {
    stopCamera();
    say("Membaca gambar…");
    loadLib().then(function () { return bitmapOf(f); }).then(function (bm) {
      var data = decodeImage(bm);
      if (bm.close) bm.close();
      if (!data) { say("QR tidak ditemukan di gambar itu. Pakai gambar yang jelas, atau crop hingga hanya QR-nya.", true); return; }
      found(data);
    }).catch(function () {
      say(window.jsQR ? "Gambar tidak bisa dibaca. Coba gambar lain." : "Pemindai belum termuat. Periksa sinyal lalu coba lagi.", true);
    });
  }

  function open(o) {
    opts = o || {};
    build();
    el.querySelector("#qrsT").textContent = opts.title || "Pindai QR Kamera Acara";
    el.hidden = false; document.body.classList.add("qrs-open");
    finishing = false; badLock = false; box.className = "v"; el.classList.remove("out");
    btnSw.hidden = true; say("");
    loadLib().catch(function () {});   // muat pustaka sambil menunggu
    startCamera();
  }
  window.QRScan = { open: open, close: close, parse: parse, isOpen: function () { return !!el && !el.hidden; } };
})();
