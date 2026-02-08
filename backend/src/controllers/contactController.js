const { asyncHandler } = require('../utils/asyncHandler');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_TO } = require('../config/env');
const nodemailer = require('nodemailer');

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

const sendContact = asyncHandler(async (req, res) => {
  const { message, emailOrPhone } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (!mailer) {
    return res.status(500).json({ error: 'SMTP not configured.' });
  }
  const from = SMTP_FROM || SMTP_USER;
  const to = CONTACT_TO || SMTP_USER;
  const subject = 'AutoDetail.az | Kontakt mesajı';
  const text = `Əlaqə: ${emailOrPhone || '-'}\n\nMesaj:\n${message}`;
  await mailer.sendMail({ from, to, subject, text });
  res.json({ message: 'Mesaj göndərildi.' });
});

module.exports = { sendContact };
