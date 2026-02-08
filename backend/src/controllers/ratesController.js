const { asyncHandler } = require('../utils/asyncHandler');

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

const fetchRates = async (base) => {
  const key = String(base).toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }
  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Rate provider error');
  }
  const data = await response.json();
  cache.set(key, { data, fetchedAt: Date.now() });
  return data;
};

const getRate = asyncHandler(async (req, res) => {
  const base = String(req.query.base || 'USD').toUpperCase();
  const target = String(req.query.target || 'AZN').toUpperCase();
  const data = await fetchRates(base);
  const rate = data && data.rates ? data.rates[target] : null;
  if (!rate) {
    return res.status(404).json({ error: 'Rate not found.' });
  }
  res.json({
    base,
    target,
    rate,
    updated: data.time_last_update_utc || null
  });
});

module.exports = { getRate };
