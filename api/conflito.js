const db = require('./database');

module.exports = async (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;

    try {
        // Ignorar verificação de conflito se a sala for "Teams"
        if (room.toLowerCase() === 'teams') {
            await insertMeeting(date, time, duration, sector, speaker, room, client);
            return res.json({ success: true, message: 'Reunião agendada com sucesso!' });
        }

        // Verificar conflitos apenas para reuniões na mesma sala
        const conflictQuery = `
            SELECT * FROM meetings 
            WHERE date = $1 
            AND room = $2
            AND (
                ($3::time BETWEEN time AND (time + INTERVAL '1 minute' * duration)) OR 
                (($3::time + INTERVAL '1 minute' * $4) BETWEEN time AND (time + INTERVAL '1 minute' * duration))
            )
        `;
        const conflictValues = [date, room, time, duration];
        const conflictCheck = await db.query(conflictQuery, conflictValues);

        if (conflictCheck.rows.length > 0) {
            // Se houver conflito, sugere um novo horário e/ou sala
            const suggestedTimeAndRoom = await findNextAvailableTimeAndRoom(date, room, duration);

            return res.status(400).json({
                success: false,
                conflict: {
                    date: suggestedTimeAndRoom.date,
                    time: suggestedTimeAndRoom.time,
                    room: suggestedTimeAndRoom.room,
                    duration: duration
                },
                message: 'Conflito detectado. Novo horário e/ou sala sugeridos.'
            });
        }

        // Se não houver conflito, insere a nova reunião
        await insertMeeting(date, time, duration, sector, speaker, room, client);
        res.json({ success: true, message: 'Reunião agendada com sucesso!' });

    } catch (err) {
        console.error('Erro ao agendar reunião:', err);
        res.status(500).json({ success: false, message: 'Erro ao agendar reunião.' });
    }
};

// Função para inserir a reunião no banco de dados
async function insertMeeting(date, time, duration, sector, speaker, room, client) {
    const insertQuery = `
        INSERT INTO meetings (date, time, duration, sector, speaker, room, client)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const insertValues = [date, time, duration, sector, speaker, room, client];
    await db.query(insertQuery, insertValues);
}

// Função para encontrar o próximo horário e sala disponíveis dentro do expediente
async function findNextAvailableTimeAndRoom(date, currentRoom, duration) {
    const workStartHour = 8;
    const workEndHour = 18;
    const intervalBetweenMeetings = 30; // minutos
    const availableRooms = ["Frente", "Fundo"]; // Salas consideradas (exceto "Teams")

    let currentTime = new Date(`${date}T08:00:00`);
    const endOfDay = new Date(`${date}T18:00:00`);

    while (currentTime < endOfDay) {
        // Tenta sugerir primeiro na mesma sala
        if (await isTimeAvailable(date, currentTime, duration, currentRoom)) {
            return {
                date,
                time: formatTime(currentTime),
                room: currentRoom
            };
        }

        // Se a sala estiver ocupada, tenta em outra sala disponível
        for (const room of availableRooms) {
            if (room !== currentRoom && await isTimeAvailable(date, currentTime, duration, room)) {
                return {
                    date,
                    time: formatTime(currentTime),
                    room
                };
            }
        }

        // Incrementa para o próximo horário disponível
        currentTime.setMinutes(currentTime.getMinutes() + intervalBetweenMeetings);
    }

    // Caso não haja horário disponível no mesmo dia, sugere para o próximo dia útil
    const nextAvailableDate = new Date(date);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);

    return {
        date: nextAvailableDate.toISOString().split('T')[0],
        time: '08:00',
        room: availableRooms[0] // Sugere a primeira sala disponível no próximo dia
    };
}

// Função para verificar se um horário está disponível em uma determinada sala
async function isTimeAvailable(date, time, duration, room) {
    const checkQuery = `
        SELECT * FROM meetings 
        WHERE date = $1 AND room = $2 
        AND (
            ($3::time BETWEEN time AND (time + INTERVAL '1 minute' * duration)) OR 
            (($3::time + INTERVAL '1 minute' * $4) BETWEEN time AND (time + INTERVAL '1 minute' * duration))
        )
    `;
    const checkValues = [date, room, formatTime(time), duration];
    const result = await db.query(checkQuery, checkValues);

    return result.rows.length === 0; // Retorna verdadeiro se o horário estiver disponível
}

// Função para formatar o horário corretamente (hh:mm)
function formatTime(dateObj) {
    return dateObj.toISOString().split('T')[1].slice(0, 5);
}
