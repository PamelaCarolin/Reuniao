const db = require('./database');

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

        // Converte o campo `date` para uma string formatada `YYYY-MM-DD`
        const formattedRows = rows.map(meeting => {
            if (!(meeting.date instanceof Date)) {
                meeting.date = new Date(meeting.date);
            }

            // Formata a data para YYYY-MM-DD
            const year = meeting.date.getFullYear();
            const month = String(meeting.date.getMonth() + 1).padStart(2, '0');
            const day = String(meeting.date.getDate()).padStart(2, '0');
            meeting.date = `${year}-${month}-${day}`;

            return meeting;
        });

        res.json(formattedRows);
    } catch (err) {
        console.error('Erro ao consultar reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar reuniões' });
    }
};
