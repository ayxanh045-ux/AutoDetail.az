const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');

const getCars = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, brand, model, year, color FROM Cars ORDER BY brand, model, year, color'
  );
  res.json({ cars: rows });
});

const requestCar = asyncHandler(async (req, res) => {
  const { brand, model, year, color, email } = req.body || {};

  if (!brand || !model || !year || !color) {
    return res.status(400).json({ error: 'Brand, model, year, and color are required.' });
  }

  const normalizedBrand = String(brand).trim();
  const normalizedModel = String(model).trim();
  const normalizedColor = String(color).trim();
  const normalizedYear = Number(year);
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

  if (!Number.isFinite(normalizedYear)) {
    return res.status(400).json({ error: 'Year must be a number.' });
  }

  await pool.query(
    'INSERT INTO PendingCars (brand, model, year, color, requested_by) VALUES (?, ?, ?, ?, ?)',
    [normalizedBrand, normalizedModel, normalizedYear, normalizedColor, normalizedEmail]
  );

  return res.status(201).json({ message: 'Request received. We will review and add it.' });
});

const getCarModels = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT brand, model FROM CarModels ORDER BY brand, model'
  );
  res.json({ models: rows });
});

module.exports = { getCars, requestCar, getCarModels };
