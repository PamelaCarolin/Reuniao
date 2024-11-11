let sortOrder = 'asc'; // Ordem inicial para classificação no histórico de reuniões

document.addEventListener('DOMContentLoaded', function() {
    // Função para carregar o histórico de reuniões
    function loadHistorico() {
        filterHistorico();
    }

    // Função para aplicar filtros no histórico de reuniões
    function filterHistorico() {
        const dataInicial = document.getElementById('data-inicial').value;
        const dataFinal = document.getElementById('data-final').value;
        const setor = document.getElementById('setor').value;
        const orador = document.getElementById('orador').value;
        const sala = document.getElementById('sala').value;

        // Construir parâmetros de pesquisa, omitindo dataInicial e dataFinal se estiverem vazios
        const params = new URLSearchParams();
        if (dataInicial) params.append('dataInicial', dataInicial);
        if (dataFinal) params.append('dataFinal', dataFinal);
        if (setor) params.append('setor', setor);
        if (orador) params.append('orador', orador);
        if (sala) params.append('sala', sala);

        fetch(`/consultar-historico?${params.toString()}`)
            .then(response => response.json())
            .then(reunioes => {
                if (!Array.isArray(reunioes)) {
                    console.error('Erro: resposta inesperada ao consultar histórico de reuniões');
                    return;
                }

                // Limpa o corpo da tabela antes de adicionar novas linhas
                const historicoList = document.getElementById('historico-results');
                historicoList.innerHTML = '';

                reunioes.forEach(reuniao => {
                    const row = document.createElement('tr');

                    const formattedDate = new Date(reuniao.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    const formattedTime = reuniao.time.slice(0, 5);

                    const cells = [
                        formattedDate,
                        formattedTime,
                        reuniao.speaker,
                        reuniao.sector,
                        reuniao.room,
                        reuniao.status || 'Pendente'
                    ];

                    cells.forEach(cellText => {
                        const td = document.createElement('td');
                        td.textContent = cellText;
                        td.style.border = '1px solid black';
                        td.style.padding = '8px';
                        row.appendChild(td);
                    });

                    historicoList.appendChild(row);
                });

                // Mostra a tabela apenas se houver resultados
                document.getElementById('historico-results-table').style.display = reunioes.length ? 'table' : 'none';
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao consultar o histórico de reuniões. Por favor, tente novamente.');
            });
    }

    // Alterna a ordem de classificação no histórico
    function toggleSortOrder() {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        loadHistorico();
    }

    // Evento de clique para o botão de pesquisa
    document.getElementById('search-historico').addEventListener('click', loadHistorico);

    // Carrega o histórico na inicialização
    loadHistorico();
});
