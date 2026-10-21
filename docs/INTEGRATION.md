# Connecting the lesson engine to Lens Studio

The engine currently has **no direct Lens Studio dependency**. The adapter port at `src/adapters/SceneBridge.ts` defines everything the 3D scene needs to render.

## How it works

1. Create a `LessonController`.
2. Implement the `ScenePort` interface using validated Lens Studio APIs and references to scene objects.
3. Call `connectLessonScene(controller, port)` to render the initial step and subscribe to updates.
4. Wire the UI's Next, Back, and Restart interactions to `controller.next()`, `controller.back()`, and `controller.restart()`.
5. On scene teardown call the cleanup function returned by `connectLessonScene`.

## Required scene references

- Virtual breadboard object
- Virtual LED object and optional glow effect
- Virtual resistor object
- Wiring path effect
- Step title, instruction, and hint text
- Next and Back buttons; Restart action
- Progress indicator

## Important implementation constraints

- The `ConsoleScene` is **not** an AR renderer. It exists only for testing and examining lesson output.
- Do not assume TypeScript modules can be imported unchanged inside Lens Studio. Once the official SPECS Base Template is generated, adjust imports/build packaging to its actual supported runtime.
- Validate gesture, UI Kit, and scene object methods using the officially installed SDK and editor, not guesses.
- Keep the scene adapter separate from the platform-independent lesson engine.
- The virtual completion glow must not be presented as physical electrical verification.

## Local preview of lesson logic

With a compatible Node.js version that supports type stripping:

```sh
npm run demo
npm test
```

To check TypeScript types, install TypeScript locally (`npm install --no-save typescript`) and run `npm run typecheck`. The repository does not yet include a lockfile or any Lens Studio-generated project artifacts.
