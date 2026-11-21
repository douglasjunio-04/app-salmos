// Devolve o país do visitante (cabeçalho da Vercel) e o câmbio USD -> moeda local.
// Usado pelo app para mostrar o preço aproximado na moeda do comprador antes do checkout.
const MONEDAS = {
  MX: 'MXN', CO: 'COP', PE: 'PEN', CL: 'CLP', BR: 'BRL', AR: 'ARS',
  ES: 'EUR', PT: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR'
};
// A Hotmart cobra acima do câmbio comercial (impostos e taxa de conversão).
// Fatores medidos no checkout em 21/11/2026 (preço Hotmart ÷ câmbio comercial).
const FATOR_HOTMART = { BRL: 1.1105, MXN: 1.2376, COP: 1.0983, PEN: 1.0842, CLP: 1.2713, ARS: 1.2653, EUR: 1.1477 };
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
      rate = cache.rates && cache.rates[currency] && cache.rates[currency] * (FATOR_HOTMART[currency] || 1);
    } catch (e) { rate = null; }
  }
  res.setHeader('Cache-Control', 'private, max-age=3600');
  if (!rate) return res.status(200).json({ country, currency: 'USD', rate: 1 });
  res.status(200).json({ country, currency, rate });
};
