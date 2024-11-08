const db = require('./database');

// Rota para reservar a cozinha
app.post('/reservar-cozinha', async (req, res) => {
    const { date, time, duration, team, reason } = req.body;

    try {
        const conflictQuery = `
            SELECT * FROM kitchen_reservations 
            WHERE date = $1 AND time = $2
        `;
        const conflictResult = await db.query(conflictQuery, [date, time]);

        if (conflictResult.rows.length > 0) {
            return res.json({ success: false, message: 'Horário já reservado para essa data.' });
        }

        const insertQuery = `
            INSERT INTO kitchen_reservations (date, time, duration, team, reason)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await db.query(insertQuery, [date, time, duration, team, reason]);

        res.json({ success: true, message: 'Reserva da cozinha realizada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao reservar a cozinha.' });
    }
});

// Rota para consultar reservas da cozinha
app.get('/consultar-cozinha', async (req, res) => {
    const { date } = req.query;

    try {
        const query = `SELECT * FROM kitchen_reservations WHERE date = $1`;
        const result = await db.query(query, [date]);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao consultar reservas.' });
    }
});

// Rota para cancelar uma reserva da cozinha
app.delete('/cancelar-cozinha/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleteQuery = `DELETE FROM kitchen_reservations WHERE id = $1`;
        await db.query(deleteQuery, [id]);

        res.json({ success: true, message: 'Reserva cancelada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao cancelar reserva.' });
    }
});
