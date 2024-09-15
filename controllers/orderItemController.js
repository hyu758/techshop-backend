const pool = require('../db');
const getProductById = require("./productController")

const orderItemUseCase = async(req, res) => {
    const { userId, productId, quantity} = req.body;
    
    try {
        let product = getProductById(productId);
        let price = product.price * quantity * (1-product.discount);
        await pool.query('BEGIN')
        const newOrder = await pool.query(
            `INSERT INTO orders (user_id, status) 
            VALUES ($1, $2) 
            RETURNING * `,
            [productId, userId, orderStatus.PENDING.toString()]
        );

        const newOrderItem = await pool.query(
            `INSERT INTO orderitems (order_id, product_id, quantity, price) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [newOrder.rows[0], productId, quantity, price]
        );

        await pool.query('COMMIT')

        res.status(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(400);
    }
};

module.exports = {
    orderItemUseCase
};