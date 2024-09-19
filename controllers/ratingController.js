const pool = require('../db');
const orderItemsController = require('./orderItemController')

const rateProduct = async (req, res) => {
    const { productId, rating, orderId } = req.body;
    console.log('rateProduct', productId, rating, orderId)
    if (!productId || !rating || !orderId) {
        return res.status(400).json({ message: 'Missing required fields: productId, rating, or orderId' });
    }

    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    try {
        // Lấy thông tin sản phẩm hiện tại
        const productResult = await pool.query(
            `SELECT rating, rating_count 
            FROM products 
            WHERE id = $1`,
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let product = productResult.rows[0];
        let oldRating = product.rating || 0;
        let ratingCount = product.rating_count || 0;

        // Tính toán rating mới
        let newRatingCount = ratingCount + 1;
        let totalOldRating = parseInt(oldRating) * parseInt(ratingCount);
        let totalNewRating = totalOldRating + parseInt(rating);
        let newRating = totalNewRating / newRatingCount;

        console.log(oldRating + " " + ratingCount + " " + newRatingCount + " " + newRating + " " + rating);
        // Cập nhật sản phẩm với rating mới và rating_count mới
        const updateResult = await pool.query(
            `UPDATE products
            SET rating = $1, rating_count = $2
            WHERE id = $3
            RETURNING *`,
            [newRating, newRatingCount, productId]
        );

        try {
            await orderItemsController.updateRatingOrderItems(orderId, productId, rating); // Thêm orderId vào khi cập nhật
        } catch (updateError) {
            console.error('Error updating order items:', updateError);
            return res.status(500).json({ message: 'Failed to update order items' });
        }

        res.status(200).json({ message: 'Product updated successfully', product: updateResult.rows[0] });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {rateProduct}