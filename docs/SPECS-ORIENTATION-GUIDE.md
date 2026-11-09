# SPECS Orientation Guide: Select → Move → Ready

**Status:** Native code pushed for Lens Studio verification. **Not yet compiled or tested in Lens Studio Preview.** Do not merge into main or claim functioning on hardware until verified.

## Behavior

This experiment replaces the native Scout/Reset interaction using the *same* scene component bindings (no new packages, objects, or prefab dependencies):

1. **Aim at subject:** The framing guide is enabled on Lens start; the existing button reads **Select view**.
2. **Select:** Activating the existing button stores the camera's current **world-space forward direction** (initially at the center of view). The button becomes **Reselect**.
3. **Move:** As camera orientation changes, the stored direction changes relative to the camera. The instruction updates with **Turn a little right/left** or **Look up/down a little**.
4. **Align:** When the stored direction reaches a small offset from center (an illustrative left/lower composition target), the cue displays **READY! Capture this!** and the button label turns green and says **READY**.
5. **Reselect:** Activating the button again marks the currently centered direction.

## What it does not do

- **No subject recognition or image-based tracking.** Selecting a view stores a direction, not an object identity or 3D anchor.
- The selected direction is most meaningful for **stationary, distant subjects** when the user rotates in place. Moving sideways can cause parallax and invalidate the approximation.
- The current guide is a **composition orientation exercise**, not a judgment that a photograph is artistically good.
- No SPECS photo capture, lighting analysis, network backend or paid model is wired in.
- Green feedback is currently applied to the existing button label, **not the whole framing grid**.

## Test on your local machine

1. First preserve a recording of the existing working `feature/capture-this-specs` Lens.
2. Fetch this branch and only switch if Git allows it without overwriting untracked local packages.
3. Open `Ghost-Hands-AR/Ghost-Hands-AR.esproj` in **Lens Studio 5.24.1**.
4. Check TypeScript Status and Logger immediately. If the new script fails compilation, stop and keep the stable branch for submission.
5. Confirm on entering Preview that the grid is visible and button says **Select view** (not Scout).
6. Select view; rotate the Preview camera slightly right, then up. Confirm the cue changes from camera orientation (not a timer).
7. Find READY, check the green label; reselect and confirm it resets.
8. Verify instructions correspond to actual Preview camera movement; if inverted, do not submit this experimental version.
9. Record this flow only if compilation and behavior pass.

**Recovery:** `git switch feature/capture-this-specs` returns to the verified static Scout/Reset version, provided there are no blocking uncommitted changes.

## Technical assumptions to verify

- `FrameThisController` SceneObject is a direct child of the project's Camera Object in the saved scene.
- Lens Studio's `quat.multiplyVec3`, `quat.invert`, and `Text.textFill.color` types are available in this project's 5.24.1 SDK.
- Head/camera rotation changes in the Preview input method you use.

**Do not import Lens Studio 5.25 inspector packages through automated MCP Preview queries.**
