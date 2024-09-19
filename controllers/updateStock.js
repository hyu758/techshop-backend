const pool = require('../db');
const orderItemsController = require('./orderItemController')

async function updateProductStock(id) {
    try {
        let productIds = orderItemsController.getOrderItemsByOrderId(id)
        const updateStockPromises = productIds.map((productId, index) => {
            return pool.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1, sold_quantity = sold_quantity + $1 WHERE id = $2',
                [quantities[index], productId]
            );
        });

        await Promise.all(updateStockPromises);

        if (result.rows.length === 0) {
            throw new Error('Order not found');
        }

        return result.rows;
    } catch (error) {
        throw error;
    }
};

module.exports = {updateProductStock}