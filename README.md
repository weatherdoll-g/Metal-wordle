# METLE

A dark, underground tape-cover-inspired metal band guessing game.

## Files to upload
Upload all five files in this folder to the root of your existing GitHub Pages repository:
- `index.html`
- `style.css`
- `script.js`
- `bands.json`
- `README.md` (optional)

## Update the live site
1. Open your existing `metaldle` GitHub repository.
2. Choose **Add file → Upload files**.
3. Drag the five files from this folder into the upload area.
4. GitHub will indicate that files with the same names will be replaced.
5. Commit directly to the `main` branch.
6. Wait for Pages to redeploy, then hard-refresh the site (Ctrl+Shift+R).

Keep the repository name `metaldle` if that is already the URL you shared. The visible game name is now METLE; the repository itself does not need renaming.

## Band database
Edit `bands.json` to add bands. Each band needs:
`name`, `aliases`, `debut_year`, `first_release`, `genre`, `subgenre`, `parent_genre`, `country`, `active`.

## Prototype notes
- The starter database is small and should be fact-checked and expanded.
- Daily answer selection runs in the browser, so the answer can be discovered by inspecting the public `bands.json` file. A backend is needed to protect it.
- Player progress and stats are stored in browser localStorage, not in online accounts.
- Country border data is a starter list; expand and verify it as you add countries.
- Daily reset uses UTC.
