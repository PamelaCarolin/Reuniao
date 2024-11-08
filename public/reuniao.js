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
    document.getElementById('cancel-results').innerHTML = ''; // Limpa os resultados anteriores
    loadCancellations(); // Carrega todas as reservas para cancelar
}

// Evento de submissão do formulário de reserva
document.getElementById('kitchen-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const date = document.getElementById('data').value;
    const time = document.getElementById('horario').value;
    const duration = document.getElementById('duracao').value;
    const team = document.getElementById('equipe').value;
    const reason = document.getElementById('motivo').value;

    fetch('/reservar-cozinha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, duration, team, reason })
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message);
        if (result.success) {
            document.getElementById('kitchen-form').reset();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao reservar a cozinha.');
    });
});

// Consulta de reservas da cozinha
function consultKitchenReservations() {
    const date = document.getElementById('consulta-data').value;

    fetch(`/consultar-cozinha?date=${date}`)
    .then(response => response.json())
    .then(data => {
        const resultsTable = document.getElementById('consult-results-table');
        const resultsBody = document.getElementById('consult-results');
        resultsBody.innerHTML = ''; // Limpa os resultados anteriores

        if (data.length > 0) {
            resultsTable.style.display = 'table';
            data.forEach(reservation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(reservation.date)}</td>
                    <td>${formatTime(reservation.time)}</td>
                    <td>${reservation.team}</td>
                    <td>${reservation.reason}</td>
                `;
                resultsBody.appendChild(row);
            });
        } else {
            resultsTable.style.display = 'none';
            alert('Nenhuma reserva encontrada para esta data.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao consultar reservas da cozinha.');
    });
}

// Carrega todas as reservas para o cancelamento
function loadCancellations() {
    fetch(`/consultar-cozinha`)
    .then(response => response.json())
    .then(data => {
        const cancelTable = document.getElementById('cancel-results-table');
        const cancelBody = document.getElementById('cancel-results');
        cancelBody.innerHTML = ''; // Limpa os resultados anteriores

        if (data.length > 0) {
            data.forEach(reservation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="cancel-checkbox" value="${reservation.id}"></td>
                    <td>${formatDate(reservation.date)}</td>
                    <td>${formatTime(reservation.time)}</td>
                    <td>${reservation.team}</td>
                `;
                cancelBody.appendChild(row);
            });
        } else {
            alert('Não há reservas para cancelar.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao carregar reservas para cancelamento.');
    });
}

// Seleciona/Deseleciona todos os checkboxes
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.cancel-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

// Cancela as reservas selecionadas
function cancelSelectedReservations() {
    const selectedIds = Array.from(document.querySelectorAll('.cancel-checkbox:checked'))
                              .map(checkbox => checkbox.value);

    if (selectedIds.length === 0) {
        alert('Selecione pelo menos uma reserva para cancelar.');
        return;
    }

    Promise.all(selectedIds.map(id =>
        fetch(`/cancelar-cozinha/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log(`Reserva ID ${id} cancelada com sucesso.`);
            } else {
                console.error(`Erro ao cancelar reserva ID ${id}:`, result.message);
            }
        })
    )).then(() => {
        alert('Reservas selecionadas foram canceladas.');
        loadCancellations(); // Recarrega a lista após cancelamento
    }).catch(error => {
        console.error('Erro ao cancelar reservas:', error);
        alert('Erro ao cancelar reservas.');
    });
}
