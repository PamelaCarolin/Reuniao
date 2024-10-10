const db = require('./database');

module.exports = async (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;

    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

        // Verifica se há um conflito de reunião com base na data, sala e horário
        const conflictQuery = `
            SELECT *, (time + INTERVAL '1 minute' * duration) AS end_time
            FROM meetings
            WHERE date = $1 AND room = $2 AND (
                ($3::time BETWEEN time AND (time + INTERVAL '1 minute' * duration))
                OR
                (($3::time + INTERVAL '1 minute' * $4) BETWEEN time AND (time + INTERVAL '1 minute' * duration))
            )
        `;
        const conflictValues = [date, room, time, duration];
        const { rows } = await clientDB.query(conflictQuery, conflictValues);

        if (rows.length > 0) {
            await clientDB.query('ROLLBACK');
            const conflict = rows[0];
            const formattedEndTime = new Date(`1970-01-01T${conflict.end_time}`).toISOString().slice(11, 19); // Formatar corretamente o horário final

            return res.status(400).json({
                success: false,
                conflict: {
                    date: conflict.date,
                    time: conflict.time,
                    endTime: formattedEndTime,  // Envia o horário final formatado
                    speaker: conflict.speaker,
                    room: conflict.room,
                    client: conflict.client
                }
            });
        }

        // Se não houver conflito, insere a nova reunião
        const insertQuery = `
            INSERT INTO meetings (date, time, duration, sector, speaker, room, client)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const insertValues = [date, time, duration, sector, speaker, room, client];
        await clientDB.query(insertQuery, insertValues);

        await clientDB.query('COMMIT');

        // Enviar uma resposta de sucesso
        res.json({ success: true, message: 'Reunião agendada com sucesso!' });
    } catch (err) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao agendar reunião:', err);
        res.status(500).json({ error: 'Erro ao agendar reunião' });
    } finally {
        clientDB.release();
    }
};
