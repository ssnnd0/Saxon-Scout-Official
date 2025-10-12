Saxon Scout — Frontend (app)

This folder contains the single-page frontend for Saxon Scout.

Quick build & serve

From the repository root you can build the app bundle with the project's scripts. On Windows (PowerShell):

```powershell
# build the frontend bundle
npm run build:app

# serve the built static files locally on port 8080
npm run serve-app
```

Notes
- The frontend is built using the project's custom build script (`scripts/build-app.js`) and bundled to `dist/app`.
- The app uses the File System Access API to write local scouting files; use a compatible browser (Chrome, Edge).
- During development you can run the server side (`npm run dev`) which serves APIs used by the UI.

Helpful shortcuts (in Quick Scout view)
- Number keys 1–9 map to the 3×3 action grid (left-to-right, top-to-bottom)
- u → undo
- f → record foul
- m → toggle mobility (AUTO only)
- s → save current match

