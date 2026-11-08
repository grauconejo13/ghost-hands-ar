# Frame This! web companion demo

## Purpose

A mobile-friendly browser demo of the Ghost Hands AR: Frame This! interaction (Scout, a rule-of-thirds guide, one suggestion at a time, Capture This!). It lets people try the idea without Spectacles.

It is **not** the SPECS Lens. The native Lens Studio project lives in `Ghost-Hands-AR/`. Nothing in this browser demo shows native Spectacles camera access, hand tracking or on-device AI.

## Run locally

Requires Node.js 22.12+.

```sh
npm install
npm run dev        # http://localhost:5173
npm test
npm run typecheck
npm run build      # outputs dist/ (ignored by Git)
npm run preview    # serves dist/ on http://localhost:4173
```

The camera works on `localhost` or HTTPS. A phone opening your laptop's LAN address over plain HTTP will not get camera access; use an HTTPS preview deployment instead, or use Try Demo.

## Vercel

1. Import `grauconejo13/ghost-hands-ar`, root `./`.
2. Framework: Vite. Build: `npm run build`. Output: `dist`.
3. Push the feature branch to get an HTTPS **Preview** URL. Keep `main` as production until reviewed and merged.

## How it works

| Piece | File | Notes |
| --- | --- | --- |
| UI and camera wiring | `src/web/main.ts` | DOM only; no analysis logic |
| Pixels → guidance | `src/web/pipeline.ts` | `rgbaToGray` → `PhotoAnalysisEngine.analyze` (from `src/vision`) |
| Synthetic demo scene | `src/web/demoScene.ts` | Deterministic landscape, lighting presets, virtual pan |
| Layout helpers | `src/web/geometry.ts` | Fits the grid to the image (`object-fit: contain` maths) and maps taps to frame coordinates |
| Read-outs | `src/web/observations.ts` | Measurements as text; no scores |
| Camera errors | `src/web/cameraErrors.ts` | Permission, missing-camera and in-use messages |

While Scout is on, a frame is sampled every 500 ms and downscaled to 64 px wide. `FrameMemory` (inside `PhotoAnalysisEngine`) skips re-measuring lighting for unchanged frames. Composition is recomputed from the subject point you tapped. `GuidanceEngine` produces the one message shown.

Tests for this pipeline: `tests/WebDemo.test.mjs`. They run the demo scenes through the real analyzers and simulate a user tapping the subject and following the pan guidance until Capture This! appears.

## Camera permissions and privacy

- The browser asks for camera permission when you press **Start camera**. Audio is never requested.
- If you deny it, the page explains how to re-enable it, and **Try Demo** keeps working.
- Frames are analysed in the page and are never uploaded. No analytics, no network calls for analysis.
- **Stop camera**, switching to the demo, and leaving the page all stop the camera tracks. Reset only exits Scout mode and leaves the camera running.
- **Save photo** only runs when you press it. It saves a JPEG to your device through the browser's download. There is no server upload.

## Limitations (honest list)

- **No subject detection.** The subject is wherever you tap. With a live camera the marker stays fixed on screen and is not tracked; tap again after moving.
- **Lighting is pixel brightness, not light metering.** Values come from the browser's auto-exposed, white-balanced video, so they describe the rendered image, not the scene's actual light or photographic merit. Thresholds are defaults, not tuned on a photo dataset.
- **Directions assume a rear camera.** The front-camera preview is not mirrored, and pan/tilt wording may feel reversed when you are facing the camera.
- **Camera switching** is offered only when the browser reports more than one camera; some browsers ignore the front/rear preference.
- **Demo mode is simulated.** The scene, lighting presets and pan are synthetic and are labeled as such on screen.
- **Not yet tested on a physical phone.** Verified in desktop Chrome (headless, including Chrome's built-in fake camera and a denied-permission run) at desktop and 390 px mobile sizes. Test the real iOS Safari and Android Chrome camera paths on a device before demoing.
- The old Light It Up! breadboard lesson is no longer shown in the web UI. Its engine (`src/core`) and tests remain in the repo.
