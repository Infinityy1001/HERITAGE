import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const DAILY_LIMIT = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limiting par IP — 5 appels max par jour
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
  const today = new Date().toISOString().slice(0, 10); // "2026-03-01"
  const rlKey = `rl:${ip}:${today}`;

  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, 86400);

  if (count > DAILY_LIMIT) {
    return res.status(429).json({ error: 'Limite atteinte' });
  }

  // Appel API
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map((b) => b.text || '').join('') || '{}';
    res.status(200).json({ text });
  } catch {
    res.status(500).json({ error: 'API error' });
  }
}
