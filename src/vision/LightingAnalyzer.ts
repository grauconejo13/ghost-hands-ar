/**
 * Luminance statistics for a grayscale frame.
 *
 * Inputs are 8-bit display-encoded (gamma) values as produced by a camera or
 * canvas, not calibrated scene light. Results describe the rendered pixels,
 * not lighting quality or photographic merit.
 */
import type { GrayFrame } from "./FrameMemory.ts";

export type LightingCondition =
  | "dark"
  | "bright"
  | "low-contrast"
  | "high-contrast"
  | "balanced";

export type LightingOptions = Readonly<{
  /** Pixel value at or below which a pixel counts as shadow (0-255). */
  shadowLevel?: number;
  /** Pixel value at or above which a pixel counts as highlight (0-255). */
  highlightLevel?: number;
  /** Mean luminance (0-1) below which the frame is "dark". */
  darkMean?: number;
  /** Mean luminance (0-1) above which the frame is "bright". */
  brightMean?: number;
  /** Fraction of shadow or highlight pixels that alone marks dark/bright. */
  clipFraction?: number;
  /** RMS contrast (0-1) below which the frame is "low-contrast". */
  lowContrast?: number;
  /** Minimum shadow AND highlight fractions for "high-contrast". */
  highContrastFraction?: number;
}>;

export type LightingResult = Readonly<{
  pixelCount: number;
  /** Mean pixel value normalised to 0-1. */
  meanLuminance: number;
  /** Fraction of pixels at or above highlightLevel. */
  highlightFraction: number;
  /** Fraction of pixels at or below shadowLevel. */
  shadowFraction: number;
  /** Standard deviation of normalised luminance (RMS contrast), 0-0.5. */
  rmsContrast: number;
  /** 95th minus 5th percentile, normalised 0-1. Robust to a few outliers. */
  percentileRange: number;
  condition: LightingCondition;
}>;

const DEFAULTS: Required<LightingOptions> = {
  shadowLevel: 32,
  highlightLevel: 224,
  darkMean: 0.25,
  brightMean: 0.75,
  clipFraction: 0.5,
  lowContrast: 0.08,
  highContrastFraction: 0.2,
};

/** Rec. 709 luma from interleaved RGBA bytes (e.g. canvas ImageData). */
export function rgbaToGray(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  timestampMs = 0,
): GrayFrame {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 ||
    rgba.length !== width * height * 4) {
    throw new Error("Invalid RGBA buffer dimensions");
  }
  const pixels = new Uint8Array(width * height);
  for (let i = 0, p = 0; p < pixels.length; i += 4, p++) {
    pixels[p] = Math.round(0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]);
  }
  return { timestampMs, width, height, pixels };
}

export function analyzeLighting(frame: GrayFrame, options: LightingOptions = {}): LightingResult {
  const o = { ...DEFAULTS, ...options };
  const n = frame.width * frame.height;
  if (!Number.isInteger(frame.width) || !Number.isInteger(frame.height) || n <= 0 ||
    frame.pixels.length !== n) {
    throw new Error("Invalid gray frame dimensions");
  }
  if (o.shadowLevel < 0 || o.highlightLevel > 255 || o.shadowLevel >= o.highlightLevel) {
    throw new Error("Invalid shadow/highlight levels");
  }

  const histogram = new Uint32Array(256);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = frame.pixels[i];
    histogram[v]++;
    sum += v;
  }
  const mean = sum / n;
  let variance = 0;
  let shadows = 0;
  let highlights = 0;
  for (let v = 0; v < 256; v++) {
    const count = histogram[v];
    if (count === 0) continue;
    variance += count * (v - mean) * (v - mean);
    if (v <= o.shadowLevel) shadows += count;
    if (v >= o.highlightLevel) highlights += count;
  }

  const meanLuminance = mean / 255;
  const rmsContrast = Math.sqrt(variance / n) / 255;
  const shadowFraction = shadows / n;
  const highlightFraction = highlights / n;
  const percentileRange = (percentile(histogram, n, 0.95) - percentile(histogram, n, 0.05)) / 255;

  let condition: LightingCondition;
  // Order matters: a frame with large shadow AND highlight areas is reported as
  // high-contrast rather than dark/bright unless its mean is already extreme.
  if (meanLuminance < o.darkMean) {
    condition = "dark";
  } else if (meanLuminance > o.brightMean) {
    condition = "bright";
  } else if (shadowFraction >= o.highContrastFraction && highlightFraction >= o.highContrastFraction) {
    condition = "high-contrast";
  } else if (shadowFraction >= o.clipFraction) {
    condition = "dark";
  } else if (highlightFraction >= o.clipFraction) {
    condition = "bright";
  } else if (rmsContrast < o.lowContrast) {
    condition = "low-contrast";
  } else {
    condition = "balanced";
  }

  return {
    pixelCount: n,
    meanLuminance,
    highlightFraction,
    shadowFraction,
    rmsContrast,
    percentileRange,
    condition,
  };
}

/** Smallest pixel value whose cumulative share reaches q. */
function percentile(histogram: Uint32Array, n: number, q: number): number {
  const target = q * n;
  let cumulative = 0;
  for (let v = 0; v < 256; v++) {
    cumulative += histogram[v];
    if (cumulative >= target) return v;
  }
  return 255;
}
