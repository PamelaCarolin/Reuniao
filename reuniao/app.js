const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());

// Caminho para o banco de dados SQLite
const dbPath = path.join(__dirname, 'meetings.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criação da tabela de reuniões
db.run(`CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    time TEXT,
    duration INTEGER,
    sector TEXT,
    speaker TEXT,
    room TEXT,
    client TEXT
)`);

// Rota para agendar reuniões
app.post('/agendar', (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;
    const query = `INSERT INTO meetings (date, time, duration, sector, speaker, room, client) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [date, time, duration, sector, speaker, room, client], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Reunião agendada com sucesso!' });
    });
});

// Rota para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
