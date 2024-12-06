document.addEventListener('DOMContentLoaded', function () {
    // Define a ordem de classificação inicial
    let sortOrder = 'asc';

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
            .then(response => response.json())
            .then(reunioes => {
                if (!Array.isArray(reunioes)) {
                    console.error('Erro: resposta inesperada ao consultar histórico de reuniões');
                    return;
                }

                // Limpa o corpo da tabela antes de adicionar novas linhas
                const historicoList = document.getElementById('historico-results');
                historicoList.innerHTML = '';

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
                        reuniao.client // Cliente ou Funcionário
                    ];

                    cells.forEach(cellText => {
                        const td = document.createElement('td');
                        td.textContent = cellText;
                        row.appendChild(td);
                    });

                    historicoList.appendChild(row);
                });

                // Exibe a tabela apenas se houver resultados
                document.getElementById('historico-results-table').style.display = reunioes.length ? 'table' : 'none';
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao consultar o histórico de reuniões. Por favor, tente novamente.');
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

    // Adiciona evento para o cabeçalho da tabela para alternar a classificação
    const historicoTable = document.getElementById('historico-results-table');
    if (historicoTable && historicoTable.querySelector('th')) {
        historicoTable.querySelector('th').addEventListener('click', toggleSortOrder);
    }

    // Adiciona evento para o botão de download do Excel
    const downloadExcelButton = document.getElementById('download-excel');
    if (downloadExcelButton) {
        downloadExcelButton.addEventListener('click', downloadHistoricoExcel);
    }

    // Função para gerar e baixar o Excel com os dados atualmente exibidos na tabela
    function downloadHistoricoExcel() {
        const rows = document.querySelectorAll("#historico-results tr");

        if (!rows.length) {
            alert('Nenhum dado disponível para exportar.');
            return;
        }

        // Cria os dados para o Excel
        const data = Array.from(rows).map(row => Array.from(row.cells).map(cell => cell.innerText));

        // Adiciona cabeçalhos
        const headers = ["Data", "Horário", "Orador", "Sala", "Cliente/Funcionário"];
        data.unshift(headers);

        // Converte os dados em um workbook e gera o Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico de Reuniões");

        // Gera o arquivo Excel e faz o download
        XLSX.writeFile(workbook, "historico_reunioes.xlsx");
    }
});
