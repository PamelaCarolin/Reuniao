const db = require('./database');

module.exports = async (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;

    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

        // Lógica para evitar conflitos em todas as salas, exceto "Teams"
        if (room !== 'Teams') {
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
                return res.status(400).json({ 
                    success: false, 
                    message: 'Horário de reunião conflita com uma existente.',
                    conflict: rows[0] // Retorna a reunião conflitante
                });
            }
        }

        // Insere a nova reunião se não houver conflito ou se for na sala "Teams"
        const insertQuery = `
            INSERT INTO meetings (date, time, duration, sector, speaker, room, client) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const insertValues = [date, time, duration, sector, speaker, room, client];
        await clientDB.query(insertQuery, insertValues);

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
