export const STEP_IDS = ["prepare", "led", "resistor", "connect", "complete"] as const;

export type LessonStepId = (typeof STEP_IDS)[number];
export type ComponentId = "breadboard" | "led" | "resistor" | "wires";
export type LessonVisualState = Readonly<{
  visibleComponents: readonly ComponentId[];
  highlightedComponent: ComponentId | null;
  showConnectionPath: boolean;
  virtualLedLit: boolean;
}>;
export type LessonStep = Readonly<{
  id: LessonStepId;
  title: string;
  instruction: string;
  hint: string;
  visuals: LessonVisualState;
}>;
