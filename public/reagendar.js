document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn-reagendar').forEach(button => {
        button.addEventListener('click', function() {
            const meetingId = this.dataset.id; // Obtém o ID da reunião
            abrirModalReagendamento(meetingId);
        });
    });
});

/**
 * Abre um modal para o usuário inserir uma nova data e horário para a reunião
 * @param {string} meetingId - ID da reunião a ser reagendada
 */
function abrirModalReagendamento(meetingId) {
    fecharModal(); // Fecha o modal anterior, se existir

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

/**
 * Fecha o modal de reagendamento
 */
function fecharModal() {
    const modal = document.getElementById('reagendar-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Envia os dados de reagendamento para o servidor
 * @param {string} meetingId - ID da reunião a ser reagendada
 */
async function submitReagendar(meetingId) {
    const novaData = document.getElementById('reagendar-data').value;
    const novoHorario = document.getElementById('reagendar-horario').value;

    if (!novaData || !novoHorario) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        const response = await fetch('/reagendar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: meetingId, newDate: `${novaData} ${novoHorario}` })
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
