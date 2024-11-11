const db = require('./database');

module.exports = async (req, res) => {
    const { startDate, endDate, sector, speaker, room } = req.query;

    try {
        let query = `SELECT * FROM historico_reunioes WHERE 1=1`;
        const queryParams = [];

        if (startDate) {
            queryParams.push(startDate);
            query += ` AND date >= $${queryParams.length}`;
        }

        if (endDate) {
            queryParams.push(endDate);
            query += ` AND date <= $${queryParams.length}`;
        }

        if (sector) {
            queryParams.push(sector);
            query += ` AND sector = $${queryParams.length}`;
        }

        if (speaker) {
            queryParams.push(speaker);
            query += ` AND speaker = $${queryParams.length}`;
        }

        if (room) {
            queryParams.push(room);
            query += ` AND room = $${queryParams.length}`;
        }

        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
