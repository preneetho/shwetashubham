# Shweta Shubham — Society Website

Static, dependency-free website for **Shweta Shubham Flat Owners Cooperative Maintenance Society Ltd**.

## Files

| File | Purpose |
|---|---|
| `index.html` | The site — HTML, CSS and JS in one file |
| `config.js` | **The only file an admin edits.** Google Sheet ID + cache setting |
| `content.js` | Reads the Google Sheet and re-renders the page |
| `Shweta-Shubham-Content.xlsx` | Upload this to Google Drive to create the sheet |
| `ADMIN-GUIDE.md` | Step-by-step guide for whoever updates the content |
| `Shweta-Shubham-Guidelines.pdf` | Source guidelines document, linked from the site |
| `images/` | Optional. Drop real photos here to replace the generated placeholders |

Build/test helpers, not needed for hosting: `build-sheet-csv.js`,
`build-sheet-xlsx.js`, `test-roundtrip.js`, `test-failures.js`, `sheet-template/`.

No build step, no npm, no CDN. Open `index.html` in a browser and it works.

## Who updates what

- **Content** (notices, committee, timings, fees, rules, photos, checklist,
  resolutions, minutes & notices) — the admin edits a Google Sheet. Nothing
  technical. See **`ADMIN-GUIDE.md`**.
- **Design and layout** — requires editing `index.html`.

Until a Sheet ID is set in `config.js`, the site runs entirely on the content
built into `index.html`. Setting the ID is optional and reversible.

## Where this site is published

**Live:** <https://roaring-moxie-0dcc0a.netlify.app/> — hosted on Netlify.

### Publishing an update

The site is a set of plain files, so a redeploy is a drag-and-drop:

1. Sign in at <https://app.netlify.com> and open the site.
2. Go to **Deploys**.
3. Drag this whole folder onto the drop area at the bottom of the page.

The new version is live in a few seconds. Netlify keeps every previous deploy,
so a bad update can be undone with **Deploys → (older deploy) → Publish deploy**.

> Content changes made in the Google Sheet do **not** need a redeploy — the site
> picks those up on its own. Redeploy only when a file in this folder changes.

### Renaming the address

**Site configuration → General → Site details → Change site name** turns
`roaring-moxie-0dcc0a.netlify.app` into something like
`shwetashubham.netlify.app`. A custom domain can be added under **Domain
management** if the society buys one.

If the address changes, update the three tags listed under
[Link preview](#link-preview) below.

## Moving to GitHub (optional, recommended)

Drag-and-drop works, but it has no history: if someone uploads a broken folder
there is no record of what changed. Putting the files on GitHub and letting
Netlify deploy from there gives the society version history, and every `git
push` republishes the site automatically.

### The account restriction

A **work / Enterprise Managed User account cannot be used for this.** EMU
accounts (logins ending in something like `_microsoft`) cannot create public
repositories, their repos live in a private enterprise tenant the public cannot
reach, and the enterprise blocks third-party apps such as Netlify from
connecting. Use a **personal github.com account** — the society's own, ideally,
so it outlives any one committee member.

### One-time setup

This folder is already a prepared git repository with an initial commit, so
only the remote is missing:

1. Sign in to a personal account at <https://github.com> and create a new
   repository named `shwetashubham`. **Do not** tick "Add a README",
   `.gitignore` or a licence — the repo must start empty.
2. In a terminal in this folder:

   ```bash
   git remote add origin https://github.com/<your-username>/shwetashubham.git
   git push -u origin main
   ```

3. In Netlify: **Site configuration → Build & deploy → Continuous deployment →
   Link repository**, pick GitHub, authorise it, and choose `shwetashubham`.
   Leave the build command empty and the publish directory as `.` —
   `netlify.toml` already declares this.

The existing address keeps working; only the source of the files changes.

### After that

```bash
git add .
git commit -m "Describe what changed"
git push
```

Netlify rebuilds within a minute. Nothing else to do.

> Still true: Google Sheet edits need **no** push and no redeploy. Only changes
> to the files in this folder do.

### Alternative: GitHub Pages instead of Netlify

If you would rather drop Netlify entirely, push the repo as above, then
**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)` →
Save**. The site moves to `https://<username>.github.io/shwetashubham/`, which
means you must update the three [link preview](#link-preview) tags to that
address. Netlify is the better fit while the committee still wants
drag-and-drop as a fallback.

## Images

`images/` already contains the society's brand assets:

| File | Used for |
|---|---|
| `logo.png` | Header and footer wordmark |
| `building.jpg` | Hero photo of the block |
| `favicon.png` | Browser tab / phone home-screen icon |
| `social-card.jpg` | Link preview when the site is shared on WhatsApp |

Gallery photos are generated placeholders. To use real ones, drop files into
`images/` with these exact names — no HTML edit needed:

```
clubhouse.jpg   pool.jpg      gym.jpg         amphitheater.jpg
playarea.jpg    gardens.jpg   reception.jpg   temple.jpg
```

Roughly 1200×800 px, under 300 KB each.

## Link preview

These three tags near the top of `index.html` control the card WhatsApp and
Teams show when the link is shared. They are already set to the live address:

```html
<link rel="canonical" href="https://roaring-moxie-0dcc0a.netlify.app/">
<meta property="og:image" content="https://roaring-moxie-0dcc0a.netlify.app/images/social-card.jpg">
<meta property="og:url"   content="https://roaring-moxie-0dcc0a.netlify.app/">
```

They must stay **absolute** URLs — a relative path produces no preview image.
If the site is renamed or moved to a custom domain, change all three.

## Mobile

Verified with no horizontal scrolling at 360, 390, 414, 768, 1024, 1100, 1280
and 1440 px. The nav collapses to a tap menu below 1080 px, wide tables scroll
sideways with a shadow hint, and tap targets are at least 44 px on touch
devices.

## Still outstanding

The site is live, but these are not finished yet:

- [ ] `SHEET_ID` in `config.js` is still blank — the site runs on built-in content until it is set (`ADMIN-GUIDE.md` Part 1)
- [ ] Contact form has **no backend** — wire it to Formspree/Google Forms, or remove it
- [ ] Forms in the Downloads list point to `#contact` — replace with real PDFs
- [ ] **Resolutions are sample entries** — replace with the society's actual resolutions
- [ ] **Minutes & notices are sample entries** and link to `#contact` — upload the real PDFs and set each `link`
- [ ] NoBrokerhood links are generic — swap in the society's own NBH URL
- [ ] Committee phone numbers are blurred behind a toggle — confirm the committee is OK publishing them at all
- [ ] Anything in the Google Sheet is effectively public — keep private data out of it
- [ ] Guidelines PDF version date reads *26 April 2026* — likely should be 2025
- [ ] Football is banned in the play area (4.5) and ball games in tot-lots (5.1) — clarify where football *is* allowed

## Editing content

Normally you don't edit HTML — the admin edits the Google Sheet. See
**`ADMIN-GUIDE.md`**.

To change the *built-in* fallback content, edit `index.html` directly; sections
are marked with comments like `<!-- ============ FEES ============ -->`. After
changing it, regenerate the sheet template so the two stay in step:

```bash
npm install xlsx
node build-sheet-csv.js
node build-sheet-xlsx.js
```

## Tests

```bash
npm install jsdom
node test-roundtrip.js   # sheet-rendered page must match the static page exactly
node test-failures.js    # offline, malformed tabs, HTML injection, widget re-binding, filters
```

