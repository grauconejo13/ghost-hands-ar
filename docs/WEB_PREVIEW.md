# Frame This! web companion demo

## Purpose

A mobile-friendly browser demo of the Ghost Hands AR: Frame This! interaction: a camera viewfinder with one compact, single-line guidance pill ("Look to the right →", "↑ Look up.", "Ready!", "Awesome! Capture this!") and a shutter. It lets people try the idea without Spectacles.

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
| Cue wording + stability | `src/web/director.ts` | Maps `GuidanceEngine`/`CompositionAnalyzer` output to the on-screen cue; `CueStabilizer` prevents flicker; keeps the pill in the top safe area unless the subject is under it |
| Pixels → guidance | `src/web/pipeline.ts` | `rgbaToGray` → `PhotoAnalysisEngine.analyze` (from `src/vision`) |
| Synthetic demo scene | `src/web/demoScene.ts` | Deterministic landscape, lighting presets, virtual pan |
| Stale-tap check | `src/web/tapAnchor.ts` | Decides when a live-camera tap no longer matches the view (coarse frame comparison or 15 s age). It does not track anything |
| Layout helpers | `src/web/geometry.ts` | Fits the grid to the image (`object-fit: contain` maths) and maps taps to frame coordinates |
| Read-outs | `src/web/observations.ts` | Measurements as text; no scores |
| Camera errors | `src/web/cameraErrors.ts` | Permission, missing-camera and in-use messages |

While a source is active, a frame is sampled every 400 ms and downscaled to 64 px wide. `FrameMemory` (inside `PhotoAnalysisEngine`) skips re-measuring lighting for unchanged frames. Composition is recomputed from the subject point you tapped. `GuidanceEngine` decides what to say; `director.ts` turns it into the one-line pill; the explanatory sentence sits under the viewfinder. A new cue must appear in 2 consecutive samples, and the current cue must have been visible for at least 1 s, before it changes (a tap resets this so the response is immediate). "Ready!" becomes "Awesome! Capture this!" after it has held for 1.2 s.

Live-camera taps: when you tap, the page keeps a coarse 16×9 brightness map of the frame (mean-removed, so auto-exposure shifts are ignored). Each sample is compared with it, over the whole frame and around the tap. Two consecutive samples with mean change above 0.05, or a tap older than 15 s, make the tap stale: the marker disappears, the stabiliser is reset so the old direction stops at once, and the pill says "Moved? Tap your subject again". A stale tap is never revived; tapping again is the fallback. The simulated demo moves its subject with the virtual pan, so it does not need this.

Tests: `tests/Director.test.mjs` (cue mapping, no direction without a subject, re-tap prompt, one-line headlines, anti-flicker, placement), `tests/TapAnchor.test.mjs` (hand shake and exposure shifts keep a tap; a pan or age drops it; re-tapping restores it) and `tests/WebDemo.test.mjs`. They run the demo scenes through the real analyzers and simulate a user tapping the subject and following the pan guidance until Capture This! appears.

## Camera permissions and privacy

- The camera starts only after you press **Enable camera** and grant permission. Audio is never requested.
- If you deny it, the page explains how to re-enable it, and **Try Demo** keeps working.
- Frames are analysed in the page and are never uploaded. No analytics, no network calls for analysis.
- **Stop camera**, switching to the demo, and leaving the page all stop the camera tracks. Reset only clears the marked subject and hides the grid; the camera keeps running.
- The **shutter** only captures when you press it. It encodes a JPEG and hands it to the browser's download; nothing is uploaded. The page says "Photo captured" only after encoding succeeds. It cannot confirm where the browser stores the file, so it never claims more than that.

## Limitations (honest list)

- **No subject detection or tracking.** The subject is wherever you tap. With a live camera the tap is a fixed spot, not a track. Frame This! detects that the view changed and asks for a new tap, but it cannot tell where the subject went. Panning across a featureless surface (a blank wall, clear sky) may not register as a change; the 15 s limit is the backstop. Large movement inside the scene (someone walking through) can also expire a tap.
- **Lighting is pixel brightness, not light metering.** Values come from the browser's auto-exposed, white-balanced video, so they describe the rendered image, not the scene's actual light or photographic merit. Thresholds are defaults, not tuned on a photo dataset.
- **Directions assume a rear camera.** "Look to the right" means turn the camera to the right. The front-camera preview is not mirrored, so the wording may feel reversed when you are facing the camera.
- **One direction at a time.** When the subject is off on both axes, the cue shows the larger offset first, so it can alternate (for example right, then up) as you converge.
- **Camera switching** is offered only when the browser reports more than one camera; some browsers ignore the front/rear preference.
- **Demo mode is simulated.** The scene, lighting presets and pan are synthetic and are labeled as such on screen.
- **Not yet tested on a physical phone.** Verified in desktop Chrome (headless, including Chrome's built-in fake camera and a denied-permission run) at desktop and 390 px mobile sizes. Test the real iOS Safari and Android Chrome camera paths on a device before demoing.
- The old Light It Up! breadboard lesson is no longer shown in the web UI. Its engine (`src/core`) and tests remain in the repo.
