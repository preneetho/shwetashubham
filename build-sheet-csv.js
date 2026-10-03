const fs = require("fs");
const path = require("path");

/* Builds the starter CSV files for the Google Sheet by reading the
   content currently hard-coded in index.html. Run once:
     node build-sheet-csv.js
   Output goes to ./sheet-template/ */

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const OUT = path.join(__dirname, "sheet-template");
fs.mkdirSync(OUT, { recursive: true });

const named = {
  amp: "&", nbsp: " ", mdash: "\u2014", ndash: "\u2013", minus: "\u2212",
  middot: "\u00b7", rarr: "\u2192", lt: "<", gt: ">", quot: '"',
  rsquo: "\u2019", lsquo: "\u2018", ldquo: "\u201c", rdquo: "\u201d",
  hellip: "\u2026", times: "\u00d7", copy: "\u00a9", deg: "\u00b0"
};
const dec = s => String(s)
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&(\w+);/g, (m, n) => (named[n] !== undefined ? named[n] : m));

/* Photos live in images/<section>/, but the sheet only wants the file name,
   so strip the folder back off on the way out. Full URLs are left alone. */
const bare = s => /^https?:\/\//i.test(s)
  ? s
  : String(s).replace(/^images\//, "").replace(/^(gallery|posters|brand|hero)\//, "");

/* Keep <b> as **bold**, drop every other tag. */
const txt = s => dec(
  String(s)
    .replace(/<b>/g, "**").replace(/<\/b>/g, "**")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
).replace(/[ \t]+/g, " ").replace(/\*\*\s*\*\*/g, "").trim();

const csv = rows => rows.map(r => r.map(c => {
  const v = c === undefined || c === null ? "" : String(c);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}).join(",")).join("\n") + "\n";

const write = (name, rows) => {
  fs.writeFileSync(path.join(OUT, name + ".csv"), csv(rows), "utf8");
  console.log(name.padEnd(15), (rows.length - 1) + " rows");
};

const between = (startRe, endRe) => {
  const a = html.search(startRe);
  if (a < 0) return "";
  const b = html.slice(a).search(endRe);
  return b < 0 ? html.slice(a) : html.slice(a, a + b);
};
const pickId = id => {
  const a = html.indexOf('id="' + id + '"');
  if (a < 0) return "";
  const open = html.lastIndexOf("<", a);
  const tag = html.slice(open + 1).match(/^[a-z0-9]+/i)[0];
  let i = html.indexOf(">", a) + 1, depth = 1, start = i;
  const re = new RegExp("<(/?)" + tag + "\\b", "gi");
  re.lastIndex = i;
  let m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index);
  }
  return "";
};

/* ---------- settings ---------- */
/* Every key below has a matching data-ss="…" hook in index.html. */
write("settings", [
  ["key", "value"],
  ["society_short_name", txt(between(/<span class="hero-name"[^>]*>/, /<\/span>/))],
  ["society_name", "Shweta Shubham Flat Owners Cooperative Maintenance Society Ltd"],
  ["hero_title", txt(between(/<span class="hero-tag"[^>]*>/, /<\/span>/))],
  ["hero_lede", txt(between(/<p class="lede"[^>]*>/, /<\/p>/))],
  ["manager_name", "Maintenance Manager"],
  ["manager_phone", "97042 85706"],
  ["manager_hours", "9:00 AM \u2013 6:30 PM"],
  ["security_name", "Security ASO"],
  ["security_phone", "90304 93579"],
  ["security_hours", "Nights & emergencies"],
  ["society_email", txt(between(/<a[^>]*data-ss="society_email"[^>]*>/, /<\/a>/))],
  ["footer_note", "Guidelines v1.0 \u00b7 Prepared by SSMACS \u00b7 Approved in the April GBM"],
  ["map_embed", "https://maps.google.com/maps?q=Shweta+Shubham,+Kompally,+Hyderabad&z=16&hl=en&output=embed"]
]);

/* ---------- resolutions ---------- */
{
  const rows = [["ref", "date", "title", "summary", "status", "link"]];
  const block = pickId("resList");
  const re = /<article class="res" data-date="([^"]*)">\s*<div class="res-top">(?:<span class="res-ref">([\s\S]*?)<\/span>)?\s*(?:<time[^>]*>[\s\S]*?<\/time>)?\s*<span class="pill pill-\w+">([\s\S]*?)<\/span>\s*<\/div>\s*<b>([\s\S]*?)<\/b>\s*<p>([\s\S]*?)<\/p>/g;
  let m; while ((m = re.exec(block))) rows.push([txt(m[2] || ""), m[1], txt(m[4]), txt(m[5]), txt(m[3]), ""]);
  write("resolutions", rows);
}

/* ---------- records (minutes, notices, circulars) ---------- */
{
  const rows = [["type", "date", "title", "note", "link"]];
  const block = pickId("recList");
  const re = /<a class="rec" data-type="(\w+)" data-date="([^"]*)" href="([^"]*)">[\s\S]*?<span class="pill pill-\w+">[\s\S]*?<\/span>\s*<b>([\s\S]*?)<\/b>\s*<small>([\s\S]*?)<\/small>/g;
  let m; while ((m = re.exec(block))) rows.push([m[1], m[2], txt(m[4]), txt(m[5]), m[3]]);
  write("records", rows);
}

/* ---------- quick_actions ---------- */
{
  const rows = [["icon", "title", "note", "link"]];
  const block = pickId("qaGrid");
  const re = /<a class="card tile" href="([^"]+)">\s*<span class="ico">([\s\S]*?)<\/span>\s*<b>([\s\S]*?)<\/b>\s*<small>([\s\S]*?)<\/small>/g;
  let m; while ((m = re.exec(block))) rows.push([dec(m[2]).trim(), txt(m[3]), txt(m[4]), m[1]]);
  write("quick_actions", rows);
}

/* ---------- helplines ---------- */
{
  const rows = [["group", "icon", "name", "number", "note"]];
  const block = pickId("helpGrid");
  const re = /<a class="card hl[^"]*" href="[^"]*">\s*<span class="hl-top"><span class="hl-ico">([\s\S]*?)<\/span><span class="pill pill-\w+">([\s\S]*?)<\/span><\/span>\s*<b>([\s\S]*?)<\/b>\s*<span class="hl-num">([\s\S]*?)<\/span>\s*<small>([\s\S]*?)<\/small>/g;
  let m; while ((m = re.exec(block))) rows.push([txt(m[2]), dec(m[1]).trim(), txt(m[3]), txt(m[4]), txt(m[5])]);
  write("helplines", rows);
}

/* ---------- latest events ---------- */
{
  /* Nothing to lift out of the page here: the events carousel shows only
     what the committee puts in the sheet, so the tab is created with its
     headings and no rows. The section stays hidden until one is added. */
  write("events", [["name", "date", "details", "photo", "video"]]);
}

/* ---------- infrastructure & facilities created by SSMACS ---------- */
{
  const rows = [["title", "category", "year", "details"]];
  const re = /<article class="card built-card"><div class="built-top"><span class="chip">([\s\S]*?)<\/span>(?:<span class="built-year">([\s\S]*?)<\/span>)?<\/div><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/article>/g;
  let m; while ((m = re.exec(pickId("builtGrid")))) rows.push([txt(m[3]), txt(m[1]), txt(m[2] || ""), txt(m[4])]);
  write("improvements", rows);
}

/* ---------- notices ---------- */
{
  const rows = [["tag", "colour", "title", "body"]];
  const block = pickId("noticeList");
  const re = /<span class="pill pill-(\w+)">([\s\S]*?)<\/span>\s*<b[^>]*>([\s\S]*?)<\/b>\s*<small[^>]*>([\s\S]*?)<\/small>/g;
  let m; while ((m = re.exec(block))) rows.push([txt(m[2]), m[1], txt(m[3]), txt(m[4])]);
  write("notices", rows);
}

/* ---------- festivals ---------- */
{
  const rows = [["name", "date"]];
  const re = /<tr><td><b>([\s\S]*?)<\/b><\/td><td class="num">([\s\S]*?)<\/td><\/tr>/g;
  let m; while ((m = re.exec(pickId("festRows")))) rows.push([txt(m[1]), txt(m[2])]);
  write("festivals", rows);
}

/* ---------- timings ---------- */
{
  const rows = [["activity", "timings", "notes"]];
  const re = /<tr>\s*<td>([\s\S]*?)<\/td>\s*<td class="num">([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;
  let m; while ((m = re.exec(pickId("timingRows")))) rows.push([txt(m[1]), txt(m[2]), txt(m[3])]);
  write("timings", rows);
}

/* ---------- gate access ---------- */
{
  const rows = [["gate", "timing", "access"]];
  /* The gate cell is only present on the first row of a run, so carry the
     last one forward — the sheet wants a gate name on every row. */
  const re = /<tr>\s*(?:<td(?: rowspan="\d+")?>([\s\S]*?)<\/td>\s*)?<td class="num">([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;
  let m, gate = "";
  while ((m = re.exec(pickId("gateRows")))) {
    if (m[1] !== undefined) gate = txt(m[1]);
    rows.push([gate, txt(m[2]), txt(m[3])]);
  }
  write("gates", rows);
}

/* ---------- guidelines ---------- */
{
  const rows = [["section", "title", "keywords", "anchor", "kind", "text"]];
  const block = pickId("acclist");
  const accRe = /<details class="acc"([^>]*)>\s*<summary><span class="sec-no">([\s\S]*?)<\/span>([\s\S]*?)<\/summary>\s*<div class="body">([\s\S]*?)<\/div>\s*<\/details>/g;
  let a;
  while ((a = accRe.exec(block))) {
    const attrs = a[1];
    const kw = (attrs.match(/data-k="([^"]*)"/) || ["", ""])[1];
    const anchor = (attrs.match(/\bid="([^"]*)"/) || ["", ""])[1];
    const no = txt(a[2]), title = txt(a[3]), body = a[4];
    let first = true;
    const partRe = /<p[^>]*><b>([\s\S]*?)<\/b><\/p>|<li>([\s\S]*?)<\/li>|<div class="note(?: (red|green))?">([\s\S]*?)<\/div>|<p[^>]*>((?!<b>)[\s\S]*?)<\/p>/g;
    let p;
    while ((p = partRe.exec(body))) {
      let kind, text;
      if (p[1] !== undefined) { kind = "sub"; text = txt(p[1]); }
      else if (p[2] !== undefined) { kind = "li"; text = txt(p[2]); }
      else if (p[5] !== undefined) { kind = "p"; text = txt(p[5]); }
      else { kind = p[3] ? "note-" + p[3] : "note"; text = txt(p[4]); }
      if (!text) continue;
      rows.push([no, first ? title : "", first ? kw : "", first ? anchor : "", kind, text]);
      first = false;
    }
    if (first) rows.push([no, title, kw, anchor, "p", ""]);
  }
  write("guidelines", rows);
}

/* ---------- staff_scope ---------- */
{
  const rows = [["role", "icon", "group", "text"]];
  const block = pickId("scopeGrid");
  const cardRe = /<div class="card"[^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<div class="card"|$)/g;
  let c;
  while ((c = cardRe.exec(block))) {
    const head = dec(c[1]).trim();
    const sp = head.indexOf(" ");
    const icon = sp > 0 ? head.slice(0, sp) : "";
    const role = sp > 0 ? head.slice(sp + 1) : head;
    const body = c[2];

    if (!/class="scope"/.test(body)) {
      const pr = /<p[^>]*>([\s\S]*?)<\/p>/g; let q;
      while ((q = pr.exec(body))) rows.push([role, icon, "prose", txt(q[1])]);
      continue;
    }
    const colRe = /<h4><span class="pill pill-(\w+)">([\s\S]*?)<\/span><\/h4>\s*<ul>([\s\S]*?)<\/ul>/g;
    let col;
    while ((col = colRe.exec(body))) {
      const label = txt(col[2]).toLowerCase();
      const group = label === "covered" ? "covered"
        : label === "resident duties" ? "duties" : "not_covered";
      const li = /<li>([\s\S]*?)<\/li>/g; let l;
      while ((l = li.exec(col[3]))) rows.push([role, icon, group, txt(l[1])]);
    }
  }
  write("staff_scope", rows);
}

/* ---------- fees ---------- */
{
  const rows = [["type", "label", "amount", "note", "colour"]];
  const cards = pickId("feeCards");
  const cr = /<span class="pill pill-(\w+)">([\s\S]*?)<\/span>\s*<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
  let m; while ((m = cr.exec(cards))) rows.push(["card", txt(m[2]), txt(m[3]), txt(m[4]), m[1]]);
  const pr = /<tr><td>([\s\S]*?)<\/td><td class="num">([\s\S]*?)<\/td><\/tr>/g;
  while ((m = pr.exec(pickId("penaltyRows")))) rows.push(["penalty", txt(m[1]), txt(m[2]), "", ""]);
  write("fees", rows);
}

/* ---------- committee ---------- */
{
  const rows = [["group", "name", "post", "flat", "phone", "responsibilities"]];
  const cr = /<tr><td><b>([\s\S]*?)<\/b><\/td><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td class="num ph">([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g;
  let m; while ((m = cr.exec(pickId("coreRows")))) rows.push(["core", txt(m[1]), txt(m[2]), txt(m[3]), txt(m[4]), txt(m[5])]);
  const sr = /<tr><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td class="num ph">([\s\S]*?)<\/td><\/tr>/g;
  [["advisory", "advRows"], ["extended", "extRows"]].forEach(([g, id]) => {
    sr.lastIndex = 0; const b = pickId(id); let n;
    while ((n = sr.exec(b))) rows.push([g, txt(n[1]), "", txt(n[2]), txt(n[3]), ""]);
  });
  write("committee", rows);
}

/* ---------- escalation ---------- */
{
  const rows = [["contact", "number", "availability"]];
  const re = /<tr><td class="num">\d+<\/td><td><b>([\s\S]*?)<\/b><\/td><td class="num">([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g;
  let m; while ((m = re.exec(pickId("escRows")))) rows.push([txt(m[1]), txt(m[2]), txt(m[3])]);
  write("escalation", rows);
}

/* ---------- checklist ---------- */
{
  const rows = [["title", "detail"]];
  const re = /<b>\s*\d+\.\s*([\s\S]*?)<\/b><small>([\s\S]*?)<\/small>/g;
  let m; while ((m = re.exec(pickId("checklist")))) rows.push([txt(m[1]), txt(m[2])]);
  write("checklist", rows);
}

/* ---------- downloads ---------- */
{
  const rows = [["title", "note", "url"]];
  const re = /<a href="([^"]*)"[^>]*>\s*<b>([\s\S]*?)<\/b><br><small[^>]*>([\s\S]*?)<\/small>/g;
  let m; while ((m = re.exec(pickId("dlList")))) {
    rows.push([txt(m[2]).replace(/^\uD83D\uDCC4\s*/, ""), txt(m[3]), m[1]]);
  }
  write("downloads", rows);
}

/* ---------- gallery ---------- */
{
  const rows = [["title", "file", "caption", "colour1", "colour2"]];
  const re = /<figure tabindex="0" data-cap="([^"]*)">\s*<img src="images\/([^"]+)" alt="([^"]*)" data-c1="([^"]*)" data-c2="([^"]*)"[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>/g;
  let m; while ((m = re.exec(pickId("gal")))) rows.push([dec(m[6]), bare(m[2]), dec(m[1]), m[4], m[5]]);
  write("gallery", rows);
}

/* ---------- guideline posters ---------- */
{
  const rows = [["title", "file", "caption"]];
  const re = /<figure tabindex="0" data-cap="([^"]*)">\s*<div class="shot"><img src="([^"]+)" alt="([^"]*)"[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>/g;
  let m; while ((m = re.exec(pickId("posGrid")))) {
    rows.push([dec(m[4]), bare(m[2]), dec(m[1])]);
  }
  write("posters", rows);
}

console.log("\nCSV files written to: " + OUT);
