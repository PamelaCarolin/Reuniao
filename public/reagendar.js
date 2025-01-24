function openReagendarModal() {
    const selectedMeetings = getSelectedMeetings();
    if (selectedMeetings.length === 0) {
        alert('Por favor, selecione pelo menos uma reunião para reagendar.');
        return;
    }

    document.getElementById('reagendar-modal').style.display = 'block';
}

function closeReagendarModal() {
    document.getElementById('reagendar-modal').style.display = 'none';
}

/**
 * Obtém as reuniões selecionadas no formulário
 */
function getSelectedMeetings() {
    const checkboxes = document.querySelectorAll('#meeting-list input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Envia os dados para reagendar as reuniões selecionadas
 */
async function submitReagendar() {
    const selectedMeetings = getSelectedMeetings();
    const newDate = document.getElementById('reagendar-data').value;
    const newTime = document.getElementById('reagendar-horario').value;
    const newDuration = document.getElementById('reagendar-duracao').value;

    if (!newDate || !newTime || !newDuration) {
        alert('Preencha todos os campos para reagendar.');
        return;
    }

    try {
        const response = await fetch('/api/reunioes/reagendar-multiplos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ids: selectedMeetings,
                newDateTime: `${newDate} ${newTime}`,
                newDuration: newDuration
            })
        });

        if (response.ok) {
            alert('Reuniões reagendadas com sucesso!');
            closeReagendarModal();
            location.reload();
        } else {
            alert('Erro ao reagendar reuniões. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao reagendar reuniões:', error);
        alert('Ocorreu um erro ao tentar reagendar.');
    }
}
