require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Evento para logar quando uma conexão é estabelecida
pool.on('connect', () => {
  console.log('Conectado ao banco de dados');
});

// Evento para logar erros de conexão
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
