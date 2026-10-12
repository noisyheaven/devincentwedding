var SHEET_NAME = "Ucapan";
var LIMIT = 200;            // wishes shown on the page
var MAX_ROWS = 2000;        // hard stop against flooding
var CACHE_KEY = "wishes_v1";
var CACHE_SECONDS = 30;
var MAX_POSTS_PER_MIN = 20; // all guests combined

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Waktu", "Nama", "Ucapan", "Kehadiran", "Tampil"]);
  } else {
    if (!sh.getRange("D1").getValue()) sh.getRange("D1").setValue("Kehadiran");
    if (!sh.getRange("E1").getValue()) sh.getRange("E1").setValue("Tampil");
  }
  return sh;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function safe_(s) { return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }

// Hide a wish from the page: set its "Tampil" cell (column E) to FALSE.
function build_() {
  var sh = sheet_(), n = sh.getLastRow();
  if (n < 2) return { total: 0, hadir: 0, tidak: 0, items: [] };
  var rows = sh.getRange(2, 1, n - 1, 5).getValues().filter(function (r) {
    return r[1] && r[2] && r[4] !== false;
  });
  // count people, not rows: latest answer per name wins
  var latest = {};
  rows.forEach(function (r) { latest[String(r[1]).trim().toLowerCase()] = r[3]; });
  var hadir = 0, tidak = 0;
  Object.keys(latest).forEach(function (k) {
    if (latest[k] === "Hadir") hadir++; else if (latest[k] === "Tidak hadir") tidak++;
  });
  var items = rows.reverse().slice(0, LIMIT).map(function (r) {
    return { t: new Date(r[0]).getTime(), n: String(r[1]), m: String(r[2]), a: String(r[3] || "") };
  });
  return { total: rows.length, hadir: hadir, tidak: tidak, items: items };
}

function doGet() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(CACHE_KEY);
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  var out = JSON.stringify(build_());
  try { cache.put(CACHE_KEY, out, CACHE_SECONDS); } catch (e) {}   // skip if too big for cache
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false });
  try {
    var d = JSON.parse(e.postData.contents);
    var n = String(d.n || "").trim().slice(0, 60);
    var m = String(d.m || "").trim().slice(0, 500);
    var a = String(d.a || "");
    if (!n || !m || d.h || (a !== "Hadir" && a !== "Tidak hadir")) return json_({ ok: false });

    var cache = CacheService.getScriptCache();
    var who = "rl_" + n.toLowerCase().slice(0, 40);
    var all = Number(cache.get("rl_all") || 0);
    if (cache.get(who) || all >= MAX_POSTS_PER_MIN) return json_({ ok: false });

    var sh = sheet_();
    if (sh.getLastRow() > MAX_ROWS) return json_({ ok: false });
    sh.appendRow([new Date(), safe_(n), safe_(m), a, true]);

    cache.put(who, "1", 20);
    cache.put("rl_all", String(all + 1), 60);
    cache.remove(CACHE_KEY);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false });
  } finally {
    lock.releaseLock();
  }
}
