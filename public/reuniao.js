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

    fetch('/agendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, duration, sector, speaker, room, client: clientOrEmployee })
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao agendar a reunião. Por favor, tente novamente.');
    });
});

function isPastTime(date, time) {
    const now = new Date();
    const meetingTime = new Date(`${date}T${time}`);
    return meetingTime < now;
}

function validateInput(date, time, duration, sector, speaker, room, clientOrEmployee) {
    return date && time && duration && sector && speaker && room && clientOrEmployee;
}

function toggleReuniaoTipo() {
    const tipoReuniao = document.getElementById('tipo-reuniao').value;
    const clienteGroup = document.getElementById('cliente-group');
    const funcionarioGroup = document.getElementById('funcionario-group');

    if (tipoReuniao === 'externa') {
        clienteGroup.style.display = 'block';
        funcionarioGroup.style.display = 'none';
    } else if (tipoReuniao === 'interna') {
        clienteGroup.style.display = 'none';
        funcionarioGroup.style.display = 'block';
    } else {
        clienteGroup.style.display = 'none';
        funcionarioGroup.style.display = 'none';
    }
}

function toggleCancelForm() {
    const cancelForm = document.getElementById('cancel-form');
    cancelForm.style.display = cancelForm.style.display === 'block' ? 'none' : 'block';
    if (cancelForm.style.display === 'block') {
        loadMeetings();
    }
}

function loadMeetings() {
    const filterDate = document.getElementById('filtro-data').value;
    const filterClient = document.getElementById('filtro-cliente').value;

    const params = new URLSearchParams({ date: filterDate, client: filterClient });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        const meetingList = document.getElementById('meeting-list');
        meetingList.innerHTML = '';
        meetings.forEach(meeting => {
            const formattedDate = new Date(meeting.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const li = document.createElement('li');
            li.textContent = `${formattedDate} - ${meeting.time.slice(0, 5)} - ${meeting.speaker} - ${meeting.room} - ${meeting.client}`;
            li.setAttribute('data-id', meeting.id);
            li.addEventListener('click', function() {
                if (confirm('Você tem certeza que deseja cancelar esta reunião?')) {
                    cancelMeeting(meeting.id);
                }
            });
            meetingList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao carregar as reuniões. Por favor, tente novamente.');
    });
}

function closeCancelForm() {
    document.getElementById('cancel-form').style.display = 'none';
}

function cancelMeeting(id) {
    fetch('/cancelar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message);
        loadMeetings();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao cancelar a reunião. Por favor, tente novamente.');
    });
}

function toggleConsultForm() {
    const consultForm = document.getElementById('consult-form');
    consultForm.style.display = consultForm.style.display === 'block' ? 'none' : 'block';
}

function consultMeetings() {
    const date = document.getElementById('consulta-data').value;
    const client = document.getElementById('consulta-cliente').value;
    const room = document.getElementById('consulta-sala').value;
    const sector = document.getElementById('consulta-setor').value;

    const params = new URLSearchParams({ date, client, room, sector });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        // Ordena as reuniões por data e horário (mais recente primeiro)
        meetings.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA; // Ordem decrescente
        });

        const results = document.getElementById('consult-results');
        results.innerHTML = '';
        meetings.forEach(meeting => {
            const formattedDate = new Date(meeting.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const formattedTime = meeting.time.slice(0, 5); // Formata para HH:MM

            const li = document.createElement('li');
            li.textContent = `${formattedDate} - ${formattedTime} - ${meeting.speaker} - ${meeting.room} - ${meeting.client}`;
            results.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao consultar as reuniões. Por favor, tente novamente.');
    });
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const date = document.getElementById('consulta-data').value;
    const client = document.getElementById('consulta-cliente').value;
    const room = document.getElementById('consulta-sala').value;
    const sector = document.getElementById('consulta-setor').value;

    const params = new URLSearchParams({ date, client, room, sector });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        const tableColumn = ["DATA", "HORÁRIO", "ORADOR", "SALA", "CLIENTE/FUNCIONÁRIO"];
        const tableRows = [];

        meetings.forEach(meeting => {
            const formattedDate = new Date(meeting.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const formattedTime = meeting.time.slice(0, 5); // Formata para HH:MM
            const meetingData = [
                formattedDate,
                formattedTime,
                meeting.speaker,
                meeting.room,
                meeting.client
            ];
            tableRows.push(meetingData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 10,
            theme: 'striped'
        });

        doc.save('reunioes.pdf');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    });
}

document.getElementById('logout-button').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('confirm-logout').classList.add('open');
});
