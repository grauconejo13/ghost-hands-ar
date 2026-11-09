# Frame This! native SPECS: final verification and demo notes

**Checkpoint:** November 9, 2026. This is a verification aid, not a claim of live hardware validation or a substitute for official hackathon planning documents.

## What is actually implemented in the native project

- Lens Studio native project: `Ghost-Hands-AR/Ghost-Hands-AR.esproj`.
- `Assets/Scripts/FrameThisController.ts` implements the **orientation guide**: a Spectacles UIKit `RectangleButton` toggles **Select view / Reselect**; the selected camera direction is re-projected every frame to give one cue (**Turn a little right/left**, **Look up/down a little**) until **READY! Capture this!** (mint green; button label shows **READY**). See [SPECS-ORIENTATION-GUIDE.md](SPECS-ORIENTATION-GUIDE.md).
- The `Assets/Scene.scene` contains the framing guide, flat HUD instruction text, and the Select view button.
- Earlier developer screenshots showed the previous Scout/Reset version compiling in Lens Studio **5.24.1** on Windows; the orientation guide replaced it on `main`.
- The guide stores a direction, not an object. No image-based subject tracking, camera-driven composition or lighting analysis, or native photo capture is implemented.
- The standalone browser companion has separate local image analysis and browser photo capture. **Do not claim these operate inside the SPECS Lens.**

## Save-the-demo verification, on the machine with Lens Studio installed

1. Use Lens Studio **5.24.1** to open `Ghost-Hands-AR/Ghost-Hands-AR.esproj` from `main` (cloned with Git LFS). If already open and working, keep that project and its local package state; avoid SDK upgrades.
2. In Lens Studio Preview, confirm the TypeScript Status reports successful compilation and the Logger shows no blocking errors. Do not run automated inspector queries that add incompatible Lens Studio 5.25 packages.
3. On start, confirm the framing guide and **Aim at subject, then Select view** instruction are legible and the button reads **Select view**.
4. Select view, then rotate the Preview camera. Confirm cues change with orientation and the button reads **Reselect**.
5. Reach **READY! Capture this!** and confirm the green cue and **READY** label; select again to confirm Reselect.
6. Save with **File → Save**. Record a short screen capture of Select view → cues → READY, the Preview area, and a few seconds of the TypeScript successful-status indicator.
7. If any action fails, keep the last verified working project. Capture the Logger error and state the limitation instead of changing SDK versions immediately.

## Suggested honest demo narration (native segment, about 45 seconds)

> This is Ghost Hands AR: Frame This!, a spatial photography coach for SPECS. I aim at my subject and pinch Select view. As I turn, the Lens gives one small cue at a time, like "Turn a little right," until my subject sits on a rule-of-thirds point, and then it says READY, capture this. It works from head orientation, not object tracking, so it's best for stationary, distant subjects. Separately, our browser companion tests camera-based lighting and framing heuristics with a user-selected subject; bringing those analyses into the glasses is future work.

## Submission evidence checklist

- [ ] Native SPECS Lens opens in Preview; no blocking TypeScript errors.
- [ ] Visible Select view → directional cues → READY → Reselect flow captured on video.
- [x] Public repository `main` contains `Ghost-Hands-AR.esproj`; Git LFS packages and fonts download (checked Nov 9).
- [ ] Final demo video is public on YouTube, under 3 minutes, and playable; show the **actual native Preview**, not only Vercel.
- [ ] Browser companion is labeled **web demonstration** and does not substitute for native SPECS evidence.
- [ ] Clearly distinguish implemented behavior from planned ghost-hand animation, live CV, automatic subject tracking and SPECS capture.
- [ ] Deadline: Nov 9, 2026, 5:00 PM EST (4:00 PM CST). Planning was required to use the Devpost Learn skill pack; `devpost/` documents are welcomed but not required in the repo.
- [ ] Submit with time for a final check of links and visibility.

## Known risks

- Lens Studio 5.25 auto-imported inspection dependencies (`AiPreviewAgentInspect`, `Motion`, `Icons`) previously caused TypeScript package resolution errors in 5.24. Do not modify package versions simply to improve the demo.
- Native Lens `FrameThisController` is not integrated with `src/vision/PhotoAnalysisEngine.ts`; browser APIs cannot be assumed available in the Lens runtime.
- No successful physical SPECS hardware run has been reported.
