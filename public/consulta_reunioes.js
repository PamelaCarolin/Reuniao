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

                reunioes.forEach(reuniao => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', reuniao.id);

                    const formattedDate = new Date(reuniao.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                    const formattedTime = reuniao.time.slice(0, 5);

                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${formattedTime}</td>
                        <td>${reuniao.speaker}</td>
                        <td>${reuniao.room}</td>
                        <td>${reuniao.client}</td>
                        <td><button class="btn-reagendar" data-id="${reuniao.id}">Reagendar</button></td>
                    `;

                    historicoList.appendChild(row);
                });

                attachReagendarEvent();

                document.getElementById('historico-results-table').style.display = 'table';
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao consultar o histórico de reuniões.');
            });
    }

    // Função para adicionar eventos de clique aos botões de reagendamento
    function attachReagendarEvent() {
        const buttons = document.querySelectorAll('.btn-reagendar');
        if (buttons.length === 0) {
            console.warn('Nenhum botão de reagendamento encontrado.');
            return;
        }

        buttons.forEach(button => {
            button.addEventListener('click', function () {
                const meetingId = this.getAttribute('data-id');
                openReagendarModal(meetingId);
            });
        });

        console.log('Botões de reagendamento detectados e eventos atribuídos.');
    }

    // Abre o modal de reagendamento para reuniões selecionadas
    function openReagendarModal(meetingId) {
        closeModal();

        const modalHtml = `
            <div id="reagendar-modal" class="modal">
                <div class="modal-content">
                    <h2>Reagendar Reunião</h2>
                    <label for="reagendar-data">Nova Data:</label>
                    <input type="date" id="reagendar-data" required>
                    <label for="reagendar-horario">Novo Horário:</label>
                    <input type="time" id="reagendar-horario" required>
                    <button onclick="submitReagendar('${meetingId}')">Confirmar</button>
                    <button onclick="closeModal()">Cancelar</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('reagendar-modal').style.display = 'flex';
    }

    // Fecha o modal de reagendamento
    function closeModal() {
        const modal = document.getElementById('reagendar-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Submete os novos dados de reagendamento para o servidor
    async function submitReagendar(meetingId) {
        const novaData = document.getElementById('reagendar-data').value;
        const novoHorario = document.getElementById('reagendar-horario').value;

        if (!novaData || !novoHorario) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        try {
            const response = await fetch('/agendar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: meetingId, newDate: `${novaData} ${novoHorario}` })
            });

            if (response.ok) {
                alert('Reunião reagendada com sucesso!');
                closeModal();
                loadHistorico();  // Atualiza a tabela após reagendar
            } else {
                const errorData = await response.json();
                alert(`Erro ao reagendar: ${errorData.error || 'Tente novamente.'}`);
            }
        } catch (error) {
            console.error('Erro ao reagendar reunião:', error);
            alert('Erro ao tentar reagendar. Verifique a conexão.');
        }
    }

    // Alterna a ordem de classificação e recarrega o histórico
    function toggleSortOrder() {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        loadHistorico();
    }

    // Adiciona evento para o botão de pesquisa
    document.getElementById('search-historico')?.addEventListener('click', loadHistorico);

    // Adiciona evento para alternar a ordem de classificação
    document.getElementById('sort-historico')?.addEventListener('click', toggleSortOrder);
});
