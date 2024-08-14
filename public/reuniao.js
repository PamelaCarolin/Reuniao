// Define as variáveis globais para ordenação
let cancelSortOrder = 'asc'; // Padrão para o cancelamento
let sortOrder = 'asc'; // Padrão para a consulta

document.addEventListener('DOMContentLoaded', function() {
    // Event listeners e outras funções aqui...

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

            // Ordena as reuniões conforme o cancelSortOrder
            meetings.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
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

            // Certifica-se que as datas sejam formatadas corretamente no formato ISO antes da ordenação
            meetings.forEach(meeting => {
                meeting.date = new Date(meeting.date.split('/').reverse().join('-')).toISOString().split('T')[0];
            });

            // Ordena as reuniões por data e horário
            meetings.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
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

            // Filtra pelo nome do orador, se necessário
            if (speaker) {
                meetings = meetings.filter(meeting => meeting.speaker.toLowerCase().includes(speaker.toLowerCase()));
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

    // Event listeners globais
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

});

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
