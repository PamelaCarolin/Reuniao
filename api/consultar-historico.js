const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const { jsPDF } = require('jspdf'); // Biblioteca para manipular PDFs
require('jspdf-autotable'); // Plugin para tabelas no jsPDF

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

        // Aplica os filtros dinamicamente
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

        // Se o formato solicitado for PDF, processa o PDF
        if (format === 'pdf') {
            if (!rows.length) {
                res.status(404).json({ error: 'Nenhum registro encontrado para gerar o PDF.' });
                return;
            }

            // Cria um novo documento PDF
            const doc = new jsPDF();

            // Adiciona título ao PDF
            doc.setFontSize(16);
            doc.text('Histórico de Reuniões', 105, 20, { align: 'center' });

            // Formata os dados para a tabela
            const tableData = rows.map(row => {
                const formattedDate = new Date(row.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const formattedTime = row.time.slice(0, 5);
                return [
                    formattedDate,
                    formattedTime,
                    row.speaker,
                    row.room,
                    row.client,
                ];
            });

            // Adiciona a tabela ao PDF usando autotable
            doc.autoTable({
                head: [['Data', 'Hora', 'Orador', 'Sala', 'Cliente']],
                body: tableData,
                startY: 30, // Define a posição inicial da tabela
                margin: { left: 10, right: 10 },
                styles: { fontSize: 10 },
                headStyles: { fillColor: [22, 160, 133] }, // Cor do cabeçalho
                bodyStyles: { textColor: [50, 50, 50] },
            });

            // Gera os bytes do PDF
            const pdfBytes = doc.output('arraybuffer');

            // Define os cabeçalhos e envia o PDF como resposta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.pdf"');
            res.send(Buffer.from(pdfBytes));
            return;
        }

        // Caso contrário, retorna os dados em formato JSON
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err.stack || err.message || err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
