import { LessonController } from "../core/LessonController.ts";
import type { LessonSnapshot } from "../core/LessonController.ts";
import type { ComponentId } from "../core/LessonStep.ts";

/**
 * A minimal port for the eventual Lens Studio scene integration.
 * Actual scene object bindings and gesture APIs are intentionally deferred.
 */
export interface ScenePort {
  setComponentVisible(id: ComponentId, visible: boolean): void;
  setComponentHighlighted(id: ComponentId, highlighted: boolean): void;
  setConnectionPathVisible(visible: boolean): void;
  setVirtualLedLit(lit: boolean): void;
  setInstruction(title: string, instruction: string, hint: string): void;
  setNavigation(canGoBack: boolean, canGoNext: boolean): void;
  setProgress(current: number, total: number): void;
}

const ALL_COMPONENTS: readonly ComponentId[] = ["breadboard", "led", "resistor", "wires"];

/** Maps an immutable lesson snapshot to visible scene state. */
export function renderLessonSnapshot(scene: ScenePort, snapshot: LessonSnapshot): void {
  const { step } = snapshot;
  for (const component of ALL_COMPONENTS) {
    scene.setComponentVisible(component, step.visuals.visibleComponents.includes(component));
    scene.setComponentHighlighted(component, step.visuals.highlightedComponent === component);
  }
  scene.setConnectionPathVisible(step.visuals.showConnectionPath);
  scene.setVirtualLedLit(step.visuals.virtualLedLit);
  scene.setInstruction(step.title, step.instruction, step.hint);
  scene.setNavigation(snapshot.canGoBack, snapshot.canGoNext);
  scene.setProgress(snapshot.index + 1, snapshot.total);
}

/**
 * Subscribes a scene to the lesson controller.
 * Call returned function when the Lens scene is destroyed.
 */
export function connectLessonScene(
  controller: LessonController,
  scene: ScenePort,
): () => void {
  return controller.subscribe((snapshot) => renderLessonSnapshot(scene, snapshot));
}
