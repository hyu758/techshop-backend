const pool = require('../db');
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const createUser = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log('Email:', email);
    console.log('Password:', password);
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log(result)
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params; // Lấy id từ URL
    const { name, email, address, phone_number } = req.body; // Lấy các thông tin từ body của request

    try {
        // Tạo câu lệnh SQL cập nhật động để chỉ cập nhật các trường không null
        const updateFields = [];
        const updateValues = [];
        let index = 1;

        if (name) {
            updateFields.push(`name = $${index}`);
            updateValues.push(name);
            index++;
        }

        if (email) {
            updateFields.push(`email = $${index}`);
            updateValues.push(email);
            index++;
        }

        if (address) {
            updateFields.push(`address = $${index}`);
            updateValues.push(address);
            index++;
        }

        if (phone_number) {
            updateFields.push(`phone_number = $${index}`);
            updateValues.push(phone_number);
            index++;
        }

        // Thêm id vào cuối của mảng updateValues
        updateValues.push(id);

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${index}
            RETURNING *;
        `;

        const result = await pool.query(query, updateValues);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT id, name, email, address, phone_number FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createUser,
    loginUser,
    updateUser,
    getUsers,
    getUserById
};
