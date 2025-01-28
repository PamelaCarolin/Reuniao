const db = require('./database');

module.exports = async (req, res) => {
    const { id, newDate, newTime, newDuration, newRoom } = req.body;

    try {
        // Verificar se a reunião existe
        const { rows } = await db.query('SELECT * FROM meetings WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Reunião não encontrada.' });
        }

        const meeting = rows[0];

        // Mantém os valores originais caso os novos valores não sejam enviados
        const updatedDate = newDate || meeting.date;
        const updatedTime = newTime || meeting.time;
        const updatedDuration = newDuration || meeting.duration;
        const updatedRoom = newRoom || meeting.room;

        // Verificar conflitos de horário apenas se a nova data e horário forem fornecidos
        if (newDate || newTime || newRoom) {
            const conflictQuery = `
                SELECT * FROM meetings 
                WHERE date = $1 AND room = $2 
                AND (
                    ($3::time BETWEEN time AND time + interval '1 minute' * duration) OR 
                    ($3::time + interval '1 minute' * $4 BETWEEN time AND time + interval '1 minute' * duration)
                )
                AND id != $5
            `;
            const conflictValues = [updatedDate, updatedRoom, updatedTime, updatedDuration, id];
            const conflictCheck = await db.query(conflictQuery, conflictValues);

            if (conflictCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Conflito detectado com outra reunião agendada no mesmo horário e sala.'
                });
            }
        }

        // Construir a query dinâmica para atualização somente dos campos fornecidos
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (newDate) {
            updateFields.push(`date = $${paramIndex++}`);
            updateValues.push(newDate);
        }
        if (newTime) {
            updateFields.push(`time = $${paramIndex++}`);
            updateValues.push(newTime);
        }
        if (newDuration) {
            updateFields.push(`duration = $${paramIndex++}`);
            updateValues.push(newDuration);
        }
        if (newRoom) {
            updateFields.push(`room = $${paramIndex++}`);
            updateValues.push(newRoom);
        }

        // Se nenhum campo for fornecido além do ID, não faça nenhuma atualização
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualização foi fornecido.' });
        }

        updateValues.push(id);
        const updateQuery = `UPDATE meetings SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
        
        await db.query(updateQuery, updateValues);

        res.json({ success: true, message: 'Reunião reagendada com sucesso!' });
    } catch (err) {
        console.error('Erro ao reagendar reunião:', err);
        res.status(500).json({ error: 'Erro ao reagendar reunião.' });
    }
};
