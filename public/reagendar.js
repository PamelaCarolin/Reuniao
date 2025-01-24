document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn-reagendar').forEach(button => {
        button.addEventListener('click', function() {
            const meetingId = this.getAttribute('data-id');  // Captura o ID corretamente do botão

            if (!meetingId || meetingId === "undefined") {
                alert('Erro: Nenhuma reunião selecionada. Por favor, selecione uma reunião para reagendar.');
                return;
            }

            openReagendarModal(meetingId);
        });
    });
});

/**
 * Abre o modal para o usuário inserir uma nova data e horário para a reunião.
 * @param {string} meetingId - ID da reunião a ser reagendada.
 */
function openReagendarModal(meetingId) {
    closeModal(); // Fecha qualquer modal anterior antes de abrir um novo.

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

/**
 * Fecha o modal de reagendamento.
 */
function closeModal() {
    const modal = document.getElementById('reagendar-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Envia os dados de reagendamento para o servidor e atualiza a tabela.
 * @param {string} meetingId - ID da reunião a ser reagendada.
 */
async function submitReagendar(meetingId) {
    const novaData = document.getElementById('reagendar-data').value;
    const novoHorario = document.getElementById('reagendar-horario').value;

    if (!novaData || !novoHorario || !meetingId || meetingId === "undefined") {
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
            updateTable(meetingId, novaData, novoHorario);
            closeModal();
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

/**
 * Atualiza a tabela dinamicamente com os novos dados da reunião reagendada.
 * @param {string} meetingId - ID da reunião reagendada.
 * @param {string} newDate - Nova data reagendada.
 * @param {string} newTime - Novo horário reagendado.
 */
function updateTable(meetingId, newDate, newTime) {
    const row = document.querySelector(`tr[data-id='${meetingId}']`);
    if (row) {
        row.querySelector('.date-cell').innerText = newDate;
        row.querySelector('.time-cell').innerText = newTime;
    }
}

// Torna as funções acessíveis globalmente para serem chamadas pelo HTML
window.openReagendarModal = openReagendarModal;
window.closeModal = closeModal;
window.submitReagendar = submitReagendar;
