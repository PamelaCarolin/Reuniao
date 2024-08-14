const db = require('./database');

module.exports = async (req, res) => {
    const { date, client, room, sector, speaker } = req.query;
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

    if (speaker) {
        query += ` AND speaker LIKE $${queryParams.length + 1}`;
        queryParams.push(`%${speaker}%`);
    }

    try {
        const { rows } = await db.query(query, queryParams);
        
        // Certifica-se que as datas sejam formatadas corretamente no formato ISO antes da ordenação
        rows.forEach(meeting => {
            meeting.date = new Date(meeting.date.split('/').reverse().join('-')).toISOString().split('T')[0];
        });

        // Ordena as reuniões por data e horário
        rows.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        res.json(rows);
    } catch (err) {
        console.error('Erro ao consultar reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar reuniões' });
    }
};
