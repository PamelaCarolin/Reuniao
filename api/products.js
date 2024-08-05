const db = require('./database');

module.exports = async (req, res) => {
    const { category } = req.query;
    let query = "SELECT name, category FROM products";
    const queryParams = [];

    if (category && category !== 'Todos') {
        query += " WHERE category = $1";
        queryParams.push(category);
    }

    try {
        const { rows } = await db.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
};
