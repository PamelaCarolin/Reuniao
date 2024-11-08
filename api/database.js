const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('Conectado ao banco de dados');
});

pool.on('error', (err) => {
  console.error('Erro no banco de dados:', err);
});

module.exports = {
  query: async (text, params) => {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (error) {
      console.error('Erro ao executar query:', error);
      throw error;
    }
  },
  connect: () => pool.connect()
};
