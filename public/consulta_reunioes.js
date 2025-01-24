document.addEventListener('DOMContentLoaded', function () {
    let sortOrder = 'asc'; // Define a ordem de classificação inicial

    // Carrega o histórico de reuniões ao iniciar
    loadHistorico();

    // Função para carregar o histórico de reuniões com filtros aplicados
    function loadHistorico() {
        if (!document.getElementById('data-inicial') || !document.getElementById('data-final')) {
            console.error('Elementos de data não encontrados.');
            return;
        }
        filterHistorico();
    }

    // Função para aplicar filtros e buscar dados no histórico
    function filterHistorico() {
        const dataInicial = document.getElementById('data-inicial')?.value || '';
        const dataFinal = document.getElementById('data-final')?.value || '';
        const orador = document.getElementById('orador')?.value || '';
        const sala = document.getElementById('sala')?.value || '';

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

                // Remove duplicatas antes de renderizar
                const uniqueReunioes = [];
                const uniqueSet = new Set();

                reunioes.forEach(reuniao => {
                    // Cria uma chave única para cada reunião
                    const key = `${reuniao.date}|${reuniao.time}|${reuniao.speaker}|${reuniao.room}|${reuniao.client}`;
                    if (!uniqueSet.has(key)) {
                        uniqueSet.add(key); // Adiciona ao Set para evitar duplicatas
                        uniqueReunioes.push(reuniao); // Adiciona à lista única
                    }
                });

                // Ordena as reuniões conforme a ordem selecionada
                uniqueReunioes.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                });

                // Preenche a tabela com os dados filtrados e únicos
                uniqueReunioes.forEach(reuniao => {
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
        const rows = Array.from(document.getElementById('historico-results').querySelectorAll('tr'));
        const filteredData = rows.map(row => {
            const cells = Array.from(row.children).map(cell => cell.textContent.trim());
            return {
                date: cells[0],   // Data
                time: cells[1],   // Horário
                speaker: cells[2], // Orador
                room: cells[3],   // Sala
                client: cells[4]  // Cliente/Funcionário
            };
        });

        // Cria um parâmetro JSON com os dados únicos
        const params = new URLSearchParams({ format: 'pdf' });
        params.append('filteredData', JSON.stringify(filteredData));

        fetch(`/consultar-historico-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filteredData }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao gerar o PDF.');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'historico.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao gerar o PDF.');
        });
    }

    // Adiciona evento para alternar a ordem de classificação
    const sortButton = document.getElementById('sort-historico');
    if (sortButton) {
        sortButton.addEventListener('click', toggleSortOrder);
    }
});
