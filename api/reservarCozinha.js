const db = require('./database');

module.exports = async (req, res) => {
    const { date, time, duration, team, reason } = req.body;

    try {
        // Inserção da reserva na tabela `kitchen_reservations`
        const insertQuery = `
            INSERT INTO kitchen_reservations (date, time, duration, team, reason) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        const insertValues = [date, time, duration, team, reason];
        await db.query(insertQuery, insertValues);

        res.json({ success: true, message: 'Reserva da cozinha feita com sucesso!' });
    } catch (err) {
        console.error('Erro ao reservar cozinha:', err);
        res.status(500).json({ error: 'Erro ao reservar cozinha' });
    }
};
