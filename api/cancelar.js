
const sqlite3 = require('sqlite3').verbose();
const db = require('./database');

module.exports = (req, res) => {
    const { id } = req.body;
    const query = `DELETE FROM meetings WHERE id = ?`;
    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Reunião cancelada com sucesso!' });
    });
};
