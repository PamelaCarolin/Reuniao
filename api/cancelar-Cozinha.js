// Rota para cancelar uma reserva da cozinha
app.delete('/cancelar-Cozinha/:id', async (req, res) => {
    const { id } = req.params; // Obtém o id da reserva a partir dos parâmetros da URL

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

        res.json({ success: true, message: 'Reserva cancelada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao cancelar a reserva.' });
    }
});
