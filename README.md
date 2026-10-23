# Expense Tracker — what changed and where each file goes

Copy each file over the file with the same name in your project.

| File in this bundle | Replaces |
|---|---|
| `frontend-react/index.html` | `.../Frontend/frontend-react/index.html`  (your copy is the standalone app, so React could not start) |
| `frontend-react/src/utils/mapsLoader.js` | same path (retry-safe loader + shared error messages) |
| `frontend-react/src/utils/routeService.js` | **new file** (3 routing methods, works without the Maps SDK) |
| `frontend-react/src/components/RoutePanel.jsx` | same path |
| `frontend-react/src/components/PlaceInput.jsx` | same path (also adds the "use my location" button) |
| `frontend-react/src/pages/ExpenseFormPage.jsx` | same path (fixes conditional hooks) |
| `frontend-react/.gitignore`, `.env.example` | same path (`.env` was not ignored) |
| `frontend-vanilla/index.html` | `.../Frontend/index.html` (Maps fix for the HTML version) |
| `expense_tracker_backend/app/config.py` | same path |
| `expense_tracker_backend/app/routers/files.py` | same path |
| `expense_tracker_backend/.env.example` | same path (it described MySQL; you run PostgreSQL) |
| `.gitignore` | project root |

## Run
- Backend: `cd expense_tracker_backend/app && uvicorn main:app --reload`  (port 8000)
- React:   `cd frontend-react && npm install && npm run dev`  (port 5173; `/api` is proxied to 8000)
- HTML:    `cd Frontend && npm run dev`  (port 5500; calls the API at http://127.0.0.1:8000)