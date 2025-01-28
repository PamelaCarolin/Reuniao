function suggestNewTime(conflictingMeeting, duration, meetings = []) {
    if (!meetings || !Array.isArray(meetings)) {
        console.error("Erro: lista de reuniões (meetings) não definida ou inválida.");
        alert("Erro ao verificar disponibilidade. Tente novamente.");
        return;
    }

    const workStartHour = 8;  // Início do expediente (08:00)
    const workEndHour = 18;   // Fim do expediente (18:00)
    const intervalBetweenMeetings = 30; // Intervalo entre reuniões (minutos)
    const availableRooms = ["Frente", "Fundo", "Teams"]; // Lista de salas disponíveis
    let suggestedRoom = conflictingMeeting.room; // Mantém a sala original primeiro

    // Criar um horário inicial baseado na reunião que causou conflito
    let conflictingEndTime = new Date(`${conflictingMeeting.date}T${conflictingMeeting.time}`);
    conflictingEndTime.setMinutes(conflictingEndTime.getMinutes() + parseInt(conflictingMeeting.duration, 10));
    let suggestedStartTime = new Date(conflictingEndTime);

    // Função auxiliar para verificar disponibilidade da sala e horário
    function isRoomAvailable(date, time, room) {
        return !meetings.some(meeting => 
            meeting.date === date && meeting.time === time && meeting.room === room
        );
    }

    // Primeiro, tenta sugerir um novo horário dentro da mesma sala
    while (!isRoomAvailable(suggestedStartTime.toISOString().split('T')[0], 
                            suggestedStartTime.toTimeString().slice(0, 5), 
                            suggestedRoom)) {
        suggestedStartTime.setMinutes(suggestedStartTime.getMinutes() + intervalBetweenMeetings);

        // Se passar do expediente, sugere no dia seguinte
        if (suggestedStartTime.getHours() >= workEndHour) {
            suggestedStartTime.setDate(suggestedStartTime.getDate() + 1);
            suggestedStartTime.setHours(workStartHour, 0, 0, 0);
        }
    }

    // Se a sala original estiver ocupada, tenta outra sala disponível
    if (suggestedRoom !== "Teams") { // "Teams" é sempre permitido
        const alternativeRoom = availableRooms.find(room => 
            room !== suggestedRoom && isRoomAvailable(suggestedStartTime.toISOString().split('T')[0], 
                                                      suggestedStartTime.toTimeString().slice(0, 5), 
                                                      room));
        if (alternativeRoom) {
            suggestedRoom = alternativeRoom;
        }
    }

    // Formatar a data e horário sugeridos
    const suggestedDate = suggestedStartTime.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const suggestedTime = suggestedStartTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', hour12: false
    });

    // Mensagem de sugestão
    const suggestionMessage = `Conflito de horário detectado! Sugerimos ${suggestedDate} às ${suggestedTime} na sala ${suggestedRoom}. Deseja aceitar?`;

    if (confirm(suggestionMessage)) {
        document.getElementById('data').value = suggestedStartTime.toISOString().split('T')[0];
        document.getElementById('horario').value = suggestedTime;
        document.getElementById('sala').value = suggestedRoom;
        alert('Novo horário atualizado.');
    } else {
        alert('Buscando outro horário...');
        // Se o usuário recusar, sugere apenas um novo horário na mesma sala original
        while (!isRoomAvailable(suggestedStartTime.toISOString().split('T')[0], 
                                suggestedStartTime.toTimeString().slice(0, 5), 
                                conflictingMeeting.room)) {
            suggestedStartTime.setMinutes(suggestedStartTime.getMinutes() + intervalBetweenMeetings);
        }

        const finalSuggestedDate = suggestedStartTime.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const finalSuggestedTime = suggestedStartTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        if (confirm(`Última sugestão: ${finalSuggestedDate} às ${finalSuggestedTime} na sala ${conflictingMeeting.room}. Deseja aceitar?`)) {
            document.getElementById('data').value = suggestedStartTime.toISOString().split('T')[0];
            document.getElementById('horario').value = finalSuggestedTime;
            document.getElementById('sala').value = conflictingMeeting.room;
            alert('Novo horário atualizado.');
        } else {
            alert('Nenhuma sugestão disponível. Escolha outro horário manualmente.');
        }
    }
}
