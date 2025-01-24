const db = require('./database');

module.exports = async (req, res) => {
    const { date, client, room, sector, status, sortBy, order } = req.query;
    let query = `SELECT id, date, time, duration, sector, speaker, room, client FROM meetings WHERE 1=1`;
    const queryParams = [];

    // Filtros opcionais
    if (date) {
        query += ` AND date = $${queryParams.length + 1}`;
        queryParams.push(date);
    }

    if (client) {
        query += ` AND client ILIKE $${queryParams.length + 1}`;
        queryParams.push(`%${client}%`);
    }

    if (room) {
        query += ` AND room = $${queryParams.length + 1}`;
        queryParams.push(room);
    }

    if (sector) {
        query += ` AND sector ILIKE $${queryParams.length + 1}`;
        queryParams.push(`%${sector}%`);
    }

    if (status) {
        query += ` AND status = $${queryParams.length + 1}`;
        queryParams.push(status);
    }

    // Ordenação dos resultados
    if (sortBy && order) {
        const validColumns = ['date', 'time', 'speaker', 'room'];
        if (validColumns.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
        }
    } else {
        query += ` ORDER BY date ASC, time ASC`; // Ordenação padrão por data e hora
    }

    try {
        const { rows } = await db.query(query, queryParams);

        // Formata a data no padrão DD/MM/YYYY
        const formattedRows = rows.map(meeting => {
            if (!(meeting.date instanceof Date)) {
                meeting.date = new Date(meeting.date);
            }

            const day = String(meeting.date.getDate()).padStart(2, '0');
            const month = String(meeting.date.getMonth() + 1).padStart(2, '0');
            const year = meeting.date.getFullYear();
            meeting.date = `${day}/${month}/${year}`;

            return meeting;
        });

        if (formattedRows.length === 0) {
            return res.status(404).json({ message: 'Nenhuma reunião encontrada para os critérios fornecidos.' });
        }

        res.json(formattedRows);
    } catch (err) {
        console.error('Erro ao consultar reuniões:', err.message);
        res.status(500).json({ error: 'Erro interno ao processar a consulta de reuniões.' });
    }
};
