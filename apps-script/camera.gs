// DISPOSABLE CAMERA - backend (Google Apps Script)
// Menerima foto dari kamera.html, menyimpannya di Google Drive, dan memberi daftar foto ke momen.html.
// Cara pasang: lihat SETUP-KAMERA.txt

// KODE ACARA: isi dengan kode rahasia (huruf/angka, mis. "dv26xk7"). Kode yang sama dipasang di QR lewat
// tools/qr-kamera.html. Kiriman tanpa kode yang benar ditolak. Kosongkan ("") untuk mematikan pengecekan.
var ACCESS_CODE = "";

var MAX_PER_GUEST = 10;          // jatah foto per perangkat/tamu
var MAX_TOTAL = 3000;            // batas total foto (pengaman)
var MAX_B64 = 2600000;           // batas ukuran satu foto (karakter base64, kira-kira 1,9 MB)
var LIST_LIMIT = 600;            // jumlah foto terbaru yang ditampilkan di galeri
var MAX_POSTS_PER_MIN = 80;      // semua tamu digabung
var FOLDER_NAME = "Disposable Camera - Vincensius & Devi";
var SHEET_NAME = "Foto";
var CACHE_KEY = "photos_v1";
var CACHE_SECONDS = 10;

// Jalankan fungsi ini SEKALI dari editor (tombol Run) untuk memberi izin & membuat folder Drive.
function setup() {
  sheet_();
  folder_();
  Logger.log("Siap. Folder Drive: " + folder_().getUrl());
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Waktu", "Nama", "Token", "FileId", "IdFoto", "Tampil"]);
  }
  return sh;
}

function folder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder(FOLDER_NAME);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);  // isi folder bisa tampil di website
  props.setProperty("FOLDER_ID", f.getId());
  return f;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function safe_(s) { return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }

function codeOk_(k) {
  return !ACCESS_CODE || String(k || "") === ACCESS_CODE;
}
// byte-byte pertama file JPEG selalu FF D8 FF (di Apps Script nilai byte bertanda: -1, -40, -1)
function isJpeg_(b) {
  return b && b.length > 1000 && b[0] === -1 && b[1] === -40 && b[2] === -1;
}

function count_(sh, tk) {
  var n = sh.getLastRow();
  if (n < 2) return 0;
  var v = sh.getRange(2, 3, n - 1, 1).getValues(), c = 0;
  for (var i = 0; i < v.length; i++) if (v[i][0] === tk) c++;
  return c;
}

function hasPhoto_(sh, pid) {
  var n = sh.getLastRow();
  if (n < 2) return false;
  var v = sh.getRange(2, 5, n - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) if (v[i][0] === pid) return true;
  return false;
}

// Daftar id file yang MASIH ADA di folder Drive (foto yang dihapus/dibuang ke sampah tidak ikut).
// Hasilnya disimpan 30 detik supaya tidak membebani Drive.
function alive_() {
  var cache = CacheService.getScriptCache(), hit = cache.get("alive_v1");
  if (hit) { var o = {}; hit.split(",").forEach(function (id) { if (id) o[id] = 1; }); return o; }
  var ids = [], it = folder_().getFiles();
  while (it.hasNext()) ids.push(it.next().getId());
  try { cache.put("alive_v1", ids.join(","), 30); } catch (err) {}
  var res = {}; ids.forEach(function (id) { res[id] = 1; });
  return res;
}

// Foto tampil di galeri bila: barisnya ada di sheet, kolom "Tampil" (F) bukan FALSE, DAN file-nya masih ada di folder Drive.
// Jadi untuk membuang foto yang kurang bagus, cukup hapus file-nya di Google Drive.
function list_() {
  var sh = sheet_(), n = sh.getLastRow();
  if (n < 2) return { ok: true, total: 0, items: [] };
  var ok = alive_();
  var rows = sh.getRange(2, 1, n - 1, 6).getValues().filter(function (r) {
    return r[3] && r[5] !== false && ok[String(r[3])];
  });
  var items = rows.reverse().slice(0, LIST_LIMIT).map(function (r) {
    return { i: String(r[3]), n: String(r[1]), t: new Date(r[0]).getTime() };
  });
  return { ok: true, total: rows.length, items: items };
}

function doGet(e) {
  var tk = e && e.parameter && e.parameter.tk;
  if (tk) {   // cek sisa jatah satu tamu (sekaligus memastikan kode acara benar)
    if (!codeOk_(e.parameter.k)) return json_({ ok: false, err: "denied" });
    return json_({ ok: true, used: count_(sheet_(), String(tk)), max: MAX_PER_GUEST });
  }
  var cache = CacheService.getScriptCache();
  var hit = cache.get(CACHE_KEY);
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  var out = JSON.stringify(list_());
  try { cache.put(CACHE_KEY, out, CACHE_SECONDS); } catch (err) {}
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var tk = String(d.tk || "");
    var pid = String(d.pid || "");
    var name = String(d.n || "").trim().slice(0, 40);
    var img = String(d.img || "");
    if (!codeOk_(d.k)) return json_({ ok: false, err: "denied" });   // sebelum rate limit, supaya orang luar tidak bisa menghabiskan jatah kirim
    if (!/^[a-z0-9]{12,40}$/i.test(tk) || !/^[a-z0-9_-]{6,40}$/i.test(pid) || !name) return json_({ ok: false, err: "bad" });
    if (img.indexOf("data:image/jpeg;base64,") !== 0) return json_({ ok: false, err: "bad" });
    if (img.length > MAX_B64) return json_({ ok: false, err: "big" });

    var cache = CacheService.getScriptCache();
    var all = Number(cache.get("rl_all") || 0);
    if (all >= MAX_POSTS_PER_MIN) return json_({ ok: false, err: "busy" });
    cache.put("rl_all", String(all + 1), 60);

    var sh = sheet_();
    if (hasPhoto_(sh, pid)) return json_({ ok: true, dup: true, used: count_(sh, tk), max: MAX_PER_GUEST });   // kiriman ulang
    if (sh.getLastRow() > MAX_TOTAL) return json_({ ok: false, err: "full" });
    if (count_(sh, tk) >= MAX_PER_GUEST) return json_({ ok: false, err: "limit", used: MAX_PER_GUEST, max: MAX_PER_GUEST });

    // simpan file di luar lock (lambat), lalu catat di dalam lock
    var bytes = Utilities.base64Decode(img.substring(img.indexOf(",") + 1));
    if (!isJpeg_(bytes)) return json_({ ok: false, err: "bad" });
    var stamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
    var file = folder_().createFile(Utilities.newBlob(bytes, "image/jpeg", stamp + "_" + tk.slice(0, 6) + "_" + pid + ".jpg"));

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) { file.setTrashed(true); return json_({ ok: false, err: "busy" }); }
    try {
      if (hasPhoto_(sh, pid)) {   // kiriman ulang yang tiba bersamaan dengan kiriman pertama: buang salinannya
        file.setTrashed(true);
        return json_({ ok: true, dup: true, used: count_(sh, tk), max: MAX_PER_GUEST });
      }
      var used = count_(sh, tk);
      if (used >= MAX_PER_GUEST) { file.setTrashed(true); return json_({ ok: false, err: "limit", used: used, max: MAX_PER_GUEST }); }
      sh.appendRow([new Date(), safe_(name), tk, file.getId(), pid, true]);
      cache.remove(CACHE_KEY);
      return json_({ ok: true, used: used + 1, max: MAX_PER_GUEST });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, err: "error" });
  }
}


// ===== PEMBERSIHAN (jalankan manual dari editor: pilih fungsi lalu klik Run) =====

// Galeri website membaca daftar dari sheet "Foto", BUKAN dari folder Drive.
// Setelah menghapus foto di Drive, jalankan sinkronkan() supaya barisnya ikut hilang dari galeri.
function sinkronkan() {
  var sh = sheet_(), n = sh.getLastRow();
  if (n < 2) { Logger.log("Sheet kosong."); return; }
  var rows = sh.getRange(2, 1, n - 1, 6).getValues(), hapus = [];
  for (var i = 0; i < rows.length; i++) {
    var ok = false;
    try { var f = DriveApp.getFileById(String(rows[i][3])); ok = !f.isTrashed(); } catch (e) { ok = false; }
    if (!ok) hapus.push(i + 2);
  }
  for (var k = hapus.length - 1; k >= 0; k--) sh.deleteRow(hapus[k]);   // dari bawah supaya nomor baris tidak bergeser
  CacheService.getScriptCache().remove(CACHE_KEY);
  Logger.log("Selesai. " + hapus.length + " baris tanpa foto dihapus dari galeri.");
}

// HATI-HATI: mengosongkan SEMUA foto (folder Drive masuk tempat sampah + semua baris sheet dihapus).
// Pakai hanya untuk membersihkan foto uji sebelum hari H.
function resetSemua() {
  var f = folder_(), it = f.getFiles(), c = 0;
  while (it.hasNext()) { it.next().setTrashed(true); c++; }
  var sh = sheet_(), n = sh.getLastRow();
  if (n > 1) sh.deleteRows(2, n - 1);
  CacheService.getScriptCache().remove(CACHE_KEY);
  Logger.log("Reset: " + c + " foto dibuang, sheet dikosongkan.");
}
