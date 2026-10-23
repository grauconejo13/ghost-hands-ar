# Ghost Hands Web Preview v0.1

## Purpose

This Vite + TypeScript browser app is a **visual prototype**, not the SPECS Lens. It reuses the real `LessonController` and `FrameMemory` from this repository.

## Run locally

Requires Node.js 22.12+.

```sh
npm install
npm run dev
npm run build
npm test
```

For the camera, open the local Vite URL on localhost or use an HTTPS deployment. On a separate phone, a localhost URL from a laptop won't be sufficient; use a deployed HTTPS preview.

## Vercel

1. Import `grauconejo13/ghost-hands-ar`.
2. Choose the repo root (`./`).
3. Framework: Vite. Build: `npm run build`. Output: `dist`.
4. Push/deploy `feature/lesson-engine` as a **Preview**. Keep `main` as the production branch until reviewed and merged.
5. Grant browser camera permission after opening the HTTPS preview.

## Available controls

- Start/Stop camera, flip preferred front/back camera, and force capture.
- Sampling rate from 1 to 5 frames/second.
- Frame counters, activity log, and Clear Session.
- Independent five-step illustrated LED lesson with Next, Back, Restart.

**Privacy:** Camera frames are processed in the browser. Only tiny 32 × 24 grayscale thumbnails are stored in an ephemeral in-memory buffer. No frames are uploaded to a server. Browser camera access requires user permission. Stopping the camera stops capture; use Clear Session to erase retained thumbnails, and memory is cleared on page exit. Switching cameras may briefly retain existing session thumbnails until cleared.

## Limitations

- Changes are estimated with pixel differences. Head motion, exposure, and lighting may trigger false positives; small on-screen text changes may be missed.
- The browser app does **not** interpret frames with AI, track real objects, or annotate physical button coordinates.
- The illustrated circuit is not an electrical wiring diagram or safety check.
- Live camera features must be tested on a real device; Vercel deployment is not yet confirmed.
