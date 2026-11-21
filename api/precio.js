// Devolve o país do visitante (cabeçalho da Vercel) e o câmbio USD -> moeda local.
// Usado pelo app para mostrar o preço aproximado na moeda do comprador antes do checkout.
const MONEDAS = {
  MX: 'MXN', CO: 'COP', PE: 'PEN', CL: 'CLP', BR: 'BRL',
  ES: 'EUR', PT: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR'
};
let cache = { t: 0, rates: null };

module.exports = async (req, res) => {
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const currency = MONEDAS[country] || 'USD';
  let rate = 1;
  if (currency !== 'USD') {
    try {
      if (!cache.rates || Date.now() - cache.t > 6 * 3600 * 1000) {
        const r = await fetch('https://open.er-api.com/v6/latest/USD');
        const j = await r.json();
        if (j && j.result === 'success') cache = { t: Date.now(), rates: j.rates };
      }
      rate = cache.rates && cache.rates[currency];
    } catch (e) { rate = null; }
  }
  res.setHeader('Cache-Control', 'private, max-age=3600');
  if (!rate) return res.status(200).json({ country, currency: 'USD', rate: 1 });
  res.status(200).json({ country, currency, rate });
};
