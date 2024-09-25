const pool = require('../db');

const addCategory = async (req, res) => {
    const { categoryName, categoryDesc } = req.body;

    try {
        console.log('ADD NEW CATEGORY', categoryName)
        await pool.query(
            `INSERT INTO categories (name, description) 
            VALUES ($1, $2);
            `,
            [categoryName, categoryDesc]
        );

        res.status(200).json('OK');
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(400).json({ message: 'BAD_REQUEST' + categoryName + " " + categoryDesc + " " });
    }
};

module.exports = {addCategory}