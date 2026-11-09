import test from "node:test";
import assert from "node:assert/strict";
import { TapAnchor, frameSignature, signatureDrift } from "../src/web/tapAnchor.ts";

// A textured 64x36 frame; `shift` pans the content horizontally, `gain` mimics auto-exposure.
const W = 64, H = 36;
function scene({ shift = 0, gain = 0, noise = 0, seed = 1, ts = 0 } = {}) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const pixels = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x + shift;
      const base = 120 + 70 * Math.sin(u / 5) * Math.cos(y / 4) + (u > 40 && u < 52 && y > 8 && y < 28 ? 60 : 0);
      pixels[y * W + x] = Math.max(0, Math.min(255, Math.round(base + gain + (rnd() - 0.5) * noise)));
    }
  }
  return { timestampMs: ts, width: W, height: H, pixels };
}
const TAP = { x: 0.72, y: 0.5 };

test("signature is a coarse, mean-removed grid that keeps the aspect ratio", () => {
  const sig = frameSignature(scene());
  assert.equal(sig.cols, 16);
  assert.equal(sig.rows, 9);
  const mean = sig.cells.reduce((a, b) => a + b, 0) / sig.cells.length;
  assert.ok(Math.abs(mean) < 1e-6);
});

test("an exposure shift alone is not camera motion", () => {
  const d = signatureDrift(frameSignature(scene()), frameSignature(scene({ gain: 25 })), TAP);
  assert.ok(d.global < 0.01 && d.local < 0.01, JSON.stringify(d));
});

test("incompatible frames count as total change", () => {
  const other = { timestampMs: 0, width: 36, height: 64, pixels: new Uint8Array(36 * 64) };
  assert.deepEqual(signatureDrift(frameSignature(scene()), frameSignature(other)), { global: 1, local: 1 });
});

test("a held camera keeps the tap: sensor noise and a pixel of shake", () => {
  const a = new TapAnchor();
  a.set(TAP, scene());
  for (let i = 1; i <= 10; i++) {
    const st = a.update(scene({ shift: i % 2, noise: 8, seed: i, ts: i * 400 }));
    assert.equal(st.status, "fresh", `dropped at frame ${i}: ${JSON.stringify(st.drift)}`);
    assert.deepEqual(st.point, TAP);
  }
});

test("panning the camera makes the tap stale, and it stays stale", () => {
  const a = new TapAnchor();
  a.set(TAP, scene());
  assert.equal(a.update(scene({ shift: 8, ts: 400 })).status, "fresh"); // one frame is not enough
  const st = a.update(scene({ shift: 10, ts: 800 }));
  assert.equal(st.status, "stale");
  assert.equal(st.reason, "moved");
  // Even if the view comes back, the old coordinate is not revived.
  assert.equal(a.update(scene({ ts: 1200 })).status, "stale");
  assert.equal(a.state.status, "stale");
});

test("a single blip (a hand passing) does not drop the tap", () => {
  const a = new TapAnchor();
  a.set(TAP, scene());
  assert.equal(a.update(scene({ shift: 12, ts: 400 })).status, "fresh");
  assert.equal(a.update(scene({ ts: 800 })).status, "fresh");
  assert.equal(a.update(scene({ shift: 12, ts: 1200 })).status, "fresh");
});

test("an old tap expires even when no motion was measured", () => {
  const a = new TapAnchor({ maxAgeMs: 5000 });
  a.set(TAP, scene());
  assert.equal(a.update(scene({ ts: 4900 })).status, "fresh");
  const st = a.update(scene({ ts: 5000 }));
  assert.equal(st.status, "stale");
  assert.equal(st.reason, "expired");
});

test("re-tapping is the explicit fallback: a new tap is fresh again", () => {
  const a = new TapAnchor();
  a.set(TAP, scene());
  a.update(scene({ shift: 10, ts: 400 }));
  a.update(scene({ shift: 10, ts: 800 }));
  assert.equal(a.state.status, "stale");
  a.set({ x: 0.3, y: 0.4 }, scene({ shift: 10, ts: 900 }));
  const st = a.update(scene({ shift: 10, ts: 1300 }));
  assert.equal(st.status, "fresh");
  assert.deepEqual(st.point, { x: 0.3, y: 0.4 });
});

test("clear() returns to no tap at all", () => {
  const a = new TapAnchor();
  assert.equal(a.state.status, "none");
  a.set(TAP, scene());
  a.clear();
  assert.equal(a.update(scene({ ts: 400 })).status, "none");
});
