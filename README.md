# Ghost Hands AR: Frame This! 👻📸

**See what you've been missing.**

**Frame This!** is the current hackathon experience within **Ghost Hands AR**: a SPECS augmented-reality photography guide that uses a subtle viewfinder and, eventually, translucent ghost hands to help photographers notice and frame interesting shots.

Rather than judging photographs after capture, Frame This! aims to offer *in-the-moment* guidance: **“Look up,” “Turn left,” “Try the upper-right third,”** and, when the framing is ready, **“Capture This!”**

> **Status (November 9, 2026):** The native SPECS Lens is merged on `main` at `Ghost-Hands-AR/Ghost-Hands-AR.esproj`. It implements an **orientation-guided composition guide**: **Select view → directional cues → READY → Reselect**, developed for Lens Studio 5.24.1 Preview. It stores a camera *direction*, not an object: there is no subject recognition, image-based tracking, on-device lighting CV, or photo capture in the native Lens, and no physical SPECS hardware run has been reported. The separately deployed Vercel companion runs browser-based camera analysis with a manually marked subject; it is not native SPECS integration.

## What we are building

**Native SPECS Lens (implemented on `main`)**
1. **Aim:** The framing guide is visible on start; the button reads **Select view**.
2. **Select view:** Pinching stores the camera's current world-space forward direction (the center of view). The button becomes **Reselect**.
3. **Directional guidance:** Each frame, the stored direction is re-projected into the current view. One cue at a time — **Turn a little right/left** or **Look up/down a little** — moves it toward a lower-left rule-of-thirds target.
4. **READY:** Within tolerance, the cue reads **READY! Capture this!** in mint green and the button label shows **READY**.
5. **Reselect:** Pinch again to choose a new direction. If the selected direction falls behind the user, the Lens asks them to reselect.

**Planned:** translucent *ghost hands* framing the shot, verified camera-based subject and lighting analysis, and capture through supported SPECS APIs.

**Prototype boundaries:** The orientation guide works best for stationary, distant subjects while the user rotates in place; moving sideways introduces parallax. A rule-of-thirds grid needs no computer vision. Actual subject detection and lighting assessment need a supported image source and testing. Model-generated creative suggestions are optional, not essential to the basic interaction.

## Current technical state

| Area | Current status |
| --- | --- |
| GitHub repository | Native Lens, web companion, and tested vision modules merged on `main` |
| Web companion demo | Frame This! browser demo: viewfinder with one compact, automatic guidance pill (camera or synthetic scene), tap-to-mark subject, local brightness analysis, shutter; **not** a SPECS Lens |
| Lens Studio | Native `Ghost-Hands-AR/Ghost-Hands-AR.esproj` on `main`, targeting Lens Studio 5.24.1; packages and fonts stored with Git LFS |
| Lens Studio MCP | Claude Code queried and edited the local Lens Studio scene via MCP |
| Frame This! spatial UI | Orientation guide: Select view → directional cues → READY → Reselect, with flat HUD typography; confirm in Preview before recording. No physical SPECS test |
| Composition / lighting CV | Pure TypeScript calculations tested in browser track; **not wired to native Lens** |
| Runtime AI | Optional stretch goal; no runtime API key required for base experience |
| SPECS photography capture | Not implemented in the native Lens |

The prior **Light It Up!** breadboard tutorial and modular learning experiments remain useful earlier explorations. They are **not the current hackathon concept** and do not demonstrate Frame This! functionality.

## Repository layout

Current tracked files include:

```text
ghost-hands-ar/
├── README.md
├── Ghost-Hands-AR/              # Native Lens Studio SPECS project (Ghost-Hands-AR.esproj)
├── package.json                 # Existing Vite/TypeScript web demo
├── index.html
├── src/
│   ├── core/                    # Earlier lesson engine
│   ├── vision/                  # Frame memory, lighting, composition, guidance (pure, tested)
│   └── web/                     # Frame This! browser companion demo; not SPECS
├── tests/                       # Web / core tests
└── docs/
    ├── CAPTURE-THIS-SPECS.md    # Frame This! working brief
    ├── SPECS-ORIENTATION-GUIDE.md # Native orientation guide behavior and limits
    ├── SPECS-FINAL-QA.md        # Preview verification and demo checklist
    ├── CONCEPT.md               # Earlier electronics concept
    ├── ARCHITECTURE.md          # Earlier electronics architecture
    └── MVP.md                   # Earlier electronics scope
```

The native Lens Studio project is tracked at `Ghost-Hands-AR/Ghost-Hands-AR.esproj` on `main`. Open it in Lens Studio 5.24.1 and verify against [SPECS final QA](docs/SPECS-FINAL-QA.md). Clone with Git LFS installed so packages and fonts download. Keep generated caches, local secrets, and machine-specific files out of Git. `devpost/` holds official Devpost Learn planning output only if it was actually generated; it is welcomed but not required in the repository.

See [project structure and workstreams](docs/PROJECT-STRUCTURE.md) for the separation of responsibilities and integration procedure.

## Development tracks

### SPECS Lens: hackathon priority

1. Verify active project identity and the supported camera, input, and UI APIs with Lens Studio MCP.
2. Verify the **Select view → directional cues → READY → Reselect** flow in SPECS Preview.
3. Keep native guidance orientation-based unless a tracked, verified real-input integration is ready; do not imply object tracking.
4. Add isolated luminance and composition calculations **only with verified inputs**.
5. Add ghost-hand visual treatment if time allows; keep interface legible.
6. Record actual SPECS Preview behavior and submit the Lens project, documentation, and demo.

Read [Frame This! SPECS working brief](docs/CAPTURE-THIS-SPECS.md).

### Web companion demo: Frame This! in the browser

The Vite app is a **browser companion demo** of the Frame This! interaction, for judges and testers without Spectacles. It is not a substitute for the SPECS Lens and does not demonstrate native Spectacles camera access, hand tracking or on-device AI.

- **Viewfinder first:** after you press **Enable camera** and grant permission, the camera fills the viewfinder and a compact, single-line guidance pill appears in its top safe area automatically, leaving the scene visible and never blocking taps: "Tap your subject", "Look to the right →", "↑ Look up.", "You're off frame.", "It's too dark.", "Ready!", then "Awesome! Capture this!".
- **Real analysis:** sampled frames run through `src/vision` (`PhotoAnalysisEngine` → `GuidanceEngine`) locally. `src/web/director.ts` only rewords the engine's result and keeps it steady; it never invents a direction or readiness.
- **Subject:** there is no subject detection or tracking. Until you tap your subject, the cue says so and gives no direction. On the live camera a tap marks one fixed spot (dashed ring); once the view changes, or after 15 s, Frame This! drops it and asks "Moved? Tap your subject again" instead of repeating a stale direction.
- **Shutter:** a camera-style shutter button sits under the viewfinder and lights up when the engine reports ready. "Photo captured" appears only after the image was actually encoded and handed to the browser's download.
- **Scout grid:** optional toggle for the rule-of-thirds lines.
- **Try demo · no camera:** a built-in synthetic landscape with lighting presets and arrow buttons to look around. Every cue is labeled "Simulated scene".

Details, permissions and limitations: [docs/WEB_PREVIEW.md](docs/WEB_PREVIEW.md).

```powershell
npm install
npm run dev
npm test
npm run build
```

Use Node.js 22.12+ as declared in `package.json`. Web test/build results must be checked on the actual checkout; presence of scripts alone is not proof they pass.

### AI and privacy

Prioritize local geometry and image-derived heuristics. If an AI snapshot feature is added, it should use explicit user initiation, minimal image retention, server-side credentials, and documented API costs. Do not put service API keys into Lens scripts or commit local environment files.

## Testing and claims

For every feature, distinguish **implemented**, **tested in Lens Studio Preview**, **tested on actual SPECS hardware**, and **planned**. A simulated composition cue is not evidence of real-time object tracking or lighting analysis. “Capture This!” is guidance, not a guarantee of photo quality.

## Hackathon

- Event: [Learn AR with SPECS](https://learn-specs.devpost.com/)
- Target submission: **Ghost Hands AR: Frame This!**
- Deadline: November 9, 2026 at 5:00 PM EST (4:00 PM CST).
- Deliverables: public repo with the native Lens Studio project, a public YouTube demo under 3 minutes showing the Lens working in Preview, a short description, and an honest account of limitations.

## License

No license selected yet. All rights reserved unless a license is added.
