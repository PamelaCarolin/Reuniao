const db = require('./database');

module.exports = async (req, res) => {
    const { id } = req.body;

    try {
        // Obtenha os dados da reunião antes de excluí-la
        const { rows } = await db.query('SELECT * FROM meetings WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Reunião não encontrada.' });
        }
        const meeting = rows[0];

        // Insira a reunião na tabela de histórico
        const insertQuery = `
            INSERT INTO historico_reunioes (date, time, duration, sector, speaker, room, client, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Cancelada')
        `;
        const insertValues = [
            meeting.date,
            meeting.time,
            meeting.duration,
            meeting.sector,
            meeting.speaker,
            meeting.room,
            meeting.client
        ];
        await db.query(insertQuery, insertValues);

        // Exclua a reunião da tabela principal
        const deleteQuery = `DELETE FROM meetings WHERE id = $1`;
        await db.query(deleteQuery, [id]);

        res.json({ success: true, message: 'Reunião cancelada e movida para o histórico com sucesso!' });
    } catch (err) {
        console.error('Erro ao cancelar reunião:', err);
        res.status(500).json({ error: 'Erro ao cancelar reunião' });
    }
};
