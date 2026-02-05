const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', routes);

// Serve frontend assets
const frontendDir = path.join(__dirname, '../../frontend');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(express.static(frontendDir));
app.use('/uploads', express.static(uploadsDir));

// Root should open about.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'about.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
