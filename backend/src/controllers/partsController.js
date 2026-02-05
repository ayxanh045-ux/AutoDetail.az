const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');

const getParts = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, category, name FROM Parts ORDER BY category, name'
  );
  res.json({ parts: rows });
});

module.exports = { getParts };
