const db = require('./database');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { date, time, duration, sector, speaker, room, client } = req.body;
        const clientDB = await db.connect();

        try {
            await clientDB.query('BEGIN');

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
                    return res.status(400).json({
                        success: false,
                        conflict: {
                            date: conflict.date,
                            time: conflict.time,
                            speaker: conflict.speaker,
                            room: conflict.room,
                            client: conflict.client
                        }
                    });
                }
            }

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
        // Lógica de reagendamento
        const { id, newDate } = req.body;
        const clientDB = await db.connect();

        try {
            await clientDB.query('BEGIN');

            const [date, time] = newDate.split(' ');

            const conflictQuery = `
                SELECT * FROM meetings 
                WHERE date = $1 AND time = $2 AND id <> $3
            `;
            const { rows } = await clientDB.query(conflictQuery, [date, time, id]);

            if (rows.length > 0) {
                await clientDB.query('ROLLBACK');
                return res.status(400).json({ error: 'Horário já ocupado' });
            }

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
