/* Local round-trip test: render index.html through content.js using the
   generated CSVs, then compare the result against the original static HTML.
   Not part of the site. Run: node test-roundtrip.js */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const dir = __dirname;
const tplDir = path.join(dir, "sheet-template");

const TABS = ["settings", "notices", "festivals", "timings", "guidelines",
  "staff_scope", "fees", "committee", "escalation", "checklist",
  "downloads", "gallery", "quick_actions", "resolutions", "records", "posters",
  "helplines", "improvements"];

const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

function snapshot(doc) {
  const ids = ["noticeList", "festRows", "timingRows", "acclist", "scopeGrid",
    "feeCards", "penaltyRows", "coreRows", "advRows", "extRows", "escRows",
    "checklist", "dlList", "gal", "qaGrid", "resList", "recList", "posGrid",
    "helpGrid", "builtGrid"];
  const o = {};
  ids.forEach(id => {
    const el = doc.getElementById(id);
    o[id] = el ? el.textContent.replace(/\s+/g, " ").trim() : null;
  });
  return o;
}

(async () => {
  // 1. baseline: static page, no sheet configured
  const base = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });
  base.window.eval(fs.readFileSync(path.join(dir, "config.js"), "utf8"));
  base.window.eval(fs.readFileSync(path.join(dir, "content.js"), "utf8"));
  const before = snapshot(base.window.document);

  // 2. sheet-driven: stub fetch to serve the generated CSVs
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });
  const w = dom.window;
  w.eval(fs.readFileSync(path.join(dir, "config.js"), "utf8"));
  w.SS_CONFIG.SHEET_ID = "TEST";
  w.SS_CONFIG.CACHE_MINUTES = 0;
  w.fetch = url => {
    const tab = decodeURIComponent(String(url).split("sheet=")[1] || "");
    const f = path.join(tplDir, tab + ".csv");
    if (!fs.existsSync(f)) return Promise.resolve({ ok: false, status: 404 });
    return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(fs.readFileSync(f, "utf8")) });
  };
  w.eval(fs.readFileSync(path.join(dir, "content.js"), "utf8"));
  await new Promise(r => setTimeout(r, 400));
  const after = snapshot(w.document);

  let bad = 0;
  Object.keys(before).forEach(id => {
    const a = before[id], b = after[id];
    if (a === b) { console.log("  same   " + id); return; }
    // normalise the few cosmetic differences we intentionally allow
    const na = a.replace(/\s+/g, ""), nb = b.replace(/\s+/g, "");
    if (na === nb) { console.log("  same   " + id); return; }
    bad++;
    console.log("  DIFF   " + id);
    for (let i = 0; i < Math.max(na.length, nb.length); i++) {
      if (na[i] !== nb[i]) {
        console.log("         static: ..." + JSON.stringify(na.slice(Math.max(0, i - 50), i + 70)));
        console.log("         sheet : ..." + JSON.stringify(nb.slice(Math.max(0, i - 50), i + 70)));
        break;
      }
    }
  });

  console.log("\nstatus note: " + JSON.stringify(w.document.getElementById("sheetStatus").textContent));
  console.log("accordions rendered: " + w.document.querySelectorAll("#acclist details.acc").length);
  console.log("checklist boxes: " + w.document.querySelectorAll("#checklist input").length);
  console.log("gallery figures: " + w.document.querySelectorAll("#gal figure").length);
  console.log("resolutions rendered: " + w.document.querySelectorAll("#resList .res").length);
  console.log("records rendered: " + w.document.querySelectorAll("#recList .rec").length);
  console.log("resolutions visible (Latest): " +
    Array.prototype.filter.call(w.document.querySelectorAll("#resList .res"), function (e) { return !e.hidden; }).length);
  console.log("resCount: " + JSON.stringify(w.document.getElementById("resCount").textContent));
  console.log("recCount: " + JSON.stringify(w.document.getElementById("recCount").textContent));
  console.log(bad ? "\n" + bad + " SECTION(S) DIFFER" : "\nALL SECTIONS MATCH");
})();
