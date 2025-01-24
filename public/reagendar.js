function openReagendarModal(meetingId) {
    fecharModal(); // Fecha qualquer modal aberto antes

    const modalHtml = `
        <div id="reagendar-modal" class="modal">
            <div class="modal-content">
                <h2>Reagendar Reunião</h2>
                <label for="reagendar-data">Nova Data:</label>
                <input type="date" id="reagendar-data" required>
                <label for="reagendar-horario">Novo Horário:</label>
                <input type="time" id="reagendar-horario" required>
                <button onclick="submitReagendar('${meetingId}')">Confirmar</button>
                <button onclick="fecharModal()">Cancelar</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('reagendar-modal').style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('reagendar-modal');
    if (modal) {
        modal.remove();
    }
}

async function submitReagendar(meetingId) {
    const novaData = document.getElementById('reagendar-data').value;
    const novoHorario = document.getElementById('reagendar-horario').value;

    if (!novaData || !novoHorario || !meetingId) {
        alert('Preencha todos os campos corretamente.');
        return;
    }

    try {
        console.log(`Enviando reagendamento para ID: ${meetingId}, Data: ${novaData}, Horário: ${novoHorario}`);

        const response = await fetch('/reagendar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(meetingId), newDate: `${novaData} ${novoHorario}` })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Reunião reagendada com sucesso!');
            fecharModal();
            location.reload();
        } else if (result.suggestedTime) {
            alert(`Horário indisponível. Sugerimos reagendar para: ${result.suggestedTime}`);
        } else {
            alert(result.error || 'Erro ao reagendar. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao reagendar reunião:', error);
        alert('Ocorreu um erro ao tentar reagendar. Verifique a conexão.');
    }
}

// Torna a função acessível globalmente
window.openReagendarModal = openReagendarModal;
window.fecharModal = fecharModal;
window.submitReagendar = submitReagendar;
