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

// 🔹 **Correção da Função de Agendamento**
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

    if (!date || !time || !duration || !sector || !speaker || !room || !clientOrEmployee) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    // 🔹 **Verifica se há conflitos antes de agendar**
    fetch('/conflito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, duration, room })
    })
    .then(response => response.json())
    .then(result => {
        if (result.conflict) {
            suggestNewTime(result.conflict, duration);
        } else {
            // Se não houver conflito, procede com o agendamento
            agendarReuniao(date, time, duration, sector, speaker, room, clientOrEmployee);
        }
    })
    .catch(error => {
        console.error('Erro ao verificar conflito:', error);
        alert('Erro ao verificar conflito. Por favor, tente novamente.');
    });
});

// 🔹 **Corrigida função para enviar o agendamento corretamente**
function agendarReuniao(date, time, duration, sector, speaker, room, client) {
    fetch('/agendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, duration, sector, speaker, room, client })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Reunião agendada com sucesso!');
            document.getElementById('meeting-form').reset(); // Redefine o formulário

            // Perguntar se deseja baixar o arquivo .ics
            if (confirm('Deseja adicionar esta reunião ao seu calendário?')) {
                criarICSArquivo(date, time, duration, speaker, client, room);
            }
        } else {
            alert(result.message || 'Erro ao agendar a reunião. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Ocorreu um erro ao agendar a reunião. Por favor, tente novamente.');
    });
}

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
    // Captura os valores dos campos de filtro
    const filterDate = document.getElementById('consulta-data').value;
    const filterClient = document.getElementById('consulta-cliente').value;
    const filterSpeaker = document.getElementById('consulta-orador').value;
    const filterRoom = document.getElementById('consulta-sala').value;
    const filterSector = document.getElementById('consulta-setor').value;

    // Cria os parâmetros da URL com base nos filtros
    const params = new URLSearchParams({
        date: filterDate,
        client: filterClient,
        speaker: filterSpeaker,
        room: filterRoom,
        sector: filterSector
    });

    fetch(`/consultar?${params.toString()}`)
        .then(response => response.json())
        .then(meetings => {
            meetings.forEach(meeting => {
                const row = document.createElement('tr');

                const formattedDate = new Date(meeting.date.split('/').reverse().join('-'))
                    .toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const formattedTime = meeting.time.slice(0, 5);

                const idTd = document.createElement('td');
                idTd.textContent = meeting.id;
                idTd.style.border = '1px solid black';
                idTd.style.padding = '8px';
                row.appendChild(idTd);

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

                document.getElementById('meeting-list-body').appendChild(row);
            });
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao consultar as reuniões.');
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
    const filterId = document.getElementById('consulta-id')?.value || '';
    const filterDate = document.getElementById('consulta-data')?.value || '';
    const filterClient = document.getElementById('consulta-cliente')?.value || '';
    const filterSpeaker = document.getElementById('consulta-orador')?.value || '';
    const filterRoom = document.getElementById('consulta-sala')?.value || '';
    const filterSector = document.getElementById('consulta-setor')?.value || '';

    const params = new URLSearchParams({
        id: filterId,        
        date: filterDate,
        client: filterClient,
        speaker: filterSpeaker,
        room: filterRoom,
        sector: filterSector
    });

    fetch(`/consultar?${params.toString()}`)
        .then(response => response.json())
        .then(meetings => {
            // Limpa e preenche os resultados na tabela
            const tbody = document.getElementById('consult-results');
            tbody.innerHTML = '';

            meetings.forEach(meeting => {
                const row = document.createElement('tr');

                const idTd = document.createElement('td');
                idTd.textContent = meeting.id;
                row.appendChild(idTd);

                const formattedDate = new Date(meeting.date.split('/').reverse().join('-'))
                    .toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const dateTd = document.createElement('td');
                dateTd.textContent = formattedDate;
                row.appendChild(dateTd);

                const timeTd = document.createElement('td');
                timeTd.textContent = meeting.time.slice(0, 5);
                row.appendChild(timeTd);

                const speakerTd = document.createElement('td');
                speakerTd.textContent = meeting.speaker;
                row.appendChild(speakerTd);

                const clientTd = document.createElement('td');
                clientTd.textContent = meeting.client;
                row.appendChild(clientTd);

                const selectTd = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = meeting.id;
                selectTd.appendChild(checkbox);
                row.appendChild(selectTd);

                tbody.appendChild(row);
            });

          //  document.getElementById('consult-results-table').style.display = 'table';
        })
        .catch(error => {
            console.error('Erro ao consultar reuniões:', error);
            alert('Ocorreu um erro ao consultar as reuniões.');
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

// Alterna exibição do formulário de reagendamento
function toggleReagendarForm() {
    const reagendarForm = document.getElementById('reagendar-form');
    reagendarForm.style.display = reagendarForm.style.display === 'block' ? 'none' : 'block';
}

// Função para enviar solicitação de reagendamento
function submitReagendar() {
    const id = document.getElementById('reagendar-id').value.trim();
    const newDate = document.getElementById('reagendar-data').value.trim();
    const newTime = document.getElementById('reagendar-horario').value.trim();
    const newDuration = document.getElementById('reagendar-duracao').value.trim();
    const newRoom = document.getElementById('reagendar-sala').value.trim();

    if (!id) {
        alert('O campo ID é obrigatório.');
        return;
    }

    // Cria um objeto apenas com os campos preenchidos
    const updatedFields = { id };
    if (newDate) updatedFields.newDate = newDate;
    if (newTime) updatedFields.newTime = newTime;
    if (newDuration) updatedFields.newDuration = newDuration;
    if (newRoom) updatedFields.newRoom = newRoom;

    fetch('/reagendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Reunião reagendada com sucesso!');
            toggleReagendarForm();
        } else {
            alert(result.message || 'Erro ao reagendar a reunião.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Ocorreu um erro ao reagendar a reunião.');
    });
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
