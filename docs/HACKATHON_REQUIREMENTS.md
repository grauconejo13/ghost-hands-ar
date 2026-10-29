# Learn AR with SPECS: Submission Requirements

Checklist for submitting Ghost Hands AR to [Learn AR with SPECS](https://learn-specs.devpost.com/).
Summarized from the official overview page on 2026-10-28. Check the [official rules](https://learn-specs.devpost.com/rules) before submitting.

**Deadline:** Nov 9, 2026 @ 5:00 PM EST

## Required (missing any of these risks disqualification)

### Build requirements

- [ ] **New project.** Code started during the submission period. Old ideas are fine; old code is not.
- [ ] **Planned with the Devpost Learn skill pack.**
  - Install: `npx skills add challengepost/learn-specs --all -y`
  - In the coding agent, say: `Run the plan-lens skill.`
  - Commit the planning docs it writes to the `devpost/` folder.
- [ ] **Built with CLAD.** The coding agent builds the Lens in Lens Studio through the CLAD plugin and the Lens Studio MCP.
- [ ] **Runs in the Lens Studio preview.** SPECS glasses are not required.

### What to submit

- [ ] **Demo video:** public on YouTube, **under 3 minutes**, showing the Lens working. A screen recording of the Lens Studio preview works. If possible, also talk through the design process.
  - Reviewers will **not** clone or run the project, so the video has to show it working end to end.
- [ ] **Public repo** (GitHub, GitLab, or Bitbucket) containing:
  - [ ] Lens Studio project files
  - [ ] `devpost/` folder (skill pack planning docs)
- [ ] **Short description:** what the Lens does, who it's for, and what you learned.

### Eligibility

- [ ] Above the legal age of majority in your country of residence.
- [ ] Registered on the Devpost hackathon page.

## Tooling setup

- [ ] Computer that runs Lens Studio, Node.js, and Git
- [ ] A coding agent that supports skills
- [ ] Lens Studio installed. If sign-in fails on 5.24, use [Lens Studio 5.23.2](https://ar.snap.com/download/v5-23-2).
- [ ] Lens Studio MCP configured
- [ ] CLAD plugin installed ([docs](https://developers.specs.com/docs/clad))
- [ ] Skill pack installed ([challengepost/learn-specs](https://github.com/challengepost/learn-specs))
- [ ] Quick start on the [Resources tab](https://learn-specs.devpost.com/resources) followed

## Judging criteria

| Criterion | What judges ask | Ghost Hands focus |
| --- | --- | --- |
| **Design** | Is it a complete, coherent product experience, not just a technical proof of concept? | Anchor guides to the real table at real size; hands-free navigation; a "Did your LED light?" check with a troubleshooting branch |
| **Technical Implementation** | How well is it built, and how well did it use CLAD, Lens Studio, and the Lens Studio MCP? | Let CLAD build from the plan-lens brief; record the build workflow |
| **Innovation/Idea** | How creative and novel is it, and how does it differ from existing concepts? | Spatial guidance at the workbench; honest "virtual completion" feedback |
| **Presentation** | Does the video show it working end to end? Does the pitch say what problem it solves, who it's for, and why it matters? | Open on the pain point (eyes bouncing between tutorial and breadboard), then show the fix fast |

The organizers' design principles for good AR:

- **It shares your view:** the camera sees what you see, and the app responds to it.
- **It draws in the world:** content sits on the table at real size, where it belongs.
- **It leaves your body free:** hands stay available and eyes stay up.

Avoid the "website floating in front of your face" pattern.

## Optional events

| Event | When | Notes |
| --- | --- | --- |
| [Build for SPECS: AR Design with Lens Studio and CLAD](https://luma.com/p2szkiay) | Thu, Oct 29, 12 PM ET | Live build session; recorded |
| [SPECS Live Review: Inside the Judging Criteria](https://luma.com/cso792cy) | Thu, Nov 5, 12 PM ET | For a live review, post in `#devpost-learn-feedback` tagged "Learn AR with SPECS" and "Will It Ship" |
| [SPECS channel on Discord](https://discord.gg/3JmArXnrs4) | Anytime | Questions and setup help |

## Repo gaps (as of 2026-10-28)

- [ ] No `devpost/` folder yet: run plan-lens
- [ ] No Lens Studio project yet: build with CLAD + Lens Studio MCP
- [ ] The Vite web preview (`index.html`, `src/web/`) and `src/vision/FrameMemory.ts` are not part of the Lens. Consider moving them to a separate branch so the submission stays focused.
- [ ] README status still says "planning documents only". Update it once the Lens exists.

## Prizes

- 1st: $1,250
- 2nd: $750
- 3rd: $500
- Every eligible submission gets a Devpost Learn badge and a special Discord role.
