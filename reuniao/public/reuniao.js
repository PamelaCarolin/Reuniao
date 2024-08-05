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

    fetch('https://SEU_BACKEND.vercel.app/agendar', { // Substitua pela URL do seu backend no Vercel
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

