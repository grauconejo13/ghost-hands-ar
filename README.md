# Ghost Hands AR

**Your hands build. Ghost Hands guides.**

Ghost Hands is a spatial, step-by-step electronics assembly guide designed for the **Learn AR with SPECS 2026 hackathon**. Instead of switching between a wiring diagram and a workbench, a learner follows virtual component guides, animated connection paths, and simple Next/Back instructions in an augmented-reality workspace.

> **Status:** Concept and planning. No functional Lens or physical circuit verification has been implemented yet.

## The problem

A beginner building an electronics project often has to look back and forth between a tutorial, a circuit diagram, and the components on a desk. Ghost Hands explores how spatial guidance could make that process more understandable.

## Proposed MVP: Light It Up!

A single guided LED-circuit lesson:

1. **Prepare:** Position a virtual breadboard guide in the workspace.
2. **LED:** Highlight the intended LED position and polarity.
3. **Resistor:** Show the current-limiting resistor placement.
4. **Connect:** Animate the proposed circuit path.
5. **Complete:** Illuminate the *virtual* LED and show completion feedback.

Users can move forward and backward through instructions, restart the lesson, and, if supported by the target SDK/preview, manipulate the guide through spatial input.

**Important:** Completing the walkthrough is not evidence that a real circuit has been wired or powered correctly. The first MVP is instructional visualization, not computer-vision recognition or electrical testing.

## Proposed technology

- Snap Lens Studio and supported SPECS development workflow
- TypeScript for the lesson state machine
- SPECS UI/interaction components where supported and compatible
- Official hackathon planning/agent tools after setup and validation
- Git and GitHub for source control

The exact supported tool versions, APIs, simulator capabilities, and submission requirements should be checked against the current official hackathon materials before implementation.

## Documentation

- [Concept and user journey](docs/CONCEPT.md)
- [Proposed architecture](docs/ARCHITECTURE.md)
- [MVP scope and acceptance criteria](docs/MVP.md)

## Getting started (planned)

1. Install the official required Lens Studio version and hackathon tooling using the organizer's current instructions.
2. Run the official project-planning workflow, retaining its generated artifacts.
3. Create the Lens Studio project in this repository (or document the correct export structure).
4. Implement and test the five-step virtual lesson.
5. Record a short working demo and prepare the Devpost submission.

This repository currently contains **planning documents only**. There are no working build commands yet.

## Safety and limitations

- Do not use Ghost Hands alone as a wiring safety check.
- The example circuit must be reviewed for correct component polarity, resistor sizing, and power limits before any real hardware tutorial is provided.
- Do not connect components to mains electricity.
- A virtual success state means the instructional steps were completed, not that physical hardware was verified.

## Hackathon

Project: **Ghost Hands AR**  
Event: [Learn AR with SPECS on Devpost](https://learn-specs.devpost.com/)

## License

No license has been selected yet. All rights reserved unless a license is added.
