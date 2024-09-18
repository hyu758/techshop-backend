const pool = require('../db');
async function updateOrderStatus(orderId, status) {
    try {
        console.log('UPDATE ORDER STATUS FOR ', orderId, status)
        const result = await pool.query(
            `UPDATE orders 
            SET status = $2 
            WHERE id = $1 
            RETURNING *`,
            [orderId, status]);

        if (result.rows.length === 0) {
            throw new Error('Order not found');
        }

        return result.rows;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    updateOrderStatus
};