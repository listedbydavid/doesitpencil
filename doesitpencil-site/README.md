# Does It Pencil? (doesitpencil.org)

Free real estate deal calculators from Real Estate Cheat Codes. Plain static HTML with no build step.

## Structure

```
index.html                 Home: calculator picker + recently saved
rental/index.html          Rental Cash Flow calculator
flip-vs-build/index.html   Flip vs. Build calculator (PDF/JPG report export)
saved/index.html           My saved calculations: search, rename, duplicate, delete, backup/restore
assets/site.js             Shared header, saved-calculations store (window.DIP), save bar
assets/site.css            Shared header / save bar / list styles (all classes prefixed dip-)
assets/*.png               RECC logos, favicon
netlify.toml               Publish the repo root, no build command
```

## Saved calculations

All calculators share one browser store (`localStorage` key `dip:saved:v1`). Each entry is:

```json
{ "id": "...", "calc": "rental", "label": "4th St, 20% down", "state": { ... },
  "summary": { "headline": "$835/mo", "detail": "...", "tone": "good" },
  "createdAt": 0, "updatedAt": 0 }
```

Saves stay on one device and browser. Users can move them with Back up / Restore on the My saved page.
Cross-device saving would need accounts and a database (e.g. Supabase or Firebase). The store API in
`assets/site.js` is the one place to swap that in.

## Adding a calculator

1. Create `new-calc/index.html` with `<html data-root="../">`, link `../assets/site.css`, and put `<div id="dip-header"></div>` at the top of the body.
2. Load `../assets/site.js`, then call `DIP.mountHeader('newcalc')`.
3. Add a `<div id="dip-savebar"></div>` and call:
   ```js
   const bar = DIP.mountSaveBar({
     el: 'dip-savebar', calc: 'newcalc',
     getState: () => state,              // plain JSON
     setState: s => { state = s; render(); },
     reset: () => { ... },               // the "New" button
     defaultLabel: s => 'Deal name',
     summarize: s => ({ headline: '$1,234/mo', detail: '...', tone: 'good' })
   });
   // call bar.changed() whenever the user edits an input
   ```
4. Register it in `CALCS` at the top of `assets/site.js` (name, nav label, path, blurb) and add it to `sitemap.xml`.

## Deploy

Netlify site connected to this GitHub repo. Build command: none. Publish directory: `.` (repo root).
Every push to `main` deploys. Pull requests get a preview URL.
