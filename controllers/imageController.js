const pool = require('../db');

const uploadImage = async (req, res) => {
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
};

const uploadProductImage = async (req, res) => {
    try {
        if (!req.files || !req.files['img'] || req.files['img'].length === 0) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const img_link = req.files['img'][0].path;  // Lấy đường dẫn ảnh từ Cloudinary
        console.log(`Image Link: ${img_link}`);

        // Trả về đường dẫn ảnh mà không cập nhật cơ sở dữ liệu
        res.status(200).json({ success: true, img_link });
    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({ success: false, message: 'Something went wrong', error });
    }
};



module.exports = {uploadImage, uploadProductImage}