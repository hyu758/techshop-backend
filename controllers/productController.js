const pool = require('../db');

const getAllProducts = async(req, res) => {
    console.log('Alo')
    try{
        const result = await pool.query("Select * from products");
        res.status(200).json(result.rows);
    }
    catch(error) {
        res.status(500).json({error : error.message});
    }
};


const getProductDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProduct = async (req, res) => {
    const { name, description, price, stock_quantity, category_id, image_url, brand, sold_quantity = 0, rating = 0, rating_count = 0, discount = 0 } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, brand, sold_quantity, rating, rating_count, discount) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [name, description, price, stock_quantity, category_id, image_url, brand, sold_quantity, rating, rating_count, discount]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
};


// Hàm cập nhật sản phẩm
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category_id, brand, image_url, sold_quantity, rating, rating_count, discount } = req.body;

    try {

        if (!name || !description || !price || !stock_quantity || !category_id || !brand || !image_url) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        const result = await pool.query(
            `UPDATE Products
            SET name = $1, description = $2, price = $3, stock_quantity = $4, category_id = $5, brand = $6, image_url = $7,
                sold_quantity = $8, rating = $9, rating_count = $10, discount = $11
            WHERE id = $12 RETURNING *`,
            [name, description, price, stock_quantity, category_id, brand, image_url, sold_quantity, rating, rating_count, discount, id]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ message: 'Product updated successfully', product: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {
    getAllProducts,
    getProductDetails,
    createProduct,
    updateProduct,
};