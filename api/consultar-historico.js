const db = require('./database'); // Importa o módulo de conexão com o banco de dados

module.exports = async (req, res) => {
    // Extrai os parâmetros de consulta enviados pela requisição
    const { dataInicial, dataFinal, orador, sala } = req.query;

    try {
        // Define a base da consulta SQL
        let query = `
            SELECT date, time, speaker, room, client
            FROM historico_reunioes
            WHERE 1=1
        `;
        const queryParams = [];

        // Filtro por data inicial
        if (dataInicial) {
            queryParams.push(dataInicial);
            query += ` AND date >= $${queryParams.length}`;
        }

        // Filtro por data final
        if (dataFinal) {
            queryParams.push(dataFinal);
            query += ` AND date <= $${queryParams.length}`;
        }

        // Filtro por orador
        if (orador) {
            queryParams.push(orador);
            query += ` AND speaker = $${queryParams.length}`;
        }

        // Filtro por sala
        if (sala) {
            queryParams.push(sala);
            query += ` AND room = $${queryParams.length}`;
        }

        // Executa a consulta no banco de dados
        const { rows } = await db.query(query, queryParams);

        // Retorna os resultados da consulta como resposta JSON
        res.status(200).json(rows);
    } catch (err) {
        // Trata erros e retorna uma mensagem de erro no servidor
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
