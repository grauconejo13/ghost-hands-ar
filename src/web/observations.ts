/** Plain-language read-outs of measured values. No scores, no quality verdicts. */
import type { CompositionResult } from "../vision/CompositionAnalyzer.ts";
import type { LightingCondition, LightingResult } from "../vision/LightingAnalyzer.ts";

export type Observation = Readonly<{ label: string; value: string }>;

const pct = (n: number) => `${Math.round(n * 100)}%`;

const CONDITION_LABEL: Record<LightingCondition, string> = {
  dark: "Reads dark",
  bright: "Reads bright",
  "low-contrast": "Low contrast",
  "high-contrast": "High contrast",
  balanced: "No exposure flags",
};

export function lightingObservations(r: LightingResult): Observation[] {
  return [
    { label: "Reading", value: CONDITION_LABEL[r.condition] },
    { label: "Brightness", value: `${pct(r.meanLuminance)} mean` },
    { label: "Shadows", value: `${pct(r.shadowFraction)} of pixels` },
    { label: "Highlights", value: `${pct(r.highlightFraction)} of pixels` },
    { label: "Contrast", value: `${r.rmsContrast.toFixed(2)} RMS · ${pct(r.percentileRange)} range` },
  ];
}

export function compositionObservations(c: CompositionResult): Observation[] {
  if (c.status === "unknown") {
    return [{
      label: "Subject",
      value: c.reason === "no-subject" ? "Unknown. Tap your subject in the frame." : "Unknown. Marked point is out of frame.",
    }];
  }
  return [
    { label: "Subject", value: `Marked at ${pct(c.subject.x)} across, ${pct(c.subject.y)} down` },
    { label: "Nearest third", value: c.target.id.replace("-", " ") },
    { label: "Offset", value: c.status === "aligned" ? "On the intersection" : `${pct(c.distance)} of frame` },
  ];
}
