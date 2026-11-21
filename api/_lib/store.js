// Acesso ao banco (Upstash Redis via REST). A Vercel cria as variáveis ao ativar o Upstash em Storage.
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function redis(...cmd) {
  if (!URL || !TOKEN) throw new Error('banco não configurado');
  const r = await fetch(URL, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const norm = e => String(e || '').trim().toLowerCase();
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const ADMINS = (process.env.ADMIN_EMAILS || 'douglas.junior199510@gmail.com').split(',').map(norm).filter(Boolean);
async function getBuyer(email) {
  const raw = await redis('GET', 'pcp:buyer:' + norm(email));
  return raw ? JSON.parse(raw) : null;
}
async function setBuyer(email, data) {
  await redis('SET', 'pcp:buyer:' + norm(email), JSON.stringify(data));
}
// Situação de acesso: app/bib = 'active' | 'pending' | 'revoked' | 'expired' | null
async function access(email) {
  const e = norm(email);
  if (ADMINS.includes(e)) return { app: 'active', bib: 'active', admin: true };
  const b = await getBuyer(e);
  return { app: b && b.app ? b.app.status : null, bib: b && b.bib ? b.bib.status : null };
}
function modeOf(a) {
  if (a.app === 'active' && a.bib === 'active') return 'all';
  if (a.app === 'active') return 'paid';
  if (a.bib === 'active') return 'all';
  if (a.app === 'pending' || a.bib === 'pending') return 'pending';
  if (a.app === 'revoked' || a.bib === 'revoked') return 'revoked';
  return 'none';
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return await new Promise(res => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { res(JSON.parse(d || '{}')); } catch (e) { res({}); } }); });
}
module.exports = { redis, norm, validEmail, getBuyer, setBuyer, access, modeOf, readBody };
