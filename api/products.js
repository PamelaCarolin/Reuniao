const sqlite3 = require('sqlite3').verbose();
const db = require('./database');

module.exports = (req, res) => {
    const { category } = req.query;
    let query = "SELECT name, category FROM products";
    const queryParams = [];

    if (category && category !== 'Todos') {
        query += " WHERE category = ?";
        queryParams.push(category);
    }

    db.all(query, queryParams, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

