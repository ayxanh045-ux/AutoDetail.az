const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');
// AI moderation removed by request.

const insertPriceHistory = async (postId, priceValue, currencyValue) => {
  if (!Number.isFinite(priceValue)) return;
  await pool.query(
    'INSERT INTO PriceHistory (post_id, price, currency, changed_at) VALUES (?, ?, ?, NOW())',
    [postId, priceValue, currencyValue || null]
  );
};

const optimizeImage = async (filePath) => {
  try {
    const image = sharp(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let pipeline = image
      .rotate()
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      ;
    if (ext === '.png') {
      pipeline = pipeline.png({ quality: 82, compressionLevel: 8 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 82 });
    } else {
      pipeline = pipeline.jpeg({ quality: 82 });
    }
    const buffer = await pipeline.toBuffer();
    await fs.writeFile(filePath, buffer);
  } catch (err) {
    // If optimization fails, keep original
  }
};

const createPost = asyncHandler(async (req, res) => {
  const {
    email,
    title,
    description,
    part_type,
    car_brand,
    car_model,
    car_year,
    car_color,
    price,
    price_currency
  } = req.body || {};

  if (!email || !title || !part_type || !car_brand || !car_model || !car_year || !car_color) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [users] = await pool.query('SELECT idUsers FROM Users WHERE email = ? LIMIT 1', [
    normalizedEmail
  ]);
  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const files = Array.isArray(req.files) ? req.files : [];
  await Promise.all(files.map((f) => optimizeImage(f.path)));
  const imageUrl = files[0] ? `/uploads/${files[0].filename}` : null;
  // No AI moderation check.
  const yearValue = Number(car_year);

  const priceValue = price !== undefined && price !== null && price !== '' ? Number(price) : null;
  const normalizedCurrency = price_currency ? String(price_currency).trim() : null;
  const [result] = await pool.query(
    'INSERT INTO posts (user_id, image_url, title, description, part_type, car_brand, car_model, car_year, car_color, price, price_currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      users[0].idUsers,
      imageUrl,
      String(title).trim(),
      description ? String(description).trim() : null,
      String(part_type).trim(),
      String(car_brand).trim(),
      String(car_model).trim(),
      Number.isFinite(yearValue) ? yearValue : null,
      String(car_color).trim(),
      Number.isFinite(priceValue) ? priceValue : null,
      normalizedCurrency
    ]
  );

  if (Number.isFinite(priceValue)) {
    await insertPriceHistory(result.insertId, priceValue, normalizedCurrency);
  }

  if (files.length) {
    const values = files.map((file) => [result.insertId, `/uploads/${file.filename}`]);
    await pool.query(
      'INSERT INTO PostImages (post_id, image_url) VALUES ?',
      [values]
    );
  }

  return res.status(201).json({ id: result.insertId });
});

const getPosts = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, user_id, image_url, title, description, part_type, car_brand, car_model, car_year, car_color, price, price_currency, created_at FROM posts ORDER BY created_at DESC'
  );
  res.json({ posts: rows });
});

const getPostById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const [rows] = await pool.query(
    `SELECT 
      p.id,
      p.user_id,
      p.image_url,
      p.title,
      p.description,
      p.part_type,
      p.car_brand,
      p.car_model,
      p.car_year,
      p.car_color,
      p.price,
      p.price_currency,
      p.created_at,
      u.UserName AS user_name,
      u.email AS user_email,
      u.phone AS user_phone,
      u.profile_image_url AS user_profile_image,
      u.created_at AS user_created_at,
      u.role AS user_role
     FROM posts p
     LEFT JOIN Users u ON u.idUsers = p.user_id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Not found.' });
  }
  const post = rows[0];
  const [images] = await pool.query(
    'SELECT image_url FROM PostImages WHERE post_id = ? ORDER BY id ASC',
    [id]
  );
  post.images = images.map((img) => img.image_url);
  res.json({ post });
});

const assertPostOwnerOrAdmin = async (postId, email) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const [userRows] = await pool.query(
    'SELECT idUsers, role FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (userRows.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  const user = userRows[0];
  const [postRows] = await pool.query('SELECT user_id FROM posts WHERE id = ? LIMIT 1', [postId]);
  if (postRows.length === 0) {
    const err = new Error('Post not found.');
    err.status = 404;
    throw err;
  }
  const isOwner = Number(postRows[0].user_id) === Number(user.idUsers);
  const isAdmin = String(user.role).toLowerCase() === 'admin';
  if (!isOwner && !isAdmin) {
    const err = new Error('Not allowed.');
    err.status = 403;
    throw err;
  }
  return user;
};

const updatePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const { email, title, description, part_type, car_brand, car_model, car_year, car_color, price, price_currency } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  await assertPostOwnerOrAdmin(id, email);

  const [postRows] = await pool.query('SELECT price, price_currency FROM posts WHERE id = ? LIMIT 1', [id]);
  if (postRows.length === 0) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const yearValue = car_year ? Number(car_year) : null;
  const priceValue = price !== undefined && price !== null && price !== '' ? Number(price) : null;
  const normalizedCurrency = price_currency ? String(price_currency).trim() : null;
  const prevPrice = postRows[0].price !== null ? Number(postRows[0].price) : null;
  const prevCurrency = postRows[0].price_currency ? String(postRows[0].price_currency).trim() : null;
  await pool.query(
    `UPDATE posts SET 
      title = ?, 
      description = ?, 
      part_type = ?, 
      car_brand = ?, 
      car_model = ?, 
      car_year = ?, 
      car_color = ?,
      price = ?,
      price_currency = ?
     WHERE id = ?`,
    [
      title ? String(title).trim() : null,
      description ? String(description).trim() : null,
      part_type ? String(part_type).trim() : null,
      car_brand ? String(car_brand).trim() : null,
      car_model ? String(car_model).trim() : null,
      Number.isFinite(yearValue) ? yearValue : null,
      car_color ? String(car_color).trim() : null,
      Number.isFinite(priceValue) ? priceValue : null,
      normalizedCurrency,
      id
    ]
  );

  const priceChanged =
    (Number.isFinite(priceValue) && (!Number.isFinite(prevPrice) || priceValue !== prevPrice)) ||
    (normalizedCurrency || null) !== (prevCurrency || null);
  if (priceChanged && Number.isFinite(priceValue)) {
    await insertPriceHistory(id, priceValue, normalizedCurrency);
  }

  return res.json({ success: true });
});

const deletePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  await assertPostOwnerOrAdmin(id, email);

  await pool.query('DELETE FROM posts WHERE id = ?', [id]);
  await pool.query('DELETE FROM PostImages WHERE post_id = ?', [id]);
  return res.json({ success: true });
});

const getPriceHistory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  const [rows] = await pool.query(
    'SELECT price, currency, changed_at FROM PriceHistory WHERE post_id = ? ORDER BY changed_at DESC',
    [id]
  );
  res.json({ history: rows });
});

const addPostImages = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  await assertPostOwnerOrAdmin(id, email);
  const files = Array.isArray(req.files) ? req.files : [];
  await Promise.all(files.map((f) => optimizeImage(f.path)));
  if (!files.length) {
    return res.status(400).json({ error: 'No images uploaded.' });
  }
  const values = files.map((file) => [id, `/uploads/${file.filename}`]);
  await pool.query('INSERT INTO PostImages (post_id, image_url) VALUES ?', [values]);
  // If legacy image_url is empty, set first uploaded as primary
  await pool.query(
    'UPDATE posts SET image_url = COALESCE(image_url, ?) WHERE id = ?',
    [values[0][1], id]
  );
  return res.json({ success: true });
});

const removePostImage = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  const { email, image_url } = req.body || {};
  if (!email || !image_url) {
    return res.status(400).json({ error: 'Email and image_url are required.' });
  }
  await assertPostOwnerOrAdmin(id, email);
  const [result] = await pool.query(
    'DELETE FROM PostImages WHERE post_id = ? AND image_url = ?',
    [id, image_url]
  );
  if (result.affectedRows === 0) {
    await pool.query('UPDATE posts SET image_url = NULL WHERE id = ? AND image_url = ?', [id, image_url]);
  }
  return res.json({ success: true });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getPriceHistory,
  addPostImages,
  removePostImage
};
