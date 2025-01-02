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
        // Exibe a mensagem de processamento
        const processingMessage = document.createElement('div');
        processingMessage.id = 'processing-message';
        processingMessage.textContent = 'Processando PDF...';
        processingMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(processingMessage);

        // Remoção de duplicatas
        setTimeout(() => {
            const dataInicial = document.getElementById('data-inicial').value;
            const dataFinal = document.getElementById('data-final').value;
            const orador = document.getElementById('orador').value;
            const sala = document.getElementById('sala').value;

            const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala, format: 'pdf' });

            const rows = Array.from(document.getElementById('historico-results').querySelectorAll('tr'));
            const uniqueRows = [];
            const uniqueSet = new Set();

            rows.forEach(row => {
                const columns = Array.from(row.children).slice(1, 5).map(cell => cell.textContent.trim().toLowerCase());
                const key = columns.join('|');

                if (!uniqueSet.has(key)) {
                    uniqueSet.add(key);
                    uniqueRows.push(columns);
                }
            });

            // Converte as linhas únicas para JSON e anexa como parâmetro
            params.append('uniqueData', JSON.stringify(uniqueRows));

            // Remove a mensagem de processamento
            document.body.removeChild(processingMessage);

            // Redireciona para o backend para gerar o PDF com dados únicos
            window.location.href = `/consultar-historico?${params.toString()}`;
        }, 2000); // Aguarda 2 segundos para simular o processamento
    }

    // Adiciona evento para alternar a ordem de classificação
    const sortButton = document.getElementById('sort-historico');
    if (sortButton) {
        sortButton.addEventListener('click', toggleSortOrder);
    }
});
