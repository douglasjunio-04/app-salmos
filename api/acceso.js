// O app envia o e-mail da compra e recebe a situação de acesso.
const { norm, validEmail, access, modeOf, readBody } = require('./_lib/store');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'use POST' });
  const { email } = await readBody(req);
  const e = norm(email);
  if (!validEmail(e)) return res.status(400).json({ error: 'email' });
  try {
    const a = await access(e);
    res.status(200).json({ email: e, app: a.app, bib: a.bib, mode: modeOf(a), admin: !!a.admin });
  } catch (err) { res.status(503).json({ error: 'indisponible' }); }
};
