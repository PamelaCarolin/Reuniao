const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

app.use(express.json());

// Configurar a conexão com o banco de dados PostgreSQL
const pool = new Pool({
    connectionString: 'postgres://default:8DOfXcRSwg1h@ep-sweet-night-a4g91n22.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require'
});

pool.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.stack);
    } else {
        console.log('Conectado ao banco de dados PostgreSQL.');
    }
});

// Criação da tabela de reuniões, se não existir
pool.query(`CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    date TEXT,
    time TEXT,
    duration INTEGER,
    sector TEXT,
    speaker TEXT,
    room TEXT,
    client TEXT
)`, (err) => {
    if (err) {
        console.error('Erro ao criar tabela:', err);
    }
});

// Rota para agendar reuniões
app.post('/api/agendar', (req, res) => {
    const { date, time, duration, sector, speaker, room, client } = req.body;
    const query = 'INSERT INTO meetings (date, time, duration, sector, speaker, room, client) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    pool.query(query, [date, time, duration, sector, speaker, room, client], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Reunião agendada com sucesso!' });
    });
});

// Rota para consultar reuniões
app.get('/api/consultar', (req, res) => {
    const { date, client, room, sector } = req.query;
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const queryParams = [];

    if (date) {
        query += ' AND date = $1';
        queryParams.push(date);
    }
    if (client) {
        query += ' AND client LIKE $2';
        queryParams.push(`%${client}%`);
    }
    if (room) {
        query += ' AND room = $3';
        queryParams.push(room);
    }
    if (sector) {
        query += ' AND sector LIKE $4';
        queryParams.push(`%${sector}%`);
    }

    pool.query(query, queryParams, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result.rows);
    });
});

// Rota para cancelar reuniões
app.post('/api/cancelar', (req, res) => {
    const { id } = req.body;
    const query = 'DELETE FROM meetings WHERE id = $1';
    pool.query(query, [id], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Reunião cancelada com sucesso!' });
    });
});

// Rota para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para capturar todas as outras requisições e servir o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
