let sortOrder = 'asc'; // Definindo a ordem de classificação inicial para o histórico (das mais antigas para as mais recentes)

document.addEventListener('DOMContentLoaded', function () {
    // Carregar o histórico de reuniões ao iniciar
    loadHistorico();

    // Função para carregar o histórico de reuniões com filtros
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

        // Exibe os valores dos filtros no console para depuração
        console.log("Filtros:", { dataInicial, dataFinal, setor, orador, sala });

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

                // Ordena as reuniões do mais antigo para o mais recente
                reunioes.sort((a, b) => {
                    const dateA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
                    const dateB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                });

                // Popula a tabela com os resultados
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
                        reuniao.status || 'Concluída' // Exibe o status ou 'Concluída' como padrão
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

    // Evento de clique para o botão de pesquisa
    const searchButton = document.getElementById('search-historico');
    if (searchButton) {
        searchButton.addEventListener('click', loadHistorico);
    }

    // Verifica se o cabeçalho da tabela existe antes de adicionar o evento para alternar a classificação
    const historicoTable = document.getElementById('historico-results-table');
    if (historicoTable && historicoTable.querySelector('th')) {
        historicoTable.querySelector('th').addEventListener('click', toggleSortOrder);
    }

    // Função para baixar o histórico de reuniões em PDF
    const downloadPdfButton = document.getElementById('download-pdf');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', downloadHistoricoPDF);
    }

    function downloadHistoricoPDF() {
        const dataInicial = document.getElementById('data-inicial').value;
        const dataFinal = document.getElementById('data-final').value;
        const setor = document.getElementById('setor').value;
        const orador = document.getElementById('orador').value;
        const sala = document.getElementById('sala').value;

        const params = new URLSearchParams({ dataInicial, dataFinal, setor, orador, sala });

        fetch(`/consultar-historico?${params.toString()}`)
            .then(response => response.json())
            .then(reunioes => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const tableColumn = ["DATA", "HORÁRIO", "ORADOR", "SETOR", "SALA", "STATUS"];
                const tableRows = [];

                reunioes.forEach(reuniao => {
                    const formattedDate = new Date(reuniao.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    const formattedTime = reuniao.time.slice(0, 5);
                    const rowData = [
                        formattedDate,
                        formattedTime,
                        reuniao.speaker,
                        reuniao.sector,
                        reuniao.room,
                        reuniao.status || 'Concluída'
                    ];
                    tableRows.push(rowData);
                });

                doc.autoTable({
                    head: [tableColumn],
                    body: tableRows,
                    startY: 10,
                    theme: 'striped'
                });

                doc.save('historico_reunioes.pdf');
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao gerar o PDF do histórico de reuniões.');
            });
    }
});
