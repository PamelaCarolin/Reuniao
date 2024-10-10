document.getElementById('meeting-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const date = document.getElementById('data').value;
    const time = document.getElementById('horario').value;
    const duration = document.getElementById('duracao').value;
    const sector = document.getElementById('setor').value;
    const speaker = document.getElementById('nome-orador').value;
    const room = document.getElementById('sala').value;
    const tipoReuniao = document.getElementById('tipo-reuniao').value;
    const cliente = document.getElementById('cliente').value;
    const funcionario = document.getElementById('funcionario').value;

    const clientOrEmployee = tipoReuniao === 'externa' ? cliente : funcionario;

    if (isPastTime(date, time)) {
        alert("Não é possível agendar uma reunião para um horário que já passou.");
        return;
    }

    if (!validateInput(date, time, duration, sector, speaker, room, clientOrEmployee)) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    // Requisição para o backend
    fetch('/agendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, duration, sector, speaker, room, client: clientOrEmployee })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert(result.message);
            document.getElementById('meeting-form').reset(); // Redefine o formulário
            toggleReuniaoTipo(); // Atualiza a visibilidade dos campos

            // Perguntar se deseja baixar o arquivo .ics
            if (confirm('Deseja adicionar esta reunião ao seu calendário?')) {
                criarICSArquivo(date, time, duration, speaker, clientOrEmployee, room);
            }
        } else if (result.conflict) {
            const conflict = result.conflict;

            // Hora de início da reunião conflitante
            const conflictStartTime = new Date(`${conflict.date}T${conflict.time}`);

            // Calcula o horário de término da reunião conflitante (adicionando a duração da reunião conflitante)
            const conflictDuration = conflict.duration; // Duração da reunião conflitante (em minutos)
            const conflictEndTime = new Date(conflictStartTime.getTime() + conflictDuration * 60000);

            // Formatação da data e hora
            const formattedConflictDate = conflictStartTime.toLocaleDateString('pt-BR');
            const formattedStartTime = conflictStartTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const formattedEndTime = conflictEndTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            // Mostra a mensagem de conflito com horário de início, término e duração
            alert(`Conflito detectado com a seguinte reunião:\nData: ${formattedConflictDate}\nHorário de início: ${formattedStartTime}\nTérmino: ${formattedEndTime}\nDuração: ${conflict.duration} minutos\nOrador: ${conflict.speaker}\nSala: ${conflict.room}\nCliente/Funcionário: ${conflict.client}`);
        } else {
            alert(result.message || 'Erro ao agendar a reunião. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao agendar a reunião. Por favor, tente novamente.');
    });
});
