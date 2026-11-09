/**
 * Turns a PhotoAnalysis (from src/vision) into the single large cue shown over
 * the viewfinder, and keeps that cue stable over time. This is presentation
 * only: every direction and every "ready" comes from CompositionAnalyzer and
 * GuidanceEngine. When the subject is unknown, no direction or readiness is
 * produced.
 */
import type { CompositionKnown, Point } from "../vision/CompositionAnalyzer.ts";
import type { PhotoAnalysis } from "../vision/PhotoAnalysisEngine.ts";

export type CueKind = "waiting" | "tap-subject" | "off-frame" | "lighting" | "move" | "ready";
export type Arrow = "left" | "right" | "up" | "down" | null;

export type DirectorCue = Readonly<{
  /** Identity used for stabilisation; detail text may change under the same key. */
  key: string;
  kind: CueKind;
  headline: string;
  /** Headline without arrow glyphs, for screen readers. */
  spoken: string;
  detail: string;
  arrow: Arrow;
  ready: boolean;
}>;

/** How long "Ready!" must hold before it becomes the capture call to action. */
export const READY_UPGRADE_MS = 1200;
export const CAPTURE_HEADLINE = "Awesome! Capture this!";

const MOVE_HEADLINES: Record<Exclude<Arrow, null>, [string, string]> = {
  right: ["Look to the right →", "Look to the right"],
  left: ["← Look to the left", "Look to the left"],
  up: ["↑ Look up.", "Look up"],
  down: ["↓ Look down.", "Look down"],
};

const thirdName = (c: CompositionKnown) => `${c.target.id.replace("-", " ")} third`;

/** Second sentence of a two-sentence engine message, or the whole message. */
function advice(message: string): string {
  const i = message.indexOf(". ");
  return i >= 0 ? message.slice(i + 2) : message;
}

function cue(key: string, kind: CueKind, headline: string, detail: string, extra: Partial<DirectorCue> = {}): DirectorCue {
  return { key, kind, headline, spoken: headline, detail, arrow: null, ready: false, ...extra };
}

export function directorCue(analysis: PhotoAnalysis | null): DirectorCue {
  if (analysis === null) return cue("waiting", "waiting", "Finding your frame…", "");
  const { guidance, composition } = analysis;

  switch (guidance.id) {
    case "too-dark":
      return cue("light:dark", "lighting", "It's too dark.", advice(guidance.message));
    case "too-bright":
      return cue("light:bright", "lighting", "Too bright here.", advice(guidance.message));
    case "high-contrast":
      return cue("light:harsh", "lighting", "Harsh light.", advice(guidance.message));
    case "low-contrast":
      return cue("light:flat", "lighting", "Flat light.", advice(guidance.message));
    case "no-data":
      return cue("waiting", "waiting", "Finding your frame…", "");
    default:
      break;
  }

  if (composition.status === "unknown") {
    return composition.reason === "invalid-subject"
      ? cue("off-frame", "off-frame", "You're off frame.", "Your subject left the frame. Look back, or tap it again.")
      : cue("tap-subject", "tap-subject", "Tap your subject", "Automatic subject detection isn't available yet.");
  }

  if (guidance.ready && composition.status === "aligned") {
    return cue("ready", "ready", "Ready!", `Subject is on the ${thirdName(composition)}.`, { ready: true });
  }

  // Off-target: show one direction at a time, the axis with the larger offset.
  const { horizontal, vertical } = composition.cameraMove;
  const preferHorizontal = Math.abs(composition.dx) >= Math.abs(composition.dy);
  const arrow: Arrow = (preferHorizontal ? horizontal ?? vertical : vertical ?? horizontal) ?? null;
  const detail = `Bring your subject to the ${thirdName(composition)}.`;
  if (arrow === null) return cue("move:nudge", "move", "Almost there.", detail);
  const [headline, spoken] = MOVE_HEADLINES[arrow];
  return cue(`move:${arrow}`, "move", headline, detail, { arrow, spoken });
}

/** Headline to display, upgrading a held "Ready!" to the capture call to action. */
export function displayHeadline(c: DirectorCue, heldMs: number): string {
  return c.ready && heldMs >= READY_UPGRADE_MS ? CAPTURE_HEADLINE : c.headline;
}

/** Where the cue card sits so it avoids a subject in the middle band. */
export type CuePlacement = "middle" | "upper" | "lower";
export function cuePlacement(subject: Point | null): CuePlacement {
  if (subject === null || subject.y < 0.3 || subject.y > 0.7) return "middle";
  return subject.y >= 0.5 ? "upper" : "lower";
}

export type StabilizerOptions = Readonly<{
  /** Consecutive updates a new cue must appear in before it is shown. */
  confirmUpdates?: number;
  /** Minimum time a shown cue stays before it can be replaced. */
  minHoldMs?: number;
}>;

export type StableCue = Readonly<{ cue: DirectorCue; heldMs: number }>;

/**
 * Debounces cue changes: a different cue must be seen in `confirmUpdates`
 * consecutive updates AND the current cue must have been visible for
 * `minHoldMs`. Same-key updates refresh detail text immediately.
 * Call reset() after a direct user action (tap, source change) so the
 * response is immediate.
 */
export class CueStabilizer {
  private current: DirectorCue | null = null;
  private shownAt = 0;
  private pendingKey: string | null = null;
  private pendingCount = 0;
  private readonly confirmUpdates: number;
  private readonly minHoldMs: number;

  constructor(options: StabilizerOptions = {}) {
    this.confirmUpdates = options.confirmUpdates ?? 2;
    this.minHoldMs = options.minHoldMs ?? 1000;
  }

  update(candidate: DirectorCue, nowMs: number): StableCue {
    if (this.current === null) {
      this.show(candidate, nowMs);
    } else if (candidate.key === this.current.key) {
      this.current = candidate;
      this.pendingKey = null;
      this.pendingCount = 0;
    } else {
      if (this.pendingKey === candidate.key) this.pendingCount++;
      else { this.pendingKey = candidate.key; this.pendingCount = 1; }
      if (this.pendingCount >= this.confirmUpdates && nowMs - this.shownAt >= this.minHoldMs) {
        this.show(candidate, nowMs);
      }
    }
    return { cue: this.current!, heldMs: nowMs - this.shownAt };
  }

  reset(): void {
    this.current = null;
    this.pendingKey = null;
    this.pendingCount = 0;
  }

  private show(c: DirectorCue, nowMs: number): void {
    this.current = c;
    this.shownAt = nowMs;
    this.pendingKey = null;
    this.pendingCount = 0;
  }
}
