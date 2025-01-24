const db = require('./database');

module.exports = async (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;
    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

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
                // Inclui o horário final da reunião para exibir no alerta de conflito
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

        // Inserção da reunião na tabela principal
        const insertQuery = `
            INSERT INTO meetings (date, time, duration, sector, speaker, room, client) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const insertValues = [date, time, duration, sector, speaker, room, client];
        await clientDB.query(insertQuery, insertValues);

        // Copiar reunião para o histórico
        const historyQuery = `
            INSERT INTO historico_reunioes (date, time, duration, sector, speaker, room, client, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendada')
        `;
        const historyValues = [date, time, duration, sector, speaker, room, client];
        await clientDB.query(historyQuery, historyValues);

        await clientDB.query('COMMIT');
        res.json({ success: true, message: 'Reunião agendada com sucesso!' });

    } catch (err) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao agendar reunião:', err);
        res.status(500).json({ error: 'Erro ao agendar reunião' });
    } finally {
        clientDB.release();
    }
};
