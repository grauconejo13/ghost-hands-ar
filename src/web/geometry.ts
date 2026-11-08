/** DOM-free layout helpers for the viewfinder. */
import type { Point } from "../vision/CompositionAnalyzer.ts";

export type Box = Readonly<{ left: number; top: number; width: number; height: number }>;

/**
 * Largest box with the media's aspect ratio that fits inside the container,
 * centred (CSS `object-fit: contain`). The grid overlay is sized to this box so
 * its thirds line up with the actual image, not the letterboxed stage.
 */
export function fitContain(containerW: number, containerH: number, mediaW: number, mediaH: number): Box {
  if (!(containerW > 0 && containerH > 0 && mediaW > 0 && mediaH > 0)) {
    return { left: 0, top: 0, width: Math.max(0, containerW), height: Math.max(0, containerH) };
  }
  const scale = Math.min(containerW / mediaW, containerH / mediaH);
  const width = mediaW * scale;
  const height = mediaH * scale;
  return { left: (containerW - width) / 2, top: (containerH - height) / 2, width, height };
}

/** Pointer position to normalised frame coordinates, or null when outside the box. */
export function clientToFrame(clientX: number, clientY: number, rect: Box): Point | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}
