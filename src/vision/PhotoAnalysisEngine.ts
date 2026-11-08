/**
 * Glue between FrameMemory and the pure analyzers. FrameMemory decides which
 * frames are worth re-measuring (rate limit + visual-change gate); lighting is
 * recomputed only for accepted frames and reused otherwise. Composition is
 * cheap and always recomputed from the supplied subject point.
 */
import { analyzeComposition, type CompositionOptions, type CompositionResult, type IntersectionId, type Point } from "./CompositionAnalyzer.ts";
import { FrameMemory, type FrameDecision, type FrameMemoryOptions, type GrayFrame } from "./FrameMemory.ts";
import { generateGuidance, type Guidance } from "./GuidanceEngine.ts";
import { analyzeLighting, type LightingOptions, type LightingResult } from "./LightingAnalyzer.ts";

export type PhotoAnalysisOptions = Readonly<{
  memory?: FrameMemoryOptions;
  lighting?: LightingOptions;
  composition?: Omit<CompositionOptions, "previousTarget">;
}>;

export type PhotoAnalysis = Readonly<{
  frame: FrameDecision;
  lighting: LightingResult | null;
  composition: CompositionResult;
  guidance: Guidance;
}>;

export class PhotoAnalysisEngine {
  private readonly memory: FrameMemory;
  private lighting: LightingResult | null = null;
  private previousTarget: IntersectionId | undefined;
  private readonly options: PhotoAnalysisOptions;

  constructor(options: PhotoAnalysisOptions = {}) {
    this.options = options;
    this.memory = new FrameMemory(options.memory);
  }

  /** `subject` must come from a real source; pass null when unknown. */
  analyze(frame: GrayFrame, subject: Point | null, force = false): PhotoAnalysis {
    const decision = this.memory.observe(frame, force);
    if (decision.accepted || this.lighting === null) {
      this.lighting = analyzeLighting(frame, this.options.lighting);
    }
    const composition = analyzeComposition(subject, {
      ...this.options.composition,
      previousTarget: this.previousTarget,
    });
    this.previousTarget = composition.status === "unknown" ? undefined : composition.target.id;
    return {
      frame: decision,
      lighting: this.lighting,
      composition,
      guidance: generateGuidance({ lighting: this.lighting, composition }),
    };
  }

  reset(): void {
    this.memory.clear();
    this.lighting = null;
    this.previousTarget = undefined;
  }
}
