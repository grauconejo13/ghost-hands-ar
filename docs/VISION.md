# Visual Sampling and Session Memory

## Status

Portable proof of concept, **not connected to a camera, AI model, Vercel deployment, or SPECS**.

`src/vision/FrameMemory.ts` accepts tiny grayscale frames from a future user-authorized camera adapter.

## Defaults

- Sample at most once per second.
- Compare the mean absolute pixel difference with the previous **sample**.
- Discard frames with insufficient visual change.
- Retain a heartbeat keyframe every 30 seconds.
- Keep up to 20 selected frames within a rolling two-minute window.
- Allow a forced capture when the learner requests help.
- Erase all stored frames with `clear()` at session end.

## Important limitations

1. This is a coarse pixel-change heuristic, not full CV or semantic recognition. Head movement and lighting changes can cause false positives. Small text differences can be missed.
2. FrameMemory stores only grayscale thumbnails; any original full-resolution image must be managed separately for AI requests, with explicit permission and strict retention.
3. Timestamps must be nondecreasing and supplied by the capture adapter.
4. A cloud AI request is not implemented. Sending frames from SPECS requires confirmation of official camera and networking privacy rules.
5. Do not enable covert recording or silently transmit user surroundings. Make capture visible and stoppable.
6. This memory system cannot establish that a physical electrical circuit is safe or that a trail is navigable.

## Next integration milestone

Connect a browser webcam capture adapter with user permission and downsample the video frame to a fixed small grayscale thumbnail. Add start/stop UI and observable counters for captured, retained and discarded frames. Later, verify Specs camera APIs before writing the SPECS adapter.
