const { asyncHandler } = require('../utils/asyncHandler');
const { NODE_ENV } = require('../config/env');

const getHealth = asyncHandler(async (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

module.exports = { getHealth };
