document.getElementById('kitchen-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const date = document.getElementById('data').value;
    const time = document.getElementById('horario').value;
    const duration = document.getElementById('duracao').value;
    const team = document.getElementById('equipe').value;
    const reason = document.getElementById('motivo').value;

    fetch('/reservar-cozinha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, duration, team, reason })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert(result.message);
            document.getElementById('kitchen-form').reset();
        } else {
            alert(result.message || 'Erro ao reservar a cozinha. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao reservar a cozinha. Por favor, tente novamente.');
    });
});
