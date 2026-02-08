const express = require('express');
const { getRate } = require('../controllers/ratesController');

const router = express.Router();

router.get('/', getRate);

module.exports = router;
