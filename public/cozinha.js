document.getElementById('kitchen-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita o envio padrão do formulário

    // Captura os valores dos campos do formulário
    const date = document.getElementById('data').value;
    const time = document.getElementById('horario').value;
    const duration = document.getElementById('duracao').value;
    const team = document.getElementById('equipe').value;
    const reason = document.getElementById('motivo').value;

    // Validação básica dos campos
    if (!date || !time || !duration || !team || !reason) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Envio dos dados para o backend
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
            alert(result.message); // Exibe mensagem de sucesso
            document.getElementById('kitchen-form').reset(); // Reseta o formulário após o envio bem-sucedido
        } else {
            alert(result.message || 'Erro ao reservar a cozinha. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao reservar a cozinha. Por favor, tente novamente.');
    });
});
