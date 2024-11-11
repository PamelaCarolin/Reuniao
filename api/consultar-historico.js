const db = require('./database');

module.exports = async (req, res) => {
    const { dataInicial, dataFinal, setor, orador, sala } = req.query;

    try {
        let query = `SELECT * FROM meetings WHERE 1=1`; // Base da consulta
        const queryParams = [];

        if (dataInicial) {
            queryParams.push(dataInicial);
            query += ` AND date >= $${queryParams.length}`;
        }

        if (dataFinal) {
            queryParams.push(dataFinal);
            query += ` AND date <= $${queryParams.length}`;
        }

        if (setor) {
            queryParams.push(setor);
            query += ` AND sector = $${queryParams.length}`;
        }

        if (orador) {
            queryParams.push(orador);
            query += ` AND speaker = $${queryParams.length}`;
        }

        if (sala) {
            queryParams.push(sala);
            query += ` AND room = $${queryParams.length}`;
        }

        // Executa a consulta no banco de dados
        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
