const db = require('./database');

module.exports = async (req, res) => {
    const { id } = req.query; // ID da reserva a ser cancelada

    try {
        // Verifica se a reserva existe
        const checkQuery = `SELECT * FROM kitchen_reservations WHERE id = $1`;
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
        }

        // Exclui a reserva
        const deleteQuery = `DELETE FROM kitchen_reservations WHERE id = $1`;
        await db.query(deleteQuery, [id]);

        res.status(200).json({ success: true, message: 'Reserva cancelada com sucesso!' });
    } catch (error) {
        console.error("Erro ao cancelar a reserva da cozinha:", error);
        res.status(500).json({ success: false, message: 'Erro ao cancelar a reserva.', error: error.message });
    }
};
