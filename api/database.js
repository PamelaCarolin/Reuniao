const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://default:8DOfXcRSwg1h@ep-sweet-night-a4g91n22.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
