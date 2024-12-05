const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const express = require('express');
const { exec } = require('child_process'); // Para chamar scripts PHP externamente

const router = express.Router();

// Rota para consultar histórico de reuniões
router.get('/consultar-historico', async (req, res) => {
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
});

// Rota para gerar o PDF
router.get('/gerar-pdf', async (req, res) => {
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

        // Gera o HTML para o PDF
        let html = `
            <h1>Histórico de Reuniões</h1>
            <table border="1" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Orador</th>
                        <th>Sala</th>
                        <th>Cliente/Funcionário</th>
                    </tr>
                </thead>
                <tbody>
        `;

        rows.forEach(row => {
            html += `
                <tr>
                    <td>${row.date}</td>
                    <td>${row.time}</td>
                    <td>${row.speaker}</td>
                    <td>${row.room}</td>
                    <td>${row.client}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        // Salva o HTML em um arquivo temporário
        const fs = require('fs');
        const htmlFilePath = './temp/historico.html';
        const pdfFilePath = './temp/historico.pdf';

        fs.writeFileSync(htmlFilePath, html);

        // Executa o script PHP para gerar o PDF
        exec(`php gerar_pdf.php ${htmlFilePath} ${pdfFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error('Erro ao gerar o PDF:', stderr);
                return res.status(500).json({ error: 'Erro ao gerar o PDF.' });
            }

            // Envia o PDF gerado para o cliente
            res.download(pdfFilePath, 'historico_reunioes.pdf', (err) => {
                if (err) {
                    console.error('Erro ao enviar o PDF:', err);
                }

                // Remove os arquivos temporários após o download
                fs.unlinkSync(htmlFilePath);
                fs.unlinkSync(pdfFilePath);
            });
        });
    } catch (err) {
        console.error('Erro ao processar a requisição de PDF:', err);
        res.status(500).json({ error: 'Erro ao processar a requisição de PDF.' });
    }
});

module.exports = router;
