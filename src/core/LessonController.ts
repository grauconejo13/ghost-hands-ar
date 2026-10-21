import { LED_LESSON } from "./LessonData";
import type { LessonStep } from "./LessonStep";

export type LessonSnapshot = Readonly<{
  index: number;
  total: number;
  step: LessonStep;
  canGoBack: boolean;
  canGoNext: boolean;
  isComplete: boolean;
}>;

export type LessonListener = (snapshot: LessonSnapshot) => void;

/**
 * Platform-independent lesson progression.
 *
 * Scene/UI adapters can subscribe to snapshots and render the corresponding
 * spatial objects. No Lens Studio API is imported by this controller.
 */
export class LessonController {
  private index = 0;
  private readonly steps: readonly LessonStep[];
  private readonly listeners = new Set<LessonListener>();

  constructor(steps: readonly LessonStep[] = LED_LESSON) {
    if (steps.length === 0) {
      throw new Error("A lesson must contain at least one step.");
    }
    const ids = steps.map((step) => step.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error("Lesson step IDs must be unique.");
    }
    this.steps = steps;
  }

  getSnapshot(): LessonSnapshot {
    return {
      index: this.index,
      total: this.steps.length,
      step: this.steps[this.index],
      canGoBack: this.index > 0,
      canGoNext: this.index < this.steps.length - 1,
      isComplete: this.index === this.steps.length - 1,
    };
  }

  next(): boolean {
    if (this.index >= this.steps.length - 1) return false;
    this.index += 1;
    this.notify();
    return true;
  }

  back(): boolean {
    if (this.index <= 0) return false;
    this.index -= 1;
    this.notify();
    return true;
  }

  restart(): boolean {
    if (this.index === 0) return false;
    this.index = 0;
    this.notify();
    return true;
  }

  /**
   * Registers a listener and immediately sends the current snapshot.
   * Returns a cleanup function for scene teardown.
   */
  subscribe(listener: LessonListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}
