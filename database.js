const { Pool } = require('pg');

const pool = new Pool({
  user: 'seu_usuario',          // Substitua pelo seu usuário do PostgreSQL
  host: 'ep-sweet-night-a4g91n22-pooler',  // Substitua pelo seu host do PostgreSQL
  database: 'sua_database',     // Substitua pelo nome do seu banco de dados
  password: 'sua_senha',        // Substitua pela sua senha do PostgreSQL
  port: 5432,                   // Porta padrão do PostgreSQL
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
