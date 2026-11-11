# METLE

A static daily metal-band guessing game for GitHub Pages.

## Files
- `index.html` — page structure
- `style.css` — minimalist black-and-white zine styling
- `script.js` — daily puzzle, autocomplete, clue comparisons, local stats
- `bands.json` — band list and clue data

## Publish on GitHub Pages
1. Open your existing repository (keep its current repository name).
2. Upload/replace these five files in the repository root: `index.html`, `style.css`, `script.js`, `bands.json`, and this `README.md`.
3. Commit the changes to `main`.
4. In **Settings → Pages**, set **Deploy from a branch**, branch `main`, folder `/(root)`, then save.
5. Wait for the Pages deployment to finish and refresh your site.

## Important database note
All 128 names and the genre labels were imported from the supplied `metle Bands.txt`. The earlier prototype contained complete clue profiles for only a subset of those bands. Those verified-in-the-existing-draft profiles were carried over; other entries have blank year/country/status fields and are shown in autocomplete, but are not eligible as daily answers until their metadata is completed. The footer reports the number of answer profiles currently ready. This avoids inventing debut dates, countries, or activity status.

Genre matching uses all genre labels supplied for each band. A matching supplied genre is green; a different label in the same broad family is yellow. Year is exact green / within three years yellow. Country is exact green / shared land border yellow. Status is exact green.

Daily selection and stats use UTC dates. Stats are stored in the visitor's browser (`localStorage`); they do not sync across devices. This is a static GitHub Pages build, so the daily answer is present in the public `bands.json` file and can be inspected by determined visitors.
