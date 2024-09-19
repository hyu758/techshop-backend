const pool = require('../db');

async function updateProductStock(orderId) {
    try {
        // Truy vấn để lấy productId và quantity từ orderId
        const result = await pool.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
            [orderId]
        );

        // Kiểm tra xem đơn hàng có sản phẩm nào không
        if (result.rows.length === 0) {
            throw new Error('Order not found or no products in order');
        }

        const productDetails = result.rows;

        // Tạo các promises để cập nhật stock và sold_quantity cho mỗi sản phẩm
        const updateStockPromises = productDetails.map(({ product_id, quantity }) => {
            return pool.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1, sold_quantity = sold_quantity + $1 WHERE id = $2',
                [quantity, product_id]
            );
        });

        // Đợi tất cả các cập nhật hoàn thành
        await Promise.all(updateStockPromises);

        return { message: 'Stock and sold quantity updated successfully' };
    } catch (error) {
        console.error('Error updating product stock:', error);
        throw error;
    }
}

module.exports = {updateProductStock}