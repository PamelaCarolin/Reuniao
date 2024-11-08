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
        const resultsList = document.getElementById('consult-results');
        resultsList.innerHTML = '';

        if (data.length > 0) {
            data.forEach(reservation => {
                const listItem = document.createElement('li');
                listItem.textContent = `ID: ${reservation.id}, Horário: ${reservation.time}, Equipe: ${reservation.team}, Motivo: ${reservation.reason}`;
                resultsList.appendChild(listItem);
            });
        } else {
            resultsList.innerHTML = '<li>Nenhuma reserva encontrada para esta data.</li>';
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
        const cancelList = document.getElementById('cancel-results');
        cancelList.innerHTML = '';

        if (data.length > 0) {
            data.forEach(reservation => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `ID: ${reservation.id}, Data: ${reservation.date}, Horário: ${reservation.time}, Equipe: ${reservation.team} 
                    <button onclick="cancelKitchenReservation(${reservation.id})" class="button-small">Cancelar</button>`;
                cancelList.appendChild(listItem);
            });
        } else {
            cancelList.innerHTML = '<li>Não há reservas para cancelar.</li>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao carregar reservas para cancelamento.');
    });
}

// Cancelamento de reserva da cozinha
function cancelKitchenReservation(reservationId) {
    fetch(`/cancelar-cozinha/${reservationId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message);
        if (result.success) {
            loadCancellations(); // Recarrega a lista de cancelamento após sucesso
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao cancelar reserva.');
    });
}
