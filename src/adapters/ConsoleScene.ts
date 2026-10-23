import type { ScenePort } from "./SceneBridge.ts";
import type { ComponentId } from "../core/LessonStep.ts";

/** Test/demo adapter only. Replace with actual Lens Studio bindings later. */
export class ConsoleScene implements ScenePort {
  readonly visible = new Set<ComponentId>();
  readonly highlighted = new Set<ComponentId>();
  connectionPathVisible = false;
  virtualLedLit = false;
  title = "";
  instruction = "";
  hint = "";
  canGoBack = false;
  canGoNext = false;
  progress = { current: 1, total: 5 };

  setComponentVisible(id: ComponentId, visible: boolean): void {
    if (visible) this.visible.add(id);
    else this.visible.delete(id);
  }
  setComponentHighlighted(id: ComponentId, highlighted: boolean): void {
    if (highlighted) this.highlighted.add(id);
    else this.highlighted.delete(id);
  }
  setConnectionPathVisible(visible: boolean): void {
    this.connectionPathVisible = visible;
  }
  setVirtualLedLit(lit: boolean): void {
    this.virtualLedLit = lit;
  }
  setInstruction(title: string, instruction: string, hint: string): void {
    this.title = title;
    this.instruction = instruction;
    this.hint = hint;
  }
  setNavigation(canGoBack: boolean, canGoNext: boolean): void {
    this.canGoBack = canGoBack;
    this.canGoNext = canGoNext;
  }
  setProgress(current: number, total: number): void {
    this.progress = { current, total };
  }

  describe(): string {
    return [
      `Step ${this.progress.current}/${this.progress.total}: ${this.title}`,
      this.instruction,
      `Visible: ${[...this.visible].join(", ") || "(none)"}`,
      `Highlight: ${[...this.highlighted].join(", ") || "(none)"}`,
      `Connection path: ${this.connectionPathVisible ? "on" : "off"}`,
      `Virtual LED: ${this.virtualLedLit ? "lit" : "off"}`,
      `Back: ${this.canGoBack} | Next: ${this.canGoNext}`,
    ].join("\n");
  }
}
