const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const express = require('express');
const { PDFDocument, StandardFonts } = require('pdf-lib'); // Biblioteca PDF-lib
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Rota para consultar histórico de reuniões
router.get('/consultar-historico', async (req, res) => {
    const { dataInicial, dataFinal, orador, sala } = req.query;

    try {
        let query = `
            SELECT date, time, speaker, room, client
            FROM historico_reunioes
            WHERE 1=1
        `;
        const queryParams = [];

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

        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
});

// Rota para gerar o PDF
router.get('/gerar-pdf', async (req, res) => {
    const { dataInicial, dataFinal, orador, sala } = req.query;

    try {
        let query = `
            SELECT date, time, speaker, room, client
            FROM historico_reunioes
            WHERE 1=1
        `;
        const queryParams = [];

        if (dataInicial) queryParams.push(dataInicial) && (query += ` AND date >= $${queryParams.length}`);
        if (dataFinal) queryParams.push(dataFinal) && (query += ` AND date <= $${queryParams.length}`);
        if (orador) queryParams.push(orador) && (query += ` AND speaker = $${queryParams.length}`);
        if (sala) queryParams.push(sala) && (query += ` AND room = $${queryParams.length}`);

        const { rows } = await db.query(query, queryParams);

        // Cria um novo documento PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]); // Tamanho da página: 600x800
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Adiciona um cabeçalho
        const title = 'Histórico de Reuniões';
        page.drawText(title, { x: 200, y: 750, size: 20, font });

        // Prepara os dados para o PDF
        let yPosition = 700;
        const lineHeight = 20;

        rows.forEach(row => {
            const text = `Data: ${row.date}, Hora: ${row.time}, Orador: ${row.speaker}, Sala: ${row.room}, Cliente: ${row.client}`;
            page.drawText(text, { x: 50, y: yPosition, size: 12, font });
            yPosition -= lineHeight; // Move para a próxima linha

            // Adiciona outra página se necessário
            if (yPosition < 50) {
                yPosition = 750;
                page = pdfDoc.addPage([600, 800]);
            }
        });

        // Salva o PDF em buffer
        const pdfBytes = await pdfDoc.save();

        // Envia o PDF como resposta para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.pdf"');
        res.send(pdfBytes);
    } catch (err) {
        console.error('Erro ao gerar o PDF:', err);
        res.status(500).json({ error: 'Erro ao gerar o PDF.' });
    }
});

module.exports = router;
