document.addEventListener('DOMContentLoaded', function() {
    function waitForTableLoad() {
        const table = document.getElementById('historico-results');
        
        if (!table || table.children.length === 0) {
            console.warn('Aguardando a tabela ser carregada...');
            setTimeout(waitForTableLoad, 1000);
            return;
        }

        const buttons = document.querySelectorAll('.btn-reagendar');
        
        if (buttons.length === 0) {
            console.warn('Nenhum botão de reagendamento encontrado. Aguardando...');
            setTimeout(waitForTableLoad, 1000);
            return;
        }

        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const meetingId = this.getAttribute('data-id');
                if (!meetingId) {
                    alert('Erro: ID da reunião não encontrado.');
                    return;
                }
                openReagendarModal(meetingId);
            });
        });

        console.log('Botões de reagendamento detectados.');
    }

    waitForTableLoad();
});

/**
 * Abre o modal para reagendamento.
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
