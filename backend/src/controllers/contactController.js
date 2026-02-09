const { asyncHandler } = require('../utils/asyncHandler');
const { CONTACT_TO, RESEND_API_KEY, RESEND_FROM } = require('../config/env');
const fetch = global.fetch || require('node-fetch');

const sendContact = asyncHandler(async (req, res) => {
  const { message, emailOrPhone } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (!RESEND_API_KEY || !RESEND_FROM) {
    return res.status(500).json({ error: 'Email provider not configured.' });
  }
  const to = CONTACT_TO || RESEND_FROM;
  const subject = 'AutoDetail.az | Kontakt mesajı';
  const text = `Əlaqə: ${emailOrPhone || '-'}\n\nMesaj:\n${message}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject,
      text
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Resend error:', errorText);
    return res.status(500).json({ error: 'Email send failed.' });
  }
  res.json({ message: 'Mesaj göndərildi.' });
});

module.exports = { sendContact };
