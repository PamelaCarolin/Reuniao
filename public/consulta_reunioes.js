// Função para formatar data para o padrão pt-BR
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// Função para formatar horário no formato HH:MM
function formatTime(timeStr) {
    return timeStr.slice(0, 5);
}

// Função para consultar o histórico de reuniões
function consultarHistorico() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const setor = document.getElementById('setor').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;

    const params = new URLSearchParams({ dataInicial, dataFinal, setor, orador, sala });

    fetch(`/consultar-historico?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
        const resultsTable = document.getElementById('historico-results-table');
        const resultsBody = document.getElementById('historico-results');
        resultsBody.innerHTML = '';

        if (data.length > 0) {
            resultsTable.style.display = 'table';
            data.forEach(reuniao => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(reuniao.date)}</td>
                    <td>${formatTime(reuniao.time)}</td>
                    <td>${reuniao.speaker}</td>
                    <td>${reuniao.sector}</td>
                    <td>${reuniao.room}</td>
                    <td>${reuniao.status}</td>
                `;
                resultsBody.appendChild(row);
            });
        } else {
            resultsTable.style.display = 'none';
            alert('Nenhuma reunião encontrada no período especificado.');
        }
    })
    .catch(error => {
        console.error('Erro ao consultar o histórico de reuniões:', error);
        alert('Erro ao consultar o histórico de reuniões.');
    });
}

// Função para baixar o histórico de reuniões como PDF
function downloadHistoricoPDF() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const setor = document.getElementById('setor').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;

    const params = new URLSearchParams({ dataInicial, dataFinal, setor, orador, sala });

    fetch(`/consultar-historico?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableColumn = ["DATA", "HORÁRIO", "ORADOR", "SETOR", "SALA", "STATUS"];
        const tableRows = [];

        data.forEach(reuniao => {
            const rowData = [
                formatDate(reuniao.date),
                formatTime(reuniao.time),
                reuniao.speaker,
                reuniao.sector,
                reuniao.room,
                reuniao.status
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 10,
            theme: 'striped'
        });

        doc.save('historico_reunioes.pdf');
    })
    .catch(error => {
        console.error('Erro ao gerar o PDF do histórico de reuniões:', error);
        alert('Erro ao gerar o PDF do histórico de reuniões.');
    });
}
