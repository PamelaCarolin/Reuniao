const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://default:8DOfXcRSwg1h@ep-sweet-night-a4g91n22.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),

  // Função para deletar uma reunião
  deletarReuniao: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Deletar a reunião da tabela meetings
      const deleteQuery = 'DELETE FROM meetings WHERE id = $1';
      await client.query(deleteQuery, [id]);

      // Atualizar o status da reunião no histórico para 'cancelada'
      const updateHistoryQuery = 'UPDATE historico_reunioes SET status = $1 WHERE id = $2';
      await client.query(updateHistoryQuery, ['cancelada', id]);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao deletar reunião:', err);
      return false;
    } finally {
      client.release();
    }
  },

  // Função para agendar uma nova reunião
  agendarReuniao: async (data) => {
    const { date, time, duration, sector, speaker, room, client } = data;
    const clientDB = await pool.connect();

    try {
      await clientDB.query('BEGIN');

      const insertQuery = `
        INSERT INTO meetings (date, time, duration, sector, speaker, room, client) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id
      `;
      const insertValues = [date, time, duration, sector, speaker, room, client];
      const result = await clientDB.query(insertQuery, insertValues);
      const newMeetingId = result.rows[0].id;

      // Inserir no histórico com status 'reagendada'
      const historyQuery = `
        INSERT INTO historico_reunioes (id, date, time, duration, sector, speaker, room, client, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'reagendada')
      `;
      const historyValues = [newMeetingId, date, time, duration, sector, speaker, room, client];
      await clientDB.query(historyQuery, historyValues);

      await clientDB.query('COMMIT');
      return newMeetingId;
    } catch (err) {
      await clientDB.query('ROLLBACK');
      console.error('Erro ao agendar reunião:', err);
      return null;
    } finally {
      clientDB.release();
    }
  }
};
