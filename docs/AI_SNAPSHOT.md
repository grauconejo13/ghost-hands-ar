# AI Snapshot Interpretation (experimental)

## What was added
The Vercel browser prototype now has a manual **Analyze this view** button. It takes a single resized JPEG image from an already-authorized browser camera and sends it to a same-origin `/api/analyze` endpoint. The endpoint makes a server-side multimodal model request and returns concise learning guidance. The existing automatic 1–5 FPS frame sampling remains **local only** and does not trigger paid AI requests.

## Required Vercel setup
In Vercel Project Settings → Environment Variables, configure:
- `OPENAI_API_KEY`: provider secret (server-only; **never** use a `VITE_` prefix)
- `GHOST_HANDS_DEMO_TOKEN`: a long random private phrase used to gate billable requests
- Optional: `OPENAI_VISION_MODEL` (defaults to `gpt-4.1-mini`; check account/model availability)

Set variables for the **Preview** environment as appropriate, and redeploy the feature branch to apply them. In the app, enter the demo token locally before clicking Analyze. Do not publish or commit either secret. Keep an API spend cap and consider Vercel deployment protection/rate limiting if sharing broadly.

## Privacy
- Camera access starts only after user permission.
- Automatic frame comparisons stay in the user's browser.
- One selected image is transmitted only when the user explicitly requests AI analysis.
- The endpoint does not intentionally store uploaded images or log image contents; the AI provider processes submitted images subject to its policies.
- Don't use this system to determine electrical safety, trail navigability, or permission correctness.

## Limitations and next verification
- Model output is advisory; it may be mistaken.
- This is a browser demo, not native SPECS camera access or a validated Lens Studio experience.
- The code was committed but **the Vercel function, camera request, typecheck and build have not been verified live**.
- The demo token reduces casual public misuse but is not user authentication or comprehensive rate limiting.
