const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Caminho para o banco de dados
const dbPath = path.join(__dirname, 'meetings.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            time TEXT,
            duration INTEGER,
            sector TEXT,
            speaker TEXT,
            room TEXT,
            client TEXT
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar a tabela meetings:', err.message);
            } else {
                console.log('Tabela meetings criada ou já existe.');
            }
        });
    }
});

// Middleware para analisar JSON
app.use(express.json());

// Rota para agendar reunião
app.post('/agendar', (req, res) => {
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
});

// Rota para cancelar reunião
app.post('/cancelar', (req, res) => {
    const { id } = req.body;
    const query = `DELETE FROM meetings WHERE id = ?`;
    db.run(query, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Reunião cancelada com sucesso!' });
    });
});

// Rota para consultar reuniões
app.get('/consultar', (req, res) => {
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
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
