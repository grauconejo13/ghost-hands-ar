# Capture This — SPECS Lens implementation brief

Status: Hackathon working brief, 2026-11-06. Not a substitute for the required Devpost Learn plan-lens output. This file is a plan, not evidence of implementation.

## One-sentence pitch
A quiet photography scout for AR glasses: glance around a scene, receive a simple composition or lighting cue, align a framing guide, and decide when to capture.

## Platform and submission
- New SPECS Lens built in Lens Studio with CLAD and Lens Studio MCP.
- Live project folder on developer laptop: `Ghost-Hands-AR/` (may not yet be pushed).
- The existing web prototype and earlier Ghost Hands breadboard lesson are **not** the new SPECS submission; disclose and avoid importing old code.
- Run official `plan-lens` skill. Retain generated materials in `devpost/`.
- Demo must show actual Lens Studio SPECS Preview under three minutes. Public repo must include the Lens project. Deadline Nov 9 2026, 5 PM ET.

## Primary user journey
1. User enters Scout mode via supported preview input.
2. A small translucent rule-of-thirds grid appears in the central viewing area.
3. User sees exactly one guidance message such as "Try placing the subject on the upper-right intersection", or a data-driven cue if real analysis works.
4. User adjusts view; guidance changes visibly through actual tracker/pose data or an explicitly labeled controlled demo.
5. "Ready to capture" indicates framing readiness, not a claim of artistic quality. Capture may mean the user manually takes a photograph; use SPECS media capture only if the API is verified.
6. Reset returns to Scout.

## Small, isolated modules
- AR UI: grid, four intersection markers, cue text, status chip and Scout/Reset interaction. Must run in Preview without internet.
- Composition rule: pure functions using normalized frame coordinates [0,1], nearest intersection among (1/3,1/3), (2/3,1/3), (1/3,2/3), (2/3,2/3); threshold and hysteresis to avoid flicker. A grid alone requires no CV.
- Lighting: if actual frame access exists, sample downscaled luminance; calculate mean, dark pixel fraction, bright pixel fraction. These measure camera-rendered luminance, not calibrated light or photographic merit.
- Subject tracking (stretch): supported on-device detector / documented tracking; if unavailable, user places a target marker or use a clearly labeled simulated scene.
- Optional AI (stretch): only a manual Scout request on a single frame, with permissions, rate limiting, no frame storage by default, fallback when offline. Do not send frames or insert credentials before approval.

## Constraints
- Do not assume mobile Camera Kit APIs operate in SPECS Lens.
- Verify Lens Studio API support through documentation and MCP inspection. State unavailable capabilities clearly.
- Favor no network dependency or paid API for the judged primary path.
- No misleading claims of automatic subject recognition, live lighting intelligence, or camera capture when only mocked.
- Keep interface quiet; one cue at a time.
- Leave original starter examples intact until prototype runs.
- Do not commit caches, temporary files, secret tokens or local .claude approvals.

## Acceptance checks
- [ ] Opens in SPECS Lens Studio Preview without compile/runtime errors.
- [ ] Scout and Reset trigger visible state transitions.
- [ ] Grid appears properly and does not overwhelm central vision.
- [ ] Rule-of-thirds logic has deterministic test inputs and output.
- [ ] If real CV exists: prove frame sampling and report data sources, latency, and limitations.
- [ ] A person can complete an end-to-end framing demonstration in <60 seconds.
- [ ] Demo describes actual implemented capabilities, not roadmap.
- [ ] Lens Studio project and official Devpost planning documents pushed to public repository.
- [ ] Public YouTube demo <3 minutes, Devpost submission complete.

## Work order for Claude Code via MCP
1. Inspect active SPECS scene and project path; inspect supported camera/image access APIs. Do not edit until confirmed.
2. Run official plan-lens workflow and preserve artifacts; keep scope as described.
3. Add independent CaptureThis root; build spatial UI and simulated deterministic framing interaction, preserving template examples.
4. Preview, test and report failures.
5. Implement isolated composition math and lighting math as pure scripts with tests.
6. Wire real camera input only if supported and accessible in preview.
7. Only after core works, consider an optional AI snapshot path.
8. Save Lens project, report changed files and preview-test evidence; no commits without reviewing generated artifacts.
