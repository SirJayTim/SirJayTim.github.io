# UI/UX Designer E‑Portfolio

A clean, modern e‑portfolio tailored for UI/UX design work (mobile & web) and an illustrations gallery. No build tools required.

## Structure

- `index.html` — page structure and sections
- `css/styles.css` — responsive design system and components
- `js/main.js` — theme toggle, smooth scroll, data-driven rendering
- `data/projects.json` — edit this to add case studies and gallery items
- `assets/` — drop your images here (covers and illustrations)

## Usage

1. Replace "Your Name" in `index.html` header and footer.
2. Update links for Behance/Dribbble/LinkedIn in the hero.
3. Add images to `assets/` and update paths in `data/projects.json`.
4. Open `index.html` in a browser, or serve locally.

### Serve locally

On Windows PowerShell:

```powershell
cd D:\MyPortfolio
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Customize

- Colors and spacing use CSS variables at the top of `css/styles.css`.
- Toggle light mode via the moon button in the header (persists).
- To add projects, append items in `caseStudies` within `data/projects.json`.
- To add illustration items, append entries in `gallery`.

## Deploy

- GitHub Pages: push this folder and enable Pages.
- Netlify/Vercel: drag‑and‑drop the folder; set output as the site root.


