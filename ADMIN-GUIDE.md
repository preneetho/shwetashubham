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
| Festival | `festivals` | name, date |
| Committee member | `committee` | group, name, post, flat, phone, responsibilities |
| Rule / bullet point | `guidelines` | section, kind, text |
| Penalty | `fees` | type = `penalty`, label, amount |
| Checklist step | `checklist` | title, detail |
| Photo | `gallery` | title, file, caption |
| Guideline poster (9:16) | `posters` | title, file, caption |
| Form or document | `downloads` | title, note, url |
| Helpline number | `helplines` | group, icon, name, number, note |
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

## Part 2c — Helpline numbers

The **Helplines & emergency numbers** section near the top of the page is the
one residents are most likely to need in a hurry, so it is worth keeping
accurate. It is driven by the **`helplines`** tab.

| Column | What to put |
|---|---|
| `group` | `Emergency`, `Society`, `Utility` or `Support` |
| `icon` | A single emoji. Copy one from an existing row if unsure. |
| `name` | What it is — "Lift breakdown", "Water tanker" |
| `number` | `108`, or a 10-digit mobile like `97042 85706` |
| `note` | One short line saying when to call it |

> **Important — format the `number` column as plain text.**
> Google decides what a whole column holds by looking at its values. If most
> of the numbers are plain digits (`112`, `108`, `1906`), Google treats the
> column as *numbers*, and then quietly sends us a **blank** for anything that
> is not purely numeric — a mobile like `97042 85706`, a landline, or a
> toll-free line like `1800 599 6991`. Those helplines would vanish from the
> page.
>
> To fix it: click the **D** column heading on the `helplines` tab, choose
> **Format → Number → Plain text**, then re-enter or re-paste every number in
> the column. Changing the format alone is not enough — the values have to be
> typed in again afterwards.
>
> As a safety net, if the website spots a row with a name but no number it
> ignores the whole tab and shows the built-in numbers instead, so the page
> never displays a half-complete emergency list. If your edits are not showing
> up, this is almost always why.

The `group` decides the colour. **Emergency** rows are shown in red so they
stand out; everything else is shown in the society green. If you type a group
that is not in the list above, the row still appears, styled as `Society`.

Short numbers such as 100, 108 or 1912 are dialled exactly as written. A
10-digit mobile automatically gets `+91` added when a resident taps it, so you
do not need to type the country code.

**Numbers the Committee still needs to supply** — these cannot be guessed, so
they are deliberately left out for now:

- Lift breakdown / AMC engineer
- Society plumber and electrician
- Water tanker supplier
- Nearest hospital

Add a row for each and they appear on the website straight away.

---

## Part 2d — Search, and using the site offline

Two things on the page need no maintenance at all, but are worth knowing about
when residents ask.

**The search box** under "What do you need today?" searches everything already
on the page — guidelines, timings, fees, helplines, resolutions and notices.
It builds itself from whatever this sheet contains, so anything you add
becomes searchable automatically. There is no list to keep up to date.

**Add to Home Screen.** Residents can install the page like an app. On Android
a button appears in the green banner at the top of the page; on an iPhone they
tap **Share** in Safari and then **Add to Home Screen**.

Once installed, the guidelines, timings and helpline numbers stay readable
**even with no internet** — useful in a power cut, in the basement, or when
someone is stuck in a lift. The page still refreshes from this sheet every
time it is opened with a signal, so nobody gets stuck on old content.

---

## Part 2e — Festival dates

The **Celebrations we share** table comes from the **`festivals`** tab, which
has two columns:

| Column | What to put |
|---|---|
| `name` | `Ugadi`, `Bathukamma`, `Independence Day` |
| `date` | `7 Apr 2027`, or `30 Sep – 8 Oct 2027` for a festival that runs over several days. **Leave it blank** if there is no fixed day yet — the row then shows a dash. |

The list is seeded with **2027** dates, taken from the panchangam. Most Hindu
festivals follow the lunar calendar, so **these dates change every year** and
need refreshing each January. The civil ones — Republic Day, Women's Day,
Independence Day, Christmas, New Year — never move, so only the year changes.

Keep the rows in **date order**, because that is the order residents read
them in. A different panchangam can put a festival a day either side of ours;
if the Committee follows a particular one, use its dates.

> **Type dates as ordinary text, like `7 Apr 2027`.**
> If you type `07/04/2027`, Google stores it as a real date and may then blank
> out any entry it cannot read as one — such as `30 Sep – 8 Oct 2027`. This is
> the same trap described for helpline numbers above. If a date vanishes from
> the website, select the `date` column and set
> **Format → Number → Plain text**, then type the dates in again.

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
filter buttons, so it must be one of those three words. The section opens on
**Minutes of Meeting**, since that is what residents look for most; if no row
is marked `mom`, it opens on **All** instead so the section is never blank.

A `link` that starts with `https://` opens in a **new tab**, so the resident
does not lose their place on the page.

Residents see a small **New** badge against any minute, notice, circular or
resolution that was not on the page the last time they visited, and a count on
the filter buttons and the menu. This is worked out on the resident's own
phone or computer, so there is nothing for you to set  just add the row and
it will be flagged for everyone who has not seen it yet. It is based on the
rows appearing, not on the `date` column, so minutes uploaded months after
the meeting are still flagged.

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

Every picture on the site can come from **Google Drive**, so you never have to
touch the website's files. Upload the photo to Drive, share it as **Anyone
with the link → Viewer**, copy the link and paste it into the sheet. If it is
shared any other way residents only see a coloured placeholder.

For the photo gallery:

1. Upload the photo to Google Drive and share it as *Anyone with the link*,
   *Viewer*.
2. In the `gallery` tab, paste that share link into the **file** column.

A photo kept in the website's own **`images/gallery`** folder works too — put
the file there and type just its file name, with no folder in front of it.

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
| `file` | A Google Drive link, or the image file name, e.g. `poster-balcony.jpg` |
| `caption` | The longer text shown when the poster is opened full size |

To add a poster, put it in Google Drive and paste the share link into the
`file` column, exactly as you would for an event photograph — **the poster
has to be shared as *Anyone with the link*, *Viewer*, or residents only see a
placeholder.** A poster kept in the website's own **`images/posters`** folder
works too: put the file there and type just its file name. You never type the
folder into the sheet — the site adds it. Posters appear in the order the
rows appear in the tab.

If the `posters` tab is missing or empty, the page keeps the posters already
built into it — nothing disappears.

On a phone the posters become a swipeable frame showing one poster at a time,
with arrows and dots underneath. On a tablet or computer they stay laid out as
a grid. This happens automatically — there is nothing to set in the tab.

---

### Event photographs

The **Latest events** section is a carousel of photographs from recent
celebrations, sitting just below the committee directory. It is filled from
the `events` tab:

| Column | What to put in it |
|---|---|
| `name` | The event, e.g. `Ganesh Chaturthi 2026`. A row with no name is skipped. |
| `date` | Written as `2026-09-14` (year-month-day). The newest event is shown first. |
| `details` | A sentence or two about the day. Optional. |
| `photo` | The Google Drive link to the picture. A row with no photo is skipped. |

**Each photograph has to be shared, or residents only see a placeholder.** In
Google Drive, right-click the picture and choose **Share**; under *General
access* pick **Anyone with the link**, leaving the role as **Viewer**. Then
copy the link and paste it straight into the `photo` column. The ordinary
`https://drive.google.com/file/d/.../view?usp=sharing` link is exactly right 
the website works out the picture address by itself, so there is nothing to
edit or shorten.

A photo kept in the website's own **`images/events`** folder works too: put the
file there and type just its file name.

The section stays hidden until the tab holds at least one row with both a name
and a photo, so residents are never shown an empty carousel. The photographs
move along on their own every few seconds, and stop for good the moment
somebody swipes, uses an arrow or opens a picture full size.

Pictures are shown whole rather than cropped, so an upright phone photo and a
wide group shot can follow one another without anybody losing their head.

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
- `sw.js` caches the page shell. Pages and scripts are **network-first**, so an
  online resident never sees a stale page; photos are cache-first. Anything on
  another origin — the Google Sheet, the Google map — is deliberately not
  intercepted and is never stored. Bump `VERSION` in `sw.js` whenever the
  `SHELL` list changes.
- **The app icons must be renamed, not overwritten.** Android bakes the icon
  into the installed app and only refetches when the *manifest text* changes,
  so replacing `icon-512-v2.png` in place leaves every Android phone showing
  the old icon forever. Give the new files the next number
  (`icon-512-v3.png`, …), point `manifest.webmanifest` and the `SHELL` list in
  `sw.js` at them, and delete the old ones. iPhones are keyed off
  `apple-touch-icon.png` in `index.html` and update on their own once the
  shortcut is re-added.
- The search box indexes live DOM text, so `content.js` calls
  `window.SSSearch()` after the sheet renders to rebuild the index. New
  sections become searchable by adding their container to `SEL` in the search
  block of `index.html`.
- `build-sheet-csv.js` regenerates `sheet-template/*.csv` from whatever is
  currently in `index.html`; `build-sheet-xlsx.js` packs those into the
  uploadable workbook. Re-run both if you change the built-in content.
- `test-roundtrip.js` asserts the sheet-rendered page matches the static page
  exactly. `test-failures.js` covers offline, malformed tabs, injection and
  post-render widget behaviour. Both need `npm install jsdom`.
