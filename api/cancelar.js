const db = require('./database');

module.exports = async (req, res) => {
    const { id } = req.body;

    try {
        // Inicia uma transação
        const clientDB = await db.connect();
        await clientDB.query('BEGIN');

        // Busca os detalhes da reunião antes de deletá-la
        const selectQuery = `SELECT * FROM meetings WHERE id = $1`;
        const { rows } = await clientDB.query(selectQuery, [id]);

        if (rows.length === 0) {
            await clientDB.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Reunião não encontrada.' });
        }

        const meeting = rows[0];

        // Inserir a reunião cancelada no histórico com o status "cancelada"
        const historyQuery = `
            INSERT INTO historico_reunioes (date, time, duration, sector, speaker, room, client, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'cancelada')
        `;
        const historyValues = [meeting.date, meeting.time, meeting.duration, meeting.sector, meeting.speaker, meeting.room, meeting.client];
        await clientDB.query(historyQuery, historyValues);

        // Deleta a reunião da tabela principal
        const deleteQuery = `DELETE FROM meetings WHERE id = $1`;
        await clientDB.query(deleteQuery, [id]);

        // Confirma a transação
        await clientDB.query('COMMIT');

        res.json({ success: true, message: 'Reunião cancelada com sucesso!' });
    } catch (err) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao cancelar reunião:', err);
        res.status(500).json({ error: 'Erro ao cancelar reunião' });
    } finally {
        clientDB.release();
    }
};
