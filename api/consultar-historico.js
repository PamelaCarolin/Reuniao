const db = require('./database');
const ExcelJS = require('exceljs'); // Biblioteca para gerar Excel

module.exports = async (req, res) => {
    try {
        const { dataInicial, dataFinal, orador, sala, format } = req.query;

        console.log('Parâmetros recebidos:', { dataInicial, dataFinal, orador, sala });

        if (dataInicial && isNaN(Date.parse(dataInicial))) {
            return res.status(400).json({ error: 'Data inicial inválida.' });
        }

        if (dataFinal && isNaN(Date.parse(dataFinal))) {
            return res.status(400).json({ error: 'Data final inválida.' });
        }

        // Define a base da consulta SQL
        let query = `
            SELECT date, time, speaker, room, COALESCE(client, employee) AS client_or_employee
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

        const { rows } = await db.query(query, queryParams);

        if (!rows.length) {
            console.log('Nenhum registro encontrado para os filtros aplicados.');
            return res.status(404).json({ error: 'Nenhum registro encontrado.' });
        }

        console.log('Registros encontrados:', rows);

        if (format !== 'excel') {
            return res.status(200).json(rows);
        }

        // Geração de Excel
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Histórico de Reuniões');

        // Define o cabeçalho
        sheet.columns = [
            { header: 'Data', key: 'date', width: 15 },
            { header: 'Horário', key: 'time', width: 10 },
            { header: 'Orador', key: 'speaker', width: 25 },
            { header: 'Sala', key: 'room', width: 15 },
            { header: 'Cliente/Funcionário', key: 'client_or_employee', width: 30 }
        ];

        // Adiciona as linhas com os dados
        rows.forEach(row => {
            sheet.addRow({
                date: new Date(row.date).toLocaleDateString('pt-BR'),
                time: row.time.slice(0, 5),
                speaker: row.speaker,
                room: row.room,
                client_or_employee: row.client_or_employee
            });
        });

        // Define o nome do arquivo
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.xlsx"');
        res.send(buffer);

    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões. Por favor, tente novamente mais tarde.' });
    }
};
