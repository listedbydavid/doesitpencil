# Does It Pencil? (doesitpencil.org)

Free real estate deal calculators from Real Estate Cheat Codes. Plain static HTML with no build step.

## Structure

```
index.html                 Home: calculator picker + recently saved
deal-napkin/index.html     Deal Napkin (quick flip check)
rental/index.html          Rental Quick Check (cash/HELOC then DSCR refi)
rental-underwriting/       Rental Underwriting (full buy-and-hold; storage key dip:uw:current; posts {type:'uw-height'} to a parent iframe)
flip-vs-build/index.html   Flip vs. Build calculator (PDF/JPG report export)
saved/index.html           My saved calculations: search, rename, duplicate, delete, backup/restore
assets/site.js             Shared header, saved-calculations store (window.DIP), save bar
assets/tracking.js         Site settings: Google tag, Meta Pixel, Mailchimp form (blank = off)
assets/site.css            Shared header / save bar / list styles (all classes prefixed dip-)
assets/*.png               RECC logos, favicon
netlify.toml               Publish the repo root, no build command
```

## Tracking (Google + Meta)

Edit `assets/tracking.js` and paste the IDs:

```js
window.DIP_TRACKING = { googleTagId: 'G-XXXXXXXXXX', metaPixelId: '123456789012345' };
```

Events: page views, `join_community_click` (Meta standard event `Lead`), `calculation_saved`, `report_download`.

## Verdicts (same traffic light everywhere)

- Flips (Deal Napkin, Flip vs. Build): profit as % of ARV / sale value. Green 8%+, Yellow 6-7.99%, Red 5.99% or less.
- Rentals (Quick Check, Underwriting): monthly cash flow vs. target (default $0). Green at/above target, Yellow up to $250/mo below, Red more than $250/mo below.

## Share links, PDFs, email, definitions, embeds

- Share link: the calculation is compressed into the URL hash (#deal=...). Nothing is stored server-side.
- PDF: `DIP.makePDF(spec)` builds branded letter pages (html2canvas + jsPDF loaded on demand).
- Email me this deal: Mailchimp JSONP signup with CALC, DEALSUM, DEALLINK merge fields. Hidden until `mailchimp.action` is set in tracking.js.
- "?" definitions: one per term per page, from the TERMS list in site.js.
- Embedded in an iframe: header, top CTA and terms bar are hidden; compact CTA and a one-line legal note stay.

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
