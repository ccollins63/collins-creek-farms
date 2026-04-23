# Collins Creek Farms

Website for Collins Creek Farms, a family farm in Cumming, Georgia since 1969.
Hosted on GitHub Pages at [collinscreekfarms.com](https://collinscreekfarms.com).

---

## Structure

```text
/
├── index.html             Home
├── about.html             Our story
├── animals.html           Every animal (filterable)
├── cows.html              Cattle (filtered view)
├── chickens.html          Flock (filtered view)
├── farmstand.html         Farm stand — coming Spring 2027
├── contact.html           Contact + embedded map
├── 404.html               Not found
├── robots.txt / sitemap.xml
├── data/
│   └── animals.json       Single source of truth for every animal
├── partials/
│   ├── header.html        Shared site header
│   └── footer.html        Shared site footer
└── assets/
    ├── css/main.css
    ├── js/main.js
    └── images/            logo, hero photos, cows/, chickens/, placeholder-animal.svg
```

## Adding a new animal

Everything about the herd lives in **`data/animals.json`**. To add a chick, a calf, or a new hen:

1. Drop the photo into the right folder:
   - Bulls: `assets/images/cattle/bulls/<id>.jpg`
   - Cows: `assets/images/cattle/cows/<id>.jpg`
   - Calves: `assets/images/cattle/calves/<id>.jpg`
   - Roosters: `assets/images/chickens/roosters/<id>.jpg`
   - Hens: `assets/images/chickens/hens/<id>.jpg`
   - Chicks: `assets/images/chickens/chicks/<id>.jpg`
2. Open `data/animals.json` and add an entry to the `animals` array:

   ```json
   {
     "id": "daisy",
     "name": "Daisy",
     "species": "cattle",
     "type": "cow",
     "image": "assets/images/cattle/cows/daisy.jpg",
     "dob": "2026-03-15",
     "notes": "Blanche's heifer."
   }
   ```

   **Fields:**
   - `id` — unique slug (lowercase, hyphens, no spaces). Used for cross-references.
   - `name` — display name, or `null` if not yet named (will show as `Cow #N`, `Chicken #N`, etc.)
   - `species` — biological species: `cattle`, `chicken`, `pig`, etc.
   - `type` — role within species: `bull` / `cow` / `calf` / `rooster` / `hen` / `chick`.
   - `image` — relative path to the photo, or `null` for a "Photo coming soon" placeholder.
   - `dob` — optional birthdate, format `YYYY-MM-DD`.
   - `motherId` — optional; set to the mother's `id` to show "Mama: Jolene" on calves/chicks.
   - `notes` — optional short caption.

3. Commit and push to `main`. GitHub Pages redeploys automatically within a minute or two.

### Unnamed animals

Leave `name: null`. The site labels them `Cattle #1`, `Chicken #2`, etc., in the order they appear in the JSON.

### Missing photos

Leave `image: null`. The site shows a branded "Photo coming soon" placeholder until you add one.

## Local preview

Because the site uses `fetch()` to load partials and `data/animals.json`, you can't open `index.html` directly with `file://` — the browser blocks those requests. Run any static server from the project root:

```bash
# Python (any version)
python -m http.server 8080

# or Node (if installed)
npx serve .
```

Then visit <http://localhost:8080>.

## Deploying

Push to `main`. GitHub Pages does the rest.
