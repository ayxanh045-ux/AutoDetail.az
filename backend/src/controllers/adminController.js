const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');

const getAdminUser = async (req) => {
  const email =
    (req.query && req.query.email) ||
    (req.body && req.body.email) ||
    req.headers['x-admin-email'];
  if (!email) {
    const err = new Error('Admin email is required.');
    err.statusCode = 400;
    throw err;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT idUsers, role, email FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  const user = rows[0];
  if (String(user.role).toLowerCase() !== 'admin') {
    const err = new Error('Not allowed.');
    err.statusCode = 403;
    throw err;
  }
  return user;
};

const getUsers = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const [rows] = await pool.query(
    'SELECT idUsers, UserName, email, phone, role, created_at FROM Users ORDER BY created_at DESC'
  );
  res.json({ users: rows });
});

const updateUser = asyncHandler(async (req, res) => {
  const admin = await getAdminUser(req);
  const id = Number(req.params.id);
  const { name, phone, role } = req.body || {};
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  if (role && String(role).toLowerCase() === 'admin' && admin.idUsers === id) {
    // ok to keep self admin
  }
  await pool.query(
    'UPDATE Users SET UserName = COALESCE(?, UserName), phone = COALESCE(?, phone), role = COALESCE(?, role) WHERE idUsers = ?',
    [name ? String(name).trim() : null, phone ? String(phone).trim() : null, role ? String(role).trim() : null, id]
  );
  res.json({ success: true });
});

const deleteUser = asyncHandler(async (req, res) => {
  const admin = await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  if (admin.idUsers === id) {
    return res.status(400).json({ error: 'Cannot delete yourself.' });
  }
  await pool.query('DELETE FROM Users WHERE idUsers = ?', [id]);
  res.json({ success: true });
});

const getPosts = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const [rows] = await pool.query(
    `SELECT p.id, p.user_id, p.image_url, p.title, p.description, p.part_type, p.car_brand, p.car_model,
            p.car_year, p.car_color, p.price, p.price_currency, p.created_at,
            u.UserName AS user_name, u.email AS user_email
     FROM posts p
     LEFT JOIN Users u ON u.idUsers = p.user_id
     ORDER BY p.created_at DESC`
  );
  res.json({ posts: rows });
});

const updatePost = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  const { title, description, part_type, car_brand, car_model, car_year, car_color, price, price_currency } = req.body || {};
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  const yearValue = car_year ? Number(car_year) : null;
  const priceValue = price !== undefined && price !== null && price !== '' ? Number(price) : null;
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
      price_currency ? String(price_currency).trim() : null,
      id
    ]
  );
  res.json({ success: true });
});

const deletePost = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  await pool.query('DELETE FROM posts WHERE id = ?', [id]);
  res.json({ success: true });
});

const getCars = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const [rows] = await pool.query('SELECT id, brand, model, year, color FROM Cars ORDER BY brand, model, year');
  res.json({ cars: rows });
});

const addCar = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const { brand, model, year, color } = req.body || {};
  if (!brand || !model || !year || !color) {
    return res.status(400).json({ error: 'Brand, model, year, color required.' });
  }
  const yearValue = Number(year);
  if (!Number.isFinite(yearValue)) {
    return res.status(400).json({ error: 'Year must be number.' });
  }
  await pool.query(
    'INSERT INTO Cars (brand, model, year, color) VALUES (?, ?, ?, ?)',
    [String(brand).trim(), String(model).trim(), yearValue, String(color).trim()]
  );
  res.status(201).json({ success: true });
});

const deleteCar = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  await pool.query('DELETE FROM Cars WHERE id = ?', [id]);
  res.json({ success: true });
});

const getCarModels = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const [rows] = await pool.query('SELECT id, brand, model FROM CarModels ORDER BY brand, model');
  res.json({ models: rows });
});

const addCarModel = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const { brand, model } = req.body || {};
  if (!brand || !model) {
    return res.status(400).json({ error: 'Brand and model required.' });
  }
  await pool.query(
    'INSERT IGNORE INTO CarModels (brand, model) VALUES (?, ?)',
    [String(brand).trim(), String(model).trim()]
  );
  res.status(201).json({ success: true });
});

const deleteCarModel = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  await pool.query('DELETE FROM CarModels WHERE id = ?', [id]);
  res.json({ success: true });
});

const getParts = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const [rows] = await pool.query('SELECT id, category, name FROM Parts ORDER BY category, name');
  res.json({ parts: rows });
});

const addPart = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const { category, name } = req.body || {};
  if (!category || !name) {
    return res.status(400).json({ error: 'Category and name required.' });
  }
  await pool.query('INSERT INTO Parts (category, name) VALUES (?, ?)', [
    String(category).trim(),
    String(name).trim()
  ]);
  res.status(201).json({ success: true });
});

const deletePart = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  await pool.query('DELETE FROM Parts WHERE id = ?', [id]);
  res.json({ success: true });
});

const getPendingUsers = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, verification_code, verification_expires, created_at FROM PendingUsers ORDER BY created_at DESC'
  );
  res.json({ pending_users: rows });
});

const deletePendingUser = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  await pool.query('DELETE FROM PendingUsers WHERE id = ?', [id]);
  res.json({ success: true });
});

const getPendingCars = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const [rows] = await pool.query(
    'SELECT id, brand, model, year, color, requested_by, created_at FROM PendingCars ORDER BY created_at DESC'
  );
  res.json({ pending_cars: rows });
});

const approvePendingCar = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  const [rows] = await pool.query(
    'SELECT brand, model, year, color FROM PendingCars WHERE id = ? LIMIT 1',
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Not found.' });
  }
  const car = rows[0];
  await pool.query(
    'INSERT INTO Cars (brand, model, year, color) VALUES (?, ?, ?, ?)',
    [car.brand, car.model, car.year, car.color]
  );
  await pool.query('DELETE FROM PendingCars WHERE id = ?', [id]);
  res.json({ success: true });
});

const deletePendingCar = asyncHandler(async (req, res) => {
  await getAdminUser(req);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  await pool.query('DELETE FROM PendingCars WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getPosts,
  updatePost,
  deletePost,
  getCars,
  addCar,
  deleteCar,
  getCarModels,
  addCarModel,
  deleteCarModel,
  getParts,
  addPart,
  deletePart,
  getPendingUsers,
  deletePendingUser,
  getPendingCars,
  approvePendingCar,
  deletePendingCar
};
