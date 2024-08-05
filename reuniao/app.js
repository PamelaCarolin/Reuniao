const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3001;

// Função para garantir que o diretório do banco de dados exista
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

// Caminho para o banco de dados da Papelaria
const dbPath = path.join(__dirname, 'Papelaria-master', 'Database', 'papelaria.sqlite');
ensureDirectoryExistence(dbPath);
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

// Caminho para o banco de dados de mensagens
const messagesDbPath = path.join(__dirname, 'messages.sqlite');
ensureDirectoryExistence(messagesDbPath);
const messagesDb = new sqlite3.Database(messagesDbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados de mensagens:', err.message);
    } else {
        console.log('Conectado ao banco de dados de mensagens SQLite.');
    }
});

// Middleware para analisar JSON
app.use(express.json());
app.use(morgan('combined', { stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' }) }));

// Servir arquivos estáticos
app.use('/logar', express.static(path.join(__dirname, 'Logar')));
app.use('/registro', express.static(path.join(__dirname, 'Registro')));
app.use('/forgot_password', express.static(path.join(__dirname, 'Forgot_Password')));
app.use('/pagina1', express.static(path.join(__dirname, 'pagina1')));
app.use('/reuniao', express.static(path.join(__dirname, 'reuniao')));
app.use('/feliz1', express.static(path.join(__dirname, 'feliz1')));
app.use('/papelaria', express.static(path.join(__dirname, 'Papelaria-master')));

// Verificar logs de solicitações
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

// Rotas
const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const forgotPasswordRoute = require('./routes/forgotPassword');

app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/forgot-password', forgotPasswordRoute);

// Função para gerar uma nova senha temporária
function generateTemporaryPassword(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Rota para "Forgot Password" POST
app.post('/forgot-password', (req, res) => {
    const { username, departmentCode } = req.body;
    let users = readUsersFromFile();
    const user = users.find(user => user.username === username && user.departmentCode === departmentCode);

    if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid username or department code.' });
    }

    const newPassword = generateTemporaryPassword();
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Atualizar a senha no banco de dados e definir a flag temporaryPassword como true
    user.password = hashedPassword;
    user.temporaryPassword = true;
    writeUsersToFile(users);

    // Enviar a nova senha temporária ao usuário
    res.json({ success: true, password: newPassword });
});

// Rota para login POST
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    let users = readUsersFromFile();
    const user = users.find(user => user.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ success: false, message: 'Invalid username or password.' });
    }

    if (user.temporaryPassword) {
        return res.json({ success: true, message: 'Temporary password used, please reset your password.', temporaryPassword: true });
    }

    res.json({ success: true, message: 'Login successful!', user });
});

// Rota para adicionar pedido
app.post('/api/addOrder', (req, res) => {
    const { userId, productId, observacao, quantidade } = req.body;
    const status = 'Pendente';
    const query = `INSERT INTO orders (userId, productId, status, observacao, quantidade) VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [userId, productId, status, observacao, quantidade], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Pedido adicionado com sucesso!' });
    });
});

// Rota para atualizar pedido
app.post('/api/updateOrder', (req, res) => {
    const { produtoNome, novoStatus } = req.body;
    const query = `UPDATE orders SET status = ? WHERE productId = (SELECT id FROM products WHERE name = ?)`;

    db.run(query, [novoStatus, produtoNome], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'Status do pedido atualizado com sucesso!' });
    });
});

// Rota para registro POST
app.post('/register', (req, res) => {
    const { email, username, password, departmentCode } = req.body;
    let users = readUsersFromFile();
    const userExists = users.some(user => user.email === email || user.username === username);

    if (userExists) {
        return res.status(400).json({ success: false, message: 'User with this email or username already exists.' });
    }

    if (!email || !username || !password || !departmentCode) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    let role = 'user';
    switch (departmentCode) {
        case '7K0D':
            role = 'dp';
            break;
        case 'RH00':
            role = 'rh';
            break;
        case 'TI01':
            role = 'ti';
            break;
        case 'FN02':
            role = 'financeiro';
            break;
        case 'LG03':
            role = 'legalizacao';
            break;
        case 'RL04':
            role = 'relacionamento';
            break;
        case 'CM05':
            role = 'comercial';
            break;
        case 'FC06':
            role = 'fiscal';
            break;
        case 'GEST':
            role = 'manager';
            break;
        case 'DIR':
            role = 'director';
            break;
        default:
            return res.status(400).json({ success: false, message: 'Invalid department code.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    users.push({ email, username, password: hashedPassword, role, departmentCode, temporaryPassword: false });
    writeUsersToFile(users);

    console.log(`Registered new user: Email: ${email}, Username: ${username}, Role: ${role}`);
    res.json({ success: true, message: 'Registration successful!' });
});

// Rota para redefinir a senha POST
app.post('/reset-password', (req, res) => {
    const { username, newPassword } = req.body;
    let users = readUsersFromFile();
    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(400).json({ success: false, message: 'User not found.' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    user.temporaryPassword = false;
    writeUsersToFile(users);

    res.json({ success: true, message: 'Password reset successful!' });
});

// Rota para agendar POST
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

// Rota para cancelar POST
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

// Rota para consultar GET
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

// Rota para buscar produtos por categoria
app.get('/api/products', (req, res) => {
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
});

// WebSockets para chat ao vivo
io.on('connection', (socket) => {
    console.log('Novo cliente conectado');

    // Envia mensagens existentes para o novo cliente
    messagesDb.all('SELECT * FROM messages ORDER BY timestamp ASC', (err, rows) => {
        if (err) {
            console.error('Erro ao recuperar mensagens:', err);
        } else {
            socket.emit('previous messages', rows);
        }
    });

    socket.on('chat message', (msg) => {
        const { name, photo, text } = msg;
        const query = `INSERT INTO messages (name, photo, text) VALUES (?, ?, ?)`;
        messagesDb.run(query, [name, photo, text], function(err) {
            if (err) {
                console.error('Erro ao inserir mensagem:', err);
            } else {
                io.emit('chat message', msg); // Envia a mensagem para todos os clientes conectados
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar o servidor
server.listen(port, () => {
    console.log(`Servidor rodando em http://0.0.0.0:${port}`);
});

// Funções auxiliares para ler e escrever usuários
function readUsersFromFile() {
    const usersFilePath = path.join(__dirname, 'users.json');
    try {
        const usersData = fs.readFileSync(usersFilePath);
        return JSON.parse(usersData);
    } catch (error) {
        console.error('Erro ao ler o arquivo de usuários:', error);
        return [];
    }
}

function writeUsersToFile(users) {
    const usersFilePath = path.join(__dirname, 'users.json');
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Erro ao escrever no arquivo de usuários:', error);
    }
}
