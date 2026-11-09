# Frame This! native SPECS: final verification and demo notes

**Checkpoint:** November 9, 2026. This is a verification aid, not a claim of live hardware validation or a substitute for official hackathon planning documents.

## What is actually implemented in the native project

- Lens Studio native project: `Ghost-Hands-AR/Ghost-Hands-AR.esproj`.
- `Assets/Scripts/FrameThisController.ts` binds a Spectacles UIKit `RectangleButton` to a two-state interface: **Scout** enables the guide and changes the instruction; **Reset** disables it.
- The `Assets/Scene.scene` contains framing guide visuals, instruction text, and a Scout/Reset button.
- Developer screenshots previously showed both states and a successful TypeScript compilation in Lens Studio **5.24.1** on Windows.
- Native composition advice is a **static rule-of-thirds instruction**. Neither camera-driven composition analysis nor tracking nor native photo capture has been verified.
- The standalone browser companion has separate local image analysis and browser photo capture. **Do not claim these operate inside the SPECS Lens.**

## Save-the-demo verification, on the machine with Lens Studio installed

1. Use Lens Studio **5.24.1** to open `Ghost-Hands-AR/Ghost-Hands-AR.esproj` on branch `feature/capture-this-specs`. If already open and working, keep that project and its local package state; avoid SDK upgrades.
2. In Lens Studio Preview, confirm the TypeScript Status reports successful compilation and the Logger shows no blocking errors. Do not run automated inspector queries that add incompatible Lens Studio 5.25 packages.
3. In **idle**, confirm the Scout button and introductory instruction are legible and the rule-of-thirds guide is hidden.
4. Select **Scout**. Confirm the rule-of-thirds grid and instruction appear, the button label becomes **Reset**, and the grid lies within the viewing area.
5. Select **Reset**. Confirm the grid hides, instruction returns to idle text, and button label becomes **Scout**.
6. Save with **File → Save**. Record a short screen capture of both states, the Preview area, and a few seconds of the TypeScript successful-status indicator.
7. If any action fails, keep the last verified working project. Capture the Logger error and state the limitation instead of changing SDK versions immediately.

## Suggested honest demo narration (native segment, about 45 seconds)

> This is Ghost Hands AR: Frame This!, a prototype spatial photography guide built for SPECS. In Lens Studio Preview, selecting Scout places a rule-of-thirds reference into the viewing area so you can consider your composition without opening a phone. Reset clears the overlay. This is the working native prototype. Separately, our browser companion tests camera-based lighting and framing heuristics with a user-selected subject; bringing those live analyses into the glasses is future integration work.

## Submission evidence checklist

- [ ] Native SPECS Lens opens in Preview; no blocking TypeScript errors.
- [ ] Visible Scout → Reset → Scout transition captured on video.
- [ ] Public repository URL points to a branch containing `Ghost-Hands-AR.esproj`.
- [ ] Final demo video is uploaded and playable; show the **actual native Preview**, not only Vercel.
- [ ] Browser companion is labeled **web demonstration** and does not substitute for native SPECS evidence.
- [ ] Clearly distinguish implemented behavior from planned ghost-hand animation, live CV, automatic subject tracking and SPECS capture.
- [ ] Verify the official submission deadline, required planning assets and Devpost fields directly.
- [ ] Submit with time for a final check of links and visibility.

## Known risks

- Lens Studio 5.25 auto-imported inspection dependencies (`AiPreviewAgentInspect`, `Motion`, `Icons`) previously caused TypeScript package resolution errors in 5.24. Do not modify package versions simply to improve the demo.
- Native Lens `FrameThisController` is not integrated with `src/vision/PhotoAnalysisEngine.ts`; browser APIs cannot be assumed available in the Lens runtime.
- No successful physical SPECS hardware run has been reported.
