document.addEventListener('DOMContentLoaded', () => {
    // Evento para o botão de pesquisa
    document.getElementById('search-historico').addEventListener('click', consultarReunioes);

    // Evento para o botão de download de PDF
    document.getElementById('download-pdf').addEventListener('click', baixarPDF);
});

// Função para consultar reuniões
function consultarReunioes() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;

    const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala, format: 'json' });

    fetch(`/consultar-reunioes?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao consultar reuniões.');
            return response.json();
        })
        .then(data => {
            atualizarTabelaResultados(data);
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao consultar reuniões.');
        });
}

// Função para atualizar a tabela de resultados
function atualizarTabelaResultados(reunioes) {
    const tbody = document.getElementById('historico-results');
    tbody.innerHTML = '';

    if (reunioes.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'Nenhuma reunião encontrada.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    reunioes.forEach(reuniao => {
        const row = document.createElement('tr');

        const cells = [
            new Date(reuniao.date).toLocaleDateString('pt-BR'),
            reuniao.time.slice(0, 5),
            reuniao.speaker,
            reuniao.room,
            reuniao.client
        ];

        cells.forEach(cellText => {
            const cell = document.createElement('td');
            cell.textContent = cellText;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    document.getElementById('historico-results-table').style.display = 'table';
}

// Função para baixar o PDF
function baixarPDF() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;

    const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala, format: 'pdf' });

    fetch(`/consultar-reunioes?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao gerar o PDF.');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'historico_reunioes.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro ao baixar o PDF.');
        });
}
