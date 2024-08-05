
const sqlite3 = require('sqlite3').verbose();
const db = require('./database');

module.exports = (req, res) => {
    const { date, client, room, sector } = req.query;
    let query = "SELECT id, date, time, duration, sector, speaker, room, client FROM meetings WHERE 1=1";
    let queryParams = [];

    if (date) {
        query += " AND date = ?";
        queryParams.push(date);
    }

    if (client) {
        query += " AND client LIKE ?";
        queryParams.push(`%${client}%`);
    }

    if (room) {
        query += " AND room = ?";
        queryParams.push(room);
    }

    if (sector) {
        query += " AND sector LIKE ?";
        queryParams.push(`%${sector}%`);
    }

    db.all(query, queryParams, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};
