const db = require('./database');

module.exports = async (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;

    try {
        const conflictQuery = `
            SELECT * FROM meetings 
            WHERE date = $1 AND room = $2 AND 
            (
                ($3::time BETWEEN time AND time + interval '1 minute' * duration) OR 
                ($3::time + interval '1 minute' * $4 BETWEEN time AND time + interval '1 minute' * duration)
            )
        `;
        const conflictValues = [date, room, time, duration];
        const { rows } = await db.query(conflictQuery, conflictValues);

        if (rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Horário de reunião conflita com uma existente.' });
        }

        const insertQuery = `
            INSERT INTO meetings (date, time, duration, sector, speaker, room, client) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const insertValues = [date, time, duration, sector, speaker, room, client];
        await db.query(insertQuery, insertValues);

        res.json({ success: true, message: 'Reunião agendada com sucesso!' });
    } catch (err) {
        console.error('Erro ao agendar reunião:', err);
        res.status(500).json({ error: 'Erro ao agendar reunião' });
    }
};
