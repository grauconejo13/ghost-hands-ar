import test from "node:test";
import assert from "node:assert/strict";
import {
  directorCue, displayHeadline, cuePlacement, CueStabilizer, CAPTURE_HEADLINE, READY_UPGRADE_MS,
} from "../src/web/director.ts";
import { analyzeComposition } from "../src/vision/CompositionAnalyzer.ts";
import { analyzeLighting } from "../src/vision/LightingAnalyzer.ts";
import { generateGuidance } from "../src/vision/GuidanceEngine.ts";
import { PhotoAnalysisEngine } from "../src/vision/PhotoAnalysisEngine.ts";
import { analyzeRgba } from "../src/web/pipeline.ts";
import { renderDemoScene, worldToFrame, DEMO_TREE_WORLD, INITIAL_OFFSET } from "../src/web/demoScene.ts";

// Build a PhotoAnalysis-shaped value from the real analyzers.
const W = 16, H = 16;
const gradient = (lo, hi) => {
  const pixels = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pixels[y * W + x] = Math.round(lo + ((hi - lo) * x) / (W - 1));
  return { timestampMs: 0, width: W, height: H, pixels };
};
const BALANCED = analyzeLighting(gradient(20, 235));
const DARK = analyzeLighting(gradient(0, 40));
const analysisFor = (subject, lighting = BALANCED) => {
  const composition = analyzeComposition(subject);
  return { frame: { accepted: true, reason: "first", changeScore: 1 }, lighting, composition, guidance: generateGuidance({ lighting, composition }) };
};

// ---------- directorCue ----------

test("no analysis yet shows a neutral waiting cue", () => {
  const c = directorCue(null);
  assert.equal(c.kind, "waiting");
  assert.equal(c.ready, false);
  assert.equal(c.arrow, null);
});

test("unknown subject asks for a tap and never gives a direction or readiness", () => {
  const c = directorCue(analysisFor(null));
  assert.equal(c.headline, "Tap your subject");
  assert.equal(c.arrow, null);
  assert.equal(c.ready, false);
});

test("a marked point outside the frame reads as off frame, with no direction", () => {
  const c = directorCue(analysisFor({ x: -0.2, y: 0.5 }));
  assert.equal(c.headline, "You're off frame.");
  assert.equal(c.arrow, null);
  assert.equal(c.ready, false);
});

test("exposure problems take priority and keep the engine's advice", () => {
  const c = directorCue(analysisFor({ x: 2 / 3, y: 1 / 3 }, DARK));
  assert.equal(c.headline, "It's too dark.");
  assert.equal(c.detail, "Try more light or face toward the light source.");
  assert.equal(c.ready, false);
});

test("horizontal offset produces 'Look to the right →' from the engine's camera move", () => {
  // Subject right of the upper-right intersection -> camera should pan right.
  const a = analysisFor({ x: 0.85, y: 0.34 });
  assert.equal(a.composition.cameraMove.horizontal, "right");
  const c = directorCue(a);
  assert.equal(c.headline, "Look to the right →");
  assert.equal(c.spoken, "Look to the right");
  assert.equal(c.key, "move:right");
  assert.match(c.detail, /upper right third/);
});

test("vertical offset produces '↑ Look up.'", () => {
  // Subject above the upper-left intersection -> camera tilts up.
  const c = directorCue(analysisFor({ x: 0.34, y: 0.1 }));
  assert.equal(c.headline, "↑ Look up.");
  assert.equal(c.arrow, "up");
});

test("diagonal offset shows only the dominant axis", () => {
  const c = directorCue(analysisFor({ x: 0.05, y: 0.6 })); // mostly left of lower-left
  assert.equal(c.arrow, "left");
  assert.equal(c.headline, "← Look to the left");
});

test("aligned and balanced is Ready!, upgrading to the capture call after a hold", () => {
  const c = directorCue(analysisFor({ x: 2 / 3, y: 2 / 3 }));
  assert.equal(c.kind, "ready");
  assert.equal(c.ready, true);
  assert.equal(displayHeadline(c, 0), "Ready!");
  assert.equal(displayHeadline(c, READY_UPGRADE_MS), CAPTURE_HEADLINE);
  assert.equal(CAPTURE_HEADLINE, "Awesome! Capture this!");
  // Non-ready cues never upgrade.
  assert.equal(displayHeadline(directorCue(analysisFor(null)), 99999), "Tap your subject");
});

test("demo scene through the real pipeline: tap the tree, get a direction", () => {
  const engine = new PhotoAnalysisEngine();
  const w = 64, h = 36;
  const subject = worldToFrame(DEMO_TREE_WORLD, INITIAL_OFFSET);
  const a = analyzeRgba(engine, renderDemoScene("golden", w, h, INITIAL_OFFSET), w, h, 0, subject, true);
  const c = directorCue(a);
  assert.equal(c.kind, "move");
  assert.ok(["left", "right", "up", "down"].includes(c.arrow));
});

// ---------- placement ----------

test("cue card moves away from a subject in the middle band", () => {
  assert.equal(cuePlacement(null), "middle");
  assert.equal(cuePlacement({ x: 0.5, y: 0.2 }), "middle");
  assert.equal(cuePlacement({ x: 0.5, y: 0.9 }), "middle");
  assert.equal(cuePlacement({ x: 0.5, y: 0.55 }), "upper");
  assert.equal(cuePlacement({ x: 0.5, y: 0.4 }), "lower");
});

// ---------- stabiliser ----------

const right = directorCue(analysisFor({ x: 0.85, y: 0.34 }));
const up = directorCue(analysisFor({ x: 0.34, y: 0.1 }));
const ready = directorCue(analysisFor({ x: 2 / 3, y: 2 / 3 }));

test("first cue shows immediately", () => {
  const s = new CueStabilizer();
  assert.equal(s.update(right, 0).cue.key, "move:right");
});

test("alternating candidates do not flicker the displayed cue", () => {
  const s = new CueStabilizer();
  s.update(right, 0);
  for (let t = 400; t <= 4000; t += 400) {
    const shown = s.update(t % 800 === 0 ? up : right, t).cue;
    assert.equal(shown.key, "move:right", `flickered at ${t}`);
  }
});

test("a new cue replaces the old one after confirmation and minimum hold", () => {
  const s = new CueStabilizer({ confirmUpdates: 2, minHoldMs: 1000 });
  s.update(right, 0);
  assert.equal(s.update(ready, 400).cue.key, "move:right"); // 1st sighting
  assert.equal(s.update(ready, 800).cue.key, "move:right"); // confirmed, but held < 1000 ms
  assert.equal(s.update(ready, 1200).cue.key, "ready");
  assert.equal(s.update(ready, 1600).heldMs, 400);
});

test("leaving Ready also needs confirmation", () => {
  const s = new CueStabilizer();
  s.update(ready, 0);
  assert.equal(s.update(right, 1500).cue.key, "ready");
  assert.equal(s.update(right, 1900).cue.key, "move:right");
});

test("reset makes the next cue immediate (used after a tap)", () => {
  const s = new CueStabilizer();
  s.update(right, 0);
  s.reset();
  assert.equal(s.update(up, 10).cue.key, "move:up");
});
