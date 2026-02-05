const express = require('express');
const { getParts } = require('../controllers/partsController');

const router = express.Router();

router.get('/', getParts);

module.exports = router;
