const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');
const sharp = require('sharp');
const { uploadBuffer, destroyByUrl } = require('../utils/cloudinary');

const getProfile = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [users] = await pool.query(
    'SELECT idUsers, UserName, email, role, created_at, profile_image_url, phone FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const user = users[0];

  const [posts] = await pool.query(
    'SELECT id, image_url, title, part_type, car_brand, car_model, car_year, car_color, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC',
    [user.idUsers]
  );

  return res.json({
    user: {
      id: user.idUsers,
      name: user.UserName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      profile_image_url: user.profile_image_url
    },
    posts
  });
});

const updateProfileImage = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Image is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [existingRows] = await pool.query(
    'SELECT profile_image_url FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  let buffer = req.file.buffer;
  try {
    buffer = await sharp(buffer)
      .rotate()
      .resize(512, 512, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    // keep original buffer
  }

  const upload = await uploadBuffer(buffer, { folder: 'autodetail/profiles' });
  const imageUrl = upload.secure_url;

  await pool.query('UPDATE Users SET profile_image_url = ? WHERE email = ?', [
    imageUrl,
    normalizedEmail
  ]);

  if (existingRows.length && existingRows[0].profile_image_url) {
    await destroyByUrl(existingRows[0].profile_image_url);
  }

  return res.json({ image_url: imageUrl });
});

const removeProfileImage = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [users] = await pool.query(
    'SELECT profile_image_url FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const currentUrl = users[0].profile_image_url;
  await pool.query('UPDATE Users SET profile_image_url = NULL WHERE email = ?', [normalizedEmail]);
  if (currentUrl) {
    await destroyByUrl(currentUrl);
  }

  return res.json({ success: true });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { email, name, phone } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();
  const normalizedPhone = phone ? String(phone).trim() : null;

  await pool.query(
    'UPDATE Users SET UserName = ?, phone = ? WHERE email = ?',
    [trimmedName, normalizedPhone, normalizedEmail]
  );

  const [users] = await pool.query(
    'SELECT idUsers, UserName, email, role, created_at, profile_image_url, phone FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const user = users[0];
  return res.json({
    user: {
      id: user.idUsers,
      name: user.UserName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      profile_image_url: user.profile_image_url
    }
  });
});

module.exports = { getProfile, updateProfileImage, removeProfileImage, updateProfile };
