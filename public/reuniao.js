let cancelSortOrder = 'asc'; 
let sortOrder = 'asc'; 

document.addEventListener('DOMContentLoaded', function() {
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

    function isPastTime(date, time) {
        const now = new Date();
        const meetingTime = new Date(`${date}T${time}`);
        return meetingTime < now;
    }

    function validateInput(date, time, duration, sector, speaker, room, clientOrEmployee) {
        return date && time && duration && sector && speaker && room && clientOrEmployee;
    }

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
            if (result.success) {
                alert(result.message);
                document.getElementById('meeting-form').reset();
                toggleReuniaoTipo();
            } else {
                alert(result.message || 'Erro ao agendar a reunião.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao agendar a reunião.');
        });
    });

    function renderTable(meetings, targetElementId) {
        const meetingList = document.getElementById(targetElementId);
        meetingList.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('styled-table');

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Selecionar</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Orador</th>
                <th>Sala</th>
                <th>Cliente/Funcionário</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        meetings.forEach(meeting => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" value="${meeting.id}"></td>
                <td>${meeting.date}</td>
                <td>${meeting.time}</td>
                <td>${meeting.speaker}</td>
                <td>${meeting.room}</td>
                <td>${meeting.client}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        meetingList.appendChild(table);
    }

    function loadMeetings(targetElementId) {
        fetch('/consultar')
        .then(response => response.json())
        .then(meetings => {
            renderTable(meetings, targetElementId);
        })
        .catch(error => {
            console.error('Erro ao carregar reuniões:', error);
            alert('Erro ao carregar as reuniões.');
        });
    }

    document.querySelector('.button[onclick="toggleCancelForm()"]').addEventListener('click', function() {
        toggleForm('cancel-form');
        loadMeetings('meeting-list');
    });

    document.querySelector('.button[onclick="toggleModifyForm()"]').addEventListener('click', function() {
        toggleForm('modify-form');
        loadMeetings('modify-meeting-list');
    });

    document.querySelector('.button[onclick="toggleConsultForm()"]').addEventListener('click', function() {
        toggleForm('consult-form');
        loadMeetings('consult-results');
    });

    function toggleForm(formId) {
        const form = document.getElementById(formId);
        form.style.display = form.style.display === 'block' ? 'none' : 'block';
    }

    function modifySelectedMeetings() {
        const checkboxes = document.querySelectorAll('#modify-meeting-list input[type="checkbox"]:checked');
        const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (ids.length === 0) {
            alert('Selecione pelo menos uma reunião para modificar.');
            return;
        }

        alert(`Modificar reuniões: ${ids.join(', ')}`);
    }
});

    // Adicionar lógica de modificação aqui futuramente
}

function rescheduleMeeting() {
    const id = document.getElementById('reschedule-id').value;
    const date = document.getElementById('reschedule-data').value;
    const time = document.getElementById('reschedule-horario').value;
    const duration = document.getElementById('reschedule-duracao').value;

    if (!id || !date || !time || !duration) {
        alert("Por favor, preencha todos os campos para reagendar.");
        return;
    }

    if (isPastTime(date, time)) {
        alert("Não é possível reagendar para um horário que já passou.");
        return;
    }

    fetch('/agendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, date, time, duration })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Reunião reagendada com sucesso!');
            document.getElementById('reschedule-form').style.display = 'none';
            loadMeetings('meeting-list'); // Atualizar a lista após o reagendamento
        } else {
            alert(result.message || 'Erro ao reagendar a reunião. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Erro ao reagendar reunião:', error);
        alert('Ocorreu um erro ao reagendar a reunião.');
    });
}

// Função para abrir a modal de reagendamento com dados preenchidos
function openRescheduleModal(id, date, time, duration) {
    document.getElementById('reschedule-id').value = id;
    document.getElementById('reschedule-data').value = date;
    document.getElementById('reschedule-horario').value = time;
    document.getElementById('reschedule-duracao').value = duration;

    document.getElementById('reschedule-form').style.display = 'block';
}

// Função para fechar a modal de reagendamento
function toggleRescheduleForm() {
    const form = document.getElementById('reschedule-form');
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
}

function closeCancelForm() {
    document.getElementById('cancel-form').style.display = 'none';
}

function closeModifyForm() {
    document.getElementById('modify-form').style.display = 'none';
}

// Função para carregar reuniões na tabela
function loadMeetings(listId) {
    fetch('/consultar')
    .then(response => response.json())
    .then(meetings => {
        const meetingList = document.getElementById(listId);
        meetingList.innerHTML = '';

        meetings.forEach(meeting => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <input type="checkbox" value="${meeting.id}">
                ${meeting.date} - ${meeting.time} - ${meeting.speaker} - ${meeting.room} - ${meeting.client}
            `;
            meetingList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Erro ao carregar reuniões:', error);
        alert('Ocorreu um erro ao carregar as reuniões.');
    });
}

function toggleCancelForm() {
    const cancelForm = document.getElementById('cancel-form');
    cancelForm.style.display = cancelForm.style.display === 'block' ? 'none' : 'block';
    if (cancelForm.style.display === 'block') {
        loadMeetings('meeting-list');
    }
}

function toggleModifyForm() {
    const modifyForm = document.getElementById('modify-form');
    modifyForm.style.display = modifyForm.style.display === 'block' ? 'none' : 'block';
    if (modifyForm.style.display === 'block') {
        loadMeetings('modify-meeting-list');
    }
}

function toggleConsultForm() {
    const consultForm = document.getElementById('consult-form');
    consultForm.style.display = consultForm.style.display === 'block' ? 'none' : 'block';
    if (consultForm.style.display === 'block') {
        loadMeetings('consult-results');
    }
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
        loadMeetings('meeting-list');
    })
    .catch(error => {
        console.error('Erro ao cancelar reunião:', error);
        alert('Ocorreu um erro ao cancelar a reunião.');
    });
}

function consultMeetings() {
    const date = document.getElementById('consulta-data').value;
    const client = document.getElementById('consulta-cliente').value;

    fetch(`/consultar?date=${date}&client=${client}`)
        .then(response => response.json())
        .then(meetings => {
            renderTable(meetings, 'consult-results');
        })
        .catch(error => {
            console.error('Erro ao consultar reuniões:', error);
            alert('Ocorreu um erro ao consultar as reuniões.');
        });
}

function downloadPDF() {
    const doc = new jsPDF();
    doc.text("Relatório de Reuniões", 20, 10);

    const rows = [];
    document.querySelectorAll('#consult-results tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => rowData.push(cell.innerText));
        rows.push(rowData);
    });

    doc.autoTable({
        head: [['Data', 'Horário', 'Orador', 'Sala', 'Cliente/Funcionário']],
        body: rows
    });

    doc.save('reunioes.pdf');
}

document.getElementById('download-pdf').addEventListener('click', downloadPDF);

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tipo-reuniao').addEventListener('change', toggleReuniaoTipo);
});

function sortMeetings(column, order) {
    const rows = Array.from(document.querySelectorAll('#consult-results tbody tr'));

    rows.sort((a, b) => {
        const colA = a.children[column].innerText.trim();
        const colB = b.children[column].innerText.trim();

        if (order === 'asc') {
            return colA.localeCompare(colB, undefined, { numeric: true });
        } else {
            return colB.localeCompare(colA, undefined, { numeric: true });
        }
    });

    const tbody = document.querySelector('#consult-results tbody');
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

document.querySelectorAll('#consult-results th').forEach((th, index) => {
    th.addEventListener('click', () => {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        sortMeetings(index, sortOrder);
    });
});

function toggleModifyForm() {
    const modifyForm = document.getElementById('modify-form');
    modifyForm.style.display = modifyForm.style.display === 'block' ? 'none' : 'block';
    if (modifyForm.style.display === 'block') {
        loadMeetings('modify-meeting-list');
    }
}

function modifySelectedMeetings() {
    const checkboxes = document.querySelectorAll('#modify-meeting-list input[type="checkbox"]:checked');
    const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (ids.length === 0) {
        alert('Selecione pelo menos uma reunião para modificar.');
        return;
    }

    if (!confirm('Você tem certeza que deseja modificar as reuniões selecionadas?')) {
        return;
    }

    alert(`Modificar reuniões: ${ids.join(', ')}`);
}

function rescheduleMeeting() {
    const id = document.getElementById('reschedule-id').value;
    const date = document.getElementById('reschedule-data').value;
    const time = document.getElementById('reschedule-horario').value;
    const duration = document.getElementById('reschedule-duracao').value;

    if (!id || !date || !time || !duration) {
        alert("Por favor, preencha todos os campos para reagendar.");
        return;
    }

    if (isPastTime(date, time)) {
        alert("Não é possível reagendar para um horário que já passou.");
        return;
    }

    fetch('/agendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, date, time, duration })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Reunião reagendada com sucesso!');
            document.getElementById('reschedule-form').style.display = 'none';
            loadMeetings('meeting-list');
        } else {
            alert(result.message || 'Erro ao reagendar a reunião. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Erro ao reagendar reunião:', error);
        alert('Ocorreu um erro ao reagendar a reunião.');
    });
}

function openRescheduleModal(id, date, time, duration) {
    document.getElementById('reschedule-id').value = id;
    document.getElementById('reschedule-data').value = date;
    document.getElementById('reschedule-horario').value = time;
    document.getElementById('reschedule-duracao').value = duration;

    document.getElementById('reschedule-form').style.display = 'block';
}

function toggleRescheduleForm() {
    const form = document.getElementById('reschedule-form');
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
}

function closeCancelForm() {
    document.getElementById('cancel-form').style.display = 'none';
}

function closeModifyForm() {
    document.getElementById('modify-form').style.display = 'none';
}

function loadMeetings(listId) {
    fetch('/consultar')
    .then(response => response.json())
    .then(meetings => {
        const meetingList = document.getElementById(listId);
        meetingList.innerHTML = '';

        meetings.forEach(meeting => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" value="${meeting.id}"></td>
                <td>${meeting.date}</td>
                <td>${meeting.time}</td>
                <td>${meeting.speaker}</td>
                <td>${meeting.room}</td>
                <td>${meeting.client}</td>
            `;
            meetingList.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Erro ao carregar reuniões:', error);
        alert('Ocorreu um erro ao carregar as reuniões.');
    });
}

function closeConsultForm() {
    document.getElementById('consult-form').style.display = 'none';
}

// Função para baixar reuniões em formato PDF
function downloadPDF() {
    const doc = new jsPDF();
    doc.text("Relatório de Reuniões", 20, 10);

    const rows = [];
    document.querySelectorAll('#consult-results tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => rowData.push(cell.innerText));
        rows.push(rowData);
    });

    doc.autoTable({
        head: [['Data', 'Horário', 'Orador', 'Sala', 'Cliente/Funcionário']],
        body: rows
    });

    doc.save('reunioes.pdf');
}

// Inicializa o estado inicial dos campos na página ao carregar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tipo-reuniao').addEventListener('change', toggleReuniaoTipo);

    const downloadPdfBtn = document.getElementById('download-pdf');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadPDF);
    }
});

// Função para alternar a exibição das colunas ordenando os dados da tabela
function sortMeetings(column, order, tableId) {
    const rows = Array.from(document.querySelectorAll(`#${tableId} tbody tr`));

    rows.sort((a, b) => {
        const colA = a.children[column].innerText.trim();
        const colB = b.children[column].innerText.trim();

        return order === 'asc' ? colA.localeCompare(colB, undefined, { numeric: true }) 
                               : colB.localeCompare(colA, undefined, { numeric: true });
    });

    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

// Adicionar evento de clique para ordenar colunas
document.querySelectorAll('#consult-results th').forEach((th, index) => {
    th.addEventListener('click', () => {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        sortMeetings(index, sortOrder, 'consult-results');
    });
});

// Função para selecionar todas as reuniões em uma tabela
function selectAllMeetings(listId, checkbox) {
    const checkboxes = document.querySelectorAll(`#${listId} input[type="checkbox"]`);
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

// Eventos de clique para selecionar todas as reuniões nas tabelas
document.getElementById('select-all-cancel').addEventListener('change', function() {
    selectAllMeetings('meeting-list', this);
});

document.getElementById('select-all-modify').addEventListener('change', function() {
    selectAllMeetings('modify-meeting-list', this);
});

document.getElementById('select-all-consult').addEventListener('change', function() {
    selectAllMeetings('consult-results', this);
});
