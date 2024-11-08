require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Necessário para conexões seguras em alguns provedores
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect()
};
