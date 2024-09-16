const pool = require('../db');
const productController = require("./productController")

const addToCart = async (req, res) => {
    const { userId, productId, quantity = 1 } = req.body;

    try {
        await pool.query(
            `INSERT INTO cart (user_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id) 
            DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
            `,
            [userId, productId, quantity]
        );

        res.status(200).json('OK');
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ message: 'BAD_REQUEST' + userId + " " + productId + " " + quantity });
    }
};


const getCart = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT * 
            FROM cart INNER JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = $1`,
            [userId]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Cart not found ' + userId });
        }

        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({error: 'BAD REQUEST'});
    }
}

module.exports = { addToCart, getCart }