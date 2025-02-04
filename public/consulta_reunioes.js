document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-historico').addEventListener('click', consultarReunioes);
    document.getElementById('download-pdf').addEventListener('click', baixarExcel);
});

function consultarReunioes() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;

    const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala, format: 'json' });

    fetch(`/consultar-historico?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    console.error('Erro na resposta da API:', errorData);
                    throw new Error(errorData.error || 'Erro ao consultar reuniões.');
                });
            }
            return response.json();
        })
        .then(data => atualizarTabelaResultados(data))
        .catch(error => {
            console.error('Erro:', error);
            alert(`Erro ao consultar reuniões: ${error.message}`);
        });
}

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
            reuniao.client_or_employee
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

function baixarExcel() {
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const orador = document.getElementById('orador').value;
    const sala = document.getElementById('sala').value;

    const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala, format: 'excel' });

    fetch(`/consultar-historico?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao gerar o Excel.');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'historico_reunioes.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Erro ao baixar Excel:', error);
            alert('Erro ao baixar o Excel.');
        });
}
