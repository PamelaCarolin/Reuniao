document.addEventListener('DOMContentLoaded', function() {
    // Adiciona evento aos botões de reagendamento
    document.querySelectorAll('.btn-reagendar').forEach(button => {
        button.addEventListener('click', function() {
            const meetingId = this.dataset.id; // Obtém o ID da reunião
            const newDate = prompt("Informe a nova data e hora (YYYY-MM-DD HH:MM):"); // Solicita nova data

            if (newDate) {
                reagendarReuniao(meetingId, newDate); // Chama a função de reagendamento
            }
        });
    });
});

/**
 * Função para reagendar uma reunião
 * @param {string} meetingId - ID da reunião a ser reagendada
 * @param {string} newDate - Nova data e hora para a reunião
 */
async function reagendarReuniao(meetingId, newDate) {
    try {
        const response = await fetch('/api/reunioes/reagendar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: meetingId, newDate })
        });

        if (response.ok) {
            alert('Reunião reagendada com sucesso!');
            location.reload(); // Recarrega a página para atualizar a lista
        } else {
            const errorData = await response.json();
            alert(`Erro ao reagendar: ${errorData.message || 'Tente novamente.'}`);
        }
    } catch (error) {
        console.error('Erro ao reagendar reunião:', error);
        alert('Ocorreu um erro ao tentar reagendar. Verifique a conexão.');
    }
}
