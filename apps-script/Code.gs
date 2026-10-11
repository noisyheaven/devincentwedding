// Paste this whole file into Google Apps Script (replace the old code), then Save and redeploy (see README).
var SHEET_NAME = "Ucapan";
var LIMIT = 200;                      // the page shows the latest 200 wishes (the counter counts all of them)

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(["Waktu", "Nama", "Ucapan", "Kehadiran"]); }
  else if (!sh.getRange("D1").getValue()) { sh.getRange("D1").setValue("Kehadiran"); }
  return sh;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }   // stops spreadsheet formulas

// Returns the totals and the latest wishes, newest first.
function doGet() {
  var sh = sheet_(), n = sh.getLastRow();
  if (n < 2) return json_({ total: 0, hadir: 0, tidak: 0, items: [] });
  var rows = sh.getRange(2, 1, n - 1, 4).getValues().filter(function (r) { return r[1] && r[2]; });  // skips blank rows
  var hadir = 0, tidak = 0;
  rows.forEach(function (r) { if (r[3] === "Hadir") hadir++; else if (r[3] === "Tidak hadir") tidak++; });
  var items = rows.reverse().slice(0, LIMIT).map(function (r) {
    return { t: new Date(r[0]).getTime(), n: String(r[1]), m: String(r[2]), a: String(r[3] || "") };
  });
  return json_({ total: rows.length, hadir: hadir, tidak: tidak, items: items });
}

// Saves a new wish. Attendance must be "Hadir" or "Tidak hadir".
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var n = String(d.n || "").trim().slice(0, 60);
    var m = String(d.m || "").trim().slice(0, 500);
    var a = String(d.a || "");
    if (!n || !m || d.h || (a !== "Hadir" && a !== "Tidak hadir")) return json_({ ok: false });
    sheet_().appendRow([new Date(), safe_(n), safe_(m), a]);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}
