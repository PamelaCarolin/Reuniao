const db = require('./database');

module.exports = async (req, res) => {
    const { date } = req.query; // Parâmetro de data para consulta

    try {
        let query, values;

        if (date) {
            // Consulta para reservas de uma data específica
            query = `SELECT * FROM kitchen_reservations WHERE date = $1 ORDER BY time`;
            values = [date];
        } else {
            // Consulta para todas as reservas
            query = `SELECT * FROM kitchen_reservations ORDER BY date, time`;
            values = [];
        }

        const result = await db.query(query, values);

        res.status(200).json(result.rows); // Retorna as reservas em JSON
    } catch (error) {
        console.error("Erro ao consultar reservas da cozinha:", error);
        res.status(500).json({ success: false, message: 'Erro ao consultar reservas da cozinha.', error: error.message });
    }
};
