const db = require('./database');

module.exports = async (req, res) => {
    const { dataInicial, dataFinal, setor, orador, sala } = req.query;

    try {
        let query = `SELECT * FROM historico_reunioes WHERE 1=1`;
        const queryParams = [];

        // Aplica os filtros de data
        if (dataInicial) {
            queryParams.push(dataInicial);
            query += ` AND date >= $${queryParams.length}`;
        }

        if (dataFinal) {
            queryParams.push(dataFinal);
            query += ` AND date <= $${queryParams.length}`;
        }

        // Aplica os filtros de setor, orador e sala
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

        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
