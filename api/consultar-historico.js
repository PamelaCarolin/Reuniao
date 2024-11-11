// consultar-historico.js
const db = require('./database');

module.exports = async (req, res) => {
    const { dataInicial, dataFinal, setor, orador, sala } = req.query;

    try {
        let query = `SELECT * FROM historico_reunioes WHERE 1=1`;
        const values = [];

        if (dataInicial) {
            values.push(dataInicial);
            query += ` AND date >= $${values.length}`;
        }
        if (dataFinal) {
            values.push(dataFinal);
            query += ` AND date <= $${values.length}`;
        }
        if (setor) {
            values.push(`%${setor}%`);
            query += ` AND sector ILIKE $${values.length}`;
        }
        if (orador) {
            values.push(`%${orador}%`);
            query += ` AND speaker ILIKE $${values.length}`;
        }
        if (sala) {
            values.push(sala);
            query += ` AND room = $${values.length}`;
        }

        const { rows } = await db.query(query, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao consultar histórico de reuniões:', error);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões' });
    }
};
