/* Packs the generated CSVs into one .xlsx workbook so the admin can
   upload a single file to Google Drive instead of importing 13 CSVs.
   Run: node build-sheet-xlsx.js  (after build-sheet-csv.js) */

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const tpl = path.join(__dirname, "sheet-template");
const OUT = path.join(__dirname, "Shweta-Shubham-Content.xlsx");

/* Tab order matters: this is the order the admin sees them in. */
const TABS = ["settings", "notices", "festivals", "quick_actions", "helplines",
  "timings", "guidelines", "staff_scope", "fees", "committee", "escalation",
  "checklist", "downloads", "gallery", "posters", "events", "improvements",
  "resolutions", "records"];

/* Column widths, by header name, so the sheet is readable on open. */
const WIDTH = {
  text: 90, body: 70, note: 60, detail: 70, responsibilities: 55,
  notes: 45, availability: 35, keywords: 45, caption: 45, value: 70,
  title: 34, label: 34, activity: 30, name: 22, role: 18, contact: 22,
  section: 9, kind: 10, group: 13, icon: 6, anchor: 10, colour: 8,
  colour1: 9, colour2: 9, type: 9, amount: 22, phone: 14, flat: 8,
  post: 16, key: 20, link: 14, url: 34, file: 18, number: 14, tag: 14,
  ref: 15, date: 13, summary: 70, status: 12, details: 64, photo: 52
};

function readCSV(name) {
  const f = path.join(tpl, name + ".csv");
  if (!fs.existsSync(f)) return null;
  const wb = XLSX.read(fs.readFileSync(f, "utf8"), { type: "string", raw: true });
  return wb.Sheets[wb.SheetNames[0]];
}

const wb = XLSX.utils.book_new();
let total = 0;

/* First tab: plain-English instructions, so the workbook explains itself. */
const HELP = [
  ["HOW TO USE THIS SHEET"],
  [""],
  ["This workbook controls the Shweta Shubham website."],
  ["Edit a cell, wait a few minutes, refresh the website - the change is live."],
  [""],
  ["THE RULES"],
  ["1. Never rename a tab. The website looks tabs up by name."],
  ["2. Never rename or reorder the headings in row 1."],
  ["3. Add a new item by adding a row. Remove one by deleting the row."],
  ["4. Reorder items by dragging rows up or down. The website follows sheet order."],
  ["5. Leave a cell blank if it does not apply. Never delete the column."],
  [""],
  ["FORMATTING TEXT"],
  ["**important**", "makes the text bold"],
  ["[call us](tel:9704285706)", "makes a clickable link"],
  ["[see the rules](#guidelines)", "links to a section of the website"],
  [""],
  ["WHAT EACH TAB DOES"],
  ["settings", "Society name, hero wording, emergency numbers shown at the top"],
  ["notices", "The notice board. Newest at the top. colour = red / gold / green / grey"],
  ["festivals", "The festival chips under 'Celebrations we share'"],
  ["quick_actions", "The eight shortcut tiles near the top of the page"],
  ["timings", "The timings quick-reference table"],
  ["guidelines", "The full rulebook. See the note below."],
  ["staff_scope", "What the electrician, plumber, housekeeping, gardener and security cover"],
  ["fees", "type=card for the three summary boxes, type=penalty for the fines table"],
  ["committee", "group = core / advisory / extended"],
  ["escalation", "Who to contact, in order"],
  ["checklist", "The new-resident checklist. Numbering is automatic."],
  ["downloads", "Forms and documents. Paste a Google Drive share link in url, or a file name kept beside the website."],
  ["gallery", "Photos. Paste a Google Drive share link in file, or use an images folder file name."],
  ["posters", "Tall 9:16 guideline posters. Use a Google Drive link, or the image file name."],
  ["events", "Photographs from society events. See the note below."],
  ["improvements", "Infrastructure and facilities created by SSMACS. title, category, year, details. No photo."],
  ["resolutions", "Committee / GBM decisions. Newest first is not required \u2014 the site sorts by date."],
  ["records", "Minutes of meetings, notices and circulars. See the note below."],
  [""],
  ["ABOUT THE EVENTS TAB"],
  ["name", "The event, e.g. Ganesh Chaturthi 2026. A row with no name is skipped."],
  ["date", "Type it as 2026-09-14 (year-month-day). The newest event is shown first."],
  ["details", "A sentence or two about the day. Optional."],
  ["photo", "The Google Drive link to the picture. Leave blank if the row has a video."],
  ["video", "The Google Drive link to a video, or a YouTube link. Optional."],
  [""],
  ["A row needs a name and either a photo or a video. A video slide shows a still"],
  ["from the film with a play button; tapping it plays the film full screen."],
  [""],
  ["IMPORTANT: each picture in Drive must be shared as"],
  ["", "Share -> General access -> Anyone with the link -> Viewer."],
  ["Without that the picture is private and residents see a placeholder."],
  ["Paste the ordinary Drive share link. The website converts it itself."],
  ["The section stays hidden until this tab has at least one complete row."],
  ["The posters and gallery tabs take Drive links in the same way, same sharing rule."],
  [""],
  ["ABOUT THE RESOLUTIONS TAB"],
  ["date", "Type it as 2025-04-26 (year-month-day). Format the column as Plain text."],
  ["status", "Passed / Approved / Noted / Deferred / Pending / Rejected \u2014 this sets the colour."],
  ["link", "Optional. A link to the full resolution PDF. Leave blank if there isn't one."],
  ["The 'Latest' button shows the five most recent; 'All' shows everything."],
  [""],
  ["ABOUT THE RECORDS TAB"],
  ["type", "mom = minutes of meeting, notice, or circular. This drives the filter buttons."],
  ["date", "Type it as 2025-04-26 (year-month-day). Format the column as Plain text."],
  ["link", "The PDF file name, e.g. gbm-april-2025.pdf, uploaded next to the website."],
  ["Leave link blank and the row points at the contact section instead."],
  [""],
  ["ABOUT THE GUIDELINES TAB"],
  ["Each rule section is several rows sharing the same 'section' number."],
  ["Fill in title, keywords and anchor on the FIRST row of a section only."],
  ["The 'kind' column decides how the row looks:"],
  ["li", "a normal bullet point"],
  ["sub", "a bold sub-heading, e.g. 'Gym' inside the Sports section"],
  ["note", "a grey highlighted box"],
  ["note-red", "a red warning box"],
  ["note-green", "a green box"],
  ["p", "an ordinary paragraph"],
  [""],
  ["'keywords' are extra words the website search should match for that section."],
  [""],
  ["IF SOMETHING GOES WRONG"],
  ["The website falls back to its built-in copy if this sheet cannot be read,"],
  ["so a mistake here can never take the site down. Undo the change and refresh."],
  [""],
  ["Remember: Share -> Anyone with the link -> Viewer, or the website cannot read this."]
];
const helpWs = XLSX.utils.aoa_to_sheet(HELP);
helpWs["!cols"] = [{ wch: 34 }, { wch: 78 }];
XLSX.utils.book_append_sheet(wb, helpWs, "READ ME FIRST");

TABS.forEach(function (tab) {
  const ws = readCSV(tab);
  if (!ws) { console.log("  skipped (no csv): " + tab); return; }

  const range = XLSX.utils.decode_range(ws["!ref"]);
  const headers = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: c })];
    headers.push(cell ? String(cell.v) : "");
  }

  ws["!cols"] = headers.map(function (h) { return { wch: WIDTH[h] || 18 }; });
  ws["!rows"] = [{ hpt: 20 }];
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: ws["!ref"] };

  XLSX.utils.book_append_sheet(wb, ws, tab);
  total += range.e.r;
  console.log("  " + tab.padEnd(15) + range.e.r + " rows");
});

XLSX.writeFile(wb, OUT);
console.log("\n" + wb.SheetNames.length + " tabs, " + total + " content rows");
console.log("Written: " + OUT);
