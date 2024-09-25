const pool = require('../db');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUsersByPage = async (req, res) => {
    const { limit = 10, page = 0 } = req.query;

    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);

    if (isNaN(limitNumber) || limitNumber <= 0) {
        return res.status(400).json({ error: "Invalid limit value" });
    }
    if (isNaN(pageNumber) || pageNumber < 0) {
        return res.status(400).json({ error: "Invalid page value" });
    }

    const offset = pageNumber * limitNumber;

    try {
        console.log('Limit:', limitNumber, 'Page:', pageNumber, 'Offset:', offset);
        
        // Truy vấn dữ liệu và sắp xếp theo created_at
        const result = await pool.query(
            'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limitNumber, offset]
        );

        console.log('Users on page', page, result.rows);
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
    const { name, address, phone_number } = req.body; // Lấy các thông tin từ body của request
    console.log(name, address, phone_number);
    
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

        // Cập nhật trường updated_at
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

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
        
        console.log('Update duoc ne!');
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

async function getUserByIdIn(ids) {
    try {
        const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
        const query = `SELECT * FROM users WHERE id IN (${placeholders})`;
        const result = await pool.query(query, ids);

        if (result.rows.length === 0) {
            throw new Error('User not found!');
        }

        return result.rows;
    } catch (error) {
        throw new Error('User not found!');
    }
};

const createAdminAccount = async (req, res) =>{
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO admin (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const loginAdmin = async(req, res) =>{
    const { username, password } = req.body;
    console.log('username:', username);
    console.log('Password:', password);
    if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
    }
    try {
        const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username]);
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
}

const changePwd = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
        // Lấy thông tin người dùng từ database
        const result = await pool.query(
            'SELECT password FROM users WHERE email = $1',
            [email]
        );

        // Kiểm tra nếu người dùng không tồn tại
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);


        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [hashedNewPassword, email]
        );

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};
module.exports = {
    loginAdmin,
    createAdminAccount,
    getUsersByPage,
    getUserByIdIn,
    createUser,
    loginUser,
    updateUser,
    getAllUsers,
    getUserById,
    changePwd
};
