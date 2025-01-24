const db = require('./database');

module.exports = async (req, res) => {
    const { id, date, time, duration, sector, speaker, room, client } = req.body;
    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

        // Se um ID for fornecido, deletar a reunião existente antes de criar uma nova
        if (id) {
            const deleteQuery = `DELETE FROM meetings WHERE id = $1`;
            const deleteHistoryQuery = `UPDATE historico_reunioes SET status = 'cancelada' WHERE id = $1`;
            await clientDB.query(deleteQuery, [id]);
            await clientDB.query(deleteHistoryQuery, [id]);
        }

        // Se a reunião for na sala "Teams", ignorar a verificação de conflitos
        if (room.toLowerCase() !== 'teams') {
            const conflictQuery = `
                SELECT * FROM meetings 
                WHERE date = $1 AND room = $2 AND 
                (
                    ($3::time BETWEEN time AND time + interval '1 minute' * duration) OR 
                    ($3::time + interval '1 minute' * $4 BETWEEN time AND time + interval '1 minute' * duration)
                )
            `;
            const conflictValues = [date, room, time, duration];
            const { rows } = await clientDB.query(conflictQuery, conflictValues);

            if (rows.length > 0) {
                await clientDB.query('ROLLBACK');
                const conflict = rows[0];
                const conflictEndTime = new Date(new Date(`1970-01-01T${conflict.time}`).getTime() + conflict.duration * 60000)
                    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return res.status(400).json({
                    success: false,
                    conflict: {
                        date: conflict.date,
                        time: conflict.time,
                        endTime: conflictEndTime,
                        speaker: conflict.speaker,
                        room: conflict.room,
                        client: conflict.client
                    }
                });
            }
        }

        // Inserção da nova reunião na tabela principal
        const insertQuery = `
            INSERT INTO meetings (date, time, duration, sector, speaker, room, client) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        const insertValues = [date, time, duration, sector, speaker, room, client];
        const result = await clientDB.query(insertQuery, insertValues);
        const newMeetingId = result.rows[0].id;

        // Copiar reunião para o histórico com status de "reagendada"
        const historyQuery = `
            INSERT INTO historico_reunioes (id, date, time, duration, sector, speaker, room, client, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'reagendada')
        `;
        const historyValues = [newMeetingId, date, time, duration, sector, speaker, room, client];
        await clientDB.query(historyQuery, historyValues);

        await clientDB.query('COMMIT');
        res.json({ success: true, message: 'Reunião reagendada com sucesso!' });

    } catch (err) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao reagendar reunião:', err);
        res.status(500).json({ error: 'Erro ao reagendar reunião' });
    } finally {
        clientDB.release();
    }
};
