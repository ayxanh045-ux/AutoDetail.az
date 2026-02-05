const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const profileRouter = require('./profile');
const carsRouter = require('./cars');
const postsRouter = require('./posts');
const partsRouter = require('./parts');
const adminRouter = require('./admin');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Autodetail API' });
});

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/cars', carsRouter);
router.use('/posts', postsRouter);
router.use('/parts', partsRouter);
router.use('/admin', adminRouter);

module.exports = router;
