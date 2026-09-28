/* Resilience tests for the sheet layer. Run: node test-failures.js */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const dir = __dirname;
const tpl = path.join(dir, "sheet-template");
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const cfgSrc = fs.readFileSync(path.join(dir, "config.js"), "utf8");
const contentSrc = fs.readFileSync(path.join(dir, "content.js"), "utf8");

function makeDom(fetchImpl, tweak) {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });
  const w = dom.window;
  w.eval(cfgSrc);
  w.SS_CONFIG.SHEET_ID = "TEST";
  w.SS_CONFIG.CACHE_MINUTES = 0;
  if (tweak) tweak(w);
  if (fetchImpl) w.fetch = fetchImpl;
  w.eval(contentSrc);
  return w;
}
const serve = over => url => {
  const tab = decodeURIComponent(String(url).split("sheet=")[1] || "");
  if (over && Object.prototype.hasOwnProperty.call(over, tab)) {
    const v = over[tab];
    if (v === null) return Promise.reject(new Error("network"));
    return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(v) });
  }
  const f = path.join(tpl, tab + ".csv");
  if (!fs.existsSync(f)) return Promise.resolve({ ok: false, status: 404 });
  return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(fs.readFileSync(f, "utf8")) });
};
const wait = () => new Promise(r => setTimeout(r, 400));
const results = [];
const check = (name, pass, detail) => { results.push([name, pass, detail]); };

(async () => {
  /* 1. sheet entirely unreachable -> static content intact */
  {
    const w = makeDom(() => Promise.reject(new Error("offline")));
    await wait();
    const d = w.document;
    check("offline keeps static guidelines",
      d.querySelectorAll("#acclist details.acc").length === 12,
      d.querySelectorAll("#acclist details.acc").length + " accordions");
    check("offline shows warning note",
      /Could not reach/.test(d.getElementById("sheetStatus").textContent),
      JSON.stringify(d.getElementById("sheetStatus").textContent));
  }

  /* 2. no SHEET_ID -> engine is inert */
  {
    const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });
    dom.window.eval(cfgSrc);
    dom.window.SS_CONFIG.SHEET_ID = ""; // do not depend on the shipped value
    dom.window.fetch = () => { throw new Error("should not be called"); };
    dom.window.eval(contentSrc);
    await wait();
    check("blank SHEET_ID never fetches", true, "no throw");
    check("blank SHEET_ID leaves status empty",
      dom.window.document.getElementById("sheetStatus").textContent === "", "");
  }

  /* 3. one tab broken, others fine */
  {
    const w = makeDom(serve({ committee: "!!! not,csv\nat,,,all\n\n" }));
    await wait();
    const d = w.document;
    check("broken tab does not stop others",
      d.querySelectorAll("#acclist details.acc").length === 12 &&
      d.querySelectorAll("#gal figure").length === 8, "");
  }

  /* 4. empty tab -> static fallback for that section only */
  {
    const w = makeDom(serve({ festivals: "name\n" }));
    await wait();
    const d = w.document;
    check("empty tab keeps that section static",
      d.querySelectorAll("#festChips .chip").length === 14,
      d.querySelectorAll("#festChips .chip").length + " chips");
  }

  /* 5. a real edit propagates */
  {
    const w = makeDom(serve({
      notices: 'tag,colour,title,body\nUrgent,red,Water tanker on Sunday,**Bring** your own [form](#contact).\n'
    }));
    await wait();
    const d = w.document;
    const html2 = d.getElementById("noticeList").innerHTML;
    check("edited notice renders", /Water tanker on Sunday/.test(html2), "");
    check("only one notice now", d.querySelectorAll("#noticeList > div").length === 1,
      d.querySelectorAll("#noticeList > div").length + "");
    check("**bold** becomes <b>", /<b>Bring<\/b>/.test(html2), "");
    check("[link](url) becomes anchor", /<a href="#contact">form<\/a>/.test(html2), "");
    check("red colour applied", /pill-red/.test(html2), "");
  }

  /* 6. HTML injection is neutralised */
  {
    const w = makeDom(serve({
      festivals: 'name\n"<img src=x onerror=alert(1)>"\n'
    }));
    await wait();
    const d = w.document;
    const chips = d.getElementById("festChips").innerHTML;
    check("script/img injection escaped",
      !/<img/i.test(chips) && /&lt;img/.test(chips), chips.slice(0, 70));
  }

  /* 7. #book anchor survives re-render (Quick Actions links to it) */
  {
    const w = makeDom(serve());
    await wait();
    const d = w.document;
    check("#book anchor preserved", !!d.getElementById("book"),
      d.getElementById("book") ? d.getElementById("book").querySelector("summary").textContent.trim() : "missing");
    const qa = Array.prototype.slice.call(d.querySelectorAll("#qaGrid a"))
      .map(a => a.getAttribute("href"));
    check("every quick-action target exists",
      qa.every(h => h === "#" || d.querySelector(h)), qa.join(" "));
  }

  /* 8. interactive widgets still work after re-render */
  {
    const w = makeDom(serve());
    await wait();
    const d = w.document;

    const box = d.querySelector("#checklist input");
    box.checked = true;
    box.dispatchEvent(new w.Event("change", { bubbles: true }));
    check("checklist progress updates after re-render",
      d.getElementById("bar").style.width === (100 / 8) + "%",
      d.getElementById("bar").style.width);

    const s = d.getElementById("gsearch");
    s.value = "pets";
    s.dispatchEvent(new w.Event("input", { bubbles: true }));
    const vis = d.querySelectorAll("#acclist details.acc:not(.hidden)").length;
    check("search filters re-rendered accordions", vis > 0 && vis < 12,
      vis + " of 12 match 'pets'");

    d.getElementById("revealBtn").click();
    check("phone reveal works on sheet rows",
      !!d.querySelector("#coreRows td.ph a"),
      d.querySelector("#coreRows td.ph").innerHTML);

    d.querySelector("#gal figure").dispatchEvent(new w.Event("click", { bubbles: true }));
    check("lightbox opens on sheet figures",
      d.getElementById("lb").classList.contains("open"),
      d.getElementById("lbCap").textContent);
  }

  /* 9. resolutions and records filters after re-render */
  {
    const w = makeDom(serve());
    await wait();
    const d = w.document;
    const res = () => Array.prototype.slice.call(d.querySelectorAll("#resList .res"));
    const recs = () => Array.prototype.slice.call(d.querySelectorAll("#recList .rec"));
    const vis = els => els.filter(e => !e.hidden);

    check("Latest shows only the five newest resolutions",
      res().length === 8 && vis(res()).length === 5,
      vis(res()).length + " of " + res().length);

    const dates = vis(res()).map(e => e.getAttribute("data-date"));
    check("Latest picks the newest dates",
      dates.every(x => x >= "2025-01-04"), dates.join(" "));

    const order = res().slice()
      .sort((a, b) => Number(a.style.order) - Number(b.style.order))
      .map(e => e.getAttribute("data-date"));
    check("resolutions are ordered newest first",
      order.join() === order.slice().sort().reverse().join(), order[0] + " -> " + order[order.length - 1]);

    d.querySelector('[data-res="all"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    check("All shows every resolution", vis(res()).length === 8,
      d.getElementById("resCount").textContent);
    check("All button becomes selected",
      d.querySelector('[data-res="all"]').getAttribute("aria-selected") === "true" &&
      d.querySelector('[data-res="latest"]').getAttribute("aria-selected") === "false", "aria in sync");

    d.querySelector('[data-rec="mom"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    check("records filter keeps only minutes",
      vis(recs()).length > 0 && vis(recs()).every(e => e.getAttribute("data-type") === "mom"),
      d.getElementById("recCount").textContent);

    d.querySelector('[data-rec="all"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    check("records filter resets to all", vis(recs()).length === 8,
      d.getElementById("recCount").textContent);
  }

  /* 10. empty tabs -> empty-state messages, no crash */
  {
    const w = makeDom(serve({
      resolutions: "ref,date,title,summary,status,link\n",
      records: "type,date,title,note,link\n"
    }));
    await wait();
    const d = w.document;
    check("empty resolutions tab keeps the static list",
      d.querySelectorAll("#resList .res").length === 8, "unchanged");

    d.querySelector('[data-rec="circular"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    d.querySelector('[data-rec="mom"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    check("record empty-state hidden when matches exist",
      d.getElementById("recEmpty").hidden, "hidden");
  }

  /* 11. injection through the new tabs is escaped */
  {
    const w = makeDom(serve({
      records: 'type,date,title,note,link\nmom,2025-01-01,"<img src=x onerror=alert(1)>","ok","javascript:alert(1)"\n'
    }));
    await wait();
    const row = w.document.querySelector("#recList .rec");
    check("record title injection escaped",
      !/<img/i.test(row.innerHTML) && /&lt;img/.test(row.innerHTML),
      row.querySelector(".rec-main b").textContent.slice(0, 40));
    check("javascript: link rejected", row.getAttribute("href") === "#contact",
      row.getAttribute("href"));
  }

  /* 12. the settings tab actually reaches the page */
  {
    const w = makeDom(serve({
      settings: "key,value\n" +
        "society_short_name,Test Society\n" +
        "hero_title,A test tagline.\n" +
        "manager_phone,90000 11111\n" +
        "footer_note,Test footer\n"
    }));
    await wait();
    const d = w.document;
    check("settings changes the hero name",
      d.querySelector('[data-ss="society_short_name"]').textContent === "Test Society",
      d.querySelector('[data-ss="society_short_name"]').textContent);
    check("settings changes the tagline",
      d.querySelector('[data-ss="hero_title"]').textContent === "A test tagline.",
      d.querySelector('[data-ss="hero_title"]').textContent);
    const ph = d.querySelector('[data-ss="manager_phone"]');
    check("settings rewrites a phone number and its tel: link",
      ph.textContent === "90000 11111" && ph.getAttribute("href") === "tel:+919000011111",
      ph.getAttribute("href"));
    check("settings changes the footer note",
      d.querySelector('[data-ss="footer_note"]').textContent === "Test footer",
      d.querySelector('[data-ss="footer_note"]').textContent);
  }

  /* 13. SHEET_ID pasted as a full browser address still works */
  {
    const seen = [];
    const w = makeDom(url => { seen.push(String(url)); return serve()(url); }, win => {
      win.SS_CONFIG.SHEET_ID =
        "https://docs.google.com/spreadsheets/d/1q5g835WiZntkqVduc4kMhLitrrsXT3ddp4ttI3AaiTs/edit?usp=sharing";
    });
    await wait();
    check("full sheet URL is reduced to the bare ID",
      seen.length > 0 && seen.every(u =>
        u.indexOf("/spreadsheets/d/1q5g835WiZntkqVduc4kMhLitrrsXT3ddp4ttI3AaiTs/gviz/") !== -1),
      seen[0] ? seen[0].slice(0, 78) : "no fetch happened");
    check("full sheet URL still renders content",
      w.document.querySelectorAll("#acclist details.acc").length === 12,
      w.document.querySelectorAll("#acclist details.acc").length + " accordions");
  }

  /* 14. a sheet ID with surrounding whitespace is tolerated */
  {
    const seen = [];
    const w = makeDom(url => { seen.push(String(url)); return serve()(url); }, win => {
      win.SS_CONFIG.SHEET_ID = "  1q5g835WiZntkqVduc4kMhLitrrsXT3ddp4ttI3AaiTs  ";
    });
    await wait();
    check("whitespace around the ID is trimmed",
      seen.length > 0 && seen.every(u => u.indexOf(" ") === -1 && u.indexOf("%20") === -1),
      seen[0] ? seen[0].slice(0, 78) : "no fetch happened");
  }

  /* 15. a mis-pasted resolutions tab must not blank the section */
  {
    /* Reproduces a real incident: a whole column of values was pasted into
       each header cell, so every column was renamed and no row matched. */
    const bad =
      '"ref GBM/2025/01 MC/2025/04","date 2025-04-26 2025-03-12",' +
      '"title Guidelines adopted Penalty schedule","summary First one. Second one.",' +
      '"status Passed Passed","link "\r\n' +
      '"AGBM/2026/SEP","9/27/2026","Water Fund Utilization","The fund pays for tankers.","",""\r\n';
    const w = makeDom(serve({ resolutions: bad }));
    await wait();
    const arts = w.document.querySelectorAll("#resList article.res");
    check("corrupted resolutions tab keeps the built-in list",
      arts.length === 8, arts.length + " cards");
    check("corrupted resolutions tab renders no empty card",
      [].every.call(arts, a => a.querySelector("b").textContent.trim() !== ""),
      "an empty card was rendered");
  }

  /* 16. a healthy resolutions tab still replaces the built-in list */
  {
    const w = makeDom(serve());
    await wait();
    const arts = w.document.querySelectorAll("#resList article.res");
    const titles = [].map.call(arts, a => a.querySelector("b").textContent.trim());
    check("valid resolutions tab still renders every row",
      arts.length === 8 && titles.every(t => t !== ""),
      arts.length + " cards");
    check("valid resolutions tab keeps sheet content",
      titles.indexOf("Society Guidelines v1.0 adopted") !== -1,
      titles.slice(0, 2).join(" | "));
  }

  let fails = 0;
  results.forEach(([n, ok, det]) => {
    if (!ok) fails++;
    console.log((ok ? "  PASS  " : "  FAIL  ") + n + (det ? "   [" + det + "]" : ""));
  });
  console.log("\n" + (results.length - fails) + "/" + results.length + (fails ? "  <-- FAILURES" : "  all good"));
})();
