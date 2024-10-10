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
            const conflictEndTime = new Date(`1970-01-01T${conflict.endTime}`).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            alert(`Conflito detectado com a seguinte reunião:\nData: ${conflict.date}\nHorário de início: ${conflict.time}\nTérmino: ${conflictEndTime}\nOrador: ${conflict.speaker}\nSala: ${conflict.room}\nCliente/Funcionário: ${conflict.client}`);
        } else {
            alert(result.message || 'Erro ao agendar a reunião. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao agendar a reunião. Por favor, tente novamente.');
    });
});
