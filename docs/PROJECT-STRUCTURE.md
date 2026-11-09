# Project structure and workstreams

> Status as inspected on GitHub November 6, 2026. This is a separation-of-concerns guide, not a claim all listed future directories are present.

## Keep the old web prototype

The current repository already has a Vite/TypeScript browser application: `index.html`, `package.json`, `src/web/main.ts`, `src/core/`, `src/vision/`, and tests. It has camera sampling and a previous electronics-learning workflow. **Do not delete or silently repurpose it.**

The historical electronics architecture documents `docs/CONCEPT.md`, `docs/ARCHITECTURE.md`, `docs/MVP.md` remain reference material, not the new hackathon spec.

## Frame This! (new native SPECS Lens)

The Lens Studio project is saved locally as `Ghost-Hands-AR/` inside the `ghost-hands-ar` Git checkout, according to the developer's Lens Studio setup. It has **not yet been verified on the remote GitHub branch**.

Suggested native scene boundaries (create only through Lens Studio tools / verified SDK):
- `FrameThisRoot`: new experience isolated from original SPECS example objects.
- `ScoutUI`: enter/exit and quiet status.
- `FramingGuide`: rule-of-thirds overlay.
- `GhostHandsVisual`: translucent hands (optional, after guide works).
- `GuidanceController`: one deterministic instruction at a time, throttled.
- `VisionAdapter`: verified SPECS camera input, with explicit mock fallback.
- `LightingAnalyzer`: luminance metrics on real frames only.
- `AIScout`: optional manual, rate-limited AI hint with privacy guardrails.

These are **proposed logical components**, not verified folders or objects.

## Sync carefully

1. Save the native Lens Studio project.
2. Inspect Git status in the repository root; note untracked Lens files and generated outputs.
3. Fetch remote changes. Before checking out the feature branch, preserve uncommitted local files (commit to a temporary local branch or back up), especially the Lens project.
4. Merge/rebase `feature/capture-this-specs` into the working branch only after understanding existing local changes.
5. Inspect `.gitignore` for generated Lens caches, auto-generated files, `.env*`, and `.claude/settings.local.json` prior to staging.
6. Stage explicit project files, inspect `git diff --cached`, run tests/preview, then commit.
7. Run official hackathon `plan-lens` workflow and check in its actual output, usually `devpost/`, when it exists.

## MVP priority

**First:** functioning native SPECS viewfinder with Scout/Reset and visible guidance transition.

**Second:** independently testable composition and luminance computations with a proven input source.

**Third:** ghostly hands visual, AI scout, and capture integration, only when time and SDK support allow.

Avoid claiming an AI feature works just because a visual example or serverless stub exists.
