import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

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

  await redis.zadd('waitlist', Date.now(), JSON.stringify(entry));
  await redis.set(`wl:${entry.email}`, entry.createdAt);

  res.status(200).json({ ok: true });
}
