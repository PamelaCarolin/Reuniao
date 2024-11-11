const db = require('./database');

module.exports = async (req, res) => {
    const { id } = req.body;

    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

        // Primeiro, obtenha os detalhes da reunião que será cancelada
        const selectQuery = `SELECT * FROM meetings WHERE id = $1`;
        const { rows } = await clientDB.query(selectQuery, [id]);

        if (rows.length === 0) {
            await clientDB.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Reunião não encontrada.' });
        }

        const meeting = rows[0];

        // Insere a reunião na tabela de histórico antes de deletá-la da tabela principal
        const insertQuery = `
            INSERT INTO meetings_historico (date, time, duration, sector, speaker, room, client, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        const insertValues = [
            meeting.date,
            meeting.time,
            meeting.duration,
            meeting.sector,
            meeting.speaker,
            meeting.room,
            meeting.client,
            'Concluída'  // Define o status como "Concluída" ao mover para o histórico
        ];
        await clientDB.query(insertQuery, insertValues);

        // Agora, exclua a reunião da tabela principal
        const deleteQuery = `DELETE FROM meetings WHERE id = $1`;
        await clientDB.query(deleteQuery, [id]);

        await clientDB.query('COMMIT');

        res.json({ success: true, message: 'Reunião cancelada com sucesso e movida para o histórico.' });
    } catch (err) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao cancelar reunião:', err);
        res.status(500).json({ error: 'Erro ao cancelar reunião' });
    } finally {
        clientDB.release();
    }
};
