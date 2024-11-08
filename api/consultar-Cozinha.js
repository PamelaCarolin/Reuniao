const express = require('express');
const app = express();
const db = require('./database'); // Presume que você tem um arquivo de conexão com o banco de dados

// Rota para consultar reservas da cozinha
app.get('/consultar-cozinha', async (req, res) => {
    const { date } = req.query; // Obtém a data a partir dos parâmetros da URL

    try {
        let query, values;

        if (date) {
            // Consulta para uma data específica
            query = `SELECT * FROM kitchen_reservations WHERE date = $1`;
            values = [date];
        } else {
            // Consulta para todas as reservas (usado para carregar todas para cancelamento)
            query = `SELECT * FROM kitchen_reservations ORDER BY date, time`;
            values = [];
        }

        const result = await db.query(query, values);

        res.json(result.rows); // Retorna os dados em formato JSON
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao consultar reservas da cozinha.' });
    }
});
