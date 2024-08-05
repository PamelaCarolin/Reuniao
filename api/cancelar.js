const db = require('./database');

module.exports = async (req, res) => {
    const { id } = req.body;

    try {
        const deleteQuery = `DELETE FROM meetings WHERE id = $1`;
        await db.query(deleteQuery, [id]);

        res.json({ success: true, message: 'Reunião cancelada com sucesso!' });
    } catch (err) {
        console.error('Erro ao cancelar reunião:', err);
        res.status(500).json({ error: 'Erro ao cancelar reunião' });
    }
};
