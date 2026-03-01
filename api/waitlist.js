import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { name, email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const entry = {
    name: (name || '').trim(),
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
  };

  // Store in sorted set (score = timestamp for ordering), keyed by email to avoid duplicates
  await redis.zadd('waitlist', {
    score: Date.now(),
    member: JSON.stringify(entry),
  });

  // Also store email as a simple key to detect duplicates on next visit
  await redis.set(`wl:${entry.email}`, entry.createdAt);

  res.status(200).json({ ok: true });
}
