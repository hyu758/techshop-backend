const express = require('express');
const routes = require('./routes/Routes');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./configs/cloudinary');

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
        const img_link = req.files['img'][0].path;  // Lấy đường dẫn ảnh từ Cloudinary
        
        // Cập nhật đường dẫn ảnh vào bảng Users
        const query = 'UPDATE Users SET avatar_url = $1 WHERE id = $2';
        await db.query(query, [img_link, user_id]);

        res.status(200).json({ success: true, message: 'Avatar updated successfully', img_link });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Something went wrong', error });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

