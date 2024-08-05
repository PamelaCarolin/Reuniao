document.getElementById('meeting-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const date = document.getElementById('data').value;
    const time = document.getElementById('horario').value;
    const duration = document.getElementById('duracao').value;
    const sector = document.getElementById('setor').value;
    const speaker = document.getElementById('nome-orador').value;
    const room = document.getElementById('sala').value;
    const client = document.getElementById('cliente').value;

    if (isPastTime(date, time)) {
        alert("Não é possível agendar uma reunião para um horário que já passou.");
        return;
    }

    if (!validateInput(date, time, duration, sector, speaker, room, client)) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    fetch('/agendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, duration, sector, speaker, room, client })
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

function validateInput(date, time, duration, sector, speaker, room, client) {
    return date && time && duration && sector && speaker && room && client;
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
            const li = document.createElement('li');
            const formattedDate = new Date(meeting.date).toLocaleDateString('pt-BR');
            li.textContent = `${formattedDate} - ${meeting.time} - ${meeting.speaker} - ${meeting.room}`;
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
        const results = document.getElementById('consult-results');
        results.innerHTML = '';
        meetings.forEach(meeting => {
            const li = document.createElement('li');
            const formattedDate = new Date(meeting.date).toLocaleDateString('pt-BR');
            li.textContent = `${formattedDate} - ${meeting.time} - ${meeting.duration} minutos - ${meeting.sector} - ${meeting.room} - ${meeting.client}`;
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
        const tableColumn = ["DATA", "HORÁRIO", "TEMPO DE DURAÇÃO", "SETOR", "SALA", "CLIENTE"];
        const tableRows = [];

        meetings.forEach(meeting => {
            const formattedDate = new Date(meeting.date).toLocaleDateString('pt-BR');
            const meetingData = [
                formattedDate,
                meeting.time,
                `${meeting.duration} minutos`,
                meeting.sector,
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

var dialog = document.getElementById('confirm-logout');
var btnYes = dialog.querySelector('.yes');
var btnNo = dialog.querySelector('.no');

btnYes.addEventListener('click', function(event) {
    var logoutHref = document.getElementById('logout-button').getAttribute('href');
    window.location.href = logoutHref;
});

btnNo.addEventListener('click', function(event) {
    dialog.classList.remove('open');
});
