# Proposed Architecture

> **Planning document:** Subject to official SDK/API verification. This document describes the intended structure, not functionality currently committed to the repository.

## Overview

```text
Lens Studio scene
  ├── Spatial lesson visuals
  │     ├── Breadboard model
  │     ├── Ghost LED + resistor
  │     └── Connection paths and cues
  ├── UI and input adapters
  │     ├── Next / Back / Restart
  │     └── Guide placement (if supported)
  └── TypeScript lesson controller
        ├── Current step
        ├── Step enter / exit effects
        └── Event-driven visual updates
```

The MVP is local to the Lens experience and requires **no backend, login, database, or runtime AI service**.

## Core modules (planned)

### LessonController

Owns a current step index (0–4). Valid actions:

- `next()`: advance only if not at the final step
- `back()`: return only if not at the first step
- `restart()`: return to step zero
- `renderStep(index)`: show relevant visual elements and hide the others

Use a single source of truth for progression so text, models, and animations do not become out of sync.

### StepDefinition

Data for each instructional state:

```ts
type StepDefinition = {
  id: "prepare" | "led" | "resistor" | "connect" | "complete";
  title: string;
  instruction: string;
  hint?: string;
};
```

Additional Lens Studio references for scene objects should be wired according to validated APIs rather than assumed in advance.

### SceneVisuals

Scene-level objects for the breadboard, LED, resistor, and connection guide. Each has a visible/hidden or enabled/disabled state controlled by the lesson controller.

### SpatialInput

Map supported input events to the same actions used by preview controls. Do not couple lesson logic directly to a particular gesture. Confirm hand tracking, interaction components, and simulator behavior before committing to any interaction modality.

### PlacementController (optional/stretch)

Allow the user to position the virtual board at a comfortable location and confirm alignment. Fallback: provide a stable anchored virtual workspace if live surface detection or tracking is unavailable in the testing environment.

## State transitions

```text
Prepare <-> LED <-> Resistor <-> Connect <-> Complete
   ^                                          |
   |--------------- Restart ------------------|
```

Bounds checks ensure Next cannot go past Complete and Back cannot precede Prepare.

## Modeling and correctness

The basic visual concept is not an engineering diagram. Before introducing pin-specific hardware instructions, choose a particular board and power source, check the current path, and independently verify resistor values and LED polarity. For the MVP, represent the circuit as a virtual teaching model and avoid claiming live verification.

## Testing plan

- Every step can be entered and exited.
- Next, Back, and Restart do not create duplicate objects.
- Step headings and visible components remain synchronized.
- The UI remains readable in the official supported preview.
- The scene works without network access.
- Completion text explicitly says the **virtual lesson** is complete.
- All installed tool versions and actual APIs are documented when implemented.

## Planned repository evolution

```text
ghost-hands-ar/
├── README.md
├── docs/
│   ├── CONCEPT.md
│   ├── ARCHITECTURE.md
│   └── MVP.md
├── devpost/                 # Official planning output, if generated
└── <Lens Studio project>    # Create using official tooling
```

Avoid generating placeholder Lens Studio project metadata by hand.
