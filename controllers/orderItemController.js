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
            RETURNING *`,
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

const getOrderItemByUserAndStatus = async(req, res) => {
    const {userId, status} = req.params;

    try{
        const result = await pool.query(
            `SELECT * 
            FROM orders INNER JOIN orderitems ON orders.id = orderitems.order_id
            WHERE id = $1 AND status = $2`, 
            [userId, status]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Order not found' + userId + ' ' + status});
        }

        res.status(200).json(result.rows);
    }
    catch(error){
        console.error('Error creating order:', error);
        res.status(400);
    }
}

module.exports = {
    orderItemUseCase,
    getOrderItemByUserAndStatus
};