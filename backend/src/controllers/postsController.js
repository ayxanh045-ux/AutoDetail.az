const fs = require('fs/promises');
const path = require('path');
const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');
// AI moderation removed by request.

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

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
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
  res.json({ post: rows[0] });
});

const updatePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const { email, title, description, part_type, car_brand, car_model, car_year, car_color, price, price_currency } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [userRows] = await pool.query(
    'SELECT idUsers, role FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (userRows.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const user = userRows[0];

  const [postRows] = await pool.query('SELECT user_id FROM posts WHERE id = ? LIMIT 1', [id]);
  if (postRows.length === 0) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const isOwner = Number(postRows[0].user_id) === Number(user.idUsers);
  const isAdmin = String(user.role).toLowerCase() === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Not allowed.' });
  }

  const yearValue = car_year ? Number(car_year) : null;
  const priceValue = price !== undefined && price !== null && price !== '' ? Number(price) : null;
  const normalizedCurrency = price_currency ? String(price_currency).trim() : null;
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

  const normalizedEmail = String(email).trim().toLowerCase();
  const [userRows] = await pool.query(
    'SELECT idUsers, role FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (userRows.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const user = userRows[0];

  const [postRows] = await pool.query('SELECT user_id FROM posts WHERE id = ? LIMIT 1', [id]);
  if (postRows.length === 0) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const isOwner = Number(postRows[0].user_id) === Number(user.idUsers);
  const isAdmin = String(user.role).toLowerCase() === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Not allowed.' });
  }

  await pool.query('DELETE FROM posts WHERE id = ?', [id]);
  return res.json({ success: true });
});

module.exports = { createPost, getPosts, getPostById, updatePost, deletePost };
