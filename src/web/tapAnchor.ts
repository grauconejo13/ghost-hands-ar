/**
 * A tapped subject point on the live camera is a snapshot, not a track: it
 * marks one spot in the frame at the moment of the tap. Nothing here follows
 * the subject. TapAnchor only decides when that snapshot can no longer be
 * trusted (the view has changed since the tap, or it is simply old), so the
 * caller can drop the point and ask for a fresh tap instead of repeating a
 * direction computed from a stale coordinate.
 */
import type { Point } from "../vision/CompositionAnalyzer.ts";
import type { GrayFrame } from "../vision/FrameMemory.ts";

/** Coarse, mean-removed block averages of a frame (values in -1..1). */
export type Signature = Readonly<{ cols: number; rows: number; cells: Float32Array }>;

export const SIGNATURE_COLS = 16;

/**
 * Block-average the frame to a coarse grid and remove the overall mean.
 * The coarse grid ignores a pixel or two of hand shake; removing the mean
 * keeps an auto-exposure brightness shift from reading as camera motion.
 */
export function frameSignature(frame: GrayFrame, cols = SIGNATURE_COLS): Signature {
  const { width, height, pixels } = frame;
  if (!(width > 0 && height > 0) || pixels.length !== width * height) throw new Error("Invalid frame");
  const c = Math.max(1, Math.min(cols, width));
  const r = Math.max(1, Math.min(height, Math.round((c * height) / width)));
  const sums = new Float64Array(c * r);
  const counts = new Uint32Array(c * r);
  for (let y = 0; y < height; y++) {
    const by = Math.min(r - 1, Math.floor((y * r) / height));
    for (let x = 0; x < width; x++) {
      const i = by * c + Math.min(c - 1, Math.floor((x * c) / width));
      sums[i] += pixels[y * width + x];
      counts[i]++;
    }
  }
  const cells = new Float32Array(c * r);
  let mean = 0;
  for (let i = 0; i < cells.length; i++) { cells[i] = sums[i] / (counts[i] * 255); mean += cells[i]; }
  mean /= cells.length;
  for (let i = 0; i < cells.length; i++) cells[i] -= mean;
  return { cols: c, rows: r, cells };
}

export type Drift = Readonly<{ global: number; local: number }>;

/**
 * Mean absolute difference between two signatures over the whole frame and
 * over the 3x3 block neighbourhood around `at`. Incompatible grids (e.g. a
 * camera switch changed the aspect ratio) count as total change.
 */
export function signatureDrift(a: Signature, b: Signature, at: Point | null = null): Drift {
  if (a.cols !== b.cols || a.rows !== b.rows) return { global: 1, local: 1 };
  let total = 0;
  for (let i = 0; i < a.cells.length; i++) total += Math.abs(a.cells[i] - b.cells[i]);
  const global = total / a.cells.length;
  if (at === null) return { global, local: global };
  const cx = Math.min(a.cols - 1, Math.max(0, Math.floor(at.x * a.cols)));
  const cy = Math.min(a.rows - 1, Math.max(0, Math.floor(at.y * a.rows)));
  let localTotal = 0;
  let n = 0;
  for (let y = Math.max(0, cy - 1); y <= Math.min(a.rows - 1, cy + 1); y++) {
    for (let x = Math.max(0, cx - 1); x <= Math.min(a.cols - 1, cx + 1); x++) {
      localTotal += Math.abs(a.cells[y * a.cols + x] - b.cells[y * a.cols + x]);
      n++;
    }
  }
  return { global, local: localTotal / n };
}

export type TapAnchorOptions = Readonly<{
  /** Drift (global or around the tap) above which a frame counts as "moved". */
  threshold?: number;
  /** Consecutive moved frames required, so one blip (a hand, a focus hunt) is ignored. */
  confirmFrames?: number;
  /** Age after which a tap is treated as stale even if no motion was measured. */
  maxAgeMs?: number;
}>;

export type StaleReason = "moved" | "expired";
export type TapState =
  | Readonly<{ status: "none" }>
  | Readonly<{ status: "fresh"; point: Point; drift: Drift }>
  | Readonly<{ status: "stale"; reason: StaleReason; drift: Drift }>;

export class TapAnchor {
  private point: Point | null = null;
  private reference: Signature | null = null;
  private tappedAt = 0;
  private movedCount = 0;
  private staleReason: StaleReason | null = null;
  private lastDrift: Drift = { global: 0, local: 0 };
  private readonly threshold: number;
  private readonly confirmFrames: number;
  private readonly maxAgeMs: number;

  constructor(options: TapAnchorOptions = {}) {
    this.threshold = options.threshold ?? 0.05;
    this.confirmFrames = options.confirmFrames ?? 2;
    this.maxAgeMs = options.maxAgeMs ?? 15000;
  }

  /** Record a tap against the frame the user was looking at. */
  set(point: Point, frame: GrayFrame): void {
    this.point = point;
    this.reference = frameSignature(frame);
    this.tappedAt = frame.timestampMs;
    this.movedCount = 0;
    this.staleReason = null;
    this.lastDrift = { global: 0, local: 0 };
  }

  clear(): void {
    this.point = null;
    this.reference = null;
    this.movedCount = 0;
    this.staleReason = null;
  }

  /** Current state without consuming a frame. */
  get state(): TapState {
    if (this.staleReason !== null) return { status: "stale", reason: this.staleReason, drift: this.lastDrift };
    if (this.point === null) return { status: "none" };
    return { status: "fresh", point: this.point, drift: this.lastDrift };
  }

  /** Compare a new frame with the tap-time frame. Once stale, a tap stays stale until set() or clear(). */
  update(frame: GrayFrame): TapState {
    if (this.point === null || this.reference === null || this.staleReason !== null) return this.state;
    this.lastDrift = signatureDrift(this.reference, frameSignature(frame), this.point);
    const moved = Math.max(this.lastDrift.global, this.lastDrift.local) > this.threshold;
    this.movedCount = moved ? this.movedCount + 1 : 0;
    if (this.movedCount >= this.confirmFrames) this.expire("moved");
    else if (frame.timestampMs - this.tappedAt >= this.maxAgeMs) this.expire("expired");
    return this.state;
  }

  private expire(reason: StaleReason): void {
    this.staleReason = reason;
    this.point = null;
    this.reference = null;
  }
}
