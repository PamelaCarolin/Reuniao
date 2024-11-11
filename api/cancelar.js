const db = require('./database');

module.exports = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: "ID da reunião não fornecido" });
    }

    try {
        // Verifique se a reunião existe antes de tentar deletar
        const existsQuery = `SELECT * FROM meetings WHERE id = $1`;
        const result = await db.query(existsQuery, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Reunião não encontrada" });
        }

        // Movendo reunião para o histórico em vez de excluir (opcional)
        const moveToHistoryQuery = `INSERT INTO meetings_history SELECT * FROM meetings WHERE id = $1`;
        await db.query(moveToHistoryQuery, [id]);

        // Excluindo a reunião da tabela principal
        const deleteQuery = `DELETE FROM meetings WHERE id = $1`;
        await db.query(deleteQuery, [id]);

        res.json({ success: true, message: 'Reunião cancelada e movida para o histórico com sucesso!' });
    } catch (err) {
        console.error('Erro ao cancelar reunião:', err);
        res.status(500).json({ error: 'Erro ao cancelar reunião' });
    }
};
