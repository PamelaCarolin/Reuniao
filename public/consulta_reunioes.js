let sortOrder = 'asc'; // Define a ordem de classificação inicial para o histórico

document.addEventListener('DOMContentLoaded', function () {
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

                // Limpa o corpo da tabela antes de adicionar novas linhas
                const historicoList = document.getElementById('historico-results');
                historicoList.innerHTML = '';

                // Ordena as reuniões conforme a ordem selecionada
                reunioes.sort((a, b) => {
                    const dateA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
                    const dateB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                });

                // Preenche a tabela com os dados filtrados
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
                        reuniao.status || 'Concluída'
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

    // Adiciona evento para o botão de download do PDF
    const downloadPdfButton = document.getElementById('download-pdf');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', downloadHistoricoPDF);
    }

    // Função para gerar e baixar o PDF com os dados atualmente exibidos na tabela
    function downloadHistoricoPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Define cabeçalhos da tabela para o PDF
        const tableColumn = ["DATA", "HORÁRIO", "ORADOR", "SETOR", "SALA", "STATUS"];
        const tableRows = [];

        // Seleciona todas as linhas exibidas na tabela de resultados
        const rows = document.querySelectorAll("#historico-results tr");

        // Extrai dados das linhas exibidas e prepara para o PDF
        rows.forEach(row => {
            const rowData = Array.from(row.cells).map(cell => cell.innerText);
            tableRows.push(rowData);
        });

        // Gera a tabela no PDF com os dados exibidos
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 10,
            theme: 'striped'
        });

        // Salva o PDF diretamente no computador do usuário
        doc.save('historico_reunioes.pdf');
    }
});
