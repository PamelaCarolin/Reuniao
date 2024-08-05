
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../meetings.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

db.serialize(() => {
    // Criação da tabela meetings, se não existir
    db.run(`CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        speaker TEXT NOT NULL,
        sector TEXT NOT NULL,
        room TEXT NOT NULL,
        client TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar tabela:', err);
        }
    });

    // Adicionar coluna 'speaker' se ela não existir
    db.run(`ALTER TABLE meetings ADD COLUMN speaker TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Erro ao adicionar coluna "speaker":', err);
        }
    });

    // Adicionar coluna 'duration' se ela não existir
    db.run(`ALTER TABLE meetings ADD COLUMN duration INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Erro ao adicionar coluna "duration":', err);
        }
    });

    // Adicionar coluna 'sector' se ela não existir
    db.run(`ALTER TABLE meetings ADD COLUMN sector TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Erro ao adicionar coluna "sector":', err);
        }
    });

    // Adicionar coluna 'room' se ela não existir
    db.run(`ALTER TABLE meetings ADD COLUMN room TEXT`, (err) => {
        if (err && !err.message.includes
