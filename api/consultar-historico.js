let sortOrder = 'asc'; // Define a ordem de classificação inicial para o histórico

document.addEventListener('DOMContentLoaded', function () {
    // Carrega o histórico ao carregar a página
    loadHistorico();

    // Função principal para carregar o histórico
    function loadHistorico() {
        filterHistorico();
    }

    // Função que aplica filtros e busca dados no histórico
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

                const historicoList = document.getElementById('historico-results');
                historicoList.innerHTML = ''; // Limpa os dados existentes na tabela

                // Ordena as reuniões por data e hora
                reunioes.sort((a, b) => {
                    const dateA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
                    const dateB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                });

                // Popula a tabela com os dados
                reunioes.forEach(reuniao => {
                    const row = document.createElement('tr');

                    const formattedDate = new Date(reuniao.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    const formattedTime = reuniao.time.slice(0, 5);

                    const cells = [
                        formattedDate,
                        formattedTime,
                        `${reuniao.speaker} / ${reuniao.sector} / ${reuniao.room}`,
                        reuniao.origin === 'interna' ? 'Interna' : 'Externa', // Exibe se é interna ou externa
                        reuniao.status || 'Concluída'
                    ];

                    cells.forEach(cellText => {
                        const td = document.createElement('td');
                        td.textContent = cellText;
                        row.appendChild(td);
                    });

                    historicoList.appendChild(row);
                });

                // Exibe ou oculta a tabela com base nos resultados
                document.getElementById('historico-results-table').style.display = reunioes.length ? 'table' : 'none';
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao consultar o histórico de reuniões. Por favor, tente novamente.');
            });
    }

    // Alterna a ordem de classificação
    function toggleSortOrder() {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        loadHistorico();
    }

    // Adiciona eventos para os botões e elementos interativos
    const searchButton = document.getElementById('search-historico');
    if (searchButton) {
        searchButton.addEventListener('click', loadHistorico);
    }

    const historicoTable = document.getElementById('historico-results-table');
    if (historicoTable && historicoTable.querySelector('th')) {
        historicoTable.querySelector('th').addEventListener('click', toggleSortOrder);
    }

    const downloadPdfButton = document.getElementById('download-pdf');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', downloadHistoricoPDF);
    }

    // Gera e baixa o PDF com os dados exibidos
    function downloadHistoricoPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const tableColumn = ["DATA", "HORÁRIO", "ORADOR / SETOR / SALA", "TIPO", "STATUS"];
        const tableRows = [];

        const rows = document.querySelectorAll("#historico-results tr");

        rows.forEach(row => {
            const rowData = Array.from(row.cells).map(cell => cell.innerText);
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 10,
            theme: 'striped'
        });

        doc.save('historico_reunioes.pdf');
    }
});

