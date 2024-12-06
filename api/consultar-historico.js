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

            // Agrupa os dados por data
            const groupedData = rows.reduce((acc, row) => {
                const formattedDate = new Date(row.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                if (!acc[formattedDate]) acc[formattedDate] = [];
                acc[formattedDate].push(row);
                return acc;
            }, {});

            // Adiciona os dados organizados por dia no PDF
            let startY = 30;
            Object.entries(groupedData).forEach(([date, entries]) => {
                doc.setFontSize(12);
                doc.text(`Data: ${date}`, 10, startY);

                const tableData = entries.map(entry => [
                    entry.time.slice(0, 5), // Hora
                    entry.speaker, // Orador
                    entry.room, // Sala
                    entry.client, // Cliente
                ]);

                doc.autoTable({
                    head: [['Hora', 'Orador', 'Sala', 'Cliente']],
                    body: tableData,
                    startY: startY + 5,
                    margin: { left: 10, right: 10 },
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [22, 160, 133] },
                    bodyStyles: { textColor: [50, 50, 50] },
                });

                startY = doc.previousAutoTable.finalY + 10;
                if (startY > 270) { // Se a página estiver cheia, adiciona uma nova página
                    doc.addPage();
                    startY = 20;
                }
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
