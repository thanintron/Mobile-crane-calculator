# TNT Crane Planner — Mobile Crane Calculator

Responsive Thai offline-first web application (PWA). Plan calculations, drafts, backup import/export and print/PDF run locally on each user’s phone, tablet or computer. The app does not send plan contents to the backend. The existing FastAPI API is retained for compatibility but is not used by the PWA.

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

Host this Python application behind HTTPS. On iPhone use Safari → Share → Add to Home Screen; on Android use the browser Install app menu. The manifest includes PNG icons and standalone display. Installation on physical devices has not yet been verified.

The service worker caches the application shell and bundled example chart/calculator after the first successful visit. Wait for the offline-ready message before disconnecting. Subsequent calculations, draft storage and report printing work offline. Use the OS/browser print dialog to save PDF where supported; PDF options vary on mobile devices.

The only network requests are for application assets, installation and updates. Hosting can receive ordinary access logs; no plan form values are transmitted. There are no analytics, external fonts or cloud plan storage. Each browser profile and device has an independent draft. Data is not automatically synced. Export a JSON backup to move a plan to another device, then import it there. Backup files include names and plan values.

Browser data can be removed by the user or OS. Private browsing is unsuitable for durable storage. Export backups regularly. The offline-ready message confirms service worker installation, not permanent immunity from device storage eviction. First-time installation still needs access to an HTTPS host (or localhost on the same computer). A fully offline initial installation on mobile devices is not included.

## Engineering limitations

- The embedded TADANO chart is inherited example data with no verified manufacturer provenance or configuration. Do not use it for actual crane selection or lift approval.
- The original lookup rounds up to the next available boom/radius entry; this is not a validated configuration-selection method. Inputs below table bounds are now rejected.
- Geometry assumes a simple straight boom and a 2 m pivot height.
- Outrigger force uses the inherited 75% assumption; pad dimensions are preliminary estimates, not verified manufacturer reaction forces or a structural/ground assessment.
- Wind, inspection dates, certification and actual crane setup are not evaluated.
- Every output is marked DRAFT / NOT APPROVED. QR codes contain a draft document identifier, not a verification URL.
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
