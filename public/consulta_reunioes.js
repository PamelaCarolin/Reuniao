document.addEventListener('DOMContentLoaded', function () {
    let sortOrder = 'asc'; // Define a ordem de classificação inicial

    // Carrega o histórico de reuniões ao iniciar
    loadHistorico();

    // Função para carregar o histórico de reuniões com filtros aplicados
    function loadHistorico() {
        filterHistorico();
    }

    // Função para aplicar filtros e buscar dados no histórico
    function filterHistorico() {
        const dataInicial = document.getElementById('data-inicial').value;
        const dataFinal = document.getElementById('data-final').value;
        const orador = document.getElementById('orador').value;
        const sala = document.getElementById('sala').value;

        const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala });

        fetch(`/consultar-historico?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao consultar histórico.');
                }
                return response.json();
            })
            .then(reunioes => {
                const historicoList = document.getElementById('historico-results');
                historicoList.innerHTML = '';

                if (!reunioes.length) {
                    document.getElementById('historico-results-table').style.display = 'none';
                    alert('Nenhum registro encontrado.');
                    return;
                }

                // Ordena as reuniões conforme a ordem selecionada
                reunioes.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                });

                // Preenche a tabela com os dados filtrados
                reunioes.forEach(reuniao => {
                    const row = document.createElement('tr');

                    const formattedDate = new Date(reuniao.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    const formattedTime = reuniao.time.slice(0, 5);

                    const cells = [
                        formattedDate,
                        formattedTime,
                        reuniao.speaker,
                        reuniao.room,
                        reuniao.client
                    ];

                    cells.forEach(cellText => {
                        const td = document.createElement('td');
                        td.textContent = cellText;
                        row.appendChild(td);
                    });

                    historicoList.appendChild(row);
                });

                // Exibe a tabela
                document.getElementById('historico-results-table').style.display = 'table';
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao consultar o histórico de reuniões.');
            });
    }

    // Alterna a ordem de classificação e recarrega o histórico
    function toggleSortOrder() {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        loadHistorico();
    }

    // Adiciona evento para o botão de pesquisa
    const searchButton = document.getElementById('search-historico');
    if (searchButton) {
        searchButton.addEventListener('click', loadHistorico);
    }

    // Adiciona evento para o botão de download do PDF
    const downloadPdfButton = document.getElementById('download-pdf');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', downloadHistoricoPDF);
    }

    // Função para gerar e baixar o PDF com os dados filtrados
    function downloadHistoricoPDF() {
        const dataInicial = document.getElementById('data-inicial').value;
        const dataFinal = document.getElementById('data-final').value;
        const orador = document.getElementById('orador').value;
        const sala = document.getElementById('sala').value;

        const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala, format: 'pdf' });

        // Identificar as linhas únicas da tabela antes de enviar os dados ao backend
        const rows = Array.from(document.getElementById('historico-results').querySelectorAll('tr'));
        const uniqueRows = [];

        const uniqueSet = new Set();

        rows.forEach(row => {
            const rowData = Array.from(row.children).map(cell => cell.textContent.trim()).join('|');
            if (!uniqueSet.has(rowData)) {
                uniqueSet.add(rowData); // Adiciona ao Set para evitar duplicatas
                uniqueRows.push(rowData); // Adiciona ao array de linhas únicas
            }
        });

        // Converte as linhas únicas para JSON e anexa como parâmetro
        params.append('uniqueData', JSON.stringify(uniqueRows));

        // Redireciona para o backend para gerar o PDF com dados únicos
        window.location.href = `/consultar-historico?${params.toString()}`;
    }

    // Adiciona evento para alternar a ordem de classificação
    const sortButton = document.getElementById('sort-historico');
    if (sortButton) {
        sortButton.addEventListener('click', toggleSortOrder);
    }
});
