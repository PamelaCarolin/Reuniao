document.addEventListener('DOMContentLoaded', function() {
    // Configura a verificação automática para mover reuniões passadas para o histórico a cada 2 horas
    setInterval(movePastMeetingsToHistory, 2 * 60 * 60 * 1000); // Executa a cada 2 horas

    // Adiciona o evento para abrir o formulário de geração de relatório
    const reportButton = document.getElementById('generate-report');
    if (reportButton) {
        reportButton.addEventListener('click', toggleReportForm);
    }
});

// Função para alternar exibição do formulário de geração de relatório de reuniões antigas
function toggleReportForm() {
    const reportForm = document.getElementById('report-form');
    reportForm.style.display = reportForm.style.display === 'none' ? 'block' : 'none';
}

// Função para mover reuniões passadas para a tabela de "reuniões antigas"
function movePastMeetingsToHistory() {
    fetch('/mover-reunioes-passadas')
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            console.log(result.message); // Sucesso
        } else {
            console.error('Erro ao mover reuniões passadas:', result.message); // Falha
        }
    })
    .catch(error => {
        console.error('Erro ao mover reuniões passadas:', error); // Erro de rede ou servidor
    });
}

// Função para gerar o relatório em PDF das reuniões antigas
function generateReport() {
    // Captura os filtros fornecidos pelo usuário
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    const speaker = document.getElementById('report-speaker').value;
    const room = document.getElementById('report-room').value;

    const params = new URLSearchParams({
        startDate,
        endDate,
        speaker,
        room
    });

    // Faz uma requisição ao backend para obter as reuniões antigas com os filtros aplicados
    fetch(`/relatorio-reunioes-antigas?${params.toString()}`)
    .then(response => response.json())
    .then(meetings => {
        // Importando jsPDF para gerar o PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const tableColumn = ["DATA", "HORÁRIO", "ORADOR", "SALA", "CLIENTE/FUNCIONÁRIO", "MOTIVO"];
        const tableRows = [];

        // Organiza as reuniões antigas em linhas para o relatório
        meetings.forEach(meeting => {
            const formattedDate = new Date(meeting.date).toLocaleDateString('pt-BR');
            const formattedTime = meeting.time.slice(0, 5);
            const meetingData = [
                formattedDate,
                formattedTime,
                meeting.speaker,
                meeting.room,
                meeting.client,
                meeting.motivo
            ];
            tableRows.push(meetingData);
        });

        // Cria o PDF usando o jsPDF
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 10,
            theme: 'striped'
        });

        // Salva o relatório gerado
        doc.save('relatorio_reunioes_antigas.pdf');
    })
    .catch(error => {
        console.error('Erro ao gerar relatório:', error);
        alert('Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.');
    });
}
