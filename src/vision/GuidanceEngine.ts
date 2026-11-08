/**
 * Turns measured lighting and composition results into exactly one short,
 * deterministic suggestion. Messages describe measurements and framing
 * geometry only; they never judge artistic quality.
 *
 * Priority: unusable exposure (dark/bright) > composition > contrast notes.
 * "ready" means the subject sits on a thirds intersection and no exposure
 * warning applies. It is a framing cue, not a quality guarantee.
 */
import type { CompositionResult, Horizontal, Vertical } from "./CompositionAnalyzer.ts";
import type { LightingResult } from "./LightingAnalyzer.ts";

export type GuidanceId =
  | "too-dark"
  | "too-bright"
  | "subject-unknown"
  | "move-subject"
  | "high-contrast"
  | "low-contrast"
  | "ready"
  | "no-data";

export type Guidance = Readonly<{
  id: GuidanceId;
  message: string;
  ready: boolean;
  /** Which measurements produced this suggestion. */
  basis: readonly ("lighting" | "composition")[];
}>;

export type GuidanceInput = Readonly<{
  lighting?: LightingResult | null;
  composition?: CompositionResult | null;
}>;

export function generateGuidance(input: GuidanceInput): Guidance {
  const lighting = input.lighting ?? null;
  const composition = input.composition ?? null;

  if (lighting?.condition === "dark") {
    return cue("too-dark", "Scene reads dark. Try more light or face toward the light source.", ["lighting"]);
  }
  if (lighting?.condition === "bright") {
    return cue("too-bright", "Scene reads bright. Try shade or angle away from the light.", ["lighting"]);
  }

  if (composition !== null) {
    if (composition.status === "unknown") {
      return cue("subject-unknown", "Subject position unknown. Mark your subject to get framing help.", ["composition"]);
    }
    const thirds = `the ${composition.target.id} third`;
    if (composition.status === "off-target") {
      const move = describeCameraMove(composition.cameraMove.horizontal, composition.cameraMove.vertical);
      return cue("move-subject", `${move} to place the subject on ${thirds}.`, ["composition"]);
    }
    // Aligned: mention any contrast note before declaring readiness.
    if (lighting?.condition === "high-contrast") {
      return cue("high-contrast", "Strong shadows and highlights. Check exposure on your subject.", ["lighting", "composition"]);
    }
    if (lighting?.condition === "low-contrast") {
      return cue("low-contrast", "Tones are very even. Side light may add shape.", ["lighting", "composition"]);
    }
    return {
      id: "ready",
      message: `Subject is on ${thirds}. Capture This!`,
      ready: true,
      basis: lighting === null ? ["composition"] : ["lighting", "composition"],
    };
  }

  if (lighting?.condition === "high-contrast") {
    return cue("high-contrast", "Strong shadows and highlights. Check exposure on your subject.", ["lighting"]);
  }
  if (lighting?.condition === "low-contrast") {
    return cue("low-contrast", "Tones are very even. Side light may add shape.", ["lighting"]);
  }
  if (lighting !== null) {
    return cue("subject-unknown", "Exposure looks usable. Mark your subject to get framing help.", ["lighting"]);
  }
  return cue("no-data", "Start Scout to get a framing suggestion.", []);
}

function describeCameraMove(horizontal: Horizontal, vertical: Vertical): string {
  const parts: string[] = [];
  if (horizontal !== null) parts.push(`pan ${horizontal}`);
  if (vertical !== null) parts.push(`tilt ${vertical}`);
  // Off-target with both axes inside the deadband: a diagonal nudge.
  if (parts.length === 0) return "Adjust slightly";
  const text = parts.join(" and ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cue(id: GuidanceId, message: string, basis: Guidance["basis"]): Guidance {
  return { id, message, ready: false, basis };
}
