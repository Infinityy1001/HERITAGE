import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const SECRET = process.env.ADMIN_SECRET || 'heritage2026';

export default async function handler(req, res) {
  if (req.query.key !== SECRET) {
    return res.status(401).send('Accès refusé');
  }

  const raw = await redis.zrange('waitlist', 0, -1);
  const entries = raw.map(r => {
    try { return JSON.parse(r); } catch { return null; }
  }).filter(Boolean).reverse(); // plus récent en premier

  const rows = entries.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.name || '—'}</td>
      <td>${e.email}</td>
      <td>${new Date(e.createdAt).toLocaleString('fr-FR')}</td>
    </tr>`).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Héritage — Liste d'attente (${entries.length})</title>
<style>
  body { font-family: sans-serif; padding: 40px; background: #f9f5ee; color: #1a1510; }
  h1 { font-size: 22px; margin-bottom: 8px; }
  p  { color: #9c8e7e; margin-bottom: 28px; }
  table { width: 100%; border-collapse: collapse; background: white; }
  th { background: #1a1510; color: #f9f5ee; padding: 12px 16px; text-align: left; font-size: 12px; letter-spacing: 1px; }
  td { padding: 12px 16px; border-bottom: 1px solid #e0d8cc; font-size: 14px; }
  tr:hover td { background: #f3ede2; }
</style>
</head>
<body>
  <h1>✦ Héritage — Liste d'attente</h1>
  <p>${entries.length} inscription${entries.length > 1 ? 's' : ''}</p>
  <table>
    <thead><tr><th>#</th><th>Prénom / Nom</th><th>Email</th><th>Date</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:32px;color:#9c8e7e">Aucune inscription pour le moment</td></tr>'}</tbody>
  </table>
</body>
</html>`);
}
