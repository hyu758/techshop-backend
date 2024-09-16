const pool = require('../db');

const addToCart = async (req, res) => {
    const { userId, productId, quantity = 1 } = req.body;

    try {
        console.log('ALO ADD TO CART NE!')
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
        res.status(400).json({ error: 'BAD REQUEST' });
    }
}

const updateCart = async (req, res) => {
    const { userId } = req.params
    const { productId, quantity } = req.body;
    console.log('update cart', userId, productId, quantity);
    try {
        await pool.query(
            `UPDATE cart
             SET quantity = $3
             WHERE user_id = $1 AND product_id = $2`,
            [userId, productId, quantity]
        );

        res.status(200).json('Cart updated successfully');
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(400).json({ message: 'BAD_REQUEST' });
    }
}

const deleteFromCart = async (req, res) => {
    const { userId } = req.params;
    const { productId } = req.body;
    console.log('delete cart', userId, productId);
    try {
        await pool.query(
            `delete from cart
            where user_id = $1 and product_id = $2`,
            [userId, productId]
        );
        res.status(200).json('Cart delete successfully');
    }
    catch (error) {
        console.log('Error delete from cart', error);
        res.status(400).json({ message: 'BAD REQUEST' });
    }
}

const deleteAllCart = async (req, res) => {
    try {
        const {userId} = req.params
        console.log('DELETE ALL CART', userId)
        await pool.query(
            `delete from cart
            where user_id = $1`,
            [userId]
        );
        res.status(200).json('Cart delete successfully');
    }
    catch (error) {
        console.log('Error delete from cart', error);
        res.status(400).json({ message: 'BAD REQUEST' });
    }
}
module.exports = { addToCart, getCart, updateCart, deleteFromCart, deleteAllCart}