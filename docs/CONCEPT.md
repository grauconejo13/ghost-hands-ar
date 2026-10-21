# Concept: Ghost Hands AR

## One-line pitch

**Ghost Hands is a pair of virtual guiding hands for learning how to assemble electronics, one spatial instruction at a time.**

## Audience

- People learning electronics for the first time
- Makers who prefer hands-on, visual guidance
- Students who find it difficult to translate 2D schematics into physical layouts

## User problem

Traditional tutorials separate instructions from the place where work happens. Learners repeatedly shift attention from a page or monitor back to the breadboard. Ghost Hands explores whether placing guidance near the work can reduce this friction.

## Experience: Light It Up!

The learner launches a single interactive lesson. A virtual breadboard appears in front of them and can be positioned for comfortable viewing. Each lesson state reveals only the information necessary for the current step.

| Step | What appears | Learner action |
| --- | --- | --- |
| 1. Prepare | Breadboard visualization, placement cue | Position/confirm guide |
| 2. LED | Translucent LED guide, polarity cues | Review placement; advance |
| 3. Resistor | Resistor model and location hint | Review placement; advance |
| 4. Connect | Animated virtual path, explanatory labels | Trace the intended connection |
| 5. Complete | Virtual LED lights and success feedback | Restart or finish |

The first version is a **guided simulation**. It does **not** see actual wires, detect hand-placed components, or prove electrical correctness.

## Design principles

1. **Spatial rather than screen-shaped:** Keep instructions adjacent to the object of attention.
2. **One action at a time:** Avoid clutter and overlapping labels.
3. **Reversible:** Back and Restart controls must work predictably.
4. **Readable:** Use high-contrast indicators plus text, not color alone.
5. **Comfortable:** Avoid rapid flashing; allow guide repositioning if feasible.
6. **Honest feedback:** Label the completion state as a virtual tutorial completion.

## Visual direction

A subdued workbench, a clearly modeled breadboard, translucent 'ghost' parts, cyan path guidance, and warm highlight accents. The UI should feel like a calm workshop companion rather than a dense dashboard.

## Demonstration storyboard

- **Opening:** Show the learner's workspace and the problem of reading a separate diagram.
- **Reveal:** Place the virtual breadboard guide.
- **Progress:** Show LED, resistor, and path steps with clear controls.
- **Payoff:** Complete the *virtual* circuit and replay a step.
- **Close:** State what Ghost Hands does today and what future real-object recognition could add.

## Future directions, not in the MVP

- Recognizing actual components through computer vision
- Confirming physical wiring
- Dynamic AI-generated instructions
- Additional circuit lessons
- Guided physical repair and assembly
- A shared instruction engine for 2D screen overlays and 3D AR guidance
