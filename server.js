const express = require('express');
const routes = require('./routes/Routes');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./configs/cloudinary');
const pool = require('./db');

// Cấu hình CloudinaryStorage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads',
        allowedFormats: ['jpg', 'png', 'jpeg'],
        transformation: [{width: 500, height: 500, crop: 'fill'}]
    },
});

const upload = multer({ storage: storage });
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json());
app.use('/api', routes);

app.post('/uploadImage', upload.fields([{name: "img", maxCount: 1}]), async (req, res) => {
    try {
        const user_id = req.body.user_id;  // Lấy ID của user từ request body
        console.log(user_id)
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        if (!req.files || !req.files['img'] || req.files['img'].length === 0) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const img_link = req.files['img'][0].path;  // Lấy đường dẫn ảnh từ Cloudinary
        console.log(`User ID: ${user_id}`);
        console.log(`Image Link: ${img_link}`);

        // Cập nhật đường dẫn ảnh vào bảng Users
        const query = 'UPDATE Users SET avatar_url = $1 WHERE id = $2';
        const result = await pool.query(query, [img_link, user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'Avatar updated successfully', img_link });
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ success: false, message: 'Something went wrong', error });
    }
});

async function updatePendingOrders() {
    try {
        await pool.query(
            `UPDATE orders
             SET status = 'cancelled'
             WHERE status = 'pending'
             AND created_at <= NOW() - INTERVAL '15 minutes';`
        );
        console.log('Pending orders updated to canceled');
    } catch (error) {
        console.error('Error updating pending orders:', error);
    }
}

updatePendingOrders()


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

