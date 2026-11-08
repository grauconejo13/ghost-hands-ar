/**
 * The one path from RGBA pixels to guidance, shared by the live camera, the
 * demo scene and the tests. All analysis logic lives in src/vision.
 */
import type { Point } from "../vision/CompositionAnalyzer.ts";
import { rgbaToGray } from "../vision/LightingAnalyzer.ts";
import type { PhotoAnalysis, PhotoAnalysisEngine } from "../vision/PhotoAnalysisEngine.ts";

/** Frames are downsampled to this width before analysis. */
export const ANALYSIS_WIDTH = 64;

/** Analysis height that preserves the source aspect ratio. */
export function analysisHeight(mediaW: number, mediaH: number): number {
  if (!(mediaW > 0 && mediaH > 0)) return Math.round((ANALYSIS_WIDTH * 9) / 16);
  return Math.max(1, Math.round((ANALYSIS_WIDTH * mediaH) / mediaW));
}

export function analyzeRgba(
  engine: PhotoAnalysisEngine,
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  timestampMs: number,
  subject: Point | null,
  force = false,
): PhotoAnalysis {
  return engine.analyze(rgbaToGray(rgba, width, height, timestampMs), subject, force);
}
