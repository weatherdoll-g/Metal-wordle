# METLE

A minimalist, monochrome daily metal-band guessing game for GitHub Pages.

## Files
- `index.html` — page structure
- `style.css` — redesigned black-and-white interface
- `script.js` — daily puzzle, autocomplete, clue comparisons, and local stats
- `bands.json` — the existing 128 complete band profiles

## Design
The interface is strictly black and white apart from green and yellow clue feedback. It uses a restrained serif wordmark, small uppercase monospace labels, thin rules, square corners, and no gradients, illustrations, or decorative colour.

## Publish on GitHub Pages
1. Download and unzip the package.
2. Open your existing GitHub repository. Keep its current repository name.
3. Upload and replace `index.html`, `style.css`, `script.js`, `bands.json`, and `README.md` in the repository root.
4. Commit the changes to `main`.
5. In **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/(root)`, then save.
6. Wait for deployment to finish and refresh your existing Pages URL.

## Game notes
- Ten guesses per daily puzzle.
- Autocomplete uses the band list and accepts configured aliases.
- Exact clue matches are green; close year, genre-family, or bordering-country matches are yellow; other mismatches are black.
- Debut year uses the first official album or EP; demos are excluded.
- Stats are stored locally in the visitor's browser and do not sync between devices.
- This static build includes the answer pool in public `bands.json`; a backend is needed to conceal answers from determined visitors.
