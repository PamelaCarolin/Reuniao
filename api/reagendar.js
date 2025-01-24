const db = require('./database');

module.exports = async (req, res) => {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { id, newDate } = req.body;
    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

        const updateQuery = `
            UPDATE meetings 
            SET date = $1, time = $2
            WHERE id = $3
        `;
        const [date, time] = newDate.split(' ');
        await clientDB.query(updateQuery, [date, time, id]);

        const historyQuery = `
            INSERT INTO historico_reunioes (date, time, client, status) 
            SELECT date, time, client, 'reagendada' FROM meetings WHERE id = $1
        `;
        await clientDB.query(historyQuery, [id]);

        await clientDB.query('COMMIT');
        res.json({ success: true, message: 'Reunião reagendada com sucesso!' });
    } catch (error) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao reagendar reunião:', error);
        res.status(500).json({ error: 'Erro ao reagendar reunião' });
    } finally {
        clientDB.release();
    }
};
