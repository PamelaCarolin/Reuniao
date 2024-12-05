const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const { PDFDocument, StandardFonts } = require('pdf-lib'); // Biblioteca para manipular PDFs

module.exports = async (req, res) => {
    // Extrai os parâmetros enviados pela requisição
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
            // Cria um novo documento PDF
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([600, 800]); // Página tamanho 600x800
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // Cabeçalho do PDF
            const title = 'Histórico de Reuniões';
            page.drawText(title, { x: 50, y: 750, size: 20, font });

            // Conteúdo do PDF
            let y = 700; // Posição inicial no eixo Y
            rows.forEach(row => {
                const text = `Data: ${row.date}, Hora: ${row.time}, Orador: ${row.speaker}, Sala: ${row.room}, Cliente: ${row.client}`;
                page.drawText(text, { x: 50, y, size: 12, font });
                y -= 20;

                // Adiciona uma nova página se necessário
                if (y < 50) {
                    y = 750;
                    page.addPage([600, 800]);
                }
            });

            // Gera os bytes do PDF
            const pdfBytes = await pdfDoc.save();

            // Define os cabeçalhos e envia o PDF como resposta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.pdf"');
            res.send(pdfBytes);
            return;
        }

        // Caso contrário, retorna os dados em formato JSON
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
