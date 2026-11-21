// Webhook da Hotmart: recebe cada mudança de compra e atualiza o acesso do comprador.
const { redis, norm, validEmail, getBuyer, setBuyer, readBody } = require('./_lib/store');
const PRODUCT_APP = String(process.env.HOTMART_PRODUCT_APP || '9032232');
const PRODUCT_BIB = String(process.env.HOTMART_PRODUCT_BIB || '');
const ACTIVE = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'APPROVED', 'COMPLETE'];
const PENDING = ['PURCHASE_BILLET_PRINTED', 'PURCHASE_DELAYED', 'BILLET_PRINTED', 'WAITING_PAYMENT', 'PRINTED_BILLET'];
const REVOKED = ['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_CANCELED', 'REFUNDED', 'CHARGEBACK', 'CANCELED', 'CANCELLED', 'BLOCKED'];
const EXPIRED = ['PURCHASE_EXPIRED', 'EXPIRED'];
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ ok: true, info: 'Webhook Palabra con Poder' });
  const body = await readBody(req);
  const expected = process.env.HOTMART_HOTTOK;
  const got = req.headers['x-hotmart-hottok'] || body.hottok;
  if (!expected) return res.status(503).json({ error: 'HOTMART_HOTTOK não configurado' });
  if (got !== expected) return res.status(401).json({ error: 'hottok inválido' });
  const d = body.data || {};
  const event = String(body.event || '').toUpperCase();
  const status = String((d.purchase && d.purchase.status) || body.status || '').toUpperCase();
  const email = norm((d.buyer && d.buyer.email) || body.email);
  const prodId = String((d.product && d.product.id) || body.prod || '');
  const prodName = String((d.product && d.product.name) || body.prod_name || '');
  const tx = (d.purchase && d.purchase.transaction) || body.transaction || '';
  try { await redis('LPUSH', 'pcp:events', JSON.stringify({ t: Date.now(), event, status, email, prodId, tx })); await redis('LTRIM', 'pcp:events', 0, 499); } catch (e) {}
  if (!validEmail(email)) return res.status(200).json({ ok: true, ignored: 'sem e-mail' });
  const which = (PRODUCT_BIB && prodId === PRODUCT_BIB) || (!PRODUCT_BIB && /biblioteca/i.test(prodName)) ? 'bib' : (prodId === PRODUCT_APP || !prodId || /palabra|salmo/i.test(prodName)) ? 'app' : null;
  if (!which) return res.status(200).json({ ok: true, ignored: 'outro produto' });
  const key = [event, status];
  let next = null;
  if (key.some(k => ACTIVE.includes(k))) next = 'active';
  else if (key.some(k => REVOKED.includes(k))) next = 'revoked';
  else if (key.some(k => PENDING.includes(k))) next = 'pending';
  else if (key.some(k => EXPIRED.includes(k))) next = 'expired';
  if (!next) return res.status(200).json({ ok: true, ignored: event || status });
  const buyer = (await getBuyer(email)) || {};
  const cur = buyer[which] && buyer[which].status;
  // pendente ou expirado nunca rebaixam uma compra já aprovada
  if ((next === 'pending' || next === 'expired') && cur === 'active') return res.status(200).json({ ok: true, kept: 'active' });
  buyer[which] = { status: next, tx, at: Date.now(), event: event || status };
  await setBuyer(email, buyer);
  res.status(200).json({ ok: true, email, [which]: next });
};
