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

let cancelSortOrder = 'asc';

function loadMeetings() {
    filterMeetings();
}

function filterMeetings() {
    const filterDate = document.getElementById('filtro-data').value;
    const filterClient = document.getElementById('filtro-cliente').value;

    const params = new URLSearchParams({ date: filterDate, client: filterClient });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        // Ordena as reuniões conforme o cancelSortOrder
        meetings.sort((a, b) => {
            const dateA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
            const dateB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
            return cancelSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        const meetingList = document.getElementById('meeting-list');
        meetingList.innerHTML = '';

        // Cria a tabela e cabeçalhos
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const headers = ['Data', 'Horário', 'Orador', 'Sala', 'Cliente/Funcionário', 'Selecionar'];
        headers.forEach((headerText, index) => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.border = '1px solid black';
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            th.style.cursor = 'pointer';

            if (index === 0) {
                const arrow = document.createElement('span');
                arrow.textContent = cancelSortOrder === 'desc' ? ' ▼' : ' ▲';
                th.appendChild(arrow);
                th.addEventListener('click', () => toggleCancelSortOrder());
            }

            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        meetings.forEach(meeting => {
            const row = document.createElement('tr');

            const formattedDate = new Date(meeting.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const formattedTime = meeting.time.slice(0, 5); // Formata para HH:MM

            const cells = [
                formattedDate,
                formattedTime,
                meeting.speaker,
                meeting.room,
                meeting.client
            ];

            cells.forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.style.border = '1px solid black';
                td.style.padding = '8px';
                row.appendChild(td);
            });

            // Adiciona checkbox para seleção
            const selectTd = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = meeting.id;
            selectTd.appendChild(checkbox);
            selectTd.style.border = '1px solid black';
            selectTd.style.padding = '8px';
            row.appendChild(selectTd);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        meetingList.appendChild(table);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao carregar as reuniões. Por favor, tente novamente.');
    });
}

function toggleCancelSortOrder() {
    cancelSortOrder = cancelSortOrder === 'desc' ? 'asc' : 'desc';
    loadMeetings();
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

function cancelSelectedMeetings() {
    const checkboxes = document.querySelectorAll('#meeting-list input[type="checkbox"]:checked');
    const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (ids.length === 0) {
        alert('Selecione pelo menos uma reunião para cancelar.');
        return;
    }

    if (!confirm('Você tem certeza que deseja cancelar as reuniões selecionadas?')) {
        return;
    }

    ids.forEach(id => cancelMeeting(id));
}

function toggleConsultForm() {
    const consultForm = document.getElementById('consult-form');
    consultForm.style.display = consultForm.style.display === 'block' ? 'none' : 'block';
}

let sortOrder = 'asc'; // Default order is ascending

function consultMeetings() {
    const date = document.getElementById('consulta-data').value;
    const client = document.getElementById('consulta-cliente').value;
    const funcionario = document.getElementById('consulta-funcionario').value;
    const room = document.getElementById('consulta-sala').value;
    const sector = document.getElementById('consulta-setor').value;

    const params = new URLSearchParams({ date, client, funcionario, room, sector });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        // Filtra pelo nome do funcionário, se necessário
        if (funcionario) {
            meetings = meetings.filter(meeting => meeting.client.toLowerCase().includes(funcionario.toLowerCase()));
        }

        // Ordena as reuniões conforme o sortOrder
        meetings.sort((a, b) => {
            const dateA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
            const dateB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        const results = document.getElementById('consult-results');
        results.innerHTML = '';

        // Cria a tabela e cabeçalhos
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const headers = ['Data', 'Horário', 'Orador', 'Sala', 'Cliente/Funcionário'];
        headers.forEach((headerText, index) => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.border = '1px solid black';
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            th.style.cursor = 'pointer';

            // Adiciona setinha para ordenar por data
            if (index === 0) {
                const arrow = document.createElement('span');
                arrow.textContent = sortOrder === 'desc' ? ' ▼' : ' ▲';
                th.appendChild(arrow);
                th.addEventListener('click', () => toggleSortOrder());
            }

            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        meetings.forEach(meeting => {
            const row = document.createElement('tr');

            const formattedDate = new Date(meeting.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const formattedTime = meeting.time.slice(0, 5); // Formata para HH:MM

            const cells = [
                formattedDate,
                formattedTime,
                meeting.speaker,
                meeting.room,
                meeting.client
            ];

            cells.forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.style.border = '1px solid black';
                td.style.padding = '8px';
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        results.appendChild(table);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao consultar as reuniões. Por favor, tente novamente.');
    });
}

function toggleSortOrder() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    consultMeetings();
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const date = document.getElementById('consulta-data').value;
    const client = document.getElementById('consulta-cliente').value;
    const funcionario = document.getElementById('consulta-funcionario').value;
    const room = document.getElementById('consulta-sala').value;
    const sector = document.getElementById('consulta-setor').value;

    const params = new URLSearchParams({ date, client, funcionario, room, sector });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        // Filtra pelo nome do funcionário, se necessário
        if (funcionario) {
            meetings = meetings.filter(meeting => meeting.client.toLowerCase().includes(funcionario.toLowerCase()));
        }

        const tableColumn = ["DATA", "HORÁRIO", "ORADOR", "SALA", "CLIENTE/FUNCIONÁRIO"];
        const tableRows = [];

        meetings.forEach(meeting => {
            const formattedDate = new Date(meeting.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
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
