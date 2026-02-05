const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Server Error';

  if (process.env.NODE_ENV !== 'production') {
    return res.status(status).json({
      error: message,
      stack: err.stack
    });
  }

  return res.status(status).json({ error: message });
};

module.exports = { errorHandler };
