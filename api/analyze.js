// Vercel serverless function: single user-initiated frame analysis.
// Set OPENAI_API_KEY in Vercel Environment Variables. Never expose it in Vite.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    try { if (new URL(origin).host !== host) return res.status(403).json({ error: 'Cross-origin request blocked' }); }
    catch { return res.status(403).json({ error: 'Invalid origin' }); }
  }
  const accessToken = process.env.GHOST_HANDS_DEMO_TOKEN;
  if (!accessToken) return res.status(503).json({ error: 'Demo access token is not configured.' });
  if (req.headers['x-ghost-hands-token'] !== accessToken) return res.status(401).json({ error: 'Invalid demo access token.' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI not configured. Set OPENAI_API_KEY on Vercel.' });
  const { image, question } = req.body || {};
  if (typeof image !== 'string' || image.length > 1500000 ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image)) {
    return res.status(400).json({ error: 'A valid JPEG snapshot under 1 MB is required' });
  }
  if (typeof question !== 'string' || question.length > 300) return res.status(400).json({ error: 'Invalid question' });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const result = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini',
        max_tokens: 220,
        messages: [
          { role: 'system', content: 'You are Ghost Hands, a concise visual learning guide. Describe only what is visibly supported. Give one useful, safe next step, and state uncertainty. Do not infer unseen actions, identities, or safety-critical facts. Never claim that circuits, trails, or cloud permissions are safe from a photo. Limit response to 90 words.' },
          { role: 'user', content: [
            { type: 'text', text: question.trim() || 'What can you see and what might I learn next?' },
            { type: 'image_url', image_url: { url: image, detail: 'low' } }
          ] }
        ]
      })
    });
    const data = await result.json();
    if (!result.ok) return res.status(502).json({ error: 'AI provider request failed; check model and account configuration.' });
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('Empty AI response');
    return res.status(200).json({ answer: answer.slice(0, 1600) });
  } catch (error) {
    return res.status(error?.name === 'AbortError' ? 504 : 502).json({ error: 'AI analysis unavailable. Try again.' });
  } finally { clearTimeout(timeout); }
}
