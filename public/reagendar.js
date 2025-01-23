document.addEventListener('DOMContentLoaded', function() {
    // Adiciona evento aos botões de reagendamento
    document.querySelectorAll('.btn-reagendar').forEach(button => {
        button.addEventListener('click', function() {
            const meetingId = this.dataset.id; // Obtém o ID da reunião a partir do atributo data-id
            abrirModalReagendamento(meetingId);
        });
    });
});

/**
 * Abre um modal para o usuário inserir uma nova data e horário para a reunião
 * @param {string} meetingId - ID da reunião a ser reagendada
 */
function abrirModalReagendamento(meetingId) {
    const modalHtml = `
        <div id="modal-reagendar" class="modal">
            <div class="modal-content">
                <h2>Reagendar Reunião</h2>
                <label for="nova-data">Nova Data:</label>
                <input type="date" id="nova-data" required>
                <label for="novo-horario">Novo Horário:</label>
                <input type="time" id="novo-horario" required>
                <button onclick="confirmarReagendamento('${meetingId}')">Confirmar</button>
                <button onclick="fecharModal()">Cancelar</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Fecha o modal de reagendamento
 */
function fecharModal() {
    const modal = document.getElementById('modal-reagendar');
    if (modal) {
        modal.remove();
    }
}

/**
 * Confirma o reagendamento enviando os novos dados para o servidor
 * @param {string} meetingId - ID da reunião a ser reagendada
 */
async function confirmarReagendamento(meetingId) {
    const novaData = document.getElementById('nova-data').value;
    const novoHorario = document.getElementById('novo-horario').value;

    if (!novaData || !novoHorario) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        const response = await fetch('/api/reunioes/reagendar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: meetingId, newDate: `${novaData} ${novoHorario}` })
        });

        if (response.ok) {
            alert('Reunião reagendada com sucesso!');
            fecharModal();
            location.reload(); // Recarrega a página para refletir a mudança
        } else {
            const errorData = await response.json();
            alert(`Erro ao reagendar: ${errorData.message || 'Tente novamente.'}`);
        }
    } catch (error) {
        console.error('Erro ao reagendar reunião:', error);
        alert('Ocorreu um erro ao tentar reagendar. Verifique a conexão.');
    }
}
