const db = require('./database');

module.exports = async (req, res) => {
    try {
        // Captura os parâmetros de consulta enviados pela URL
        const { date, client, speaker, room, sector } = req.query;

        let query = `SELECT id, date, time, duration, sector, speaker, room, client FROM meetings WHERE 1=1`;
        const values = [];

        if (date) {
            query += ` AND date = $${values.length + 1}`;
            values.push(date);
        }
        if (client) {
            query += ` AND LOWER(client) LIKE LOWER($${values.length + 1})`;
            values.push(`%${client}%`);
        }
        if (speaker) {
            query += ` AND LOWER(speaker) LIKE LOWER($${values.length + 1})`;
            values.push(`%${speaker}%`);
        }
        if (room) {
            query += ` AND room = $${values.length + 1}`;
            values.push(room);
        }
        if (sector) {
            query += ` AND LOWER(sector) LIKE LOWER($${values.length + 1})`;
            values.push(`%${sector}%`);
        }

        query += ` ORDER BY date, time`;

        // Executa a consulta no banco de dados
        const { rows } = await db.query(query, values);

        // Retorna os resultados em formato JSON
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao consultar reuniões:', error);
        res.status(500).json({ error: 'Erro ao consultar reuniões. Por favor, tente novamente mais tarde.' });
    }
};
