# MetalDle — starter version

A static daily metal-band guessing game built with HTML, CSS, and vanilla JavaScript.

## Files
- `index.html` — page structure
- `style.css` — visual design
- `script.js` — game logic
- `bands.json` — editable band database

## Run locally
Open `index.html` in a local web server (recommended) because the browser may block fetching `bands.json` from a `file://` URL. GitHub Pages serves it correctly.

## Publish on GitHub Pages
1. Create a public GitHub repository named `metaldle`.
2. Upload all four files (`index.html`, `style.css`, `script.js`, `bands.json`) to the repository root.
3. Open Settings → Pages.
4. Under Build and deployment, choose Deploy from a branch.
5. Choose `main` and `/(root)`, then Save.
6. Wait for the published URL shown on the Pages settings screen.

## Add bands
Edit `bands.json` and add another object matching the existing fields:
`name`, `aliases`, `debut_year`, `first_release`, `genre`, `subgenre`, `parent_genre`, `country`, `active`.

Use `active: true` for a band that has not officially disbanded. A hiatus alone does not mean disbanded.

## Important prototype limitations
- The daily answer is selected in browser JavaScript from `bands.json`. A technically curious player can inspect the database and discover the answer. A backend is needed to hide the answer properly.
- Progress and stats use browser `localStorage`, so they are device/browser-specific and are not accounts or a global leaderboard.
- The starter database is deliberately small and should be fact-checked and expanded before a public launch.
- The country-border table in `script.js` is only a starter list. Add all relevant land borders and normalize country naming consistently.
- Genre classifications are subjective. Keep the parent/subgenre taxonomy consistent.
- Daily selection uses UTC dates.
