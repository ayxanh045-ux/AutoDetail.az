const mysql = require('mysql2/promise');
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SSL_CA,
  DB_SSL_REJECT_UNAUTHORIZED
} = require('./config/env');

const ca = DB_SSL_CA ? DB_SSL_CA.replace(/\\n/g, '\n') : '';
const ssl = ca
  ? {
      ca,
      rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  : undefined;

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = { pool };
