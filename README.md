# Ghost Hands AR: Frame This! 👻📸

**See what you've been missing.**

**Frame This!** is the current hackathon experience within **Ghost Hands AR**: a SPECS augmented-reality photography guide that uses a subtle viewfinder and, eventually, translucent ghost hands to help photographers notice and frame interesting shots.

Rather than judging photographs after capture, Frame This! aims to offer *in-the-moment* guidance: **“Look up,” “Turn left,” “Try the upper-right third,”** and, when the framing is ready, **“Capture This!”**

> **Status (November 9, 2026):** The native SPECS Lens project is committed on `feature/capture-this-specs`. In local Lens Studio 5.24 Preview, Scout/Reset changed the visible grid and instructions, and TypeScript compilation succeeded (developer-observed). The native Lens currently uses static framing guidance; live subject tracking, on-device lighting CV, and photo capture have **not** been verified in the SPECS runtime. The separately deployed Vercel demo implements browser-based camera analysis and manual subject marking, not native SPECS integration.

## What we are building

**Primary experience**
1. **Scout:** Start a quiet composition-guidance mode.
2. **Frame:** Show an unobtrusive rule-of-thirds guide, eventually represented by translucent *ghost hands* framing the scene.
3. **Guide:** Offer one small composition or lighting cue at a time.
4. **Align:** Update the cue as the user repositions the frame, through verified tracking or an explicitly labeled preview simulation.
5. **Capture This!:** Indicate a promising frame. Actual photo capture is only claimed if confirmed against supported SPECS APIs.

**Prototype boundaries:** A rule-of-thirds grid needs no computer vision. Actual subject detection and lighting assessment need a supported image source and testing. Model-generated creative suggestions are optional, not essential to the basic interaction.

## Current technical state

| Area | Current status |
| --- | --- |
| GitHub repository | Existing TypeScript/Vite web learning demo and core lesson/vision code on `main` |
| Web companion demo | Frame This! browser demo: viewfinder with one compact, automatic guidance pill (camera or synthetic scene), tap-to-mark subject, local brightness analysis, shutter; **not** a SPECS Lens |
| Lens Studio | Native `Ghost-Hands-AR/Ghost-Hands-AR.esproj` committed to `feature/capture-this-specs`; opened and locally tested in Lens Studio 5.24 Preview |
| Lens Studio MCP | Claude Code successfully queried the local Lens Studio scene via MCP |
| Frame This! spatial UI | Scout/Reset, grid and instruction states observed in local Lens Studio Preview; no physical SPECS test |
| Composition / lighting CV | Pure TypeScript calculations tested in browser track; **not wired to native Lens** |
| Runtime AI | Optional stretch goal; no runtime API key required for base experience |
| SPECS photography capture | Not yet verified |

The prior **Light It Up!** breadboard tutorial and modular learning experiments remain useful earlier explorations. They are **not the current hackathon concept** and do not demonstrate Frame This! functionality.

## Repository layout

Current tracked files include:

```text
ghost-hands-ar/
├── README.md
├── package.json                 # Existing Vite/TypeScript web demo
├── index.html
├── src/
│   ├── core/                    # Earlier lesson engine
│   ├── vision/                  # Frame memory, lighting, composition, guidance (pure, tested)
│   └── web/                     # Frame This! browser companion demo; not SPECS
├── tests/                       # Web / core tests
└── docs/
    ├── CAPTURE-THIS-SPECS.md    # Current Frame This! working brief
    ├── CONCEPT.md               # Earlier electronics concept
    ├── ARCHITECTURE.md          # Earlier electronics architecture
    └── MVP.md                   # Earlier electronics scope
```

The native Lens Studio project is tracked at `Ghost-Hands-AR/Ghost-Hands-AR.esproj` on `feature/capture-this-specs`. Open it in Lens Studio 5.24 and verify against [SPECS final QA](docs/SPECS-FINAL-QA.md). Keep generated caches, local secrets, and machine-specific files out of Git. `devpost/` should contain official planning output only after it has actually been generated.

See [project structure and workstreams](docs/PROJECT-STRUCTURE.md) for the separation of responsibilities and integration procedure.

## Development tracks

### SPECS Lens: hackathon priority

1. Verify active project identity and the supported camera, input, and UI APIs with Lens Studio MCP.
2. Re-verify the **implemented AR viewfinder and Scout / Reset interaction** in SPECS Preview.
3. Preserve the static framing instruction unless a tracked, verified real-input integration is ready; do not imply dynamic composition guidance in the native Lens.
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
- Deadline: November 9, 2026 (confirm timezone and final requirements on the organizer page).
- Target deliverables: native Lens Studio project, official planning artifacts where required, short working demo, and honest description of limitations.

## License

No license selected yet. All rights reserved unless a license is added.
