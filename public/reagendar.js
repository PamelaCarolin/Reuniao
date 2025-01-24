function openReagendarModal() {
    // Remover qualquer modal existente antes de adicionar um novo
    fecharModal();

    // Criar o modal dinamicamente e adicioná-lo ao body
    const modalHtml = `
        <div id="reagendar-modal" class="modal">
            <div class="modal-content">
                <h2>Reagendar Reunião</h2>
                <label for="reagendar-data">Nova Data:</label>
                <input type="date" id="reagendar-data" required>
                <label for="reagendar-horario">Novo Horário:</label>
                <input type="time" id="reagendar-horario" required>
                <button onclick="submitReagendar()">Confirmar</button>
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
 * Função para submeter os dados de reagendamento
 */
async function submitReagendar() {
    const novaData = document.getElementById('reagendar-data').value;
    const novoHorario = document.getElementById('reagendar-horario').value;

    if (!novaData || !novoHorario) {
        alert('Preencha todos os campos para reagendar.');
        return;
    }

    try {
        const response = await fetch('/api/reunioes/reagendar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                newDate: `${novaData} ${novoHorario}`
            })
        });

        if (response.ok) {
            alert('Reunião reagendada com sucesso!');
            fecharModal();
            location.reload();
        } else {
            alert('Erro ao reagendar reunião. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao reagendar:', error);
        alert('Ocorreu um erro ao tentar reagendar.');
    }
}
