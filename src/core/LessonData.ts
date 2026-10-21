import type { LessonStep } from "./LessonStep";

export const LED_LESSON: readonly LessonStep[] = [
  {
    id: "prepare",
    title: "Prepare the workspace",
    instruction: "Position the virtual breadboard in front of you.",
    hint: "This is a guided simulation, not a physical wiring check.",
    visuals: {
      visibleComponents: ["breadboard"],
      highlightedComponent: "breadboard",
      showConnectionPath: false,
      virtualLedLit: false,
    },
  },
  {
    id: "led",
    title: "Place the LED",
    instruction: "Inspect the translucent LED guide and its polarity labels.",
    hint: "LED direction matters in a real circuit.",
    visuals: {
      visibleComponents: ["breadboard", "led"],
      highlightedComponent: "led",
      showConnectionPath: false,
      virtualLedLit: false,
    },
  },
  {
    id: "resistor",
    title: "Add the resistor",
    instruction: "Find the highlighted position for the current-limiting resistor.",
    hint: "The resistor protects the LED by limiting current.",
    visuals: {
      visibleComponents: ["breadboard", "led", "resistor"],
      highlightedComponent: "resistor",
      showConnectionPath: false,
      virtualLedLit: false,
    },
  },
  {
    id: "connect",
    title: "Follow the connection path",
    instruction: "Follow the animated virtual wiring route.",
    hint: "The route is illustrative until a specific circuit is verified.",
    visuals: {
      visibleComponents: ["breadboard", "led", "resistor", "wires"],
      highlightedComponent: "wires",
      showConnectionPath: true,
      virtualLedLit: false,
    },
  },
  {
    id: "complete",
    title: "Virtual lesson complete!",
    instruction: "You completed the simulated assembly walkthrough.",
    hint: "Physical wiring and electrical safety have not been verified.",
    visuals: {
      visibleComponents: ["breadboard", "led", "resistor", "wires"],
      highlightedComponent: null,
      showConnectionPath: true,
      virtualLedLit: true,
    },
  },
] as const;
