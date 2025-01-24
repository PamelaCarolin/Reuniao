document.addEventListener('DOMContentLoaded', function() {
    function waitForReagendarButtons() {
        const buttons = document.querySelectorAll('.btn-reagendar');

        if (buttons.length === 0) {
            console.warn('Nenhum botão de reagendamento encontrado. Aguardando a tabela ser carregada...');
            setTimeout(waitForReagendarButtons, 1000); // Tenta novamente em 1 segundo
            return;
        }

        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const meetingId = this.getAttribute('data-id');

                if (!meetingId || meetingId.trim() === "") {
                    alert('Por favor, selecione uma reunião válida antes de reagendar.');
                    return;
                }

                openReagendarModal(meetingId);
            });
        });

        console.log('Botões de reagendamento prontos.');
    }

    waitForReagendarButtons();
});

/**
 * Abre o modal para o usuário inserir uma nova data e horário para a reunião.
 * @param {string} meetingId - ID da reunião a ser reagendada.
 */
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
 * Torna as funções globais para uso no HTML.
 */
window.openReagendarModal = openReagendarModal;
window.closeModal = closeModal;
