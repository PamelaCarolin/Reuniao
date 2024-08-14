module.exports = async (req, res) => {
    const { date, client, room, sector } = req.query;
    let query = `SELECT id, date, time, duration, sector, speaker, room, client FROM meetings WHERE 1=1`;
    const queryParams = [];

    if (date) {
        query += ` AND date = $${queryParams.length + 1}`;
        queryParams.push(date);
    }

    if (client) {
        query += ` AND client LIKE $${queryParams.length + 1}`;
        queryParams.push(`%${client}%`);
    }

    if (room) {
        query += ` AND room = $${queryParams.length + 1}`;
        queryParams.push(room);
    }

    if (sector) {
        query += ` AND sector LIKE $${queryParams.length + 1}`;
        queryParams.push(`%${sector}%`);
    }

    try {
        const { rows } = await db.query(query, queryParams);

        // Aqui transformamos a data em string
        rows.forEach(meeting => {
            meeting.date = new Date(meeting.date).toISOString().split('T')[0]; // Converte para string no formato ISO
        });

        res.json(rows);
    } catch (err) {
        console.error('Erro ao consultar reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar reuniões' });
    }
};
