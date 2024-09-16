const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
    return;
  }
  console.log("Connected to PostgreSQL successfully!");
  release();
});

// Xử lý lỗi trong quá trình hoạt động của pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err.stack);
});

module.exports = pool;
