const express = require('express');
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyEmail);
router.post('/resend', resendVerification);
router.post('/forgot', requestPasswordReset);
router.post('/reset', resetPassword);

module.exports = router;
