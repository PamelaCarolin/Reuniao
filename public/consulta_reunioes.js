document.addEventListener('DOMContentLoaded', () => {
    // Evento para o botão de pesquisa
    document.getElementById('btn-pesquisar').addEventListener('click', () => {
        consultarReunioes();
    });

    // Evento para o botão de download de PDF
    document.getElementById('btn-baixar-pdf').addEventListener('click', () => {
        baixarPDF();
    });
});

// Função para consultar reuniões e atualizar a tabela de resultados
function consultarReunioes() {
    // Captura os filtros inseridos pelo usuário
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const orador = document.getElementById('filtro-orador').value;
    const sala = document.getElementById('filtro-sala').value;

    // Monta os parâmetros da URL
    const params = new URLSearchParams({
        dataInicial,
        dataFinal,
        orador,
        sala,
        format: 'json'
    });

    // Faz a requisição para a API
    fetch(`/consultar-reunioes?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao consultar reuniões.');
            }
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

// Função para atualizar a tabela com os resultados
function atualizarTabelaResultados(reunioes) {
    const tbody = document.getElementById('resultados-tabela').querySelector('tbody');
    tbody.innerHTML = ''; // Limpa os resultados anteriores

    if (reunioes.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'Nenhuma reunião encontrada.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    reunioes.forEach(reuniao => {
        const row = document.createElement('tr');

        // Adiciona as células à linha
        const cells = [
            new Date(reuniao.date).toLocaleDateString('pt-BR'),
            reuniao.time.slice(0, 5),
            reuniao.speaker,
            reuniao.room
        ];

        cells.forEach(cellText => {
            const cell = document.createElement('td');
            cell.textContent = cellText;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

// Função para baixar o PDF com os filtros aplicados
function baixarPDF() {
    // Captura os filtros inseridos pelo usuário
    const dataInicial = document.getElementById('data-inicial').value;
    const dataFinal = document.getElementById('data-final').value;
    const orador = document.getElementById('filtro-orador').value;
    const sala = document.getElementById('filtro-sala').value;

    // Monta os parâmetros da URL
    const params = new URLSearchParams({
        dataInicial,
        dataFinal,
        orador,
        sala,
        format: 'pdf'
    });

    // Faz a requisição para download do PDF
    fetch(`/consultar-reunioes?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao gerar o PDF.');
            }
            return response.blob();
        })
        .then(blob => {
            // Cria um link temporário para download do PDF
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
