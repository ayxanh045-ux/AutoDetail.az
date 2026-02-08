const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');

const getUserByEmail = async (email) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT idUsers, email FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (rows.length === 0) return null;
  return rows[0];
};

const getFavorites = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = await getUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const [rows] = await pool.query(
    `SELECT p.id, p.image_url, p.title, p.description, p.part_type, p.car_brand, p.car_model,
            p.car_year, p.car_color, p.price, p.price_currency, p.created_at
     FROM Favorites f
     JOIN posts p ON p.id = f.post_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [user.idUsers]
  );
  res.json({ favorites: rows });
});

const addFavorite = asyncHandler(async (req, res) => {
  const { email, post_id } = req.body || {};
  if (!email || !post_id) {
    return res.status(400).json({ error: 'Email and post_id are required.' });
  }

  const user = await getUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  await pool.query(
    'INSERT IGNORE INTO Favorites (user_id, post_id) VALUES (?, ?)',
    [user.idUsers, Number(post_id)]
  );
  res.status(201).json({ success: true });
});

const removeFavorite = asyncHandler(async (req, res) => {
  const { email, post_id } = req.body || {};
  if (!email || !post_id) {
    return res.status(400).json({ error: 'Email and post_id are required.' });
  }
  const user = await getUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  await pool.query('DELETE FROM Favorites WHERE user_id = ? AND post_id = ?', [
    user.idUsers,
    Number(post_id)
  ]);
  res.json({ success: true });
});

module.exports = { getFavorites, addFavorite, removeFavorite };
