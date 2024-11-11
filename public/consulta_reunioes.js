// Função para formatar data e horário para o padrão pt-BR
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

function formatTime(timeStr) {
    return timeStr.slice(0, 5);
}

// Função para consultar reuniões
function consultarReunioes() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const setor = document.getElementById('setor').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;
    const tipoReuniao = document.getElementById('tipo-reuniao').value;

    // Monta os parâmetros de consulta, incluindo apenas os valores preenchidos
    const params = new URLSearchParams();
    if (dataInicial) params.append('dataInicial', dataInicial);
    if (dataFinal) params.append('dataFinal', dataFinal);
    if (setor) params.append('setor', setor);
    if (orador) params.append('orador', orador);
    if (sala) params.append('sala', sala);
    if (tipoReuniao) params.append('tipoReuniao', tipoReuniao);

    // Faz a consulta
    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
        const resultsTable = document.getElementById('reunioes-results-table');
        const resultsBody = document.getElementById('reunioes-results');
        resultsBody.innerHTML = ''; // Limpa os resultados anteriores

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
                    <td>${reuniao.status || 'Agendada'}</td> <!-- Exibe 'Agendada' se o status estiver undefined -->
                `;
                resultsBody.appendChild(row);
            });
        } else {
            resultsTable.style.display = 'none';
            alert('Nenhuma reunião encontrada.');
        }
    })
    .catch(error => {
        console.error('Erro ao consultar reuniões:', error);
        alert('Erro ao consultar reuniões.');
    });
}

// Função para baixar o resultado da consulta como PDF
function downloadReunioesPDF() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const setor = document.getElementById('setor').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;
    const tipoReuniao = document.getElementById('tipo-reuniao').value;

    // Monta os parâmetros de consulta
    const params = new URLSearchParams();
    if (dataInicial) params.append('dataInicial', dataInicial);
    if (dataFinal) params.append('dataFinal', dataFinal);
    if (setor) params.append('setor', setor);
    if (orador) params.append('orador', orador);
    if (sala) params.append('sala', sala);
    if (tipoReuniao) params.append('tipoReuniao', tipoReuniao);

    fetch(`/consultar?${params.toString()}`)
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
                reuniao.status || 'Agendada'
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 10,
            theme: 'striped'
        });

        doc.save('reunioes.pdf');
    })
    .catch(error => {
        console.error('Erro ao gerar o PDF das reuniões:', error);
        alert('Erro ao gerar o PDF das reuniões.');
    });
}
