/**
 * Rule-of-thirds geometry for a subject position that is already known.
 *
 * This module does NOT detect subjects. Callers must supply a subject point
 * from a real source (user tap, verified tracker). Without one the result is
 * an explicit "unknown" status.
 *
 * Coordinates are normalised frame coordinates: x 0 = left, 1 = right;
 * y 0 = top, 1 = bottom.
 */

export type Point = Readonly<{ x: number; y: number }>;

export type IntersectionId = "upper-left" | "upper-right" | "lower-left" | "lower-right";

export type Intersection = Readonly<{ id: IntersectionId; x: number; y: number }>;

export const THIRDS_INTERSECTIONS: readonly Intersection[] = Object.freeze([
  { id: "upper-left", x: 1 / 3, y: 1 / 3 },
  { id: "upper-right", x: 2 / 3, y: 1 / 3 },
  { id: "lower-left", x: 1 / 3, y: 2 / 3 },
  { id: "lower-right", x: 2 / 3, y: 2 / 3 },
]);

export type Horizontal = "left" | "right" | null;
export type Vertical = "up" | "down" | null;

export type CompositionOptions = Readonly<{
  /** Distance (normalised) at or under which the subject counts as aligned. */
  alignedRadius?: number;
  /** Per-axis offset under which no move on that axis is suggested. */
  axisDeadband?: number;
  /** Previously chosen target; kept unless another is closer by `hysteresis`. */
  previousTarget?: IntersectionId;
  /** Distance margin required before switching away from previousTarget. */
  hysteresis?: number;
}>;

export type CompositionUnknown = Readonly<{
  status: "unknown";
  reason: "no-subject" | "invalid-subject";
}>;

export type CompositionKnown = Readonly<{
  status: "aligned" | "off-target";
  subject: Point;
  target: Intersection;
  /** Euclidean distance from subject to target, normalised units. */
  distance: number;
  /** target minus subject. */
  dx: number;
  dy: number;
  /** Direction the subject must move within the frame. */
  subjectMove: Readonly<{ horizontal: Horizontal; vertical: Vertical }>;
  /** Equivalent camera move (opposite of subjectMove): pan left/right, tilt up/down. */
  cameraMove: Readonly<{ horizontal: Horizontal; vertical: Vertical }>;
}>;

export type CompositionResult = CompositionUnknown | CompositionKnown;

const DEFAULTS = {
  alignedRadius: 0.05,
  axisDeadband: 0.025,
  hysteresis: 0.04,
};
const TIE_EPSILON = 1e-9;

export function analyzeComposition(
  subject: Point | null | undefined,
  options: CompositionOptions = {},
): CompositionResult {
  if (subject === null || subject === undefined) {
    return { status: "unknown", reason: "no-subject" };
  }
  if (!Number.isFinite(subject.x) || !Number.isFinite(subject.y) ||
    subject.x < 0 || subject.x > 1 || subject.y < 0 || subject.y > 1) {
    return { status: "unknown", reason: "invalid-subject" };
  }
  const alignedRadius = options.alignedRadius ?? DEFAULTS.alignedRadius;
  const axisDeadband = options.axisDeadband ?? DEFAULTS.axisDeadband;
  const hysteresis = options.hysteresis ?? DEFAULTS.hysteresis;

  const ranked = THIRDS_INTERSECTIONS
    .map((target) => ({ target, distance: Math.hypot(target.x - subject.x, target.y - subject.y) }))
    // Near-equal distances (float noise) tie-break by declaration order via stable sort.
    .sort((a, b) => (Math.abs(a.distance - b.distance) < TIE_EPSILON ? 0 : a.distance - b.distance));
  let chosen = ranked[0];
  if (options.previousTarget !== undefined) {
    const previous = ranked.find((r) => r.target.id === options.previousTarget);
    if (previous !== undefined && previous.distance - chosen.distance < hysteresis) {
      chosen = previous;
    }
  }

  const dx = chosen.target.x - subject.x;
  const dy = chosen.target.y - subject.y;
  const horizontal: Horizontal = Math.abs(dx) < axisDeadband ? null : dx > 0 ? "right" : "left";
  const vertical: Vertical = Math.abs(dy) < axisDeadband ? null : dy > 0 ? "down" : "up";
  const aligned = chosen.distance <= alignedRadius;

  return {
    status: aligned ? "aligned" : "off-target",
    subject: { x: subject.x, y: subject.y },
    target: chosen.target,
    distance: chosen.distance,
    dx,
    dy,
    subjectMove: aligned ? { horizontal: null, vertical: null } : { horizontal, vertical },
    cameraMove: aligned ? { horizontal: null, vertical: null } : {
      horizontal: horizontal === null ? null : horizontal === "right" ? "left" : "right",
      vertical: vertical === null ? null : vertical === "down" ? "up" : "down",
    },
  };
}
