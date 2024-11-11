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

        const params = new URLSearchParams({ dataInicial, dataFinal, setor, orador, sala });

        fetch(`/consultar-historico?${params.toString()}`)
            .then(response => response.json())
            .then(reunioes => {
                if (!Array.isArray(reunioes)) {
                    console.error('Erro: resposta inesperada ao consultar histórico de reuniões');
                    return;
                }

                reunioes.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                });

                const historicoList = document.getElementById('historico-results');
                historicoList.innerHTML = '';

                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';

                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');

                const headers = ['Data', 'Horário', 'Orador', 'Setor', 'Sala', 'Status'];
                headers.forEach((headerText, index) => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    th.style.border = '1px solid black';
                    th.style.padding = '8px';
                    th.style.textAlign = 'left';
                    th.style.cursor = 'pointer';

                    if (index === 0) {
                        const arrow = document.createElement('span');
                        arrow.textContent = sortOrder === 'desc' ? ' ▼' : ' ▲';
                        th.appendChild(arrow);
                        th.addEventListener('click', () => toggleSortOrder());
                    }

                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);

                const tbody = document.createElement('tbody');

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

                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                historicoList.appendChild(table);
            })
            .catch(error => {
                console.error('Error:', error);
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
