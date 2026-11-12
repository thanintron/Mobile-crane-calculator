# CraneLift Pro — Mobile Crane Calculator

Responsive Thai offline-first web application (PWA), based directly on the user-supplied Crane_TNT_5OCT26.html. The original light/amber layout, live crane SVG, five input sections, presets, four help dialogs and sign-off fields are preserved. Plan calculations, drafts, backup import/export and print/PDF run locally on each user’s phone, tablet or computer. The app does not send plan contents to the backend. The existing FastAPI API is retained for compatibility but is not used by the PWA.

## Run locally

Python 3.11+ and WeasyPrint system dependencies are required. The Dockerfile includes the native libraries and Thai fonts.

```sh
docker build -t tnt-crane-planner .
docker run --rm -p 8000:8000 tnt-crane-planner
```

Open http://localhost:8000. API documentation: http://localhost:8000/docs.

Or install requirements in a virtual environment and run:

```sh
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Install on a phone

Host the static app behind HTTPS, or serve it from the included Python application. On iPhone use Safari → Share → Add to Home Screen; on Android use the browser Install app menu. The manifest includes PNG icons and standalone display. Installation on physical devices has not yet been verified.

The service worker caches the original interface, bundled fonts/icons, local calculator and migration helpers after the first successful visit. Wait for the offline-ready message before disconnecting. Subsequent calculations, draft storage and report printing work offline. Use the OS/browser print dialog to save PDF where supported; PDF options vary on mobile devices.

The only network requests are for application assets, installation and updates. Hosting can receive ordinary access logs; no plan form values are transmitted. There are no analytics, external fonts or cloud plan storage. Each browser profile and device has an independent draft. Data is not automatically synced. Export a JSON backup to move a plan to another device, then import it there. Backup files include names and plan values.

Browser data can be removed by the user or OS. Private browsing is unsuitable for durable storage. Export backups regularly. The offline-ready message confirms service worker installation, not permanent immunity from device storage eviction. First-time installation still needs access to an HTTPS host (or localhost on the same computer). A fully offline initial installation on mobile devices is not included.

## Engineering limitations

- The UI uses manually entered rated capacity, crane weight and pivot height as in the supplied HTML. Rated capacity must match the actual manufacturer chart and configuration.
- The inherited embedded TADANO example chart is used only for migration of the earlier prototype draft and for legacy API compatibility; migrated capacities remain unverified.
- Geometry assumes a simple straight boom and the entered pivot height.
- Outrigger force uses the inherited 75% assumption; pad dimensions are preliminary estimates, not verified manufacturer reaction forces or a structural/ground assessment.
- Wind, inspection dates, certification and actual crane setup are not evaluated.
- The page is marked as a draft. Utilization colors do not approve a lift or certify legal compliance. Checklist items are unchecked by default; inspection validity is not inferred from crane dead weight.
- Mat dimensions round upward to 0.1 m. The original 75% point-load assumption remains an estimate.
- Qualified review with the actual manufacturer's chart and site information is required before operational use.

## Validation

```sh
pip install httpx
python -m unittest discover -s tests -v
node tests/test_offline.cjs
node --check static/app.js
node --check static/sw.js
```

Automated checks cover application assets, chart metadata, representative calculation, invalid/out-of-chart inputs, and template escaping. Offline calculator checks cover all all chart points, invalid inputs, absence of plan network requests in the app, local printing and calculator shell caching. Browser layout, actual offline phone installation, print pagination, Docker build and deployed HTTPS operation require environment validation before release.

## Original design restoration validation

Run `node tests/test_original_ui.cjs`. Checks cover retained controls, local-only assets, numerical validation, geometry, the 75% floating-point boundary and upward pad rounding. Desktop browser checks passed for live SVG and preset values, invalid geometry, previous-version draft migration, local save/reload and backup export/import. Physical mobile installation, disconnected-device operation and print pagination remain unverified.

Local fonts are subsets of Chakra Petch, Sarabun and Inter under SIL OFL (see static/licenses). Local icon paths are a subset of Lucide 0.468.0 under ISC (see static/LUCIDE-LICENSE.txt).
