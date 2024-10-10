const db = require('./database');
const ics = require('ics'); // Usado para gerar arquivos .ics

module.exports = async (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;

    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

        // Verificar se há conflito de horário para a sala selecionada
        const conflictQuery = `
            SELECT *, (time + INTERVAL '1 minute' * duration) AS end_time 
            FROM meetings 
            WHERE date = $1 AND room = $2 AND 
            (
                ($3::time BETWEEN time AND time + interval '1 minute' * duration) OR 
                ($3::time + interval '1 minute' * $4 BETWEEN time AND time + interval '1 minute' * duration)
            )
        `;
        const conflictValues = [date, room, time, duration];
        const { rows } = await clientDB.query(conflictQuery, conflictValues);

        // Se houver conflito, retornamos os dados da reunião conflitante
        if (rows.length > 0) {
            const conflictingMeeting = rows[0];
            await clientDB.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                conflict: {
                    date: conflictingMeeting.date,
                    time: conflictingMeeting.time,
                    duration: conflictingMeeting.duration, // Retornar duração
                    speaker: conflictingMeeting.speaker,
                    room: conflictingMeeting.room,
                    client: conflictingMeeting.client
                },
                message: 'Horário de reunião conflita com uma existente.'
            });
        }

        // Inserir a nova reunião se não houver conflito
        const insertQuery = `
            INSERT INTO meetings (date, time, duration, sector, speaker, room, client) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const insertValues = [date, time, duration, sector, speaker, room, client];
        await clientDB.query(insertQuery, insertValues);

        await clientDB.query('COMMIT');

        // Gerar arquivo .ics para envio por email
        const startDate = new Date(`${date}T${time}`);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        const icsEvent = {
            start: [
                startDate.getFullYear(),
                startDate.getMonth() + 1,
                startDate.getDate(),
                startDate.getHours(),
                startDate.getMinutes()
            ],
            end: [
                endDate.getFullYear(),
                endDate.getMonth() + 1,
                endDate.getDate(),
                endDate.getHours(),
                endDate.getMinutes()
            ],
            title: `Reunião com ${client}`,
            description: `Reunião organizada por ${speaker}`,
            location: room,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            attendees: [{ name: client }]
        };

        // Gerar o arquivo ICS usando a biblioteca 'ics'
        ics.createEvent(icsEvent, (error, value) => {
            if (error) {
                console.error('Erro ao gerar o arquivo .ics:', error);
                return res.status(500).json({ success: false, message: 'Erro ao gerar o arquivo de calendário.' });
            }

            // Retornar o evento ICS como resposta
            res.json({ success: true, message: 'Reunião agendada com sucesso!', ics: value });
        });

    } catch (err) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao agendar reunião:', err);
        res.status(500).json({ error: 'Erro ao agendar reunião' });
    } finally {
        clientDB.release();
    }
};
