const express = require('express');
const { getCars, requestCar, getCarModels } = require('../controllers/carsController');

const router = express.Router();

router.get('/', getCars);
router.get('/models', getCarModels);
router.post('/request', requestCar);

module.exports = router;
