const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const XLSX = require('xlsx'); // Importa a biblioteca para manipular Excel

module.exports = async (req, res) => {
    const { dataInicial, dataFinal, orador, sala, format } = req.query; // Extrai os parâmetros enviados na requisição

    try {
        // Define a base da consulta SQL
        let query = `
            SELECT date, time, speaker, room, client
            FROM historico_reunioes
            WHERE 1=1
        `;
        const queryParams = [];

        // Adiciona filtros dinamicamente com base nos parâmetros enviados
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

        // Verifica se há resultados
        if (rows.length === 0) {
            return res.status(200).json({ message: 'Nenhum registro encontrado.' });
        }

        // Verifica se o formato solicitado é Excel
        if (format === 'excel') {
            // Cria um novo workbook e uma worksheet a partir dos dados retornados
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);

            // Adiciona a worksheet ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Reuniões');

            // Converte o workbook para um buffer no formato Excel
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

            // Define os cabeçalhos para o download do arquivo Excel
            res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Envia o buffer como resposta
            res.send(excelBuffer);
            return;
        }

        // Se não for solicitado Excel, retorna os dados no formato JSON
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err.message);

        // Retorna um erro no formato JSON para o cliente
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões. Verifique o servidor.' });
    }
};
