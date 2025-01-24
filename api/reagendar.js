const db = require('./database');

module.exports = async (req, res) => {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { id, newDate } = req.body;
    const clientDB = await db.connect();

    try {
        await clientDB.query('BEGIN');

        // Extrair a data e hora da string recebida
        const [date, time] = newDate.split(' ');

        // Verificar se o horário é válido
        if (!isValidTime(time)) {
            return res.status(400).json({ error: 'Horário inválido.' });
        }

        // Verificar conflito de horários
        const conflictQuery = `
            SELECT * FROM meetings 
            WHERE date = $1 
              AND time = $2 
              AND id <> $3
        `;
        const { rows } = await clientDB.query(conflictQuery, [date, time, id]);

        if (rows.length > 0) {
            // Sugestão de um novo horário
            const suggestedTime = await suggestNewTime(date, time, clientDB);
            return res.status(400).json({
                error: 'Horário já ocupado.',
                suggestedTime: suggestedTime,
            });
        }

        // Atualizar a reunião
        const updateQuery = `
            UPDATE meetings 
            SET date = $1, time = $2 
            WHERE id = $3
        `;
        await clientDB.query(updateQuery, [date, time, id]);

        // Registrar histórico da alteração
        const historyQuery = `
            INSERT INTO historico_reunioes (date, time, client, status) 
            SELECT date, time, client, 'reagendada' FROM meetings WHERE id = $1
        `;
        await clientDB.query(historyQuery, [id]);

        await clientDB.query('COMMIT');
        res.json({ success: true, message: 'Reunião reagendada com sucesso!' });
    } catch (error) {
        await clientDB.query('ROLLBACK');
        console.error('Erro ao reagendar reunião:', error);
        res.status(500).json({ error: 'Erro ao reagendar reunião' });
    } finally {
        clientDB.release();
    }
};

/**
 * Verifica se o horário fornecido é válido no formato HH:MM
 */
function isValidTime(time) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
}

/**
 * Sugere um novo horário baseado na disponibilidade
 */
async function suggestNewTime(date, time, clientDB) {
    const query = `
        SELECT time FROM meetings 
        WHERE date = $1 
        ORDER BY time ASC
    `;
    const { rows } = await clientDB.query(query, [date]);

    let newSuggestedTime = addMinutes(time, 30); // Tenta sugerir 30 minutos após o horário desejado
    let isAvailable = false;

    while (!isAvailable) {
        if (!rows.some(row => row.time === newSuggestedTime)) {
            isAvailable = true;
            break;
        }
        newSuggestedTime = addMinutes(newSuggestedTime, 30);
    }

    return newSuggestedTime;
}

/**
 * Adiciona minutos a um horário no formato HH:MM
 */
function addMinutes(time, minutes) {
    const [hour, minute] = time.split(':').map(Number);
    const newDate = new Date(0, 0, 0, hour, minute + minutes);
    return `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`;
}
