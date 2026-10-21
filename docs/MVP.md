# MVP Scope: Light It Up!

## Goal

Deliver **one complete, understandable AR-guided electronics lesson** that runs in the supported Lens Studio testing workflow, with clear progression and a compelling demo.

## In scope

- [ ] Create a new Lens Studio project using the required/current official setup
- [ ] Show a spatially placed or stably anchored virtual breadboard
- [ ] Show a virtual LED with visible polarity guidance
- [ ] Show a virtual resistor and its intended placement
- [ ] Animate a virtual connection path
- [ ] Implement five deterministic lesson steps
- [ ] Provide Next, Back, and Restart controls
- [ ] Show a virtual-completion animation
- [ ] Test the experience in an officially supported preview/device setup
- [ ] Capture the working experience for a submission demo
- [ ] Include required project/source/planning artifacts based on official rules

## Out of scope

- Physical component recognition or wire tracking
- Verifying a real circuit's electrical connectivity
- Runtime generative AI or speech recognition
- Backend APIs, user accounts, cloud storage
- Multiple circuit lessons or an open-ended builder
- Hardware purchasing as a prerequisite

## Acceptance criteria

| ID | Test | Pass condition |
| --- | --- | --- |
| AC-01 | Launch | Lesson opens in the supported environment with visible spatial visuals |
| AC-02 | Progress | Next advances through all five steps without skipping or exceeding limits |
| AC-03 | Navigate | Back restores the previous instruction and matching visuals |
| AC-04 | Restart | Restart consistently returns to the first step |
| AC-05 | Context | Each step visibly highlights the relevant virtual component or path |
| AC-06 | Completion | Final step clearly states that the *virtual lesson* is complete |
| AC-07 | Clarity | Text and interaction targets are legible in recorded preview footage |
| AC-08 | Reproducibility | Repository contains the actual editable project plus setup instructions |

## Build order

1. Validate current hackathon requirements, supported SDKs, and preview inputs.
2. Use official planning tools; add their output if required/recommended.
3. Implement static scene and five-step controller.
4. Connect navigation controls.
5. Add component visuals and path animations.
6. Add spatial placement if feasible without jeopardizing the core demo.
7. Test and record the lesson.
8. Finish Devpost description and submission checklist.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Unsupported gesture/preview behavior | Maintain a supported button/control fallback |
| Complicated object alignment | Use a virtual breadboard instead of automatic physical recognition |
| Unclear circuit accuracy | Keep the MVP virtual and verify any future pin-level wiring separately |
| Time-consuming 3D assets | Prefer simple procedural or low-poly models |
| Scope creep | Ship one circuit lesson before adding features |

## Definition of done

The experience is independently navigable from start to finish; its visuals update appropriately; the virtual completion is unambiguous; and a judge can inspect the Lens project and see the experience demonstrated in a concise video.

**Do not mark checklist items complete until implemented and tested.**
