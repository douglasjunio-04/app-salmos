// Entrega o conteúdo completo (criptografado no repositório) só para quem tem acesso ativo.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { norm, validEmail, access } = require('./_lib/store');
const APP = ['psalms', 'prayers', 'plan30'];
const BIB = ['bib-mateo', 'bib-marcos', 'bib-lucas', 'bib-juan', 'bib-proverbios', 'bib-versiculos'];
function decrypt(buf) {
  const key = Buffer.from(process.env.CONTENT_KEY || '', 'hex');
  if (key.length !== 32) throw new Error('CONTENT_KEY ausente');
  const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), data = buf.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString('utf8');
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const f = String((req.query && req.query.f) || '');
  if (!APP.includes(f) && !BIB.includes(f)) return res.status(404).json({ error: 'arquivo' });
  const e = norm(req.headers['x-email']);
  if (!validEmail(e)) return res.status(401).json({ error: 'email' });
  let a;
  try { a = await access(e); } catch (err) { return res.status(503).json({ error: 'indisponible' }); }
  const ok = APP.includes(f) ? (a.app === 'active' || a.bib === 'active') : a.bib === 'active';
  if (!ok) return res.status(403).json({ error: 'sin acceso' });
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'conteudo', f + '.enc'));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(decrypt(buf));
  } catch (err) { res.status(500).json({ error: 'contenido' }); }
};
