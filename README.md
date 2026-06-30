# 🐱 Kitten Tracker

A local-only PWA to track a kitten's food, water, litter, and protein intake.
No backend, no database server, no paid APIs. All data lives in your browser
(`localStorage`) and can be exported/imported as JSON or CSV.

Built with **React + Vite + Tailwind + Recharts**, installable to the Android
Chrome home screen, deployable to **GitHub Pages**.

## Features

- **Today** — kcal vs target, water vs target, feeds, pee/poop counts, protein, auto status (Normal / Watch / Needs attention).
- **Quick log** — one-tap pee/poop/vomit/water/note, plus a guided "feed" flow (offered → remaining → auto kcal & protein).
- **Foods** — full food-card database with edit/delete.
- **Add by scan** — barcode scan (BarcodeDetector API → `barcode-detector` polyfill → manual), Open Food Facts / Open Pet Food Facts lookup, and on-device OCR (Tesseract.js) of nutrition labels. Every scanned/online result must be **confirmed** before saving.
- **Charts** — last-7-day kcal, protein, water (lines) and pee/poop (bars).
- **Settings** — kitten profile, daily targets, thresholds, and data export/import.

## Calculations

```
foodIntakeGram        = offered - remaining
kcalIntake            = intakeGram * kcalPerGram
proteinGramIntake     = intakeGram * crudeProteinPercentAsFed / 100
kcalPerGram           = kcalPerKg / 1000
dryMatterProtein%     = crudeProtein% / (100 - moisture%) * 100
dryMatterFat%         = crudeFat%     / (100 - moisture%) * 100
dailyIntakePercent    = dailyKcal / targetDailyKcal
  >= normalIntakePercent (e.g. 90%) → Normal
  >= lowIntakeWarningPercent (70%)  → Watch
  <  lowIntakeWarningPercent        → Needs attention
```

Data-quality rules: missing moisture → no dry-matter; missing protein → no protein intake; abnormal kcal/g shows a warning; OCR/online results are never auto-saved.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Create a repo named **`kitten-tracker`** and push this code to `main`.
   - If you pick a different repo name, change `REPO_BASE` in `vite.config.js` to `/<your-repo-name>/`.
   - For `username.github.io` (root) or a custom domain, set `REPO_BASE = '/'`.
2. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Push to `main`. The included workflow builds and deploys automatically.
4. Open the Pages URL in **Android Chrome → ⋮ → Add to Home screen**.

> Camera (barcode) and OCR work over HTTPS, which GitHub Pages provides.

## Project structure

```
src/
  lib/
    store.js     # localStorage CRUD + subscribe
    useData.js   # React hook over the store
    calc.js      # pure calculation + daily/weekly aggregation
    food.js      # food model, barcode lookup, OCR text parsing
    io.js        # JSON/CSV export & import
  components/
    ui.jsx       # PageHeader, StatCard, Modal, Field
    icons.jsx    # inline SVG icons
  pages/
    Dashboard.jsx, QuickLog.jsx, Foods.jsx,
    AddFoodByScan.jsx, Charts.jsx, Settings.jsx
```

The code is intentionally small and modular so you can hand individual files
to an AI assistant for future edits.

## Notes / privacy

- 100% client-side. Clearing browser data **deletes everything** — export JSON to back up.
- Barcode lookups call the free Open Food Facts / Open Pet Food Facts APIs (no key). They work offline-degraded: if offline or not found, you fall back to OCR or manual entry.
