# METLE

Minimalist black-and-white daily metal band guessing game.

## Files
- `index.html` — page structure
- `style.css` — monochrome styling
- `script.js` — game logic
- `bands.json` — band list and clue profiles

## Band database
The database contains all 454 names in the supplied list. Existing clue profiles were retained where a matching profile was already available. The current database has 118 complete profiles and 336 entries awaiting metadata.

Entries without a complete profile remain searchable and appear as disabled suggestions marked `PROFILE NEEDED`. They cannot be submitted as guesses or selected as daily answers until their debut year, genres, country, first release, and active/status fields are filled in. This prevents incomplete data from generating misleading clues.

A complete entry uses this shape:
```json
{
  "name": "Example Band",
  "genres": ["Black Metal"],
  "debut_year": 1995,
  "first_release": "Example EP",
  "country": "Norway",
  "active": true,
  "aliases": [],
  "parent_genres": ["Black Metal"],
  "status": "Active"
}
```

`active` must be a boolean (`true` or `false`). `status` should be `Active` or `Disbanded`. `debut_year` is the year of the earliest official album or EP; demos do not count.

## Deploy on GitHub Pages
Upload all five files to the root of the existing repository, replacing the previous versions, then commit to the `main` branch. Keep the existing Pages configuration and repository name.

## Country-border clues

The yellow country clue now uses a global land-border adjacency table covering 226 countries and territories (326 unique border pairs). Matching is symmetric, so a guess is yellow whenever its country shares a land border with the answer country. Common alternate names and spellings are normalized, including Czechia/Czech Republic and USA/United States. The table is based on country-border records, with supplemental updates and overseas-territory borders (including France–Brazil via French Guiana, France–Suriname, and the Canada–Denmark border on Hans Island). The source project documents its neighbor data as compiled from Wikipedia's lists of countries and territories by land borders: https://github.com/DataOmbudsman/country-graph.
