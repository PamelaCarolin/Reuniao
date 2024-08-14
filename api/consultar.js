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

        // Abaixo corrigimos a manipulação do campo de data para trabalhar diretamente com objetos Date
        const formattedRows = rows.map(meeting => {
            const meetingDate = new Date(meeting.date); // Converte o campo `date` para um objeto Date se não for
            meeting.date = meetingDate.toISOString().split('T')[0]; // Converte para o formato ISO (YYYY-MM-DD)
            return meeting;
        });

        res.json(formattedRows);
    } catch (err) {
        console.error('Erro ao consultar reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar reuniões' });
    }
};
