
const sqlite3 = require('sqlite3').verbose();
const db = require('./database');

module.exports = (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;
    const query = `
        SELECT * FROM meetings 
        WHERE date = ? AND room = ? AND 
        (
            (? BETWEEN time AND time + duration) OR 
            (? + ?) BETWEEN time AND time + duration
        )
    `;
    db.all(query, [date, room, time, time, duration], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Horário de reunião conflita com uma existente.' });
        }

        const insert = `INSERT INTO meetings (date, time, duration, sector, speaker, room, client) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.run(insert, [date, time, duration, sector, speaker, room, client], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: 'Reunião agendada com sucesso!' });
        });
    });
};
