/**
 * Deterministic synthetic landscape for Try Demo. It is wider and taller than
 * the 16:9 view, so the user can "pan" a virtual camera across it and act on
 * the guidance without a real camera. Pure: no DOM, no randomness.
 *
 * World units: view width = 1. Frame coordinates follow CompositionAnalyzer
 * (x right, y down, 0-1 within the view).
 */
import type { Point } from "../vision/CompositionAnalyzer.ts";

export type DemoSceneId = "golden" | "dusk" | "overexposed" | "fog";

export const DEMO_SCENES: readonly Readonly<{ id: DemoSceneId; label: string }>[] = [
  { id: "golden", label: "Evening light" },
  { id: "dusk", label: "Underexposed" },
  { id: "overexposed", label: "Overexposed" },
  { id: "fog", label: "Fog" },
];

export const VIEW_W = 1;
export const VIEW_H = 9 / 16;
export const WORLD_W = 2.2;
export const WORLD_H = 0.9;
export const PAN_STEP = 0.03;
export const INITIAL_OFFSET: Point = { x: 0.4, y: 0.12 };

/**
 * Where the tree is drawn, in world units. Used by tests to simulate a user
 * tapping the tree. The app never reads it: there is no subject detection.
 */
export const DEMO_TREE_WORLD: Point = { x: 0.9, y: 0.42 };

export type PanDirection = "left" | "right" | "up" | "down";

export function clampOffset(o: Point): Point {
  return {
    x: Math.min(WORLD_W - VIEW_W, Math.max(0, o.x)),
    y: Math.min(WORLD_H - VIEW_H, Math.max(0, o.y)),
  };
}

/** Pan the virtual camera: "left" moves the view left, so content shifts right. */
export function panOffset(o: Point, direction: PanDirection, step = PAN_STEP): Point {
  const dx = direction === "left" ? -step : direction === "right" ? step : 0;
  const dy = direction === "up" ? -step : direction === "down" ? step : 0;
  return clampOffset({ x: o.x + dx, y: o.y + dy });
}

export function frameToWorld(p: Point, offset: Point): Point {
  return { x: offset.x + p.x * VIEW_W, y: offset.y + p.y * VIEW_H };
}

/** May fall outside 0-1 when the point has been panned out of view. */
export function worldToFrame(w: Point, offset: Point): Point {
  return { x: (w.x - offset.x) / VIEW_W, y: (w.y - offset.y) / VIEW_H };
}

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t,
];

const SKY_TOP: RGB = [46, 72, 110];
const SKY_LOW: RGB = [226, 168, 118];
const SUN: RGB = [255, 240, 205];
const HILL: RGB = [70, 66, 70];
const GROUND_NEAR: RGB = [92, 84, 60];
const GROUND_FAR: RGB = [30, 30, 26];
const TREE: RGB = [18, 22, 20];
const SUN_C: Point = { x: 1.38, y: 0.3 };

function horizon(wx: number): number {
  return 0.55 + 0.03 * Math.sin(wx * 7) + 0.015 * Math.sin(wx * 19 + 1);
}
function hillLine(wx: number): number {
  return 0.5 + 0.05 * Math.sin(wx * 3.3 + 0.4);
}

function tone(id: DemoSceneId, v: number): number {
  switch (id) {
    case "golden": return v;
    case "dusk": return v * 0.2 + 2;
    case "overexposed": return 255 - (255 - v) * 0.18;
    case "fog": return 150 + (v - 150) * 0.18;
  }
}

/** RGBA pixels of the current view at the requested resolution. */
export function renderDemoScene(
  id: DemoSceneId,
  width: number,
  height: number,
  offset: Point,
): Uint8ClampedArray<ArrayBuffer> {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid demo render size");
  }
  const out = new Uint8ClampedArray(width * height * 4);
  const t = DEMO_TREE_WORLD;
  for (let px = 0; px < width; px++) {
    const wx = offset.x + ((px + 0.5) / width) * VIEW_W;
    const h = horizon(wx);
    const hill = hillLine(wx);
    for (let py = 0; py < height; py++) {
      const wy = offset.y + ((py + 0.5) / height) * VIEW_H;
      let c: RGB;
      if (wy < hill) {
        c = mix(SKY_TOP, SKY_LOW, Math.min(1, Math.max(0, wy / 0.55)));
        const d = Math.hypot(wx - SUN_C.x, wy - SUN_C.y);
        if (d < 0.035) c = SUN;
        else if (d < 0.16) c = mix(SUN, c, (d - 0.035) / 0.125);
      } else if (wy < h) {
        c = HILL;
      } else {
        c = mix(GROUND_NEAR, GROUND_FAR, Math.min(1, (wy - h) / (WORLD_H - h)));
      }
      // Lone tree: canopy circle and trunk.
      const inCanopy = Math.hypot(wx - t.x, (wy - (t.y - 0.02)) * 1.1) < 0.055;
      const inTrunk = Math.abs(wx - t.x) < 0.007 && wy > t.y && wy < h + 0.01;
      if (inCanopy || inTrunk) c = TREE;
      const i = (py * width + px) * 4;
      out[i] = tone(id, c[0]);
      out[i + 1] = tone(id, c[1]);
      out[i + 2] = tone(id, c[2]);
      out[i + 3] = 255;
    }
  }
  return out;
}
