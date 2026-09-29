# Updating the website — a guide for the society admin

You do **not** need to know any coding. All the content on the website lives
in one Google Sheet. You edit the sheet, the website updates itself.

---

## Part 1 — One-time setup (about 10 minutes)

Do this once. After that, you only ever touch the Google Sheet.

### Step 1 — Create the sheet

1. Go to <https://drive.google.com> and sign in with the society's Google account.
2. Click **New → File upload** and choose **`Shweta-Shubham-Content.xlsx`**
   (it came with the website files).
3. When it finishes uploading, **double-click** the file in Drive.
4. Click **Open with → Google Sheets** at the top.
5. Click **File → Save as Google Sheets**.

You now have a sheet with 14 tabs along the bottom, already filled in with
everything currently on the website.

> The first tab, **READ ME FIRST**, repeats these rules inside the sheet itself.

### Step 2 — Let the website read it

1. Click the green **Share** button (top right).
2. Under **General access**, change *Restricted* to **Anyone with the link**.
3. Make sure the role next to it says **Viewer** — not Editor.
4. Click **Done**.

This only allows *reading*. Nobody can edit it except the people you invite.

> The website is public, so treat anything in this sheet as public. Don't put
> anything private in it.

### Step 3 — Tell the website which sheet to read

1. Look at your browser's address bar while the sheet is open. It looks like:

   ```
   https://docs.google.com/spreadsheets/d/1a2B3cD4eF5gH6iJ7kL8mN9oP0qR/edit#gid=0
                                          └──────────────────────────┘
                                                 this part is the ID
   ```

2. Copy that middle part.
3. Open the file **`config.js`** in any text editor (Notepad works).
4. Paste the ID between the quotes:

   ```js
   SHEET_ID: "1a2B3cD4eF5gH6iJ7kL8mN9oP0qR",
   ```

5. Save the file, then put the updated site online again:
   sign in at **app.netlify.com**, open the site, go to **Deploys**, and drag
   the whole website folder onto the drop area at the bottom.

Done. Open the website — at the very bottom it should say
*"Content loaded from the society Google Sheet."*

> This is the **only** time you need to redeploy for content. From then on,
> every edit you make in the Google Sheet appears on the site by itself.

---

## Part 2 — Everyday use

### Changing something

Find the tab, edit the cell, done. Changes appear on the website within about
10 minutes. To see it immediately, refresh the page twice.

### Adding an item

Add a new row. Everything is driven by rows:

| To add a… | Go to tab | Add a row with |
|---|---|---|
| Notice | `notices` | tag, colour, title, body |
| Festival | `festivals` | name |
| Committee member | `committee` | group, name, post, flat, phone, responsibilities |
| Rule / bullet point | `guidelines` | section, kind, text |
| Penalty | `fees` | type = `penalty`, label, amount |
| Checklist step | `checklist` | title, detail |
| Photo | `gallery` | title, file, caption |
| Guideline poster (9:16) | `posters` | title, file, caption |
| Form or document | `downloads` | title, note, url |
| Resolution | `resolutions` | ref, date, title, summary, status |
| Minutes / notice / circular | `records` | type, date, title, note, link |

### Removing an item

Delete the whole row. Don't just clear the cells — a blank row is skipped, but
a half-empty one may render oddly.

### Changing the order

Drag rows up or down. The website shows them in the same order as the sheet,
top to bottom.

**Two exceptions.** The `resolutions` and `records` tabs are sorted by their
`date` column, newest first, no matter what order the rows are in. So you can
simply add a new resolution at the bottom and it will still appear at the top
of the website.

---

## Part 2b — Resolutions, minutes and notices

These two tabs feed the **Resolutions** and **Minutes of meetings & important
notices** sections.

### Dates

Both tabs have a `date` column. **Before you type any dates, select the whole
column, then choose Format → Number → Plain text.** Otherwise Google Sheets
converts the date into its own internal format and the website may read it
wrongly.

Type dates as **`2025-04-26`** — year, then month, then day. `26/04/2025` and
`26 April 2025` also work.

### The `resolutions` tab

| Column | What to put |
|---|---|
| `ref` | The reference number, e.g. `MC/2025/04` or `GBM/2025/01`. Can be left blank. |
| `date` | The date the resolution was passed. |
| `title` | One line saying what was decided. |
| `summary` | A sentence or two of detail. |
| `status` | `Passed`, `Approved`, `Noted`, `Deferred`, `Pending` or `Rejected`. |
| `link` | Optional — a link to the full resolution. Leave blank if there isn't one. |

The `status` word sets the colour of the little badge: green for
passed/approved, grey for noted/deferred, amber for pending, red for rejected.

Residents see a **Latest / All** switch. "Latest" shows the five most recent;
"All" shows everything. You don't have to do anything for this — it is
automatic.

### The `records` tab

| Column | What to put |
|---|---|
| `type` | `mom` for minutes of a meeting, `notice`, or `circular`. |
| `date` | The date of the meeting, or the date the notice was issued. |
| `title` | E.g. `General Body Meeting — April 2025`. |
| `note` | One line saying what it covered. |
| `link` | The PDF file name, e.g. `gbm-april-2025.pdf`. |

The `type` column drives the **All / Minutes of Meeting / Notices / Circulars**
filter buttons, so it must be one of those three words.

### Putting the actual PDFs on the site

1. Give the file a simple name with no spaces, e.g. `gbm-april-2025.pdf`.
2. Copy it into the website folder on the committee computer, next to
   `index.html`. Then sign in at **app.netlify.com**, open the site, go to
   **Deploys**, and drag that whole folder onto the drop area at the bottom.
3. Put that file name in the `link` column of the Sheet.

Step 3 needs no redeploy — only adding the PDF itself in step 2 does.

If you leave `link` blank, the row still appears but points residents at the
contact section instead of a document.

---

## Part 3 — The three rules

**1. Never rename a tab.** The website finds each tab by its exact name.
If you rename `notices` to `Notices 2026`, that section silently falls back
to the old built-in text.

**2. Never change row 1.** Those are the column names. The website reads them
to know which column is which. Adding a *new* column at the end is harmless —
it's simply ignored.

**3. Keep the share setting on "Anyone with the link → Viewer."** If someone
sets it back to Restricted, the website stops reading it.

---

## Part 4 — Formatting text

Most cells are plain text. Three extras are available:

| Type this | You get |
|---|---|
| `**Gate 2**` | **Gate 2** in bold |
| `[97042 85706](tel:9704285706)` | a tappable phone link |
| `[the rules](#guidelines)` | a link to that part of the page |

Pressing **Alt + Enter** inside a cell makes a line break, which shows as a
line break on the website too.

HTML typed into a cell is shown as plain text, not run as code. That's deliberate
— it means a stray `<` can never break the page.

---

## Part 5 — The guidelines tab explained

This is the only tab that needs a little thought, because one rule section is
made of many rows.

All rows with the same **section** number form one collapsible box:

| section | title | keywords | anchor | kind | text |
|---|---|---|---|---|---|
| 3.2 | Fire & Safety | fire alarm extinguisher | | li | Fire extinguishers are on every floor. |
| 3.2 | | | | li | Lightning arresters are on the rooftop. |
| 3.2 | | | | note-red | Misuse of fire alarms will attract penalties. |

- **title**, **keywords** and **anchor** go on the **first row only**. Leave
  them blank on the rest.
- **keywords** are extra search words. A resident typing "extinguisher" finds
  this section even though the title doesn't contain that word.
- **anchor** is only used where another part of the page links to the section.
  Leave it blank unless it's already filled in.

**kind** controls the look:

| kind | Appearance |
|---|---|
| `li` | a bullet point (most common) |
| `sub` | a bold sub-heading, e.g. "Gym" inside the Sports section |
| `note` | a grey highlighted box |
| `note-red` | a red warning box |
| `note-green` | a green box |
| `p` | an ordinary paragraph |

To add a whole new rule section, pick a section number that doesn't exist yet
and add its rows at the point in the list where you want it to appear.

---

## Part 6 — Photos

1. Put the image file into the website's **`images`** folder.
2. In the `gallery` tab, put that exact file name in the **file** column.

Use roughly 1200 × 800 pixels and keep each file under about 300 KB.

Any photo that's missing shows a coloured placeholder instead — the page never
shows a broken image.

### Guideline posters

The **Guideline posters** section shows tall portrait posters (the same
**9:16** shape as a phone screen, for example 1080 × 1920). They are listed in
the `posters` tab, which has three columns:

| Column | What to put in it |
|---|---|
| `title` | The caption shown under the poster, e.g. `Balcony safety & cleanliness` |
| `file` | The image file name, e.g. `poster-balcony.jpg` — or a full `https://` link |
| `caption` | The longer text shown when the poster is opened full size |

To add a poster, either put the image in the **`images/posters`** folder and
use just its file name, or paste a full `https://` address of an image hosted
elsewhere. You never type the folder into the sheet — the site adds it.
Posters appear in the order the rows appear in the tab.

If the `posters` tab is missing or empty, the page keeps the posters already
built into it — nothing disappears.

On a phone the posters become a swipeable frame showing one poster at a time,
with arrows and dots underneath. On a tablet or computer they stay laid out as
a grid. This happens automatically — there is nothing to set in the tab.

---

## Part 6b — The Google map

The Contact section ends with a Google map of the society. It is Google's own
embed, so the star rating and review count come straight from Google and stay
current on their own. Nothing is copied into the sheet and there is no API key,
no Google account and no cost.

**Whether the rating card appears is Google's decision, not ours.** In testing
it showed reliably on a computer (4.5 ★, 89 reviews) but on a phone Google
often replaces it with a plain "Open in Maps" button instead. There is no
setting that forces it.

The map is controlled by the **`map_embed`** row in the **settings** tab:

| Value | What happens |
|---|---|
| *(leave the row out)* | The built-in map of the society is shown |
| `off` | The whole map block is hidden |
| A Google Maps address | That map is shown instead |

To pin a different or more exact location, open Google Maps, find the place,
choose **Share → Embed a map → Copy HTML**, and paste the whole thing into the
`map_embed` cell. The `<iframe ...>` wrapper is fine — the page pulls the
address out of it. This form points at one exact place, so it is the most
reliable way to get the rating card to show.

For safety, only Google Maps addresses are accepted. Anything else is ignored
and the built-in map stays, so a typo cannot put someone else's content on the
page.

---

**The footer says "Could not reach the Google Sheet."**
The sharing setting has been reset, or the ID in `config.js` is wrong.
Re-check Step 2 and Step 3.

**One section still shows the old text.**
That tab was renamed, or it's empty, or row 1 was changed. The website keeps
the built-in version whenever a tab looks wrong — deliberately, so a typo can
never take a section down.

**My change hasn't appeared.**
The website remembers the sheet for 10 minutes to stay fast. Wait, or refresh
twice. To turn this off, set `CACHE_MINUTES: 0` in `config.js`.

**I broke something badly.**
In the sheet: **File → Version history → See version history**, then restore
any earlier version. Google keeps every edit, with who made it.

**Nothing works at all.**
Set `SHEET_ID` back to `""` in `config.js`. The website returns to its built-in
content and works exactly as it did before the sheet existed.

---

## For whoever maintains the code

- `config.js` — the only file an admin edits. Sheet ID and cache duration.
- `content.js` — fetches each tab as CSV via the Google Visualization endpoint
  (`/gviz/tq?tqx=out:csv&sheet=NAME`), parses it, re-renders the matching
  section. Every renderer is independent and wrapped in try/catch, so one bad
  tab can't affect the others.
- Sheet values are HTML-escaped, then a tiny whitelist (`**bold**`,
  `[text](url)`, `<b> <i> <br>`) is re-enabled. Raw HTML and scripts cannot be
  injected from the sheet.
- `build-sheet-csv.js` regenerates `sheet-template/*.csv` from whatever is
  currently in `index.html`; `build-sheet-xlsx.js` packs those into the
  uploadable workbook. Re-run both if you change the built-in content.
- `test-roundtrip.js` asserts the sheet-rendered page matches the static page
  exactly. `test-failures.js` covers offline, malformed tabs, injection and
  post-render widget behaviour. Both need `npm install jsdom`.
