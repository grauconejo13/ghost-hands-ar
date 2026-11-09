import test from "node:test";
import assert from "node:assert/strict";
import { analyzeLighting, rgbaToGray } from "../src/vision/LightingAnalyzer.ts";
import { analyzeComposition, THIRDS_INTERSECTIONS } from "../src/vision/CompositionAnalyzer.ts";
import { generateGuidance } from "../src/vision/GuidanceEngine.ts";
import { PhotoAnalysisEngine } from "../src/vision/PhotoAnalysisEngine.ts";

const W = 16;
const H = 16;
/** Deterministic synthetic frame: value = fn(x, y). */
const synth = (fn, timestampMs = 0) => {
  const pixels = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pixels[y * W + x] = fn(x, y);
  return { timestampMs, width: W, height: H, pixels };
};
const flat = (v, t) => synth(() => v, t);
/** Horizontal gradient from lo to hi. */
const gradient = (lo, hi, t) => synth((x) => Math.round(lo + ((hi - lo) * x) / (W - 1)), t);

// ---------- LightingAnalyzer ----------

test("dark synthetic image is classified dark", () => {
  const r = analyzeLighting(gradient(0, 40));
  assert.equal(r.condition, "dark");
  assert.ok(r.meanLuminance < 0.1);
  assert.ok(r.shadowFraction > 0.7);
  assert.equal(r.highlightFraction, 0);
});

test("bright synthetic image is classified bright", () => {
  const r = analyzeLighting(gradient(215, 255));
  assert.equal(r.condition, "bright");
  assert.ok(r.meanLuminance > 0.9);
  assert.ok(r.highlightFraction > 0.7);
  assert.equal(r.shadowFraction, 0);
});

test("flat mid-gray image is low-contrast with exact statistics", () => {
  const r = analyzeLighting(flat(128));
  assert.equal(r.condition, "low-contrast");
  assert.equal(r.meanLuminance, 128 / 255);
  assert.equal(r.rmsContrast, 0);
  assert.equal(r.percentileRange, 0);
  assert.equal(r.shadowFraction, 0);
  assert.equal(r.highlightFraction, 0);
});

test("full-range gradient is balanced", () => {
  const r = analyzeLighting(gradient(20, 235));
  assert.equal(r.condition, "balanced");
  assert.ok(Math.abs(r.meanLuminance - 0.5) < 0.02);
  assert.ok(r.rmsContrast > 0.2);
  assert.ok(r.percentileRange > 0.7);
});

test("half black / half white image is high-contrast", () => {
  const r = analyzeLighting(synth((x) => (x < W / 2 ? 0 : 255)));
  assert.equal(r.condition, "high-contrast");
  assert.equal(r.shadowFraction, 0.5);
  assert.equal(r.highlightFraction, 0.5);
  assert.equal(r.rmsContrast, 0.5);
});

test("shadow and highlight thresholds are inclusive and configurable", () => {
  const r = analyzeLighting(synth((x) => (x < W / 2 ? 50 : 200)), { shadowLevel: 50, highlightLevel: 200 });
  assert.equal(r.shadowFraction, 0.5);
  assert.equal(r.highlightFraction, 0.5);
});

test("rejects malformed frames and thresholds", () => {
  assert.throws(() => analyzeLighting({ timestampMs: 0, width: 2, height: 2, pixels: new Uint8Array(3) }));
  assert.throws(() => analyzeLighting(flat(1), { shadowLevel: 200, highlightLevel: 100 }));
});

test("rgbaToGray applies Rec. 709 weights", () => {
  const rgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
  const g = rgbaToGray(rgba, 2, 2, 5);
  assert.deepEqual([...g.pixels], [54, 182, 18, 255]);
  assert.equal(g.timestampMs, 5);
  assert.throws(() => rgbaToGray(rgba, 3, 2));
});

// ---------- CompositionAnalyzer ----------

test("exposes the four rule-of-thirds intersections", () => {
  assert.deepEqual(
    THIRDS_INTERSECTIONS.map((p) => [p.id, p.x, p.y]),
    [["upper-left", 1 / 3, 1 / 3], ["upper-right", 2 / 3, 1 / 3], ["lower-left", 1 / 3, 2 / 3], ["lower-right", 2 / 3, 2 / 3]],
  );
});

test("missing subject returns explicit unknown status", () => {
  assert.deepEqual(analyzeComposition(null), { status: "unknown", reason: "no-subject" });
  assert.deepEqual(analyzeComposition(undefined), { status: "unknown", reason: "no-subject" });
  assert.deepEqual(analyzeComposition({ x: 1.2, y: 0.5 }), { status: "unknown", reason: "invalid-subject" });
  assert.deepEqual(analyzeComposition({ x: Number.NaN, y: 0.5 }), { status: "unknown", reason: "invalid-subject" });
});

test("subject on an intersection is aligned with no move", () => {
  const r = analyzeComposition({ x: 0.67, y: 0.34 });
  assert.equal(r.status, "aligned");
  assert.equal(r.target.id, "upper-right");
  assert.ok(r.distance < 0.01);
  assert.deepEqual(r.cameraMove, { horizontal: null, vertical: null });
});

test("off-target subject gets nearest target, distance and directions", () => {
  // Subject low-left of the lower-left intersection.
  const r = analyzeComposition({ x: 0.2, y: 0.85 });
  assert.equal(r.status, "off-target");
  assert.equal(r.target.id, "lower-left");
  assert.ok(Math.abs(r.distance - Math.hypot(1 / 3 - 0.2, 2 / 3 - 0.85)) < 1e-12);
  // Subject must move right and up in the frame -> camera pans left, tilts down.
  assert.deepEqual(r.subjectMove, { horizontal: "right", vertical: "up" });
  assert.deepEqual(r.cameraMove, { horizontal: "left", vertical: "down" });
});

test("single-axis offset suggests only that axis", () => {
  const r = analyzeComposition({ x: 0.9, y: 2 / 3 });
  assert.equal(r.target.id, "lower-right");
  assert.deepEqual(r.subjectMove, { horizontal: "left", vertical: null });
  assert.deepEqual(r.cameraMove, { horizontal: "right", vertical: null });
});

test("exact centre ties resolve deterministically to upper-left", () => {
  assert.equal(analyzeComposition({ x: 0.5, y: 0.5 }).target.id, "upper-left");
});

test("hysteresis keeps the previous target near a boundary", () => {
  const nearBoundary = { x: 0.51, y: 0.3 }; // marginally closer to upper-right
  assert.equal(analyzeComposition(nearBoundary).target.id, "upper-right");
  assert.equal(analyzeComposition(nearBoundary, { previousTarget: "upper-left" }).target.id, "upper-left");
  // Far past the boundary the target switches anyway.
  assert.equal(analyzeComposition({ x: 0.7, y: 0.3 }, { previousTarget: "upper-left" }).target.id, "upper-right");
});

// ---------- GuidanceEngine ----------

const balanced = analyzeLighting(gradient(20, 235));

test("exposure warnings take priority over composition", () => {
  const g = generateGuidance({ lighting: analyzeLighting(flat(10)), composition: analyzeComposition({ x: 0.1, y: 0.1 }) });
  assert.equal(g.id, "too-dark");
  assert.equal(g.ready, false);
  assert.equal(generateGuidance({ lighting: analyzeLighting(flat(250)) }).id, "too-bright");
});

test("unknown subject never yields a framing claim", () => {
  const g = generateGuidance({ lighting: balanced, composition: analyzeComposition(null) });
  assert.equal(g.id, "subject-unknown");
  assert.equal(g.ready, false);
  assert.match(g.message, /unknown/i);
});

test("off-target produces one camera instruction", () => {
  const g = generateGuidance({ lighting: balanced, composition: analyzeComposition({ x: 0.2, y: 0.85 }) });
  assert.equal(g.id, "move-subject");
  assert.equal(g.message, "Pan left and tilt down to place the subject on the lower-left third.");
});

test("aligned and balanced is ready to capture", () => {
  const g = generateGuidance({ lighting: balanced, composition: analyzeComposition({ x: 2 / 3, y: 1 / 3 }) });
  assert.deepEqual(g, {
    id: "ready",
    message: "Subject is on the upper-right third. Capture This!",
    ready: true,
    basis: ["lighting", "composition"],
  });
});

test("aligned but low-contrast gives a contrast note instead of ready", () => {
  const g = generateGuidance({ lighting: analyzeLighting(flat(128)), composition: analyzeComposition({ x: 1 / 3, y: 2 / 3 }) });
  assert.equal(g.id, "low-contrast");
  assert.equal(g.ready, false);
});

test("guidance is deterministic, short, and makes no quality claims", () => {
  const inputs = [
    {}, { lighting: balanced }, { lighting: analyzeLighting(flat(128)) },
    { lighting: analyzeLighting(synth((x) => (x < 8 ? 0 : 255))) },
    { composition: analyzeComposition(null) }, { composition: analyzeComposition({ x: 0.5, y: 0.5 }) },
    { composition: analyzeComposition({ x: 0.66, y: 0.66 }) },
  ];
  for (const input of inputs) {
    const a = generateGuidance(input);
    assert.deepEqual(generateGuidance(input), a);
    assert.ok(a.message.length <= 80, a.message);
    assert.doesNotMatch(a.message, /\b(great|beautiful|perfect|stunning|good photo|best)\b/i);
  }
});

// ---------- PhotoAnalysisEngine (FrameMemory reuse) ----------

test("engine reuses lighting for rate-limited frames and resets cleanly", () => {
  const engine = new PhotoAnalysisEngine();
  const first = engine.analyze(gradient(20, 235, 0), { x: 2 / 3, y: 1 / 3 });
  assert.equal(first.frame.reason, "first");
  assert.equal(first.guidance.id, "ready");

  // A dark frame 100 ms later is rate-limited by FrameMemory: lighting is reused.
  const limited = engine.analyze(flat(5, 100), { x: 2 / 3, y: 1 / 3 });
  assert.equal(limited.frame.reason, "rate-limited");
  assert.equal(limited.lighting, first.lighting);

  // After the sampling interval the change is accepted and re-measured.
  const changed = engine.analyze(flat(5, 1000), null);
  assert.equal(changed.frame.reason, "changed");
  assert.equal(changed.lighting.condition, "dark");
  assert.equal(changed.composition.status, "unknown");
  assert.equal(changed.guidance.id, "too-dark");

  engine.reset();
  assert.equal(engine.analyze(flat(5, 0), null).frame.reason, "first");
});
