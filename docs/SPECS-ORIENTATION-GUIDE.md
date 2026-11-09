# SPECS Orientation Guide: Select → Move → Ready

**Status:** Merged on `main` (PR #6) and is the current native Frame This! interaction. Developed for Lens Studio 5.24.1 Preview; confirm the flow in Preview before recording. No physical SPECS hardware run has been reported.

## Behavior

This replaced the earlier native Scout/Reset interaction using the *same* scene component bindings (no new packages, objects, or prefab dependencies):

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

## Verify in Lens Studio Preview

1. Pull `main` with Git LFS installed and open `Ghost-Hands-AR/Ghost-Hands-AR.esproj` in **Lens Studio 5.24.1**.
2. Check TypeScript Status and Logger. Stop and capture the error if compilation fails.
3. On entering Preview, confirm the grid is visible and the button says **Select view**.
4. Select view; rotate the Preview camera slightly right, then up. Confirm the cue follows camera orientation (not a timer).
5. Find READY and check the green cue and label; select again and confirm **Reselect** works.
6. If directions appear inverted, note it rather than changing code before the deadline.
7. Record this flow for the demo.

## Technical assumptions to verify

- `FrameThisController` SceneObject is a direct child of the project's Camera Object in the saved scene.
- Lens Studio's `quat.multiplyVec3`, `quat.invert`, and `Text.textFill.color` types are available in this project's 5.24.1 SDK.
- Head/camera rotation changes in the Preview input method you use.

**Do not import Lens Studio 5.25 inspector packages through automated MCP Preview queries.**
