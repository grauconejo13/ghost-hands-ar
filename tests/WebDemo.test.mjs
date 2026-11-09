import test from "node:test";
import assert from "node:assert/strict";
import { fitContain, clientToFrame } from "../src/web/geometry.ts";
import { cameraErrorMessage } from "../src/web/cameraErrors.ts";
import { analyzeRgba, analysisHeight, ANALYSIS_WIDTH } from "../src/web/pipeline.ts";
import { lightingObservations, compositionObservations } from "../src/web/observations.ts";
import {
  DEMO_SCENES, DEMO_TREE_WORLD, INITIAL_OFFSET, renderDemoScene, panOffset, worldToFrame, frameToWorld, clampOffset,
} from "../src/web/demoScene.ts";
import { PhotoAnalysisEngine } from "../src/vision/PhotoAnalysisEngine.ts";
import { analyzeComposition } from "../src/vision/CompositionAnalyzer.ts";

const W = ANALYSIS_WIDTH;
const H = analysisHeight(16, 9);

// ---------- geometry ----------

test("fitContain letterboxes landscape media in a portrait stage", () => {
  assert.deepEqual(fitContain(360, 640, 1280, 720), { left: 0, top: 218.75, width: 360, height: 202.5 });
});

test("fitContain pillarboxes portrait media in a landscape stage", () => {
  const b = fitContain(800, 600, 720, 1280);
  assert.equal(b.height, 600);
  assert.equal(b.width, 337.5);
  assert.equal(b.left, (800 - 337.5) / 2);
});

test("fitContain falls back to the container before media metadata loads", () => {
  assert.deepEqual(fitContain(300, 200, 0, 0), { left: 0, top: 0, width: 300, height: 200 });
});

test("clientToFrame normalises taps and rejects taps outside the image", () => {
  const rect = { left: 10, top: 20, width: 200, height: 100 };
  assert.deepEqual(clientToFrame(110, 70, rect), { x: 0.5, y: 0.5 });
  assert.deepEqual(clientToFrame(10, 20, rect), { x: 0, y: 0 });
  assert.equal(clientToFrame(5, 70, rect), null);
  assert.equal(clientToFrame(110, 121, rect), null);
});

// ---------- camera errors ----------

test("permission denial points the user to the demo", () => {
  assert.match(cameraErrorMessage({ name: "NotAllowedError" }), /denied.*Try Demo/);
  assert.match(cameraErrorMessage({ name: "NotReadableError" }), /in use/);
  assert.match(cameraErrorMessage(new Error("boom")), /Try Demo/);
  assert.match(cameraErrorMessage(null), /Try Demo/);
});

// ---------- demo scene through the real analysis pipeline ----------

const analyzeScene = (id, offset, subject = null, engine = new PhotoAnalysisEngine(), t = 0) =>
  analyzeRgba(engine, renderDemoScene(id, W, H, offset), W, H, t, subject, true);

test("demo render is deterministic and opaque", () => {
  const a = renderDemoScene("golden", W, H, INITIAL_OFFSET);
  const b = renderDemoScene("golden", W, H, INITIAL_OFFSET);
  assert.deepEqual(a, b);
  assert.equal(a.length, W * H * 4);
  for (let i = 3; i < a.length; i += 4) assert.equal(a[i], 255);
  assert.throws(() => renderDemoScene("golden", 0, 10, INITIAL_OFFSET));
});

test("each demo scene produces the intended lighting reading", () => {
  const expected = { golden: "balanced", dusk: "dark", overexposed: "bright", fog: "low-contrast" };
  assert.deepEqual(DEMO_SCENES.map((s) => s.id).sort(), Object.keys(expected).sort());
  for (const [id, condition] of Object.entries(expected)) {
    assert.equal(analyzeScene(id, INITIAL_OFFSET).lighting.condition, condition, id);
  }
});

test("golden scene stays balanced across the whole pan range", () => {
  for (const x of [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]) {
    for (const y of [0, 0.15, 0.3375]) {
      assert.equal(analyzeScene("golden", { x, y }).lighting.condition, "balanced", `${x},${y}`);
    }
  }
});

test("without a tap the subject is reported unknown, not guessed", () => {
  const r = analyzeScene("golden", INITIAL_OFFSET);
  assert.equal(r.composition.status, "unknown");
  assert.equal(r.guidance.id, "subject-unknown");
  assert.equal(r.guidance.ready, false);
});

test("dark scene warns about exposure before composition", () => {
  const subject = worldToFrame(DEMO_TREE_WORLD, INITIAL_OFFSET);
  assert.equal(analyzeScene("dusk", INITIAL_OFFSET, subject).guidance.id, "too-dark");
});

test("frame/world mapping round-trips and pan offsets clamp", () => {
  const p = { x: 0.25, y: 0.75 };
  const back = worldToFrame(frameToWorld(p, INITIAL_OFFSET), INITIAL_OFFSET);
  assert.ok(Math.abs(back.x - p.x) < 1e-12 && Math.abs(back.y - p.y) < 1e-12);
  assert.deepEqual(clampOffset({ x: -1, y: 5 }), { x: 0, y: 0.9 - 9 / 16 });
  assert.deepEqual(panOffset({ x: 0, y: 0 }, "left"), { x: 0, y: 0 });
});

test("following the guidance in the demo reaches Capture This!", () => {
  const engine = new PhotoAnalysisEngine();
  let offset = INITIAL_OFFSET;
  // The user taps the tree once; the tap is stored in world space so it pans with the scene.
  const tapWorld = frameToWorld(worldToFrame(DEMO_TREE_WORLD, offset), offset);
  let result = analyzeScene("golden", offset, worldToFrame(tapWorld, offset), engine, 0);
  assert.equal(result.guidance.id, "move-subject");
  const firstMessage = result.guidance.message;
  assert.match(firstMessage, /^(Pan|Tilt) /);

  let steps = 0;
  while (!result.guidance.ready && steps < 40) {
    const move = result.composition.cameraMove;
    const dir = move.horizontal ?? (move.vertical === "up" ? "up" : "down");
    offset = panOffset(offset, dir);
    steps++;
    result = analyzeScene("golden", offset, worldToFrame(tapWorld, offset), engine, steps * 500);
  }
  assert.equal(result.guidance.ready, true, `not ready after ${steps} pans`);
  assert.match(result.guidance.message, /Capture This!$/);
  assert.equal(result.composition.status, "aligned");
});

test("a marked point outside the view returns unknown", () => {
  // Unclamped offset that places the tree left of the view.
  const far = worldToFrame(DEMO_TREE_WORLD, { x: 1.0, y: 0 });
  assert.ok(far.x < 0);
  assert.deepEqual(analyzeComposition(far), { status: "unknown", reason: "invalid-subject" });
});

// ---------- observations ----------

test("observations report measurements without quality verdicts", () => {
  const r = analyzeScene("golden", INITIAL_OFFSET, { x: 0.6, y: 0.4 });
  const all = [...lightingObservations(r.lighting), ...compositionObservations(r.composition)];
  for (const o of all) {
    assert.ok(o.label && o.value);
    assert.doesNotMatch(o.value, /\b(great|beautiful|perfect|stunning|good|bad|score|confidence)\b/i);
  }
  assert.equal(lightingObservations(r.lighting)[0].value, "No exposure flags");
  assert.match(compositionObservations({ status: "unknown", reason: "no-subject" })[0].value, /Unknown/);
});
