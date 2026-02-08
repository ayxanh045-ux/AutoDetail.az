const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { asyncHandler } = require('../utils/asyncHandler');
const { pool } = require('../db');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FRONTEND_URL } = require('../config/env');

const mailer = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    })
  : null;

const sendVerificationEmail = async (email, code) => {
  if (!mailer) {
    return;
  }
  const from = SMTP_FROM || SMTP_USER;
  const subject = 'AutoDetail.az | Email təsdiqi';
  const text = `Təsdiq kodunuz: ${code}\nKod 10 dəqiqə ərzində etibarlıdır.`;
  await mailer.sendMail({ from, to: email, subject, text });
};

const sendPasswordResetEmail = async (email, token) => {
  if (!mailer) {
    return;
  }
  const from = SMTP_FROM || SMTP_USER;
  const resetLink = `${FRONTEND_URL}/reset.html?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const subject = 'AutoDetail.az | Parolun sıfırlanması';
  const text = `Parolu sıfırlamaq üçün link:\n${resetLink}\n\nLink 30 dəqiqə ərzində etibarlıdır.`;
  await mailer.sendMail({ from, to: email, subject, text });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();
  const normalizedPhone = phone ? String(phone).trim() : null;

  const [existing] = await pool.query('SELECT idUsers FROM Users WHERE email = ? LIMIT 1', [
    normalizedEmail
  ]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'User already exists.' });
  }

  const [pendingExisting] = await pool.query(
    'SELECT id FROM PendingUsers WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  if (pendingExisting.length > 0) {
    return res.status(409).json({ error: 'Verification already sent. Please verify email.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    'INSERT INTO PendingUsers (name, email, password_hash, verification_code, verification_expires, phone) VALUES (?, ?, ?, ?, ?, ?)',
    [trimmedName, normalizedEmail, passwordHash, verificationCode, verificationExpires, normalizedPhone]
  );

  await sendVerificationEmail(normalizedEmail, verificationCode);

  return res.status(201).json({
    message: 'Verification code sent.',
    user: { name: trimmedName, email: normalizedEmail }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT idUsers, UserName, email, password FROM Users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordOk = await bcrypt.compare(String(password), user.password);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.json({
    message: 'Login successful.',
    user: { id: user.idUsers, name: user.UserName, email: user.email }
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, verification_code, verification_expires, phone FROM PendingUsers WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  const pending = rows[0];

  if (!pending) {
    return res.status(404).json({ error: 'Verification not found.' });
  }
  if (new Date(pending.verification_expires).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Verification code expired.' });
  }
  if (String(pending.verification_code) !== String(code).trim()) {
    return res.status(400).json({ error: 'Invalid verification code.' });
  }

  const [existing] = await pool.query('SELECT idUsers FROM Users WHERE email = ? LIMIT 1', [
    normalizedEmail
  ]);
  if (existing.length > 0) {
    await pool.query('DELETE FROM PendingUsers WHERE id = ?', [pending.id]);
    return res.json({ message: 'Email already verified.' });
  }

  await pool.query(
    'INSERT INTO Users (UserName, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
    [pending.name, pending.email, pending.password_hash, 'user', pending.phone || null]
  );
  await pool.query('DELETE FROM PendingUsers WHERE id = ?', [pending.id]);

  return res.json({ message: 'Email verified successfully.' });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await pool.query('SELECT idUsers FROM Users WHERE email = ? LIMIT 1', [
    normalizedEmail
  ]);

  if (rows.length === 0) {
    return res.json({ message: 'If the email exists, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await pool.query('DELETE FROM PasswordResets WHERE email = ?', [normalizedEmail]);
  await pool.query(
    'INSERT INTO PasswordResets (email, token, expires_at) VALUES (?, ?, ?)',
    [normalizedEmail, token, expiresAt]
  );

  await sendPasswordResetEmail(normalizedEmail, token);
  return res.json({ message: 'If the email exists, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body || {};
  if (!email || !token || !password) {
    return res.status(400).json({ error: 'Email, token and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT id, token, expires_at FROM PasswordResets WHERE email = ? AND token = ? LIMIT 1',
    [normalizedEmail, String(token).trim()]
  );

  if (rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired token.' });
  }
  const resetRow = rows[0];
  if (new Date(resetRow.expires_at).getTime() < Date.now()) {
    await pool.query('DELETE FROM PasswordResets WHERE id = ?', [resetRow.id]);
    return res.status(400).json({ error: 'Invalid or expired token.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  await pool.query('UPDATE Users SET password = ? WHERE email = ?', [passwordHash, normalizedEmail]);
  await pool.query('DELETE FROM PasswordResets WHERE id = ?', [resetRow.id]);

  return res.json({ message: 'Password updated successfully.' });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT id, verification_code, verification_expires FROM PendingUsers WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  const pending = rows[0];

  if (!pending) {
    return res.status(404).json({ error: 'Verification not found.' });
  }

  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    'UPDATE PendingUsers SET verification_code = ?, verification_expires = ? WHERE id = ?',
    [verificationCode, verificationExpires, pending.id]
  );
  await sendVerificationEmail(normalizedEmail, verificationCode);

  return res.json({ message: 'Verification code sent.' });
});

module.exports = { register, login, verifyEmail, resendVerification, requestPasswordReset, resetPassword };
