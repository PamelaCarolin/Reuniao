const db = require('./database'); // Conexão com banco de dados
const { jsPDF } = require('jspdf'); // Biblioteca para manipular PDFs
require('jspdf-autotable'); // Plugin para tabelas no jsPDF
require('jspdf-chartjs-plugin'); // Plugin para gráficos no jsPDF

module.exports = async (req, res) => {
    const { dataInicial, dataFinal, orador, sala, format } = req.query;

    try {
        // Base da consulta SQL
        let query = `
            SELECT date, time, speaker, room, client
            FROM historico_reunioes
            WHERE 1=1
        `;
        const queryParams = [];

        // Filtros
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
            query += ` AND speaker ILIKE $${queryParams.length}`;
        }
        if (sala) {
            queryParams.push(sala);
            query += ` AND room = $${queryParams.length}`;
        }

        // Consulta no banco de dados
        const { rows } = await db.query(query, queryParams);

        if (format === 'pdf') {
            if (!rows.length) {
                res.status(404).json({ error: 'Nenhum registro encontrado para gerar o PDF.' });
                return;
            }

            // Criação do PDF
            const doc = new jsPDF();

            // Agrupa os dados por data
            const groupedData = rows.reduce((acc, row) => {
                const date = new Date(row.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                if (!acc[date]) acc[date] = [];
                acc[date].push(row);
                return acc;
            }, {});

            // Página 1: Histórico Organizado por Data
            doc.setFontSize(16);
            doc.text('Histórico de Reuniões', 105, 20, { align: 'center' });

            let startY = 30;
            Object.entries(groupedData).forEach(([date, entries]) => {
                doc.setFontSize(12);
                doc.text(`Data: ${date}`, 10, startY);

                const tableData = entries.map(entry => [
                    entry.time.slice(0, 5),
                    entry.speaker,
                    entry.room,
                    entry.client,
                ]);

                doc.autoTable({
                    head: [['Hora', 'Orador', 'Sala', 'Cliente']],
                    body: tableData,
                    startY: startY + 5,
                    margin: { left: 10, right: 10 },
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [22, 160, 133] },
                });

                startY = doc.previousAutoTable.finalY + 10;
                if (startY > 270) {
                    doc.addPage();
                    startY = 20;
                }
            });

            // Página 2: Gráficos
            doc.addPage();
            doc.setFontSize(16);
            doc.text('Estatísticas', 105, 20, { align: 'center' });

            // Prepara dados para os gráficos
            const roomUsage = {};
            const speakerUsage = {};
            const clientUsage = {};

            rows.forEach(row => {
                roomUsage[row.room] = (roomUsage[row.room] || 0) + 1;
                speakerUsage[row.speaker] = (speakerUsage[row.speaker] || 0) + 1;
                clientUsage[row.client] = (clientUsage[row.client] || 0) + 1;
            });

            const top4Rooms = Object.entries(roomUsage)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4);
            const top4Speakers = Object.entries(speakerUsage)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4);
            const top4Clients = Object.entries(clientUsage)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4);

            // Gráfico 1: Salas Mais Utilizadas
            doc.addChart({
                type: 'bar',
                data: {
                    labels: top4Rooms.map(([room]) => room),
                    datasets: [{ label: 'Uso da Sala', data: top4Rooms.map(([, count]) => count), backgroundColor: 'rgba(54, 162, 235, 0.5)' }],
                },
                options: { responsive: true, plugins: { legend: { display: false } } },
                position: { x: 10, y: 30, width: 180, height: 80 },
            });

            // Gráfico 2: Oradores Mais Ativos
            doc.addChart({
                type: 'bar',
                data: {
                    labels: top4Speakers.map(([speaker]) => speaker),
                    datasets: [{ label: 'Oradores', data: top4Speakers.map(([, count]) => count), backgroundColor: 'rgba(75, 192, 192, 0.5)' }],
                },
                options: { responsive: true, plugins: { legend: { display: false } } },
                position: { x: 10, y: 120, width: 180, height: 80 },
            });

            // Gráfico 3: Clientes/Funcionários Mais Ativos
            doc.addChart({
                type: 'bar',
                data: {
                    labels: top4Clients.map(([client]) => client),
                    datasets: [{ label: 'Clientes/Funcionários', data: top4Clients.map(([, count]) => count), backgroundColor: 'rgba(255, 99, 132, 0.5)' }],
                },
                options: { responsive: true, plugins: { legend: { display: false } } },
                position: { x: 10, y: 210, width: 180, height: 80 },
            });

            // Gera o PDF
            const pdfBytes = doc.output('arraybuffer');

            // Envia o PDF como resposta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="historico_reunioes.pdf"');
            res.send(Buffer.from(pdfBytes));
            return;
        }

        // Retorna os registros filtrados em JSON
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erro ao consultar histórico de reuniões:', err.stack || err.message || err);
        res.status(500).json({ error: 'Erro ao consultar histórico de reuniões.' });
    }
};
