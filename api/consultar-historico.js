const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const XLSX = require('xlsx'); // Importa a biblioteca para manipular Excel

module.exports = async (req, res) => {
    const { dataInicial, dataFinal, orador, sala, format } = req.query;

    try {
        // Define a base da consulta SQL
        let query = `
            SELECT date, time, speaker, room, client
            FROM historico_reunioes
            WHERE 1=1
        `;
        const queryParams = [];

        // Adiciona filtros dinamicamente com base nos parâmetros
        if (dataInicial) {
            queryParams.push(dataInicial);
            query += ` AND date >= $${queryParams.length}`;
        }
        if (dataFinal) {
            queryParams.push(dataFinal);
            query += ` AND date <= $${queryParams.length}`;
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

        if (format === 'excel') {
            // Cria um novo workbook e worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);

            // Adiciona a planilha ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Reuniões');

            // Converte o workbook para buffer
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

            // Define os cabeçalhos para download do Excel
            res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Envia o arquivo Excel como resposta
            res.send(excelBuffer);
            return;
        }

        // Retorna os dados em formato JSON se não for solicitado Excel
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
