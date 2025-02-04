const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const { jsPDF } = require('jspdf'); // Biblioteca para manipular PDFs
require('jspdf-autotable'); // Plugin para tabelas no jsPDF

module.exports = async (req, res) => {
    try {
        const { dataInicial, dataFinal, orador, sala, format } = req.query;

        console.log('Parâmetros recebidos:', { dataInicial, dataFinal, orador, sala });

        // Valida os parâmetros
        if (dataInicial && isNaN(Date.parse(dataInicial))) {
            return res.status(400).json({ error: 'Data inicial inválida.' });
        }

        if (dataFinal && isNaN(Date.parse(dataFinal))) {
            return res.status(400).json({ error: 'Data final inválida.' });
        }

        // Define a base da consulta SQL
        let query = `
            SELECT date + interval '1 day' AS date, time, speaker, room,
                   COALESCE(client, employee) AS client_or_employee
            FROM historico_reunioes
            WHERE 1=1
        `;
        const queryParams = [];

        // Aplica os filtros dinamicamente
        if (dataInicial) {
            queryParams.push(dataInicial);
            query += ` AND date >= $${queryParams.length}::date`;
        }
        if (dataFinal) {
            queryParams.push(dataFinal);
            query += ` AND date <= $${queryParams.length}::date`;
        }
        if (orador) {
            queryParams.push(`%${orador}%`);
            query += ` AND speaker ILIKE $${queryParams.length}`;
        }
        if (sala) {
            queryParams.push(sala);
            query += ` AND room = $${queryParams.length}`;
        }

        console.log('Query gerada:', query);
        console.log('Parâmetros da Query:', queryParams);

        // Executa a consulta no banco de dados
        const { rows } = await db.query(query, queryParams);

        if (!rows.length) {
            console.log('Nenhum registro encontrado para os filtros aplicados.');
            return res.status(404).json({ error: 'Nenhum registro encontrado.' });
        }

        console.log('Registros encontrados:', rows);

        // Retorna os registros filtrados em JSON se o formato não for PDF
        if (format !== 'pdf') {
            return res.status(200).json(rows);
        }

        // Geração de PDF
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Histórico de Reuniões', 105, 20, { align: 'center' });

        // Agrupa os dados por data
        const groupedData = rows.reduce((acc, row) => {
            // Corrige a data incrementando +1 dia para exibição correta
            const correctedDate = new Date(row.date);
            correctedDate.setDate(correctedDate.getDate());

            const formattedDate = correctedDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
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
                entry.client_or_employee // Cliente ou Funcionário
            ]);

            doc.autoTable({
                head: [['Hora', 'Orador', 'Sala', 'Cliente/Funcionário']],
                body: tableData,
                startY: startY + 5,
                margin: { left: 10, right: 10 },
                styles: { fontSize: 10 },
                headStyles: { fillColor: [22, 160, 133] },
                bodyStyles: { textColor: [50, 50, 50] },
            });

            startY = doc.previousAutoTable.finalY + 10;
            if (startY > 270) {
                doc.addPage();
                startY = 20;
            }
        });

        // Gera o PDF e retorna ao cliente
        const pdfBytes = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.pdf"');
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões. Por favor, tente novamente mais tarde.' });
    }
};
