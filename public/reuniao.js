// Executa o código apenas após o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", function() {
    // Função para formatar data e horário para o padrão pt-BR
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    }

    function formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        return `${hours}:${minutes}`;
    }

    // Alterna exibição do formulário de consulta
    function toggleConsultForm() {
        const consultForm = document.getElementById('consult-form');
        consultForm.style.display = consultForm.style.display === 'none' ? 'block' : 'none';
        document.getElementById('consult-results').innerHTML = ''; // Limpa os resultados anteriores
    }

    // Alterna exibição do formulário de cancelamento
    function toggleCancelForm() {
        const cancelForm = document.getElementById('cancel-form');
        cancelForm.style.display = cancelForm.style.display === 'none' ? 'block' : 'none';
        const meetingList = document.getElementById('meeting-list');
        if (meetingList) meetingList.innerHTML = ''; // Limpa os resultados anteriores
        loadCancellations(); // Carrega todas as reservas para cancelar
    }

    // Evento de submissão do formulário de agendamento de reunião
    const meetingForm = document.getElementById('meeting-form');
    if (meetingForm) {
        meetingForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const date = document.getElementById('data').value;
            const time = document.getElementById('horario').value;
            const duration = document.getElementById('duracao').value;
            const orador = document.getElementById('nome-orador').value;
            const setor = document.getElementById('setor').value;
            const sala = document.getElementById('sala').value;
            const tipoReuniao = document.getElementById('tipo-reuniao').value;
            const cliente = document.getElementById('cliente').value;
            const funcionario = document.getElementById('funcionario').value;

            fetch('/agendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date, time, duration, orador, setor, sala, tipoReuniao, cliente, funcionario })
            })
            .then(response => response.json())
            .then(result => {
                alert(result.message);
                if (result.success) {
                    meetingForm.reset();
                }
            })
            .catch(error => {
                console.error('Erro ao agendar reunião:', error);
                alert('Erro ao agendar a reunião.');
            });
        });
    }

    // Consulta de reuniões
    function consultMeetings() {
        const date = document.getElementById('consulta-data').value;
        const cliente = document.getElementById('consulta-cliente').value;
        const orador = document.getElementById('consulta-orador').value;
        const sala = document.getElementById('consulta-sala').value;
        const setor = document.getElementById('consulta-setor').value;

        fetch(`/consultar?date=${date}&cliente=${cliente}&orador=${orador}&sala=${sala}&setor=${setor}`)
        .then(response => response.json())
        .then(data => {
            const resultsTable = document.getElementById('consult-results-table');
            const resultsBody = document.getElementById('consult-results');
            if (resultsBody) resultsBody.innerHTML = ''; // Limpa os resultados anteriores

            if (data.length > 0) {
                resultsTable.style.display = 'table';
                data.forEach(meeting => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDate(meeting.date)}</td>
                        <td>${formatTime(meeting.time)}</td>
                        <td>${meeting.orador}</td>
                        <td>${meeting.sala}</td>
                        <td>${meeting.cliente || meeting.funcionario || 'N/A'}</td>
                    `;
                    resultsBody.appendChild(row);
                });
            } else {
                resultsTable.style.display = 'none';
                alert('Nenhuma reunião encontrada para os critérios fornecidos.');
            }
        })
        .catch(error => {
            console.error('Erro ao consultar reuniões:', error);
            alert('Erro ao consultar reuniões.');
        });
    }

    // Carrega todas as reuniões para o cancelamento
    function loadCancellations() {
        fetch(`/consultar`)
        .then(response => response.json())
        .then(data => {
            const cancelTable = document.getElementById('meeting-list-table');
            const cancelBody = document.getElementById('meeting-list');
            if (cancelBody) cancelBody.innerHTML = ''; // Limpa os resultados anteriores

            if (data.length > 0) {
                data.forEach(meeting => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="checkbox" class="cancel-checkbox" value="${meeting.id}"></td>
                        <td>${formatDate(meeting.date)}</td>
                        <td>${formatTime(meeting.time)}</td>
                        <td>${meeting.orador}</td>
                        <td>${meeting.sala}</td>
                    `;
                    cancelBody.appendChild(row);
                });
            } else {
                alert('Não há reuniões para cancelar.');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar reuniões para cancelamento:', error);
            alert('Erro ao carregar reuniões para cancelamento.');
        });
    }

    // Seleciona/Deseleciona todos os checkboxes
    function toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('.cancel-checkbox');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
    }

    // Cancela as reuniões selecionadas
    function cancelSelectedMeetings() {
        const selectedIds = Array.from(document.querySelectorAll('.cancel-checkbox:checked'))
                                  .map(checkbox => checkbox.value);

        if (selectedIds.length === 0) {
            alert('Selecione pelo menos uma reunião para cancelar.');
            return;
        }

        Promise.all(selectedIds.map(id =>
            fetch(`/cancelar/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    console.log(`Reunião ID ${id} cancelada com sucesso.`);
                } else {
                    console.error(`Erro ao cancelar reunião ID ${id}:`, result.message);
                }
            })
        )).then(() => {
            alert('Reuniões selecionadas foram canceladas.');
            loadCancellations(); // Recarrega a lista após cancelamento
        }).catch(error => {
            console.error('Erro ao cancelar reuniões:', error);
            alert('Erro ao cancelar reuniões.');
        });
    }
});
