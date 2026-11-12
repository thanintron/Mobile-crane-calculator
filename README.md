# TNT Crane Planner — Mobile Crane Calculator

Responsive Thai web application (PWA) on the existing FastAPI backend. Includes input validation, draft calculation summary, browser-local draft storage, and draft PDF export.

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

The service worker caches only the application shell. Offline drafts are available after an initial successful visit, but loading crane models, calculations and PDF generation require the server. Drafts remain in this browser and are not shared or backed up. There is no account system or central plan database.

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
node --check static/app.js
node --check static/sw.js
```

Automated checks cover application assets, chart metadata, representative calculation, invalid/out-of-chart inputs, and template escaping. Browser layout, actual phone installation, Docker build and deployed HTTPS operation require environment validation before release.
