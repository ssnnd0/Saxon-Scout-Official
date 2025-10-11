Saxon Scout — Frontend Design & Contract

Purpose
-------
This document captures the coding contract, assumptions, data shapes, error modes, success criteria, and a compact wireframe/implementation plan for the frontend rewrite and improvements.

1) Coding contract (inputs, outputs, behavior)
---------------------------------------------
- Inputs:
  - File System DirectoryHandle (via File System Access API) for `root` where app reads/writes:
    - `matches/` (JSON files per match)
    - `pit/` (JSON files per pit record)
    - `exports/`, `logs/` (optional)
  - User inputs (forms, button taps, keyboard shortcuts): team number, match number, alliance, scouter name, toggles and counters.
  - Server endpoints used indirectly by the frontend:
    - POST /api/login - used to register/verify scouter name
    - POST /api/log/file-created - notification endpoint after saving a file
    - POST /api/genai/summarize - optional GenAI summarization request

- Outputs:
  - Files written to the `root` directory (File System Access API): JSON files in `matches/` and `pit/`.
  - ZIP downloads generated client-side (via JSZip): produced in Export view.
  - UI state persisted to `localStorage` for scouter name and optional cached config.

- Behavior & error handling:
  - If File System Access API is unavailable, show a friendly warning.
  - On write errors (permission, disk), present descriptive alerts and preserve in-memory state so the user can retry.
  - All save operations attempt to POST a `/api/log/file-created` message; failures there should not prevent the local save operation.
  - Keyboard shortcuts are disabled when focus is inside inputs to avoid accidental activations.

2) Data shapes (record schemas)
-------------------------------
- Match record (example):
{
  "team": 1234,
  "game": 5,
  "alliance": "red",
  "time": "2025-10-11T12:34:56.789Z",
  "scouter": "Alice",
  "phase": {
    "auto": { "scored": 3, "missed": 0, "mobility": true, "notes": null },
    "teleop": { "cycles": 5, "scored": 5, "missed": 0, "defense": null }
  },
  "endgame": { "park": false, "climb": "high" },
  "fouls": 0,
  "comments": null
}

- Pit record (example):
{
  "team": 1234,
  "drivetrain": "Swerve",
  "autoPaths": ["Three Piece Auto"],
  "preferredZones": ["Near Zone"],
  "cycleTimeEst": 6,
  "climb": true,
  "notes": "Reliable, consistent scoring.",
  "scouter": "Bob",
  "time": "2025-10-11T12:00:00.000Z"
}

3) Error modes & recovery
-------------------------
- FileSystemNotAvailable: UI warns and disables save/export features.
- FileWriteError: show alert, keep state for retry; optionally queue for later retry (future enhancement).
- ParseError when reading files: skip malformed files, log warning to console and show a small notification in the InfoViewer.
- Network errors for optional logging/GenAI: show non-blocking warning; allow user to retry.

4) Success criteria
-------------------
- The app builds without errors (existing `npm run build:app` and `npm run build:server`).
- Primary flows work in a supported browser (Chrome/Edge): pick folder, record quick match, save JSON to `matches/`, view summary, export ZIP.
- Mobile usability: tappable targets are >=48x48px and controls are usable on small screens.
- Accessibility: basic ARIA attributes for interactive controls, keyboard navigation for QuickScout grid via numeric keys.

5) Wireframe and small plan
---------------------------
- App shell (done): top navbar with app title + pick folder + login area; central container with padded cards; footer.

- Home (done): card grid linking to views. Each card contains icon, title, short description, and CTA button.

- QuickScout (plan):
  - Control row: phase toggle, alliance selector, mobility toggle, timer, team/match inputs, Save button.
  - 3×3 action grid: large buttons overlaying the game image; cells show numeric hint (1–9) on small overlay.
  - Summary row: small text summarizing scores/fouls/endgame.
  - Accessibility: aria-label per cell, keyboard shortcuts (1–9), focusable grid items.

- PitScout (plan): form with team number, drivetrain select, auto-paths checkboxes, preferred zones, cycle time, climb checkbox, notes, Save.

- InfoViewer (plan): table of team summaries + bar chart; Ask GenAI button (non-blocking).

- Export (plan): export matches or pit as ZIP (JSZip), present a download link.

6) Implementation steps (short)
------------------------------
1. Keep existing Inferno app for now — lower risk than migrating to React. (Assumption)
2. Apply UI style improvements globally (theme variables, card styles). (done)
3. Improve mobile sizing and accessibility across views. (done)
4. Add keyboard shortcuts and small UX helpers. (done)
5. Add README instructions and a short design doc. (this file)
6. Optional: migrate to React/TS in a separate branch if desired.

7) Assumptions
--------------
- The File System Access API is the intended storage mechanism (works in Chromium browsers).
- The current build pipeline (scripts/build-app.js) produces app assets referenced by the server; we keep that.
- The backend endpoints used by the frontend exist or are mocked during development.


If you'd like, I can now:
- Produce the on-screen numeric overlays for QuickScout (visual hint for 1–9 shortcuts).
- Start a small accessibility pass (focus outlines, skip links) across the app pages.
- Draft a migration plan to React + TypeScript with estimated effort.

Pick the next task and I'll implement it.
