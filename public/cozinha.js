// Toggle de exibição para formularios de consulta e cancelamento
function toggleConsultForm() {
    const consultForm = document.getElementById('consult-form');
    consultForm.style.display = consultForm.style.display === 'none' ? 'block' : 'none';
}

function toggleCancelForm() {
    const cancelForm = document.getElementById('cancel-form');
    cancelForm.style.display = cancelForm.style.display === 'none' ? 'block' : 'none';
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

// Cancelamento de reserva da cozinha
function cancelKitchenReservation() {
    const reservationId = document.getElementById('cancel-id').value;

    fetch(`/cancelar-cozinha/${reservationId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message);
        if (result.success) {
            document.getElementById('cancel-id').value = '';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao cancelar reserva.');
    });
}
