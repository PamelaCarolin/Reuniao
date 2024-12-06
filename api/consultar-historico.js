const db = require('./database'); // Importa o módulo de conexão com o banco de dados
const { jsPDF } = require('jspdf'); // Biblioteca para manipular PDFs
require('jspdf-autotable'); // Plugin para tabelas no jsPDF
const { ChartJSNodeCanvas } = require('chartjs-node-canvas'); // Geração de gráficos como imagens

// Configuração do Chart.js Node Canvas
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });

// Função para gerar o gráfico como imagem base64
async function generateChart(labels, data, title) {
    const configuration = {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: title,
                    data,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(255, 206, 86, 0.5)'
                    ],
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                },
            },
        },
    };
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
}

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

        // Aplica filtros dinamicamente
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

        // Executa a consulta no banco de dados
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

            // Prepara os dados para os gráficos
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

            // Gráfico 1: Salas mais utilizadas
            const roomChart = await generateChart(
                top4Rooms.map(([room]) => room),
                top4Rooms.map(([, count]) => count),
                'Salas Mais Utilizadas'
            );
            doc.addImage(roomChart, 'PNG', 10, 30, 180, 80);

            // Gráfico 2: Oradores mais ativos
            const speakerChart = await generateChart(
                top4Speakers.map(([speaker]) => speaker),
                top4Speakers.map(([, count]) => count),
                'Oradores Mais Ativos'
            );
            doc.addImage(speakerChart, 'PNG', 10, 120, 180, 80);

            // Gráfico 3: Clientes/Funcionários mais frequentes
            const clientChart = await generateChart(
                top4Clients.map(([client]) => client),
                top4Clients.map(([, count]) => count),
                'Clientes/Funcionários Mais Frequentes'
            );
            doc.addImage(clientChart, 'PNG', 10, 210, 180, 80);

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
