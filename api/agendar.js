const db = require('./database');

module.exports = async (req, res) => {
    const clientDB = await db.connect();

    if (req.method === 'POST') {
        // Agendamento de reunião
        const { date, time, duration, sector, speaker, room, client } = req.body;

        try {
            await clientDB.query('BEGIN');

            // Verificar conflitos de horário (exceto para Teams)
            if (room.toLowerCase() !== 'teams') {
                const conflictQuery = `
                    SELECT * FROM meetings 
                    WHERE date = $1 AND room = $2 
                    AND (
                        ($3::time BETWEEN time AND time + interval '1 minute' * duration) OR 
                        ($3::time + interval '1 minute' * $4 BETWEEN time AND time + interval '1 minute' * duration)
                    )
                `;
                const conflictValues = [date, room, time, duration];
                const { rows } = await clientDB.query(conflictQuery, conflictValues);

                if (rows.length > 0) {
                    await clientDB.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        conflict: {
                            date: rows[0].date,
                            time: rows[0].time,
                            speaker: rows[0].speaker,
                            room: rows[0].room,
                            client: rows[0].client
                        }
                    });
                }
            }

            // Inserir reunião
            const insertQuery = `
                INSERT INTO meetings (date, time, duration, sector, speaker, room, client) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            await clientDB.query(insertQuery, [date, time, duration, sector, speaker, room, client]);

            await clientDB.query('COMMIT');
            res.json({ success: true, message: 'Reunião agendada com sucesso!' });

        } catch (err) {
            await clientDB.query('ROLLBACK');
            console.error('Erro ao agendar reunião:', err);
            res.status(500).json({ error: 'Erro ao agendar reunião' });
        } finally {
            clientDB.release();
        }

    } else if (req.method === 'PUT') {
        // Reagendamento de reunião
        const { id, newDate } = req.body;

        try {
            await clientDB.query('BEGIN');

            const [date, time] = newDate.split(' ');

            // Verificar conflito de horários
            const conflictQuery = `
                SELECT * FROM meetings 
                WHERE date = $1 AND time = $2 AND id <> $3
            `;
            const { rows } = await clientDB.query(conflictQuery, [date, time, id]);

            if (rows.length > 0) {
                await clientDB.query('ROLLBACK');
                return res.status(400).json({ error: 'Horário já ocupado' });
            }

            // Atualizar a reunião com a nova data e hora
            const updateQuery = `
                UPDATE meetings 
                SET date = $1, time = $2 
                WHERE id = $3
            `;
            await clientDB.query(updateQuery, [date, time, id]);

            await clientDB.query('COMMIT');
            res.json({ success: true, message: 'Reunião reagendada com sucesso!' });

        } catch (err) {
            await clientDB.query('ROLLBACK');
            console.error('Erro ao reagendar reunião:', err);
            res.status(500).json({ error: 'Erro ao reagendar reunião' });
        } finally {
            clientDB.release();
        }

    } else {
        res.status(405).json({ error: 'Método não permitido' });
    }
};
