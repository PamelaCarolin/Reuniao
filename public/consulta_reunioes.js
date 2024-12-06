document.addEventListener('DOMContentLoaded', function () {
    let sortOrder = 'asc'; // Define a ordem de classificação inicial

    // Carrega o histórico de reuniões ao iniciar
    loadHistorico();

    // Função principal para carregar e filtrar o histórico
    function loadHistorico() {
        filterHistorico();
    }

    // Função para filtrar os dados e buscar no backend
    function filterHistorico() {
        const dataInicial = document.getElementById('data-inicial').value;
        const dataFinal = document.getElementById('data-final').value;
        const orador = document.getElementById('orador').value;
        const sala = document.getElementById('sala').value;

        const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala });

        fetch(`/consultar-historico?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                // Caso de mensagem "Nenhum registro encontrado."
                if (result.message) {
                    alert(result.message);
                    clearTable(); // Limpa a tabela caso não haja dados
                    return;
                }

                // Caso haja dados, processa e exibe na tabela
                populateTable(result);
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao consultar o histórico de reuniões. Por favor, tente novamente.');
            });
    }

    // Função para preencher a tabela com os dados
    function populateTable(reunioes) {
        const historicoList = document.getElementById('historico-results');
        historicoList.innerHTML = ''; // Limpa o conteúdo anterior

        // Ordena os dados
        reunioes.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // Preenche a tabela com os dados
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
    }

    // Função para limpar a tabela quando não houver dados
    function clearTable() {
        const historicoList = document.getElementById('historico-results');
        historicoList.innerHTML = '';
        document.getElementById('historico-results-table').style.display = 'none';
    }

    // Alterna a ordem de classificação
    function toggleSortOrder() {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        loadHistorico();
    }

    // Configura os eventos do botão de pesquisa
    const searchButton = document.getElementById('search-historico');
    if (searchButton) {
        searchButton.addEventListener('click', loadHistorico);
    }

    // Adiciona evento ao cabeçalho da tabela para alternar a ordem de classificação
    const historicoTable = document.getElementById('historico-results-table');
    if (historicoTable && historicoTable.querySelector('th')) {
        historicoTable.querySelector('th').addEventListener('click', toggleSortOrder);
    }

    // Adiciona evento para o botão de download do Excel
    const downloadExcelButton = document.getElementById('download-excel');
    if (downloadExcelButton) {
        downloadExcelButton.addEventListener('click', downloadHistoricoExcel);
    }

    // Função para baixar os dados no formato Excel
    function downloadHistoricoExcel() {
        const dataInicial = document.getElementById('data-inicial').value;
        const dataFinal = document.getElementById('data-final').value;
        const orador = document.getElementById('orador').value;
        const sala = document.getElementById('sala').value;

        const params = new URLSearchParams({ dataInicial, dataFinal, orador, sala, format: 'excel' });

        // Redireciona para o backend para baixar o Excel
        window.location.href = `/consultar-historico?${params.toString()}`;
    }
});
