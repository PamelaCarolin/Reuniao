let cancelSortOrder = 'asc'; // Definindo a ordem de classificação inicial para cancelamento
let sortOrder = 'asc'; // Definindo a ordem de classificação inicial para consulta

document.addEventListener('DOMContentLoaded', function() {
    // Função para alternar a visibilidade dos campos "Cliente" e "Funcionário"
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

    // Função para verificar se o horário da reunião já passou
    function isPastTime(date, time) {
        const now = new Date();
        const meetingTime = new Date(`${date}T${time}`);
        return meetingTime < now;
    }

    // Função para validar a entrada de dados no formulário
    function validateInput(date, time, duration, sector, speaker, room, clientOrEmployee) {
        return date && time && duration && sector && speaker && room && clientOrEmployee;
    }

    // Função de agendamento de reunião
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
                alert(`Conflito detectado com a seguinte reunião:\nData: ${conflict.date}\nHorário: ${conflict.time}\nOrador: ${conflict.speaker}\nSala: ${conflict.room}\nCliente/Funcionário: ${conflict.client}`);
            } else {
                alert(result.message || 'Erro ao agendar a reunião. Por favor, tente novamente.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocorreu um erro ao agendar a reunião. Por favor, tente novamente.');
        });
    });

    // Função para criar um arquivo .ics sem organizador
    function criarICSArquivo(date, time, duration, speaker, clientOrEmployee, room) {
        // Convertendo data e hora para o formato adequado
        const startDate = new Date(`${date}T${time}`);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        // Formatação da data no formato ICS com UTC (Z indica UTC)
        const formattedStartDate = startDate.toISOString().replace(/-|:|\.\d+/g, '') + 'Z';
        const formattedEndDate = endDate.toISOString().replace(/-|:|\.\d+/g, '') + 'Z';

        // Conteúdo do arquivo .ics sem o organizador e com descrição vazia
        const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Agendamento de Reunião
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${new Date().getTime()}@example.com
DTSTAMP:${formattedStartDate}
DTSTART:${formattedStartDate}
DTEND:${formattedEndDate}
SUMMARY:Reunião com ${clientOrEmployee}
DESCRIPTION:
LOCATION:${room}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
        `.trim();

        // Criar um arquivo blob com o conteúdo do ICS
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);

        // Criar um link temporário para download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reuniao.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Adiciona o event listener para o campo de seleção "Tipo de Reunião"
    document.getElementById('tipo-reuniao').addEventListener('change', toggleReuniaoTipo);

    const toggleCancelFormBtn = document.getElementById('toggle-cancel-form');
    if (toggleCancelFormBtn) {
        toggleCancelFormBtn.addEventListener('click', toggleCancelForm);
    }

    const toggleConsultFormBtn = document.getElementById('toggle-consult-form');
    if (toggleConsultFormBtn) {
        toggleConsultFormBtn.addEventListener('click', toggleConsultForm);
    }

    const cancelSelectedBtn = document.getElementById('cancel-selected');
    if (cancelSelectedBtn) {
        cancelSelectedBtn.addEventListener('click', cancelSelectedMeetings);
    }

    const downloadPdfBtn = document.getElementById('download-pdf');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadPDF);
    }

    // Inicializa a página definindo o estado inicial dos campos
    toggleReuniaoTipo();
});

// Outras funcionalidades para cancelar e consultar reuniões...

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
        if (!Array.isArray(meetings)) {
            console.error('Erro: resposta inesperada ao consultar reuniões');
            return;
        }

        meetings.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return cancelSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        const meetingList = document.getElementById('meeting-list');
        meetingList.innerHTML = '';

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
            const formattedTime = meeting.time.slice(0, 5);

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
        alert('Ocorreu um erro ao consultar as reuniões. Por favor, tente novamente.');
    });
}

function toggleCancelSortOrder() {
    cancelSortOrder = cancelSortOrder === 'desc' ? 'asc' : 'desc';
    loadMeetings();
}

function toggleSortOrder() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    consultMeetings();
}

function consultMeetings() {
    const date = document.getElementById('consulta-data').value;
    const client = document.getElementById('consulta-cliente').value;
    const speaker = document.getElementById('consulta-orador').value;
    const room = document.getElementById('consulta-sala').value;
    const sector = document.getElementById('consulta-setor').value;

    const params = new URLSearchParams({ date, client, speaker, room, sector });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        if (!Array.isArray(meetings)) {
            console.error('Erro: resposta inesperada ao consultar reuniões');
            return;
        }

        meetings.forEach(meeting => {
            meeting.date = new Date(meeting.date.split('/').reverse().join('-')).toISOString().split('T')[0];
        });

        meetings.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        const results = document.getElementById('consult-results');
        results.innerHTML = '';

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
            const formattedTime = meeting.time.slice(0, 5);

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

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const date = document.getElementById('consulta-data').value;
    const client = document.getElementById('consulta-cliente').value;
    const speaker = document.getElementById('consulta-orador').value;
    const room = document.getElementById('consulta-sala').value;
    const sector = document.getElementById('consulta-setor').value;

    const params = new URLSearchParams({ date, client, speaker, room, sector });

    fetch(`/consultar?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        if (!Array.isArray(meetings)) {
            console.error('Erro: resposta inesperada ao consultar reuniões');
            return;
        }

        if (speaker) {
            meetings = meetings.filter(meeting => meeting.speaker.toLowerCase().includes(speaker.toLowerCase()));
        }

        const tableColumn = ["DATA", "HORÁRIO", "ORADOR", "SALA", "CLIENTE/FUNCIONÁRIO"];
        const tableRows = [];

        meetings.forEach(meeting => {
            const formattedDate = new Date(meeting.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const formattedTime = meeting.time.slice(0, 5);
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

function toggleCancelForm() {
    const cancelForm = document.getElementById('cancel-form');
    cancelForm.style.display = cancelForm.style.display === 'block' ? 'none' : 'block';
    if (cancelForm.style.display === 'block') {
        loadMeetings();
    }
}

function toggleConsultForm() {
    const consultForm = document.getElementById('consult-form');
    consultForm.style.display = consultForm.style.display === 'block' ? 'none' : 'block';
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

function closeCancelForm() {
    document.getElementById('cancel-form').style.display = 'none';
}
