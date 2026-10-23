import test from "node:test";
import assert from "node:assert/strict";
import { FrameMemory } from "../src/vision/FrameMemory.ts";

const frame = (timestampMs, n = 10) => ({
  timestampMs, width: 2, height: 2, pixels: new Uint8Array([n, n, n, n]),
});

test("accepts first frame and discards a repeated frame", () => {
  const m = new FrameMemory();
  assert.equal(m.observe(frame(0)).reason, "first");
  assert.equal(m.observe(frame(1000)).reason, "duplicate");
  assert.equal(m.snapshot().length, 1);
});

test("rate limits frames until the sampling interval", () => {
  const m = new FrameMemory();
  m.observe(frame(0));
  assert.equal(m.observe(frame(500, 255)).reason, "rate-limited");
  assert.equal(m.observe(frame(1000, 255)).reason, "changed");
});

test("accepts substantial visual changes", () => {
  const m = new FrameMemory();
  m.observe(frame(0));
  const decision = m.observe(frame(1000, 240));
  assert.equal(decision.accepted, true);
  assert.equal(decision.reason, "changed");
  assert.ok(decision.changeScore > 0.8);
});

test("heartbeat retains an unchanged sample occasionally", () => {
  const m = new FrameMemory({ heartbeatMs: 3000 });
  m.observe(frame(0));
  m.observe(frame(1000));
  assert.equal(m.observe(frame(3000)).reason, "heartbeat");
});

test("force capture bypasses sampling and change filters", () => {
  const m = new FrameMemory();
  m.observe(frame(0));
  assert.equal(m.observe(frame(100, 10), true).accepted, true);
});

test("enforces both count and retention limits", () => {
  const m = new FrameMemory({ maxFrames: 2, maxAgeMs: 2100, changeThreshold: 0 });
  m.observe(frame(0, 1));
  m.observe(frame(1000, 2));
  m.observe(frame(2000, 3));
  assert.equal(m.snapshot().length, 2);
  assert.equal(m.snapshot(4000).length, 1);
});

test("rejects invalid frame data and timestamp regression", () => {
  const m = new FrameMemory();
  assert.throws(() => m.observe({ timestampMs: 0, width: 2, height: 2, pixels: new Uint8Array(3) }));
  m.observe(frame(1000));
  assert.throws(() => m.observe(frame(900)));
});

test("returns defensive copies and clears memory on end session", () => {
  const m = new FrameMemory();
  const original = frame(0, 100);
  m.observe(original);
  original.pixels[0] = 0;
  const records = m.snapshot();
  assert.equal(records[0].thumbnail[0], 100);
  records[0].thumbnail[0] = 0;
  assert.equal(m.snapshot()[0].thumbnail[0], 100);
  m.clear();
  assert.equal(m.snapshot().length, 0);
});
